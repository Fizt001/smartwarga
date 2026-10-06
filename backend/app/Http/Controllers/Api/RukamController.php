<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ambulance;
use App\Models\AmbulanceBooking;
use App\Models\RukamReport;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RukamController extends Controller
{
    /**
     * List Rukam Reports
     */
    public function index(Request $request)
    {
        $query = RukamReport::with([
            'reporter.house',
            'verifier',
            'disburser',
            'ambulanceBooking.ambulance',
        ]);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->boolean('my_reports')) {
            $query->where('reported_by', $request->user()->id);
        }

        $reports = $query->latest()->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $reports,
        ]);
    }

    /**
     * Show single Rukam Report
     */
    public function show($id)
    {
        $report = RukamReport::with([
            'reporter.house',
            'verifier',
            'disburser',
            'ambulanceBooking.ambulance',
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $report,
        ]);
    }

    /**
     * Report Deceased (Warga / Keluarga)
     */
    public function report(Request $request)
    {
        $validated = $request->validate([
            'deceased_name' => 'required|string|max:255',
            'deceased_nik' => 'nullable|string|max:30',
            'deceased_address' => 'required|string|max:255',
            'relation' => 'required|string|max:50',
            'date_of_death' => 'nullable|date',
            'time_of_death' => 'nullable|string|max:20',
            'cause_of_death' => 'nullable|string|max:100',
            'burial_location' => 'nullable|string|max:150',
            'burial_datetime' => 'nullable|date',
            'death_certificate' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'needs_ambulance' => 'nullable|boolean',
            'needs_tent_and_chairs' => 'nullable|boolean',
            'notes' => 'nullable|string',
        ]);

        $certPath = null;
        if ($request->hasFile('death_certificate')) {
            $path = $request->file('death_certificate')->store('rukam_certificates', 'public');
            $certPath = '/storage/' . $path;
        }

        $needsAmbulance = (bool) ($validated['needs_ambulance'] ?? false);
        $needsTentAndChairs = (bool) ($validated['needs_tent_and_chairs'] ?? false);

        DB::beginTransaction();
        try {
            $report = RukamReport::create([
                'reported_by' => $request->user()->id,
                'deceased_name' => $validated['deceased_name'],
                'deceased_nik' => $validated['deceased_nik'] ?? null,
                'deceased_address' => $validated['deceased_address'],
                'relation' => $validated['relation'],
                'date_of_death' => $validated['date_of_death'] ?? now()->toDateString(),
                'time_of_death' => $validated['time_of_death'] ?? null,
                'cause_of_death' => $validated['cause_of_death'] ?? null,
                'burial_location' => $validated['burial_location'] ?? null,
                'burial_datetime' => $validated['burial_datetime'] ?? null,
                'death_certificate_path' => $certPath,
                'needs_ambulance' => $needsAmbulance,
                'needs_tent_and_chairs' => $needsTentAndChairs,
                'notes' => $validated['notes'] ?? null,
                'status' => 'reported',
                'disbursement_amount' => 1500000.00, // Standard santunan RUKAM Rp 1.500.000
            ]);

            // Auto-create ambulance booking if requested
            if ($needsAmbulance) {
                $code = 'AMB-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -5));
                AmbulanceBooking::create([
                    'booking_code' => $code,
                    'user_id' => $request->user()->id,
                    'rukam_report_id' => $report->id,
                    'patient_name' => "Jenazah Alm/Almh {$report->deceased_name}",
                    'service_type' => 'jenazah',
                    'urgency_level' => 'urgent',
                    'pickup_address' => $report->deceased_address,
                    'destination_address' => $report->burial_location ?? 'Rumah Duka / TPU',
                    'pickup_time' => $report->burial_datetime ?? now(),
                    'notes' => 'Permintaan armada ambulans jenazah via pelaporan RUKAM.',
                    'status' => 'requested',
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Laporan RUKAM berhasil diajukan. Kami segenap pengurus dan warga turut berbelasungkawa sedalam-dalamnya. Pengurus akan segera memverifikasi dan memproses dana santunan.',
                'data' => $report->load(['reporter.house', 'ambulanceBooking']),
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Verify RUKAM Report (Pengurus / RT / RW)
     */
    public function verify(Request $request, $id)
    {
        $report = RukamReport::findOrFail($id);

        if ($report->status !== 'reported') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya laporan dengan status "reported" yang dapat diverifikasi.',
            ], 422);
        }

        $validated = $request->validate([
            'disbursement_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $report->update([
            'status' => 'verified',
            'verified_by' => $request->user()->id,
            'verified_at' => now(),
            'disbursement_amount' => $validated['disbursement_amount'] ?? $report->disbursement_amount,
            'notes' => !empty($validated['notes']) ? $validated['notes'] : $report->notes,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Laporan RUKAM telah diverifikasi. Pengurus siap mencairkan santunan duka.',
            'data' => $report->fresh(['reporter.house', 'verifier', 'ambulanceBooking.ambulance']),
        ]);
    }

    /**
     * Disburse RUKAM Aid to Bereaved Family (Bendahara / Pengurus)
     */
    public function disburse(Request $request, $id)
    {
        $report = RukamReport::with('reporter')->findOrFail($id);

        if ($report->status === 'disbursed') {
            return response()->json([
                'success' => false,
                'message' => 'Dana santunan RUKAM sudah dicairkan sebelumnya.',
            ], 422);
        }

        $request->validate([
            'amount' => 'required|numeric|min:100000',
            'disburse_to_wallet' => 'boolean',
        ]);

        DB::transaction(function () use ($report, $request) {
            $report->update([
                'status' => 'disbursed',
                'disbursement_amount' => $request->amount,
                'disbursed_by' => $request->user()->id,
                'disbursed_at' => now(),
            ]);

            if ($request->get('disburse_to_wallet', true)) {
                $wallet = Wallet::firstOrCreate(['user_id' => $report->reported_by], ['balance' => 0.00]);
                $wallet->balance += $request->amount;
                $wallet->save();

                WalletTransaction::create([
                    'wallet_id' => $wallet->id,
                    'user_id' => $report->reported_by,
                    'type' => 'credit',
                    'category' => 'topup',
                    'amount' => $request->amount,
                    'reference_id' => 'RUKAM-AID-' . $report->id,
                    'description' => "Pencairan Dana Santunan Kematian (RUKAM) untuk Alm/Almh {$report->deceased_name}",
                    'status' => 'completed',
                    'created_by' => $request->user()->id,
                ]);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Santunan duka RUKAM berhasil dicairkan kepada keluarga pelapor.',
            'data' => $report->fresh(['reporter.house', 'disburser', 'verifier']),
        ]);
    }

    /**
     * Summary Metrics for Dashboard
     */
    public function summary()
    {
        $totalDeceased = RukamReport::count();
        $totalDisbursed = (float) RukamReport::where('status', 'disbursed')->sum('disbursement_amount');
        $pendingVerification = RukamReport::where('status', 'reported')->count();
        $verifiedWaiting = RukamReport::where('status', 'verified')->count();

        $totalAmbulances = Ambulance::count();
        $ambulancesAvailable = Ambulance::where('status', 'available')->count();
        $ambulancesInService = Ambulance::where('status', 'in_service')->count();

        $activeBookings = AmbulanceBooking::whereIn('status', ['requested', 'dispatched'])->count();
        $completedTrips = AmbulanceBooking::where('status', 'completed')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_deceased' => $totalDeceased,
                'total_disbursed_nominal' => $totalDisbursed,
                'pending_verification' => $pendingVerification,
                'verified_waiting' => $verifiedWaiting,
                'total_ambulances' => $totalAmbulances,
                'ambulances_available' => $ambulancesAvailable,
                'ambulances_in_service' => $ambulancesInService,
                'active_bookings' => $activeBookings,
                'completed_trips' => $completedTrips,
            ],
        ]);
    }

    // ==========================================
    // AMBULANCE MANAGEMENT & BOOKING
    // ==========================================

    /**
     * List Ambulance Fleet
     */
    public function ambulances()
    {
        $ambulances = Ambulance::latest()->get();

        return response()->json([
            'success' => true,
            'data' => $ambulances,
        ]);
    }

    /**
     * Register Ambulance Fleet (Pengurus)
     */
    public function storeAmbulance(Request $request)
    {
        $validated = $request->validate([
            'vehicle_number' => 'required|string|max:20|unique:ambulances,vehicle_number',
            'name' => 'required|string|max:100',
            'type' => 'required|in:emergency,jenazah,multipurpose',
            'status' => 'nullable|in:available,in_service,maintenance',
            'driver_name' => 'nullable|string|max:100',
            'driver_phone' => 'nullable|string|max:30',
            'equipment' => 'nullable|array',
            'notes' => 'nullable|string',
        ]);

        $ambulance = Ambulance::create([
            'vehicle_number' => strtoupper(trim($validated['vehicle_number'])),
            'name' => $validated['name'],
            'type' => $validated['type'],
            'status' => $validated['status'] ?? 'available',
            'driver_name' => $validated['driver_name'] ?? null,
            'driver_phone' => $validated['driver_phone'] ?? null,
            'equipment' => $validated['equipment'] ?? ['Tabung Oksigen', 'Brankar Pasien', 'Kotak P3K', 'Sirine Siaga'],
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Armada ambulans siaga berhasil didaftarkan.',
            'data' => $ambulance,
        ], 201);
    }

    /**
     * Update Ambulance Fleet Status (Pengurus)
     */
    public function updateAmbulanceStatus(Request $request, $id)
    {
        $ambulance = Ambulance::findOrFail($id);

        $validated = $request->validate([
            'status' => 'nullable|in:available,in_service,maintenance',
            'driver_name' => 'nullable|string|max:100',
            'driver_phone' => 'nullable|string|max:30',
            'notes' => 'nullable|string',
        ]);

        $ambulance->update(array_filter($validated, fn ($val) => $val !== null));

        return response()->json([
            'success' => true,
            'message' => 'Status armada ambulans berhasil diperbarui.',
            'data' => $ambulance,
        ]);
    }

    /**
     * List Ambulance Bookings
     */
    public function bookings(Request $request)
    {
        $query = AmbulanceBooking::with(['user.house', 'ambulance', 'rukamReport', 'handler']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('service_type')) {
            $query->where('service_type', $request->service_type);
        }

        if ($request->boolean('my_bookings')) {
            $query->where('user_id', $request->user()->id);
        }

        $bookings = $query->latest()->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $bookings,
        ]);
    }

    /**
     * Book Ambulance (Warga / Emergency)
     */
    public function bookAmbulance(Request $request)
    {
        $validated = $request->validate([
            'patient_name' => 'required|string|max:100',
            'service_type' => 'required|in:emergency,rujukan,jenazah',
            'urgency_level' => 'required|in:urgent,scheduled',
            'pickup_address' => 'required|string|max:255',
            'destination_address' => 'required|string|max:255',
            'pickup_time' => 'nullable|date',
            'notes' => 'nullable|string',
            'ambulance_id' => 'nullable|exists:ambulances,id',
        ]);

        $bookingCode = 'AMB-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -5));

        $booking = AmbulanceBooking::create([
            'booking_code' => $bookingCode,
            'user_id' => $request->user()->id,
            'ambulance_id' => $validated['ambulance_id'] ?? null,
            'patient_name' => $validated['patient_name'],
            'service_type' => $validated['service_type'],
            'urgency_level' => $validated['urgency_level'],
            'pickup_address' => $validated['pickup_address'],
            'destination_address' => $validated['destination_address'],
            'pickup_time' => $validated['pickup_time'] ?? now(),
            'notes' => $validated['notes'] ?? null,
            'status' => 'requested',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Permintaan booking ambulans berhasil dibuat. Petugas piket & driver akan segera dikerahkan.',
            'data' => $booking->load(['user.house', 'ambulance']),
        ], 201);
    }

    /**
     * Dispatch Ambulance (Pengurus / Petugas Siaga)
     */
    public function dispatchAmbulance(Request $request, $id)
    {
        $booking = AmbulanceBooking::findOrFail($id);

        if ($booking->status !== 'requested') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya booking berstatus "requested" yang dapat didisposisikan/dikirim.',
            ], 422);
        }

        $validated = $request->validate([
            'ambulance_id' => 'required|exists:ambulances,id',
            'driver_name' => 'nullable|string|max:100',
            'driver_phone' => 'nullable|string|max:30',
        ]);

        DB::transaction(function () use ($booking, $validated, $request) {
            $ambulance = Ambulance::findOrFail($validated['ambulance_id']);

            $driverName = $validated['driver_name'] ?? $ambulance->driver_name ?? 'Driver Tim Siaga RW';
            $driverPhone = $validated['driver_phone'] ?? $ambulance->driver_phone ?? '081234567890';

            $booking->update([
                'ambulance_id' => $ambulance->id,
                'driver_name' => $driverName,
                'driver_phone' => $driverPhone,
                'status' => 'dispatched',
                'dispatched_at' => now(),
                'handled_by' => $request->user()->id,
            ]);

            $ambulance->update([
                'status' => 'in_service',
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Ambulans siaga berhasil ditugaskan dan meluncur ke lokasi penjemputan.',
            'data' => $booking->fresh(['ambulance', 'user.house', 'handler']),
        ]);
    }

    /**
     * Mark Trip Completed (Pengurus / Driver)
     */
    public function completeBooking(Request $request, $id)
    {
        $booking = AmbulanceBooking::findOrFail($id);

        if ($booking->status !== 'dispatched') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya booking berstatus "dispatched" yang dapat diselesaikan.',
            ], 422);
        }

        DB::transaction(function () use ($booking) {
            $booking->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);

            if ($booking->ambulance_id) {
                Ambulance::where('id', $booking->ambulance_id)->update([
                    'status' => 'available',
                ]);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Tugas ambulans telah selesai dengan selamat. Armada kembali siap siaga.',
            'data' => $booking->fresh(['ambulance', 'user.house']),
        ]);
    }

    /**
     * Cancel Booking
     */
    public function cancelBooking(Request $request, $id)
    {
        $booking = AmbulanceBooking::findOrFail($id);

        // Hanya pemohon atau pengurus yang boleh membatalkan
        if ($booking->user_id !== $request->user()->id && !$request->user()->isPengurus()) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki hak akses untuk membatalkan booking ini.',
            ], 403);
        }

        if (in_array($booking->status, ['completed', 'cancelled'])) {
            return response()->json([
                'success' => false,
                'message' => "Booking sudah dalam status {$booking->status}.",
            ], 422);
        }

        DB::transaction(function () use ($booking) {
            if ($booking->ambulance_id && $booking->status === 'dispatched') {
                Ambulance::where('id', $booking->ambulance_id)->update([
                    'status' => 'available',
                ]);
            }

            $booking->update([
                'status' => 'cancelled',
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Permintaan ambulans berhasil dibatalkan.',
            'data' => $booking->fresh(),
        ]);
    }
}
