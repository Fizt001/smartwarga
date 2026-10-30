<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AssetLoan;
use App\Models\KioskServiceQueue;
use App\Models\Letter;
use App\Models\PosyanduQueue;
use App\Models\RondaLog;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class KioskServiceController extends Controller
{
    /**
     * Tap RFID at Service Kiosk (ESP32 SDA Pin 4)
     * POST /api/iot/pelayanan/tap
     */
    public function tapKiosk(Request $request)
    {
        $validated = $request->validate([
            'rfid_uid' => 'required|string',
            'device_id' => 'nullable|string',
        ]);

        $rfidUid = strtoupper(trim($validated['rfid_uid']));
        $deviceId = $validated['device_id'] ?? 'AIO_KIOSK_PIN4';
        $today = Carbon::today()->toDateString();

        // 1. Cari data warga pemilik kartu
        $user = User::with('house')->where('rfid_uid', $rfidUid)->first();
        $citizenName = $user ? $user->name : ("Warga Baru (" . substr($rfidUid, -4) . ")");
        $userId = $user?->id;

        // 2. Simpan ke Cache latest_ktp_scan agar form registrasi/pairing e-KTP di web juga menangkapnya
        Cache::put('latest_ktp_scan', [
            'rfid_uid' => $rfidUid,
            'device_id' => $deviceId,
            'scanned_at' => now()->toIso8601String(),
            'timestamp' => now()->timestamp,
            'already_registered' => (bool) $user,
            'owner_id' => $userId,
            'owner_name' => $user?->name,
            'owner_house' => $user?->house?->house_code,
        ], 120);

        // 3. Cek apakah kartu ini sudah ada antrean aktif atau menunggu hari ini
        $existingQueue = KioskServiceQueue::whereDate('queue_date', $today)
            ->where('rfid_uid', $rfidUid)
            ->whereIn('status', ['active', 'waiting'])
            ->first();

        if ($existingQueue) {
            $isTurn = $existingQueue->status === 'active';
            return response()->json([
                'success' => true,
                'already_queued' => true,
                'queue_number' => $existingQueue->queue_number,
                'status' => $existingQueue->status,
                'citizen_name' => $existingQueue->citizen_name,
                'message' => $isTurn 
                    ? "Halo {$citizenName}, giliran Anda sedang aktif! Silakan pilih layanan di aplikasi." 
                    : "Halo {$citizenName}, Anda sudah dalam antrean #{$existingQueue->queue_number}. Harap menunggu giliran.",
                'lcd_line1' => "ANTREAN #{$existingQueue->queue_number}",
                'lcd_line2' => $isTurn ? "GILIRAN ANDA!" : "HARAP MENUNGGU",
                'data' => $existingQueue,
            ]);
        }

        // 4. Cek apakah ada antrean yang sedang aktif dilayani saat ini
        $hasActiveSession = KioskServiceQueue::whereDate('queue_date', $today)
            ->where('status', 'active')
            ->exists();

        $status = $hasActiveSession ? 'waiting' : 'active';
        $queueNumber = KioskServiceQueue::whereDate('queue_date', $today)->count() + 1;

        $newQueue = KioskServiceQueue::create([
            'queue_number' => $queueNumber,
            'queue_date' => $today,
            'rfid_uid' => $rfidUid,
            'user_id' => $userId,
            'citizen_name' => $citizenName,
            'status' => $status,
            'tapped_at' => now(),
            'started_at' => $status === 'active' ? now() : null,
        ]);

        $isTurn = $status === 'active';
        $message = $isTurn
            ? "Halo {$citizenName}, Anda nomor antrean #{$queueNumber} dan giliran Anda langsung aktif! Silakan pilih layanan."
            : "Halo {$citizenName}, Anda terdaftar di antrean #{$queueNumber}. Harap menunggu, meja pelayanan sedang melayani warga sebelum Anda.";

        return response()->json([
            'success' => true,
            'already_queued' => false,
            'queue_number' => $queueNumber,
            'status' => $status,
            'citizen_name' => $citizenName,
            'message' => $message,
            'lcd_line1' => "ANTREAN #{$queueNumber}",
            'lcd_line2' => $isTurn ? "SILAKAN LAYANAN" : "HARAP MENUNGGU",
            'data' => $newQueue->load('user.house'),
        ], 201);
    }

    /**
     * Get Current Active Session & Waiting Queues
     * GET /api/pelayanan/active-session
     */
    public function getActiveSession(Request $request)
    {
        $today = Carbon::today()->toDateString();
        $user = $request->user();

        // Antrean yang sedang aktif dilayani sekarang
        $activeSession = KioskServiceQueue::with('user.house')
            ->whereDate('queue_date', $today)
            ->where('status', 'active')
            ->first();

        // Daftar antrean yang sedang menunggu
        $waitingQueues = KioskServiceQueue::with('user.house')
            ->whereDate('queue_date', $today)
            ->where('status', 'waiting')
            ->orderBy('queue_number')
            ->get();

        // Cari apakah warga yang sedang login ini memiliki antrean (active atau waiting)
        $myQueue = null;
        if ($user) {
            $myQueue = KioskServiceQueue::whereDate('queue_date', $today)
                ->where(function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                    if ($user->rfid_uid) {
                        $q->orWhere('rfid_uid', $user->rfid_uid);
                    }
                })
                ->whereIn('status', ['active', 'waiting'])
                ->first();
        }

        // Jika tidak login atau warga baru, bisa filter by rfid_uid param
        if (!$myQueue && $request->filled('rfid_uid')) {
            $myQueue = KioskServiceQueue::whereDate('queue_date', $today)
                ->where('rfid_uid', strtoupper($request->rfid_uid))
                ->whereIn('status', ['active', 'waiting'])
                ->first();
        }

        $isMyTurn = false;
        $peopleAhead = 0;

        if ($myQueue) {
            if ($myQueue->status === 'active') {
                $isMyTurn = true;
                $peopleAhead = 0;
            } else {
                $isMyTurn = false;
                $peopleAhead = $waitingQueues->where('queue_number', '<', $myQueue->queue_number)->count() + ($activeSession ? 1 : 0);
            }
        }

        // Ambil data pengajuan warga yang sedang aktif (yang menunggu disahkan fisik di balai)
        $activePendingItems = [
            'letters' => [],
            'loans' => [],
            'posyandu' => [],
            'total_pending' => 0,
        ];

        if ($activeSession && $activeSession->user_id) {
            $pendingLetters = Letter::where('user_id', $activeSession->user_id)
                ->whereIn('status', ['pending', 'rt_approved', 'rw_approved'])
                ->get();
            $pendingLoans = AssetLoan::with('asset')
                ->where('user_id', $activeSession->user_id)
                ->whereIn('status', ['requested', 'approved'])
                ->get();
            $pendingPosyandu = PosyanduQueue::whereDate('queue_date', $today)
                ->where('user_id', $activeSession->user_id)
                ->whereIn('status', ['waiting', 'calling'])
                ->get();

            $activePendingItems = [
                'letters' => $pendingLetters,
                'loans' => $pendingLoans,
                'posyandu' => $pendingPosyandu,
                'total_pending' => $pendingLetters->count() + $pendingLoans->count() + $pendingPosyandu->count(),
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'active_session' => $activeSession,
                'waiting_queues' => $waitingQueues,
                'total_waiting' => $waitingQueues->count(),
                'my_queue' => $myQueue ? $myQueue->load('user.house') : null,
                'is_my_turn' => $isMyTurn,
                'people_ahead' => $peopleAhead,
                'active_pending_items' => $activePendingItems,
            ],
        ]);
    }

    /**
     * Legalize & Complete Pending Action via Physical Tap (Surat, Aset, Posyandu)
     * POST /api/pelayanan/legalize-item
     */
    public function legalizeItem(Request $request)
    {
        $validated = $request->validate([
            'queue_id' => 'required|integer|exists:kiosk_service_queues,id',
            'item_type' => 'required|string|in:letter,loan,posyandu',
            'item_id' => 'required|integer',
        ]);

        $today = Carbon::today()->toDateString();
        $user = $request->user();
        $queue = KioskServiceQueue::findOrFail($validated['queue_id']);

        $serviceType = '';
        $serviceNotes = '';

        if ($validated['item_type'] === 'letter') {
            $letter = Letter::findOrFail($validated['item_id']);
            $letter->update([
                'status' => 'rw_approved',
                'rw_approved_at' => now(),
                'notes' => 'Telah disahkan & diserahterimakan fisik via Tap KTP di Kios Balai Warga.',
            ]);
            $serviceType = 'Pengesahan Surat Pengantar';
            $serviceNotes = "Surat '{$letter->type}' ({$letter->purpose}) telah diverifikasi fisik dan dicetak/diserahkan ke {$queue->citizen_name}.";
        } elseif ($validated['item_type'] === 'loan') {
            $loan = AssetLoan::with('asset')->findOrFail($validated['item_id']);
            $loan->update([
                'status' => 'approved',
                'actual_return_date' => null,
            ]);
            $assetName = $loan->asset ? $loan->asset->name : 'Aset';
            $serviceType = 'Serah Terima Peminjaman Aset';
            $serviceNotes = "BAST Serah Terima Fisik: {$loan->quantity} Unit {$assetName} resmi diserahkan kepada {$queue->citizen_name}.";
        } elseif ($validated['item_type'] === 'posyandu') {
            $posQueue = PosyanduQueue::findOrFail($validated['item_id']);
            $posQueue->update([
                'status' => 'calling',
                'called_at' => now(),
            ]);
            $serviceType = 'Panggilan Posyandu';
            $serviceNotes = "Warga {$queue->citizen_name} hadir di posyandu (Antrean Balita/Lansia #{$posQueue->queue_number}).";
        }

        // Tandai sesi kios selesai
        $queue->update([
            'status' => 'completed',
            'service_type' => $serviceType,
            'service_notes' => $serviceNotes,
            'completed_at' => now(),
        ]);

        // Majukan antrean berikutnya
        $nextQueue = KioskServiceQueue::whereDate('queue_date', $today)
            ->where('status', 'waiting')
            ->orderBy('queue_number')
            ->first();

        if ($nextQueue) {
            $nextQueue->update([
                'status' => 'active',
                'started_at' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => "Proses sah/legal: '{$serviceType}' berhasil diselesaikan dan dicatat ke arsip digital. " . 
                         ($nextQueue ? "Antrean #{$nextQueue->queue_number} ({$nextQueue->citizen_name}) sekarang dipanggil!" : "Sesi pelayanan selesai."),
            'data' => [
                'completed' => $queue,
                'next_active' => $nextQueue,
            ],
        ]);
    }

    /**
     * Complete Current Service Session (Automatically advances to next in line!)
     * POST /api/pelayanan/complete-session
     */
    public function completeSession(Request $request)
    {
        $validated = $request->validate([
            'queue_id' => 'nullable|integer|exists:kiosk_service_queues,id',
            'service_type' => 'required|string|max:100', // registrasi_ktp, posyandu, pengaduan, surat, bank_sampah
            'service_notes' => 'nullable|string|max:500',
        ]);

        $today = Carbon::today()->toDateString();
        $user = $request->user();

        // Temukan antrean yang akan diselesaikan
        $queue = null;
        if (!empty($validated['queue_id'])) {
            $queue = KioskServiceQueue::find($validated['queue_id']);
        } elseif ($user) {
            $queue = KioskServiceQueue::whereDate('queue_date', $today)
                ->where(function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                    if ($user->rfid_uid) {
                        $q->orWhere('rfid_uid', $user->rfid_uid);
                    }
                })
                ->where('status', 'active')
                ->first();
        }

        if (!$queue) {
            // Ambil active session pertama hari ini
            $queue = KioskServiceQueue::whereDate('queue_date', $today)
                ->where('status', 'active')
                ->first();
        }

        if (!$queue) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ditemukan sesi antrean aktif yang sedang berjalan.',
            ], 404);
        }

        // 1. Selesaikan sesi antrean saat ini
        $queue->update([
            'status' => 'completed',
            'service_type' => $validated['service_type'],
            'service_notes' => $validated['service_notes'] ?? "Pelayanan {$validated['service_type']} selesai diproses.",
            'completed_at' => now(),
        ]);

        // 2. OTOMATIS MAJUKAN ANTREAN BERIKUTNYA KE STATUS 'ACTIVE'!
        $nextQueue = KioskServiceQueue::whereDate('queue_date', $today)
            ->where('status', 'waiting')
            ->orderBy('queue_number')
            ->first();

        if ($nextQueue) {
            $nextQueue->update([
                'status' => 'active',
                'started_at' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => "Pelayanan '{$validated['service_type']}' berhasil diselesaikan dan dicatat ke riwayat. " . 
                         ($nextQueue ? "Antrean #{$nextQueue->queue_number} ({$nextQueue->citizen_name}) sekarang dipanggil!" : "Semua antrean hari ini telah selesai."),
            'data' => [
                'completed' => $queue,
                'next_active' => $nextQueue,
            ],
        ]);
    }

    /**
     * Cancel Session by User or Admin
     * POST /api/pelayanan/cancel-session
     */
    public function cancelSession(Request $request)
    {
        $validated = $request->validate([
            'queue_id' => 'required|integer|exists:kiosk_service_queues,id',
            'reason' => 'nullable|string|max:255',
        ]);

        $today = Carbon::today()->toDateString();
        $queue = KioskServiceQueue::findOrFail($validated['queue_id']);
        $wasActive = ($queue->status === 'active');

        $queue->update([
            'status' => 'cancelled',
            'service_notes' => $validated['reason'] ?? 'Antrean dibatalkan oleh warga/sistem.',
            'completed_at' => now(),
        ]);

        // Jika antrean yang dibatalkan adalah yang sedang aktif, majukan antrean berikutnya!
        if ($wasActive) {
            $nextQueue = KioskServiceQueue::whereDate('queue_date', $today)
                ->where('status', 'waiting')
                ->orderBy('queue_number')
                ->first();

            if ($nextQueue) {
                $nextQueue->update([
                    'status' => 'active',
                    'started_at' => now(),
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Nomor antrean #{$queue->queue_number} berhasil dibatalkan.",
        ]);
    }

    /**
     * Get Service Kiosk Log History (All completed and recent records)
     * GET /api/pelayanan/history
     */
    public function getHistory(Request $request)
    {
        $user = $request->user();
        $query = KioskServiceQueue::with('user.house');

        if ($user && $user->role === 'warga') {
            $query->where('user_id', $user->id);
        }

        if ($request->filled('date')) {
            $query->whereDate('queue_date', $request->date);
        }

        $history = $query->latest('id')->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $history,
        ]);
    }

    /**
     * Gate Access Logs (SDA Pin 5: Gerbang Tol RT/RW)
     * GET /api/warga/gate-logs
     */
    public function getGateLogs(Request $request)
    {
        $user = $request->user();
        $query = RondaLog::with(['user.house']);

        // Jika warga biasa, tampilkan log miliknya sendiri
        if ($user && $user->role === 'warga') {
            $query->where('user_id', $user->id);
        }

        if ($request->filled('date')) {
            $query->whereDate('tapped_at', $request->date);
        }

        $logs = $query->latest('tapped_at')->paginate($request->get('per_page', 25));

        return response()->json([
            'success' => true,
            'data' => $logs,
        ]);
    }
}

