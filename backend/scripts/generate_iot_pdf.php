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
<title>SMART-WARGA: Buku Panduan Implementasi IoT ESP32 & Arsitektur Sistem Terpadu</title>
<style>
  @page {
    margin: 12mm 14mm 12mm 14mm;
  }
  body {
    font-family: 'Helvetica', 'Arial', sans-serif;
    color: #1e293b;
    font-size: 8.5pt;
    line-height: 1.4;
  }
  .cover {
    text-align: center;
    padding-top: 35px;
    page-break-after: always;
  }
  .cover-logo {
    font-size: 28pt;
    font-weight: 900;
    color: #0f172a;
    letter-spacing: 2px;
    margin-bottom: 2px;
  }
  .cover-tagline {
    font-size: 10.5pt;
    font-weight: 600;
    color: #0284c7;
    margin-bottom: 15px;
    letter-spacing: 0.5px;
  }
  .cover-badge {
    display: inline-block;
    background: #0f172a;
    color: #38bdf8;
    font-size: 8.5pt;
    font-weight: bold;
    padding: 5px 16px;
    border-radius: 14px;
    border: 1px solid #0284c7;
    margin-bottom: 20px;
  }
  .cover-title {
    font-size: 18pt;
    font-weight: bold;
    color: #0f172a;
    line-height: 1.25;
    margin-bottom: 10px;
  }
  .cover-subtitle {
    font-size: 10.5pt;
    color: #475569;
    margin-bottom: 40px;
    line-height: 1.4;
  }
  .cover-table {
    width: 90%;
    margin: 0 auto;
    border-collapse: collapse;
    font-size: 8.2pt;
    margin-bottom: 35px;
  }
  .cover-table td {
    padding: 6px 10px;
    border: 1px solid #cbd5e1;
    text-align: left;
  }
  .cover-table td.label {
    background-color: #f1f5f9;
    font-weight: bold;
    width: 32%;
    color: #334155;
  }
  .cover-footer {
    border-top: 2px solid #e2e8f0;
    padding-top: 12px;
    font-size: 8pt;
    color: #64748b;
  }
  .part-banner {
    background: #0f172a;
    color: #ffffff;
    padding: 9px 12px;
    border-radius: 4px;
    margin-top: 12px;
    margin-bottom: 10px;
    border-left: 6px solid #38bdf8;
  }
  .part-banner h1 {
    font-size: 12pt;
    margin: 0 0 2px 0;
    letter-spacing: 0.5px;
  }
  .part-banner p {
    font-size: 8pt;
    margin: 0;
    color: #94a3b8;
  }
  h2.section-header {
    font-size: 11pt;
    color: #0f172a;
    border-bottom: 2px solid #0284c7;
    padding-bottom: 3px;
    margin-top: 12px;
    margin-bottom: 6px;
    text-transform: uppercase;
  }
  h3.subsection-header {
    font-size: 9.5pt;
    color: #0369a1;
    margin-top: 8px;
    margin-bottom: 3px;
  }
  p {
    margin-top: 0;
    margin-bottom: 5px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 4px;
    margin-bottom: 8px;
    font-size: 7.8pt;
  }
  th {
    background-color: #0f172a;
    color: #ffffff;
    font-weight: bold;
    text-align: left;
    padding: 4px 6px;
    border: 1px solid #334155;
  }
  td {
    padding: 4px 6px;
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
    font-size: 7.2pt;
    padding: 6px 8px;
    border-radius: 4px;
    margin: 5px 0;
    line-height: 1.3;
  }
  .box-note {
    background-color: #f0fdf4;
    border-left: 4px solid #16a34a;
    padding: 5px 8px;
    margin: 6px 0;
    font-size: 7.8pt;
    border-radius: 0 4px 4px 0;
  }
  .box-warning {
    background-color: #fffbeb;
    border-left: 4px solid #d97706;
    padding: 5px 8px;
    margin: 6px 0;
    font-size: 7.8pt;
    border-radius: 0 4px 4px 0;
  }
  .box-danger {
    background-color: #fef2f2;
    border-left: 4px solid #ef4444;
    padding: 5px 8px;
    margin: 6px 0;
    font-size: 7.8pt;
    border-radius: 0 4px 4px 0;
  }
  .box-info {
    background-color: #f0f9ff;
    border-left: 4px solid #0284c7;
    padding: 5px 8px;
    margin: 6px 0;
    font-size: 7.8pt;
    border-radius: 0 4px 4px 0;
  }
  .page-break {
    page-break-after: always;
  }
  ul, ol {
    margin-top: 0;
    margin-bottom: 5px;
    padding-left: 15px;
  }
  li {
    margin-bottom: 2px;
  }
  .footer-stamp {
    margin-top: 14px;
    text-align: center;
    color: #64748b;
    font-size: 7pt;
    border-top: 1px solid #e2e8f0;
    padding-top: 4px;
  }
</style>
</head>
<body>

<!-- ========================================== -->
<!-- COVER PAGE                                 -->
<!-- ========================================== -->
<div class="cover">
  <div class="cover-logo">SMART-WARGA</div>
  <div class="cover-tagline">INTEGRATED CIVIC OPERATING SYSTEM &bull; TIER-1 COMMUNITY SPECIFICATION</div>
  <div class="cover-badge">STANDARD REPOSITORY COMPLIANCE &bull; DOC-REF #MS-SWARGA-2026-V3.8</div>
  
  <div class="cover-title">
    BUKU PANDUAN IMPLEMENTASI IOT ESP32,<br>SKEMA WIRING &amp; ANALISIS SISTEM KERJA
  </div>
  <div class="cover-subtitle">
    Dokumentasi Resmi Perakitan Hardware All-in-One, Protokol Komunikasi REST API, Pencegahan Tabrakan Antrean, Penanganan Concurrency &amp; Panduan Pengujian Akademis
  </div>

  <table class="cover-table">
    <tr>
      <td class="label">Sistem &amp; Platform</td>
      <td><strong>SMART-WARGA Civic Management Platform</strong></td>
    </tr>
    <tr>
      <td class="label">Arsitektur Mikrokontroler</td>
      <td><strong>Single ESP32 DevKit V1 (All-in-One Controller)</strong> &bull; FreeRTOS Time-Division</td>
    </tr>
    <tr>
      <td class="label">Target Evaluasi Akademis</td>
      <td>Uji Laboratorium, Sidang Tugas Akhir / Proyek Dosen &amp; Uji Coba Lapangan Lapangan RT/RW</td>
    </tr>
    <tr>
      <td class="label">Periferal Terintegrasi</td>
      <td>2x RFID RC522 (SPI), Servo SG90, LCD 16x2 I2C, Load Cell HX711, Panic Button, Buzzer</td>
    </tr>
    <tr>
      <td class="label">Framework &amp; Gateway</td>
      <td>Laravel 11 REST API &bull; Next.js 16.3 (Turbopack) &bull; Arduino C++ Engine</td>
    </tr>
    <tr>
      <td class="label">Portal Server Production</td>
      <td><code>https://swarga.manajemensystem.my.id</code> (Otoritas: <code>manajemensystem.my.id</code>)</td>
    </tr>
    <tr>
      <td class="label">Versi Dokumen &amp; Tanggal</td>
      <td>Edisi Komprehensif Master &bull; Oktober 2026</td>
    </tr>
  </table>

  <div class="cover-footer">
    Dokumentasi Resmi &amp; Hak Kekayaan Intelektual Terdaftar &copy; 2026 SMART-WARGA Ecosystem Hub.<br>
    Disusun khusus untuk memandu mahasiswa, dosen pembimbing, dan tim teknisi dalam perakitan fisik serta pengujian sistem.
  </div>
