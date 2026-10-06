<?php

use App\Models\House;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

$names = [
    'Achmad Vickry Firdaus',
    'Cikal Prayoga',
    'Julvan Augus Miseri Cordias Harefa',
    'Reival Al Kahfi',
    'Halim Hafis',
    'Kurnia Yuliansyah',
    'Sonri Tolla',
    'Yohnes Nelsen Christian Pontoh',
    'Arfendy Maulana',
    'M Firmansyah',
    'Dimas Waldy Muzzaky',
    'Argo Iriano Sumarno',
    'Mohammad Raffi Aryadi',
    'Muhammad Fattah Hadi Mirza',
    'Julisman Harefa',
    'Noventri Dermawan Zendrato',
    'Ahmad Tsaqib Karim',
    'Titis Rismawati',
    'Amelia Sumayah',
    'Anggi Fitri Ramadhani',
    'Annisa Zahra Sofanie',
    'Risywda Zahra Mugiharjo',
    'Zahra Ramadhani',
    'Shibghi Hidayatullail',
    'Muhanmad Fadli Syaputra',
    'Achmad Pathoni',
    'Yazid Abdul Karim',
    'Riky Ridwan',
    'Alfriza',
    'Syaifullah Asshadiq',
    'Muhammad Ilham Hidayat',
    'Fabwian Nazhif Atthallah',
    'Angelo Christian Juan',
    'Julius Wisnu Broto',
];

// Gender inference helper
$femaleKeywords = ['titis', 'amelia', 'anggi', 'annisa', 'risywda', 'zahra', 'rahma', 'siti', 'ayu', 'putri', 'dewi'];

echo "=== MEMULAI SEEDING 34 WARGA KE DATABASE ===\n";

$createdCount = 0;
$updatedCount = 0;

foreach ($names as $index => $name) {
    $num = $index + 1; // 1 to 34
    
    // Generate clean email
    $parts = explode(' ', strtolower(preg_replace('/[^a-zA-Z0-9\s]/', '', $name)));
    $first = $parts[0] ?? 'warga';
    $second = $parts[1] ?? 'warga';
    $emailPrefix = $first . '.' . $second;
    $email = $emailPrefix . '@smartwarga.test';
    
    // Assign to house: RT 01, start from Blok A No 4 (No 1 is Budi, No 2 is Siti, No 3 is Joko)
    // Blok A has 25 houses (No 4-25 = 22 unit), sisa 12 unit dialokasikan ke Blok B No 1-12
    if ($num <= 22) {
        $block = 'A';
        $houseNum = $num + 3; // 1..22 -> 4..25
    } else {
        $block = 'B';
        $houseNum = ($num - 22); // 23..34 -> 1..12
    }
    
    $house = House::firstOrCreate(
        [
            'rt_number' => '01',
            'block' => $block,
            'number' => $houseNum,
        ],
        [
            'house_code' => "RT01-{$block}" . str_pad($houseNum, 2, '0', STR_PAD_LEFT),
            'full_address' => "RT 01 Blok {$block} No. {$houseNum}",
        ]
    );

    // Gender detection
    $gender = 'L';
    foreach ($femaleKeywords as $kw) {
        if (str_contains(strtolower($name), $kw)) {
            $gender = 'P';
            break;
        }
    }

    $rfid = 'RFID_WARGA_' . str_pad($num + 3, 3, '0', STR_PAD_LEFT);
    $phone = '0812' . str_pad(77000000 + $num, 8, '0', STR_PAD_LEFT);
    $nik = '327601' . '12059' . str_pad($num, 5, '0', STR_PAD_LEFT);
    $noKk = '327601' . '20011' . str_pad($num, 5, '0', STR_PAD_LEFT);

    $user = User::where('email', $email)->orWhere('name', $name)->first();
    
    $userData = [
        'name' => $name,
        'email' => $email,
        'password' => Hash::make('password'),
        'role' => 'warga',
        'rt_number' => '01',
        'house_id' => $house->id,
        'rfid_uid' => $rfid,
        'status' => 'approved',
        'phone' => $phone,
        'nik' => $nik,
        'no_kk' => $noKk,
        'gender' => $gender,
        'is_head_of_house' => true,
        'kk_type' => 'kk_utama',
        'religion' => 'Islam',
        'occupation' => 'Karyawan Swasta',
        'marital_status' => 'Menikah',
        'blood_type' => 'O',
    ];

    if ($user) {
        $user->update($userData);
        $updatedCount++;
    } else {
        $user = User::create($userData);
        $createdCount++;
    }

    // Set house head of family and occupied
    $house->update([
        'is_occupied' => true,
        'head_of_family_id' => $user->id,
    ]);

    // Auto-create / topup wallet
    Wallet::firstOrCreate(
        ['user_id' => $user->id],
        [
            'balance' => 150000,
            'is_active' => true,
        ]
    );

    echo sprintf(
        "[%02d/34] %-35s | Email: %-32s | Blok %s No %02d | RFID: %s\n",
        $num,
        $name,
        $email,
        $block,
        $houseNum,
        $rfid
    );
}

// Pastikan Rumah Percontohan 1, 2, 3 tetap bersih & terhubung ke pemilik aslinya
$budi = User::where('email', 'budi@smartwarga.test')->first();
$siti = User::where('email', 'siti@smartwarga.test')->first();
$joko = User::where('email', 'joko@smartwarga.test')->first();

$h1 = House::where('rt_number', '01')->where('block', 'A')->where('number', 1)->first();
$h2 = House::where('rt_number', '01')->where('block', 'A')->where('number', 2)->first();
$h3 = House::where('rt_number', '01')->where('block', 'A')->where('number', 3)->first();

if ($h1 && $budi) $h1->update(['head_of_family_id' => $budi->id, 'is_occupied' => true]);
if ($h2 && $siti) $h2->update(['head_of_family_id' => $siti->id, 'is_occupied' => false]);
if ($h3 && $joko) $h3->update(['head_of_family_id' => $joko->id, 'is_occupied' => true]);


echo "\n=== SEEDING SELESAI ===\n";
echo "Total Baru Dibuat: {$createdCount}\n";
echo "Total Diperbarui: {$updatedCount}\n";
echo "Total Keseluruhan: " . count($names) . " warga.\n";
