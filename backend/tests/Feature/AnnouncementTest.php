<?php

namespace Tests\Feature;

use App\Models\Announcement;
use App\Models\AnnouncementDonation;
use App\Models\AnnouncementRsvp;
use App\Models\House;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AnnouncementTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected User $ketuaRt;
    protected User $bendahara;
    protected User $sekretaris;
    protected User $wargaRt01;
    protected User $wargaRt02;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        $house1 = House::create([
            'block' => 'A',
            'number' => '01',
            'rt_number' => '01',
            'full_address' => 'Blok A No. 01 RT 01',
            'is_occupied' => true,
        ]);

        $house2 = House::create([
            'block' => 'B',
            'number' => '02',
            'rt_number' => '02',
            'full_address' => 'Blok B No. 02 RT 02',
            'is_occupied' => true,
        ]);

        $this->superAdmin = User::create([
            'name' => 'Super Administrator',
            'phone' => '081200000001',
            'email' => 'admin@smartwarga.id',
            'password' => bcrypt('password'),
            'role' => 'super_admin',
            'status' => 'approved',
        ]);

        $this->ketuaRt = User::create([
            'name' => 'Ketua RT 01',
            'phone' => '081299990001',
            'email' => 'rt01@smartwarga.id',
            'password' => bcrypt('password'),
            'role' => 'rt',
            'rt_number' => '01',
            'house_id' => $house1->id,
            'status' => 'approved',
        ]);

        $this->bendahara = User::create([
            'name' => 'Ibu Ratna Bendahara',
            'phone' => '081299990002',
            'email' => 'bendahara@smartwarga.id',
            'password' => bcrypt('password'),
            'role' => 'bendahara',
            'rt_number' => '01',
            'house_id' => $house1->id,
            'status' => 'approved',
        ]);

        $this->sekretaris = User::create([
            'name' => 'Pak Danu Sekretaris',
            'phone' => '081299990003',
            'email' => 'sekretaris@smartwarga.id',
            'password' => bcrypt('password'),
            'role' => 'sekretaris',
            'rt_number' => '01',
            'house_id' => $house1->id,
            'status' => 'approved',
        ]);

        $this->wargaRt01 = User::create([
            'name' => 'Budi Santoso',
            'phone' => '081288880001',
            'email' => 'budi@smartwarga.id',
            'password' => bcrypt('password'),
            'role' => 'warga',
            'rt_number' => '01',
            'house_id' => $house1->id,
            'status' => 'approved',
        ]);

        $this->wargaRt02 = User::create([
            'name' => 'Joko Anwar',
            'phone' => '081288880002',
            'email' => 'joko@smartwarga.id',
            'password' => bcrypt('password'),
            'role' => 'warga',
            'rt_number' => '02',
            'house_id' => $house2->id,
            'status' => 'approved',
        ]);
    }

    // =========================================================================
    // WHITE-BOX TESTING: Logic, Countdown, Formula, State & Filtering
    // =========================================================================

    /**
     * White-Box 1: Logika perhitungan Countdown & Alert Tiers (Hari-H, H-1, H-7, H-14, Selesai)
     */
    public function test_whitebox_countdown_tier_calculations()
    {
        $today = Carbon::today()->toDateString();
        $tomorrow = Carbon::tomorrow()->toDateString();
        $in5Days = Carbon::today()->addDays(5)->toDateString();
        $in10Days = Carbon::today()->addDays(10)->toDateString();
        $yesterday = Carbon::yesterday()->toDateString();

        // 1. Hari-H
        $evToday = Announcement::create([
            'created_by' => $this->ketuaRt->id,
            'title' => 'Event Hari H',
            'content' => 'Deskripsi',
            'scope' => 'rw',
            'type' => 'event',
            'event_date' => $today,
            'is_active' => true,
        ]);

        // 2. H-1
        $evTomorrow = Announcement::create([
            'created_by' => $this->ketuaRt->id,
            'title' => 'Event Besok H-1',
            'content' => 'Deskripsi',
            'scope' => 'rw',
            'type' => 'event',
            'event_date' => $tomorrow,
            'is_active' => true,
        ]);

        // 3. H-5 (Tier H-7)
        $ev5Days = Announcement::create([
            'created_by' => $this->ketuaRt->id,
            'title' => 'Event H-5',
            'content' => 'Deskripsi',
            'scope' => 'rw',
            'type' => 'event',
            'event_date' => $in5Days,
            'is_active' => true,
        ]);

        // 4. H-10 (Tier H-14)
        $ev10Days = Announcement::create([
            'created_by' => $this->ketuaRt->id,
            'title' => 'Event H-10',
            'content' => 'Deskripsi',
            'scope' => 'rw',
            'type' => 'event',
            'event_date' => $in10Days,
            'is_active' => true,
        ]);

        // 5. Kegiatan Selesai
        $evPast = Announcement::create([
            'created_by' => $this->ketuaRt->id,
            'title' => 'Event Lampau',
            'content' => 'Deskripsi',
            'scope' => 'rw',
            'type' => 'event',
            'event_date' => $yesterday,
            'is_active' => true,
        ]);

        // 6. Pengumuman tanpa tanggal kegiatan
        $annGeneral = Announcement::create([
            'created_by' => $this->ketuaRt->id,
            'title' => 'Pengumuman Umum Rutin',
            'content' => 'Deskripsi',
            'scope' => 'rw',
            'type' => 'announcement',
            'event_date' => null,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->wargaRt01)->getJson('/api/announcements');
        $response->assertStatus(200);

        $data = collect($response->json('data.data'));

        // Assertions for each tier
        $itemToday = $data->firstWhere('id', $evToday->id);
        $this->assertEquals('hari_h', $itemToday['reminder_meta']['reminder_type']);
        $this->assertEquals('red', $itemToday['reminder_meta']['alert_color']);
        $this->assertTrue($itemToday['reminder_meta']['is_today']);

        $itemTomorrow = $data->firstWhere('id', $evTomorrow->id);
        $this->assertEquals('h_min_1', $itemTomorrow['reminder_meta']['reminder_type']);
        $this->assertEquals('amber', $itemTomorrow['reminder_meta']['alert_color']);

        $item5Days = $data->firstWhere('id', $ev5Days->id);
        $this->assertEquals('h_min_7', $item5Days['reminder_meta']['reminder_type']);
        $this->assertEquals('purple', $item5Days['reminder_meta']['alert_color']);

        $item10Days = $data->firstWhere('id', $ev10Days->id);
        $this->assertEquals('h_min_14', $item10Days['reminder_meta']['reminder_type']);
        $this->assertEquals('indigo', $item10Days['reminder_meta']['alert_color']);

        $itemPast = $data->firstWhere('id', $evPast->id);
        $this->assertEquals('completed', $itemPast['reminder_meta']['reminder_type']);

        $itemGeneral = $data->firstWhere('id', $annGeneral->id);
        $this->assertEquals('announcement', $itemGeneral['reminder_meta']['reminder_type']);
    }

    /**
     * White-Box 2: Formula Surplus / Defisit dan Over-Budget Tracking
     */
    public function test_whitebox_surplus_deficit_and_overbudget_calculations()
    {
        // 1. Under-budget (Surplus)
        $event1 = Announcement::create([
            'created_by' => $this->ketuaRt->id,
            'title' => 'Event Hemat',
            'content' => 'Deskripsi',
            'scope' => 'rw',
            'type' => 'event',
            'budget_amount' => 2000000,
            'actual_spent' => 1750000,
            'is_active' => true,
        ]);

        // 2. Over-budget (Defisit)
        $event2 = Announcement::create([
            'created_by' => $this->ketuaRt->id,
            'title' => 'Event Membengkak',
            'content' => 'Deskripsi',
            'scope' => 'rw',
            'type' => 'event',
            'budget_amount' => 1000000,
            'actual_spent' => 1300000,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->wargaRt01)->getJson('/api/announcements');
        $data = collect($response->json('data.data'));

        $item1 = $data->firstWhere('id', $event1->id);
        $this->assertEquals(250000, $item1['financial_transparency']['surplus_deficit']);
        $this->assertFalse($item1['financial_transparency']['is_over_budget']);

        $item2 = $data->firstWhere('id', $event2->id);
        $this->assertEquals(-300000, $item2['financial_transparency']['surplus_deficit']);
        $this->assertTrue($item2['financial_transparency']['is_over_budget']);
    }

    /**
     * White-Box 3: Progres Donasi Swadaya & Sisa Defisit Target
     */
    public function test_whitebox_donation_progress_and_deficit_calculations()
    {
        $event = Announcement::create([
            'created_by' => $this->ketuaRt->id,
            'title' => 'Pengadaan Tenda Gotong Royong',
            'content' => 'Deskripsi',
            'scope' => 'rw',
            'type' => 'event',
            'donation_target' => 5000000,
            'allow_donation' => true,
            'is_active' => true,
        ]);

        // User menyumbang donasi 1: Rp 1.500.000, donasi 2: Rp 2.000.000 (Total Rp 3.500.000 = 70%)
        AnnouncementDonation::create([
            'announcement_id' => $event->id,
            'user_id' => $this->wargaRt01->id,
            'amount' => 1500000,
            'payment_proof' => '/storage/donations/proof1.jpg',
            'status' => 'approved',
        ]);

        AnnouncementDonation::create([
            'announcement_id' => $event->id,
            'user_id' => $this->wargaRt02->id,
            'amount' => 2000000,
            'payment_proof' => '/storage/donations/proof2.jpg',
            'status' => 'approved',
        ]);

        $response = $this->actingAs($this->wargaRt01)->getJson('/api/announcements');
        $item = collect($response->json('data.data'))->firstWhere('id', $event->id);

        $this->assertEquals(3500000, $item['financial_transparency']['total_donations_collected']);
        $this->assertEquals(1500000, $item['financial_transparency']['deficit_remaining']);
        $this->assertEquals(70.0, $item['financial_transparency']['donation_progress_percent']);
    }

    /**
     * White-Box 4: Boundary Scope Filtering (Warga RT 01 hanya melihat RW & RT 01, bukan RT 02)
     */
    public function test_whitebox_scope_filtering_isolation()
    {
        $rwEvent = Announcement::create([
            'created_by' => $this->superAdmin->id,
            'title' => 'Agenda Seluruh RW',
            'content' => 'Semua warga wajib tahu',
            'scope' => 'rw',
            'type' => 'announcement',
            'is_active' => true,
        ]);

        $rt01Event = Announcement::create([
            'created_by' => $this->ketuaRt->id,
            'title' => 'Rapat Internal RT 01',
            'content' => 'Khusus RT 01',
            'scope' => 'rt01',
            'type' => 'announcement',
            'is_active' => true,
        ]);

        $rt02Event = Announcement::create([
            'created_by' => $this->superAdmin->id,
            'title' => 'Rapat Internal RT 02',
            'content' => 'Khusus RT 02',
            'scope' => 'rt02',
            'type' => 'announcement',
            'is_active' => true,
        ]);

        // Warga RT 01 login
        $res01 = $this->actingAs($this->wargaRt01)->getJson('/api/announcements');
        $ids01 = collect($res01->json('data.data'))->pluck('id')->all();

        $this->assertContains($rwEvent->id, $ids01);
        $this->assertContains($rt01Event->id, $ids01);
        $this->assertNotContains($rt02Event->id, $ids01);

        // Warga RT 02 login
        $res02 = $this->actingAs($this->wargaRt02)->getJson('/api/announcements');
        $ids02 = collect($res02->json('data.data'))->pluck('id')->all();

        $this->assertContains($rwEvent->id, $ids02);
        $this->assertContains($rt02Event->id, $ids02);
        $this->assertNotContains($rt01Event->id, $ids02);
    }

    /**
     * White-Box 5: Alasan & Kontribusi Pengganti bagi Warga yang Tidak Hadir
     */
    public function test_whitebox_rsvp_absent_reason_and_contribution_preservation()
    {
        $event = Announcement::create([
            'created_by' => $this->ketuaRt->id,
            'title' => 'Gotong Royong Bersih Selokan',
            'content' => 'Deskripsi',
            'scope' => 'rt01',
            'type' => 'event',
            'allow_rsvp' => true,
            'is_active' => true,
        ]);

        // Warga RT 01 submit RSVP tidak hadir dengan alasan
        $this->actingAs($this->wargaRt01)->postJson("/api/announcements/{$event->id}/rsvp", [
            'status' => 'tidak_hadir',
            'reason' => 'Sakit demam',
            'contribution_note' => 'Menyediakan 3 box snack dan air mineral',
        ]);

        $response = $this->actingAs($this->wargaRt01)->getJson('/api/announcements');
        $item = collect($response->json('data.data'))->firstWhere('id', $event->id);

        $this->assertEquals(0, $item['rsvp_meta']['total_hadir']);
        $this->assertEquals(1, $item['rsvp_meta']['total_tidak_hadir']);
        $this->assertCount(1, $item['rsvp_meta']['absent_details']);
        $this->assertEquals('Sakit demam', $item['rsvp_meta']['absent_details'][0]['reason']);
        $this->assertEquals('Menyediakan 3 box snack dan air mineral', $item['rsvp_meta']['absent_details'][0]['contribution_note']);
        $this->assertEquals('tidak_hadir', $item['rsvp_meta']['my_rsvp']['status']);

        // Update RSVP menjadi hadir -> alasan otomatis di-null-kan
        $this->actingAs($this->wargaRt01)->postJson("/api/announcements/{$event->id}/rsvp", [
            'status' => 'hadir',
        ]);

        $rsvpDb = AnnouncementRsvp::where('announcement_id', $event->id)->where('user_id', $this->wargaRt01->id)->first();
        $this->assertEquals('hadir', $rsvpDb->status);
        $this->assertNull($rsvpDb->reason);
    }

    /**
     * White-Box 6: Transisi Status Alokasi Anggaran (Proposed -> Approved -> Disbursed)
     */
    public function test_whitebox_budget_decision_state_transitions()
    {
        $event = Announcement::create([
            'created_by' => $this->sekretaris->id,
            'title' => 'Pesta Kemerdekaan 17 Agustus',
            'content' => 'Lomba dan panggung hiburan warga',
            'scope' => 'rw',
            'type' => 'event',
            'budget_amount' => 5000000,
            'budget_status' => 'proposed',
            'is_active' => true,
        ]);

        // 1. Bendahara Menyetujui (Approve)
        $resApprove = $this->actingAs($this->bendahara)->postJson("/api/admin/announcements/{$event->id}/budget-decision", [
            'action' => 'approve',
            'notes' => 'Disetujui dari Kas RW',
        ]);
        $resApprove->assertStatus(200);
        $this->assertEquals('approved', $event->fresh()->budget_status);
        $this->assertEquals($this->bendahara->id, $event->fresh()->budget_approved_by);

        // 2. Pencairan Dana (Disburse)
        $resDisburse = $this->actingAs($this->bendahara)->postJson("/api/admin/announcements/{$event->id}/budget-decision", [
            'action' => 'disburse',
            'notes' => 'Dana tunai Rp 5.000.000 telah diserahkan ke panitia',
        ]);
        $resDisburse->assertStatus(200);
        $this->assertEquals('disbursed', $event->fresh()->budget_status);
    }

    // =========================================================================
    // BLACK-BOX TESTING: API Contracts, Role Middleware & Input Validations
    // =========================================================================

    /**
     * Black-Box 1: Validasi Input Pembuatan Pengumuman / Agenda
     */
    public function test_blackbox_create_announcement_validation()
    {
        // 1. Missing required fields
        $resInvalid = $this->actingAs($this->ketuaRt)->postJson('/api/admin/announcements', []);
        $resInvalid->assertStatus(422)->assertJsonValidationErrors(['title', 'content', 'scope', 'type']);

        // 2. Invalid scope & type
        $resInvalidScope = $this->actingAs($this->ketuaRt)->postJson('/api/admin/announcements', [
            'title' => 'Judul Test',
            'content' => 'Konten Test',
            'scope' => 'kelurahan', // Invalid
            'type' => 'peringatan', // Invalid
        ]);
        $resInvalidScope->assertStatus(422)->assertJsonValidationErrors(['scope', 'type']);

        // 3. Valid payload creates announcement and auto-sets proposed if budget > 0
        $resValid = $this->actingAs($this->ketuaRt)->postJson('/api/admin/announcements', [
            'title' => 'Musyawarah Warga Semester Genap',
            'content' => 'Evaluasi keuangan dan program lingkungan',
            'scope' => 'rt01',
            'type' => 'event',
            'event_date' => Carbon::today()->addDays(3)->toDateString(),
            'budget_amount' => 500000,
            'budget_source' => 'kas_rt',
            'allow_rsvp' => true,
            'allow_donation' => false,
        ]);

        $resValid->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'title' => 'Musyawarah Warga Semester Genap',
                    'scope' => 'rt01',
                    'budget_status' => 'proposed',
                ],
            ]);
    }

    /**
     * Black-Box 2: Penolakan RSVP jika kegiatan tidak membuka opsi RSVP
     */
    public function test_blackbox_rsvp_rejected_when_not_allowed()
    {
        $announcement = Announcement::create([
            'created_by' => $this->ketuaRt->id,
            'title' => 'Pengumuman Jadwal Padam Listrik',
            'content' => 'Pemadaman oleh PLN pukul 09.00 - 12.00 WIB',
            'scope' => 'rt01',
            'type' => 'announcement',
            'allow_rsvp' => false, // Tidak boleh RSVP
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->wargaRt01)->postJson("/api/announcements/{$announcement->id}/rsvp", [
            'status' => 'hadir',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Kegiatan ini tidak membuka opsi RSVP.',
            ]);
    }

    /**
     * Black-Box 3: Penyaluran Donasi Swadaya beserta Upload Bukti Transfer
     */
    public function test_blackbox_donation_submission_and_validation()
    {
        $event = Announcement::create([
            'created_by' => $this->ketuaRt->id,
            'title' => 'Bazar UMKM & Santunan Anak Yatim',
            'content' => 'Deskripsi',
            'scope' => 'rw',
            'type' => 'event',
            'allow_donation' => true,
            'is_active' => true,
        ]);

        // Donasi di bawah Rp 5.000 ditolak
        $resMin = $this->actingAs($this->wargaRt01)->postJson("/api/announcements/{$event->id}/donate", [
            'amount' => 1000,
            'proof_image' => UploadedFile::fake()->image('proof.jpg'),
        ]);
        $resMin->assertStatus(422)->assertJsonValidationErrors(['amount']);

        // Donasi valid Rp 100.000 dengan bukti bayar
        $resValid = $this->actingAs($this->wargaRt01)->postJson("/api/announcements/{$event->id}/donate", [
            'amount' => 100000,
            'proof_image' => UploadedFile::fake()->image('bukti_transfer.jpg'),
        ]);

        $resValid->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'amount' => 100000,
                    'status' => 'approved',
                ],
            ]);

        $this->assertDatabaseHas('announcement_donations', [
            'announcement_id' => $event->id,
            'user_id' => $this->wargaRt01->id,
            'amount' => 100000,
        ]);
    }

    /**
     * Black-Box 4: Otorisasi Role untuk Pembaruan LPJ Realisasi Keuangan Kegiatan
     */
    public function test_blackbox_financial_report_role_authorization()
    {
        $event = Announcement::create([
            'created_by' => $this->ketuaRt->id,
            'title' => 'Piknik Bersama Warga',
            'content' => 'Deskripsi',
            'scope' => 'rt01',
            'type' => 'event',
            'budget_amount' => 3000000,
            'is_active' => true,
        ]);

        // 1. Warga biasa mencoba update LPJ -> Ditolak HTTP 403
        $resWarga = $this->actingAs($this->wargaRt01)->postJson("/api/admin/announcements/{$event->id}/financial-report", [
            'actual_spent' => 2800000,
            'financial_report_notes' => 'Catatan liar dari warga',
        ]);
        $resWarga->assertStatus(403);

        // 2. Bendahara update LPJ -> Berhasil HTTP 200
        $resBendahara = $this->actingAs($this->bendahara)->postJson("/api/admin/announcements/{$event->id}/financial-report", [
            'actual_spent' => 2800000,
            'financial_report_notes' => 'LPJ Resmi: Sewa bus Rp 2.000.000, Konsumsi Rp 800.000. Sisa Rp 200.000 dikembalikan.',
        ]);

        $resBendahara->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertEquals(2800000, $event->fresh()->actual_spent);
    }

    /**
     * Black-Box 5: Otorisasi Role untuk Keputusan Anggaran oleh Pengurus
     */
    public function test_blackbox_budget_decision_role_authorization()
    {
        $event = Announcement::create([
            'created_by' => $this->sekretaris->id,
            'title' => 'Perbaikan Gapura RT 01',
            'content' => 'Renovasi gapura pos depan',
            'scope' => 'rt01',
            'type' => 'event',
            'budget_amount' => 1200000,
            'budget_status' => 'proposed',
            'is_active' => true,
        ]);

        // Warga biasa mencoba approve -> Ditolak (Middleware role admin group)
        $resWarga = $this->actingAs($this->wargaRt01)->postJson("/api/admin/announcements/{$event->id}/budget-decision", [
            'action' => 'approve',
        ]);
        $resWarga->assertStatus(403);

        // Bendahara approve -> Berhasil
        $resPengurus = $this->actingAs($this->bendahara)->postJson("/api/admin/announcements/{$event->id}/budget-decision", [
            'action' => 'approve',
            'notes' => 'Setuju dengan rincian material.',
        ]);
        $resPengurus->assertStatus(200);
    }
}