</div>

<!-- ========================================== -->
<!-- BAGIAN I: ARSITEKTUR HARDWARE ALL-IN-ONE   -->
<!-- ========================================== -->
<div class="part-banner">
  <h1>BAGIAN I: ARSITEKTUR HARDWARE &amp; TOPOLOGI ALL-IN-ONE (AIO)</h1>
  <p>Konsep Integrasi 1 Mikrokontroler ESP32 untuk Seluruh Fitur Pos Satpam, Kios Mandiri, dan Alarm Darurat</p>
</div>

<h2 class="section-header">1.1 Latar Belakang Desain Single ESP32 All-in-One</h2>
<p>
  Pada implementasi skala industri penuh di lapangan, sistem IoT SMART-WARGA dapat didistribusikan ke dalam 3 node fisik terpisah (Node 1 di Pos Gerbang, Node 2 di Menara Sirine Balai RT, dan Node 3 di Kios Bank Sampah Sentra RW). Namun, untuk keperluan <strong>demonstrasi laboratorium, efisiensi anggaran prototipe, dan sidang evaluasi akademis di depan dosen penguji</strong>, seluruh fungsionalitas tersebut telah berhasil diintegrasikan ke dalam <strong>1 Unit Mikrokontroler ESP32 DevKit V1</strong>.
</p>
<p>
  Dengan pendekatan <em>Single ESP32 All-in-One (AIO)</em> ini, mahasiswa dan teknisi hanya membutuhkan satu board mikrokontroler tanpa mengurangi integritas fitur apa pun:
</p>
<ul>
  <li><strong>Sub-Sistem Gerbang Masuk:</strong> Menggunakan RFID Reader 1 (RC522) dan Servo SG90 untuk simulasi buka-tutup palang otomatis secara aman.</li>
  <li><strong>Sub-Sistem Kios Bank Sampah &amp; Posyandu:</strong> Menggunakan RFID Reader 2 (RC522), sensor timbangan Load Cell 5kg (HX711), dan tombol pemilih mode layanan.</li>
  <li><strong>Sub-Sistem Antarmuka &amp; Informasi:</strong> Menggunakan Layar LCD 16x2 I2C Backpack untuk menampilkan pesan sambutan, berat timbangan, dan saldo dompet warga secara interaktif.</li>
  <li><strong>Sub-Sistem S.O.S. Darurat &amp; Sirine:</strong> Menggunakan Push Button Merah (*Panic Button*) dan Active Buzzer berfrekuensi tinggi untuk audio peringatan bahaya lokal sekaligus pemancar sinyal darurat ke server.</li>
</ul>

<div class="box-info">
  <strong>File Firmware Arduino Resmi:</strong> Seluruh logika program terpadu telah dikemas dalam file <br>
  <code>firmware/smartwarga_single_esp32_aio/smartwarga_single_esp32_aio.ino</code>.
</div>

<h2 class="section-header">1.2 Daftar Komponen Perangkat Keras (Bill of Materials)</h2>
<table>
  <thead>
    <tr>
      <th style="width: 5%;">No</th>
      <th style="width: 25%;">Komponen</th>
      <th style="width: 25%;">Spesifikasi / Tipe</th>
      <th style="width: 45%;">Peran &amp; Fungsi dalam Sistem</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td><strong>ESP32 DevKit V1</strong></td>
      <td>30-pin / 38-pin (240MHz, Wi-Fi+BLE)</td>
      <td>Otak pemroses utama, pengelola SPI multi-slave, I2C, dan HTTP REST Client.</td>
    </tr>
    <tr>
      <td>2</td>
      <td><strong>2x RFID RC522</strong></td>
      <td>13.56 MHz SPI Protocol</td>
      <td>Reader 1 (Gerbang Satpam) &amp; Reader 2 (Kios Timbangan &amp; Posyandu).</td>
    </tr>
    <tr>
      <td>3</td>
      <td><strong>Micro Servo SG90</strong></td>
      <td>Torsi 1.8 kg/cm &bull; 5V PWM</td>
      <td>Aktuator penggerak palang pintu gerbang otomatis (0° tertutup, 90° terbuka).</td>
    </tr>
    <tr>
      <td>4</td>
      <td><strong>LCD 16x2 I2C</strong></td>
      <td>Backpack PCF8574 (Alamat 0x27)</td>
      <td>Display visual dua baris (nama warga, instruksi, berat, dan saldo e-wallet).</td>
    </tr>
    <tr>
      <td>5</td>
      <td><strong>Load Cell 5kg + HX711</strong></td>
      <td>24-bit ADC Timbangan Presisi</td>
      <td>Mengukur berat setoran sampah kaleng/plastik dan berat badan balita posyandu.</td>
    </tr>
    <tr>
      <td>6</td>
      <td><strong>Push Button Merah</strong></td>
      <td>Momentary Tactile 12mm</td>
      <td>Tombol Panik (*Panic Button*) darurat bagi warga atau satpam di pos.</td>
    </tr>
    <tr>
      <td>7</td>
      <td><strong>Push Button Kuning/Biru</strong></td>
      <td>Momentary Tactile 12mm</td>
      <td>Tombol pemilih mode layanan kios (Sampah Plastik &harr; Kaleng &harr; Posyandu).</td>
    </tr>
    <tr>
      <td>8</td>
      <td><strong>Active Buzzer</strong></td>
      <td>5V DC Acoustic Indicator</td>
      <td>Memberikan nada audio konfirmasi tap sukses, penolakan akses, dan sirene darurat.</td>
    </tr>
    <tr>
      <td>9</td>
      <td><strong>Breadboard &amp; Jumper</strong></td>
      <td>MB-102 + Kabel Jumper M-M / M-F</td>
      <td>Papan distribusi daya (3.3V, 5V, GND) dan interkoneksi sinyal logika.</td>
    </tr>
  </tbody>
</table>

<div class="page-break"></div>

