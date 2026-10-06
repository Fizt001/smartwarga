<?php

namespace Tests\Feature;

use App\Models\Asset;
use App\Models\AssetLoan;
use App\Models\House;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AssetLoanTest extends TestCase
{
    use RefreshDatabase;

    protected User $wargaRt01;
    protected User $wargaRt02;
    protected User $ketuaRt01;
    protected User $ketuaRt02;
    protected User $ketuaRw;
    protected House $houseRt01;
    protected House $houseRt02;
    protected Asset $tendaAsset;
    protected Asset $soundAsset;

    protected function setUp(): void
    {
        parent::setUp();

        $this->houseRt01 = House::create([
            'house_code' => 'RT01-A01',
            'rt_number' => '01',
            'block' => 'A',
            'number' => 1,
            'full_address' => 'Jl. Mawar No. 1, RT 01 / RW 05',
            'is_occupied' => true,
        ]);

        $this->houseRt02 = House::create([
            'house_code' => 'RT02-B01',
            'rt_number' => '02',
            'block' => 'B',
            'number' => 1,
            'full_address' => 'Jl. Melati No. 1, RT 02 / RW 05',
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
            'name' => 'Siti Aminah',
            'email' => 'siti@test.com',
            'password' => bcrypt('password'),
            'role' => 'warga',
            'rt_number' => '02',
            'house_id' => $this->houseRt02->id,
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

        $this->ketuaRt02 = User::create([
            'name' => 'Pak Bambang RT02',
            'email' => 'rt02@test.com',
            'password' => bcrypt('password'),
            'role' => 'rt',
            'rt_number' => '02',
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

        // Seed Assets
        $this->tendaAsset = Asset::create([
            'name' => 'Tenda Terop Balai RT 4x6M',
            'category' => 'tenda',
            'quantity' => 2,
            'condition' => 'Baik Lengkap',
            'rt_number' => '01',
        ]);

        $this->soundAsset = Asset::create([
            'name' => 'Sound System Portable Wireless',
            'category' => 'sound_system',
            'quantity' => 1,
            'condition' => 'Normal 2 Mic',
            'rt_number' => '01',
        ]);
    }

    /* =========================================================================
     * WHITE-BOX TESTS (Internal Logic, Relationships, Stock, State Transitions)
     * ========================================================================= */

    public function test_whitebox_asset_and_loan_creation_and_relations(): void
    {
        $loan = AssetLoan::create([
            'asset_id' => $this->tendaAsset->id,
            'user_id' => $this->wargaRt01->id,
            'quantity' => 1,
            'loan_date' => now()->toDateString(),
            'return_date' => now()->addDays(2)->toDateString(),
            'status' => 'requested',
            'donation_amount' => 50000,
        ]);

        $this->assertDatabaseHas('asset_loans', [
            'id' => $loan->id,
            'asset_id' => $this->tendaAsset->id,
            'user_id' => $this->wargaRt01->id,
            'status' => 'requested',
        ]);

        $this->assertEquals($this->tendaAsset->id, $loan->asset->id);
        $this->assertEquals($this->wargaRt01->id, $loan->user->id);
        $this->assertNull($loan->approver);
    }

    public function test_whitebox_stock_check_fails_if_requested_quantity_exceeds_stock(): void
    {
        // Tenda asset only has quantity 2
        $response = $this->actingAs($this->wargaRt01)
            ->postJson('/api/assets/loans', [
                'asset_id' => $this->tendaAsset->id,
                'quantity' => 5, // Exceeds stock 2
                'loan_date' => now()->toDateString(),
                'return_date' => now()->addDays(2)->toDateString(),
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonFragment(['message' => 'Stok aset tidak mencukupi (Tersedia: 2 unit).']);
    }

    public function test_whitebox_role_authorization_on_approval_and_return(): void
    {
        $loan = AssetLoan::create([
            'asset_id' => $this->soundAsset->id,
            'user_id' => $this->wargaRt01->id,
            'quantity' => 1,
            'loan_date' => now()->toDateString(),
            'return_date' => now()->addDays(1)->toDateString(),
            'status' => 'requested',
        ]);

        // Regular citizen attempts to approve
        $resApprove = $this->actingAs($this->wargaRt02)
            ->postJson("/api/admin/assets/loans/{$loan->id}/approve");
        $resApprove->assertStatus(403);

        // Regular citizen attempts to mark return
        $resReturn = $this->actingAs($this->wargaRt02)
            ->postJson("/api/admin/assets/loans/{$loan->id}/return");
        $resReturn->assertStatus(403);

        // Regular citizen attempts to add asset
        $resStoreAsset = $this->actingAs($this->wargaRt02)
            ->postJson('/api/admin/assets', [
                'name' => 'Kursi Tambahan',
                'category' => 'kursi',
                'quantity' => 10,
            ]);
        $resStoreAsset->assertStatus(403);
    }

    public function test_whitebox_state_machine_requested_to_approved(): void
    {
        $loan = AssetLoan::create([
            'asset_id' => $this->soundAsset->id,
            'user_id' => $this->wargaRt01->id,
            'quantity' => 1,
            'loan_date' => now()->toDateString(),
            'return_date' => now()->addDays(1)->toDateString(),
            'status' => 'requested',
        ]);

        $response = $this->actingAs($this->ketuaRt01)
            ->postJson("/api/admin/assets/loans/{$loan->id}/approve");

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $loan->refresh();
        $this->assertEquals('approved', $loan->status);
        $this->assertEquals($this->ketuaRt01->id, $loan->approved_by);

        // Attempting to approve again fails due to status not 'requested'
        $responseDuplicate = $this->actingAs($this->ketuaRt01)
            ->postJson("/api/admin/assets/loans/{$loan->id}/approve");
        $responseDuplicate->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_whitebox_state_machine_approved_to_returned(): void
    {
        $loan = AssetLoan::create([
            'asset_id' => $this->soundAsset->id,
            'user_id' => $this->wargaRt01->id,
            'quantity' => 1,
            'loan_date' => now()->subDays(2)->toDateString(),
            'return_date' => now()->subDay()->toDateString(),
            'status' => 'approved',
            'approved_by' => $this->ketuaRt01->id,
        ]);

        $response = $this->actingAs($this->ketuaRt01)
            ->postJson("/api/admin/assets/loans/{$loan->id}/return");

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $loan->refresh();
        $this->assertEquals('returned', $loan->status);
        $this->assertEquals(now()->toDateString(), $loan->actual_return_date->toDateString());
    }

    public function test_whitebox_cross_rt_isolation_prevents_unauthorized_rt_approval(): void
    {
        // Loan by resident in RT 01
        $loan = AssetLoan::create([
            'asset_id' => $this->tendaAsset->id,
            'user_id' => $this->wargaRt01->id,
            'quantity' => 1,
            'loan_date' => now()->toDateString(),
            'return_date' => now()->addDays(1)->toDateString(),
            'status' => 'requested',
        ]);

        // Ketua RT 02 attempts to approve RT 01 resident's loan
        $response = $this->actingAs($this->ketuaRt02)
            ->postJson("/api/admin/assets/loans/{$loan->id}/approve");

        $response->assertStatus(403)
            ->assertJsonPath('success', false);

        $loan->refresh();
        $this->assertEquals('requested', $loan->status);
    }

    public function test_whitebox_reject_loan_updates_status(): void
    {
        $loan = AssetLoan::create([
            'asset_id' => $this->tendaAsset->id,
            'user_id' => $this->wargaRt01->id,
            'quantity' => 2,
            'loan_date' => now()->toDateString(),
            'return_date' => now()->addDays(2)->toDateString(),
            'status' => 'requested',
        ]);

        $response = $this->actingAs($this->ketuaRt01)
            ->postJson("/api/admin/assets/loans/{$loan->id}/reject");

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $loan->refresh();
        $this->assertEquals('rejected', $loan->status);
    }

    public function test_whitebox_pengurus_can_store_new_asset_inventory(): void
    {
        $response = $this->actingAs($this->ketuaRt01)
            ->postJson('/api/admin/assets', [
                'name' => 'Kursi Plastik Napolly',
                'category' => 'kursi',
                'quantity' => 30,
                'condition' => 'Baru dan Bersih',
                'rt_number' => '01',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Kursi Plastik Napolly')
            ->assertJsonPath('data.quantity', 30);

        $this->assertDatabaseHas('assets', [
            'name' => 'Kursi Plastik Napolly',
            'quantity' => 30,
        ]);
    }

    /* =========================================================================
     * BLACK-BOX TESTS (API Payloads, HTTP Status Codes, Validation, Scopes)
     * ========================================================================= */

    public function test_blackbox_citizen_can_request_asset_loan(): void
    {
        $payload = [
            'asset_id' => $this->tendaAsset->id,
            'quantity' => 1,
            'loan_date' => now()->addDay()->toDateString(),
            'return_date' => now()->addDays(3)->toDateString(),
            'donation_amount' => 25000,
        ];

        $response = $this->actingAs($this->wargaRt01)
            ->postJson('/api/assets/loans', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.quantity', 1)
            ->assertJsonPath('data.status', 'requested');

        $this->assertDatabaseHas('asset_loans', [
            'user_id' => $this->wargaRt01->id,
            'asset_id' => $this->tendaAsset->id,
            'quantity' => 1,
            'status' => 'requested',
        ]);
    }

    public function test_blackbox_loan_request_validation_fails_on_invalid_data(): void
    {
        // 1. Missing required fields
        $responseEmpty = $this->actingAs($this->wargaRt01)
            ->postJson('/api/assets/loans', []);

        $responseEmpty->assertStatus(422)
            ->assertJsonValidationErrors(['asset_id', 'quantity', 'loan_date', 'return_date']);

        // 2. Return date before loan date
        $responseInvalidDate = $this->actingAs($this->wargaRt01)
            ->postJson('/api/assets/loans', [
                'asset_id' => $this->tendaAsset->id,
                'quantity' => 1,
                'loan_date' => now()->addDays(5)->toDateString(),
                'return_date' => now()->addDays(2)->toDateString(),
            ]);

        $responseInvalidDate->assertStatus(422)
            ->assertJsonValidationErrors(['return_date']);
    }

    public function test_blackbox_citizen_only_sees_own_loans_in_list(): void
    {
        AssetLoan::create([
            'asset_id' => $this->tendaAsset->id,
            'user_id' => $this->wargaRt01->id,
            'quantity' => 1,
            'loan_date' => now()->toDateString(),
            'return_date' => now()->addDay()->toDateString(),
            'status' => 'requested',
        ]);

        AssetLoan::create([
            'asset_id' => $this->soundAsset->id,
            'user_id' => $this->wargaRt02->id,
            'quantity' => 1,
            'loan_date' => now()->toDateString(),
            'return_date' => now()->addDay()->toDateString(),
            'status' => 'requested',
        ]);

        $response = $this->actingAs($this->wargaRt01)->getJson('/api/assets/loans');

        $response->assertStatus(200);
        $loans = $response->json('data.data');
        $this->assertCount(1, $loans);
        $this->assertEquals($this->wargaRt01->id, $loans[0]['user_id']);
    }

    public function test_blackbox_rt_sees_loans_scoped_to_their_rt(): void
    {
        AssetLoan::create([
            'asset_id' => $this->tendaAsset->id,
            'user_id' => $this->wargaRt01->id,
            'quantity' => 1,
            'loan_date' => now()->toDateString(),
            'return_date' => now()->addDay()->toDateString(),
            'status' => 'requested',
        ]);

        AssetLoan::create([
            'asset_id' => $this->soundAsset->id,
            'user_id' => $this->wargaRt02->id,
            'quantity' => 1,
            'loan_date' => now()->toDateString(),
            'return_date' => now()->addDay()->toDateString(),
            'status' => 'requested',
        ]);

        // RT 01 inspects list
        $responseRt01 = $this->actingAs($this->ketuaRt01)->getJson('/api/assets/loans');
        $responseRt01->assertStatus(200);
        $this->assertCount(1, $responseRt01->json('data.data'));

        // RW inspects list (sees all)
        $responseRw = $this->actingAs($this->ketuaRw)->getJson('/api/assets/loans');
        $responseRw->assertStatus(200);
        $this->assertCount(2, $responseRw->json('data.data'));
    }

    public function test_blackbox_list_assets_endpoint(): void
    {
        $response = $this->actingAs($this->wargaRt01)->getJson('/api/assets');

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertCount(2, $response->json('data'));
    }

    public function test_blackbox_full_loan_lifecycle_simulation(): void
    {
        // 1. Citizen submits loan request
        $createRes = $this->actingAs($this->wargaRt01)
            ->postJson('/api/assets/loans', [
                'asset_id' => $this->tendaAsset->id,
                'quantity' => 2,
                'loan_date' => now()->toDateString(),
                'return_date' => now()->addDays(2)->toDateString(),
                'donation_amount' => 50000,
            ]);
        $createRes->assertStatus(201);
        $loanId = $createRes->json('data.id');

        // 2. Ketua RT approves loan
        $approveRes = $this->actingAs($this->ketuaRt01)
            ->postJson("/api/admin/assets/loans/{$loanId}/approve");
        $approveRes->assertStatus(200)
            ->assertJsonPath('data.status', 'approved');

        // 3. Ketua RT marks returned
        $returnRes = $this->actingAs($this->ketuaRt01)
            ->postJson("/api/admin/assets/loans/{$loanId}/return");
        $returnRes->assertStatus(200)
            ->assertJsonPath('data.status', 'returned');
    }
}
