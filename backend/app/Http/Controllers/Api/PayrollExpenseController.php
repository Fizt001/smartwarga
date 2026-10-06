<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\House;
use App\Models\IplBilling;
use App\Models\IplMaster;
use App\Models\OperationalExpense;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PayrollExpenseController extends Controller
{
    /**
     * Financial Summary & Cash Flow Analysis (IPL In vs Payroll/Expenses Out)
     */
    public function summary(Request $request)
    {
        $user = $request->user();
        $month = (int) $request->get('month', Carbon::now()->month);
        $year = (int) $request->get('year', Carbon::now()->year);

        // 1. Data Unit Rumah & KK
        $totalHouses = House::count();
        $occupiedHouses = House::where('is_occupied', true)->count();

        // 2. Data Penerimaan IPL Terkumpul (Bulan ini)
        $paidBillings = IplBilling::with('master')
            ->where('status', 'paid')
            ->whereHas('master', function ($q) use ($month, $year) {
                $q->where('period_month', $month)->where('period_year', $year);
            })
            ->get();

        $paidCount = $paidBillings->count();
        $totalCollected = $paidBillings->sum('amount');

        // Revenue Sharing Calculation (60% RT, 40% RW)
        $totalKasRt = 0;
        $totalKasRw = 0;
        foreach ($paidBillings as $b) {
            $totalKasRt += (float) ($b->master->base_ipl_amount ?? 30000);
            $totalKasRw += (float) ($b->master->rw_contribution_amount ?? 20000);
        }

        // 3. Pengeluaran Rutin (Gaji Satpam, Uang Sampah, Operasional)
        $expensesQuery = OperationalExpense::where('period_month', $month)
            ->where('period_year', $year);

        if ($user->role === 'rt' || ($user->role === 'bendahara' && $user->rt_number)) {
            // RT level view
            $expenses = (clone $expensesQuery)->where('level', 'rt')->where('rt_number', $user->rt_number)->get();
        } else {
            // RW / Admin view
            $expenses = (clone $expensesQuery)->get();
        }

        $totalRwExpenses = OperationalExpense::where('period_month', $month)
            ->where('period_year', $year)
            ->where('level', 'rw')
            ->sum('amount');

        $totalRtExpenses = OperationalExpense::where('period_month', $month)
            ->where('period_year', $year)
            ->where('level', 'rt')
            ->sum('amount');

        $gajiSatpamTotal = OperationalExpense::where('period_month', $month)
            ->where('period_year', $year)
            ->where('category', 'gaji_satpam')
            ->sum('amount');

        $uangSampahTotal = OperationalExpense::where('period_month', $month)
            ->where('period_year', $year)
            ->where('category', 'uang_sampah')
            ->sum('amount');

        // 4. Analisis Kelayakan & Break-Even (Apakah Kas Cukup?)
        // Standard RW Fixed Cost: Satpam (e.g. Rp 3.500.000) + Sampah Terpadu (e.g. Rp 1.500.000) = Rp 5.000.000
        $rwFixedLoad = $totalRwExpenses > 0 ? (float) $totalRwExpenses : 5000000.00;
        $rwPerKkRate = 20000.00; // 40% dari IPL Rp 50.000
        $breakEvenKkRw = ceil($rwFixedLoad / $rwPerKkRate); // Berapa KK harus bayar agar RW cukup gaji satpam & sampah

        $rwNetCashFlow = $totalKasRw - $totalRwExpenses;
        $rtNetCashFlow = $totalKasRt - $totalRtExpenses;

        $isRwSurplus = $rwNetCashFlow >= 0;
        $rwCoverageRatio = $rwFixedLoad > 0 ? round(($totalKasRw / $rwFixedLoad) * 100, 1) : 100;

        return response()->json([
            'success' => true,
            'period' => [
                'month' => $month,
                'year' => $year,
            ],
            'demographics' => [
                'total_units' => $totalHouses,
                'occupied_units' => $occupiedHouses,
                'paid_kk_count' => $paidCount,
                'unpaid_kk_count' => max(0, $occupiedHouses - $paidCount),
            ],
            'income' => [
                'total_ipl_collected' => (float) $totalCollected,
                'kas_rt_portion_60' => (float) $totalKasRt,
                'kas_rw_portion_40' => (float) $totalKasRw,
            ],
            'expenses' => [
                'total_rw_expenses' => (float) $totalRwExpenses,
                'total_rt_expenses' => (float) $totalRtExpenses,
                'breakdown' => [
                    'gaji_satpam' => (float) $gajiSatpamTotal,
                    'uang_sampah' => (float) $uangSampahTotal,
                    'kebersihan_rt' => (float) OperationalExpense::where('period_month', $month)->where('period_year', $year)->where('category', 'kebersihan_lingkungan')->sum('amount'),
                    'listrik_fasum_iot' => (float) OperationalExpense::where('period_month', $month)->where('period_year', $year)->where('category', 'listrik_iot_fasum')->sum('amount'),
                ],
            ],
            'cash_flow_health' => [
                'rw_net_balance' => (float) $rwNetCashFlow,
                'is_rw_surplus' => $isRwSurplus,
                'rw_coverage_ratio_percent' => $rwCoverageRatio,
                'break_even_kk_required' => (int) $breakEvenKkRw,
                'current_paid_kk' => $paidCount,
                'deficit_warning' => !$isRwSurplus ? "Kas RW defisit sebesar Rp " . number_format(abs($rwNetCashFlow), 0, ',', '.') . ". Butuh minimal {$breakEvenKkRw} KK lunas iuran tepat waktu untuk menutup beban operasional Satpam & Sampah." : "Kas RW SURPLUS dan aman.",
            ],
        ]);
    }

    /**
     * List Operational Expenses / Payroll Records
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = OperationalExpense::with(['creator', 'approver', 'disburser']);

        if ($user->role === 'rt' || ($user->role === 'bendahara' && $user->rt_number)) {
            $query->where('level', 'rt')->where('rt_number', $user->rt_number);
        } elseif ($request->has('level') && $request->level) {
            $query->where('level', $request->level);
            if ($request->level === 'rt' && $request->has('rt_number') && $request->rt_number) {
                $query->where('rt_number', $request->rt_number);
            }
        }

        if ($request->has('category') && $request->category) {
            $query->where('category', $request->category);
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        if ($request->has('month') && $request->month) {
            $query->where('period_month', $request->month);
        }

        if ($request->has('year') && $request->year) {
            $query->where('period_year', $request->year);
        }

        $records = $query->orderBy('status', 'asc')->latest()->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $records,
        ]);
    }

    /**
     * Create New Expense / Payroll (Bendahara / Pengurus)
     */
    public function store(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->role, ['rw', 'rt', 'bendahara', 'super_admin'])) {
            return response()->json(['message' => 'Hanya Pengurus atau Bendahara yang dapat mengajukan pengeluaran/gaji.'], 403);
        }

        $validated = $request->validate([
            'level' => 'required|in:rt,rw',
            'rt_number' => 'nullable|string|max:10',
            'category' => 'required|in:gaji_satpam,uang_sampah,kebersihan_lingkungan,listrik_iot_fasum,honor_operasional,perawatan_fasum,lainnya',
            'title' => 'required|string|max:255',
            'recipient_name' => 'required|string|max:255',
            'recipient_role' => 'nullable|string|max:255',
            'amount' => 'required|numeric|min:1000',
            'period_month' => 'required|integer|between:1,12',
            'period_year' => 'required|integer|min:2024|max:2030',
            'payment_method' => 'nullable|string|in:transfer,tunai',
            'notes' => 'nullable|string',
        ]);

        if ($validated['level'] === 'rt') {
            $rtNumber = $user->role === 'rt' ? $user->rt_number : ($validated['rt_number'] ?? $user->rt_number ?? '01');
        } else {
            $rtNumber = null;
        }

        $isChairman = in_array($user->role, ['rw', 'rt', 'super_admin']);

        $expense = OperationalExpense::create([
            'level' => $validated['level'],
            'rt_number' => $rtNumber,
            'category' => $validated['category'],
            'title' => $validated['title'],
            'recipient_name' => $validated['recipient_name'],
            'recipient_role' => $validated['recipient_role'] ?? null,
            'amount' => $validated['amount'],
            'period_month' => $validated['period_month'],
            'period_year' => $validated['period_year'],
            'payment_method' => $validated['payment_method'] ?? 'transfer',
            'status' => $isChairman ? 'approved' : 'draft',
            'created_by' => $user->id,
            'approved_by' => $isChairman ? $user->id : null,
            'approved_at' => $isChairman ? now() : null,
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Data pengeluaran/gaji berhasil dicatat' . ($isChairman ? ' dan disetujui langsung oleh Ketua.' : '. Menunggu ACC Ketua RT/RW.'),
            'data' => $expense->fresh(['creator', 'approver']),
        ], 201);
    }

    /**
     * Approve Expense (Ketua RT for RT level, Ketua RW for RW level)
     */
    public function approve(Request $request, $id)
    {
        $user = $request->user();
        $expense = OperationalExpense::findOrFail($id);

        if (!in_array($user->role, ['rw', 'rt', 'super_admin'])) {
            return response()->json(['message' => 'Hanya Ketua RT atau Ketua RW yang berwenang menyetujui pengeluaran dana.'], 403);
        }

        if ($expense->level === 'rt' && $user->role === 'rt' && $user->rt_number !== $expense->rt_number) {
            return response()->json(['message' => 'Anda hanya berwenang menyetujui pengeluaran untuk RT Anda sendiri.'], 403);
        }

        $expense->update([
            'status' => 'approved',
            'approved_by' => $user->id,
            'approved_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Pengeluaran '{$expense->title}' berhasil disetujui. Bendahara dapat segera mencairkan dana.",
            'data' => $expense->fresh(['creator', 'approver']),
        ]);
    }

    /**
     * Disburse Expense / Mark as Paid (Bendahara RT / Bendahara RW)
     */
    public function disburse(Request $request, $id)
    {
        $user = $request->user();
        $expense = OperationalExpense::findOrFail($id);

        if (!in_array($user->role, ['bendahara', 'rw', 'rt', 'super_admin'])) {
            return response()->json(['message' => 'Hanya Bendahara atau Pengurus yang dapat merealisasikan pencairan dana.'], 403);
        }

        if ($expense->status === 'paid') {
            return response()->json(['message' => 'Pengeluaran ini sudah dicairkan sebelumnya.'], 422);
        }

        $proofPath = null;
        if ($request->hasFile('proof_image')) {
            $path = $request->file('proof_image')->store('expense_proofs', 'public');
            $proofPath = '/storage/' . $path;
        }

        $expense->update([
            'status' => 'paid',
            'disbursed_by' => $user->id,
            'paid_at' => now(),
            'payment_date' => now(),
            'proof_path' => $proofPath ?? $expense->proof_path,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Pencairan dana untuk '{$expense->title}' sebesar Rp " . number_format($expense->amount, 0, ',', '.') . " berhasil dicatat LUNAS.",
            'data' => $expense->fresh(['creator', 'approver', 'disburser']),
        ]);
    }

    /**
     * Audit Feasibility & Financial Stress Test (Kecukupan Kas IPL vs Beban Gaji & Sampah)
     */
    public function auditSimulation(Request $request)
    {
        $totalHouses = House::count(); // 300 unit
        $occupiedHouses = House::where('is_occupied', true)->count(); // Current occupied

        // Model Beban Biaya Rutin Standar Perumahan (Benchmark Real)
        $standardRwBudget = [
            'gaji_satpam_utama' => 2500000, // Satpam 1 (Siang/Malam)
            'gaji_satpam_kedua' => 2000000, // Satpam 2 (Shift Gantian)
            'uang_sampah_induk' => 1200000, // Truk armada TPS / Dinas LH
            'listrik_pos_dan_iot' => 300000, // Listrik gerbang & WiFi Node ESP32
            'total_beban_rw_bulanan' => 6000000,
        ];

        $standardRtBudget = [
            'petugas_kebersihan_lorong' => 1000000,
            'perawatan_lampu_lorong' => 300000,
            'logistik_ronda_malam' => 500000,
            'total_beban_per_rt' => 1800000,
        ];

        $iplPrice = 50000;
        $rwPortion = 20000; // 40%
        $rtPortion = 30000; // 60%

        // Skenario 1: Kapasitas Penuh (300 KK Patuh 100%)
        $sc1IncomeRw = 300 * $rwPortion; // Rp 6.000.000
        $sc1NetRw = $sc1IncomeRw - $standardRwBudget['total_beban_rw_bulanan']; // Rp 0 (Pas / Balance)
        $sc1IncomeRt = 100 * $rtPortion; // Rp 3.000.000 per RT
        $sc1NetRt = $sc1IncomeRt - $standardRtBudget['total_beban_per_rt']; // + Rp 1.200.000 (Surplus)

        // Skenario 2: 70% Okupansi / Kepatuhan (210 KK)
        $sc2IncomeRw = 210 * $rwPortion; // Rp 4.200.000
        $sc2NetRw = $sc2IncomeRw - $standardRwBudget['total_beban_rw_bulanan']; // - Rp 1.800.000 (Defisit)

        // Titik Impas (Break-Even Point)
        $bepKkRw = ceil($standardRwBudget['total_beban_rw_bulanan'] / $rwPortion); // 300 KK
        $bepKkRt = ceil($standardRtBudget['total_beban_per_rt'] / $rtPortion); // 60 KK per RT

        return response()->json([
            'success' => true,
            'unit_parameters' => [
                'total_units_housing' => $totalHouses,
                'monthly_ipl_per_kk' => $iplPrice,
                'rw_portion_per_kk_40' => $rwPortion,
                'rt_portion_per_kk_60' => $rtPortion,
            ],
            'benchmark_costs' => [
                'rw_level' => $standardRwBudget,
                'rt_level' => $standardRtBudget,
            ],
            'scenarios' => [
                'full_capacity_300_kk' => [
                    'total_kk' => 300,
                    'total_ipl' => 300 * $iplPrice,
                    'kas_rw_collected' => $sc1IncomeRw,
                    'beban_rw' => $standardRwBudget['total_beban_rw_bulanan'],
                    'status_rw' => $sc1NetRw >= 0 ? 'SURPLUS / SEIMBANG' : 'DEFISIT',
                    'sisa_kas_rw' => $sc1NetRw,
                    'kas_rt_collected_per_rt' => $sc1IncomeRt,
                    'beban_rt' => $standardRtBudget['total_beban_per_rt'],
                    'status_rt' => 'SURPLUS AMAN',
                    'sisa_kas_rt' => $sc1NetRt,
                    'kesimpulan' => 'Jika 300 KK warga membayar tepat waktu tanpa menunggak, seluruh gaji 2 satpam, armada truk sampah, dan fasilitas lorong TERBAYAR LUNAS 100% dengan sisa kas cadangan per RT Rp 1.200.000/bulan.',
                ],
                'partial_compliance_210_kk' => [
                    'total_kk' => 210,
                    'kas_rw_collected' => $sc2IncomeRw,
                    'beban_rw' => $standardRwBudget['total_beban_rw_bulanan'],
                    'status_rw' => 'DEFISIT Rp 1.800.000',
                    'kesimpulan' => 'Jika 30% warga menunggak, Kas RW akan mengalami defisit sehingga satpam dan sampah terancam tertunda pembayarannya.',
                ],
            ],
            'break_even_rule' => [
                'minimum_kk_rw_must_pay' => $bepKkRw,
                'minimum_kk_rt_must_pay' => $bepKkRt,
                'critical_finding' => "Agar seluruh biaya gaji satpam dan sampah terpenuhi secara mandiri tanpa subsidi developer, perumahan wajib memiliki minimal {$bepKkRw} KK aktif yang membayar iuran rutin Rp 50.000 setiap bulannya.",
            ],
        ]);
    }
}
