<?php

namespace Database\Seeders;

use App\Models\Ambulance;
use App\Models\AmbulanceBooking;
use App\Models\Announcement;
use App\Models\AnnouncementDonation;
use App\Models\Asset;
use App\Models\AssetLoan;
use App\Models\Complaint;
use App\Models\ElderlyHealthRecord;
use App\Models\House;
use App\Models\KoperasiLoan;
use App\Models\Letter;
use App\Models\PosyanduRecord;
use App\Models\RukamReport;
use App\Models\UmkmProduct;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class LiveCommunitySimulationSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        // 1. Ambil Pengurus Utama untuk penandatangan surat & approval
        $rt1User = User::where('email', 'rt1@smartwarga.test')->first() ?? User::where('role', 'rt')->first();
        $rwUser  = User::where('email', 'rw@smartwarga.test')->first() ?? User::where('role', 'rw')->first();
        $adminUser = User::where('role', 'super_admin')->first();

        // 2. Ambil Semua Kepala Keluarga (KK Utama) yang sudah menempati rumah
        $heads = User::where('role', 'warga')
            ->where('is_head_of_house', true)
            ->whereNotNull('house_id')
            ->with('house')
            ->get();

        $this->command?->info("Menemukan {$heads->count()} Kepala Keluarga aktif. Memulai simulasi kehidupan warga...");

        // Pool nama-nama realistis Indonesia
        $femaleWives = [
            'Siti Nurhaliza', 'Ratna Juwita', 'Nurul Hidayati', 'Sri Wahyuni', 'Mega Utami',
            'Indah Permatasari', 'Dian Sastrowardoyo', 'Rini Susanti', 'Endang Pujiastuti',
            'Fitri Handayani', 'Yuni Shara', 'Ani Yudhoyono', 'Dewi Lestari', 'Rika Amelia',
            'Nita Thalia', 'Widya Astuti', 'Tri Haryanti', 'Lia Kurniawati', 'Hesti Purwadinata',
            'Ayu Tingting', 'Maya Estianty', 'Nia Ramadhani', 'Wulan Guritno', 'Gita Gutawa',
            'Isyana Sarasvati', 'Raisa Andriana', 'Maudy Ayunda', 'Prilly Latuconsina'
        ];

        $toddlerNames = [
            ['name' => 'Rayyan Alfarizi', 'gender' => 'L', 'age_months' => 24, 'weight' => 12.2, 'height' => 87.5],
            ['name' => 'Aisyah Zahira', 'gender' => 'P', 'age_months' => 18, 'weight' => 10.5, 'height' => 81.0],
            ['name' => 'Kenzo Alvaro', 'gender' => 'L', 'age_months' => 36, 'weight' => 14.1, 'height' => 96.0],
            ['name' => 'Naura Azkadina', 'gender' => 'P', 'age_months' => 12, 'weight' => 9.2, 'height' => 75.0],
            ['name' => 'Bilal Ramadhan', 'gender' => 'L', 'age_months' => 8, 'weight' => 8.4, 'height' => 70.0],
            ['name' => 'Alvino Rafif', 'gender' => 'L', 'age_months' => 30, 'weight' => 13.5, 'height' => 92.0],
            ['name' => 'Kanza Kirana', 'gender' => 'P', 'age_months' => 15, 'weight' => 9.8, 'height' => 78.5],
            ['name' => 'Arkan Pratama', 'gender' => 'L', 'age_months' => 42, 'weight' => 15.6, 'height' => 102.0],
            ['name' => 'Nayla Putri', 'gender' => 'P', 'age_months' => 28, 'weight' => 12.8, 'height' => 89.0],
        ];

        $studentNames = [
            ['name' => 'Rizky Ramadhan', 'gender' => 'Laki-laki', 'birth_year' => 2014],
            ['name' => 'Zahra Salsabila', 'gender' => 'Perempuan', 'birth_year' => 2012],
            ['name' => 'Farhan Maulana', 'gender' => 'Laki-laki', 'birth_year' => 2010],
            ['name' => 'Dimas Aditya', 'gender' => 'Laki-laki', 'birth_year' => 2015],
            ['name' => 'Tiara Andini', 'gender' => 'Perempuan', 'birth_year' => 2016],
            ['name' => 'Fajar Alfian', 'gender' => 'Laki-laki', 'birth_year' => 2008],
            ['name' => 'Salma Salsabil', 'gender' => 'Perempuan', 'birth_year' => 2011],
            ['name' => 'Bagas Kaffa', 'gender' => 'Laki-laki', 'birth_year' => 2013],
        ];

        $elderlyPool = [
            ['name' => 'H. Soepardi', 'gender' => 'L', 'gender_label' => 'Laki-laki', 'age' => 69, 'relation' => 'Orang Tua', 'job' => 'Pensiunan Guru'],
            ['name' => 'Hj. Maryam', 'gender' => 'P', 'gender_label' => 'Perempuan', 'age' => 66, 'relation' => 'Mertua', 'job' => 'Ibu Rumah Tangga'],
            ['name' => 'Bambang Soeroso', 'gender' => 'L', 'gender_label' => 'Laki-laki', 'age' => 72, 'relation' => 'Orang Tua', 'job' => 'Pensiunan PNS'],
            ['name' => 'Hj. Rohani', 'gender' => 'P', 'gender_label' => 'Perempuan', 'age' => 67, 'relation' => 'Orang Tua', 'job' => 'Pensiunan Bidan'],
            ['name' => 'H. Djunaedi', 'gender' => 'L', 'gender_label' => 'Laki-laki', 'age' => 74, 'relation' => 'Mertua', 'job' => 'Pensiunan Telkom'],
            ['name' => 'Ibu Sukesih', 'gender' => 'P', 'gender_label' => 'Perempuan', 'age' => 65, 'relation' => 'Orang Tua', 'job' => 'Tidak Bekerja'],
            ['name' => 'H. Syamsudin', 'gender' => 'L', 'gender_label' => 'Laki-laki', 'age' => 71, 'relation' => 'Orang Tua', 'job' => 'Pensiunan Kemenag'],
            ['name' => 'Hj. Fatimah', 'gender' => 'P', 'gender_label' => 'Perempuan', 'age' => 68, 'relation' => 'Mertua', 'job' => 'Ibu Rumah Tangga'],
            ['name' => 'Slamet Riyadi', 'gender' => 'L', 'gender_label' => 'Laki-laki', 'age' => 70, 'relation' => 'Orang Tua', 'job' => 'Pensiunan PT KAI'],
            ['name' => 'Siti Khodijah', 'gender' => 'P', 'gender_label' => 'Perempuan', 'age' => 64, 'relation' => 'Orang Tua', 'job' => 'Ibu Rumah Tangga'],
        ];

        $jobsWives = ['Ibu Rumah Tangga', 'Guru SD/SMP', 'Karyawan Swasta', 'Bidan Mandiri', 'Wiraswasta / Katering', 'Apoteker', 'Pegawai Bank'];
        $bloodTypes = ['A', 'B', 'AB', 'O'];

        $wifeIdx = 0;
        $toddlerIdx = 0;
        $studentIdx = 0;
        $elderlyIdx = 0;

        // Loop untuk setiap KK Utama: lengkapi istri, anak balita/sekolah, dan orang tua/kakek
        foreach ($heads as $idx => $head) {
            $house = $head->house;
            if (!$house) continue;

            $existingMembers = User::where('house_id', $house->id)->get();
            $hasWife = $existingMembers->contains(function ($m) {
                return $m->relationship === 'Istri' || str_contains(strtolower($m->name), 'istri');
            });

            // 1. Pastikan setiap KK Utama punya Istri
            if (!$hasWife) {
                $wifeName = $femaleWives[$wifeIdx % count($femaleWives)];
                $wifeIdx++;
                $wifeNik = '320101' . str_pad((string) rand(41, 71), 2, '0', STR_PAD_LEFT) . '05' . rand(85, 96) . str_pad((string) ($head->id * 10 + 2), 4, '0', STR_PAD_LEFT);
                $wifeEmail = 'fam_' . $wifeNik . '@smartwarga.local';

                User::firstOrCreate(
                    ['email' => $wifeEmail],
                    [
                        'name' => $wifeName . " (Istri {$head->name})",
                        'password' => Hash::make(Str::random(32)),
                        'role' => 'warga',
                        'rt_number' => $head->rt_number,
                        'house_id' => $house->id,
                        'kk_type' => 'anggota',
                        'no_kk' => $head->no_kk,
                        'nik' => $wifeNik,
                        'birth_place' => 'Bogor',
                        'birth_date' => Carbon::create(rand(1985, 1996), rand(1, 12), rand(1, 28))->toDateString(),
                        'gender' => 'Perempuan',
                        'religion' => 'Islam',
                        'occupation' => $jobsWives[$idx % count($jobsWives)],
                        'marital_status' => 'Kawin',
                        'blood_type' => $bloodTypes[$idx % count($bloodTypes)],
                        'relationship' => 'Istri',
                        'phone' => '0812' . rand(10000000, 99999999),
                        'is_head_of_house' => false,
                        'status' => 'approved',
                    ]
                );
            }

            // 2. Tambahkan Anak Balita (pada sekitar 50% keluarga) & catat Posyandu
            if ($idx % 2 === 0) {
                $toddler = $toddlerNames[$toddlerIdx % count($toddlerNames)];
                $toddlerIdx++;
                $childNik = '320101' . str_pad((string) rand(1, 28), 2, '0', STR_PAD_LEFT) . '08' . rand(21, 25) . str_pad((string) ($head->id * 10 + 3), 4, '0', STR_PAD_LEFT);

                User::firstOrCreate(
                    ['nik' => $childNik],
                    [
                        'name' => $toddler['name'],
                        'email' => 'fam_' . $childNik . '@smartwarga.local',
                        'password' => Hash::make(Str::random(32)),
                        'role' => 'warga',
                        'rt_number' => $head->rt_number,
                        'house_id' => $house->id,
                        'kk_type' => 'anggota',
                        'no_kk' => $head->no_kk,
                        'birth_place' => 'Jakarta',
                        'birth_date' => Carbon::now()->subMonths($toddler['age_months'])->toDateString(),
                        'gender' => $toddler['gender'] === 'L' ? 'Laki-laki' : 'Perempuan',
                        'religion' => 'Islam',
                        'occupation' => 'Belum Bekerja',
                        'marital_status' => 'Belum Kawin',
                        'blood_type' => $bloodTypes[$idx % count($bloodTypes)],
                        'relationship' => 'Anak',
                        'phone' => null,
                        'is_head_of_house' => false,
                        'status' => 'approved',
                    ]
                );

                // Catat ke posyandu_records (gender: 'L' / 'P')
                PosyanduRecord::create([
                    'child_name' => $toddler['name'],
                    'parent_user_id' => $head->id,
                    'birth_date' => Carbon::now()->subMonths($toddler['age_months'])->toDateString(),
                    'gender' => $toddler['gender'],
                    'age_months' => $toddler['age_months'],
                    'weight_kg' => $toddler['weight'],
                    'height_cm' => $toddler['height'],
                    'head_circumference_cm' => round(42 + ($toddler['age_months'] * 0.2), 1),
                    'kms_status' => 'green',
                    'nutrition_status' => 'Gizi Baik',
                    'vitamin_a' => true,
                    'notes' => 'Tumbuh kembang sangat aktif, nafsu makan baik, motorik normal sesuai grafik KMS.',
                    'measured_at' => Carbon::now()->subDays(rand(2, 14)),
                    'officer_id' => $rt1User?->id ?? $adminUser?->id,
                ]);
            }

            // 3. Tambahkan Anak Usia Sekolah (pada sekitar 40% keluarga)
            if ($idx % 3 === 0) {
                $student = $studentNames[$studentIdx % count($studentNames)];
                $studentIdx++;
                $studentNik = '320101' . str_pad((string) rand(1, 28), 2, '0', STR_PAD_LEFT) . '11' . substr((string) $student['birth_year'], -2) . str_pad((string) ($head->id * 10 + 4), 4, '0', STR_PAD_LEFT);

                User::firstOrCreate(
                    ['nik' => $studentNik],
                    [
                        'name' => $student['name'],
                        'email' => 'fam_' . $studentNik . '@smartwarga.local',
                        'password' => Hash::make(Str::random(32)),
                        'role' => 'warga',
                        'rt_number' => $head->rt_number,
                        'house_id' => $house->id,
                        'kk_type' => 'anggota',
                        'no_kk' => $head->no_kk,
                        'birth_place' => 'Bandung',
                        'birth_date' => Carbon::create($student['birth_year'], rand(1, 12), rand(1, 28))->toDateString(),
                        'gender' => $student['gender'],
                        'religion' => 'Islam',
                        'occupation' => 'Pelajar / Mahasiswa',
                        'marital_status' => 'Belum Kawin',
                        'blood_type' => $bloodTypes[($idx + 1) % count($bloodTypes)],
                        'relationship' => 'Anak',
                        'phone' => '0857' . rand(10000000, 99999999),
                        'is_head_of_house' => false,
                        'status' => 'approved',
                    ]
                );
            }

            // 4. Tambahkan Orang Tua / Mertua (Kakek / Nenek Serumah) pada keluarga terpilih
            if ($elderlyIdx < count($elderlyPool) && $idx % 3 === 1) {
                $elder = $elderlyPool[$elderlyIdx];
                $elderlyIdx++;
                $elderNik = '320101' . str_pad((string) rand(1, 28), 2, '0', STR_PAD_LEFT) . '07' . rand(50, 60) . str_pad((string) ($head->id * 10 + 5), 4, '0', STR_PAD_LEFT);

                User::firstOrCreate(
                    ['nik' => $elderNik],
                    [
                        'name' => $elder['name'] . " ({$elder['relation']} {$head->name})",
                        'email' => 'fam_' . $elderNik . '@smartwarga.local',
                        'password' => Hash::make(Str::random(32)),
                        'role' => 'warga',
                        'rt_number' => $head->rt_number,
                        'house_id' => $house->id,
                        'kk_type' => 'anggota',
                        'no_kk' => $head->no_kk,
                        'birth_place' => 'Solo',
                        'birth_date' => Carbon::now()->subYears($elder['age'])->toDateString(),
                        'gender' => $elder['gender_label'],
                        'religion' => 'Islam',
                        'occupation' => $elder['job'],
                        'marital_status' => 'Kawin',
                        'blood_type' => $bloodTypes[($idx + 2) % count($bloodTypes)],
                        'relationship' => $elder['relation'],
                        'phone' => '0813' . rand(10000000, 99999999),
                        'is_head_of_house' => false,
                        'status' => 'approved',
                    ]
                );

                // Catat ke elderly_health_records (gender: 'L' / 'P')
                $systolic = rand(118, 142);
                $diastolic = rand(76, 88);
                $isPreHtn = $systolic >= 135 || $diastolic >= 85;

                ElderlyHealthRecord::create([
                    'user_id' => $head->id,
                    'elderly_name' => $elder['name'],
                    'gender' => $elder['gender'],
                    'age' => $elder['age'],
                    'rt_number' => $head->rt_number,
                    'systolic' => $systolic,
                    'diastolic' => $diastolic,
                    'blood_pressure_status' => $isPreHtn ? 'Pre-Hipertensi' : 'Normal',
                    'blood_sugar' => rand(95, 128),
                    'cholesterol' => rand(165, 205),
                    'uric_acid' => round(rand(48, 68) / 10, 1),
                    'weight_kg' => rand(54, 68),
                    'waist_circumference_cm' => rand(78, 92),
                    'risk_assessment' => $isPreHtn ? 'Risiko Rendah-Sedang' : 'Risiko Rendah / Sehat',
                    'recommendations' => 'Kurangi konsumsi garam & gorengan, jalan santai 20 menit tiap pagi, kontrol rutin bulan depan.',
                    'examined_at' => Carbon::now()->subDays(rand(3, 10)),
                    'officer_id' => $rt1User?->id ?? $adminUser?->id,
                ]);
            }

            // Pastikan setiap KK Utama punya dompet aktif
            Wallet::firstOrCreate(
                ['user_id' => $head->id],
                ['balance' => (float) rand(75000, 350000)]
            );
        }

        $this->command?->info("Keluarga & Posyandu berhasil di-generate. Menambahkan KK Tambahan...");

        // 3. Tambahkan KK Tambahan di 2 rumah lainnya agar fitur 2 Card Accordion teruji variatif
        // House 3 (Joko Widodo)
        $houseJoko = House::where('number', 3)->where('rt_number', '01')->first();
        if ($houseJoko) {
            $gibranNik = '3201010110870031';
            User::updateOrCreate(
                ['email' => 'gibran.pendukung@smartwarga.test'],
                [
                    'name' => 'Gibran Rakabuming (KK Tambahan)',
                    'password' => Hash::make('password'),
                    'role' => 'warga',
                    'rt_number' => '01',
                    'house_id' => $houseJoko->id,
                    'status' => 'approved',
                    'phone' => '081299887711',
                    'kk_type' => 'kk_pendukung',
                    'no_kk' => '3201012345670031',
                    'nik' => $gibranNik,
                    'relationship' => 'KK Tambahan',
                    'occupation' => 'Wiraswasta',
                    'is_head_of_house' => false,
                ]
            );
            User::updateOrCreate(
                ['email' => 'selvi.istri@smartwarga.test'],
                [
                    'name' => 'Selvi Ananda (Istri Gibran)',
                    'password' => Hash::make('password'),
                    'role' => 'warga',
                    'rt_number' => '01',
                    'house_id' => $houseJoko->id,
                    'status' => 'approved',
                    'phone' => '081299887712',
                    'kk_type' => 'kk_pendukung',
                    'no_kk' => '3201012345670031',
                    'nik' => '3201010901890032',
                    'relationship' => 'Istri',
                    'occupation' => 'Ibu Rumah Tangga',
                    'is_head_of_house' => false,
                ]
            );
        }

        // House 126 (Bambang Pamungkas di RT 02)
        $houseBepe = House::where('number', 1)->where('rt_number', '02')->first();
        if ($houseBepe) {
            User::updateOrCreate(
                ['email' => 'bepe.jr@smartwarga.test'],
                [
                    'name' => 'Bambang Pamungkas Jr (KK Tambahan)',
                    'password' => Hash::make('password'),
                    'role' => 'warga',
                    'rt_number' => '02',
                    'house_id' => $houseBepe->id,
                    'status' => 'approved',
                    'phone' => '081299887722',
                    'kk_type' => 'kk_pendukung',
                    'no_kk' => '3201012345670202',
                    'nik' => '3201011006980202',
                    'relationship' => 'KK Tambahan',
                    'occupation' => 'Atlet / Pelatih',
                    'is_head_of_house' => false,
                ]
            );
        }

        $this->command?->info("Membuat Transaksi Dompet & Iuran...");

        // 4. Riwayat Transaksi Wallet Warga (Top-up & Bayar IPL)
        foreach ($heads->take(12) as $warga) {
            $wallet = Wallet::where('user_id', $warga->id)->first();
            if ($wallet) {
                WalletTransaction::create([
                    'wallet_id' => $wallet->id,
                    'user_id' => $warga->id,
                    'type' => 'credit',
                    'category' => 'topup',
                    'amount' => 100000.00,
                    'reference_id' => 'TOPUP-' . strtoupper(Str::random(8)),
                    'description' => 'Top Up Saldo via QRIS Dinamis Bank BCA',
                    'status' => 'completed',
                ]);

                WalletTransaction::create([
                    'wallet_id' => $wallet->id,
                    'user_id' => $warga->id,
                    'type' => 'debit',
                    'category' => 'ipl_payment',
                    'amount' => 50000.00,
                    'reference_id' => 'IPL-' . strtoupper(Str::random(8)),
                    'description' => 'Pembayaran Rutin Iuran IPL Lingkungan RW 05',
                    'status' => 'completed',
                ]);
            }
        }

        $this->command?->info("Membuat Persuratan Digital (Letters)...");

        // 5. Persuratan Digital (Letters)
        // type: enum('skck','domisili','sktm','lainnya')
        // status: enum('draft','submitted','rt_approved','rw_approved','rejected')
        $lettersData = [
            [
                'user_id' => $heads[0]?->id,
                'type' => 'skck',
                'purpose' => 'Persyaratan melamar pekerjaan BUMN PT Telkom Indonesia',
                'status' => 'rw_approved',
                'notes' => 'Berkas lengkap. Catatan kelakuan baik terverifikasi.',
                'rt_approved_by' => $rt1User?->id,
                'rw_approved_by' => $rwUser?->id,
            ],
            [
                'user_id' => $heads[1]?->id,
                'type' => 'domisili',
                'purpose' => 'Persyaratan pembukaan rekening Bank Syariah Indonesia & pendaftaran NPWP',
                'status' => 'rw_approved',
                'notes' => 'Domisili terdata sah di unit hunian RT 01.',
                'rt_approved_by' => $rt1User?->id,
                'rw_approved_by' => $rwUser?->id,
            ],
            [
                'user_id' => $heads[2]?->id,
                'type' => 'lainnya',
                'purpose' => 'Pengajuan Surat Keterangan Usaha (SKU) Katering Rumahan & NIB',
                'status' => 'rw_approved',
                'notes' => 'Usaha aktif berlokasi di dalam lingkungan warga.',
                'rt_approved_by' => $rt1User?->id,
                'rw_approved_by' => $rwUser?->id,
            ],
            [
                'user_id' => $heads[3]?->id,
                'type' => 'lainnya',
                'purpose' => 'Pengurusan Akta Kelahiran anak di Kantor Disdukcapil',
                'status' => 'rt_approved',
                'notes' => 'Surat keterangan bidan/RS terlampir lengkap.',
                'rt_approved_by' => $rt1User?->id,
                'rw_approved_by' => null,
            ],
            [
                'user_id' => $heads[4]?->id,
                'type' => 'lainnya',
                'purpose' => 'Surat Pengantar Pernikahan Formulir N1-N4 ke KUA Kecamatan',
                'status' => 'rt_approved',
                'notes' => 'Disetujui RT, menunggu verifikasi tanda tangan Ketua RW.',
                'rt_approved_by' => $rt1User?->id,
                'rw_approved_by' => null,
            ],
            [
                'user_id' => $heads[5]?->id,
                'type' => 'domisili',
                'purpose' => 'Permohonan Surat Pengantar Pindah Domisili Antar-Kota',
                'status' => 'submitted',
                'notes' => 'Menunggu verifikasi data kependudukan dari ketua RT.',
                'rt_approved_by' => null,
                'rw_approved_by' => null,
            ],
            [
                'user_id' => $heads[6]?->id,
                'type' => 'skck',
                'purpose' => 'Persyaratan pendaftaran seleksi CPNS Formasi 2026',
                'status' => 'submitted',
                'notes' => 'Baru diajukan oleh pemohon.',
                'rt_approved_by' => null,
                'rw_approved_by' => null,
            ],
            [
                'user_id' => $heads[7]?->id,
                'type' => 'domisili',
                'purpose' => 'Persyaratan pendaftaran sekolah anak jalur zonasi',
                'status' => 'submitted',
                'notes' => null,
                'rt_approved_by' => null,
                'rw_approved_by' => null,
            ],
            [
                'user_id' => $heads[8]?->id,
                'type' => 'sktm',
                'purpose' => 'Pengajuan Keringanan Biaya Rumah Sakit & SKTM Pendidikan',
                'status' => 'rw_approved',
                'notes' => 'Disetujui untuk bantuan beasiswa pendidikan anak berprestasi.',
                'rt_approved_by' => $rt1User?->id,
                'rw_approved_by' => $rwUser?->id,
            ],
            [
                'user_id' => $heads[9]?->id,
                'type' => 'skck',
                'purpose' => 'Persyaratan perpanjangan kontrak kerja instansi kementerian',
                'status' => 'rw_approved',
                'notes' => 'Data sesuai identitas KTP dan KK.',
                'rt_approved_by' => $rt1User?->id,
                'rw_approved_by' => $rwUser?->id,
            ],
        ];

        foreach ($lettersData as $lData) {
            if (!$lData['user_id']) continue;
            Letter::create([
                'user_id' => $lData['user_id'],
                'type' => $lData['type'],
                'purpose' => $lData['purpose'],
                'status' => $lData['status'],
                'rt_approved_by' => $lData['rt_approved_by'],
                'rt_approved_at' => $lData['rt_approved_by'] ? Carbon::now()->subDays(rand(1, 4)) : null,
                'rw_approved_by' => $lData['rw_approved_by'],
                'rw_approved_at' => $lData['rw_approved_by'] ? Carbon::now()->subDays(rand(0, 2)) : null,
                'notes' => $lData['notes'],
            ]);
        }

        $this->command?->info("Membuat Pengaduan Warga (Complaints)...");

        // 6. Layanan Pengaduan Warga (Complaints)
        // status: enum('laporan_masuk','diproses','selesai')
        $complaintsData = [
            [
                'user_id' => $heads[0]?->id,
                'category' => 'fasilitas',
                'title' => 'Lampu PJU Jalan Depan Blok B No. 4 Padam',
                'description' => 'Lampu penerangan jalan umum depan rumah Blok B No. 4 padam sejak 2 hari lalu, kondisi jalan agak gelap saat malam hari.',
                'status' => 'diproses',
                'handled_by' => $rt1User?->id,
                'response_history' => json_encode([
                    ['by' => 'Ketua RT 01', 'at' => Carbon::now()->subHours(6)->toDateTimeString(), 'text' => 'Laporan diterima. Sudah dikoordinasikan dengan teknisi PJU warga, estimasi penggantian bohlam hari ini.']
                ]),
            ],
            [
                'user_id' => $heads[1]?->id,
                'category' => 'kebersihan',
                'title' => 'Saluran Got Tersumbat Sampah Daun dekat Taman Fasum',
                'description' => 'Saluran drainase air di pertigaan taman tersumbat endapan daun kering dan lumpur, air meluap tipis saat hujan lebat kemarin.',
                'status' => 'selesai',
                'handled_by' => $rt1User?->id,
                'response_history' => json_encode([
                    ['by' => 'Ketua RT 01', 'at' => Carbon::now()->subDays(2)->toDateTimeString(), 'text' => 'Petugas kebersihan telah mengangkut endapan lumpur dan sampah. Saluran air kini kembali lancar.']
                ]),
            ],
            [
                'user_id' => $heads[2]?->id,
                'category' => 'lingkungan',
                'title' => 'Dahan Pohon Rindang Dekat Kabel Listrik Blok C',
                'description' => 'Pohon mangga di tikungan Blok C dahannya sudah menjuntai mendekati kabel optik dan kabel PLN, mohon dijadwalkan pemangkasan.',
                'status' => 'laporan_masuk',
                'handled_by' => null,
                'response_history' => null,
            ],
            [
                'user_id' => $heads[3]?->id,
                'category' => 'ketertiban',
                'title' => 'Mobil Tamu Parkir Menutupi Akses Keluar Warga',
                'description' => 'Ada mobil tamu pengunjung sering parkir di tikungan jalan sehingga menyulitkan kendaraan warga lain yang ingin belok keluar.',
                'status' => 'selesai',
                'handled_by' => $rt1User?->id,
                'response_history' => json_encode([
                    ['by' => 'Satpam Pos 01', 'at' => Carbon::now()->subDays(1)->toDateTimeString(), 'text' => 'Petugas satpam sudah menegur pemilik kendaraan dan memindahkannya ke kantong parkir balai warga.']
                ]),
            ],
            [
                'user_id' => $heads[4]?->id,
                'category' => 'fasilitas',
                'title' => 'Paving Block Amblas di Jalur Masuk RT 02',
                'description' => 'Paving block jalan utama RT 02 amblas sekitar 5 cm akibat dilalui kendaraan material renovasi, rawan membuat pengendara motor tersandung.',
                'status' => 'laporan_masuk',
                'handled_by' => null,
                'response_history' => null,
            ],
            [
                'user_id' => $heads[5]?->id,
                'category' => 'kebersihan',
                'title' => 'Bak Sampah Komunal Retak & Butuh Tutup Baru',
                'description' => 'Bak sampah depan gang 3 tutupnya pecah sehingga kucing liar sering membongkar kantong plastik sampah.',
                'status' => 'diproses',
                'handled_by' => $rt1User?->id,
                'response_history' => json_encode([
                    ['by' => 'Ketua RT 01', 'at' => Carbon::now()->subHours(12)->toDateTimeString(), 'text' => 'Pengurus telah memesan tong sampah baru dengan roda dan penutup rapat dari dana operasional kebersihan.']
                ]),
            ],
            [
                'user_id' => $heads[6]?->id,
                'category' => 'keamanan',
                'title' => 'Permohonan Peningkatan Patroli Ronda Dini Hari',
                'description' => 'Mohon satpam dan regu ronda meningkatkan patroli jalan kaki sekitar pukul 02.00 - 04.00 WIB di gang buntu.',
                'status' => 'selesai',
                'handled_by' => $rt1User?->id,
                'response_history' => json_encode([
                    ['by' => 'Danru Satpam', 'at' => Carbon::now()->subDays(3)->toDateTimeString(), 'text' => 'Jadwal ronda telah disesuaikan dan checkpoint patroli dini hari sudah diwajibkan tiap 45 menit.']
                ]),
            ],
        ];

        foreach ($complaintsData as $cData) {
            if (!$cData['user_id']) continue;
            Complaint::create([
                'user_id' => $cData['user_id'],
                'category' => $cData['category'],
                'title' => $cData['title'],
                'description' => $cData['description'],
                'status' => $cData['status'],
                'handled_by' => $cData['handled_by'],
                'response_history' => $cData['response_history'],
            ]);
        }

        $this->command?->info("Membuat Aset Fasum & Peminjaman (Asset Loans)...");

        // 7. Aset Fasum Lengkap & Peminjaman Warga
        $assets = [
            ['name' => 'Tenda Hajatan 4x6 Meter', 'category' => 'tenda', 'quantity' => 2, 'condition' => 'Baik Lengkap', 'rt_number' => '01'],
            ['name' => 'Kursi Lipat Chitose Besi', 'category' => 'kursi', 'quantity' => 100, 'condition' => 'Sangat Baik', 'rt_number' => '01'],
            ['name' => 'Sound System Portable Wireless 15 Inch', 'category' => 'sound_system', 'quantity' => 2, 'condition' => 'Normal 2 Mic', 'rt_number' => '01'],
            ['name' => 'Proyektor Epson & Layar Tripod 84 Inch', 'category' => 'lainnya', 'quantity' => 1, 'condition' => 'Normal HD', 'rt_number' => '01'],
            ['name' => 'Meja Prasmanan Lipat Kayu', 'category' => 'lainnya', 'quantity' => 8, 'condition' => 'Kokoh', 'rt_number' => '01'],
            ['name' => 'Genset Silent Portable 3500 Watt', 'category' => 'lainnya', 'quantity' => 1, 'condition' => 'Siap Pakai', 'rt_number' => '01'],
            ['name' => 'Mesin Potong Rumput 4-Tak', 'category' => 'lainnya', 'quantity' => 2, 'condition' => 'Tajam & Berfungsi', 'rt_number' => '01'],
            ['name' => 'Alat Fogging Nyamuk DBD', 'category' => 'lainnya', 'quantity' => 1, 'condition' => 'Bagus', 'rt_number' => '01'],
        ];

        $createdAssets = [];
        foreach ($assets as $a) {
            $createdAssets[] = Asset::firstOrCreate(
                ['name' => $a['name'], 'rt_number' => $a['rt_number']],
                [
                    'category' => $a['category'],
                    'quantity' => $a['quantity'],
                    'condition' => $a['condition'],
                ]
            );
        }

        // Peminjaman Aset oleh Warga
        // status: enum('requested','approved','returned','rejected')
        if (count($createdAssets) >= 3 && $heads->count() >= 3) {
            AssetLoan::create([
                'asset_id' => $createdAssets[1]->id,
                'user_id' => $heads[0]->id,
                'quantity' => 40,
                'loan_date' => Carbon::now()->subDays(5)->toDateString(),
                'return_date' => Carbon::now()->subDays(3)->toDateString(),
                'actual_return_date' => Carbon::now()->subDays(3)->toDateString(),
                'status' => 'returned',
                'donation_amount' => 50000.00,
                'approved_by' => $rt1User?->id,
            ]);

            AssetLoan::create([
                'asset_id' => $createdAssets[0]->id,
                'user_id' => $heads[1]->id,
                'quantity' => 1,
                'loan_date' => Carbon::now()->addDays(2)->toDateString(),
                'return_date' => Carbon::now()->addDays(4)->toDateString(),
                'actual_return_date' => null,
                'status' => 'approved',
                'donation_amount' => 100000.00,
                'approved_by' => $rt1User?->id,
            ]);

            AssetLoan::create([
                'asset_id' => $createdAssets[2]->id,
                'user_id' => $heads[2]->id,
                'quantity' => 1,
                'loan_date' => Carbon::now()->toDateString(),
                'return_date' => Carbon::now()->addDays(1)->toDateString(),
                'actual_return_date' => null,
                'status' => 'approved',
                'donation_amount' => 35000.00,
                'approved_by' => $rt1User?->id,
            ]);
        }

        $this->command?->info("Membuat Katalog UMKM Warga...");

        // 8. Katalog UMKM Warga Aktif
        $umkmList = [
            [
                'user_id' => $heads[0]?->id,
                'name' => 'Dapur Bu Dewi - Katering Nasi Kotak & Tumpeng Mini',
                'category' => 'Makanan & Minuman',
                'description' => 'Menerima pesanan nasi kotak, tumpeng mini syukuran, dan aneka lauk harian higienis tanpa MSG berlebih. Siap antar ke seluruh rumah RW 05.',
                'price' => 25000.00,
                'whatsapp_link' => 'https://wa.me/6281234567890?text=Halo%20Bu%20Dewi%20mau%20pesan%20Katering',
                'is_active' => true,
            ],
            [
                'user_id' => $heads[1]?->id,
                'name' => 'Sambal Cumi Asin & Paru Mercon Bu Siti',
                'category' => 'Makanan Ringan',
                'description' => 'Sambal kemasan botol kaca 200 gram dengan potongan cumi asin empuk dan bumbu rempah melimpah. Tahan hingga 1 bulan di kulkas.',
                'price' => 28000.00,
                'whatsapp_link' => 'https://wa.me/6281234567810?text=Halo%20Bu%20Siti%20mau%20pesan%20Sambal',
                'is_active' => true,
            ],
            [
                'user_id' => $heads[2]?->id,
                'name' => 'Kue Subuh Ibu Ratna - Risoles Rogout & Lemper Ayam',
                'category' => 'Kue & Roti',
                'description' => 'Aneka snack box dan kue basah tradisional: risoles mayo, pastel telur, lemper bakar ayam, dadar gulung pandan. Menerima arisan & pengajian.',
                'price' => 3500.00,
                'whatsapp_link' => 'https://wa.me/6281234567820?text=Halo%20Bu%20Ratna%20mau%20pesan%20Snack%20Box',
                'is_active' => true,
            ],
            [
                'user_id' => $heads[3]?->id,
                'name' => 'Fresh Hydroponic Farm RT 01 - Selada & Pakcoy Segar',
                'category' => 'Sayuran & Pertanian',
                'description' => 'Sayuran hidroponik bebas pestisida kimiawi, dipetik langsung dari kebun pekarangan Blok A saat pemesanan. Segar, renyah, dan manis.',
                'price' => 12000.00,
                'whatsapp_link' => 'https://wa.me/6281234567830?text=Halo%20Pak%20mau%20pesan%20Sayur%20Hidroponik',
                'is_active' => true,
            ],
            [
                'user_id' => $heads[4]?->id,
                'name' => 'Laundry Kiloan Bersih Wangi 1 Hari Selesai - Blok B',
                'category' => 'Jasa & Servis',
                'description' => 'Cuci kering setrika wangi menggunakan air filtrasi dan deterjen ramah lingkungan. Layanan jemput antar gratis untuk warga perumahan.',
                'price' => 7000.00,
                'whatsapp_link' => 'https://wa.me/6281234567840?text=Halo%20mau%20laundry%20jemput%20ke%20rumah',
                'is_active' => true,
            ],
            [
                'user_id' => $heads[5]?->id,
                'name' => 'Jasa Cuci AC & Service Dingin Bergaransi - Pak Joko',
                'category' => 'Jasa & Servis',
                'description' => 'Cuci AC Split rumah tangga 0.5 - 2 PK, tambah freon R32/R410A, pengecekan kebocoran. Berpengalaman 10 tahun dan bertetangga terpercaya.',
                'price' => 65000.00,
                'whatsapp_link' => 'https://wa.me/6281234567850?text=Halo%20Pak%20Joko%20mau%20service%20AC',
                'is_active' => true,
            ],
            [
                'user_id' => $heads[6]?->id,
                'name' => 'Madu Hutan Randu Murni 500ml - Toko Herbal Warga',
                'category' => 'Kesehatan',
                'description' => 'Madu murni alami tanpa campuran pemanis buatan, kaya enzim dan antioksidan untuk menjaga daya tahan tubuh keluarga.',
                'price' => 85000.00,
                'whatsapp_link' => 'https://wa.me/6281234567860?text=Halo%20mau%20pesan%20Madu%20Murni',
                'is_active' => true,
            ],
        ];

        foreach ($umkmList as $item) {
            if (!$item['user_id']) continue;
            UmkmProduct::updateOrCreate(
                ['name' => $item['name']],
                $item
            );
        }

        $this->command?->info("Membuat Koperasi Simpan Pinjam...");

        // 9. Koperasi Simpan Pinjam Warga
        // status: enum('draft','submitted','approved','disbursed','completed','rejected')
        if ($heads->count() >= 3) {
            KoperasiLoan::create([
                'user_id' => $heads[0]->id,
                'amount' => 5000000.00,
                'tenor_months' => 10,
                'monthly_installment' => 500000.00,
                'purpose' => 'Penambahan modal usaha katering & pembelian freezer pembeku',
                'status' => 'disbursed',
                'approved_by' => $rt1User?->id,
                'disbursed_at' => Carbon::now()->subMonths(1),
            ]);

            KoperasiLoan::create([
                'user_id' => $heads[1]->id,
                'amount' => 3000000.00,
                'tenor_months' => 6,
                'monthly_installment' => 500000.00,
                'purpose' => 'Biaya perbaikan atap kanopi rumah yang bocor saat musim hujan',
                'status' => 'approved',
                'approved_by' => $rt1User?->id,
                'disbursed_at' => null,
            ]);

            KoperasiLoan::create([
                'user_id' => $heads[2]->id,
                'amount' => 4000000.00,
                'tenor_months' => 8,
                'monthly_installment' => 500000.00,
                'purpose' => 'Biaya daftar ulang pendaftaran sekolah anak semester baru',
                'status' => 'submitted',
                'approved_by' => null,
                'disbursed_at' => null,
            ]);
        }

        $this->command?->info("Membuat Ambulans Siaga & RUKAM...");

        // 10. Ambulans Siaga & RUKAM Kematian
        // ambulances.type: enum('emergency','jenazah','multipurpose')
        // ambulances.status: enum('available','in_service','maintenance')
        $ambulanceMedis = Ambulance::firstOrCreate(
            ['vehicle_number' => 'B 1928 SWR'],
            [
                'name' => 'Ambulans Suzuki APV Siaga Medis RW 05',
                'type' => 'emergency',
                'status' => 'available',
                'driver_name' => 'Pak Joko Widodo (Relawan Siaga)',
                'driver_phone' => '081234567890',
                'equipment' => 'Brankar Pasien, Tabung Oksigen 1m3, Tas P3K Darurat, Tensimeter Digital',
                'notes' => 'Siap 24 jam untuk rujukan medis dan kontrol faskes warga.',
            ]
        );

        $ambulanceJenazah = Ambulance::firstOrCreate(
            ['vehicle_number' => 'B 2024 DKA'],
            [
                'name' => 'Mobil Jenazah Suzuki APV RUKAM Duka',
                'type' => 'jenazah',
                'status' => 'available',
                'driver_name' => 'Pak Bambang Pamungkas (Relawan Duka)',
                'driver_phone' => '081234567821',
                'equipment' => 'Keranda Stainless, Kain Penutup Hijau, Tenda Payung Jenazah',
                'notes' => 'Khusus pelayanan pengantaran jenazah ke tempat pemakaman umum.',
            ]
        );

        // Riwayat Booking Ambulans
        // service_type: enum('emergency','rujukan','jenazah')
        // urgency_level: enum('urgent','scheduled')
        // status: enum('requested','dispatched','completed','cancelled')
        if ($heads->count() >= 2) {
            AmbulanceBooking::create([
                'booking_code' => 'AMB-' . date('Ymd') . '-001',
                'user_id' => $heads[0]->id,
                'ambulance_id' => $ambulanceMedis->id,
                'patient_name' => 'Kakek Soepardi (Lansia)',
                'service_type' => 'rujukan',
                'urgency_level' => 'scheduled',
                'pickup_address' => $heads[0]->house?->full_address ?? 'RT 01 Blok A No. 1',
                'destination_address' => 'RSUD Kota - Poli Geriatri & Penyakit Dalam',
                'pickup_time' => Carbon::now()->subDays(4)->setTime(8, 30),
                'notes' => 'Antar kontrol rutin tekanan darah lansia, kondisi stabil di kursi roda.',
                'driver_name' => $ambulanceMedis->driver_name,
                'driver_phone' => $ambulanceMedis->driver_phone,
                'status' => 'completed',
                'dispatched_at' => Carbon::now()->subDays(4)->setTime(8, 15),
                'completed_at' => Carbon::now()->subDays(4)->setTime(11, 45),
                'handled_by' => $rt1User?->id,
            ]);
        }

        // 1 Laporan RUKAM Santunan Masa Lalu
        // status: enum('reported','verified','disbursed')
        RukamReport::create([
            'reported_by' => $heads[0]->id,
            'deceased_name' => 'Alm. H. Sanusi Bin Abdullah',
            'deceased_nik' => '3201010101450001',
            'deceased_address' => 'RT 01 Blok A No. 12',
            'relation' => 'Warga Tetangga',
            'date_of_death' => Carbon::now()->subMonths(2)->toDateString(),
            'time_of_death' => '05:30:00',
            'cause_of_death' => 'Sakit Usia Lanjut / Geriatri',
            'burial_location' => 'TPU Sirnaraga Blok Muslim',
            'burial_datetime' => Carbon::now()->subMonths(2)->setTime(13, 30),
            'needs_ambulance' => true,
            'needs_tent_and_chairs' => true,
            'notes' => 'Pelayanan pemakaman dan santunan duka RUKAM telah terlaksana secara khidmat.',
            'status' => 'disbursed',
            'verified_by' => $rt1User?->id,
            'verified_at' => Carbon::now()->subMonths(2),
            'disbursement_amount' => 2000000.00,
            'disbursed_by' => $rwUser?->id,
            'disbursed_at' => Carbon::now()->subMonths(2)->addDays(1),
        ]);

        $this->command?->info("Membuat Donasi Kegiatan Warga...");

        // 11. Partisipasi Donasi Kegiatan Warga
        // status: enum('pending','approved','rejected')
        $announcement = Announcement::where('allow_donation', true)->first();
        if ($announcement) {
            $donors = [
                ['user' => $heads[0] ?? null, 'amount' => 100000.00],
                ['user' => $heads[1] ?? null, 'amount' => 150000.00],
                ['user' => $heads[2] ?? null, 'amount' => 200000.00],
                ['user' => $heads[3] ?? null, 'amount' => 50000.00],
                ['user' => $heads[4] ?? null, 'amount' => 100000.00],
                ['user' => $heads[5] ?? null, 'amount' => 75000.00],
            ];

            foreach ($donors as $d) {
                if (!$d['user']) continue;
                AnnouncementDonation::create([
                    'announcement_id' => $announcement->id,
                    'user_id' => $d['user']->id,
                    'amount' => $d['amount'],
                    'status' => 'approved',
                    'verified_by' => $rwUser?->id,
                ]);
            }
        }

        $this->command?->info("SIMULASI KEHIDUPAN WARGA SELESAI DENGAN SUKSES! (Modul IoT Tetap Kosong Sesuai Permintaan)");
    }
}
