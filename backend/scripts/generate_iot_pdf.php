<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Barryvdh\DomPDF\Facade\Pdf;

$html = <<<HTML
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Buku Panduan Hardware IoT ESP32 - SMART-WARGA</title>
<style>
  @page {
    margin: 15mm 15mm 15mm 15mm;
  }
  body {
    font-family: 'Helvetica', 'Arial', sans-serif;
    color: #1e293b;
    font-size: 9.5pt;
    line-height: 1.45;
  }
  .cover {
    text-align: center;
    padding-top: 60px;
    page-break-after: always;
  }
  .cover-logo {
    font-size: 32pt;
    font-weight: 900;
    color: #0f172a;
    letter-spacing: 2px;
    margin-bottom: 5px;
  }
  .cover-badge {
    display: inline-block;
    background: #0284c7;
    color: #ffffff;
    font-size: 10pt;
    font-weight: bold;
    padding: 5px 16px;
    border-radius: 15px;
    margin-bottom: 25px;
  }
  .cover-title {
    font-size: 20pt;
    font-weight: bold;
    color: #1e293b;
    line-height: 1.3;
    margin-bottom: 15px;
  }
  .cover-subtitle {
    font-size: 12pt;
    color: #64748b;
    margin-bottom: 80px;
  }
  .cover-meta {
    border-top: 2px solid #e2e8f0;
    padding-top: 20px;
    font-size: 9pt;
    color: #64748b;
    line-height: 1.6;
  }
  h2.section-header {
    font-size: 13pt;
    color: #0f172a;
    border-bottom: 2px solid #0284c7;
    padding-bottom: 5px;
    margin-top: 18px;
    margin-bottom: 10px;
    text-transform: uppercase;
  }
  h3.subsection-header {
    font-size: 11pt;
    color: #0369a1;
    margin-top: 14px;
    margin-bottom: 6px;
  }
  p {
    margin-top: 0;
    margin-bottom: 8px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 6px;
    margin-bottom: 14px;
    font-size: 8.5pt;
  }
  th {
    background-color: #0f172a;
    color: #ffffff;
    font-weight: bold;
    text-align: left;
    padding: 6px 8px;
    border: 1px solid #334155;
  }
  td {
    padding: 5px 8px;
    border: 1px solid #cbd5e1;
    vertical-align: top;
  }
  tr:nth-child(even) {
    background-color: #f8fafc;
  }
  .code-block {
    background-color: #0f172a;
    color: #e2e8f0;
    font-family: 'Courier New', Courier, monospace;
    font-size: 8pt;
    padding: 8px 10px;
    border-radius: 4px;
    margin: 8px 0;
    line-height: 1.35;
  }
  .box-note {
    background-color: #f0fdf4;
    border-left: 4px solid #16a34a;
    padding: 8px 10px;
    margin: 10px 0;
    font-size: 8.5pt;
    border-radius: 0 4px 4px 0;
  }
  .box-warning {
    background-color: #fffbeb;
    border-left: 4px solid #d97706;
    padding: 8px 10px;
    margin: 10px 0;
    font-size: 8.5pt;
    border-radius: 0 4px 4px 0;
  }
  .page-break {
    page-break-after: always;
  }
  ul, ol {
    margin-top: 0;
    margin-bottom: 8px;
    padding-left: 18px;
  }
  li {
    margin-bottom: 3px;
  }
</style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover">
  <div class="cover-logo">SMART-WARGA</div>
  <div class="cover-badge">BUKU PANDUAN IMPLEMENTASI IOT</div>
  <div class="cover-title">PANDUAN LENGKAP PENYAMBUNGAN HARDWARE &amp; FLASHING FIRMWARE ESP32</div>
  <div class="cover-subtitle">Integrasi 3 Node Mikrokontroler: Palang Otomatis, Sirine Wilayah, dan Timbangan Bank Sampah Digital</div>

  <div class="cover-meta">
    <strong>Penulis:</strong> Tim Pengembang Sistem Terpadu SMART-WARGA<br>
    <strong>Target Mikrokontroler:</strong> ESP32 DevKit V1 (30-Pin / 38-Pin)<br>
    <strong>Framework:</strong> Arduino C++ &amp; Laravel 11 REST API<br>
    <strong>Tahun Rilis:</strong> Oktober 2026 | Edisi Revisi Lengkap
  </div>
</div>