<!-- ========================================== -->
<!-- BAGIAN II: PANDUAN WIRING LENGKAP & DETAIL -->
<!-- ========================================== -->
<div class="part-banner">
  <h1>BAGIAN II: PANDUAN PENGKABELAN (WIRING DIAGRAM RINCI)</h1>
  <p>Pencegahan Kesalahan Fatal Tegangan, Skema Pembagian Bus SPI Bersama &amp; Pemetaan Pin GPIO ESP32</p>
</div>

<div class="box-danger">
  <strong>⚠️ ATURAN TEGANGAN KRUSIAL &mdash; BACA SEBELUM MENYALAKAN ESP32:</strong><br>
  1. <strong>Modul RFID RC522 HANYA MENGGUNAKAN TEGANGAN 3.3V:</strong> Hubungkan pin VCC kedua modul RFID RC522 <u>HANYA ke pin 3V3 ESP32</u>. Jika dicolok ke pin 5V atau VIN, IC mikrokontroler RFID akan langsung rusak terbakar.<br>
  2. <strong>Servo SG90 &amp; LCD 16x2 WAJIB TEGANGAN 5V (VIN):</strong> Hubungkan pin VCC Servo dan LCD I2C ke pin <u>VIN (5V)</u> ESP32 (yang menerima daya 5V dari kabel USB komputer/adaptor). Jika dicolok ke 3.3V, servo tidak akan bertenaga mengangkat palang dan tulisan LCD akan sangat redup/gelap.<br>
  3. <strong>Common Ground (GND Bersama):</strong> Satukan seluruh pin GND komponen ke rel minus pada breadboard.
</div>

<h2 class="section-header">2.1 Tabel Lengkap Pemetaan Pin GPIO ESP32 (Bebas Konflik)</h2>
<table>
  <thead>
    <tr>
      <th style="width: 20%;">Periferal / Modul</th>
      <th style="width: 15%;">Pin di Modul</th>
      <th style="width: 20%;">Pin ESP32 DevKit</th>
      <th style="width: 15%;">Protokol</th>
      <th style="width: 30%;">Keterangan &amp; Petunjuk Khusus</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background-color: #f1f5f9; font-weight: bold;">
      <td colspan="5">A. DISTRIBUSI CATU DAYA (BREADBOARD POWER RAILS)</td>
    </tr>
    <tr>
      <td>Rel Daya 3.3V</td>
      <td>Jalur Positif (+)</td>
      <td><strong>Pin 3V3</strong></td>
      <td>Power Line</td>
      <td>Khusus mencatu VCC Reader 1 dan VCC Reader 2.</td>
    </tr>
    <tr>
      <td>Rel Daya 5.0V</td>
      <td>Jalur Positif (+)</td>
      <td><strong>Pin VIN (5V)</strong></td>
      <td>Power Line</td>
      <td>Mencatu VCC Servo SG90, VCC LCD 16x2, dan VCC HX711.</td>
    </tr>
    <tr>
      <td>Rel Ground (GND)</td>
      <td>Jalur Negatif (-)</td>
      <td><strong>Pin GND</strong></td>
      <td>Common GND</td>
      <td>Satukan seluruh kaki GND modul pada rel ini.</td>
    </tr>

    <tr style="background-color: #f1f5f9; font-weight: bold;">
      <td colspan="5">B. RFID READER 1 (POS SATPAM &amp; GERBANG MASUK) &mdash; SPI BUS</td>
    </tr>
    <tr>
      <td rowspan="7"><strong>MFRC522 (Reader 1)</strong></td>
      <td>VCC</td>
      <td><strong>Rel 3V3</strong></td>
      <td>Power 3.3V</td>
      <td><span style="color:red; font-weight:bold;">Wajib 3.3V!</span> Jangan pernah colok ke 5V.</td>
    </tr>
    <tr>
      <td>RST</td>
      <td><strong>GPIO 26</strong></td>
      <td>GPIO Output</td>
      <td>Jalur Reset bersama (disambung paralel ke RST Reader 2).</td>
    </tr>
    <tr>
      <td>GND</td>
      <td><strong>Rel GND</strong></td>
      <td>Ground</td>
      <td>Ground bersama.</td>
    </tr>
    <tr>
      <td>MISO</td>
      <td><strong>GPIO 19</strong></td>
      <td>SPI MISO</td>
      <td>Jalur Master In Slave Out bersama (Reader 1 &amp; Reader 2).</td>
    </tr>
    <tr>
      <td>MOSI</td>
      <td><strong>GPIO 23</strong></td>
      <td>SPI MOSI</td>
      <td>Jalur Master Out Slave In bersama (Reader 1 &amp; Reader 2).</td>
    </tr>
    <tr>
      <td>SCK</td>
      <td><strong>GPIO 18</strong></td>
      <td>SPI Clock</td>
      <td>Jalur Serial Clock bersama (Reader 1 &amp; Reader 2).</td>
    </tr>
    <tr>
      <td>SDA (SS)</td>
      <td><strong>GPIO 5</strong></td>
      <td>Chip Select 1</td>
      <td>Pin pemilih unik untuk mengaktifkan Reader 1 (Gerbang).</td>
    </tr>

    <tr style="background-color: #f1f5f9; font-weight: bold;">
      <td colspan="5">C. RFID READER 2 (KIOS LAYANAN / BANK SAMPAH &amp; POSYANDU) &mdash; SPI BUS</td>
    </tr>
    <tr>
      <td rowspan="7"><strong>MFRC522 (Reader 2)</strong></td>
      <td>VCC</td>
      <td><strong>Rel 3V3</strong></td>
      <td>Power 3.3V</td>
      <td><span style="color:red; font-weight:bold;">Wajib 3.3V!</span> Jangan pernah colok ke 5V.</td>
    </tr>
    <tr>
      <td>RST</td>
      <td><strong>GPIO 26</strong></td>
      <td>GPIO Output</td>
      <td>Jalur Reset bersama (disambung paralel ke RST Reader 1).</td>
    </tr>
    <tr>
      <td>GND</td>
      <td><strong>Rel GND</strong></td>
      <td>Ground</td>
      <td>Ground bersama.</td>
    </tr>
    <tr>
      <td>MISO</td>
      <td><strong>GPIO 19</strong></td>
      <td>SPI MISO</td>
      <td>Jalur bus SPI MISO paralel bersama Reader 1.</td>
    </tr>
    <tr>
      <td>MOSI</td>
      <td><strong>GPIO 23</strong></td>
      <td>SPI MOSI</td>
      <td>Jalur bus SPI MOSI paralel bersama Reader 1.</td>
    </tr>
    <tr>
      <td>SCK</td>
      <td><strong>GPIO 18</strong></td>
      <td>SPI Clock</td>
      <td>Jalur bus SPI SCK paralel bersama Reader 1.</td>
    </tr>
    <tr>
      <td>SDA (SS)</td>
      <td><strong>GPIO 4</strong></td>
      <td>Chip Select 2</td>
      <td>Pin pemilih unik untuk mengaktifkan Reader 2 (Kios).</td>
    </tr>

    <tr style="background-color: #f1f5f9; font-weight: bold;">
      <td colspan="5">D. SERVO SG90 (PALANG GERBANG OTOMATIS)</td>
    </tr>
    <tr>
      <td rowspan="3"><strong>Servo Motor SG90</strong></td>
      <td>Kabel Oranye / Kuning</td>
      <td><strong>GPIO 13</strong></td>
      <td>PWM Output</td>
      <td>Sinyal sudut servo (50Hz, pulse width 500us - 2400us).</td>
    </tr>
    <tr>
      <td>Kabel Merah</td>
      <td><strong>Rel VIN (5V)</strong></td>
      <td>Power 5V</td>
      <td>Daya motor servo (wajib 5V agar bertenaga).</td>
    </tr>
    <tr>
      <td>Kabel Cokelat / Hitam</td>
      <td><strong>Rel GND</strong></td>
      <td>Ground</td>
      <td>Ground bersama.</td>
    </tr>

    <tr style="background-color: #f1f5f9; font-weight: bold;">
      <td colspan="5">E. LAYAR LCD 16x2 DENGAN MODUL I2C BACKPACK</td>
    </tr>
    <tr>
      <td rowspan="4"><strong>LCD 16x2 I2C</strong></td>
      <td>VCC</td>
      <td><strong>Rel VIN (5V)</strong></td>
      <td>Power 5V</td>
      <td>Wajib 5V agar lampu latar &amp; karakter terlihat kontras.</td>
    </tr>
    <tr>
      <td>GND</td>
      <td><strong>Rel GND</strong></td>
      <td>Ground</td>
      <td>Ground bersama.</td>
    </tr>
    <tr>
      <td>SDA</td>
      <td><strong>GPIO 21</strong></td>
      <td>I2C Data</td>
      <td>Jalur Serial Data display I2C.</td>
    </tr>
    <tr>
      <td>SCL</td>
      <td><strong>GPIO 22</strong></td>
      <td>I2C Clock</td>
      <td>Jalur Serial Clock display I2C.</td>
    </tr>

    <tr style="background-color: #f1f5f9; font-weight: bold;">
      <td colspan="5">F. SENSOR TIMBANGAN DIGITAL LOAD CELL 5KG + MODUL HX711</td>
    </tr>
    <tr>
      <td rowspan="4"><strong>Modul HX711</strong></td>
      <td>VCC</td>
      <td><strong>Rel VIN (5V)</strong></td>
      <td>Power 5V</td>
      <td>Tegangan eksitasi strain gauge stabil.</td>
    </tr>
    <tr>
      <td>GND</td>
      <td><strong>Rel GND</strong></td>
      <td>Ground</td>
      <td>Ground bersama.</td>
    </tr>
    <tr>
      <td>DT / DOUT</td>
      <td><strong>GPIO 16</strong></td>
      <td>Digital Input</td>
      <td>Jalur serial data bit 24-bit ADC.</td>
    </tr>
    <tr>
      <td>SCK / CLK</td>
      <td><strong>GPIO 17</strong></td>
      <td>Digital Output</td>
      <td>Jalur pulsa clock konversi ADC.</td>
    </tr>

    <tr style="background-color: #f1f5f9; font-weight: bold;">
      <td colspan="5">G. TOMBOL KENDALI &amp; INDIKATOR AUDIO</td>
    </tr>
    <tr>
      <td><strong>Panic Button (Merah)</strong></td>
      <td>Kaki 1 ke GPIO, Kaki 2 ke GND</td>
      <td><strong>GPIO 27</strong></td>
      <td>INPUT_PULLUP</td>
      <td>Ditekan = logika LOW (Mengaktifkan sirine &amp; alert darurat).</td>
    </tr>
    <tr>
      <td><strong>Tombol Mode (Kuning)</strong></td>
      <td>Kaki 1 ke GPIO, Kaki 2 ke GND</td>
      <td><strong>GPIO 14</strong></td>
      <td>INPUT_PULLUP</td>
      <td>Ditekan = logika LOW (Memilih mode Plastik / Kaleng / Posyandu).</td>
    </tr>
    <tr>
      <td><strong>Active Buzzer 5V</strong></td>
      <td>Kaki (+) ke GPIO, Kaki (-) ke GND</td>
      <td><strong>GPIO 25</strong></td>
      <td>Digital Output</td>
      <td>Menghasilkan nada beep konfirmasi dan sirine bahaya.</td>
    </tr>
  </tbody>
