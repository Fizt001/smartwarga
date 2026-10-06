<?php

namespace Tests\Feature;

use App\Models\House;
use App\Models\IplBilling;
use App\Models\IplMaster;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class IplAccumulationTest extends TestCase
{
    use RefreshDatabase;

    private User $warga;
    private House $house;

    protected function setUp(): void
    {
        parent::setUp();

        $this->house = House::create([
            'rt_number' => '01',
            'block' => 'A',
            'number' => 1,
            'house_code' => 'RT01-A01',
            'full_address' => 'RT 01 Blok A No. 1',
            'is_occupied' => true,
        ]);

        $this->warga = User::factory()->create([
            'role' => 'warga',
            'status' => 'approved',
            'rt_number' => '01',
            'house_id' => $this->house->id,
            'is_head_of_house' => true,
        ]);

        $this->house->update(['head_of_family_id' => $this->warga->id]);

        Wallet::create([
            'user_id' => $this->warga->id,
            'balance' => 200000,
            'is_active' => true,
        ]);
    }

    public function test_all_time_unpaid_ipl_accumulated_across_multiple_months_and_years(): void
    {
        // 1. Buat master IPL untuk 3 periode berbeda (misal 2025 bulan 12, 2026 bulan 1, 2026 bulan 2)
        $master1 = IplMaster::create([
            'rt_number' => '01',
            'period_month' => 12,
            'period_year' => 2025,
            'base_ipl_amount' => 30000,
            'rw_contribution_amount' => 20000,
            'total_amount' => 50000,
            'created_by' => $this->warga->id,
        ]);

        $master2 = IplMaster::create([
            'rt_number' => '01',
            'period_month' => 1,
            'period_year' => 2026,
            'base_ipl_amount' => 30000,
            'rw_contribution_amount' => 20000,
            'total_amount' => 50000,
            'created_by' => $this->warga->id,
        ]);

        $master3 = IplMaster::create([
            'rt_number' => '01',
            'period_month' => 2,
            'period_year' => 2026,
            'base_ipl_amount' => 30000,
            'rw_contribution_amount' => 20000,
            'total_amount' => 50000,
            'created_by' => $this->warga->id,
        ]);

        // 2. Buat tagihan belum lunas untuk rumah warga
        $bill1 = IplBilling::create([
            'ipl_master_id' => $master1->id,
            'user_id' => $this->warga->id,
            'house_id' => $this->house->id,
            'amount' => 50000,
            'status' => 'unpaid',
        ]);

        $bill2 = IplBilling::create([
            'ipl_master_id' => $master2->id,
            'user_id' => $this->warga->id,
            'house_id' => $this->house->id,
            'amount' => 50000,
            'status' => 'unpaid',
        ]);

        $bill3 = IplBilling::create([
            'ipl_master_id' => $master3->id,
            'user_id' => $this->warga->id,
            'house_id' => $this->house->id,
            'amount' => 50000,
            'status' => 'unpaid',
        ]);

        // 3. Test endpoint GET /api/ipl/billings?status=unpaid
        $response = $this->actingAs($this->warga)
            ->getJson('/api/ipl/billings?status=unpaid');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'summary' => [
                    'all_time_unpaid_amount' => 150000,
                    'all_time_unpaid_count' => 3,
                    'all_time_paid_amount' => 0,
                    'all_time_paid_count' => 0,
                ],
            ]);

        // 4. Test endpoint GET /api/ipl/annual-calendar?year=2026
        $calResponse = $this->actingAs($this->warga)
            ->getJson('/api/ipl/annual-calendar?year=2026');

        $calResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'statistics' => [
                    'unpaid_months' => 2, // Tahun 2026 saja ada 2 bulan
                    'total_unpaid' => 100000,
                    'all_time_unpaid_amount' => 150000, // Lintas tahun (termasuk Des 2025)
                    'all_time_unpaid_months' => 3,
                ],
            ]);

        // 5. Bayar salah satu tagihan via dompet
        $payResponse = $this->actingAs($this->warga)
            ->postJson("/api/ipl/billings/{$bill1->id}/pay-wallet");
        $payResponse->assertStatus(200);

        // 6. Verifikasi akumulasi berkurang menjadi 2 bulan (Rp 100.000)
        $afterPayResponse = $this->actingAs($this->warga)
            ->getJson('/api/ipl/billings?status=unpaid');

        $afterPayResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'summary' => [
                    'all_time_unpaid_amount' => 100000,
                    'all_time_unpaid_count' => 2,
                    'all_time_paid_amount' => 50000,
                    'all_time_paid_count' => 1,
                ],
            ]);
    }
}
