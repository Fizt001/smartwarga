<?php

namespace Tests\Feature;

use App\Models\Complaint;
use App\Models\House;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ComplaintTest extends TestCase
{
    use RefreshDatabase;

    protected User $wargaRt01;
    protected User $wargaRt02;
    protected User $ketuaRt01;
    protected User $ketuaRw;
    protected House $houseRt01;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');

        $this->houseRt01 = House::create([
            'house_code' => 'RT01-A01',
            'rt_number' => '01',
            'block' => 'A',
            'number' => 1,
            'full_address' => 'Jl. Mawar No. 1, RT 01 / RW 05',
            'is_occupied' => true,
        ]);

        $this->wargaRt01 = User::create([
            'name' => 'Budi Santoso',
            'email' => 'budi@test.com',
            'password' => bcrypt('password'),
            'role' => 'warga',
            'rt_number' => '01',
            'house_id' => $this->houseRt01->id,
            'status' => 'approved',
            'nik' => '3201012345670001',
        ]);

        $this->wargaRt02 = User::create([
            'name' => 'Dewi Sartika',
            'email' => 'dewi@test.com',
            'password' => bcrypt('password'),
            'role' => 'warga',
            'rt_number' => '02',
            'status' => 'approved',
            'nik' => '3201012345670002',
        ]);

        $this->ketuaRt01 = User::create([
            'name' => 'Pak Joko RT01',
            'email' => 'rt01@test.com',
            'password' => bcrypt('password'),
            'role' => 'rt',
            'rt_number' => '01',
            'status' => 'approved',
        ]);

        $this->ketuaRw = User::create([
            'name' => 'Pak Hendra RW05',
            'email' => 'rw@test.com',
            'password' => bcrypt('password'),
            'role' => 'rw',
            'rt_number' => null,
            'status' => 'approved',
        ]);
    }

    /* =========================================================================
     * WHITE-BOX TESTS (Internal Logic, Model Casts, JSON History, Roles)
     * ========================================================================= */

    public function test_whitebox_complaint_creation_and_relations(): void
    {
        $complaint = Complaint::create([
            'user_id' => $this->wargaRt01->id,
            'category' => 'Kebersihan Lingkungan',
            'title' => 'Tumpukan Sampah Liar',
            'description' => 'Sampah menumpuk di depan lapangan voli RT 01.',
            'status' => 'laporan_masuk',
            'response_history' => [
                [
                    'timestamp' => now()->toIso8601String(),
                    'action' => 'laporan_masuk',
                    'notes' => 'Pengaduan telah masuk ke sistem.',
                    'by' => $this->wargaRt01->name,
                ]
            ],
        ]);

        $this->assertDatabaseHas('complaints', [
            'id' => $complaint->id,
            'user_id' => $this->wargaRt01->id,
            'status' => 'laporan_masuk',
        ]);

        $this->assertEquals($this->wargaRt01->id, $complaint->user->id);
        $this->assertIsArray($complaint->response_history);
        $this->assertCount(1, $complaint->response_history);
    }

    public function test_whitebox_response_history_array_appending(): void
    {
        $complaint = Complaint::create([
            'user_id' => $this->wargaRt01->id,
            'category' => 'Fasilitas Jalan / Lampu',
            'title' => 'Lampu PJU Padam',
            'description' => 'Lampu PJU nomor 03 padam.',
            'status' => 'laporan_masuk',
            'response_history' => [
                [
                    'timestamp' => now()->toIso8601String(),
                    'action' => 'laporan_masuk',
                    'notes' => 'Laporan masuk.',
                    'by' => $this->wargaRt01->name,
                ]
            ],
        ]);

        $response = $this->actingAs($this->ketuaRt01)
            ->patchJson("/api/admin/complaints/{$complaint->id}/status", [
                'status' => 'diproses',
                'notes' => 'Petugas maintenance telah dikirim ke lokasi.',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $complaint->refresh();
        $this->assertEquals('diproses', $complaint->status);
        $this->assertEquals($this->ketuaRt01->id, $complaint->handled_by);
        $this->assertCount(2, $complaint->response_history);
        $this->assertEquals('diproses', $complaint->response_history[1]['action']);
        $this->assertEquals('Petugas maintenance telah dikirim ke lokasi.', $complaint->response_history[1]['notes']);
    }

    public function test_whitebox_only_pengurus_roles_can_update_complaint_status(): void
    {
        $complaint = Complaint::create([
            'user_id' => $this->wargaRt01->id,
            'category' => 'Keamanan & Ketertiban',
            'title' => 'Portal Rusak',
            'description' => 'Portal macet.',
            'status' => 'laporan_masuk',
        ]);

        // Regular citizen attempts to update complaint status
        $response = $this->actingAs($this->wargaRt02)
            ->patchJson("/api/admin/complaints/{$complaint->id}/status", [
                'status' => 'diproses',
                'notes' => 'Warga biasa mencoba mengupdate.',
            ]);

        $response->assertStatus(403);
    }

    public function test_whitebox_status_lifecycle_progression_to_completion(): void
    {
        $complaint = Complaint::create([
            'user_id' => $this->wargaRt01->id,
            'category' => 'Saluran Air & Drainase',
            'title' => 'Saluran Air Tersumbat',
            'description' => 'Drainase tersumbat sampah ranting.',
            'status' => 'laporan_masuk',
            'response_history' => [
                [
                    'timestamp' => now()->toIso8601String(),
                    'action' => 'laporan_masuk',
                    'notes' => 'Laporan masuk.',
                    'by' => $this->wargaRt01->name,
                ]
            ],
        ]);

        // Step 1: RT changes to diproses
        $this->actingAs($this->ketuaRt01)
            ->patchJson("/api/admin/complaints/{$complaint->id}/status", [
                'status' => 'diproses',
                'notes' => 'Sedang dijadwalkan pembersihan drainase.',
            ])->assertStatus(200);

        // Step 2: RW changes to selesai
        $this->actingAs($this->ketuaRw)
            ->patchJson("/api/admin/complaints/{$complaint->id}/status", [
                'status' => 'selesai',
                'notes' => 'Saluran air telah bersih dan lancar kembali.',
            ])->assertStatus(200);

        $complaint->refresh();
        $this->assertEquals('selesai', $complaint->status);
        $this->assertEquals($this->ketuaRw->id, $complaint->handled_by);
        $this->assertCount(3, $complaint->response_history);
    }

    public function test_whitebox_photo_upload_is_stored_on_disk(): void
    {
        $file = UploadedFile::fake()->image('bukti_aduan.jpg', 600, 400);

        $response = $this->actingAs($this->wargaRt01)
            ->postJson('/api/complaints', [
                'category' => 'Kebersihan Lingkungan',
                'title' => 'Pohon Tumbang Menutup Jalan',
                'description' => 'Pohon mangga tumbang di Blok A setelah hujan deras.',
                'photo' => $file,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true);

        $complaint = Complaint::latest()->first();
        $this->assertNotNull($complaint->photo_path);

        $relativePath = str_replace('/storage/', '', $complaint->photo_path);
        Storage::disk('public')->assertExists($relativePath);
    }

    /* =========================================================================
     * BLACK-BOX TESTS (API Payloads, HTTP Status Codes, Validation, Scopes)
     * ========================================================================= */

    public function test_blackbox_citizen_can_submit_valid_complaint(): void
    {
        $payload = [
            'category' => 'Keamanan & Ketertiban',
            'title' => 'Kebisingan Tengah Malam',
            'description' => 'Ada aktivitas musik keras melewati jam 23.00 di rumah kosong.',
        ];

        $response = $this->actingAs($this->wargaRt01)
            ->postJson('/api/complaints', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.title', 'Kebisingan Tengah Malam')
            ->assertJsonPath('data.status', 'laporan_masuk');

        $this->assertDatabaseHas('complaints', [
            'user_id' => $this->wargaRt01->id,
            'title' => 'Kebisingan Tengah Malam',
            'status' => 'laporan_masuk',
        ]);
    }

    public function test_blackbox_complaint_validation_fails_on_missing_fields(): void
    {
        $response = $this->actingAs($this->wargaRt01)
            ->postJson('/api/complaints', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['category', 'title', 'description']);
    }

    public function test_blackbox_citizen_only_views_own_complaints(): void
    {
        Complaint::create([
            'user_id' => $this->wargaRt01->id,
            'category' => 'Fasilitas Jalan / Lampu',
            'title' => 'Aduan Warga 1',
            'description' => 'Deskripsi 1',
            'status' => 'laporan_masuk',
        ]);

        Complaint::create([
            'user_id' => $this->wargaRt02->id,
            'category' => 'Kebersihan Lingkungan',
            'title' => 'Aduan Warga 2',
            'description' => 'Deskripsi 2',
            'status' => 'laporan_masuk',
        ]);

        $response = $this->actingAs($this->wargaRt01)->getJson('/api/complaints');

        $response->assertStatus(200);
        $items = $response->json('data.data');
        $this->assertCount(1, $items);
        $this->assertEquals('Aduan Warga 1', $items[0]['title']);
    }

    public function test_blackbox_pengurus_views_all_complaints(): void
    {
        Complaint::create([
            'user_id' => $this->wargaRt01->id,
            'category' => 'Fasilitas Jalan / Lampu',
            'title' => 'Aduan Warga 1',
            'description' => 'Deskripsi 1',
            'status' => 'laporan_masuk',
        ]);

        Complaint::create([
            'user_id' => $this->wargaRt02->id,
            'category' => 'Kebersihan Lingkungan',
            'title' => 'Aduan Warga 2',
            'description' => 'Deskripsi 2',
            'status' => 'laporan_masuk',
        ]);

        // Ketua RW views all complaints
        $response = $this->actingAs($this->ketuaRw)->getJson('/api/complaints');

        $response->assertStatus(200);
        $items = $response->json('data.data');
        $this->assertCount(2, $items);
    }

    public function test_blackbox_filters_by_status_and_category(): void
    {
        Complaint::create([
            'user_id' => $this->wargaRt01->id,
            'category' => 'Kebersihan Lingkungan',
            'title' => 'Sampah Organik',
            'description' => 'Deskripsi',
            'status' => 'diproses',
        ]);

        Complaint::create([
            'user_id' => $this->wargaRt01->id,
            'category' => 'Fasilitas Jalan / Lampu',
            'title' => 'Tiang Lampu Miring',
            'description' => 'Deskripsi',
            'status' => 'laporan_masuk',
        ]);

        // Filter status = diproses
        $resFilterStatus = $this->actingAs($this->ketuaRw)->getJson('/api/complaints?status=diproses');
        $this->assertCount(1, $resFilterStatus->json('data.data'));
        $this->assertEquals('Sampah Organik', $resFilterStatus->json('data.data')[0]['title']);

        // Filter category = Fasilitas Jalan / Lampu
        $resFilterCategory = $this->actingAs($this->ketuaRw)->getJson('/api/complaints?category=' . urlencode('Fasilitas Jalan / Lampu'));
        $this->assertCount(1, $resFilterCategory->json('data.data'));
        $this->assertEquals('Tiang Lampu Miring', $resFilterCategory->json('data.data')[0]['title']);
    }
}
