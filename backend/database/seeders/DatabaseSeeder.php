<?php

namespace Database\Seeders;

use App\Models\Announcement;
use App\Models\Asset;
use App\Models\Block;
use App\Models\House;
use App\Models\IotDevice;
use App\Models\IplMaster;
use App\Models\SirenStatus;
use App\Models\SystemSetting;
use App\Models\UmkmProduct;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WasteRate;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Generate 300 Houses (RT 01, 02, 03 x Blocks A, B, C, D x 25 houses)
        $rts = ['01', '02', '03'];
        $blocks = ['A', 'B', 'C', 'D'];

        foreach ($rts as $rt) {
            foreach ($blocks as $block) {
                Block::firstOrCreate([
                    'rt_number' => $rt,
                    'block_label' => $block,
                ], [
                    'capacity' => 25,
                ]);

                for ($num = 1; $num <= 25; $num++) {
                    $houseCode = "RT{$rt}-{$block}" . str_pad($num, 2, '0', STR_PAD_LEFT);
                    House::updateOrCreate([
                        'rt_number' => $rt,
                        'block' => $block,
                        'number' => $num,
                    ], [
                        'house_code' => $houseCode,
                        'full_address' => "RT {$rt} Blok {$block} No. {$num}",
                    ]);
                }
            }
        }

        // 2. Core Users (Admin, RW, RTs, Bendahara, Sekretaris)
        $superAdmin = User::firstOrCreate(
            ['email' => 'admin@smartwarga.test'],
            [
                'name' => 'Super Administrator',
                'password' => Hash::make('password'),
                'role' => 'super_admin',
                'status' => 'approved',
                'phone' => '08110000001',
            ]
        );

        $rwUser = User::firstOrCreate(
            ['email' => 'rw@smartwarga.test'],
            [
                'name' => 'Ketua RW 05',
                'password' => Hash::make('password'),
                'role' => 'rw',
                'status' => 'approved',
                'phone' => '08110000002',
            ]
        );

        $rt1 = User::firstOrCreate(
            ['email' => 'rt01@smartwarga.test'],
            [
                'name' => 'Ketua RT 01',
                'password' => Hash::make('password'),
                'role' => 'rt',
                'rt_number' => '01',
                'status' => 'approved',
                'phone' => '08110000011',
            ]
        );

        $rt2 = User::firstOrCreate(
            ['email' => 'rt02@smartwarga.test'],
            [
                'name' => 'Ketua RT 02',
                'password' => Hash::make('password'),
                'role' => 'rt',
                'rt_number' => '02',
                'status' => 'approved',
                'phone' => '08110000012',
            ]
        );

        $rt3 = User::firstOrCreate(
            ['email' => 'rt03@smartwarga.test'],
            [
                'name' => 'Ketua RT 03',
                'password' => Hash::make('password'),
                'role' => 'rt',
                'rt_number' => '03',
                'status' => 'approved',
                'phone' => '08110000013',
            ]
        );

        $bendahara = User::updateOrCreate(
            ['email' => 'bendahara@smartwarga.test'],
            [
                'name' => 'Bendahara RT 01 (Ibu Ratna)',
                'password' => Hash::make('password'),
                'role' => 'bendahara',
                'rt_number' => '01',
                'status' => 'approved',
                'phone' => '08110000003',
            ]
        );

        $bendaharaRt1 = User::updateOrCreate(
            ['email' => 'bendahara_rt01@smartwarga.test'],
            [
                'name' => 'Bendahara RT 01 (Ibu Ratna)',
                'password' => Hash::make('password'),
                'role' => 'bendahara',
                'rt_number' => '01',
                'status' => 'approved',
                'phone' => '08110000021',
            ]
        );

        $bendaharaRw = User::updateOrCreate(
            ['email' => 'bendahara_rw@smartwarga.test'],
            [
                'name' => 'Bendahara RW 05 (Pak Hendra)',
                'password' => Hash::make('password'),
                'role' => 'bendahara',
                'rt_number' => null,
                'status' => 'approved',
                'phone' => '08110000022',
            ]
        );

        $sekretaris = User::updateOrCreate(
            ['email' => 'sekretaris@smartwarga.test'],
            [
                'name' => 'Sekretaris RT 01 (Pak Danu)',
                'password' => Hash::make('password'),
                'role' => 'sekretaris',
                'rt_number' => '01',
                'status' => 'approved',
                'phone' => '08110000004',
            ]
        );

        $sekretarisRt1 = User::updateOrCreate(
            ['email' => 'sekretaris_rt01@smartwarga.test'],
            [
                'name' => 'Sekretaris RT 01 (Pak Danu)',
                'password' => Hash::make('password'),
                'role' => 'sekretaris',
                'rt_number' => '01',
                'status' => 'approved',
                'phone' => '08110000031',
            ]
        );

        $sekretarisRw = User::updateOrCreate(
            ['email' => 'sekretaris_rw@smartwarga.test'],
            [
                'name' => 'Sekretaris RW 05 (Ibu Maya)',
                'password' => Hash::make('password'),
                'role' => 'sekretaris',
                'rt_number' => null,
                'status' => 'approved',
                'phone' => '08110000032',
            ]
        );

        // 3. Dummy Warga & House Structure:
        // Rumah 1 (RT 01 Blok A No. 1 / RT01-A01):
        // Memiliki KK Utama (Budi Santoso) dan KK Pendukung (Eko Santoso - anak sudah nikah)
        $house1 = House::where('rt_number', '01')->where('block', 'A')->where('number', 1)->first();

        // KK Utama: Budi Santoso (Penanggung Jawab Rumah & Tagihan IPL)
        $warga1 = User::updateOrCreate(
            ['email' => 'budi@smartwarga.test'],
            [
                'name' => 'Budi Santoso',
                'password' => Hash::make('password'),
                'role' => 'warga',
                'rt_number' => '01',
                'house_id' => $house1?->id,
                'rfid_uid' => 'RFID_WARGA_01',
                'status' => 'approved',
                'phone' => '081234567890',
                'kk_type' => 'kk_utama',
                'no_kk' => '3201012345670001',
                'nik' => '3201012345670001',
                'is_head_of_house' => true,
            ]
        );

        if ($house1) {
            $house1->update([
                'is_occupied' => true,
                'head_of_family_id' => $warga1->id,
            ]);
        }

        Wallet::firstOrCreate(
            ['user_id' => $warga1->id],
            ['balance' => 150000.00]
        );

        // KK Pendukung / Tambahan di Rumah 1: Eko Santoso (Anak sudah menikah punya KK mandiri tapi tinggal di rumah ortu)
        $wargaEko = User::updateOrCreate(
            ['email' => 'eko@smartwarga.test'],
            [
                'name' => 'Eko Santoso (KK Pendukung)',
                'password' => Hash::make('password'),
                'role' => 'warga',
                'rt_number' => '01',
                'house_id' => $house1?->id,
                'rfid_uid' => 'RFID_WARGA_EKO',
                'status' => 'approved',
                'phone' => '081234567899',
                'kk_type' => 'kk_pendukung',
                'no_kk' => '3201012345670002',
                'nik' => '3201012345670002',
                'is_head_of_house' => false,
            ]
        );

        Wallet::firstOrCreate(
            ['user_id' => $wargaEko->id],
            ['balance' => 75000.00]
        );

        // Anggota Keluarga Budi di Rumah 1: Dewi Sartika (Istri)
        $wargaDewi = User::updateOrCreate(
            ['email' => 'dewi@smartwarga.test'],
            [
                'name' => 'Dewi Sartika (Istri Budi)',
                'password' => Hash::make('password'),
                'role' => 'warga',
                'rt_number' => '01',
                'house_id' => $house1?->id,
                'status' => 'approved',
                'phone' => '081234567898',
                'kk_type' => 'anggota',
                'no_kk' => '3201012345670001',
                'nik' => '3201012345670003',
                'is_head_of_house' => false,
            ]
        );

        // Rumah 2 (RT01-A02): Siti Rahma (Warga Baru - Pending Approval)
        $house2 = House::where('rt_number', '01')->where('block', 'A')->where('number', 2)->first();
        $warga2 = User::updateOrCreate(
            ['email' => 'siti@smartwarga.test'],
            [
                'name' => 'Siti Rahma',
                'password' => Hash::make('password'),
                'role' => 'warga',
                'rt_number' => '01',
                'house_id' => $house2?->id,
                'rfid_uid' => 'RFID_WARGA_02',
                'status' => 'pending',
                'phone' => '081234567891',
                'kk_type' => 'kk_utama',
                'no_kk' => '3201012345670010',
                'nik' => '3201012345670010',
                'is_head_of_house' => true,
            ]
        );

        Wallet::firstOrCreate(
            ['user_id' => $warga2->id],
            ['balance' => 0.00]
        );

        // Rumah 3 (RT01-A03): Joko Widodo (KK Utama Terdaftar)
        $house3 = House::where('rt_number', '01')->where('block', 'A')->where('number', 3)->first();
        $warga3 = User::updateOrCreate(
            ['email' => 'joko@smartwarga.test'],
            [
                'name' => 'Joko Widodo',
                'password' => Hash::make('password'),
                'role' => 'warga',
                'rt_number' => '01',
                'house_id' => $house3?->id,
                'status' => 'approved',
                'phone' => '081234567803',
                'kk_type' => 'kk_utama',
                'no_kk' => '3201012345670030',
                'nik' => '3201012345670030',
                'is_head_of_house' => true,
            ]
        );
        if ($house3) {
            $house3->update(['is_occupied' => true, 'head_of_family_id' => $warga3->id]);
        }
        Wallet::firstOrCreate(['user_id' => $warga3->id], ['balance' => 200000.00]);

        // Rumah di RT 02 (RT02-B01): Bambang Pamungkas
        $houseRt2 = House::where('rt_number', '02')->where('block', 'B')->where('number', 1)->first();
        $wargaRt2 = User::updateOrCreate(
            ['email' => 'bambang@smartwarga.test'],
            [
                'name' => 'Bambang Pamungkas',
                'password' => Hash::make('password'),
                'role' => 'warga',
                'rt_number' => '02',
                'house_id' => $houseRt2?->id,
                'status' => 'approved',
                'phone' => '081234567821',
                'kk_type' => 'kk_utama',
                'no_kk' => '3201012345670201',
                'nik' => '3201012345670201',
                'is_head_of_house' => true,
            ]
        );
        if ($houseRt2) {
            $houseRt2->update(['is_occupied' => true, 'head_of_family_id' => $wargaRt2->id]);
        }
        Wallet::firstOrCreate(['user_id' => $wargaRt2->id], ['balance' => 120000.00]);

        // 4. Waste Rates (Harga Sampah)
        WasteRate::firstOrCreate(
            ['category' => 'kaleng'],
            [
                'display_name' => 'Kaleng Bekas (Aluminium / Logam)',
                'price_per_kg' => 5000.00,
            ]
        );

        WasteRate::firstOrCreate(
            ['category' => 'plastik'],
            [
                'display_name' => 'Plastik / Botol PET Bersih',
                'price_per_kg' => 2000.00,
            ]
        );

        // 5. Master Tarif IPL (Current month)
        $now = Carbon::now();
        foreach (['01', '02', '03'] as $rtNum) {
            IplMaster::firstOrCreate(
                [
                    'rt_number' => $rtNum,
                    'period_month' => $now->month,
                    'period_year' => $now->year,
                ],
                [
                    'base_ipl_amount' => 30000.00,
                    'rw_contribution_amount' => 20000.00,
                    'total_amount' => 50000.00,
                    'created_by' => $bendahara->id,
                ]
            );
        }

        // 5b. Tagihan IPL per Unit Rumah (Ditujukan ke KK Utama / Penanggung Jawab Rumah)
        $iplMasterRt1 = IplMaster::where('rt_number', '01')->where('period_month', $now->month)->where('period_year', $now->year)->first();
        if ($iplMasterRt1 && $house1 && $warga1) {
            \App\Models\IplBilling::updateOrCreate(
                [
                    'ipl_master_id' => $iplMasterRt1->id,
                    'house_id' => $house1->id,
                ],
                [
                    'user_id' => $warga1->id, // Ditagihkan ke KK Utama Budi Santoso
                    'amount' => $iplMasterRt1->total_amount,
                    'status' => 'paid',
                    'payment_method' => 'wallet',
                    'paid_at' => Carbon::now()->subDays(2),
                ]
            );
        }
        if ($iplMasterRt1 && $house3 && $warga3) {
            \App\Models\IplBilling::updateOrCreate(
                [
                    'ipl_master_id' => $iplMasterRt1->id,
                    'house_id' => $house3->id,
                ],
                [
                    'user_id' => $warga3->id, // Ditagihkan ke KK Utama Joko Widodo
                    'amount' => $iplMasterRt1->total_amount,
                    'status' => 'unpaid',
                ]
            );
        }

        // 6. IoT Devices
        IotDevice::firstOrCreate(
            ['device_key' => 'DEVICE_GATE_POS01'],
            [
                'device_type' => 'gate',
                'location' => 'Pos Gerbang Utama RT 01-03',
                'is_active' => true,
                'last_ping' => now(),
            ]
        );

        IotDevice::firstOrCreate(
            ['device_key' => 'DEVICE_SIREN_RT01'],
            [
                'device_type' => 'siren',
                'location' => 'Balai Warga RT 01 (Sirine Wilayah)',
                'is_active' => true,
                'last_ping' => now(),
            ]
        );

        IotDevice::firstOrCreate(
            ['device_key' => 'DEVICE_TERMINAL_BS01'],
            [
                'device_type' => 'waste_terminal',
                'location' => 'Sentra Terpadu RW (Bank Sampah & Posyandu)',
                'is_active' => true,
                'last_ping' => now(),
            ]
        );

        // 7. Siren Status
        SirenStatus::firstOrCreate(
            ['id' => 1],
            [
                'is_active' => false,
                'reason' => 'Kondisi Normal Aman',
            ]
        );

        // 8. Community Assets
        Asset::firstOrCreate(
            ['name' => 'Tenda Hajatan 4x6 Meter', 'rt_number' => '01'],
            [
                'category' => 'tenda',
                'quantity' => 2,
                'condition' => 'Baik Lengkap dengan Terpal',
            ]
        );

        Asset::firstOrCreate(
            ['name' => 'Sound System Portable Wireless', 'rt_number' => '01'],
            [
                'category' => 'sound_system',
                'quantity' => 1,
                'condition' => 'Normal 2 Mic Wireless',
            ]
        );

        Asset::firstOrCreate(
            ['name' => 'Kursi Lipat Chitose', 'rt_number' => '01'],
            [
                'category' => 'kursi',
                'quantity' => 50,
                'condition' => 'Baik',
            ]
        );

        // 9. Sample Announcements & Kegiatan (Dikelola Sekretaris & Bendahara RT/RW)
        // Kegiatan Tingkat RW 05 (Dibuat Sekretaris RW, Didanai Kas RW, Disetujui Bendahara RW)
        Announcement::updateOrCreate(
            ['title' => 'Kerja Bakti Masal & Penanaman Pohon Lingkungan RW 05'],
            [
                'created_by' => $sekretarisRw->id,
                'scope' => 'rw',
                'content' => 'Mengundang seluruh warga RT 01, RT 02, dan RT 03 untuk hadir dalam agenda Kerja Bakti Lingkungan dan Penanaman Bibit Tanaman Hijau serentak pada hari Minggu pukul 07.00 WIB berkumpul di Balai RW.',
                'type' => 'event',
                'event_date' => Carbon::now()->addDays(5)->setTime(7, 0),
                'budget_amount' => 3500000.00,
                'budget_source' => 'kas_rw',
                'budget_status' => 'approved',
                'budget_approved_by' => $bendaharaRw->id,
                'budget_notes' => 'Disetujui dari Kas Rutin RW 05 untuk konsumsi 3 RT dan bibit pohon penghijauan.',
                'allow_rsvp' => true,
                'allow_donation' => true,
                'is_active' => true,
            ]
        );

        // Kegiatan Tingkat RT 01 (Dibuat Sekretaris RT 01, Didanai Kas RT 01, Disetujui Bendahara RT 01)
        Announcement::updateOrCreate(
            ['title' => 'Lomba Kreativitas Anak & Malam Guyub RT 01'],
            [
                'created_by' => $sekretarisRt1->id,
                'scope' => 'rt01',
                'content' => 'Agenda keakraban keluarga warga RT 01: perlombaan mewarnai anak, kuis wawasan lingkungan, dan ramah tamah antar-KK di lapangan Blok A.',
                'type' => 'event',
                'event_date' => Carbon::now()->addDays(8)->setTime(16, 0),
                'budget_amount' => 1500000.00,
                'budget_source' => 'kas_rt',
                'budget_status' => 'approved',
                'budget_approved_by' => $bendaharaRt1->id,
                'budget_notes' => 'Disetujui dari Kas RT 01 untuk hadiah perlombaan anak dan konsumsi warga.',
                'allow_rsvp' => true,
                'allow_donation' => false,
                'is_active' => true,
            ]
        );

        // 10. Sample UMKM Product
        UmkmProduct::firstOrCreate(
            ['name' => 'Kripik Singkong Balado Renyah'],
            [
                'user_id' => $warga1->id,
                'category' => 'Makanan Ringan',
                'description' => 'Kripik singkong renyah dengan racikan bumbu balado asli buatan rumah tangga. Tersedia kemasan 250 gram.',
                'price' => 15000.00,
                'whatsapp_link' => 'https://wa.me/6281234567890?text=Halo%20Bu%20saya%20mau%20pesan%20Kripik%20Singkong',
                'is_active' => true,
            ]
        );

        // 11. System Settings
        SystemSetting::set('app_version', '1.0.0');
        SystemSetting::set('neighborhood_name', 'Rukun Warga 05');
    }
}