<!-- BAB 1 -->
<h2 class="section-header">BAB 1: Arsitektur &amp; Topologi 3 Node IoT</h2>
<p>
  Sistem SMART-WARGA mengadopsi arsitektur <em>Distributed Multi-Node IoT</em> yang terdiri dari 3 unit mikrokontroler <strong>ESP32 DevKit V1</strong>. Masing-masing node memiliki tanggung jawab perangkat keras tersendiri dan terhubung ke backend Laravel melalui jaringan WiFi / Local Area Network (LAN).
</p>

<table>
  <thead>
    <tr>
      <th style="width: 12%;">Node</th>
      <th style="width: 20%;">Lokasi Fisik</th>
      <th style="width: 38%;">Komponen Periferal</th>
      <th style="width: 30%;">Tugas Utama</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Node 1</strong></td>
      <td>Pos Satpam / Gerbang Utama</td>
      <td>ESP32, RFID RC522, Servo SG90, Panic Button Fisik, Active Buzzer</td>
      <td>Autentikasi ronda malam, buka palang otomatis 90° (4 detik), dan pemicu darurat hardware.</td>
    </tr>
    <tr>
      <td><strong>Node 2</strong></td>
      <td>Balai RT / Menara Sirine</td>
      <td>ESP32, Modul Relay 5V Optocoupler, Horn Sirine 12V/220V, LED Strobe</td>
      <td>Polling status alarm server per 3 detik; mengaktifkan horn sirine saat terpicu bahaya.</td>
    </tr>
    <tr>
      <td><strong>Node 3</strong></td>
      <td>Sentra Terpadu RW</td>
      <td>ESP32, RFID RC522, Load Cell HX711, HC-SR04, LCD 16x2 I2C, 2x Tombol</td>
      <td>Timbangan digital sampah kaleng/plastik, auto-kredit dompet warga &amp; Kios Posyandu balita.</td>
    </tr>
  </tbody>
</table>

<div class="box-note">
  <strong>Fleksibilitas Pengujian:</strong> Jika Anda saat ini baru memiliki 1 unit ESP32, Anda tetap dapat mengujinya secara bergantian dengan meng-upload program Node 1, Node 2, atau Node 3 ke board yang sama, atau memanfaatkan panel <em>Hardware Simulator</em> di dashboard web.
</div>

<!-- BAB 2 -->
<h2 class="section-header">BAB 2: Panduan Pengkabelan (Wiring Guide Detail)</h2>
<p>
  Berikut adalah rincian koneksi kaki pin komponen periferal ke pin GPIO pada board ESP32 DevKit V1 untuk masing-masing node:
</p>

<h3 class="subsection-header">2.1 Pengkabelan Node 1: Pos Satpam &amp; Gerbang Palang</h3>
<table>
  <thead>
    <tr>
      <th>Komponen Periferal</th>
      <th>Pin Komponen</th>
      <th>Pin ESP32 DevKit V1</th>
      <th>Keterangan / Fungsi</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="7"><strong>RFID RC522</strong><br>(SPI Protocol)</td>
      <td>VCC</td>
      <td><strong>3.3V</strong></td>
      <td><span style="color:red; font-weight:bold;">Wajib 3.3V!</span> Jangan hubungkan ke 5V</td>
    </tr>
    <tr>
      <td>GND</td>
      <td>GND</td>
      <td>Ground bersama</td>
    </tr>
    <tr>
      <td>SDA / SS</td>
      <td>GPIO 21</td>
      <td>Chip Select SPI</td>
    </tr>
    <tr>
      <td>SCK</td>
      <td>GPIO 18</td>
      <td>Clock SPI</td>
    </tr>
    <tr>
      <td>MOSI</td>
      <td>GPIO 23</td>
      <td>Master Out Slave In</td>
    </tr>
    <tr>
      <td>MISO</td>
      <td>GPIO 19</td>
      <td>Master In Slave Out</td>
    </tr>
    <tr>
      <td>RST</td>
      <td>GPIO 22</td>
      <td>Reset Pin</td>
    </tr>
    <tr>
      <td rowspan="3"><strong>Servo SG90</strong><br>(Palang Pintu)</td>
      <td>Kabel Merah (VCC)</td>
      <td><strong>VIN / 5V</strong></td>
      <td>Daya motor servo</td>
    </tr>
    <tr>
      <td>Kabel Cokelat (GND)</td>
      <td>GND</td>
      <td>Ground bersama</td>
    </tr>
    <tr>
      <td>Kabel Oranye (PWM)</td>
      <td>GPIO 13</td>
      <td>Sinyal kendali sudut servo (0° - 90°)</td>
    </tr>
    <tr>
      <td rowspan="2"><strong>Panic Button</strong></td>
      <td>Kaki Tombol 1</td>
      <td>GPIO 4</td>
      <td>Input interrupt dengan mode INPUT_PULLUP</td>
    </tr>
    <tr>
      <td>Kaki Tombol 2</td>
      <td>GND</td>
      <td>Saat ditekan, sinyal ditarik ke GND</td>
    </tr>
    <tr>
      <td><strong>Buzzer Aktif</strong></td>
      <td>Kaki Positif (+)</td>
      <td>GPIO 15</td>
      <td>Nada beep konfirmasi akses (Kaki (-) ke GND)</td>
    </tr>
  </tbody>
