<?php

namespace Tests\Feature;

use App\Models\Ambulance;
use App\Models\AmbulanceBooking;
use App\Models\House;
use App\Models\RukamReport;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RukamAndAmbulanceTest extends TestCase
{
    use RefreshDatabase;

    protected User $ketuaRt;
    protected User $bendahara;
    protected User $wargaPelapor;
    protected User $wargaLain;
    protected Ambulance $ambulance;

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
            'rt_number' => '01',
            'full_address' => 'Blok B No. 02 RT 01',
            'is_occupied' => true,
        ]);

        $this->ketuaRt = User::create([
            'name' => 'Ketua RT 01',
            'phone' => '081299990001',
            'email' => 'ketua_rt01@smartwarga.id',
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

        $this->wargaPelapor = User::create([
            'name' => 'Budi Santoso',
            'phone' => '081299990003',
            'email' => 'budi_warga@smartwarga.id',
            'password' => bcrypt('password'),
            'role' => 'warga',
            'rt_number' => '01',
            'house_id' => $house2->id,
            'status' => 'approved',
        ]);

        $this->wargaLain = User::create([
            'name' => 'Ahmad Warga Lain',
            'phone' => '081299990004',
            'email' => 'ahmad_warga@smartwarga.id',
            'password' => bcrypt('password'),
            'role' => 'warga',
            'rt_number' => '01',
            'house_id' => $house2->id,
            'status' => 'approved',
        ]);

        $this->ambulance = Ambulance::create([
            'vehicle_number' => 'B 1928 SWR',
            'name' => 'Ambulans APV Siaga RW 05',
            'type' => 'multipurpose',
            'status' => 'available',
            'driver_name' => 'Pak Joko',
            'driver_phone' => '081288991122',
            'equipment' => ['Tabung O2', 'Brankar Dorong', 'P3K'],
            'notes' => 'Armada siaga 24 jam.',
        ]);
    }

    // ==========================================
    // WHITE-BOX TESTING (Logic, State Transitions, Atomic Transactions)
    // ==========================================

    /**
     * White-Box: Verify auto-creation of AmbulanceBooking when needs_ambulance flag is true.
     */
    public function test_white_box_rukam_auto_creates_ambulance_booking_when_flag_true(): void
    {
        $response = $this->actingAs($this->wargaPelapor)->postJson('/api/rukam', [
            'deceased_name' => 'H. Achmad Soebardjo',
            'deceased_nik' => '3171012304550001',
            'deceased_address' => 'Jl. Mawar Indah Blok B No. 14, RT 01',
            'relation' => 'Orang Tua',
            'date_of_death' => '2026-10-06',
            'time_of_death' => '05:30 WIB',
            'cause_of_death' => 'Sakit Usia Lanjut',
            'burial_location' => 'TPU Tanah Kusir Blok AA-1',
            'needs_ambulance' => true,
            'needs_tent_and_chairs' => true,
        ]);

        $response->assertStatus(201);
        $reportId = $response->json('data.id');

        $this->assertDatabaseHas('rukam_reports', [
            'id' => $reportId,
            'deceased_name' => 'H. Achmad Soebardjo',
            'status' => 'reported',
            'needs_ambulance' => true,
            'disbursement_amount' => 1500000.00,
        ]);

        // Assert ambulance booking automatically generated
        $this->assertDatabaseHas('ambulance_bookings', [
            'rukam_report_id' => $reportId,
            'user_id' => $this->wargaPelapor->id,
            'service_type' => 'jenazah',
            'status' => 'requested',
            'destination_address' => 'TPU Tanah Kusir Blok AA-1',
        ]);
    }

    /**
     * White-Box: Verify no AmbulanceBooking is created when needs_ambulance flag is false.
     */
    public function test_white_box_rukam_does_not_create_ambulance_when_flag_false(): void
    {
        $response = $this->actingAs($this->wargaPelapor)->postJson('/api/rukam', [
            'deceased_name' => 'Hj. Fatimah',
            'deceased_address' => 'Jl. Melati Blok A No. 01',
            'relation' => 'Ibu',
            'needs_ambulance' => false,
        ]);

        $response->assertStatus(201);
        $reportId = $response->json('data.id');

        $this->assertDatabaseMissing('ambulance_bookings', [
            'rukam_report_id' => $reportId,
        ]);
    }

    /**
     * White-Box: Test RUKAM verification state transition (reported -> verified).
     */
    public function test_white_box_rukam_verification_state_transition(): void
    {
        $report = RukamReport::create([
            'reported_by' => $this->wargaPelapor->id,
            'deceased_name' => 'Alm. Soepomo',
            'deceased_address' => 'Jl. Kenanga No. 5',
            'relation' => 'Ayah',
            'status' => 'reported',
            'disbursement_amount' => 1500000.00,
        ]);

        $response = $this->actingAs($this->ketuaRt)->postJson("/api/rukam/{$report->id}/verify", [
            'notes' => 'Dokumen surat kematian RS telah lengkap dan valid.',
        ]);

        $response->assertStatus(200);
        $this->assertEquals('verified', $report->fresh()->status);
        $this->assertEquals($this->ketuaRt->id, $report->fresh()->verified_by);
        $this->assertNotNull($report->fresh()->verified_at);
    }

    /**
     * White-Box: Test disbursement atomic transaction, wallet crediting, and ledger entry.
     */
    public function test_white_box_rukam_disbursement_credits_wallet_and_creates_transaction(): void
    {
        $wallet = Wallet::create(['user_id' => $this->wargaPelapor->id, 'balance' => 500000.00]);

        $report = RukamReport::create([
            'reported_by' => $this->wargaPelapor->id,
            'deceased_name' => 'Alm. Bapak Kartono',
            'deceased_address' => 'Blok B No. 02 RT 01',
            'relation' => 'Orang Tua',
            'status' => 'verified',
            'disbursement_amount' => 1500000.00,
        ]);

        $response = $this->actingAs($this->bendahara)->postJson("/api/rukam/{$report->id}/disburse", [
            'amount' => 1500000.00,
            'disburse_to_wallet' => true,
        ]);

        $response->assertStatus(200);

        // Assert report state
        $this->assertEquals('disbursed', $report->fresh()->status);
        $this->assertEquals($this->bendahara->id, $report->fresh()->disbursed_by);
        $this->assertNotNull($report->fresh()->disbursed_at);

        // Assert wallet credited: 500k + 1.5jt = 2.0jt
        $this->assertEquals(2000000.00, $wallet->fresh()->balance);

        // Assert transaction ledger
        $this->assertDatabaseHas('wallet_transactions', [
            'wallet_id' => $wallet->id,
            'user_id' => $this->wargaPelapor->id,
            'type' => 'credit',
            'amount' => 1500000.00,
            'reference_id' => 'RUKAM-AID-' . $report->id,
            'status' => 'completed',
        ]);
    }

    /**
     * White-Box: Guard against double disbursement (Cannot disburse twice).
     */
    public function test_white_box_rukam_cannot_be_disbursed_twice(): void
    {
        $report = RukamReport::create([
            'reported_by' => $this->wargaPelapor->id,
            'deceased_name' => 'Alm. Sudirman',
            'deceased_address' => 'Blok B No. 02 RT 01',
            'relation' => 'Orang Tua',
            'status' => 'disbursed',
            'disbursement_amount' => 1500000.00,
        ]);

        $response = $this->actingAs($this->bendahara)->postJson("/api/rukam/{$report->id}/disburse", [
            'amount' => 1500000.00,
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Dana santunan RUKAM sudah dicairkan sebelumnya.',
            ]);
    }

    /**
     * White-Box: Ambulance dispatch state machine (booking dispatched -> vehicle in_service).
     */
    public function test_white_box_ambulance_dispatch_flips_vehicle_status_to_in_service(): void
    {
        $booking = AmbulanceBooking::create([
            'booking_code' => 'AMB-TEST-001',
            'user_id' => $this->wargaPelapor->id,
            'patient_name' => 'Ibu Siti (Gawat Darurat)',
            'service_type' => 'emergency',
            'urgency_level' => 'urgent',
            'pickup_address' => 'Blok B No. 02 RT 01',
            'destination_address' => 'IGD RS Fatmawati',
            'status' => 'requested',
        ]);

        $this->assertEquals('available', $this->ambulance->status);

        $response = $this->actingAs($this->ketuaRt)->postJson("/api/ambulances/bookings/{$booking->id}/dispatch", [
            'ambulance_id' => $this->ambulance->id,
            'driver_name' => 'Pak Bambang',
            'driver_phone' => '081234567890',
        ]);

        $response->assertStatus(200);

        // Booking status is dispatched
        $this->assertEquals('dispatched', $booking->fresh()->status);
        $this->assertEquals($this->ambulance->id, $booking->fresh()->ambulance_id);
        $this->assertEquals('Pak Bambang', $booking->fresh()->driver_name);

        // Ambulance vehicle status flips to in_service
        $this->assertEquals('in_service', $this->ambulance->fresh()->status);
    }

    /**
     * White-Box: Ambulance complete trip state machine (vehicle returns to available).
     */
    public function test_white_box_ambulance_complete_trip_returns_vehicle_to_available(): void
    {
        $this->ambulance->update(['status' => 'in_service']);

        $booking = AmbulanceBooking::create([
            'booking_code' => 'AMB-TEST-002',
            'user_id' => $this->wargaPelapor->id,
            'ambulance_id' => $this->ambulance->id,
            'patient_name' => 'Pasien Rujukan',
            'service_type' => 'rujukan',
            'urgency_level' => 'scheduled',
            'pickup_address' => 'Blok B No. 02 RT 01',
            'destination_address' => 'Puskesmas Cilandak',
            'status' => 'dispatched',
        ]);

        $response = $this->actingAs($this->ketuaRt)->postJson("/api/ambulances/bookings/{$booking->id}/complete");

        $response->assertStatus(200);

        // Assert booking completed
        $this->assertEquals('completed', $booking->fresh()->status);
        $this->assertNotNull($booking->fresh()->completed_at);

        // Assert vehicle back to available
        $this->assertEquals('available', $this->ambulance->fresh()->status);
    }

    /**
     * White-Box: Ambulance cancel booking releases vehicle if already dispatched.
     */
    public function test_white_box_ambulance_cancel_releases_assigned_vehicle(): void
    {
        $this->ambulance->update(['status' => 'in_service']);

        $booking = AmbulanceBooking::create([
            'booking_code' => 'AMB-TEST-003',
            'user_id' => $this->wargaPelapor->id,
            'ambulance_id' => $this->ambulance->id,
            'patient_name' => 'Pasien Batal',
            'service_type' => 'emergency',
            'urgency_level' => 'urgent',
            'pickup_address' => 'Blok B No. 02 RT 01',
            'destination_address' => 'RS Prikasih',
            'status' => 'dispatched',
        ]);

        $response = $this->actingAs($this->wargaPelapor)->postJson("/api/ambulances/bookings/{$booking->id}/cancel");

        $response->assertStatus(200);
        $this->assertEquals('cancelled', $booking->fresh()->status);
        $this->assertEquals('available', $this->ambulance->fresh()->status);
    }

    // ==========================================
    // BLACK-BOX TESTING (API Contracts, Status Codes, Validation, Auth)
    // ==========================================

    /**
     * Black-Box: GET /api/rukam and GET /api/rukam/summary returns 200 with valid schema.
     */
    public function test_black_box_list_rukam_and_summary_endpoints(): void
    {
        RukamReport::create([
            'reported_by' => $this->wargaPelapor->id,
            'deceased_name' => 'Alm. Wiryono',
            'deceased_address' => 'RT 01',
            'relation' => 'Kakek',
            'status' => 'reported',
            'disbursement_amount' => 1500000.00,
        ]);

        // 1. List
        $responseList = $this->actingAs($this->wargaPelapor)->getJson('/api/rukam');
        $responseList->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'data' => [
                        '*' => [
                            'id',
                            'deceased_name',
                            'relation',
                            'status',
                            'disbursement_amount',
                        ],
                    ],
                ],
            ]);

        // 2. Summary
        $responseSum = $this->actingAs($this->wargaPelapor)->getJson('/api/rukam/summary');
        $responseSum->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'total_deceased',
                    'total_disbursed_nominal',
                    'pending_verification',
                    'verified_waiting',
                    'total_ambulances',
                    'ambulances_available',
                    'active_bookings',
                    'completed_trips',
                ],
            ]);
    }

    /**
     * Black-Box: Validation error (422) on missing mandatory RUKAM fields.
     */
    public function test_black_box_rukam_validation_errors(): void
    {
        $response = $this->actingAs($this->wargaPelapor)->postJson('/api/rukam', [
            // Missing deceased_name, deceased_address, and relation
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['deceased_name', 'deceased_address', 'relation']);
    }

    /**
     * Black-Box: Ordinary warga cannot verify or disburse RUKAM (403 Forbidden).
     */
    public function test_black_box_warga_cannot_verify_or_disburse(): void
    {
        $report = RukamReport::create([
            'reported_by' => $this->wargaPelapor->id,
            'deceased_name' => 'Alm. Kasim',
            'deceased_address' => 'RT 01',
            'relation' => 'Paman',
            'status' => 'reported',
        ]);

        // Ordinary warga tries to verify
        $resVerify = $this->actingAs($this->wargaLain)->postJson("/api/rukam/{$report->id}/verify");
        $resVerify->assertStatus(403);

        // Ordinary warga tries to disburse
        $resDisburse = $this->actingAs($this->wargaLain)->postJson("/api/rukam/{$report->id}/disburse", [
            'amount' => 1500000,
        ]);
        $resDisburse->assertStatus(403);
    }

    /**
     * Black-Box: Emergency ambulance booking API contract (POST /api/ambulances/bookings).
     */
    public function test_black_box_warga_can_book_emergency_ambulance(): void
    {
        $response = $this->actingAs($this->wargaPelapor)->postJson('/api/ambulances/bookings', [
            'patient_name' => 'Bpk. Hendra (Nyeri Dada Akut)',
            'service_type' => 'emergency',
            'urgency_level' => 'urgent',
            'pickup_address' => 'Blok B No. 02 RT 01',
            'destination_address' => 'IGD RS Siloam TB Simatupang',
            'notes' => 'Pasien butuh oksigen segera.',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'id',
                    'booking_code',
                    'patient_name',
                    'service_type',
                    'urgency_level',
                    'status',
                ],
            ]);

        $this->assertEquals('requested', $response->json('data.status'));
        $this->assertStringStartsWith('AMB-', $response->json('data.booking_code'));
    }

    /**
     * Black-Box: Pengurus can register new ambulance fleet vehicle.
     */
    public function test_black_box_pengurus_can_register_new_ambulance_fleet(): void
    {
        $response = $this->actingAs($this->ketuaRt)->postJson('/api/ambulances', [
            'vehicle_number' => 'B 2026 SWZ',
            'name' => 'Ambulans Jenazah GranMax RW 05',
            'type' => 'jenazah',
            'driver_name' => 'Pak Sukirno',
            'driver_phone' => '081399887766',
            'notes' => 'Mobil jenazah khusus warga RW 05.',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'vehicle_number' => 'B 2026 SWZ',
                    'type' => 'jenazah',
                    'status' => 'available',
                ],
            ]);

        $this->assertDatabaseHas('ambulances', [
            'vehicle_number' => 'B 2026 SWZ',
            'type' => 'jenazah',
        ]);
    }

    /**
     * Black-Box: Unauthorized user cannot cancel another user's booking.
     */
    public function test_black_box_unauthorized_user_cannot_cancel_others_booking(): void
    {
        $booking = AmbulanceBooking::create([
            'booking_code' => 'AMB-OTHERS-001',
            'user_id' => $this->wargaPelapor->id,
            'patient_name' => 'Keluarga Budi',
            'service_type' => 'emergency',
            'urgency_level' => 'urgent',
            'pickup_address' => 'Blok B No. 02',
            'destination_address' => 'RS Fatmawati',
            'status' => 'requested',
        ]);

        // Ahmad (wargaLain) tries to cancel Budi's booking
        $response = $this->actingAs($this->wargaLain)->postJson("/api/ambulances/bookings/{$booking->id}/cancel");

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'Anda tidak memiliki hak akses untuk membatalkan booking ini.',
            ]);
    }
}
