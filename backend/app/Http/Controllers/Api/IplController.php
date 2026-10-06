<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\House;
use App\Models\IplBilling;
use App\Models\IplMaster;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class IplController extends Controller
{
    /**
     * List IPL Masters
     */
    public function indexMasters(Request $request)
    {
        $query = IplMaster::with('creator')->withCount('billings');

        if ($request->has('rt_number') && $request->rt_number && $request->rt_number !== 'all') {
            $query->where('rt_number', $request->rt_number);
        }

        if ($request->has('year') && $request->year) {
            $query->where('period_year', $request->year);
        }

        $masters = $query->orderBy('period_year', 'desc')
                         ->orderBy('period_month', 'asc')
                         ->orderBy('rt_number', 'asc')
                         ->get();

        return response()->json([
            'success' => true,
            'data' => $masters,
        ]);
    }

    /**
     * Create or Update Master IPL for an RT
     */
    public function storeMaster(Request $request)
    {
        $validated = $request->validate([
            'rt_number' => 'required|string|in:01,02,03',
            'period_month' => 'required|integer|between:1,12',
            'period_year' => 'required|integer|min:2024',
            'base_ipl_amount' => 'required|numeric|min:0',
            'rw_contribution_amount' => 'required|numeric|min:0',
        ]);

        $total = $validated['base_ipl_amount'] + $validated['rw_contribution_amount'];

        $master = IplMaster::updateOrCreate(
            [
                'rt_number' => $validated['rt_number'],
                'period_month' => $validated['period_month'],
                'period_year' => $validated['period_year'],
            ],
            [
                'base_ipl_amount' => $validated['base_ipl_amount'],
                'rw_contribution_amount' => $validated['rw_contribution_amount'],
                'total_amount' => $total,
                'created_by' => $request->user()->id,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "Master IPL RT {$master->rt_number} periode {$master->period_month}/{$master->period_year} berhasil disimpan.",
            'data' => $master,
        ]);
    }

    /**
     * Generate Mass Monthly Billings for all approved Warga in the RT
     */
    public function generateMonthlyBills(Request $request, $masterId)
    {
        $master = IplMaster::findOrFail($masterId);
        $user = $request->user();

        if ($user->role === 'rt' && $user->rt_number !== $master->rt_number) {
            return response()->json([
                'success' => false,
                'message' => 'Anda hanya berhak men-generate tagihan untuk RT ' . $user->rt_number,
            ], 403);
        }

        // Tagihan IPL berbasis UNIT RUMAH (1 Rumah = 1 Tagihan IPL per periode)
        // Ditagihkan kepada KK Utama (head_of_family_id) sebagai penanggung jawab rumah
        $houses = House::with(['headOfFamily', 'residents'])
            ->where('rt_number', $master->rt_number)
            ->where(function ($q) {
                $q->where('is_occupied', true)
                  ->orWhereNotNull('head_of_family_id');
            })
            ->get();

        $generatedCount = 0;
        $existingCount = 0;

        foreach ($houses as $house) {
            $existing = IplBilling::where('ipl_master_id', $master->id)
                ->where('house_id', $house->id)
                ->first();

            if ($existing) {
                $existingCount++;
                continue;
            }

            // Tentukan penanggung jawab (KK Utama, atau warga pertama disetujui)
            $debtorUserId = $house->head_of_family_id;
            if (!$debtorUserId) {
                $firstResident = $house->residents()->where('status', 'approved')->first();
                $debtorUserId = $firstResident?->id;
            }

            if (!$debtorUserId) {
                continue;
            }

            IplBilling::create([
                'ipl_master_id' => $master->id,
                'user_id' => $debtorUserId,
                'house_id' => $house->id,
                'amount' => $master->total_amount,
                'status' => 'unpaid',
            ]);

            $generatedCount++;
        }

        return response()->json([
            'success' => true,
            'message' => "Generate tagihan IPL berbasis unit rumah selesai. {$generatedCount} tagihan rumah dibuat ({$existingCount} sudah ada sebelumnya).",
            'data' => [
                'generated' => $generatedCount,
                'existing' => $existingCount,
            ]
        ]);
    }

    /**
     * Generate Monthly Billings by Period and RT (creates master if needed)
     */
    public function generateByPeriod(Request $request)
    {
        $validated = $request->validate([
            'rt_number' => 'required|string|in:01,02,03',
            'period_month' => 'required|integer|between:1,12',
            'period_year' => 'required|integer|min:2024',
        ]);

        $user = $request->user();
        if ($user->role === 'rt' && $user->rt_number !== $validated['rt_number']) {
            return response()->json([
                'success' => false,
                'message' => 'Anda hanya berhak men-generate tagihan untuk RT ' . $user->rt_number,
            ], 403);
        }

        $master = IplMaster::firstOrCreate(
            [
                'rt_number' => $validated['rt_number'],
                'period_month' => $validated['period_month'],
                'period_year' => $validated['period_year'],
            ],
            [
                'base_ipl_amount' => 30000,
                'rw_contribution_amount' => 20000,
                'total_amount' => 50000,
                'created_by' => $user->id,
            ]
        );

        return $this->generateMonthlyBills($request, $master->id);
    }

    /**
     * List Billings (Warga sees house bills, Pengurus sees RT/RW)
     */
    public function listBillings(Request $request)
    {
        $user = $request->user();
        $query = IplBilling::with(['master', 'user', 'house.headOfFamily', 'verifier']);

        if ($user->role === 'warga') {
            if ($user->house_id) {
                $query->where('house_id', $user->house_id);
            } else {
                $query->where('user_id', $user->id);
            }
        } else {
            if (in_array($user->role, ['rt', 'bendahara', 'sekretaris']) && $user->rt_number) {
                $query->whereHas('house', function ($q) use ($user) {
                    $q->where('rt_number', $user->rt_number);
                });
            } elseif ($request->has('rt_number') && $request->rt_number) {
                $query->whereHas('house', function ($q) use ($request) {
                    $q->where('rt_number', $request->rt_number);
                });
            }
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        $billings = $query->latest()->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $billings,
        ]);
    }

    /**
     * Pay IPL Billing via Warga Wallet (Instant)
     */
    public function payViaWallet(Request $request, $id)
    {
        $user = $request->user();
        $billing = IplBilling::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        if ($billing->status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Tagihan ini sudah lunas sebelumnya.',
            ], 422);
        }

        $wallet = Wallet::firstOrCreate(['user_id' => $user->id], ['balance' => 0.00]);

        if ($wallet->balance < $billing->amount) {
            return response()->json([
                'success' => false,
                'message' => 'Saldo Dompet Warga tidak mencukupi (Saldo: Rp ' . number_format($wallet->balance, 0, ',', '.') . '). Silakan lakukan Top-Up terlebih dahulu.',
            ], 422);
        }

        DB::transaction(function () use ($wallet, $billing, $user) {
            // Deduct wallet
            $wallet->balance -= $billing->amount;
            $wallet->save();

            // Record transaction
            WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'user_id' => $user->id,
                'type' => 'debit',
                'category' => 'ipl_payment',
                'amount' => $billing->amount,
                'reference_id' => 'IPL-' . $billing->id,
                'description' => "Pembayaran IPL Periode {$billing->master->period_month}/{$billing->master->period_year}",
                'status' => 'completed',
            ]);

            // Update billing
            $billing->update([
                'status' => 'paid',
                'payment_method' => 'wallet',
                'paid_at' => now(),
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Pembayaran IPL berhasil dipotong dari Dompet Warga. Status tagihan: LUNAS.',
            'data' => [
                'billing' => $billing->fresh(['master', 'house']),
                'remaining_balance' => $wallet->fresh()->balance,
            ]
        ]);
    }

    /**
     * Pay IPL Billing via Transfer/QRIS Upload Proof
     */
    public function payViaUpload(Request $request, $id)
    {
        $user = $request->user();
        $billing = IplBilling::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $request->validate([
            'payment_method' => 'required|in:transfer,qris',
            'proof_image' => 'required|image|max:5120', // max 5MB
        ]);

        $path = $request->file('proof_image')->store('payment_proofs', 'public');

        $billing->update([
            'status' => 'waiting_verification',
            'payment_method' => $request->payment_method,
            'payment_proof_path' => '/storage/' . $path,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Bukti pembayaran berhasil diunggah. Menunggu verifikasi dari Bendahara atau Pengurus RT.',
            'data' => $billing->fresh(['master', 'house']),
        ]);
    }

    /**
     * Verify IPL Billing Payment (Bendahara or RT)
     */
    public function verifyPayment(Request $request, $id)
    {
        $user = $request->user();
        $billing = IplBilling::with('master')->findOrFail($id);

        if (in_array($user->role, ['rt', 'bendahara']) && $user->rt_number && $user->rt_number !== $billing->master->rt_number) {
            return response()->json([
                'success' => false,
                'message' => 'Anda hanya berhak memverifikasi pembayaran RT ' . $user->rt_number,
            ], 403);
        }

        $request->validate([
            'action' => 'required|in:approve,reject',
            'notes' => 'nullable|string',
        ]);

        if ($request->action === 'approve') {
            $billing->update([
                'status' => 'paid',
                'verified_by' => $user->id,
                'paid_at' => now(),
            ]);

            $message = 'Pembayaran IPL berhasil diverifikasi (LUNAS).';
        } else {
            $billing->update([
                'status' => 'unpaid',
                'payment_proof_path' => null,
            ]);

            $message = 'Pembayaran IPL ditolak. Warga perlu mengunggah ulang bukti bayar yang sah.';
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $billing->fresh(['master', 'house', 'user', 'verifier']),
        ]);
    }

    /**
     * Rekapitulasi Kas RT ke RW
     */
    public function rekapKasRtToRw(Request $request)
    {
        $periodMonth = $request->get('period_month', now()->month);
        $periodYear = $request->get('period_year', now()->year);

        $rekap = [];

        foreach (['01', '02', '03'] as $rtNum) {
            $master = IplMaster::where('rt_number', $rtNum)
                ->where('period_month', $periodMonth)
                ->where('period_year', $periodYear)
                ->first();

            $paidCount = 0;
            $unpaidCount = 0;
            $totalKasRt = 0;
            $totalSetoranRw = 0;

            if ($master) {
                $paidCount = IplBilling::where('ipl_master_id', $master->id)->where('status', 'paid')->count();
                $unpaidCount = IplBilling::where('ipl_master_id', $master->id)->where('status', '!=', 'paid')->count();

                $totalKasRt = $paidCount * $master->base_ipl_amount;
                $totalSetoranRw = $paidCount * $master->rw_contribution_amount;
            }

            $rekap[] = [
                'rt_number' => $rtNum,
                'period' => "{$periodMonth}/{$periodYear}",
                'paid_warga_count' => $paidCount,
                'unpaid_warga_count' => $unpaidCount,
                'kas_rt_terkumpul' => $totalKasRt,
                'setoran_rw_wajib' => $totalSetoranRw,
                'total_iuran' => $totalKasRt + $totalSetoranRw,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $rekap,
        ]);
    }

    /**
     * Kalender 12 Bulan Pembayaran IPL Warga (Filter per Tahun)
     */
    public function getAnnualCalendar(Request $request)
    {
        $user = $request->user();
        $year = (int) $request->get('year', Carbon::now()->year);

        $houseId = $request->get('house_id', $user->house_id);

        if (!$houseId) {
            return response()->json([
                'success' => false,
                'message' => 'Data unit rumah tidak ditemukan.',
            ], 422);
        }

        $house = House::with(['headOfFamily', 'kkPendukung'])->findOrFail($houseId);

        $monthNames = [
            1 => 'Januari',
            2 => 'Februari',
            3 => 'Maret',
            4 => 'April',
            5 => 'Mei',
            6 => 'Juni',
            7 => 'Juli',
            8 => 'Agustus',
            9 => 'September',
            10 => 'Oktober',
            11 => 'November',
            12 => 'Desember'
        ];

        // Ambil seluruh billings untuk rumah ini di tahun yang dipilih
        $billings = IplBilling::with(['master', 'verifier'])
            ->where('house_id', $houseId)
            ->whereHas('master', function ($q) use ($year) {
                $q->where('period_year', $year);
            })
            ->get()
            ->keyBy(function ($item) {
                return $item->master->period_month;
            });

        $calendar = [];
        $totalPaid = 0;
        $totalUnpaid = 0;
        $paidCount = 0;
        $pendingCount = 0;
        $unpaidCount = 0;
        $notGeneratedCount = 0;

        for ($m = 1; $m <= 12; $m++) {
            $billing = $billings->get($m);

            if ($billing) {
                $status = $billing->status; // 'unpaid', 'waiting_verification', 'paid'
                $amount = (float) $billing->amount;
                $baseRt = (float) $billing->master->base_ipl_amount;
                $baseRw = (float) $billing->master->rw_contribution_amount;
                $paidAt = $billing->paid_at;
                $paymentMethod = $billing->payment_method;
                $verifierName = $billing->verifier?->name;
                $proofPath = $billing->payment_proof_path;
                $billingId = $billing->id;
                $isGenerated = true;
            } else {
                $status = 'not_generated'; // Tagihan belum diterbitkan oleh pengurus RT
                $baseRt = 30000.00;
                $baseRw = 20000.00;
                $amount = 50000.00;
                $paidAt = null;
                $paymentMethod = null;
                $verifierName = null;
                $proofPath = null;
                $billingId = null;
                $isGenerated = false;
            }

            if ($status === 'paid') {
                $paidCount++;
                $totalPaid += $amount;
            } elseif ($status === 'waiting_verification') {
                $pendingCount++;
            } elseif ($status === 'unpaid') {
                $unpaidCount++;
                $totalUnpaid += $amount;
            } else {
                $notGeneratedCount++;
            }

            $calendar[] = [
                'month' => $m,
                'month_name' => $monthNames[$m],
                'year' => $year,
                'billing_id' => $billingId,
                'is_generated' => $isGenerated,
                'status' => $status,
                'amount' => $amount,
                'base_ipl_amount' => $baseRt,
                'rw_contribution_amount' => $baseRw,
                'payment_method' => $paymentMethod,
                'payment_proof_path' => $proofPath,
                'paid_at' => $paidAt,
                'verified_by_name' => $verifierName,
            ];
        }

        return response()->json([
            'success' => true,
            'year' => $year,
            'house' => [
                'id' => $house->id,
                'house_code' => $house->house_code,
                'full_address' => $house->full_address,
                'rt_number' => $house->rt_number,
                'head_of_family' => $house->headOfFamily,
            ],
            'statistics' => [
                'total_months' => 12,
                'paid_months' => $paidCount,
                'pending_months' => $pendingCount,
                'unpaid_months' => $unpaidCount,
                'not_generated_months' => $notGeneratedCount,
                'total_paid' => $totalPaid,
                'total_unpaid' => $totalUnpaid,
            ],
            'data' => $calendar,
        ]);
    }

    /**
     * Bayar Iuran IPL Warga via QRIS Standar (Status Menjadi Waiting Verification / Pending)
     */
    public function payViaQris(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'year' => 'required|integer|min:2024|max:2030',
            'month' => 'required|integer|between:1,12',
            'proof_image' => 'nullable|image|max:5120',
            'reference_note' => 'nullable|string|max:255',
        ]);

        if (!$user->house_id) {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda belum terhubung dengan nomor unit rumah.',
            ], 422);
        }

        $house = House::with('headOfFamily')->findOrFail($user->house_id);

        $monthNames = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
        ];
        $monthName = $monthNames[$validated['month']];

        // Cari master IPL untuk periode tersebut
        $master = IplMaster::where('rt_number', $house->rt_number)
            ->where('period_month', $validated['month'])
            ->where('period_year', $validated['year'])
            ->first();

        if (!$master) {
            return response()->json([
                'success' => false,
                'message' => "Tagihan IPL untuk periode {$monthName} {$validated['year']} belum diterbitkan oleh Pengurus RT. Anda hanya dapat membayar tagihan yang telah resmi diterbitkan.",
            ], 422);
        }

        // Cari billing yang sudah ada untuk unit rumah ini
        $billing = IplBilling::where('ipl_master_id', $master->id)
            ->where('house_id', $house->id)
            ->first();

        if (!$billing) {
            return response()->json([
                'success' => false,
                'message' => "Tagihan IPL untuk unit rumah Anda pada periode {$monthName} {$validated['year']} belum diterbitkan oleh Pengurus RT.",
            ], 422);
        }

        if ($billing->status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Iuran periode ini sudah lunas sebelumnya.',
            ], 422);
        }

        if ($billing->status === 'waiting_verification') {
            return response()->json([
                'success' => false,
                'message' => 'Pembayaran untuk periode ini sedang dalam antrean verifikasi Bendahara RT.',
            ], 422);
        }

        $proofPath = null;
        if ($request->hasFile('proof_image')) {
            $path = $request->file('proof_image')->store('payment_proofs', 'public');
            $proofPath = '/storage/' . $path;
        }

        $updateData = [
            'status' => 'waiting_verification',
            'payment_method' => 'qris',
        ];
        if ($proofPath) {
            $updateData['payment_proof_path'] = $proofPath;
        }
        $billing->update($updateData);

        $monthNames = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
        ];
        $monthName = $monthNames[$validated['month']];

        return response()->json([
            'success' => true,
            'message' => "Pembayaran QRIS bulan {$monthName} {$validated['year']} berhasil dikirim! Status saat ini: MENUNGGU VERIFIKASI BENDAHARA. Status akan menjadi LUNAS setelah Bendahara meng-ACC.",
            'data' => $billing->fresh(['master', 'house']),
        ]);
    }
}
