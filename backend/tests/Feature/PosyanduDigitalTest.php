<?php

namespace Tests\Feature;

use App\Models\ElderlyHealthRecord;
use App\Models\House;
use App\Models\ImmunizationRecord;
use App\Models\PosyanduRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PosyanduDigitalTest extends TestCase
{
    use RefreshDatabase;

    protected User $kader;
    protected User $wargaRt01;
    protected User $wargaRt02;

    protected function setUp(): void
    {
        parent::setUp();

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

        $this->kader = User::create([
            'name' => 'Ibu Siti (Kader Posyandu & Sekretaris)',
            'phone' => '081299990001',
            'email' => 'siti_kader@smartwarga.id',
            'password' => bcrypt('password'),
            'role' => 'sekretaris',
            'rt_number' => '01',
            'house_id' => $house1->id,
            'status' => 'approved',
        ]);

        $this->wargaRt01 = User::create([
            'name' => 'Budi Santoso',
            'phone' => '081299990002',
            'email' => 'budi_rt01@smartwarga.id',
            'password' => bcrypt('password'),
            'role' => 'warga',
            'rt_number' => '01',
            'house_id' => $house1->id,
            'status' => 'approved',
        ]);

        $this->wargaRt02 = User::create([
            'name' => 'Ahmad Fauzi',
            'phone' => '081299990003',
            'email' => 'ahmad_rt02@smartwarga.id',
            'password' => bcrypt('password'),
            'role' => 'warga',
            'rt_number' => '02',
            'house_id' => $house2->id,
            'status' => 'approved',
        ]);
    }

    /**
     * White-Box WB-01: KMS evaluation algorithm against WHO median curves
     */
    public function test_whitebox_kms_evaluation_algorithm(): void
    {
        // 1. Bayi Gizi Baik Normal (Usia 12 bulan, BB 9.5 kg, TB 75 cm)
        $normal = PosyanduRecord::evaluateKms(9.5, 75.0, 12, 'L');
        $this->assertEquals('green', $normal['kms_status']);
        $this->assertStringContainsString('Gizi Baik', $normal['nutrition_status']);

        // 2. Bayi Bawah Garis Merah / BGM (Usia 12 bulan, BB 4.5 kg, TB 70 cm)
        $bgm = PosyanduRecord::evaluateKms(4.5, 70.0, 12, 'L');
        $this->assertEquals('red', $bgm['kms_status']);
        $this->assertStringContainsString('BGM', $bgm['nutrition_status']);

        // 3. Indikasi Stunting (Usia 24 bulan, BB 11.5 kg, TB 60 cm - sangat pendek)
        $stunting = PosyanduRecord::evaluateKms(11.5, 60.0, 24, 'L');
        $this->assertStringContainsString('Indikasi Stunting', $stunting['nutrition_status']);

        // 4. Bayi Risiko Gizi Lebih / Overweight (Usia 12 bulan, BB 14.5 kg)
        $overweight = PosyanduRecord::evaluateKms(14.5, 75.0, 12, 'L');
        $this->assertEquals('yellow', $overweight['kms_status']);
        $this->assertStringContainsString('Risiko Gizi Lebih', $overweight['nutrition_status']);
    }

    /**
     * White-Box WB-02: JNC-7 Blood Pressure Classification algorithm
     */
    public function test_whitebox_blood_pressure_classification(): void
    {
        // Normal: <120 and <80
        $this->assertEquals('normal', ElderlyHealthRecord::classifyBloodPressure(115, 75));

        // Pre-hipertensi: 120-139 / 80-89
        $this->assertEquals('prehypertension', ElderlyHealthRecord::classifyBloodPressure(128, 84));

        // Hipertensi Derajat 1: 140-159 / 90-99
        $this->assertEquals('hypertension_stage1', ElderlyHealthRecord::classifyBloodPressure(145, 92));

        // Hipertensi Derajat 2: >=160 / >=100
        $this->assertEquals('hypertension_stage2', ElderlyHealthRecord::classifyBloodPressure(165, 102));

        // Hipotensi: <90 / <60
        $this->assertEquals('hypotension', ElderlyHealthRecord::classifyBloodPressure(85, 55));
    }

    /**
     * White-Box WB-03: Elderly Biomarker Risk Assessment Formulation
     */
    public function test_whitebox_elderly_biomarker_risk_formulation(): void
    {
        // Lansia dengan Hipertensi 155/95, Gula Darah 220 mg/dL, Asam Urat 8.2 mg/dL
        $eval = ElderlyHealthRecord::formulateRiskAssessment(155, 95, 220.0, 215.0, 8.2, 'L');

        $this->assertEquals('hypertension_stage1', $eval['blood_pressure_status']);
        $this->assertStringContainsString('Hipertensi', $eval['risk_assessment']);
        $this->assertStringContainsString('Risiko Hiperglikemia/Diabetes', $eval['risk_assessment']);
        $this->assertStringContainsString('Asam Urat Tinggi', $eval['risk_assessment']);
        $this->assertStringContainsString('Puskesmas', $eval['recommendations']);
        $this->assertStringContainsString('garam', $eval['recommendations']);
    }

    /**
     * White-Box WB-04: Auto age computation in months and officer attribution
     */
    public function test_whitebox_kms_store_auto_calculates_age_and_officer(): void
    {
        $response = $this->actingAs($this->kader)->postJson('/api/posyandu', [
            'child_name' => 'Rayyan Arsyad',
            'parent_user_id' => $this->wargaRt01->id,
            'birth_date' => now()->subMonths(10)->toDateString(),
            'gender' => 'L',
            'weight_kg' => 9.2,
            'height_cm' => 74.5,
            'head_circumference_cm' => 45.0,
            'vitamin_a' => true,
            'notes' => 'Tumbuh kembang aktif, nafsu makan baik.',
        ]);

        $response->assertStatus(201);
        $record = PosyanduRecord::first();

        $this->assertEquals('Rayyan Arsyad', $record->child_name);
        $this->assertEquals(10, $record->age_months);
        $this->assertEquals('green', $record->kms_status);
        $this->assertEquals($this->kader->id, $record->officer_id);
        $this->assertTrue($record->vitamin_a);
    }

    /**
     * White-Box WB-05: Immunization state transition from scheduled to completed
     */
    public function test_whitebox_immunization_state_transition(): void
    {
        $imm = ImmunizationRecord::create([
            'child_name' => 'Rayyan Arsyad',
            'parent_user_id' => $this->wargaRt01->id,
            'vaccine_name' => 'Polio 2 (Tetes)',
            'target_age_months' => 2,
            'scheduled_date' => now()->toDateString(),
            'status' => 'scheduled',
            'officer_id' => $this->kader->id,
        ]);

        $this->assertEquals('scheduled', $imm->status);
        $this->assertNull($imm->administered_date);

        // Update to completed
        $response = $this->actingAs($this->kader)->patchJson("/api/posyandu/immunizations/{$imm->id}", [
            'status' => 'completed',
            'administered_date' => now()->toDateString(),
            'batch_number' => 'BIO-POLIO-9981',
            'notes' => 'Imunisasi selesai tanpa efek samping.',
        ]);

        $response->assertStatus(200);
        $imm->refresh();

        $this->assertEquals('completed', $imm->status);
        $this->assertEquals(now()->toDateString(), $imm->administered_date->toDateString());
        $this->assertEquals('BIO-POLIO-9981', $imm->batch_number);
    }

    /**
     * Black-Box BB-01: Valid KMS Balita store request
     */
    public function test_blackbox_store_kms_balita_success(): void
    {
        $payload = [
            'child_name' => 'Alifa Zahra',
            'parent_user_id' => $this->wargaRt01->id,
            'birth_date' => '2025-10-01',
            'gender' => 'P',
            'age_months' => 12,
            'weight_kg' => 9.0,
            'height_cm' => 75.0,
        ];

        $response = $this->actingAs($this->kader)->postJson('/api/posyandu', $payload);
        $response->assertStatus(201);
        $response->assertJson([
            'success' => true,
            'data' => [
                'child_name' => 'Alifa Zahra',
                'kms_status' => 'green',
            ],
        ]);
    }

    /**
     * Black-Box BB-02: KMS validation limits (weight & height range)
     */
    public function test_blackbox_kms_validation_rejects_out_of_range(): void
    {
        // BB terlalu kecil (0.2 kg) & TB di luar jangkauan (20 cm)
        $response = $this->actingAs($this->kader)->postJson('/api/posyandu', [
            'child_name' => 'Invalid Baby',
            'weight_kg' => 0.2,
            'height_cm' => 20,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['weight_kg', 'height_cm']);
    }

    /**
     * Black-Box BB-03: Immunization schedule store and list
     */
    public function test_blackbox_immunization_schedule_store_and_list(): void
    {
        $payload = [
            'child_name' => 'Alifa Zahra',
            'parent_user_id' => $this->wargaRt01->id,
            'vaccine_name' => 'DPT-HB-Hib 1',
            'target_age_months' => 2,
            'scheduled_date' => now()->addDays(7)->toDateString(),
        ];

        $resStore = $this->actingAs($this->kader)->postJson('/api/posyandu/immunizations', $payload);
        $resStore->assertStatus(201);
        $resStore->assertJson(['success' => true]);

        $resList = $this->actingAs($this->kader)->getJson('/api/posyandu/immunizations');
        $resList->assertStatus(200);
        $this->assertCount(1, $resList->json('data.data'));
        $this->assertEquals('DPT-HB-Hib 1', $resList->json('data.data')[0]['vaccine_name']);
    }

    /**
     * Black-Box BB-04: Elderly health screening store with automated risk classification
     */
    public function test_blackbox_elderly_health_screening_store(): void
    {
        $payload = [
            'elderly_name' => 'Mbah Suwito',
            'user_id' => $this->wargaRt01->id,
            'gender' => 'L',
            'age' => 68,
            'rt_number' => '01',
            'systolic' => 150,
            'diastolic' => 95,
            'blood_sugar' => 135.0,
            'cholesterol' => 180.0,
            'uric_acid' => 5.5,
            'weight_kg' => 62.0,
            'waist_circumference_cm' => 84.0,
        ];

        $response = $this->actingAs($this->kader)->postJson('/api/posyandu/lansia', $payload);

        $response->assertStatus(201);
        $response->assertJson([
            'success' => true,
            'data' => [
                'elderly_name' => 'Mbah Suwito',
                'blood_pressure_status' => 'hypertension_stage1',
            ],
        ]);

        $this->assertDatabaseHas('elderly_health_records', [
            'elderly_name' => 'Mbah Suwito',
            'blood_pressure_status' => 'hypertension_stage1',
        ]);
    }

    /**
     * Black-Box BB-05: Elderly screening validation rejects invalid age or tensi
     */
    public function test_blackbox_elderly_validation_rejects_underage_and_invalid_tensi(): void
    {
        $response = $this->actingAs($this->kader)->postJson('/api/posyandu/lansia', [
            'elderly_name' => 'Pemuda',
            'gender' => 'L',
            'age' => 25, // Di bawah batas lansia 45 tahun
            'systolic' => 300, // Di atas batas valid 260
            'diastolic' => 30, // Di bawah batas valid 40
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['age', 'systolic', 'diastolic']);
    }

    /**
     * Black-Box BB-06: Privacy scoping ensures citizens only see their own family records
     */
    public function test_blackbox_citizen_privacy_scoping_for_balita_and_lansia(): void
    {
        // Record untuk Warga RT 01
        PosyanduRecord::create([
            'child_name' => 'Anak Warga RT 01',
            'parent_user_id' => $this->wargaRt01->id,
            'birth_date' => '2025-05-01',
            'weight_kg' => 8.5,
            'height_cm' => 72.0,
            'kms_status' => 'green',
            'measured_at' => now(),
            'officer_id' => $this->kader->id,
        ]);

        ElderlyHealthRecord::create([
            'user_id' => $this->wargaRt01->id,
            'elderly_name' => 'Kakek Warga RT 01',
            'gender' => 'L',
            'age' => 70,
            'rt_number' => '01',
            'systolic' => 120,
            'diastolic' => 80,
            'blood_pressure_status' => 'normal',
            'examined_at' => now(),
            'officer_id' => $this->kader->id,
        ]);

        // Record untuk Warga RT 02
        PosyanduRecord::create([
            'child_name' => 'Anak Warga RT 02',
            'parent_user_id' => $this->wargaRt02->id,
            'birth_date' => '2025-06-01',
            'weight_kg' => 7.8,
            'height_cm' => 70.0,
            'kms_status' => 'yellow',
            'measured_at' => now(),
            'officer_id' => $this->kader->id,
        ]);

        ElderlyHealthRecord::create([
            'user_id' => $this->wargaRt02->id,
            'elderly_name' => 'Nenek Warga RT 02',
            'gender' => 'P',
            'age' => 65,
            'rt_number' => '02',
            'systolic' => 135,
            'diastolic' => 85,
            'blood_pressure_status' => 'prehypertension',
            'examined_at' => now(),
            'officer_id' => $this->kader->id,
        ]);

        // Warga RT 01 hanya boleh melihat data keluarganya sendiri
        $resBalitaWarga1 = $this->actingAs($this->wargaRt01)->getJson('/api/posyandu');
        $resBalitaWarga1->assertStatus(200);
        $this->assertCount(1, $resBalitaWarga1->json('data.data'));
        $this->assertEquals('Anak Warga RT 01', $resBalitaWarga1->json('data.data')[0]['child_name']);

        $resLansiaWarga1 = $this->actingAs($this->wargaRt01)->getJson('/api/posyandu/lansia');
        $resLansiaWarga1->assertStatus(200);
        $this->assertCount(1, $resLansiaWarga1->json('data.data'));
        $this->assertEquals('Kakek Warga RT 01', $resLansiaWarga1->json('data.data')[0]['elderly_name']);

        // Kader / Pengurus dapat melihat seluruh data balita dan lansia
        $resBalitaKader = $this->actingAs($this->kader)->getJson('/api/posyandu');
        $resBalitaKader->assertStatus(200);
        $this->assertCount(2, $resBalitaKader->json('data.data'));

        $resLansiaKader = $this->actingAs($this->kader)->getJson('/api/posyandu/lansia');
        $resLansiaKader->assertStatus(200);
        $this->assertCount(2, $resLansiaKader->json('data.data'));
    }

    /**
     * Black-Box BB-07: Posyandu summary dashboard aggregation
     */
    public function test_blackbox_posyandu_dashboard_summary(): void
    {
        PosyanduRecord::create([
            'child_name' => 'Balita Sehat',
            'weight_kg' => 9.0,
            'height_cm' => 75.0,
            'kms_status' => 'green',
            'measured_at' => now(),
        ]);

        PosyanduRecord::create([
            'child_name' => 'Balita Perhatian',
            'weight_kg' => 6.0,
            'height_cm' => 70.0,
            'kms_status' => 'yellow',
            'measured_at' => now(),
        ]);

        ImmunizationRecord::create([
            'child_name' => 'Balita Sehat',
            'vaccine_name' => 'BCG',
            'scheduled_date' => now()->toDateString(),
            'status' => 'completed',
        ]);

        ElderlyHealthRecord::create([
            'elderly_name' => 'Lansia Normal',
            'gender' => 'L',
            'age' => 60,
            'systolic' => 118,
            'diastolic' => 78,
            'blood_pressure_status' => 'normal',
            'examined_at' => now(),
        ]);

        $response = $this->actingAs($this->kader)->getJson('/api/posyandu/summary');
        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'data' => [
                'balita' => [
                    'total_records' => 2,
                    'kms_green' => 1,
                    'kms_yellow' => 1,
                    'kms_red' => 0,
                ],
                'imunisasi' => [
                    'total' => 1,
                    'completed' => 1,
                ],
                'lansia' => [
                    'total_records' => 1,
                    'normal' => 1,
                ],
            ],
        ]);
    }
}