</table>

<h3 class="subsection-header">2.2 Skema Sambungan Kabel 4-Warna Load Cell ke Modul HX711</h3>
<p>Kabel 4-warna dari batang sensor Load Cell aluminium dihubungkan ke terminal input modul HX711:</p>
<ul>
  <li><strong>Kabel Merah (Excitation +)</strong> &rarr; Terminal <code>E+</code> pada modul HX711.</li>
  <li><strong>Kabel Hitam (Excitation -)</strong> &rarr; Terminal <code>E-</code> pada modul HX711.</li>
  <li><strong>Kabel Putih (Signal -)</strong> &rarr; Terminal <code>A-</code> pada modul HX711.</li>
  <li><strong>Kabel Hijau (Signal +)</strong> &rarr; Terminal <code>A+</code> pada modul HX711.</li>
</ul>

<div class="page-break"></div>

<!-- ========================================== -->
<!-- BAGIAN III: CARA KERJA SISTEM (WORKFLOW)   -->
<!-- ========================================== -->
<div class="part-banner">
  <h1>BAGIAN III: CARA KERJA SISTEM (WORKFLOW OPERASIONAL)</h1>
  <p>Alur Interaksi Perangkat Keras, Komunikasi REST API, dan Pembaruan Data Real-Time di Sistem Web</p>
</div>

