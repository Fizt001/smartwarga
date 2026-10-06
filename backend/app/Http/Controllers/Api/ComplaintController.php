<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Complaint;
use Illuminate\Http\Request;

class ComplaintController extends Controller
{
    /**
     * List Complaints
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Complaint::with(['user.house', 'handler']);

        if ($user->role === 'warga') {
            $query->where('user_id', $user->id);
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        if ($request->has('category') && $request->category) {
            $query->where('category', $request->category);
        }

        $complaints = $query->latest()->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $complaints,
        ]);
    }

    /**
     * Submit Complaint
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'category' => 'required|string|max:50',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'photo' => 'nullable|image|max:5120',
        ]);

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $path = $request->file('photo')->store('complaints', 'public');
            $photoPath = '/storage/' . $path;
        }

        $complaint = Complaint::create([
            'user_id' => $request->user()->id,
            'category' => $validated['category'],
            'title' => $validated['title'],
            'description' => $validated['description'],
            'photo_path' => $photoPath,
            'status' => 'laporan_masuk',
            'response_history' => [
                [
                    'timestamp' => now()->toIso8601String(),
                    'action' => 'laporan_masuk',
                    'notes' => 'Pengaduan telah masuk ke sistem SMART-WARGA.',
                    'by' => $request->user()->name,
                ]
            ],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengaduan berhasil dikirim. Pengurus lingkungan akan segera menindaklanjuti.',
            'data' => $complaint->load('user.house'),
        ], 201);
    }

    /**
     * Show Complaint Detail
     */
    public function show($id)
    {
        $complaint = Complaint::with(['user.house', 'handler'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $complaint,
        ]);
    }

    /**
     * Update Complaint Status & Add Response Note (Pengurus)
     */
    public function updateStatus(Request $request, $id)
    {
        $user = $request->user();
        if (!in_array($user->role, ['rt', 'rw', 'sekretaris', 'bendahara', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya pengurus RT/RW atau admin yang dapat menindaklanjuti pengaduan warga.',
            ], 403);
        }

        $request->validate([
            'status' => 'required|in:laporan_masuk,diproses,selesai',
            'notes' => 'required|string',
        ]);

        $complaint = Complaint::findOrFail($id);
        $history = $complaint->response_history ?? [];

        $history[] = [
            'timestamp' => now()->toIso8601String(),
            'action' => $request->status,
            'notes' => $request->notes,
            'by' => $request->user()->name . ' (' . strtoupper($request->user()->role) . ')',
        ];

        $complaint->update([
            'status' => $request->status,
            'handled_by' => $request->user()->id,
            'response_history' => $history,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Status pengaduan berhasil diperbarui menjadi: " . strtoupper(str_replace('_', ' ', $request->status)),
            'data' => $complaint->fresh(['user.house', 'handler']),
        ]);
    }
}
