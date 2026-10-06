<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KoperasiLoan;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class KoperasiController extends Controller
{
    /**
     * List Loans
     */
    public function listLoans(Request $request)
    {
        $user = $request->user();
        $query = KoperasiLoan::with(['user.house', 'approver']);

        if ($user->role === 'warga') {
            $query->where('user_id', $user->id);
        } elseif ($user->role === 'rt') {
            $query->whereHas('user', function ($q) use ($user) {
                $q->where('rt_number', $user->rt_number);
            });
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        $loans = $query->latest()->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $loans,
        ]);
    }

    /**
     * Apply for Koperasi Loan (Warga)
     */
    public function applyLoan(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:500000|max:10000000',
            'tenor_months' => 'required|integer|in:3,6,12,24',
            'purpose' => 'required|string|max:500',
        ]);

        // Monthly installment calculation: principal / tenor + modest 1% admin fee per month
        $principal = $validated['amount'];
        $tenor = $validated['tenor_months'];
        $monthlyFee = $principal * 0.01;
        $monthlyInstallment = ($principal / $tenor) + $monthlyFee;

        $loan = KoperasiLoan::create([
            'user_id' => $request->user()->id,
            'amount' => $principal,
            'tenor_months' => $tenor,
            'monthly_installment' => round($monthlyInstallment, 2),
            'purpose' => $validated['purpose'],
            'status' => 'submitted',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengajuan pinjaman koperasi berhasil dikirim. Menunggu persetujuan Pengurus / Bendahara Koperasi.',
            'data' => $loan->load('user.house'),
        ], 201);
    }

    /**
     * Approve and Disburse Loan (Bendahara / Pengurus)
     */
    public function approveLoan(Request $request, $id)
    {
        $user = $request->user();
        if (!in_array($user->role, ['bendahara', 'rt', 'rw', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya Pengurus atau Bendahara Koperasi yang berhak memproses pinjaman.',
            ], 403);
        }

        $loan = KoperasiLoan::with('user')->findOrFail($id);

        if ($user->role === 'rt' && $user->rt_number && $loan->user->rt_number && $user->rt_number !== $loan->user->rt_number) {
            return response()->json([
                'success' => false,
                'message' => 'Anda hanya berhak memproses pinjaman warga di RT ' . $user->rt_number,
            ], 403);
        }

        if ($loan->status !== 'submitted') {
            return response()->json([
                'success' => false,
                'message' => 'Pengajuan pinjaman ini sudah diproses sebelumnya.',
            ], 422);
        }

        $request->validate([
            'action' => 'required|in:approve,reject',
            'disburse_to_wallet' => 'boolean',
        ]);

        if ($request->action === 'approve') {
            DB::transaction(function () use ($loan, $request) {
                $loan->update([
                    'status' => 'disbursed',
                    'approved_by' => $request->user()->id,
                    'disbursed_at' => now(),
                ]);

                // Optionally disburse funds directly to user's wallet
                if ($request->get('disburse_to_wallet', true)) {
                    $wallet = Wallet::firstOrCreate(['user_id' => $loan->user_id], ['balance' => 0.00]);
                    $wallet->balance += $loan->amount;
                    $wallet->save();

                    WalletTransaction::create([
                        'wallet_id' => $wallet->id,
                        'user_id' => $loan->user_id,
                        'type' => 'credit',
                        'category' => 'loan_disbursement',
                        'amount' => $loan->amount,
                        'reference_id' => 'KOP-DISBURSE-' . $loan->id,
                        'description' => "Pencairan Pinjaman Koperasi Tenor {$loan->tenor_months} Bulan",
                        'status' => 'completed',
                        'created_by' => $request->user()->id,
                    ]);
                }
            });

            $message = 'Pinjaman koperasi disetujui dan dana telah dicairkan ke Dompet Warga.';
        } else {
            $loan->update([
                'status' => 'rejected',
                'approved_by' => $request->user()->id,
            ]);

            $message = 'Pengajuan pinjaman koperasi ditolak.';
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $loan->fresh(['user.house', 'approver']),
        ]);
    }
}