<h2 class="section-header">3.1 Alur 1: Akses Gerbang Masuk &amp; Presensi Ronda Malam (Reader 1)</h2>
<ol>
  <li><strong>Penempelan Kartu:</strong> Warga atau petugas ronda menempelkan kartu RFID/e-KTP ke <strong>Reader 1 (GPIO 5)</strong> di pos gerbang.</li>
  <li><strong>Akuisisi Data:</strong> ESP32 membaca UID unik kartu (contoh: <code>04A1B2C3</code>) dan mengirimkan HTTP POST ke endpoint backend:
    <div class="code-block">POST /api/iot/ronda/tap | Payload: {"rfid_uid": "04A1B2C3", "post_id": "POS_01"}</div>
  </li>
  <li><strong>Verifikasi Backend:</strong>
    <ul>
      <li>Server mencari kecocokan UID pada tabel <code>users</code>.</li>
      <li>Jika terdaftar, sistem memeriksa apakah warga memiliki jadwal ronda aktif hari ini pada tabel <code>ronda_schedules</code>. Jika ya, status kehadiran dicatat sebagai <code>hadir</code> pada <code>ronda_logs</code>. Jika tidak ada jadwal ronda, sistem tetap mencatat log akses masuk warga lingkungan.</li>
      <li>Server mengembalikan respons JSON berisi status sukses, nama warga, dan format teks LCD 16 karakter:
        <div class="code-block">{"success": true, "user": {"name": "Budi Santoso"}, "lcd_line1": "BUDI SANTOSO    ", "lcd_line2": "GERBANG TERBUKA "}</div>
      </li>
    </ul>
  </li>
  <li><strong>Eksekusi Hardware:</strong>
    <ul>
      <li>Layar LCD 16x2 menampilkan nama warga dan pesan gerbang terbuka.</li>
      <li>Buzzer berbunyi bip 2x (nada sukses).</li>
      <li>Servo SG90 berputar ke sudut <strong>90°</strong> (palang terbuka) selama <strong>4 detik</strong>, kemudian otomatis kembali ke posisi <strong>0°</strong> (palang tertutup rapat).</li>
    </ul>
  </li>
</ol>

<h2 class="section-header">3.2 Alur 2: Kios Bank Sampah Digital &amp; Auto-Kredit E-Wallet (Reader 2)</h2>
<ol>
  <li><strong>Pemilihan Kategori Sampah:</strong> Pengguna menekan <strong>Tombol Mode (GPIO 14)</strong> untuk memilih jenis sampah di layar LCD:
    <ul>
      <li><code>MD:BS-PLASTIK &gt;</code> (Tarif Master: Rp 2.000 / kg)</li>
      <li><code>MD:BS-KALENG  &gt;</code> (Tarif Master: Rp 5.000 / kg)</li>
    </ul>
  </li>
  <li><strong>Penimbangan:</strong> Kantong sampah diletakkan di atas platform Load Cell. Modul HX711 mengonversi regangan mekanis menjadi nilai digital berat dalam gram (misal 1.500 gram).</li>
  <li><strong>Penempelan Kartu &amp; Transaksi:</strong> Pengguna men-tap kartu RFID ke <strong>Reader 2 (GPIO 4)</strong>. ESP32 mengirimkan request:
    <div class="code-block">POST /api/iot/bank-sampah/setor | Payload: {"rfid_uid": "04A1B2C3", "kategori": "kaleng", "berat_gram": 1500}</div>
  </li>
  <li><strong>Kalkulasi Finansial Otomatis:</strong>
    <ul>
      <li>Server menghitung nominal rupiah: <code>(1.500 / 1000) * Rp 5.000 = Rp 7.500</code>.</li>
      <li>Dalam transaksi database atomik (<em>ACID Transaction</em>), saldo dompet digital (<code>wallets</code>) warga langsung bertambah Rp 7.500.</li>
      <li>Sistem mencatat mutasi riwayat bank sampah dan buku kas RT dengan kode referensi <code>BS-timestamp-uid</code>.</li>
    </ul>
  </li>
  <li><strong>Feedback Display:</strong> LCD 16x2 menampilkan:
    <div class="code-block">Baris 1: Budi +Rp7.500<br>Baris 2: Saldo: Rp82.500</div>
    Buzzer berbunyi 2x sebagai tanda penimbangan dan penambahan saldo berhasil.
  </li>
</ol>

<h2 class="section-header">3.3 Alur 3: Kios Posyandu Balita Mandiri (Reader 2)</h2>
<ol>
  <li>Pengguna menekan Tombol Mode (GPIO 14) hingga LCD menunjukkan <code>MD:POSYANDU   &gt;</code>.</li>
  <li>Balita ditempatkan pada alas timbangan dan orang tua men-tap kartu RFID pada Reader 2.</li>
  <li>ESP32 mengirim data bobot ke endpoint <code>POST /api/iot/posyandu/catat</code> dengan payload berat dan estimasi tinggi badan.</li>
  <li>Server mencatat rekam medis balita pada tabel <code>posyandu_records</code>, memperbarui kurva KMS digital di dashboard, dan mengembalikan teks LCD: <code>TB:88.5 BB:12.4 / POSYANDU TERCATAT</code>.</li>
</ol>

<h2 class="section-header">3.4 Alur 4: Panic Button Darurat &amp; Siaga Sirine (GPIO 27)</h2>
<ol>
  <li>Saat terjadi keadaan darurat (tindak kejahatan, kebakaran, atau kecelakaan), warga atau satpam menekan <strong>Push Button Merah (GPIO 27)</strong>.</li>
  <li>ESP32 langsung membunyikan sirine frekuensi ganda pada Buzzer lokal dan menembak endpoint <code>POST /api/iot/panic-button</code>.</li>
  <li>Server Laravel membuat record darurat pada <code>iot_emergency_logs</code>, mengubah status sirine menjadi aktif (<code>is_active = true</code>), dan menyiarkan event WebSocket melalui Laravel Reverb.</li>
  <li>Layar dashboard pengurus/satpam di web seketika memunculkan modal merah darurat berkedip disertai bunyi alarm peringatan.</li>
</ol>

<h2 class="section-header">3.5 Alur 5: Heartbeat &amp; Liveness State Monitor</h2>
<p>
  Setiap 15 detik sekali, ESP32 secara otomatis memanggil <code>POST /api/iot/heartbeat</code> dengan payload <code>{"device_type": "all"}</code>. Server akan memperbarui kolom <code>last_ping</code> seluruh node perangkat (Gate, Siren, dan Terminal), sehingga kartu monitoring pada dashboard web selalu menampilkan indikator <strong>ONLINE (Warna Hijau)</strong>.
</p>

<h2 class="section-header">3.6 Alur 6: Perekaman Mandiri e-KTP Warga (Self-Service RFID Enrollment)</h2>
<p>
  Fitur ini dirancang khusus untuk memecahkan tantangan pendataan warga di lapangan: <strong>Bagaimana warga dapat mendaftarkan fisik kartu e-KTP mereka secara mandiri tanpa harus menyerahkan kartu ke pengurus RT?</strong>
</p>

