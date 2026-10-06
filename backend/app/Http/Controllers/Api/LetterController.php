<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Letter;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class LetterController extends Controller
{
    /**
     * List Letters
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Letter::with(['user.house', 'rtApprover', 'rwApprover']);

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

        $letters = $query->latest()->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $letters,
        ]);
    }

    /**
     * Warga Requests a Letter
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:skck,domisili,sktm,lainnya',
            'purpose' => 'required|string|max:500',
            'notes' => 'nullable|string',
        ]);

        $letter = Letter::create([
            'user_id' => $request->user()->id,
            'type' => $validated['type'],
            'purpose' => $validated['purpose'],
            'status' => 'submitted',
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengajuan surat pengantar berhasil dikirim. Menunggu persetujuan Pengurus RT.',
            'data' => $letter->load('user.house'),
        ], 201);
    }

    /**
     * Show Letter Details
     */
    public function show($id)
    {
        $letter = Letter::with(['user.house', 'rtApprover', 'rwApprover'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $letter,
        ]);
    }

    /**
     * RT Approval
     */
    public function approveRt(Request $request, $id)
    {
        $user = $request->user();
        $letter = Letter::with('user')->findOrFail($id);

        if (!in_array($user->role, ['rt', 'sekretaris', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya Pengurus RT atau Super Admin yang berhak menyetujui surat tahap awal.',
            ], 403);
        }

        if ($letter->status !== 'submitted') {
            return response()->json([
                'success' => false,
                'message' => 'Surat tidak dalam status menunggu persetujuan RT (status saat ini: ' . $letter->status . ').',
            ], 422);
        }

        if ($user->role === 'rt' && $user->rt_number !== $letter->user->rt_number) {
            return response()->json([
                'success' => false,
                'message' => 'Anda hanya berhak menyetujui surat warga di RT ' . $user->rt_number,
            ], 403);
        }

        $letter->update([
            'status' => 'rt_approved',
            'rt_approved_by' => $user->id,
            'rt_approved_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Surat berhasil disetujui Pengurus RT. Menunggu validasi Ketua RW.',
            'data' => $letter->fresh(['user.house', 'rtApprover']),
        ]);
    }

    /**
     * RW Validation & Auto Generate PDF
     */
    public function approveRw(Request $request, $id)
    {
        $user = $request->user();
        $letter = Letter::with(['user.house', 'rtApprover'])->findOrFail($id);

        if (!in_array($user->role, ['rw', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya Ketua RW atau Super Admin yang berwenang memberikan pengesahan surat tahap akhir.',
            ], 403);
        }

        if ($letter->status !== 'rt_approved' && $user->role !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Surat harus disetujui oleh Pengurus RT terlebih dahulu sebelum divalidasi RW.',
            ], 422);
        }

        $letter->update([
            'status' => 'rw_approved',
            'rw_approved_by' => $user->id,
            'rw_approved_at' => now(),
        ]);

        // Generate PDF
        $letter->load(['user.house', 'rtApprover', 'rwApprover']);
        $pdf = Pdf::loadView('letters.template', ['letter' => $letter]);
        $fileName = 'letters/surat_pengantar_' . $letter->id . '_' . time() . '.pdf';
        
        Storage::disk('public')->put($fileName, $pdf->output());

        $letter->update([
            'pdf_path' => '/storage/' . $fileName,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Surat berhasil divalidasi oleh Ketua RW. Dokumen PDF resmi telah digenerate.',
            'data' => $letter->fresh(['user.house', 'rtApprover', 'rwApprover']),
        ]);
    }

    /**
     * Reject Letter
     */
    public function reject(Request $request, $id)
    {
        $user = $request->user();
        $request->validate([
            'reason' => 'required|string',
        ]);

        $letter = Letter::with('user')->findOrFail($id);

        if (!in_array($user->role, ['rt', 'rw', 'sekretaris', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki hak untuk menolak permohonan surat.',
            ], 403);
        }

        if ($user->role === 'rt' && $user->rt_number !== $letter->user->rt_number) {
            return response()->json([
                'success' => false,
                'message' => 'Anda hanya berhak menolak surat warga di RT ' . $user->rt_number,
            ], 403);
        }

        if ($letter->status === 'rw_approved') {
            return response()->json([
                'success' => false,
                'message' => 'Surat yang sudah disahkan oleh RW tidak dapat ditolak.',
            ], 422);
        }

        $letter->update([
            'status' => 'rejected',
            'rejected_reason' => $request->reason,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengajuan surat ditolak.',
            'data' => $letter,
        ]);
    }

    /**
     * Download or view PDF
     */
    public function downloadPdf($id)
    {
        $letter = Letter::findOrFail($id);

        if (!$letter->pdf_path) {
            return response()->json([
                'success' => false,
                'message' => 'Dokumen PDF belum tersedia untuk surat ini.',
            ], 404);
        }

        $relativePath = str_replace('/storage/', '', $letter->pdf_path);

        if (!Storage::disk('public')->exists($relativePath)) {
            return response()->json([
                'success' => false,
                'message' => 'File dokumen PDF tidak ditemukan di storage server.',
            ], 404);
        }

        return response()->download(Storage::disk('public')->path($relativePath), "Surat_Pengantar_{$letter->type}_{$letter->id}.pdf");
    }
}