</table>

<div class="page-break"></div>

<h3 class="subsection-header">2.2 Pengkabelan Node 2: Menara Sirine &amp; Alarm Wilayah</h3>
<table>
  <thead>
    <tr>
      <th>Komponen Periferal</th>
      <th>Pin Komponen</th>
      <th>Pin ESP32</th>
      <th>Keterangan</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="3"><strong>Modul Relay 5V</strong><br>(Optocoupler)</td>
      <td>VCC</td>
      <td>VIN / 5V</td>
      <td>Daya koil relay 5V</td>
    </tr>
    <tr>
      <td>GND</td>
      <td>GND</td>
      <td>Ground bersama</td>
    </tr>
    <tr>
      <td>IN</td>
      <td>GPIO 26</td>
      <td>Sinyal kontrol (Active LOW: LOW = Relay ON)</td>
    </tr>
    <tr>
      <td rowspan="2"><strong>LED / Strobe</strong></td>
      <td>Anoda (+)</td>
      <td>GPIO 2</td>
      <td>Dihubungkan melalui resistor 220 Ohm</td>
    </tr>
    <tr>
      <td>Katoda (-)</td>
      <td>GND</td>
      <td>Ground</td>
    </tr>
  </tbody>
</table>

<p><strong>Diagram Saklar Horn Sirine 12V DC ke Terminal Relay:</strong></p>
<div class="code-block">
[ Adaptor 12V (+) ] -------------> [ Terminal Positif Horn Sirine ]
[ Terminal Negatif Horn ] --------> [ Relay Pin NO (Normally Open) ]
[ Relay Pin COM (Common) ] -------> [ Adaptor 12V (-) GND ]
</div>

<h3 class="subsection-header">2.3 Pengkabelan Node 3: Terminal Bank Sampah &amp; Posyandu</h3>
<table>
  <thead>
    <tr>
      <th>Periferal</th>
      <th>Pin Periferal</th>
      <th>Pin ESP32</th>
      <th>Keterangan</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="4"><strong>LCD 16x2 I2C</strong></td>
      <td>SDA</td>
      <td>GPIO 21</td>
      <td>I2C Data Bus</td>
    </tr>
    <tr>
      <td>SCL</td>
      <td>GPIO 22</td>
      <td>I2C Clock Bus</td>
    </tr>
    <tr>
      <td>VCC / GND</td>
      <td>VIN (5V) &amp; GND</td>
      <td>Daya layar LCD</td>
    </tr>
    <tr>
      <td>Alamat I2C</td>
      <td>0x27 atau 0x3F</td>
      <td>Disetel via trimmer modul backpack</td>
    </tr>
    <tr>
      <td rowspan="4"><strong>Modul HX711</strong><br>(Load Cell)</td>
      <td>DT (Data)</td>
      <td>GPIO 16</td>
      <td>Sinyal data pembacaan berat</td>
    </tr>
    <tr>
      <td>SCK (Clock)</td>
      <td>GPIO 17</td>
      <td>Clock ADC HX711</td>
    </tr>
    <tr>
      <td>VCC / GND</td>
      <td>VIN (5V) &amp; GND</td>
      <td>Daya modul timbangan</td>
    </tr>
    <tr>
      <td>Kabel Load Cell</td>
      <td>E+, E-, A+, A-</td>
      <td>Merah (E+), Hitam (E-), Putih (A-), Hijau (A+)</td>
    </tr>
    <tr>
      <td rowspan="4"><strong>RFID RC522</strong></td>
      <td>SDA (SS)</td>
      <td>GPIO 5</td>
      <td>Chip Select SPI untuk Node 3</td>
    </tr>
    <tr>
      <td>SCK, MOSI, MISO</td>
      <td>GPIO 18, 23, 19</td>
      <td>Jalur bus SPI</td>
    </tr>
    <tr>
      <td>RST</td>
      <td>GPIO 4</td>
      <td>Reset Pin</td>
    </tr>
    <tr>
      <td>VCC / GND</td>
      <td><strong>3.3V</strong> &amp; GND</td>
      <td>Level tegangan aman 3.3V</td>
    </tr>
    <tr>
      <td rowspan="2"><strong>Ultrasonik HC-SR04</strong></td>
      <td>TRIG</td>
      <td>GPIO 12</td>
      <td>Pemicu pulsa 10 microsecond</td>
    </tr>
    <tr>
      <td>ECHO</td>
      <td>GPIO 14</td>
      <td>Penerima pantulan sinyal</td>
    </tr>
    <tr>
      <td rowspan="2"><strong>Tombol Kategori</strong></td>
      <td>Tombol Kaleng</td>
      <td>GPIO 32</td>
      <td>Kaki 1 ke GPIO 32, Kaki 2 ke GND (INPUT_PULLUP)</td>
    </tr>
    <tr>
      <td>Tombol Plastik</td>
      <td>GPIO 33</td>
      <td>Kaki 1 ke GPIO 33, Kaki 2 ke GND (INPUT_PULLUP)</td>
    </tr>
  </tbody>
