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

        // 1. Find user by RFID UID
        $user = User::with('house')->where('rfid_uid', $rfidUid)->first();

        if (!$user) {
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

        // Update IoT device last ping
        IotDevice::where('device_type', 'gate')->update(['last_ping' => now()]);

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

        // 1. Create emergency log
        $emergency = IotEmergencyLog::create([
            'device_id' => $device?->id,
            'location' => $location,
            'trigger_type' => $triggerType,
            'status' => 'active',
        ]);

        // 2. Activate siren state
        $siren = SirenStatus::firstOrCreate(['id' => 1]);
        $siren->update([
            'is_active' => true,
            'activated_at' => now(),
            'reason' => "Tombol Panik Ditekan di {$location} ({$triggerType})",
        ]);

        // 3. Broadcast real-time events via Reverb (wrapped for fault tolerance)
        try {
            broadcast(new PanicButtonTriggered($location, $triggerType, $emergency->id))->toOthers();
            broadcast(new SireneStatusChanged(true, $siren->reason))->toOthers();
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('IoT broadcast skipped (WebSocket server offline): ' . $e->getMessage());
        }

        // Update last ping
        if ($device) {
            $device->update(['last_ping' => now()]);
        }

        return response()->json([
            'success' => true,
            'siren_triggered' => true,
            'message' => 'ALARM DARURAT DIAKTIFKAN! Notifikasi real-time dan sirine wilayah telah berbunyi.',
            'data' => [
                'log_id' => $emergency->id,
                'location' => $location,
                'siren_active' => true,
                'timestamp' => now()->toIso8601String(),
            ]
        ], 201);
    }

    /**
     * Node 2: Polling Sirine Status for ESP32
     * GET /api/iot/sirine/status
     */
    public function sirineStatus()
    {
        $siren = SirenStatus::firstOrCreate(['id' => 1], [
            'is_active' => false,
            'reason' => 'Kondisi Normal Aman',
        ]);

        // Update Node 2 ping
        IotDevice::where('device_type', 'siren')->update(['last_ping' => now()]);

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

        // Update IoT Terminal device ping
        IotDevice::where('device_type', 'waste_terminal')->update(['last_ping' => now()]);

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

        // Update IoT Terminal device ping
        IotDevice::where('device_type', 'waste_terminal')->update(['last_ping' => now()]);

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
        $devices = IotDevice::all();
        $siren = SirenStatus::first();

        return response()->json([
            'success' => true,
            'data' => [
                'devices' => $devices,
                'siren_status' => $siren,
                'server_time' => now()->toIso8601String(),
            ]
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
}
