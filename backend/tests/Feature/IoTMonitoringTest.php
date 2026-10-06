<?php

namespace Tests\Feature;

use App\Models\House;
use App\Models\IotDevice;
use App\Models\IotEmergencyLog;
use App\Models\PosyanduRecord;
use App\Models\RondaLog;
use App\Models\RondaSchedule;
use App\Models\SirenStatus;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Models\WasteBankTransaction;
use App\Models\WasteRate;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class IoTMonitoringTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected User $ketuaRt;
    protected User $wargaBudi;
    protected User $wargaSiti;
    protected IotDevice $gateDevice;
    protected IotDevice $sirenDevice;
    protected IotDevice $wasteTerminalDevice;

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

        $this->wargaBudi = User::create([
            'name' => 'Budi Santoso',
            'phone' => '081288880001',
            'email' => 'budi@smartwarga.id',
            'password' => bcrypt('password'),
            'role' => 'warga',
            'rt_number' => '01',
            'house_id' => $house1->id,
            'rfid_uid' => 'RFID_BUDI_01',
            'status' => 'approved',
        ]);

        $this->wargaSiti = User::create([
            'name' => 'Siti Rahma',
            'phone' => '081288880002',
            'email' => 'siti@smartwarga.id',
            'password' => bcrypt('password'),
            'role' => 'warga',
            'rt_number' => '01',
            'house_id' => $house2->id,
            'rfid_uid' => 'RFID_SITI_02',
            'status' => 'approved',
        ]);

        // Setup IoT Devices
        $this->gateDevice = IotDevice::create([
            'device_key' => 'DEV_GATE_01',
            'device_type' => 'gate',
            'location' => 'Pos Gerbang Utama RT 01',
            'is_active' => true,
            'last_ping' => now()->subMinutes(10),
        ]);

        $this->sirenDevice = IotDevice::create([
            'device_key' => 'DEV_SIREN_01',
            'device_type' => 'siren',
            'location' => 'Menara Sirine RW',
            'is_active' => true,
            'last_ping' => now()->subMinutes(10),
        ]);

        $this->wasteTerminalDevice = IotDevice::create([
            'device_key' => 'DEV_TERMINAL_01',
            'device_type' => 'waste_terminal',
            'location' => 'Gedung Serbaguna',
            'is_active' => true,
            'last_ping' => now()->subMinutes(10),
        ]);

        // Setup Waste Rates
        WasteRate::create(['category' => 'kaleng', 'display_name' => 'Kaleng / Seng', 'price_per_kg' => 5000.00]);
        WasteRate::create(['category' => 'plastik', 'display_name' => 'Plastik / Botol', 'price_per_kg' => 2000.00]);

        // Initialize Siren Status
        SirenStatus::create([
            'id' => 1,
            'is_active' => false,
            'reason' => 'Kondisi Normal Aman',
        ]);
    }

    // =========================================================================
    // WHITE-BOX TESTING: Logic, Formula, Branching & State Mutations
    // =========================================================================

    /**
     * White-Box 1: RFID Tap user yang terdaftar dalam jadwal ronda hari ini
     * Harus mencatat log dengan status 'hadir' dan mengaitkan schedule_id.
     */
    public function test_whitebox_rfid_tap_with_active_ronda_schedule()
    {
        $today = Carbon::today()->toDateString();
        $schedule = RondaSchedule::create([
            'date' => $today,
            'shift' => 'malam',
            'assigned_users' => [(int) $this->wargaBudi->id],
            'rt_number' => '01',
            'notes' => 'Jadwal Ronda Malam RT 01',
            'created_by' => $this->ketuaRt->id,
        ]);

        $response = $this->postJson('/api/iot/ronda/tap', [
            'rfid_uid' => 'RFID_BUDI_01',
            'post_id' => 'POS_01',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'gate_open' => true,
                'servo_angle' => 90,
            ]);

        $this->assertDatabaseHas('ronda_logs', [
            'schedule_id' => $schedule->id,
            'user_id' => $this->wargaBudi->id,
            'rfid_uid' => 'RFID_BUDI_01',
            'post_id' => 'POS_01',
            'status' => 'hadir',
        ]);

        $this->assertStringContainsString('absensi ronda berhasil dicatat', $response->json('message'));
    }

    /**
     * White-Box 2: RFID Tap warga terdaftar tanpa jadwal ronda (Akses Masuk Perumahan)
     * Tetap membuka gerbang tapi schedule_id bernilai null dan pesan ramah penghuni.
     */
    public function test_whitebox_rfid_tap_registered_resident_without_ronda_schedule()
    {
        $response = $this->postJson('/api/iot/ronda/tap', [
            'rfid_uid' => 'RFID_BUDI_01',
            'post_id' => 'POS_01',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'gate_open' => true,
            ]);

        $this->assertDatabaseHas('ronda_logs', [
            'schedule_id' => null,
            'user_id' => $this->wargaBudi->id,
            'rfid_uid' => 'RFID_BUDI_01',
            'status' => 'hadir',
        ]);

        $this->assertStringContainsString('Akses gerbang dibuka', $response->json('message'));
    }

    /**
     * White-Box 3: Branching RFID tidak terdaftar ditolak dan gerbang tidak terbuka
     */
    public function test_whitebox_rfid_tap_unregistered_card_branch_rejection()
    {
        $response = $this->postJson('/api/iot/ronda/tap', [
            'rfid_uid' => 'RFID_UNKNOWN_99',
            'post_id' => 'POS_01',
        ]);

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'gate_open' => false,
                'lcd_line1' => 'KARTU DITOLAK',
                'lcd_line2' => 'TIDAK TERDAFTAR',
            ]);

        $this->assertDatabaseMissing('ronda_logs', [
            'rfid_uid' => 'RFID_UNKNOWN_99',
        ]);
    }

    /**
     * White-Box 4: Formula Timbangan Bank Sampah Kaleng & Mutasi Atomik Saldo Dompet
     * Rumus: (2.400 gram / 1000) * Rp 5.000 = Rp 12.000
     */
    public function test_whitebox_waste_bank_kaleng_calculation_and_wallet_credit()
    {
        $initialBalance = 10000.00;
        $wallet = Wallet::create([
            'user_id' => $this->wargaBudi->id,
            'balance' => $initialBalance,
        ]);

        $response = $this->postJson('/api/iot/bank-sampah/setor', [
            'rfid_uid' => 'RFID_BUDI_01',
            'kategori' => 'kaleng',
            'berat_gram' => 2400,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'kategori' => 'Kaleng',
                    'berat_gram' => 2400,
                    'harga_per_kg' => 5000,
                    'total_nominal' => 12000,
                    'wallet_balance' => 22000,
                ],
            ]);

        // Verifikasi saldo dompet bertambah
        $this->assertEquals(22000.00, $wallet->fresh()->balance);

        // Verifikasi mutasi transaksi dompet
        $this->assertDatabaseHas('wallet_transactions', [
            'wallet_id' => $wallet->id,
            'user_id' => $this->wargaBudi->id,
            'type' => 'credit',
            'category' => 'waste_bank',
            'amount' => 12000.00,
            'status' => 'completed',
        ]);

        // Verifikasi log bank sampah
        $this->assertDatabaseHas('waste_bank_transactions', [
            'user_id' => $this->wargaBudi->id,
            'rfid_uid' => 'RFID_BUDI_01',
            'category' => 'kaleng',
            'weight_gram' => 2400,
            'price_per_kg' => 5000.00,
            'total_nominal' => 12000.00,
        ]);
    }

    /**
     * White-Box 5: Formula Timbangan Plastik
     * Rumus: (1.750 gram / 1000) * Rp 2.000 = Rp 3.500
     */
    public function test_whitebox_waste_bank_plastik_calculation()
    {
        $response = $this->postJson('/api/iot/bank-sampah/setor', [
            'rfid_uid' => 'RFID_SITI_02',
            'kategori' => 'plastik',
            'berat_gram' => 1750,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'total_nominal' => 3500,
                ],
            ]);

        $this->assertDatabaseHas('wallets', [
            'user_id' => $this->wargaSiti->id,
            'balance' => 3500.00,
        ]);
    }

    /**
     * White-Box 6: Minimum nominal enforcement (Rp 100) untuk berat mikro
     */
    public function test_whitebox_waste_bank_minimum_nominal_enforcement()
    {
        // 10 gram plastik = (10/1000) * 2000 = Rp 20 -> dibulatkan minimum Rp 100
        $response = $this->postJson('/api/iot/bank-sampah/setor', [
            'rfid_uid' => 'RFID_BUDI_01',
            'kategori' => 'plastik',
            'berat_gram' => 10,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'total_nominal' => 100,
                ],
            ]);

        $this->assertDatabaseHas('wallets', [
            'user_id' => $this->wargaBudi->id,
            'balance' => 100.00,
        ]);
    }

    /**
     * White-Box 7: Deaktivasi Sirine otomatis menyelesaikan semua log darurat yang aktif
     */
    public function test_whitebox_siren_deactivation_resolves_active_emergency_logs()
    {
        // Buat 2 emergency log aktif
        $log1 = IotEmergencyLog::create([
            'device_id' => $this->gateDevice->id,
            'location' => 'Pos Gerbang Utama',
            'trigger_type' => 'hardware_button',
            'status' => 'active',
        ]);

        $log2 = IotEmergencyLog::create([
            'device_id' => $this->gateDevice->id,
            'location' => 'Pos Ronda RT 01',
            'trigger_type' => 'web_panic',
            'status' => 'active',
        ]);

        // Aktifkan sirine
        SirenStatus::first()->update(['is_active' => true, 'reason' => 'Darurat']);

        // Pengurus mematikan sirine via web dashboard
        $response = $this->actingAs($this->ketuaRt)->postJson('/api/iot/sirine/toggle', [
            'is_active' => false,
            'reason' => 'Kondisi aman terkendali oleh warga',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        // Pastikan status sirine mati
        $this->assertFalse((bool) SirenStatus::first()->is_active);

        // Pastikan kedua log darurat bertransisi menjadi handled
        $log1->refresh();
        $log2->refresh();

        $this->assertEquals('handled', $log1->status);
        $this->assertEquals($this->ketuaRt->id, $log1->handled_by);
        $this->assertNotNull($log1->resolved_at);

        $this->assertEquals('handled', $log2->status);
        $this->assertEquals($this->ketuaRt->id, $log2->handled_by);
        $this->assertNotNull($log2->resolved_at);
    }

    /**
     * White-Box 8: Mutasi Heartbeat / Last Ping Device IoT saat berinteraksi
     */
    public function test_whitebox_device_heartbeat_last_ping_updates()
    {
        $oldPing = $this->gateDevice->last_ping;

        $this->postJson('/api/iot/ronda/tap', [
            'rfid_uid' => 'RFID_BUDI_01',
        ]);

        $this->assertTrue($this->gateDevice->fresh()->last_ping->greaterThan($oldPing));
    }

    // =========================================================================
    // BLACK-BOX TESTING: API Contract, Validation Rules & Hardware Formats
    // =========================================================================

    /**
     * Black-Box 1: Validasi format tampilan 16x2 karakter LCD pada Node 1 Gate
     */
    public function test_blackbox_gate_lcd_16x2_character_limits()
    {
        $response = $this->postJson('/api/iot/ronda/tap', [
            'rfid_uid' => 'RFID_BUDI_01',
        ]);

        $response->assertStatus(200);
        $data = $response->json();

        $this->assertArrayHasKey('lcd_line1', $data);
        $this->assertArrayHasKey('lcd_line2', $data);
        $this->assertLessThanOrEqual(16, strlen($data['lcd_line1']));
        $this->assertLessThanOrEqual(16, strlen($data['lcd_line2']));
        $this->assertEquals('GERBANG TERBUKA', $data['lcd_line2']);
    }

    /**
     * Black-Box 2: Endpoint Panic Button merespon HTTP 201 Created & struktur data darurat
     */
    public function test_blackbox_panic_button_api_contract()
    {
        $response = $this->postJson('/api/iot/panic-button', [
            'location' => 'Pos Gerbang Utama',
            'trigger_type' => 'hardware_button',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'siren_triggered',
                'message',
                'data' => [
                    'log_id',
                    'location',
                    'siren_active',
                    'timestamp',
                ],
            ]);

        $this->assertTrue($response->json('siren_triggered'));
        $this->assertTrue((bool) SirenStatus::first()->is_active);
    }

    /**
     * Black-Box 3: Kontrak status polling sirine untuk ESP32 Node 2
     */
    public function test_blackbox_node2_siren_polling_endpoint_contract()
    {
        SirenStatus::first()->update([
            'is_active' => true,
            'reason' => 'Uji Coba Alarm Wilayah',
        ]);

        $response = $this->getJson('/api/iot/sirine/status');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'siren_active',
                'reason',
                'timestamp',
            ])
            ->assertJson([
                'siren_active' => true,
                'reason' => 'Uji Coba Alarm Wilayah',
            ]);
    }

    /**
     * Black-Box 4: Proteksi autentikasi pada toggle sirine manual
     */
    public function test_blackbox_toggle_sirine_requires_authentication()
    {
        // Tanpa token -> 401 Unauthorized
        $response = $this->postJson('/api/iot/sirine/toggle', [
            'is_active' => true,
        ]);

        $response->assertStatus(401);
    }

    /**
     * Black-Box 5: Validasi Input Bank Sampah IoT
     */
    public function test_blackbox_waste_bank_input_validation()
    {
        // 1. Kategori tidak valid (harus kaleng atau plastik)
        $res1 = $this->postJson('/api/iot/bank-sampah/setor', [
            'rfid_uid' => 'RFID_BUDI_01',
            'kategori' => 'kaca',
            'berat_gram' => 500,
        ]);
        $res1->assertStatus(422)->assertJsonValidationErrors(['kategori']);

        // 2. Berat 0 atau negatif
        $res2 = $this->postJson('/api/iot/bank-sampah/setor', [
            'rfid_uid' => 'RFID_BUDI_01',
            'kategori' => 'kaleng',
            'berat_gram' => 0,
        ]);
        $res2->assertStatus(422)->assertJsonValidationErrors(['berat_gram']);

        // 3. RFID kosong
        $res3 = $this->postJson('/api/iot/bank-sampah/setor', [
            'kategori' => 'kaleng',
            'berat_gram' => 500,
        ]);
        $res3->assertStatus(422)->assertJsonValidationErrors(['rfid_uid']);
    }

    /**
     * Black-Box 6: Format LCD 16x2 pada Bank Sampah Timbangan IoT
     */
    public function test_blackbox_waste_bank_lcd_16x2_character_limits()
    {
        $response = $this->postJson('/api/iot/bank-sampah/setor', [
            'rfid_uid' => 'RFID_BUDI_01',
            'kategori' => 'kaleng',
            'berat_gram' => 1000,
        ]);

        $response->assertStatus(200);
        $data = $response->json();

        $this->assertArrayHasKey('lcd_line1', $data);
        $this->assertArrayHasKey('lcd_line2', $data);
        $this->assertLessThanOrEqual(16, strlen($data['lcd_line1']));
        $this->assertLessThanOrEqual(16, strlen($data['lcd_line2']));
    }

    /**
     * Black-Box 7: Posyandu Mandiri Tap Sensor Balita (Node 3)
     */
    public function test_blackbox_posyandu_self_service_tap_and_lcd_output()
    {
        $response = $this->postJson('/api/iot/posyandu/catat', [
            'rfid_uid' => 'RFID_BUDI_01',
            'berat_kg' => 12.5,
            'tinggi_cm' => 85.0,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'weight_kg' => 12.5,
                    'height_cm' => 85.0,
                    'rfid_uid' => 'RFID_BUDI_01',
                ],
                'lcd_line1' => 'TB:85 BB:12.5',
                'lcd_line2' => 'POSYANDU TERCATAT',
            ]);

        $this->assertDatabaseHas('posyandu_records', [
            'rfid_uid' => 'RFID_BUDI_01',
            'weight_kg' => 12.5,
            'height_cm' => 85.0,
        ]);

        // Boundary validation: tinggi di luar batas wajar balita (> 150 cm)
        $invalid = $this->postJson('/api/iot/posyandu/catat', [
            'rfid_uid' => 'RFID_BUDI_01',
            'berat_kg' => 12.5,
            'tinggi_cm' => 200.0,
        ]);
        $invalid->assertStatus(422)->assertJsonValidationErrors(['tinggi_cm']);
    }

    /**
     * Black-Box 8: Endpoint List IoT Devices & Health Status
     */
    public function test_blackbox_list_iot_devices_endpoint()
    {
        $response = $this->getJson('/api/iot/devices');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'devices',
                    'siren_status',
                    'server_time',
                ],
            ]);

        $this->assertCount(3, $response->json('data.devices'));
    }

    /**
     * Black-Box 9: Endpoint Log Monitoring (Ronda, Emergency, Bank Sampah)
     */
    public function test_blackbox_iot_logs_endpoints_and_pagination()
    {
        // Buat dummy logs
        RondaLog::create([
            'user_id' => $this->wargaBudi->id,
            'rfid_uid' => 'RFID_BUDI_01',
            'post_id' => 'POS_01',
            'tapped_at' => now(),
            'status' => 'hadir',
        ]);

        IotEmergencyLog::create([
            'device_id' => $this->gateDevice->id,
            'location' => 'Pos Gerbang Utama',
            'trigger_type' => 'hardware_button',
            'status' => 'active',
        ]);

        // 1. Ronda Logs
        $rondaRes = $this->actingAs($this->wargaBudi)->getJson('/api/iot/ronda/logs');
        $rondaRes->assertStatus(200)->assertJsonStructure(['success', 'data' => ['data']]);

        // 2. Emergency Logs
        $emerRes = $this->actingAs($this->wargaBudi)->getJson('/api/iot/emergency-logs');
        $emerRes->assertStatus(200)->assertJsonStructure(['success', 'data' => ['data']]);

        // 3. Waste Bank Logs
        $wasteRes = $this->actingAs($this->wargaBudi)->getJson('/api/iot/waste-bank/logs');
        $wasteRes->assertStatus(200)->assertJsonStructure(['success', 'data' => ['data']]);
    }
}