</table>

<!-- BAB 3 -->
<h2 class="section-header">BAB 3: Konfigurasi Arduino IDE &amp; Instalasi Library</h2>
<p>
  Untuk meng-compile dan meng-upload file sketsa <code>.ino</code>, ikuti petunjuk berikut:
</p>

<ol>
  <li><strong>Pasang URL Board ESP32:</strong> Buka <em>Arduino IDE &rarr; Settings</em>, masukkan URL:<br>
    <code>https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json</code>
  </li>
  <li><strong>Instal Board:</strong> Buka <em>Tools &rarr; Board &rarr; Boards Manager</em>, cari <strong>esp32</strong> oleh Espressif Systems dan klik Install.</li>
  <li><strong>Instal 5 Library Wajib:</strong> Buka <em>Sketch &rarr; Include Library &rarr; Manage Libraries</em>:
    <ul>
      <li><code>ArduinoJson</code> (Benoit Blanchon) &mdash; Versi 6 atau 7</li>
      <li><code>MFRC522</code> (GithubCommunity)</li>
      <li><code>ESP32Servo</code> (Kevin Harrington)</li>
      <li><code>LiquidCrystal I2C</code> (Frank de Brabander / Marco Schwartz)</li>
      <li><code>HX711 Arduino Library</code> (Bogdan Necula)</li>
    </ul>
  </li>
</ol>

<div class="page-break"></div>

<!-- BAB 4 -->
<h2 class="section-header">BAB 4: Konfigurasi Jaringan &amp; Menjalankan Backend</h2>
<p>
  Buka file sketsa yang ingin di-flash, lalu ubah 2 baris konfigurasi di bagian atas:
</p>

<div class="code-block">
// ====== KONFIGURASI WIFI &amp; SERVER ======
const char* WIFI_SSID     = "NAMA_WIFI_RUMAH_ANDA";
const char* WIFI_PASSWORD = "PASSWORD_WIFI_ANDA";

// Alamat Server Production SMART-WARGA (Domain SSL Resmi)
const char* API_BASE_URL  = "https://swarga.manajemensystem.my.id"; 
</div>

<div class="box-note">
  <strong>Konektivitas Cloud:</strong> ESP32 dapat terhubung langsung ke domain cloud resmi <code>https://swarga.manajemensystem.my.id</code> melalui koneksi aman terenkripsi TLS/SSL.
</div>

<!-- BAB 5 -->
<h2 class="section-header">BAB 5: Prosedur Upload &amp; Pengujian Lapangan</h2>

<h3 class="subsection-header">5.1 Langkah Flashing Firmware:</h3>
<ol>
  <li>Hubungkan ESP32 ke Mac menggunakan kabel USB data.</li>
  <li>Pilih Board: <strong>Tools &rarr; Board &rarr; ESP32 Dev Module</strong>.</li>
  <li>Pilih Port: <strong>Tools &rarr; Port &rarr; /dev/cu.usbserial-xxx</strong>.</li>
  <li>Klik tombol <strong>Upload</strong> (ikon panah kanan ➔).</li>
  <li>Jika terminal Arduino IDE tertahan pada tulisan <code>Connecting........____</code>, <strong>tekan &amp; tahan tombol BOOT</strong> pada board ESP32 selama 2 detik sampai proses transfer berjalan.</li>
