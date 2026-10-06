<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\AnnouncementDonation;
use App\Models\AnnouncementRsvp;
use Carbon\Carbon;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    /**
     * List Announcements & Events with Live Reminder, RSVP, and Transparency Stats
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Announcement::with(['author', 'budgetApprover', 'rsvps.user', 'donations.user'])
            ->where('is_active', true);

        // Scope by RW or user's RT
        if ($user) {
            $userScope = ['rw'];
            if ($user->rt_number) {
                $userScope[] = 'rt' . $user->rt_number;
            }
            $query->whereIn('scope', $userScope);
        }

        $announcements = $query->latest()->paginate(15);

        // Transform collection to append live countdown, reminder, and financial calculations
        $now = Carbon::now()->startOfDay();

        $announcements->getCollection()->transform(function ($ann) use ($now, $user) {
            $eventDate = $ann->event_date ? Carbon::parse($ann->event_date)->startOfDay() : null;
            $diffDays = $eventDate ? (int) $now->diffInDays($eventDate, false) : null;

            // 1. Reminder & Alert Status
            if (!$eventDate) {
                $reminderType = 'announcement';
                $reminderLabel = 'Pengumuman Umum';
                $alertColor = 'blue';
            } elseif ($diffDays < 0) {
                $reminderType = 'completed';
                $reminderLabel = 'Kegiatan Selesai';
                $alertColor = 'slate';
            } elseif ($diffDays == 0) {
                $reminderType = 'hari_h';
                $reminderLabel = 'HARI-H: Berlangsung Hari Ini!';
                $alertColor = 'red';
            } elseif ($diffDays == 1) {
                $reminderType = 'h_min_1';
                $reminderLabel = 'H-1: Besok Kegiatan Dimulai!';
                $alertColor = 'amber';
            } elseif ($diffDays <= 7) {
                $reminderType = 'h_min_7';
                $reminderLabel = "H-{$diffDays}: {$diffDays} Hari Lagi (Pekan Ini)";
                $alertColor = 'purple';
            } elseif ($diffDays <= 14) {
                $reminderType = 'h_min_14';
                $reminderLabel = "H-{$diffDays}: 2 Minggu Lagi";
                $alertColor = 'indigo';
            } else {
                $reminderType = 'upcoming';
                $reminderLabel = "Terjadwal ({$diffDays} Hari Lagi)";
                $alertColor = 'slate';
            }

            // 2. RSVP Summary & Absent Reasons
            $rsvps = $ann->rsvps;
            $hadirCount = $rsvps->where('status', 'hadir')->count();
            $tidakHadirCount = $rsvps->where('status', 'tidak_hadir')->count();
            $myRsvp = $user ? $rsvps->where('user_id', $user->id)->first() : null;

            $absentDetails = $rsvps->where('status', 'tidak_hadir')->map(function ($r) {
                return [
                    'user_name' => $r->user?->name,
                    'reason' => $r->reason ?? 'Tidak ada keterangan',
                    'contribution_note' => $r->contribution_note ?? 'Tanpa kontribusi pengganti',
                ];
            })->values();

            // 3. Financial & Deficit Transparency
            $donations = $ann->donations;
            $totalDonations = (float) $donations->sum('amount');
            $budgetAmount = (float) ($ann->budget_amount ?? 0);
            $actualSpent = (float) ($ann->actual_spent ?? 0);
            $donationTarget = (float) ($ann->donation_target ?? 0);
            $extraFee = (float) ($ann->extra_fee_per_family ?? 0);

            $surplusDeficit = $budgetAmount > 0 ? ($budgetAmount - $actualSpent) : 0;
            $deficitRemaining = $donationTarget > 0 ? max(0, $donationTarget - $totalDonations) : 0;

            $ann->reminder_meta = [
                'days_until_event' => $diffDays,
                'reminder_type' => $reminderType,
                'reminder_label' => $reminderLabel,
                'alert_color' => $alertColor,
                'is_today' => $diffDays === 0,
            ];

            $ann->rsvp_meta = [
                'total_hadir' => $hadirCount,
                'total_tidak_hadir' => $tidakHadirCount,
                'absent_details' => $absentDetails,
                'my_rsvp' => $myRsvp ? [
                    'status' => $myRsvp->status,
                    'reason' => $myRsvp->reason,
                    'contribution_note' => $myRsvp->contribution_note,
                ] : null,
            ];

            $ann->financial_transparency = [
                'budget_amount' => $budgetAmount,
                'budget_source' => $ann->budget_source,
                'budget_status' => $ann->budget_status,
                'actual_spent' => $actualSpent,
                'surplus_deficit' => $surplusDeficit,
                'is_over_budget' => $actualSpent > $budgetAmount && $budgetAmount > 0,
                'extra_fee_per_family' => $extraFee,
                'donation_target' => $donationTarget,
                'total_donations_collected' => $totalDonations,
                'deficit_remaining' => $deficitRemaining,
                'donation_progress_percent' => $donationTarget > 0 ? round(($totalDonations / $donationTarget) * 100, 1) : 100,
                'financial_report_notes' => $ann->financial_report_notes,
            ];

            return $ann;
        });

        return response()->json([
            'success' => true,
            'data' => $announcements,
        ]);
    }

    /**
     * Create Announcement / Event (Pengurus)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'scope' => 'required|in:rw,rt01,rt02,rt03',
            'type' => 'required|in:announcement,event',
            'event_date' => 'nullable|date',
            'budget_amount' => 'nullable|numeric|min:0',
            'budget_source' => 'nullable|in:kas_rt,kas_rw,swadaya',
            'donation_target' => 'nullable|numeric|min:0',
            'extra_fee_per_family' => 'nullable|numeric|min:0',
            'allow_rsvp' => 'boolean',
            'allow_donation' => 'boolean',
        ]);

        $announcement = Announcement::create([
            'created_by' => $request->user()->id,
            'title' => $validated['title'],
            'content' => $validated['content'],
            'scope' => $validated['scope'],
            'type' => $validated['type'],
            'event_date' => $validated['event_date'] ?? null,
            'budget_amount' => $validated['budget_amount'] ?? null,
            'budget_source' => $validated['budget_source'] ?? null,
            'budget_status' => isset($validated['budget_amount']) && $validated['budget_amount'] > 0 ? 'proposed' : null,
            'donation_target' => $validated['donation_target'] ?? null,
            'extra_fee_per_family' => $validated['extra_fee_per_family'] ?? 0,
            'allow_rsvp' => $validated['allow_rsvp'] ?? false,
            'allow_donation' => $validated['allow_donation'] ?? false,
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengumuman / Agenda kegiatan berhasil diterbitkan.',
            'data' => $announcement->load(['author', 'budgetApprover']),
        ], 201);
    }

    /**
     * RSVP for an event with Reason & Substitute Contribution (Gotong Royong)
     */
    public function rsvp(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:hadir,tidak_hadir',
            'reason' => 'nullable|string|max:255',
            'contribution_note' => 'nullable|string|max:255',
        ]);

        $announcement = Announcement::findOrFail($id);

        if (!$announcement->allow_rsvp) {
            return response()->json([
                'success' => false,
                'message' => 'Kegiatan ini tidak membuka opsi RSVP.',
            ], 422);
        }

        $rsvp = AnnouncementRsvp::updateOrCreate(
            [
                'announcement_id' => $announcement->id,
                'user_id' => $request->user()->id,
            ],
            [
                'status' => $request->status,
                'reason' => $request->status === 'tidak_hadir' ? $request->reason : null,
                'contribution_note' => $request->contribution_note ?? null,
            ]
        );

        $msg = $request->status === 'hadir' 
            ? 'Terima kasih! Konfirmasi kehadiran Anda telah dicatat oleh pengurus.'
            : 'Izin ketidakhadiran Anda beserta catatan kontribusi pengganti telah dicatat oleh pengurus.';

        return response()->json([
            'success' => true,
            'message' => $msg,
            'data' => $rsvp,
        ]);
    }

    /**
     * Submit voluntary donation / incidental fee for an event
     */
    public function donate(Request $request, $id)
    {
        $request->validate([
            'amount' => 'required|numeric|min:5000',
            'proof_image' => 'required|image|max:5120',
        ]);

        $announcement = Announcement::findOrFail($id);

        if (!$announcement->allow_donation) {
            return response()->json([
                'success' => false,
                'message' => 'Kegiatan ini tidak menerima donasi sukarela / swadaya.',
            ], 422);
        }

        $path = $request->file('proof_image')->store('donations', 'public');

        $donation = AnnouncementDonation::create([
            'announcement_id' => $announcement->id,
            'user_id' => $request->user()->id,
            'amount' => $request->amount,
            'payment_proof' => '/storage/' . $path,
            'status' => 'approved', // auto-approve for testing or direct recording
            'verified_by' => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Terima kasih atas partisipasi Anda! Donasi swadaya kegiatan sebesar Rp ' . number_format($request->amount, 0, ',', '.') . ' berhasil disalurkan.',
            'data' => $donation,
        ], 201);
    }

    /**
     * Update Financial Transparency Report (SPJ Kegiatan oleh Pengurus)
     */
    public function updateFinancialReport(Request $request, $id)
    {
        $user = $request->user();

        if (!in_array($user->role, ['rw', 'rt', 'bendahara', 'sekretaris', 'super_admin'])) {
            return response()->json(['message' => 'Hanya Pengurus yang berwenang memperbarui laporan keuangan kegiatan.'], 403);
        }

        $announcement = Announcement::findOrFail($id);

        $validated = $request->validate([
            'actual_spent' => 'required|numeric|min:0',
            'extra_fee_per_family' => 'nullable|numeric|min:0',
            'donation_target' => 'nullable|numeric|min:0',
            'financial_report_notes' => 'required|string',
        ]);

        $announcement->update([
            'actual_spent' => $validated['actual_spent'],
            'extra_fee_per_family' => $validated['extra_fee_per_family'] ?? 0,
            'donation_target' => $validated['donation_target'] ?? $announcement->donation_target,
            'financial_report_notes' => $validated['financial_report_notes'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Laporan realisasi keuangan dan pertanggungjawaban kegiatan berhasil dipublikasikan ke warga.',
            'data' => $announcement->fresh(['author', 'budgetApprover']),
        ]);
    }

    /**
     * Keputusan Anggaran Kegiatan oleh Bendahara RT / RW
     */
    public function budgetDecision(Request $request, $id)
    {
        $user = $request->user();
        $announcement = Announcement::findOrFail($id);

        $validated = $request->validate([
            'action' => 'required|in:approve,reject,disburse',
            'notes' => 'nullable|string',
        ]);

        $status = $validated['action'] === 'approve' ? 'approved' : ($validated['action'] === 'disburse' ? 'disbursed' : 'rejected');

        $announcement->update([
            'budget_status' => $status,
            'budget_approved_by' => $user->id,
            'budget_notes' => $validated['notes'] ?? null,
        ]);

        $label = $status === 'approved' ? 'DISETUJUI' : ($status === 'disbursed' ? 'DICAIRKAN' : 'DITOLAK');

        return response()->json([
            'success' => true,
            'message' => "Anggaran kegiatan '{$announcement->title}' berhasil {$label} oleh Bendahara ({$user->name}).",
            'data' => $announcement->fresh(['author', 'budgetApprover']),
        ]);
    }
}
