<?php

namespace Tests\Feature;

use App\Models\House;
use App\Models\KoperasiLoan;
use App\Models\UmkmProduct;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class KoperasiAndUmkmTest extends TestCase
{
    use RefreshDatabase;

    protected User $wargaRt01;
    protected User $wargaRt02;
    protected User $bendahara;
    protected User $ketuaRt01;
    protected User $ketuaRt02;
    protected House $houseRt01;
    protected House $houseRt02;

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

        $this->bendahara = User::create([
            'name' => 'Ibu Ratna Bendahara',
            'email' => 'bendahara@test.com',
            'password' => bcrypt('password'),
            'role' => 'bendahara',
            'rt_number' => '01',
            'status' => 'approved',
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
    }

    /* =========================================================================
     * WHITE-BOX TESTS: KOPERASI SIMPAN PINJAM
     * ========================================================================= */

    public function test_whitebox_koperasi_installment_calculation_formula(): void
    {
        // Loan: Rp 3.000.000, Tenor: 6 months
        // Principal per month: 3.000.000 / 6 = 500.000
        // Monthly admin fee: 3.000.000 * 0.01 = 30.000
        // Total installment: 530.000
        $response = $this->actingAs($this->wargaRt01)
            ->postJson('/api/koperasi/loans', [
                'amount' => 3000000,
                'tenor_months' => 6,
                'purpose' => 'Modal belanja stok warung kelontong',
            ]);

        $response->assertStatus(201);
        $loan = KoperasiLoan::latest()->first();
        $this->assertEquals(530000.00, (float)$loan->monthly_installment);
        $this->assertEquals('submitted', $loan->status);
    }

    public function test_whitebox_koperasi_approval_disburses_to_wallet_and_creates_transaction(): void
    {
        $loan = KoperasiLoan::create([
            'user_id' => $this->wargaRt01->id,
            'amount' => 2000000,
            'tenor_months' => 6,
            'monthly_installment' => 353333.33,
            'purpose' => 'Beli etalase jualan jus buah',
            'status' => 'submitted',
        ]);

        $response = $this->actingAs($this->bendahara)
            ->postJson("/api/admin/koperasi/loans/{$loan->id}/approve", [
                'action' => 'approve',
                'disburse_to_wallet' => true,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $loan->refresh();
        $this->assertEquals('disbursed', $loan->status);
        $this->assertEquals($this->bendahara->id, $loan->approved_by);
        $this->assertNotNull($loan->disbursed_at);

        // Assert user's wallet is credited by Rp 2.000.000
        $wallet = Wallet::where('user_id', $this->wargaRt01->id)->first();
        $this->assertNotNull($wallet);
        $this->assertEquals(2000000.00, (float)$wallet->balance);

        $this->assertDatabaseHas('wallet_transactions', [
            'wallet_id' => $wallet->id,
            'user_id' => $this->wargaRt01->id,
            'category' => 'loan_disbursement',
            'amount' => 2000000.00,
            'status' => 'completed',
        ]);
    }

    public function test_whitebox_koperasi_rejection_updates_status(): void
    {
        $loan = KoperasiLoan::create([
            'user_id' => $this->wargaRt01->id,
            'amount' => 5000000,
            'tenor_months' => 12,
            'monthly_installment' => 466666.67,
            'purpose' => 'Modal usaha sampingan',
            'status' => 'submitted',
        ]);

        $response = $this->actingAs($this->bendahara)
            ->postJson("/api/admin/koperasi/loans/{$loan->id}/approve", [
                'action' => 'reject',
            ]);

        $response->assertStatus(200);
        $loan->refresh();
        $this->assertEquals('rejected', $loan->status);
    }

    public function test_whitebox_koperasi_prevents_duplicate_processing(): void
    {
        $loan = KoperasiLoan::create([
            'user_id' => $this->wargaRt01->id,
            'amount' => 1000000,
            'tenor_months' => 3,
            'monthly_installment' => 343333.33,
            'purpose' => 'Modal',
            'status' => 'disbursed',
        ]);

        $response = $this->actingAs($this->bendahara)
            ->postJson("/api/admin/koperasi/loans/{$loan->id}/approve", [
                'action' => 'approve',
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_whitebox_koperasi_rt_isolation_check(): void
    {
        $loan = KoperasiLoan::create([
            'user_id' => $this->wargaRt01->id,
            'amount' => 1000000,
            'tenor_months' => 3,
            'monthly_installment' => 343333.33,
            'purpose' => 'Modal',
            'status' => 'submitted',
        ]);

        // Ketua RT 02 attempts to approve RT 01 resident's loan
        $response = $this->actingAs($this->ketuaRt02)
            ->postJson("/api/admin/koperasi/loans/{$loan->id}/approve", [
                'action' => 'approve',
            ]);

        $response->assertStatus(403);
    }

    /* =========================================================================
     * WHITE-BOX TESTS: ETALASE UMKM WARGA
     * ========================================================================= */

    public function test_whitebox_umkm_whatsapp_link_formatting(): void
    {
        $response = $this->actingAs($this->wargaRt01)
            ->postJson('/api/umkm', [
                'name' => 'Kue Nastar Premium',
                'category' => 'Kuliner',
                'description' => 'Kue nastar wisman lembut isi nanas asli homemade.',
                'price' => 75000,
                'whatsapp_phone' => '0812-3456-7890',
            ]);

        $response->assertStatus(201);
        $product = UmkmProduct::latest()->first();

        // Phone cleaned to international format '6281234567890'
        $this->assertStringContainsString('https://wa.me/6281234567890', $product->whatsapp_link);
        $this->assertStringContainsString(urlencode('Kue Nastar Premium'), $product->whatsapp_link);
    }

    public function test_whitebox_umkm_ownership_authorization_on_edit_and_delete(): void
    {
        $product = UmkmProduct::create([
            'user_id' => $this->wargaRt01->id,
            'name' => 'Kopi Robusta Fresh',
            'category' => 'Minuman',
            'description' => 'Kopi biji sangrai fresh roasted.',
            'price' => 45000,
            'whatsapp_link' => 'https://wa.me/628123456',
            'is_active' => true,
        ]);

        // Citizen B attempts to edit Citizen A's product
        $resEdit = $this->actingAs($this->wargaRt02)
            ->putJson("/api/umkm/{$product->id}", [
                'price' => 10000,
            ]);
        $resEdit->assertStatus(403);

        // Citizen B attempts to delete Citizen A's product
        $resDelete = $this->actingAs($this->wargaRt02)
            ->deleteJson("/api/umkm/{$product->id}");
        $resDelete->assertStatus(403);

        // Owner successfully updates
        $resOwnerUpdate = $this->actingAs($this->wargaRt01)
            ->putJson("/api/umkm/{$product->id}", [
                'price' => 50000,
            ]);
        $resOwnerUpdate->assertStatus(200);
        $this->assertEquals(50000.00, (float)$product->fresh()->price);
    }

    public function test_whitebox_umkm_photo_upload_is_stored(): void
    {
        $file = UploadedFile::fake()->image('produk_umkm.png', 400, 400);

        $response = $this->actingAs($this->wargaRt01)
            ->postJson('/api/umkm', [
                'name' => 'Keripik Tempe Renyah',
                'category' => 'Snack',
                'description' => 'Keripik tempe gurih tanpa pengawet.',
                'price' => 15000,
                'whatsapp_phone' => '085712345678',
                'photo' => $file,
            ]);

        $response->assertStatus(201);
        $product = UmkmProduct::latest()->first();
        $this->assertNotNull($product->photo_path);

        $relativePath = str_replace('/storage/', '', $product->photo_path);
        Storage::disk('public')->assertExists($relativePath);
    }

    /* =========================================================================
     * BLACK-BOX TESTS (API Payloads, Scopes, Search, Validations)
     * ========================================================================= */

    public function test_blackbox_koperasi_loan_validation_ranges(): void
    {
        // 1. Amount below minimum Rp 500.000
        $resTooLow = $this->actingAs($this->wargaRt01)
            ->postJson('/api/koperasi/loans', [
                'amount' => 100000,
                'tenor_months' => 6,
                'purpose' => 'Kurang dari min',
            ]);
        $resTooLow->assertStatus(422)->assertJsonValidationErrors(['amount']);

        // 2. Amount above maximum Rp 10.000.000
        $resTooHigh = $this->actingAs($this->wargaRt01)
            ->postJson('/api/koperasi/loans', [
                'amount' => 15000000,
                'tenor_months' => 6,
                'purpose' => 'Lebih dari max',
            ]);
        $resTooHigh->assertStatus(422)->assertJsonValidationErrors(['amount']);

        // 3. Invalid tenor (e.g. 5 months)
        $resInvalidTenor = $this->actingAs($this->wargaRt01)
            ->postJson('/api/koperasi/loans', [
                'amount' => 2000000,
                'tenor_months' => 5,
                'purpose' => 'Tenor tidak baku',
            ]);
        $resInvalidTenor->assertStatus(422)->assertJsonValidationErrors(['tenor_months']);
    }

    public function test_blackbox_koperasi_citizen_only_sees_own_loans(): void
    {
        KoperasiLoan::create([
            'user_id' => $this->wargaRt01->id,
            'amount' => 1000000,
            'tenor_months' => 3,
            'monthly_installment' => 343333.33,
            'purpose' => 'Pinjaman 1',
            'status' => 'submitted',
        ]);

        KoperasiLoan::create([
            'user_id' => $this->wargaRt02->id,
            'amount' => 2000000,
            'tenor_months' => 6,
            'monthly_installment' => 353333.33,
            'purpose' => 'Pinjaman 2',
            'status' => 'submitted',
        ]);

        $response = $this->actingAs($this->wargaRt01)->getJson('/api/koperasi/loans');
        $response->assertStatus(200);
        $items = $response->json('data.data');
        $this->assertCount(1, $items);
        $this->assertEquals($this->wargaRt01->id, $items[0]['user_id']);
    }

    public function test_blackbox_umkm_index_supports_search_and_category_filter(): void
    {
        UmkmProduct::create([
            'user_id' => $this->wargaRt01->id,
            'name' => 'Sambal Bawang Pedas',
            'category' => 'Kuliner',
            'description' => 'Sambal bawang botol 150g.',
            'price' => 25000,
            'whatsapp_link' => 'https://wa.me/6281',
            'is_active' => true,
        ]);

        UmkmProduct::create([
            'user_id' => $this->wargaRt02->id,
            'name' => 'Jasa Servis AC Rumah',
            'category' => 'Jasa',
            'description' => 'Cuci AC dan isi freon.',
            'price' => 75000,
            'whatsapp_link' => 'https://wa.me/6282',
            'is_active' => true,
        ]);

        // Filter category = Kuliner
        $resCategory = $this->actingAs($this->wargaRt01)
            ->getJson('/api/umkm?category=Kuliner');
        $resCategory->assertStatus(200);
        $this->assertCount(1, $resCategory->json('data.data'));
        $this->assertEquals('Sambal Bawang Pedas', $resCategory->json('data.data')[0]['name']);

        // Search = Servis
        $resSearch = $this->actingAs($this->wargaRt01)
            ->getJson('/api/umkm?search=Servis');
        $resSearch->assertStatus(200);
        $this->assertCount(1, $resSearch->json('data.data'));
        $this->assertEquals('Jasa Servis AC Rumah', $resSearch->json('data.data')[0]['name']);
    }
}