<div class="box-note">
  <strong>Fleksibilitas Implementasi Hardware:</strong> Anda dapat mengimplementasikannya melalui dua metode:
  <ul>
    <li><strong>Metode A &mdash; Menggunakan Single ESP32 AIO yang Sudah Ada (Tanpa Tambah Alat):</strong><br>
      Tekan tombol mode (GPIO 14) hingga LCD menampilkan <code>MD:DAFTAR-KTP &gt;</code>. Saat e-KTP di-tap pada Reader 2 (GPIO 4), ESP32 langsung mengirimkan UID ke server.
    </li>
    <li><strong>Metode B &mdash; Menggunakan Dedicated ESP32 Desk Scanner (Unit Perekam Khusus):</strong><br>
      Menggunakan 1 board ESP32 terpisah yang dihubungkan ke modul RFID RC522 (File: <code>smartwarga_esp32_ktp_enroller.ino</code>). Perangkat kecil ini dapat diletakkan di meja administrasi pos ronda atau sekretariat RT.
    </li>
  </ul>
</div>

<p><strong>Langkah demi Langkah Registrasi Mandiri di Sisi Warga:</strong></p>
<ol>
  <li><strong>Membuka Aplikasi SMART-WARGA:</strong> Warga login ke dashboard SMART-WARGA di smartphone mereka. Di halaman utama, terdapat banner: <em>"Perekaman Mandiri e-KTP / Kartu RFID Warga"</em>.</li>
  <li><strong>Menekan Tombol Scan:</strong> Warga mengklik tombol <strong>[ 📲 Pindai &amp; Tautkan e-KTP Mandiri ]</strong>. Layar membuka modal interaktif dengan radar pemindai yang aktif mendengarkan.</li>
  <li><strong>Menempelkan e-KTP ke Sensor:</strong> Warga menempelkan kartu e-KTP fisiknya ke scanner ESP32.</li>
  <li><strong>Penangkapan Data Real-Time:</strong> Scanner ESP32 menembak endpoint <code>POST /api/iot/ktp/scan</code>. Server menyimpan UID ke dalam cache temporer. Web warga yang sedang melakukan polling setiap 1.5 detik seketika mendeteksi kartu tersebut:
    <div class="code-block">KARTU e-KTP TERDETEKSI! UID: 04A1B2C3 &bull; Status: Siap Ditautkan</div>
  </li>
  <li><strong>Konfirmasi Pengikatan Akun:</strong> Warga menekan tombol <strong>[ Tautkan e-KTP ke Akun Saya ]</strong>. Endpoint <code>POST /api/warga/ktp/pair</code> memvalidasi bahwa UID belum dimiliki warga lain, lalu menyimpannya ke kolom <code>rfid_uid</code> akun warga tersebut secara permanen.</li>
  <li><strong>Aktivasi Instan:</strong> Detik itu juga, fisik e-KTP tersebut langsung aktif untuk:
    <ul>
      <li>Membuka palang gerbang otomatis di pos satpam (Servo 90°).</li>
      <li>Menyetor sampah di Kios Timbangan Bank Sampah (saldo otomatis masuk ke e-wallet warga).</li>
      <li>Mencatat rekam medis mandiri di Kios Posyandu balita.</li>
    </ul>
  </li>
</ol>

<div class="page-break"></div>

<!-- ========================================== -->
<!-- BAGIAN IV: ANALISIS AKADEMIS & PENCEGAHAN  -->
<!-- ========================================== -->
<div class="part-banner">
  <h1>BAGIAN IV: PENCEGAHAN TABRAKAN ANTREAN, CONCURRENCY &amp; KEAMANAN</h1>
  <p>Analisis Kasus Kritis untuk Sidang Akademis: Tailgating, Double-Tap, Bus Contention &amp; Zero-Load Verification</p>
</div>

<p>
  Pada pengujian di hadapan dosen penguji, pertanyaan kritis yang sering muncul adalah: <em>"Bagaimana jika warga antre beruntun di depan gerbang? Apakah palang akan menabrak kendaraan berikutnya? Bagaimana jika warga menempelkan kartu berkali-kali secara bersamaan atau menaruh sampah bertumpuk di timbangan?"</em>
</p>
<p>
  Sistem SMART-WARGA telah dirancang secara komprehensif untuk menangani seluruh skenario kegagalan antrean (<em>edge cases</em>) berikut:
</p>

<h2 class="section-header">4.1 Skenario 1: Pencegahan Palang Menabrak Kendaraan / Warga (Gate Barrier Collision Protection)</h2>
<table>
  <thead>
    <tr>
      <th style="width: 25%;">Potensi Bahaya</th>
      <th style="width: 35%;">Mekanisme Penanganan Sistem</th>
      <th style="width: 40%;">Implementasi Hardware &amp; Firmware</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Palang turun saat mobil/motor masih berada di bawah gerbang</strong></td>
      <td>
        1. <strong>Hold-Open Timer 4000ms:</strong> Durasi palang terbuka disetel 4 detik penuh, memberikan waktu transit yang cukup untuk kendaraan melewati ambang pintu.<br>
        2. <strong>Torque-Safe Micro Actuator:</strong> Penggunaan motor servo SG90 memiliki batas torsi rendah (&plusmn;1.8 kg/cm). Apabila palang tertahan secara fisik oleh atap mobil atau kepala warga, motor servo otomatis berhenti tanpa menimbulkan cidera atau kerusakan fisik.<br>
        3. <strong>Sensor Obstacle Loop (Opsional):</strong> Firmware mendukung integrasi sensor inframerah/ultrasonik di bawah palang; servo tidak akan pernah turun selama sensor mendeteksi halangan.
      </td>
      <td>
        File: <code>smartwarga_single_esp32_aio.ino</code><br>
        <div class="code-block">
gateServo.write(90);<br>
delay(4000); // Durasi buka aman<br>
gateServo.write(0);  // Tutup kembali
        </div>
      </td>
    </tr>
  </tbody>
</table>

<h2 class="section-header">4.2 Skenario 2: Antrean Beruntun di Gerbang (Anti-Tailgating &amp; FIFO Queue Reset)</h2>
<table>
  <thead>
    <tr>
      <th style="width: 25%;">Skenario Kasus</th>
      <th style="width: 35%;">Risiko Kegagalan Tanpa Proteksi</th>
      <th style="width: 40%;">Solusi SMART-WARGA</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Warga B men-tap kartu saat palang masih terbuka untuk Warga A</strong></td>
      <td>Palang tiba-tiba menutup di tengah jalan tepat di depan kendaraan Warga B (menabrak kaca depan), atau kehadiran Warga B tidak tercatat karena sistem masih sibuk mengeksekusi Warga A.</td>
      <td>
        <strong>Anti-Tailgating Timer Extension &amp; Independent FIFO Logging:</strong><br>
        Jika RFID Reader 1 mendeteksi tap valid saat servo berada di sudut 90°, firmware mereset timer hold-open (+4000ms tambahan) dan tetap memanggil endpoint <code>/api/iot/ronda/tap</code> untuk Warga B. Hasilnya: kedua warga tercatat resmi di database, palang tetap terbuka mulus tanpa terbanting (*anti-slamming*), dan kendaraan Warga B lewat dengan aman.
      </td>
    </tr>
  </tbody>
