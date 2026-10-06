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
    
    // Assign to house: RT 01, start from Blok A No 2 (No 1 is Budi)
    // Blok A has 25 houses (No 1-25), Blok B has 25 houses (No 1-25)
    if ($num <= 24) {
        $block = 'A';
        $houseNum = $num + 1; // 2..25
    } else {
        $block = 'B';
        $houseNum = ($num - 24); // 1..10
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

    $rfid = 'RFID_WARGA_' . str_pad($num + 1, 3, '0', STR_PAD_LEFT);
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

echo "\n=== SEEDING SELESAI ===\n";
echo "Total Baru Dibuat: {$createdCount}\n";
echo "Total Diperbarui: {$updatedCount}\n";
echo "Total Keseluruhan: " . count($names) . " warga.\n";
