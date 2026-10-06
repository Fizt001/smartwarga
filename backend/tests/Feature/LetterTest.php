<?php

namespace Tests\Feature;

use App\Models\House;
use App\Models\Letter;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class LetterTest extends TestCase
{
    use RefreshDatabase;

    protected User $wargaRt01;
    protected User $wargaRt02;
    protected User $ketuaRt01;
    protected User $ketuaRt02;
    protected User $ketuaRw;
    protected House $houseRt01;
    protected House $houseRt02;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');

        // Setup House RT 01
        $this->houseRt01 = House::create([
            'house_code' => 'RT01-A01',
            'rt_number' => '01',
            'block' => 'A',
            'number' => 1,
            'full_address' => 'Jl. Mawar No. 1, RT 01 / RW 05',
            'is_occupied' => true,
        ]);

        // Setup House RT 02
        $this->houseRt02 = House::create([
            'house_code' => 'RT02-B01',
            'rt_number' => '02',
            'block' => 'B',
            'number' => 1,
            'full_address' => 'Jl. Melati No. 1, RT 02 / RW 05',
            'is_occupied' => true,
        ]);

        // Setup Warga RT 01
        $this->wargaRt01 = User::create([
            'name' => 'Budi Santoso',
            'email' => 'budi@test.com',
            'password' => bcrypt('password'),
            'role' => 'warga',
            'rt_number' => '01',
            'house_id' => $this->houseRt01->id,
            'status' => 'approved',
            'nik' => '3201012345670001',
            'no_kk' => '3201012345670099',
            'gender' => 'L',
        ]);

        // Setup Warga RT 02
        $this->wargaRt02 = User::create([
            'name' => 'Siti Aminah',
            'email' => 'siti@test.com',
            'password' => bcrypt('password'),
            'role' => 'warga',
            'rt_number' => '02',
            'house_id' => $this->houseRt02->id,
            'status' => 'approved',
            'nik' => '3201012345670002',
            'no_kk' => '3201012345670098',
            'gender' => 'P',
        ]);

        // Setup Ketua RT 01
        $this->ketuaRt01 = User::create([
            'name' => 'Pak Joko RT01',
            'email' => 'rt01@test.com',
            'password' => bcrypt('password'),
            'role' => 'rt',
            'rt_number' => '01',
            'status' => 'approved',
        ]);

        // Setup Ketua RT 02
        $this->ketuaRt02 = User::create([
            'name' => 'Pak Bambang RT02',
            'email' => 'rt02@test.com',
            'password' => bcrypt('password'),
            'role' => 'rt',
            'rt_number' => '02',
            'status' => 'approved',
        ]);

        // Setup Ketua RW
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
     * WHITE-BOX TESTS (Internal Logic, State Transitions, Constraints, RBAC)
     * ========================================================================= */

    public function test_whitebox_letter_model_creation_and_relations(): void
    {
        $letter = Letter::create([
            'user_id' => $this->wargaRt01->id,
            'type' => 'domisili',
            'purpose' => 'Pengurusan perpanjangan KTP',
            'status' => 'submitted',
        ]);

        $this->assertDatabaseHas('letters', [
            'id' => $letter->id,
            'user_id' => $this->wargaRt01->id,
            'status' => 'submitted',
        ]);

        $this->assertEquals($this->wargaRt01->id, $letter->user->id);
        $this->assertNull($letter->rtApprover);
        $this->assertNull($letter->rwApprover);
    }

    public function test_whitebox_state_transition_submitted_to_rt_approved(): void
    {
        $letter = Letter::create([
            'user_id' => $this->wargaRt01->id,
            'type' => 'skck',
            'purpose' => 'Melamar pekerjaan BUMN',
            'status' => 'submitted',
        ]);

        $response = $this->actingAs($this->ketuaRt01)
            ->postJson("/api/admin/letters/{$letter->id}/approve-rt");

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $letter->refresh();
        $this->assertEquals('rt_approved', $letter->status);
        $this->assertEquals($this->ketuaRt01->id, $letter->rt_approved_by);
        $this->assertNotNull($letter->rt_approved_at);
    }

    public function test_whitebox_cross_rt_isolation_prevents_unauthorized_rt_approval(): void
    {
        // Letter from citizen in RT 01
        $letter = Letter::create([
            'user_id' => $this->wargaRt01->id,
            'type' => 'domisili',
            'purpose' => 'Buka rekening tabungan bank',
            'status' => 'submitted',
        ]);

        // Ketua RT 02 attempts to approve RT 01's letter
        $response = $this->actingAs($this->ketuaRt02)
            ->postJson("/api/admin/letters/{$letter->id}/approve-rt");

        $response->assertStatus(403)
            ->assertJsonPath('success', false);

        $letter->refresh();
        $this->assertEquals('submitted', $letter->status);
        $this->assertNull($letter->rt_approved_by);
    }

    public function test_whitebox_rw_approval_requires_prior_rt_approval(): void
    {
        // Letter still in 'submitted' (not yet approved by RT)
        $letter = Letter::create([
            'user_id' => $this->wargaRt01->id,
            'type' => 'sktm',
            'purpose' => 'Beasiswa kuliah anak',
            'status' => 'submitted',
        ]);

        // Ketua RW attempts to approve directly
        $response = $this->actingAs($this->ketuaRw)
            ->postJson("/api/admin/letters/{$letter->id}/approve-rw");

        $response->assertStatus(422)
            ->assertJsonPath('success', false);

        $letter->refresh();
        $this->assertEquals('submitted', $letter->status);
        $this->assertNull($letter->rw_approved_by);
    }

    public function test_whitebox_non_rw_role_cannot_execute_rw_approval(): void
    {
        $letter = Letter::create([
            'user_id' => $this->wargaRt01->id,
            'type' => 'domisili',
            'purpose' => 'Surat domisili usaha mikro',
            'status' => 'rt_approved',
            'rt_approved_by' => $this->ketuaRt01->id,
            'rt_approved_at' => now(),
        ]);

        // RT attempts to execute RW approval
        $response = $this->actingAs($this->ketuaRt01)
            ->postJson("/api/admin/letters/{$letter->id}/approve-rw");

        $response->assertStatus(403)
            ->assertJsonPath('success', false);
    }

    public function test_whitebox_full_two_tier_approval_generates_pdf_artifact(): void
    {
        $letter = Letter::create([
            'user_id' => $this->wargaRt01->id,
            'type' => 'skck',
            'purpose' => 'Persyaratan pendaftaran CPNS',
            'status' => 'submitted',
        ]);

        // Tier 1: RT Approves
        $this->actingAs($this->ketuaRt01)
            ->postJson("/api/admin/letters/{$letter->id}/approve-rt")
            ->assertStatus(200);

        // Tier 2: RW Approves & triggers PDF generation
        $rwResponse = $this->actingAs($this->ketuaRw)
            ->postJson("/api/admin/letters/{$letter->id}/approve-rw");

        $rwResponse->assertStatus(200)
            ->assertJsonPath('success', true);

        $letter->refresh();
        $this->assertEquals('rw_approved', $letter->status);
        $this->assertEquals($this->ketuaRw->id, $letter->rw_approved_by);
        $this->assertNotNull($letter->rw_approved_at);
        $this->assertNotNull($letter->pdf_path);

        $relativePath = str_replace('/storage/', '', $letter->pdf_path);
        Storage::disk('public')->assertExists($relativePath);
    }

    public function test_whitebox_reject_letter_workflow(): void
    {
        $letter = Letter::create([
            'user_id' => $this->wargaRt01->id,
            'type' => 'lainnya',
            'purpose' => 'Permintaan surat tidak jelas',
            'status' => 'submitted',
        ]);

        $response = $this->actingAs($this->ketuaRt01)
            ->postJson("/api/admin/letters/{$letter->id}/reject", [
                'reason' => 'Data identitas belum lengkap, silakan lampirkan scan KTP terbaru.',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $letter->refresh();
        $this->assertEquals('rejected', $letter->status);
        $this->assertEquals('Data identitas belum lengkap, silakan lampirkan scan KTP terbaru.', $letter->rejected_reason);
    }

    public function test_whitebox_cannot_reject_already_rw_approved_letter(): void
    {
        $letter = Letter::create([
            'user_id' => $this->wargaRt01->id,
            'type' => 'domisili',
            'purpose' => 'Surat domisili',
            'status' => 'rw_approved',
            'rt_approved_by' => $this->ketuaRt01->id,
            'rt_approved_at' => now(),
            'rw_approved_by' => $this->ketuaRw->id,
            'rw_approved_at' => now(),
        ]);

        $response = $this->actingAs($this->ketuaRt01)
            ->postJson("/api/admin/letters/{$letter->id}/reject", [
                'reason' => 'Mencoba membatalkan surat yang sudah sah.',
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    /* =========================================================================
     * BLACK-BOX TESTS (API Payloads, HTTP Status Codes, Validation, Scopes)
     * ========================================================================= */

    public function test_blackbox_citizen_can_submit_valid_letter_request(): void
    {
        $payload = [
            'type' => 'domisili',
            'purpose' => 'Pengurusan beasiswa anak di sekolah negeri',
            'notes' => 'Membutuhkan surat sebelum hari Jumat',
        ];

        $response = $this->actingAs($this->wargaRt01)
            ->postJson('/api/letters', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.type', 'domisili')
            ->assertJsonPath('data.status', 'submitted');

        $this->assertDatabaseHas('letters', [
            'user_id' => $this->wargaRt01->id,
            'type' => 'domisili',
            'purpose' => 'Pengurusan beasiswa anak di sekolah negeri',
        ]);
    }

    public function test_blackbox_letter_submission_validation_fails_on_invalid_data(): void
    {
        // 1. Missing required fields
        $response = $this->actingAs($this->wargaRt01)
            ->postJson('/api/letters', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['type', 'purpose']);

        // 2. Invalid enum type
        $responseInvalidType = $this->actingAs($this->wargaRt01)
            ->postJson('/api/letters', [
                'type' => 'surat_nikah_palsu',
                'purpose' => 'Tujuan tes',
            ]);

        $responseInvalidType->assertStatus(422)
            ->assertJsonValidationErrors(['type']);
    }

    public function test_blackbox_citizen_only_sees_own_letters_in_index(): void
    {
        Letter::create([
            'user_id' => $this->wargaRt01->id,
            'type' => 'domisili',
            'purpose' => 'Surat Warga 1',
            'status' => 'submitted',
        ]);

        Letter::create([
            'user_id' => $this->wargaRt02->id,
            'type' => 'skck',
            'purpose' => 'Surat Warga 2',
            'status' => 'submitted',
        ]);

        $response = $this->actingAs($this->wargaRt01)->getJson('/api/letters');

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $letters = $response->json('data.data');
        $this->assertCount(1, $letters);
        $this->assertEquals($this->wargaRt01->id, $letters[0]['user_id']);
    }

    public function test_blackbox_rt_leader_sees_only_letters_from_their_rt(): void
    {
        Letter::create([
            'user_id' => $this->wargaRt01->id,
            'type' => 'domisili',
            'purpose' => 'Surat RT 01',
            'status' => 'submitted',
        ]);

        Letter::create([
            'user_id' => $this->wargaRt02->id,
            'type' => 'skck',
            'purpose' => 'Surat RT 02',
            'status' => 'submitted',
        ]);

        // RT 01 inspects list
        $responseRt01 = $this->actingAs($this->ketuaRt01)->getJson('/api/letters');
        $responseRt01->assertStatus(200);
        $lettersRt01 = $responseRt01->json('data.data');
        $this->assertCount(1, $lettersRt01);
        $this->assertEquals('Surat RT 01', $lettersRt01[0]['purpose']);

        // RW inspects list (sees all)
        $responseRw = $this->actingAs($this->ketuaRw)->getJson('/api/letters');
        $responseRw->assertStatus(200);
        $lettersRw = $responseRw->json('data.data');
        $this->assertCount(2, $lettersRw);
    }

    public function test_blackbox_download_pdf_endpoint(): void
    {
        // Generate valid letter with stored PDF
        $letter = Letter::create([
            'user_id' => $this->wargaRt01->id,
            'type' => 'domisili',
            'purpose' => 'Surat domisili sah',
            'status' => 'rw_approved',
            'rt_approved_by' => $this->ketuaRt01->id,
            'rt_approved_at' => now(),
            'rw_approved_by' => $this->ketuaRw->id,
            'rw_approved_at' => now(),
        ]);

        $fakePdfContent = '%PDF-1.4 test binary content';
        $fileName = "letters/surat_pengantar_{$letter->id}_test.pdf";
        Storage::disk('public')->put($fileName, $fakePdfContent);

        $letter->update(['pdf_path' => '/storage/' . $fileName]);

        $response = $this->get("/api/letters/{$letter->id}/download");

        $response->assertStatus(200);
        $this->assertStringContainsString('application/pdf', $response->headers->get('content-type'));
    }
}