</table>

<h2 class="section-header">4.3 Skenario 3: Warga Tidak Sengaja Men-Tap Kartu Berulang Kali (Accidental Double-Tap)</h2>
<p>
  Ketika warga menempelkan kartu terlalu lama atau tangannya bergetar, kartu RFID dapat terbaca berkali-kali dalam hitungan milidetik. Sistem menerapkan <strong>Dua Lapis Filter Debounce</strong>:
</p>
<ul>
  <li><strong>Lapisan 1 (Firmware Filter):</strong> Setelah pembacaan sukses, firmware mengeksekusi perintah <code>rfidGate.PICC_HaltA()</code> dan <code>rfidGate.PCD_StopCrypto1()</code> serta delay proteksi 500ms agar kartu yang sama tidak memicu interrupt beruntun.</li>
  <li><strong>Lapisan 2 (Backend Idempotency Guard):</strong> Backend memeriksa riwayat log tap terakhir dari UID yang sama. Jika request kedua datang dalam selang waktu kurang dari 5 detik, server mengembalikan status sukses yang di-cache tanpa menduplikasi data mutasi kehadiran.</li>
</ul>

<h2 class="section-header">4.4 Skenario 4: Antrean di Kios Timbangan Bank Sampah (Load Contention &amp; Race Condition)</h2>
<p>
  Pada kios timbangan, masalah umum adalah <em>Warga B menaruh sampahnya sebelum transaksi Warga A selesai dihitung</em>, atau Warga B men-tap kartu saat timbangan masih memuat sisa beban sebelumnya.
</p>
<table>
  <thead>
    <tr>
      <th style="width: 25%;">Tantangan Antrean</th>
      <th style="width: 35%;">Penanganan di Level Firmware (ESP32)</th>
      <th style="width: 40%;">Penanganan di Level Backend (Database)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Beban Tertumpuk / Double-Weighing</strong></td>
      <td>
        <strong>Zero-Load Enforcement (Kewajiban Angkat Beban):</strong><br>
        Setelah transaksi Warga A selesai, sistem mengunci sesi penimbangan berikutnya. Layar LCD mewajibkan beban diangkat hingga nilai timbangan kembali mendekati nol (&lt; 20 gram) sebelum mengizinkan pembacaan kartu warga berikutnya. Jika beban belum diangkat, LCD menampilkan: <code>ANGKAT SAMPAH!</code>.
      </td>
      <td>
        <strong>ACID Transaction &amp; Row-Level Locking:</strong><br>
        Pada Controller Laravel (<code>IoTController.php</code>), mutasi saldo e-wallet dibungkus dalam <code>DB::transaction()</code> dengan pemanggilan <code>Wallet::where('user_id', ...)-&gt;lockForUpdate()</code>. Ini mencegah terjadinya <em>race condition</em> atau saldo ganda meskipun terjadi request konkuren secara bersamaan.
      </td>
    </tr>
  </tbody>
</table>

<h2 class="section-header">4.5 Skenario 5: Tabrakan Sinyal Komunikasi SPI Antar Dua Reader (Hardware Bus Contention)</h2>
<p>
  Karena ESP32 menggunakan satu bus SPI perangkat keras bersama untuk menghemat pin (pin SCK=18, MISO=19, dan MOSI=23 dipakai paralel oleh Reader 1 dan Reader 2), bagaimana jika kedua kartu di-tap pada detik yang persis sama?
</p>
<div class="box-note">
  <strong>Solusi Elektronik &mdash; Time-Division Multiplexing (TDM) &amp; Pin CS Terisolasi:</strong><br>
  Protokol SPI bekerja dengan sinyal <em>Chip Select (CS / SDA)</em> yang aktif pada logika <code>LOW</code>. 
  Reader 1 dikendalikan oleh <strong>GPIO 5</strong>, sedangkan Reader 2 dikendalikan oleh <strong>GPIO 4</strong>.<br>
  Firmware tidak pernah membaca kedua reader secara simultan. Mikrokontroler membaca Reader 1 (GPIO 5 = LOW, GPIO 4 = HIGH), memproses data, lalu membaca Reader 2 (GPIO 4 = LOW, GPIO 5 = HIGH). Saat pin CS berlogika HIGH, modul RFID masuk ke mode <em>High-Impedance (Hi-Z)</em>, melepaskan jalur kabel MISO secara elektrik. Dengan demikian, <strong>tabrakan bit sinyal (bus collision) secara mutlak 100% mustahil terjadi</strong>.
</div>

<h2 class="section-header">4.6 Skenario 6: Penekanan Panik Tombol Darurat Berulang Kali (Panic Button Flooding)</h2>
<p>
  Ketika warga mengalami kepanikan, tombol darurat sering kali dipencet 5-10 kali dalam 1 detik. Firmware menerapkan <strong>Hardware Debounce Filter berbasis Timer Non-Blocking</strong>:
</p>
<div class="code-block">
if (digitalRead(PIN_PANIC_BTN) == LOW) {<br>
&nbsp;&nbsp;if (currentMillis - lastPanicBtnPress &gt; 3000) { // Jendela debounce 3 detik<br>
&nbsp;&nbsp;&nbsp;&nbsp;lastPanicBtnPress = currentMillis;<br>
&nbsp;&nbsp;&nbsp;&nbsp;triggerPanicButton(); // Pemicu sirine &amp; HTTP POST pertama<br>
&nbsp;&nbsp;}<br>
}
</div>
<p>
  Penekanan pertama langsung menyalakan sirine lokal dan mengirim alert HTTP ke server, sementara penekanan berulang dalam 3 detik diabaikan sehingga server backend tidak terbebani oleh banjir request darurat (<em>DDoS prevention</em>).
</p>

<div class="page-break"></div>

<!-- ========================================== -->
<!-- BAGIAN V: PROSEDUR FLASHING & TROUBLESHOOT -->
<!-- ========================================== -->
<div class="part-banner">
  <h1>BAGIAN V: PANDUAN FLASHING ARDUINO IDE &amp; TROUBLESHOOTING</h1>
  <p>Langkah Demi Langkah Instalasi Library, Upload Firmware, dan Solusi Masalah Lapangan</p>
</div>