</ol>

<h3 class="subsection-header">5.2 Verifikasi di Serial Monitor:</h3>
<p>Buka Serial Monitor pada baudrate <strong>115200 baud</strong>. Saat ESP32 menyala, layar monitor akan menampilkan konfirmasi koneksi WiFi dan IP lokal ESP32:</p>
<div class="code-block">
[NODE 1] Inisialisasi Pos Satpam SMART-WARGA...
Menghubungkan ke WiFi: SMART_WARGA_WIFI.....
WiFi Terhubung! IP Address: 192.168.0.145
[NODE 1] Siap Beroperasi! Silakan tap kartu RFID atau tekan Panic Button.
</div>

<h3 class="subsection-header">5.3 Uji Coba Transaksi Lapangan:</h3>
<ul>
  <li><strong>Tap Kartu Ronda (Node 1):</strong> Tempelkan kartu UID <code>RFID_WARGA_01</code>. Palang servo berputar 90° selama 4 detik, dan status kehadiran ronda otomatis tercatat di database.</li>
  <li><strong>Panic Button (Node 1 &rarr; Node 2):</strong> Tekan tombol panik. Dalam waktu 3 detik, Node 2 langsung mengaktifkan relay sirine dan web SMART-WARGA menampilkan alarm darurat merah.</li>
  <li><strong>Setor Sampah (Node 3):</strong> Pilih jenis sampah (misal: Kaleng), letakkan beban di timbangan (misal: 1.500 gram), lalu tempelkan kartu RFID. LCD menampilkan <code>+Rp 7.500 | BUDI</code> dan saldo dompet warga bertambah seketika.</li>
</ul>

<!-- BAB 6 -->
<h2 class="section-header">BAB 6: Solusi Kendala Teknis (Troubleshooting)</h2>
<table>
  <thead>
    <tr>
      <th style="width: 25%;">Gejala Masalah</th>
      <th style="width: 35%;">Penyebab Utama</th>
      <th style="width: 40%;">Langkah Pemecahan</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>ESP32 Restart Berulang Kali (Brownout)</strong></td>
      <td>Arus daya USB tidak cukup saat servo bergerak atau WiFi transmitting.</td>
      <td>Gunakan adaptor eksternal 5V 2A. Pasang kapasitor 100-470 µF di antara pin 5V dan GND.</td>
    </tr>
    <tr>
      <td><strong>HTTP Error Code -1</strong></td>
      <td>ESP32 tidak dapat menghubungi IP Mac di jaringan LAN.</td>
      <td>Pastikan Mac dan ESP32 di satu WiFi yang sama. Jalankan <code>php artisan serve --host=0.0.0.0 --port=8000</code>.</td>
    </tr>
    <tr>
      <td><strong>RFID Reader Tidak Terbaca</strong></td>
      <td>Pin VCC salah tegangan atau jalur kabel SPI longgar.</td>
      <td>Pastikan VCC RC522 ke pin <strong>3.3V</strong> (bukan 5V!). Periksa pin SDA dan RST.</td>
    </tr>
    <tr>
      <td><strong>LCD 16x2 Hanya Kotak Hitam</strong></td>
      <td>Kontras belum diatur atau alamat I2C tidak cocok.</td>
      <td>Putar trimpot biru di belakang LCD. Jika teks tidak tampil, ganti alamat dari <code>0x27</code> ke <code>0x3F</code> di sketch.</td>
    </tr>
  </tbody>
</table>

<div style="margin-top: 30px; text-align: center; color: #64748b; font-size: 8.5pt;">
  Dokumentasi Resmi Sistem SMART-WARGA &copy; 2026 &bull; Buku Panduan Implementasi Hardware IoT
</div>

</body>
</html>
HTML;

$pdf = Pdf::loadHTML($html)->setPaper('a4', 'portrait');

$outputPath1 = '/Users/admin/Herd/smartwarga/Buku_Panduan_IoT_ESP32_SMART_WARGA.pdf';
$outputPath2 = '/Users/admin/Herd/smartwarga/docs/Buku_Panduan_IoT_ESP32_SMART_WARGA.pdf';

$pdf->save($outputPath1);
copy($outputPath1, $outputPath2);

echo "PDF Berhasil Dibuat:\n";
echo "1. $outputPath1 (" . filesize($outputPath1) . " bytes)\n";
echo "2. $outputPath2 (" . filesize($outputPath2) . " bytes)\n";
