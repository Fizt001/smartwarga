<?php

namespace Tests\Feature;

use App\Models\KioskServiceQueue;
use App\Models\RondaLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class KioskServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_kiosk_tap_creates_active_and_waiting_sessions()
    {
        // 1. Citizen A taps -> active
        $userA = User::factory()->create(['name' => 'Warga A', 'rfid_uid' => 'UID_AAAA']);
        $respA = $this->postJson('/api/iot/pelayanan/tap', [
            'rfid_uid' => 'UID_AAAA',
            'device_id' => 'AIO_KIOSK_PIN4'
        ]);

        $respA->assertStatus(201)
            ->assertJson([
                'success' => true,
                'status' => 'active',
                'queue_number' => 1
            ]);

        $this->assertEquals('UID_AAAA', Cache::get('latest_ktp_scan')['rfid_uid']);

        // 2. Citizen B taps -> waiting
        $userB = User::factory()->create(['name' => 'Warga B', 'rfid_uid' => 'UID_BBBB']);
        $respB = $this->postJson('/api/iot/pelayanan/tap', [
            'rfid_uid' => 'UID_BBBB',
            'device_id' => 'AIO_KIOSK_PIN4'
        ]);

        $respB->assertStatus(201)
            ->assertJson([
                'success' => true,
                'status' => 'waiting',
                'queue_number' => 2
            ]);

        // 3. Citizen A checks active session
        $this->actingAs($userA);
        $respSessionA = $this->getJson('/api/pelayanan/active-session');
        $respSessionA->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'is_my_turn' => true,
                    'total_waiting' => 1,
                ]
            ]);

        // 4. Citizen B checks active session
        $this->actingAs($userB);
        $respSessionB = $this->getJson('/api/pelayanan/active-session');
        $respSessionB->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'is_my_turn' => false,
                    'people_ahead' => 1,
                ]
            ]);

        // 5. Citizen A finishes service -> Session closed and Citizen B is automatically promoted to active!
        $this->actingAs($userA);
        $activeQueueA = KioskServiceQueue::where('user_id', $userA->id)->first();
        $respComplete = $this->postJson('/api/pelayanan/complete-session', [
            'queue_id' => $activeQueueA->id,
            'service_type' => 'Registrasi KTP',
            'service_notes' => 'KTP berhasil ditautkan ke akun warga.'
        ]);

        $respComplete->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);
        $this->assertNotNull($respComplete->json('data.next_active'));
        $this->assertEquals(2, $respComplete->json('data.next_active.queue_number'));

        // Now Citizen B should be active!
        $this->actingAs($userB);
        $respSessionBAfter = $this->getJson('/api/pelayanan/active-session');
        $respSessionBAfter->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'is_my_turn' => true,
                    'total_waiting' => 0,
                ]
            ]);
    }

    public function test_gate_logs_visibility_for_resident_and_admin()
    {
        $resident = User::factory()->create(['role' => 'warga', 'rfid_uid' => 'UID_WARGA']);
        $otherResident = User::factory()->create(['role' => 'warga', 'rfid_uid' => 'UID_OTHER']);
        $officer = User::factory()->create(['role' => 'rt']);

        RondaLog::create([
            'user_id' => $resident->id,
            'rfid_uid' => 'UID_WARGA',
            'post_id' => 'Gerbang Barat',
            'tapped_at' => now(),
            'notes' => 'Akses Gerbang Masuk'
        ]);

        RondaLog::create([
            'user_id' => $otherResident->id,
            'rfid_uid' => 'UID_OTHER',
            'post_id' => 'Gerbang Barat',
            'tapped_at' => now(),
            'notes' => 'Akses Gerbang Masuk'
        ]);

        // Resident only sees their own gate logs
        $this->actingAs($resident);
        $respResident = $this->getJson('/api/warga/gate-logs');
        $respResident->assertStatus(200);
        $this->assertCount(1, $respResident->json('data.data'));

        // Officer sees all gate logs
        $this->actingAs($officer);
        $respOfficer = $this->getJson('/api/warga/gate-logs');
        $respOfficer->assertStatus(200);
        $this->assertCount(2, $respOfficer->json('data.data'));
    }
}