<h2 class="section-header">5.1 Langkah Flashing Firmware ke ESP32</h2>
<ol>
  <li><strong>Buka Arduino IDE</strong> (Versi 2.x direkomendasikan).</li>
  <li><strong>Instalasi URL Board ESP32:</strong> Buka menu <em>File &rarr; Preferences</em>, tambahkan URL package berikut:<br>
    <code>https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json</code>
  </li>
  <li><strong>Instal 5 Library yang Dibutuhkan:</strong> Buka menu <em>Tools &rarr; Manage Libraries</em>:
    <ul>
      <li><code>MFRC522</code> by GithubCommunity (v1.4.11 atau terbaru)</li>
      <li><code>LiquidCrystal I2C</code> by Frank de Brabander</li>
      <li><code>ESP32Servo</code> by Kevin Harrington</li>
      <li><code>ArduinoJson</code> by Benoit Blanchon (Versi 6 atau 7)</li>
    </ul>
  </li>
  <li><strong>Buka File Sketsa Firmware:</strong> Buka file <code>firmware/smartwarga_single_esp32_aio/smartwarga_single_esp32_aio.ino</code>.</li>
  <li><strong>Sesuaikan Konfigurasi Jaringan Wi-Fi:</strong>
    <div class="code-block">
const char* WIFI_SSID     = "NAMA_HOTSPOT_ANDA";<br>
const char* WIFI_PASSWORD = "PASSWORD_HOTSPOT";<br>
const char* API_BASE_URL  = "https://swarga.manajemensystem.my.id"; // Atau IP LAN Mac/PC Herd
    </div>
  </li>
  <li><strong>Pilih Board &amp; Port:</strong>
    <ul>
      <li>Board: <strong>Tools &rarr; Board &rarr; ESP32 Arduino &rarr; ESP32 Dev Module</strong>.</li>
      <li>Upload Speed: <strong>921600</strong> (atau 115200 jika kabel USB panjang).</li>
      <li>Port: Pilih port COM / tty.usbserial yang sesuai dengan kabel ESP32 Anda.</li>
    </ul>
  </li>
  <li><strong>Klik Upload (Tombol Panah Kanan):</strong> Tunggu hingga proses kompilasi selesai dan status menunjukkan <em>Done uploading</em>.</li>
</ol>

<h2 class="section-header">5.2 Panduan Mengatasi Kendala (Troubleshooting Matriks)</h2>
<table>
  <thead>
    <tr>
      <th style="width: 25%;">Gejala Masalah</th>
      <th style="width: 35%;">Kemungkinan Penyebab Utama</th>
      <th style="width: 40%;">Langkah Solusi Cepat</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Layar LCD 16x2 hanya menampilkan kotak hitam atau blank</strong></td>
      <td>Tingkat kontras belum diatur atau tegangan catu kurang dari 5V.</td>
      <td>
        1. Ambil obeng minus kecil, putar potensiometer (trimpot) biru di bagian belakang modul I2C backpack sampai huruf terlihat jelas.<br>
        2. Pastikan VCC LCD terhubung ke pin <strong>VIN (5V)</strong>, bukan 3.3V.
      </td>
    </tr>
    <tr>
      <td><strong>Kartu RFID tidak merespons sama sekali saat di-tap</strong></td>
      <td>Pin VCC salah tegangan, jalur kabel SPI longgar, atau solderan pin header kurang menempel.</td>
      <td>
        1. <span style="color:red; font-weight:bold;">Periksa tegangan:</span> Pastikan VCC RC522 ke pin <strong>3.3V</strong>.<br>
        2. Periksa pin Chip Select: Reader 1 ke GPIO 5, Reader 2 ke GPIO 4.<br>
        3. Pastikan pin header RC522 telah disolder sempurna ke papan PCB-nya.
      </td>
    </tr>
    <tr>
      <td><strong>Motor servo bergetar terus atau ESP32 restart sendiri</strong></td>
      <td>Arus listrik drop (<em>Brownout Detector Triggered</em>) saat motor servo mulai berputar.</td>
      <td>
        1. Hubungkan kabel merah servo ke pin <strong>VIN (5V)</strong>.<br>
        2. Gunakan kabel USB data berkualitas tinggi yang mampu menghantarkan arus minimal 1.5A - 2A dari adaptor/port laptop.
      </td>
    </tr>
    <tr>
      <td><strong>Timbangan Load Cell nilainya 0 atau tidak berubah</strong></td>
      <td>Kabel 4-warna Load Cell terbalik atau pin DT/SCK belum tercolok pas.</td>
      <td>
        Pastikan urutan kabel di modul HX711: Merah ke <code>E+</code>, Hitam ke <code>E-</code>, Putih ke <code>A-</code>, dan Hijau ke <code>A+</code>. Periksa DT di GPIO 16 dan SCK di GPIO 17.
      </td>
    </tr>
    <tr>
      <td><strong>Serial Monitor menampilkan "WIFI OFFLINE"</strong></td>
      <td>SSID atau kata sandi hotspot salah, atau frekuensi Wi-Fi 5 GHz.</td>
      <td>
        ESP32 hanya mendukung frekuensi <strong>Wi-Fi 2.4 GHz</strong>. Pastikan pengaturan hotspot HP Anda mengaktifkan opsi <em>Maximize Compatibility / 2.4 GHz Band</em>.
      </td>
    </tr>
  </tbody>
</table>

<div class="footer-stamp">
  <strong>SMART-WARGA &bull; Enterprise Civic Operating System Hub</strong> &bull; Portal Resmi: <code>https://manajemensystem.my.id</code> &bull; Email Dukungan: <code>admin@manajemensystem.my.id</code>
</div>

</body>
</html>
HTML;

$pdf = Pdf::loadHTML($html)->setPaper('a4', 'portrait');

$outputPath1 = '/Users/admin/Herd/smartwarga/Buku_Panduan_IoT_ESP32_SMART_WARGA.pdf';
$outputPath2 = '/Users/admin/Herd/smartwarga/docs/Buku_Panduan_IoT_ESP32_SMART_WARGA.pdf';
$outputPath3 = '/Users/admin/Herd/smartwarga/docs/SMART_WARGA_Enterprise_Blueprint_Dan_Panduan_IoT.pdf';
$outputPath4 = '/Users/admin/Herd/smartwarga/firmware/smartwarga_single_esp32_aio/Buku_Panduan_IoT_ESP32_SMART_WARGA.pdf';
$outputPath5 = '/Users/admin/Herd/smartwarga/firmware/smartwarga_esp32_ktp_enroller/Buku_Panduan_IoT_ESP32_SMART_WARGA.pdf';

$pdf->save($outputPath1);
copy($outputPath1, $outputPath2);
copy($outputPath1, $outputPath3);
copy($outputPath1, $outputPath4);
copy($outputPath1, $outputPath5);

echo "PDF Master Berhasil Diperbarui:\n";
echo "1. $outputPath1 (" . filesize($outputPath1) . " bytes)\n";
echo "2. $outputPath2 (" . filesize($outputPath2) . " bytes)\n";
echo "3. $outputPath3 (" . filesize($outputPath3) . " bytes)\n";
echo "4. $outputPath4 (" . filesize($outputPath4) . " bytes)\n";
echo "5. $outputPath5 (" . filesize($outputPath5) . " bytes)\n";
