<?php

namespace App\Http\Controllers\Api;

use App\Events\PanicButtonTriggered;
use App\Events\SireneStatusChanged;
use App\Http\Controllers\Controller;
use App\Models\IotDevice;
use App\Models\IotEmergencyLog;
use App\Models\PosyanduRecord;
use App\Models\RondaLog;
use App\Models\RondaSchedule;
use App\Models\SirenStatus;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Models\WasteBankTransaction;
use App\Models\WasteRate;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class IoTController extends Controller
{
    /**
     * Node 1: RFID Tap for Ronda Attendance & Servo Gate Open
     * POST /api/iot/ronda/tap
     * Payload: {"rfid_uid": "STRING", "post_id": "POS_01"}
     */
    public function rondaTap(Request $request)
    {
        $validated = $request->validate([
            'rfid_uid' => 'required|string',
            'post_id' => 'nullable|string',
        ]);

        $postId = $validated['post_id'] ?? 'POS_01';
        $rfidUid = trim($validated['rfid_uid']);

        $gateDevice = IotDevice::where('device_type', 'gate')->first();
        $userAgent = (string) $request->header('User-Agent', '');
        $isHardware = (str_contains($userAgent, 'ESP32') || str_contains($userAgent, 'ESP8266')) && ! str_contains($userAgent, 'Mozilla');
        $isGateOnline = $gateDevice && $gateDevice->last_ping && abs($gateDevice->last_ping->diffInSeconds(now(), false)) <= 15;

        // Jika request BUKAN dari ESP32 fisik (misal dari web browser) dan hardware sedang offline
        if (! $isHardware && ! $isGateOnline) {
            return response()->json([
                'success' => false,
                'gate_open' => false,
                'servo_angle' => 0,
                'message' => 'Gagal: Node 1 (Pos Gerbang) sedang OFFLINE. Palang servo fisik tidak dapat digerakkan.',
                'lcd_line1' => 'GATE OFFLINE!   ',
                'lcd_line2' => 'PERIKSA PERANGKAT',
                'is_online' => false,
            ], 422);
        }

        // 1. Find user by RFID UID
        $user = User::with('house')->where('rfid_uid', $rfidUid)->first();

        if (!$user) {
            // Simpan kartu baru yang belum terdaftar ke Cache agar bisa langsung ditangkap web untuk registrasi/tautkan e-KTP
            Cache::put('latest_ktp_scan', [
                'rfid_uid' => strtoupper($rfidUid),
                'device_id' => $postId,
                'scanned_at' => now()->toIso8601String(),
                'timestamp' => now()->timestamp,
                'already_registered' => false,
                'owner_id' => null,
                'owner_name' => null,
                'owner_house' => null,
            ], 120);

            return response()->json([
                'success' => false,
                'gate_open' => false,
                'message' => "Kartu RFID [{$rfidUid}] tidak terdaftar di sistem SMART-WARGA.",
                'lcd_line1' => "KARTU DITOLAK",
                'lcd_line2' => "TIDAK TERDAFTAR",
            ], 404);
        }

        // 2. Check if user has ronda schedule today
        $today = Carbon::today()->toDateString();
        $schedule = RondaSchedule::whereDate('date', $today)
            ->get()
            ->first(function ($sched) use ($user) {
                $assigned = is_array($sched->assigned_users) ? $sched->assigned_users : json_decode($sched->assigned_users, true);
                return in_array((int) $user->id, array_map('intval', (array) ($assigned ?? [])));
            });

        $status = 'hadir';
        $message = "Halo {$user->name}, absensi ronda berhasil dicatat. Gerbang dibuka.";

        if (!$schedule) {
            // Warga is registered, allow entry as resident tap
            $message = "Halo {$user->name} ({$user->house?->full_address}). Akses gerbang dibuka.";
        }

        // 3. Log ronda attendance
        $log = RondaLog::create([
            'schedule_id' => $schedule?->id,
            'user_id' => $user->id,
            'rfid_uid' => $rfidUid,
            'post_id' => $postId,
            'tapped_at' => now(),
            'status' => $status,
        ]);

        // Update IoT device last ping HANYA jika dipanggil langsung oleh hardware fisik ESP32
        if ($isHardware) {
            IotDevice::where('device_type', 'gate')->update(['last_ping' => now()]);
        }

        return response()->json([
            'success' => true,
            'gate_open' => true,
            'servo_angle' => 90, // for ESP32 SG90 servo
            'open_duration_ms' => 4000,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'house' => $user->house?->full_address,
                'rt' => $user->rt_number,
            ],
            'message' => $message,
            'lcd_line1' => substr($user->name, 0, 16),
            'lcd_line2' => "GERBANG TERBUKA",
        ]);
    }

    /**
     * Node 1: Panic Button Emergency Trigger
     * POST /api/iot/panic-button
     * Payload: {"location": "Pos Gerbang Utama", "trigger_type": "hardware_button"}
     */
    public function panicButton(Request $request)
    {
        $location = $request->input('location', 'Pos Gerbang Utama');
        $triggerType = $request->input('trigger_type', 'hardware_button');

        $device = IotDevice::where('device_type', 'gate')->first();
        $sirenDevice = IotDevice::where('device_type', 'siren')->first();
        $userAgent = (string) $request->header('User-Agent', '');
        $isHardware = (str_contains($userAgent, 'ESP32') || str_contains($userAgent, 'ESP8266')) && ! str_contains($userAgent, 'Mozilla');
        $isSirenOnline = $sirenDevice && $sirenDevice->last_ping && abs($sirenDevice->last_ping->diffInSeconds(now(), false)) <= 15;

        // 1. Create emergency log
        $emergency = IotEmergencyLog::create([
            'device_id' => $device?->id,
            'location' => $location,
            'trigger_type' => $triggerType,
            'status' => 'active',
        ]);

        // 2. Activate siren state HANYA jika hardware Node 2 sedang ONLINE
        $siren = SirenStatus::firstOrCreate(['id' => 1]);
        if ($isSirenOnline) {
            $siren->update([
                'is_active' => true,
                'activated_at' => now(),
                'reason' => "Tombol Panik Ditekan di {$location} ({$triggerType})",
            ]);
        }

        // 3. Broadcast real-time events via Reverb (wrapped for fault tolerance)
        try {
            broadcast(new PanicButtonTriggered($location, $triggerType, $emergency->id))->toOthers();
            if ($isSirenOnline) {
                broadcast(new SireneStatusChanged(true, $siren->reason))->toOthers();
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('IoT broadcast skipped (WebSocket server offline): ' . $e->getMessage());
        }

        // Update last ping HANYA jika pemicunya adalah hardware fisik
        if ($isHardware && $device) {
            $device->update(['last_ping' => now()]);
        }

        return response()->json([
            'success' => true,
            'siren_triggered' => (bool) $isSirenOnline,
            'message' => $isSirenOnline
                ? 'ALARM DARURAT DIAKTIFKAN! Notifikasi real-time dan sirine wilayah telah berbunyi.'
                : 'Panggilan darurat tercatat! Namun perangkat fisik Sirine (Node 2) sedang OFFLINE sehingga speaker lokasi tidak berbunyi.',
            'data' => [
                'log_id' => $emergency->id,
                'location' => $location,
                'siren_active' => (bool) $isSirenOnline,
                'hardware_online' => (bool) $isSirenOnline,
                'timestamp' => now()->toIso8601String(),
            ]
        ], 201);
    }

    /**
     * Node 2: Polling Sirine Status for ESP32
     * GET /api/iot/sirine/status
     */
    public function sirineStatus(Request $request)
    {
        $siren = SirenStatus::firstOrCreate(['id' => 1], [
            'is_active' => false,
            'reason' => 'Kondisi Normal Aman',
        ]);

        // Cek apakah request berasal dari browser (Navbar polling)
        $userAgent = (string) $request->header('User-Agent', '');
        $isBrowser = str_contains($userAgent, 'Mozilla')
            || $request->hasHeader('Authorization')
            || $request->query('source') === 'web';

        // Update Node 2 ping HANYA jika dipanggil oleh hardware ESP32, BUKAN oleh browser
        if (! $isBrowser) {
            IotDevice::where('device_type', 'siren')->update(['last_ping' => now()]);
        }

        return response()->json([
            'siren_active' => (bool) $siren->is_active,
            'reason' => $siren->reason,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Toggle Sirine Status from Web Dashboard
     * POST /api/iot/sirine/toggle
     */
    public function toggleSirine(Request $request)
    {
        $validated = $request->validate([
            'is_active' => 'required|boolean',
            'reason' => 'nullable|string|max:255',
        ]);

        $sirenDevice = IotDevice::where('device_type', 'siren')->first();
        $isSirenOnline = $sirenDevice && $sirenDevice->last_ping && abs($sirenDevice->last_ping->diffInSeconds(now(), false)) <= 15;

        // Jika pengurus mencoba menyalakan sirine padahal hardware Node 2 OFFLINE
        if ($validated['is_active'] && ! $isSirenOnline) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal membunyikan sirine: Perangkat fisik Sirine (ESP32 Node 2) sedang OFFLINE. Relay fisik tidak terhubung sehingga sirine tidak dapat dibunyikan.',
                'error' => 'DEVICE_OFFLINE',
                'is_online' => false,
            ], 422);
        }

        $siren = SirenStatus::firstOrCreate(['id' => 1]);
        $user = $request->user();

        $siren->update([
            'is_active' => $validated['is_active'],
            'activated_by' => $validated['is_active'] ? ($user?->id) : null,
            'activated_at' => $validated['is_active'] ? now() : null,
            'reason' => $validated['is_active'] 
                ? ($validated['reason'] ?? 'Diaktifkan manual oleh pengurus ' . ($user?->name ?? 'Admin'))
                : 'Dinonaktifkan oleh ' . ($user?->name ?? 'Pengurus'),
        ]);

        // If deactivated, resolve active emergency logs
        if (!$validated['is_active']) {
            IotEmergencyLog::where('status', 'active')->update([
                'status' => 'handled',
                'handled_by' => $user?->id,
                'resolved_at' => now(),
            ]);
        }

        // Broadcast status change (wrapped for fault tolerance)
        try {
            broadcast(new SireneStatusChanged((bool) $siren->is_active, $siren->reason))->toOthers();
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('IoT broadcast skipped (WebSocket server offline): ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => $siren->is_active ? 'Sirine Darurat telah DIAKTIFKAN!' : 'Sirine Darurat berhasil DIMATIKAN.',
            'data' => $siren,
        ]);
    }

    /**
     * Node 3: Bank Sampah Weighing & Wallet Auto-Credit
     * POST /api/iot/bank-sampah/setor
     * Payload: {"rfid_uid": "STRING", "kategori": "kaleng|plastik", "berat_gram": NUMBER}
     */
    public function bankSampahSetor(Request $request)
    {
        $validated = $request->validate([
            'rfid_uid' => 'required|string',
            'kategori' => 'required|string|in:kaleng,plastik',
            'berat_gram' => 'required|numeric|min:1',
        ]);

        $rfidUid = trim($validated['rfid_uid']);
        $kategori = strtolower(trim($validated['kategori']));
        $beratGram = (float) $validated['berat_gram'];

        $terminalDevice = IotDevice::where('device_type', 'waste_terminal')->first();
        $userAgent = (string) $request->header('User-Agent', '');
        $isHardware = (str_contains($userAgent, 'ESP32') || str_contains($userAgent, 'ESP8266')) && ! str_contains($userAgent, 'Mozilla');
        $isTerminalOnline = $terminalDevice && $terminalDevice->last_ping && abs($terminalDevice->last_ping->diffInSeconds(now(), false)) <= 15;

        // Jika request BUKAN dari ESP32 fisik dan hardware terminal sedang offline
        if (! $isHardware && ! $isTerminalOnline) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal: Terminal Timbangan (Node 3) sedang OFFLINE. Sensor Load Cell tidak terhubung.',
                'lcd_line1' => 'TERMINAL OFFLINE',
                'lcd_line2' => 'PERIKSA DAYA IOT',
                'is_online' => false,
            ], 422);
        }

        // 1. Find user by RFID
        $user = User::with('house')->where('rfid_uid', $rfidUid)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => "Kartu RFID [{$rfidUid}] tidak terdaftar. Setoran sampah dibatalkan.",
                'lcd_line1' => "RFID TDK TERDAFTAR",
                'lcd_line2' => "GAGAL SETOR",
            ], 404);
        }

        // 2. Lookup price per kg (Default: Kaleng Rp5.000/kg, Plastik Rp2.000/kg)
        $rate = WasteRate::where('category', $kategori)->first();
        $pricePerKg = $rate ? (float) $rate->price_per_kg : ($kategori === 'kaleng' ? 5000.00 : 2000.00);

        // 3. Calculate nominal: (gram / 1000) * pricePerKg
        $weightKg = $beratGram / 1000.0;
        $totalNominal = round($weightKg * $pricePerKg, 2);

        // Minimum nominal 100 rupiah
        if ($totalNominal < 100) {
            $totalNominal = 100.00;
        }

        $wallet = Wallet::firstOrCreate(['user_id' => $user->id], ['balance' => 0.00]);

        DB::transaction(function () use ($wallet, $user, $rfidUid, $kategori, $beratGram, $pricePerKg, $totalNominal) {
            // Update wallet balance
            $wallet->balance += $totalNominal;
            $wallet->save();

            // Record wallet transaction
            $walletTx = WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'user_id' => $user->id,
                'type' => 'credit',
                'category' => 'waste_bank',
                'amount' => $totalNominal,
                'reference_id' => 'BS-' . time() . '-' . $user->id,
                'description' => "Setoran Bank Sampah: " . ucfirst($kategori) . " ({$beratGram} gram)",
                'status' => 'completed',
            ]);

            // Record waste bank transaction
            WasteBankTransaction::create([
                'user_id' => $user->id,
                'rfid_uid' => $rfidUid,
                'category' => $kategori,
                'weight_gram' => $beratGram,
                'price_per_kg' => $pricePerKg,
                'total_nominal' => $totalNominal,
                'wallet_transaction_id' => $walletTx->id,
            ]);
        });

        // Update IoT Terminal device ping HANYA jika dipanggil langsung oleh hardware fisik
        if ($isHardware) {
            IotDevice::where('device_type', 'waste_terminal')->update(['last_ping' => now()]);
        }

        $formattedRp = number_format($totalNominal, 0, ',', '.');
        $newBalance = number_format($wallet->fresh()->balance, 0, ',', '.');

        return response()->json([
            'success' => true,
            'message' => "Setoran sampah {$kategori} sebesar {$beratGram}g berhasil. Saldo Rp {$formattedRp} otomatis masuk ke dompet {$user->name}.",
            'data' => [
                'warga_name' => $user->name,
                'house' => $user->house?->full_address,
                'kategori' => ucfirst($kategori),
                'berat_gram' => $beratGram,
                'harga_per_kg' => $pricePerKg,
                'total_nominal' => $totalNominal,
                'wallet_balance' => $wallet->fresh()->balance,
            ],
            // LCD formatted strings (Strictly 16x2 HD44780 standard)
            'lcd_line1' => substr(substr($user->name, 0, 8) . " +" . $formattedRp, 0, 16),
            'lcd_line2' => substr("Saldo: Rp" . $newBalance, 0, 16),
        ]);
    }

    /**
     * Node 3: Posyandu Self-Service Measurement Tap
     * POST /api/iot/posyandu/catat
     * Payload: {"rfid_uid": "STRING", "berat_kg": NUMBER, "tinggi_cm": NUMBER}
     */
    public function posyanduCatat(Request $request)
    {
        $validated = $request->validate([
            'rfid_uid' => 'required|string',
            'berat_kg' => 'required|numeric|min:1|max:50',
            'tinggi_cm' => 'required|numeric|min:30|max:150',
        ]);

        $rfidUid = trim($validated['rfid_uid']);
        $user = User::with('house')->where('rfid_uid', $rfidUid)->first();

        $childName = $user ? ("Balita Ananda " . $user->name) : "Balita RFID " . substr($rfidUid, -4);

        $record = PosyanduRecord::create([
            'child_name' => $childName,
            'parent_user_id' => $user?->id,
            'weight_kg' => $validated['berat_kg'],
            'height_cm' => $validated['tinggi_cm'],
            'rfid_uid' => $rfidUid,
            'measured_at' => now(),
        ]);

        $userAgent = (string) $request->header('User-Agent', '');
        $isHardware = (str_contains($userAgent, 'ESP32') || str_contains($userAgent, 'ESP8266')) && ! str_contains($userAgent, 'Mozilla');

        // Update IoT Terminal device ping HANYA jika dipanggil langsung oleh hardware fisik
        if ($isHardware) {
            IotDevice::where('device_type', 'waste_terminal')->update(['last_ping' => now()]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Pengukuran balita Posyandu mandiri berhasil dicatat ke rekam medis.',
            'data' => $record,
            'lcd_line1' => "TB:{$validated['tinggi_cm']} BB:{$validated['berat_kg']}",
            'lcd_line2' => "POSYANDU TERCATAT",
        ]);
    }

    /**
     * IoT Devices Management & Health Status
     * GET /api/iot/devices
     */
     public function listDevices()
     {
         $now = now();
         $rawDevices = IotDevice::all();
         $siren = SirenStatus::first();

         $devices = $rawDevices->map(function ($device) use ($now) {
             // Siren polls every 3s (threshold: 15s), others threshold: 45s
             $timeout = match($device->device_type) {
                 'siren' => 15,
                 default => 45,
             };

             $secondsAgo = $device->last_ping ? (int) abs($device->last_ping->diffInSeconds($now, false)) : null;
             $isOnline = ($secondsAgo !== null && $secondsAgo <= $timeout);

             return [
                 'id' => $device->id,
                 'device_key' => $device->device_key,
                 'device_type' => $device->device_type,
                 'location' => $device->location,
                 'last_ping' => $device->last_ping?->toIso8601String(),
                 'is_active' => (bool) $device->is_active,
                 'is_online' => $isOnline,
                 'seconds_ago' => $secondsAgo,
             ];
         });

         $onlineCount = $devices->where('is_online', true)->count();
         $totalCount = $devices->count();

         return response()->json([
             'success' => true,
             'data' => [
                 'devices' => $devices,
                 'online_count' => $onlineCount,
                 'total_count' => $totalCount,
                 'siren_status' => $siren,
                 'server_time' => now()->toIso8601String(),
             ]
         ]);
     }

    /**
     * IoT Node Heartbeat Ping
     * POST /api/iot/heartbeat
     */
    public function heartbeat(Request $request)
    {
        $validated = $request->validate([
            'device_type' => 'nullable|string',
            'device_key' => 'nullable|string',
        ]);

        $deviceType = $validated['device_type'] ?? 'all';

        if (in_array($deviceType, ['all', 'aio', 'smartwarga_all'])) {
            IotDevice::query()->update(['last_ping' => now()]);
        } else {
            $device = IotDevice::where('device_type', $deviceType)->first();
            if ($device) {
                $device->update(['last_ping' => now()]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Heartbeat acknowledged',
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Reader 2: Kiosk Tap (Service Dispatcher / Balance & Context Check)
     * POST /api/iot/kiosk/tap
     * Payload: {"rfid_uid": "STRING", "requested_mode": "nullable|string"}
     */
    public function kioskTap(Request $request)
    {
        $validated = $request->validate([
            'rfid_uid' => 'required|string',
            'requested_mode' => 'nullable|string|in:auto,posyandu,bank_sampah,info',
        ]);

        $rfidUid = trim($validated['rfid_uid']);
        $requestedMode = $validated['requested_mode'] ?? 'auto';

        $user = User::with(['house', 'wallet'])->where('rfid_uid', $rfidUid)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'mode' => 'rejected',
                'message' => "Kartu e-KTP/RFID [{$rfidUid}] tidak terdaftar di sistem SMART-WARGA.",
                'lcd_line1' => 'KARTU DITOLAK   ',
                'lcd_line2' => 'TIDAK TERDAFTAR ',
            ], 404);
        }

        $userAgent = (string) $request->header('User-Agent', '');
        $isHardware = (str_contains($userAgent, 'ESP32') || str_contains($userAgent, 'ESP8266')) && ! str_contains($userAgent, 'Mozilla');
        if ($isHardware) {
            IotDevice::where('device_type', 'waste_terminal')->update(['last_ping' => now()]);
        }

        $wallet = $user->wallet ?? Wallet::firstOrCreate(['user_id' => $user->id], ['balance' => 0.00]);
        $balanceFormatted = number_format($wallet->balance, 0, ',', '.');

        $mode = $requestedMode === 'auto' ? 'bank_sampah' : $requestedMode;
        $nameShort = substr($user->name, 0, 16);

        return response()->json([
            'success' => true,
            'mode' => $mode,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'house' => $user->house?->full_address,
                'rt' => $user->rt_number,
                'wallet_balance' => (float) $wallet->balance,
            ],
            'message' => "Halo {$user->name}, sesi kios layanan siap.",
            'lcd_line1' => str_pad($nameShort, 16, ' '),
            'lcd_line2' => str_pad('Saldo:Rp' . $balanceFormatted, 16, ' '),
        ]);
    }

    /**
     * Get Emergency Logs
     * GET /api/iot/emergency-logs
     */
    public function emergencyLogs()
    {
        $logs = IotEmergencyLog::with(['device', 'handler'])->latest()->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $logs,
        ]);
    }

    /**
     * Get Ronda Logs
     * GET /api/iot/ronda/logs
     */
    public function rondaLogs(Request $request)
    {
        $query = RondaLog::with(['user.house', 'schedule']);

        if ($request->has('date') && $request->date) {
            $query->whereDate('tapped_at', $request->date);
        }

        $logs = $query->latest()->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $logs,
        ]);
    }

    /**
     * Get Waste Bank Transactions
     * GET /api/iot/waste-bank/logs
     */
    public function wasteBankLogs(Request $request)
    {
        $query = WasteBankTransaction::with(['user.house', 'walletTransaction']);

        if ($request->has('user_id') && $request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        $logs = $query->latest()->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $logs,
        ]);
    }

    /**
     * Scan KTP from ESP32 (Single AIO Mode REG-KTP or Dedicated Enroller)
     * POST /api/iot/ktp/scan
     * Payload: {"rfid_uid": "04A1B2C3", "device_id": "ENROLLER_01"}
     */
    public function scanKtp(Request $request)
    {
        $validated = $request->validate([
            'rfid_uid' => 'required|string',
            'device_id' => 'nullable|string',
        ]);

        $rfidUid = strtoupper(trim($validated['rfid_uid']));
        $deviceId = $validated['device_id'] ?? 'AIO_KIOSK';

        $existingUser = User::with('house')->where('rfid_uid', $rfidUid)->first();

        $scanData = [
            'rfid_uid' => $rfidUid,
            'device_id' => $deviceId,
            'scanned_at' => now()->toIso8601String(),
            'timestamp' => now()->timestamp,
            'already_registered' => (bool) $existingUser,
            'owner_id' => $existingUser?->id,
            'owner_name' => $existingUser?->name,
            'owner_house' => $existingUser?->house?->house_code,
        ];

        // Simpan ke Cache selama 2 menit untuk ditangkap oleh web warga
        Cache::put('latest_ktp_scan', $scanData, 120);

        if ($existingUser) {
            $ownerShort = strtoupper(substr($existingUser->name, 0, 9));
            $lcdLine1 = str_pad(substr("UID:" . $rfidUid, 0, 16), 16, ' ');
            $lcdLine2 = str_pad(substr("MILIK:" . $ownerShort, 0, 16), 16, ' ');
            $message = "KTP [{$rfidUid}] sudah terdaftar milik {$existingUser->name} ({$existingUser->house?->house_code}).";
        } else {
            $lcdLine1 = str_pad(substr("UID:" . $rfidUid, 0, 16), 16, ' ');
            $lcdLine2 = str_pad("SIAP DIDAFTAR", 16, ' ');
            $message = "KTP [{$rfidUid}] berhasil discan! Buka aplikasi SMART-WARGA untuk menautkan.";
        }

        return response()->json([
            'success' => true,
            'rfid_uid' => $rfidUid,
            'device_id' => $deviceId,
            'already_registered' => (bool) $existingUser,
            'owner' => $existingUser ? [
                'id' => $existingUser->id,
                'name' => $existingUser->name,
                'house' => $existingUser->house?->house_code,
            ] : null,
            'message' => $message,
            'lcd_line1' => $lcdLine1,
            'lcd_line2' => $lcdLine2,
        ]);
    }

    /**
     * Get Latest Scanned KTP (Polled by Web Warga during pairing modal)
     * GET /api/warga/ktp/latest-scan
     */
    public function getLatestKtpScan(Request $request)
    {
        $scan = Cache::get('latest_ktp_scan');

        if (! $scan) {
            return response()->json([
                'success' => false,
                'message' => 'Belum ada kartu e-KTP yang di-tap pada perangkat scanner.',
                'data' => null,
            ]);
        }

        // Cek apakah scan masih segar (maksimal 90 detik yang lalu)
        $isFresh = (now()->timestamp - ($scan['timestamp'] ?? 0)) <= 90;

        return response()->json([
            'success' => $isFresh,
            'message' => $isFresh ? 'Kartu e-KTP terdeteksi dari scanner!' : 'Data scan KTP kedaluwarsa. Silakan tap kembali.',
            'data' => $isFresh ? $scan : null,
        ]);
    }

    /**
     * Pair Scanned KTP to Authenticated Citizen Profile
     * POST /api/warga/ktp/pair
     * Payload: {"rfid_uid": "04A1B2C3"}
     */
    public function pairKtp(Request $request)
    {
        $validated = $request->validate([
            'rfid_uid' => 'required|string|max:50',
        ]);

        $user = $request->user();
        if (! $user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $rfidUid = strtoupper(trim($validated['rfid_uid']));

        // Cek apakah UID sudah dipakai warga lain
        $conflict = User::with('house')->where('rfid_uid', $rfidUid)->where('id', '!=', $user->id)->first();
        if ($conflict) {
            return response()->json([
                'success' => false,
                'message' => "Kartu e-KTP [{$rfidUid}] sudah ditautkan ke warga lain ({$conflict->name} - {$conflict->house?->house_code}). Gunakan kartu Anda sendiri.",
            ], 422);
        }

        $user->rfid_uid = $rfidUid;
        $user->save();

        // Bersihkan cache scan
        Cache::forget('latest_ktp_scan');

        return response()->json([
            'success' => true,
            'message' => "Selamat! e-KTP fisik Anda [{$rfidUid}] berhasil didaftarkan dan ditautkan ke akun SMART-WARGA.",
            'user' => $user->fresh(['house']),
        ]);
    }

    /**
     * Unpair KTP from Authenticated Citizen Profile
     * DELETE /api/warga/ktp/unpair
     */
    public function unpairKtp(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $user->rfid_uid = null;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Tautan kartu e-KTP fisik berhasil dilepas.',
            'user' => $user->fresh(['house']),
        ]);
    }
}

