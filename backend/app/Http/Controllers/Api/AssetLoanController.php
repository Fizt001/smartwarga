<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\AssetLoan;
use Illuminate\Http\Request;

class AssetLoanController extends Controller
{
    /**
     * List Assets Available
     */
    public function indexAssets(Request $request)
    {
        $query = Asset::query();

        if ($request->has('rt_number') && $request->rt_number) {
            $query->where('rt_number', $request->rt_number);
        }

        $assets = $query->get();

        return response()->json([
            'success' => true,
            'data' => $assets,
        ]);
    }

    /**
     * Request Asset Loan (Warga)
     */
    public function requestLoan(Request $request)
    {
        $validated = $request->validate([
            'asset_id' => 'required|exists:assets,id',
            'quantity' => 'required|integer|min:1',
            'loan_date' => 'required|date',
            'return_date' => 'required|date|after_or_equal:loan_date',
            'donation_amount' => 'nullable|numeric|min:0',
        ]);

        $asset = Asset::findOrFail($validated['asset_id']);

        if ($asset->quantity < $validated['quantity']) {
            return response()->json([
                'success' => false,
                'message' => "Stok aset tidak mencukupi (Tersedia: {$asset->quantity} unit).",
            ], 422);
        }

        $loan = AssetLoan::create([
            'asset_id' => $asset->id,
            'user_id' => $request->user()->id,
            'quantity' => $validated['quantity'],
            'loan_date' => $validated['loan_date'],
            'return_date' => $validated['return_date'],
            'status' => 'requested',
            'donation_amount' => $validated['donation_amount'] ?? 0,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengajuan peminjaman aset berhasil dikirim. Menunggu persetujuan Pengurus RT.',
            'data' => $loan->load(['asset', 'user.house']),
        ], 201);
    }

    /**
     * Store New Asset (Pengurus)
     */
    public function storeAsset(Request $request)
    {
        $user = $request->user();
        if (!in_array($user->role, ['rt', 'rw', 'sekretaris', 'bendahara', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya pengurus yang berhak menambah aset inventaris.',
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|in:tenda,sound_system,kursi,lainnya',
            'quantity' => 'required|integer|min:1',
            'condition' => 'nullable|string|max:255',
            'rt_number' => 'nullable|string|max:10',
        ]);

        $asset = Asset::create([
            'name' => $validated['name'],
            'category' => $validated['category'],
            'quantity' => $validated['quantity'],
            'condition' => $validated['condition'] ?? 'baik',
            'rt_number' => $validated['rt_number'] ?? ($user->rt_number ?: '01'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Aset inventaris berhasil ditambahkan.',
            'data' => $asset,
        ], 201);
    }

    /**
     * List Loans
     */
    public function listLoans(Request $request)
    {
        $user = $request->user();
        $query = AssetLoan::with(['asset', 'user.house', 'approver']);

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
     * Approve Asset Loan (Pengurus)
     */
    public function approveLoan(Request $request, $id)
    {
        $user = $request->user();
        if (!in_array($user->role, ['rt', 'rw', 'sekretaris', 'bendahara', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya pengurus yang berhak menyetujui peminjaman aset.',
            ], 403);
        }

        $loan = AssetLoan::with(['asset', 'user'])->findOrFail($id);

        if ($user->role === 'rt' && $user->rt_number && $loan->user->rt_number && $user->rt_number !== $loan->user->rt_number) {
            return response()->json([
                'success' => false,
                'message' => 'Anda hanya berhak menyetujui peminjaman warga di RT ' . $user->rt_number,
            ], 403);
        }

        if ($loan->status !== 'requested') {
            return response()->json([
                'success' => false,
                'message' => 'Peminjaman tidak dalam status permohonan (status saat ini: ' . $loan->status . ').',
            ], 422);
        }

        $loan->update([
            'status' => 'approved',
            'approved_by' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Peminjaman aset telah disetujui.',
            'data' => $loan->fresh(['asset', 'user.house', 'approver']),
        ]);
    }

    /**
     * Reject Asset Loan (Pengurus)
     */
    public function rejectLoan(Request $request, $id)
    {
        $user = $request->user();
        if (!in_array($user->role, ['rt', 'rw', 'sekretaris', 'bendahara', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya pengurus yang berhak menolak permohonan pinjam aset.',
            ], 403);
        }

        $loan = AssetLoan::with(['asset', 'user'])->findOrFail($id);

        if ($user->role === 'rt' && $user->rt_number && $loan->user->rt_number && $user->rt_number !== $loan->user->rt_number) {
            return response()->json([
                'success' => false,
                'message' => 'Anda hanya berhak menolak permohonan warga di RT ' . $user->rt_number,
            ], 403);
        }

        if ($loan->status === 'returned') {
            return response()->json([
                'success' => false,
                'message' => 'Peminjaman yang sudah selesai dikembalikan tidak dapat ditolak.',
            ], 422);
        }

        $loan->update([
            'status' => 'rejected',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Permohonan peminjaman aset ditolak.',
            'data' => $loan->fresh(['asset', 'user.house']),
        ]);
    }

    /**
     * Mark Returned (Pengurus)
     */
    public function markReturned(Request $request, $id)
    {
        $user = $request->user();
        if (!in_array($user->role, ['rt', 'rw', 'sekretaris', 'bendahara', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya pengurus yang berhak memvalidasi pengembalian aset.',
            ], 403);
        }

        $loan = AssetLoan::with(['asset', 'user'])->findOrFail($id);

        if ($loan->status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya peminjaman berstatus disetujui yang dapat ditandai selesai/dikembalikan.',
            ], 422);
        }

        $loan->update([
            'status' => 'returned',
            'actual_return_date' => now()->toDateString(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Aset telah dikembalikan dalam kondisi baik.',
            'data' => $loan->fresh(['asset', 'user.house', 'approver']),
        ]);
    }
}
