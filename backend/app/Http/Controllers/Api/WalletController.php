<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WalletController extends Controller
{
    /**
     * Get Current User Wallet Balance
     */
    public function getBalance(Request $request)
    {
        $wallet = Wallet::firstOrCreate(
            ['user_id' => $request->user()->id],
            ['balance' => 0.00]
        );

        return response()->json([
            'success' => true,
            'data' => [
                'wallet_id' => $wallet->id,
                'balance' => $wallet->balance,
                'user_name' => $request->user()->name,
            ]
        ]);
    }

    /**
     * Get Current User Wallet Transactions History
     */
    public function getTransactions(Request $request)
    {
        $transactions = WalletTransaction::where('user_id', $request->user()->id)
            ->latest()
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $transactions,
        ]);
    }

    /**
     * Request Top-Up via Transfer / QRIS
     */
    public function requestTopup(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:10000',
            'proof_image' => 'required|image|max:5120',
            'description' => 'nullable|string|max:255',
        ]);

        $wallet = Wallet::firstOrCreate(
            ['user_id' => $request->user()->id],
            ['balance' => 0.00]
        );

        $path = $request->file('proof_image')->store('topup_proofs', 'public');

        $transaction = WalletTransaction::create([
            'wallet_id' => $wallet->id,
            'user_id' => $request->user()->id,
            'type' => 'credit',
            'category' => 'topup',
            'amount' => $validated['amount'],
            'reference_id' => 'TOPUP-' . time() . '-' . $request->user()->id,
            'description' => $validated['description'] ?? 'Pengajuan Top-Up Saldo Dompet Warga',
            'status' => 'pending',
            'proof_path' => '/storage/' . $path,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengajuan Top-Up berhasil diajukan. Menunggu verifikasi dari Bendahara.',
            'data' => $transaction,
        ], 201);
    }

    /**
     * List Pending Top-Up Requests (For Bendahara / Admin)
     */
    public function listPendingTopups(Request $request)
    {
        $transactions = WalletTransaction::with('user')
            ->where('category', 'topup')
            ->where('status', 'pending')
            ->latest()
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $transactions,
        ]);
    }

    /**
     * Verify Top-Up Request (Bendahara)
     */
    public function verifyTopup(Request $request, $id)
    {
        $transaction = WalletTransaction::with('wallet')->findOrFail($id);

        if ($transaction->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Transaksi ini sudah diproses sebelumnya.',
            ], 422);
        }

        $request->validate([
            'action' => 'required|in:approve,reject',
            'notes' => 'nullable|string',
        ]);

        if ($request->action === 'approve') {
            DB::transaction(function () use ($transaction, $request) {
                // Add balance
                $wallet = $transaction->wallet;
                $wallet->balance += $transaction->amount;
                $wallet->save();

                $transaction->update([
                    'status' => 'completed',
                    'created_by' => $request->user()->id,
                ]);
            });

            $message = 'Top-Up berhasil diverifikasi. Saldo dompet warga telah bertambah.';
        } else {
            $transaction->update([
                'status' => 'rejected',
                'created_by' => $request->user()->id,
            ]);

            $message = 'Pengajuan Top-Up ditolak.';
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $transaction->fresh(['wallet', 'user']),
        ]);
    }
}
