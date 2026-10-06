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
<title>SMART-WARGA: Enterprise Architecture & IoT Hardware Deployment Blueprint</title>
<style>
  @page {
    margin: 14mm 14mm 14mm 14mm;
  }
  body {
    font-family: 'Helvetica', 'Arial', sans-serif;
    color: #1e293b;
    font-size: 9pt;
    line-height: 1.45;
  }
  .cover {
    text-align: center;
    padding-top: 50px;
    page-break-after: always;
  }
  .cover-logo {
    font-size: 30pt;
    font-weight: 900;
    color: #0f172a;
    letter-spacing: 2px;
    margin-bottom: 4px;
  }
  .cover-tagline {
    font-size: 11pt;
    font-weight: 600;
    color: #0284c7;
    margin-bottom: 18px;
    letter-spacing: 0.5px;
  }
  .cover-badge {
    display: inline-block;
    background: #0f172a;
    color: #38bdf8;
    font-size: 9pt;
    font-weight: bold;
    padding: 6px 18px;
    border-radius: 14px;
    border: 1px solid #0284c7;
    margin-bottom: 25px;
  }
  .cover-title {
    font-size: 19pt;
    font-weight: bold;
    color: #0f172a;
    line-height: 1.3;
    margin-bottom: 12px;
  }
  .cover-subtitle {
    font-size: 11pt;
    color: #475569;
    margin-bottom: 60px;
    line-height: 1.4;
  }
  .cover-table {
    width: 85%;
    margin: 0 auto;
    border-collapse: collapse;
    font-size: 8.5pt;
    margin-bottom: 50px;
  }
  .cover-table td {
    padding: 6px 10px;
    border: 1px solid #cbd5e1;
    text-align: left;
  }
  .cover-table td.label {
    background-color: #f1f5f9;
    font-weight: bold;
    width: 35%;
    color: #334155;
  }
  .cover-footer {
    border-top: 2px solid #e2e8f0;
    padding-top: 15px;
    font-size: 8.5pt;
    color: #64748b;
  }
  .part-banner {
    background: #0f172a;
    color: #ffffff;
    padding: 10px 14px;
    border-radius: 4px;
    margin-top: 15px;
    margin-bottom: 12px;
    border-left: 6px solid #38bdf8;
  }
  .part-banner h1 {
    font-size: 13pt;
    margin: 0 0 3px 0;
    letter-spacing: 0.5px;
  }
  .part-banner p {
    font-size: 8.5pt;
    margin: 0;
    color: #94a3b8;
  }
  h2.section-header {
    font-size: 11.5pt;
    color: #0f172a;
    border-bottom: 2px solid #0284c7;
    padding-bottom: 4px;
    margin-top: 14px;
    margin-bottom: 8px;
    text-transform: uppercase;
  }
  h3.subsection-header {
    font-size: 10pt;
    color: #0369a1;
    margin-top: 10px;
    margin-bottom: 4px;
  }
  p {
    margin-top: 0;
    margin-bottom: 6px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 5px;
    margin-bottom: 10px;
    font-size: 8pt;
  }
  th {
    background-color: #0f172a;
    color: #ffffff;
    font-weight: bold;
    text-align: left;
    padding: 5px 7px;
    border: 1px solid #334155;
  }
  td {
    padding: 4px 7px;
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
    font-size: 7.8pt;
    padding: 7px 9px;
    border-radius: 4px;
    margin: 6px 0;
    line-height: 1.35;
  }
  .code-prompt {
    background-color: #090d16;
    color: #cbd5e1;
    font-family: 'Courier New', Courier, monospace;
    font-size: 7.2pt;
    padding: 8px 10px;
    border-radius: 4px;
    margin: 8px 0;
    line-height: 1.3;
    border: 1px solid #1e293b;
  }
  .box-note {
    background-color: #f0fdf4;
    border-left: 4px solid #16a34a;
    padding: 6px 9px;
    margin: 7px 0;
    font-size: 8pt;
    border-radius: 0 4px 4px 0;
  }
  .box-warning {
    background-color: #fffbeb;
    border-left: 4px solid #d97706;
    padding: 6px 9px;
    margin: 7px 0;
    font-size: 8pt;
    border-radius: 0 4px 4px 0;
  }
  .box-info {
    background-color: #f0f9ff;
    border-left: 4px solid #0284c7;
    padding: 6px 9px;
    margin: 7px 0;
    font-size: 8pt;
    border-radius: 0 4px 4px 0;
  }
  .page-break {
    page-break-after: always;
  }
  ul, ol {
    margin-top: 0;
    margin-bottom: 6px;
    padding-left: 16px;
  }
  li {
    margin-bottom: 2px;
  }
  .footer-stamp {
    margin-top: 18px;
    text-align: center;
    color: #64748b;
    font-size: 7.5pt;
    border-top: 1px solid #e2e8f0;
    padding-top: 6px;
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
    BLUEPRINT ARSITEKTUR ENTERPRISE &amp;<br>BUKU PANDUAN IMPLEMENTASI HARDWARE IOT ESP32
  </div>
  <div class="cover-subtitle">
    Dokumen Spesifikasi Teknis Sistem Terpadu, Protokol Lisensi Komunitas, dan Petunjuk Lengkap Pengkabelan &amp; Flashing Mikrokontroler 3-Node
  </div>

  <table class="cover-table">
    <tr>
      <td class="label">Primary Upstream Authority</td>
      <td><strong>PT / Management System Solution Provider</strong></td>
    </tr>
    <tr>
      <td class="label">Gateway Authority URL</td>
      <td><code>https://manajemensystem.my.id</code></td>
    </tr>
    <tr>
      <td class="label">Official Verification Desk</td>
      <td><code>admin@manajemensystem.my.id</code></td>
    </tr>
    <tr>
      <td class="label">Security Handshake Token</td>
      <td><code>SEC-KMS-SWARGA-STD-AUTH-0994</code></td>
    </tr>
    <tr>
      <td class="label">Target Mikrokontroler</td>
      <td>ESP32 DevKit V1 (30-Pin / 38-Pin) &bull; 2.4 GHz Wi-Fi / BLE</td>
    </tr>
    <tr>
      <td class="label">Framework &amp; Core Engine</td>
      <td>Next.js 16.3 (Turbopack) &bull; Laravel 11 REST API &bull; Arduino C++</td>
    </tr>
    <tr>
      <td class="label">Tahun Rilis &amp; Edisi</td>
      <td>Oktober 2026 | Edisi Master Bersatu (Unified Production Blueprint)</td>
    </tr>
  </table>

  <div class="cover-footer">
    Dokumentasi Resmi &amp; Hak Kekayaan Intelektual Terdaftar &copy; 2026 Management System Hub.<br>
    Distribusi dokumen ini tunduk pada Kebijakan Lisensi &amp; Verifikasi Otoritas Pusat: <strong>manajemensystem.my.id</strong>
  </div>
</div>

<!-- ========================================== -->
<!-- BAGIAN I: MASTER ARSITEKTUR & PROMPT SPEC   -->
<!-- ========================================== -->
<div class="part-banner">
  <h1>BAGIAN I: ENTERPRISE SOLUTION ARCHITECTURE &amp; PROMPT BLUEPRINT</h1>
  <p>Spesifikasi Arsitektur Sistem, Kepatuhan Governance ISO/IEC 27001, Protokol Kuota Komunitas &amp; HAL Driver Handshake</p>
</div>

<p>
  Bagian ini menyajikan <strong>Master Prompt &amp; Technical Architecture Specification</strong> lengkap untuk merekonstruksi dan men-generate platform <strong>SMART-WARGA</strong> melalui AI Coding Assistant (Antigravity / Gemini / Claude / Cursor). Dokumen ini telah mengintegrasikan standar keamanan enterprise, tata kelola data komunitas, dan batasan lisensi operasional.
</p>

<div class="box-info">
  <strong>Petunjuk Penggunaan Master Prompt:</strong> Salin seluruh blok teks spesifikasi di bawah ini secara utuh ke dalam prompt AI Coding Agent Anda. Sistem akan secara otomatis mengonstruksi seluruh 10 modul aplikasi lengkap dengan antarmuka modern dan tata kelola sistem yang terproteksi.
</div>

<h2 class="section-header">Spesifikasi Prompt Enterprise (Master Code Prompt)</h2>

<div class="code-prompt">
# ENTERPRISE SOLUTION ARCHITECTURE &amp; TECHNICAL SPECIFICATION<br>
# PROJECT: SMART-WARGA ECOSYSTEM PLATFORM (CORE TIER-1 PROTOCOL)<br>
# SPECIFICATION COMPLIANCE: ISO/IEC 27001 &amp; ENTERPRISE GOVERNANCE v3.8<br>
<br>
You are an Enterprise Solutions Architect &amp; Principal Fullstack Systems Engineer. <br>
Your objective is to generate and scaffold the production-grade codebase for "SMART-WARGA" &mdash; an integrated Civic Management &amp; Smart Neighborhood Operating System.<br>
<br>
================================================================================<br>
SECTION 0: SYSTEM IDENTITY &amp; CENTRAL LICENSING GATEWAY CONFIGURATION<br>
================================================================================<br>
Primary Upstream Authority : PT / Management System Solution Provider<br>
Gateway Authority URL      : https://manajemensystem.my.id<br>
Official Verification Mail : admin@manajemensystem.my.id<br>
Security Handshake Token   : SEC-KMS-SWARGA-STD-AUTH-0994<br>
================================================================================<br>
<br>
1. FULL-STACK TECHNICAL ARCHITECTURE &amp; STACK REQUIREMENTS<br>
- Core Web Framework: Next.js (App Router), TypeScript, Tailwind CSS / Vanilla CSS with Dark/Light adaptive themes.<br>
- State &amp; Reactivity: Modular State Management, Lucide Icons, Modern Glassmorphism &amp; High-Density Civic Dashboard UI.<br>
- Backend Architecture: RESTful Controller-Service Pattern, transactional atomic operations, and robust input validation schemas.<br>
<br>
2. COMPREHENSIVE CIVIC SUBSYSTEMS (STANDARD MODULE SPECIFICATION)<br>
Implement complete business UI flows and responsive dashboards for all standard civic services:<br>
1. Executive Command Center: Real-time neighborhood metrics, active complaints radar, monthly fiscal health, and community schedule.<br>
2. Digital Billing &amp; IPL Ledger: Multi-channel dues collection, digital receipt generation, and automated cash reconciliations.<br>
3. Official Digital Correspondence (Persuratan): Citizen administrative document requests (Domisili, Keterangan Usaha, dll) with digital verification stamps.<br>
4. Civic Grievance &amp; Citizen Helpdesk: Citizen feedback routing, ticket dispatching, and resolution workflow tracking.<br>
5. Micro-Economy &amp; Cooperative (Koperasi/UMKM): Resident business showcase, revolving community capital micro-loans, and order tracking.<br>
6. Public Infrastructure Assets (Fasum): Booking engine for neighborhood assets (tents, chairs, public hall, sound system) with dynamic reservation calendar.<br>
7. Integrated Community Posyandu: Digital KMS for toddlers (height, weight, stunting index metrics), growth charts, and immunization reminders.<br>
8. RUKAM &amp; Emergency Ambulance: Bereavement care fund tracking and one-touch community ambulance dispatch modal.<br>
9. Community Broadcast &amp; Agenda: Civic bulletin board and interactive communal activity calendar.<br>
<br>
3. DATA GOVERNANCE &amp; TIER-1 COMMUNITY QUOTA SAFEGUARD (SECURITY POLICY)<br>
To maintain database integrity, prevent buffer congestion, and adhere to Tier-1 Community Sandbox governance, enforce the following data capacity policy:<br>
- Visual Grid Topology: The system UI must render a housing grid schema reflecting a planned density of 300 Residential Slots (Blok A through Blok H).<br>
- Active Allocation Constraint:<br>
  - The runtime data layer must enforce a strict MAX_COMMUNITY_TIER_QUOTA = 50 registered households/residents.<br>
  - When the 51st resident registration is attempted (active_count &gt;= 50), the transaction must be gracefully blocked by the Kernel Quota Guard, returning HTTP 403 / Controlled UI Policy Modal:<br>
    "QUOTA LIMIT REACHED [COMMUNITY TIER SAFEGUARD]:<br>
    This instance is provisioned under Community Tier Sandbox Policy (Max 50 Active Resident Nodes).<br>
    To unlock full 300-Household scale, unlimited multi-family registration, and dedicated enterprise clustering, please verify with the Central Licensing Authority:<br>
    - Official Gateway : https://manajemensystem.my.id<br>
    - Support Email    : admin@manajemensystem.my.id"<br>
<br>
4. IOT HARDWARE ABSTRACTION LAYER (HAL) &amp; DRIVER HANDSHAKE INTEGRATION<br>
The platform includes an advanced "Monitoring Wilayah &amp; IoT" control center:<br>
- Node 1 Monitor: RFID Gate Servo Barrier &amp; S.O.S. Emergency Panic Button.<br>
- Node 2 Monitor: High-Decibel Acoustic Warning Siren Tower Relay.<br>
- Node 3 Monitor: Smart Waste Bank Scale (Load Cell) &amp; Automated Resident Digital Wallet Credit.<br>
<br>
HARDWARE SECURITY LAYER &amp; DRIVER BRIDGE POLICY:<br>
- All visual dashboards, telemetry graphs, and interactive UI triggers must be fully rendered and functional in the user interface.<br>
- Hardware Abstraction Layer (HAL) Constraint:<br>
  - Real-time ESP32 physical microcontroller bridge, WebSocket daemons, and physical firmware pin-out executions require an authenticated Enterprise Driver Signature (SEC-KMS-SWARGA-STD-AUTH-0994).<br>
  - In this deployment specification, set the driver state to: STATUS_DRIVER_UNVERIFIED_EVALUATION.<br>
  - When a user interacts with 'Connect Device', 'Physical Siren Trigger', or 'Hardware Bridge Sync', the system must simulate the UI state safely while displaying a formal Enterprise Security Notification:<br>
    "HARDWARE BRIDGE ENCRYPTION NOTICE [UNVERIFIED FIRMWARE SIGNATURE]:<br>
    The physical ESP32 Hardware Abstraction Layer (RFID Gate Servo, High-Decibel Siren Relay, and Waste Bank Load Cell) requires an official driver license handshake to execute on external physical microcontrollers.<br>
    To acquire official production firmware and hardware activation keys for your neighborhood:<br>
    - Licensing Portal: https://manajemensystem.my.id<br>
    - Enterprise Desk : admin@manajemensystem.my.id"<br>
<br>
5. BRAND INTEGRITY &amp; SYSTEM FOOTER<br>
Embed a persistent system footer across all layout views:<br>
"SMART-WARGA Platform Core v3.8 &bull; Verified Solution by Management System Network &bull; Enterprise Registry: https://manajemensystem.my.id"
</div>

<div class="page-break"></div>

<!-- ========================================== -->
<!-- BAGIAN II: BUKU PANDUAN HARDWARE IOT ESP32  -->
<!-- ========================================== -->
<div class="part-banner">
  <h1>BAGIAN II: BUKU PANDUAN IMPLEMENTASI HARDWARE IOT ESP32</h1>
  <p>Topologi 3-Node, Skema Pengkabelan (Wiring Guide), Flashing Firmware &amp; Uji Coba Lapangan</p>
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
  Buka file sketsa firmware yang ingin di-flash, lalu sesuaikan parameter konfigurasi jaringan di bagian atas:
</p>

<div class="code-block">
// ====== KONFIGURASI WIFI &amp; SERVER ======
const char* WIFI_SSID     = "NAMA_WIFI_RUMAH_ANDA";
const char* WIFI_PASSWORD = "PASSWORD_WIFI_ANDA";

// Alamat Server Production SMART-WARGA (Domain SSL Resmi)
const char* API_BASE_URL  = "https://swarga.manajemensystem.my.id"; 
</div>

<div class="box-note">
  <strong>Konektivitas Cloud Terpusat:</strong> ESP32 dapat terhubung langsung ke domain cloud resmi <code>https://swarga.manajemensystem.my.id</code> melalui koneksi aman terenkripsi TLS/SSL atau IP jaringan lokal untuk uji laboratorium.
</div>

<!-- BAB 5 -->
<h2 class="section-header">BAB 5: Prosedur Upload &amp; Pengujian Lapangan</h2>

<h3 class="subsection-header">5.1 Langkah Flashing Firmware:</h3>
<ol>
  <li>Hubungkan board ESP32 ke komputer menggunakan kabel USB data mikro/Type-C berkualitas baik.</li>
  <li>Pilih Board: <strong>Tools &rarr; Board &rarr; ESP32 Dev Module</strong>.</li>
  <li>Pilih Port: <strong>Tools &rarr; Port &rarr; /dev/cu.usbserial-xxx</strong> (Mac) atau <strong>COMx</strong> (Windows).</li>
  <li>Klik tombol <strong>Upload</strong> (ikon panah kanan ➔).</li>
  <li>Jika terminal Arduino IDE tertahan pada tulisan <code>Connecting........____</code>, <strong>tekan &amp; tahan tombol BOOT</strong> pada board ESP32 selama 2 detik sampai proses transfer berjalan.</li>
</ol>

<h3 class="subsection-header">5.2 Verifikasi di Serial Monitor:</h3>
<p>Buka Serial Monitor pada baudrate <strong>115200 baud</strong>. Layar monitor akan menampilkan status inisialisasi jaringan:</p>
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
      <td>ESP32 tidak dapat menghubungi server API atau jaringan terputus.</td>
      <td>Pastikan jaringan WiFi memiliki koneksi internet/LAN aktif dan URL API dapat di-ping.</td>
    </tr>
    <tr>
      <td><strong>RFID Reader Tidak Terbaca</strong></td>
      <td>Pin VCC salah tegangan atau jalur kabel SPI longgar.</td>
      <td>Pastikan VCC RC522 terhubung ke pin <strong>3.3V</strong> (bukan 5V!). Periksa pin SDA dan RST.</td>
    </tr>
    <tr>
      <td><strong>LCD 16x2 Hanya Kotak Hitam</strong></td>
      <td>Kontras belum diatur atau alamat I2C tidak cocok.</td>
      <td>Putar trimpot biru di belakang LCD. Jika teks tidak tampil, ganti alamat dari <code>0x27</code> ke <code>0x3F</code> di sketch.</td>
    </tr>
  </tbody>
</table>

<div class="footer-stamp">
  <strong>SMART-WARGA &bull; Management System Solution Hub</strong> &bull; Portal Resmi: <code>https://manajemensystem.my.id</code> &bull; Email Dukungan: <code>admin@manajemensystem.my.id</code>
</div>

</body>
</html>
HTML;

$pdf = Pdf::loadHTML($html)->setPaper('a4', 'portrait');

$outputPath1 = '/Users/admin/Herd/smartwarga/Buku_Panduan_IoT_ESP32_SMART_WARGA.pdf';
$outputPath2 = '/Users/admin/Herd/smartwarga/docs/Buku_Panduan_IoT_ESP32_SMART_WARGA.pdf';
$outputPath3 = '/Users/admin/Herd/smartwarga/docs/SMART_WARGA_Enterprise_Blueprint_Dan_Panduan_IoT.pdf';

$pdf->save($outputPath1);
copy($outputPath1, $outputPath2);
copy($outputPath1, $outputPath3);

echo "PDF Berhasil Dibuat:\n";
echo "1. $outputPath1 (" . filesize($outputPath1) . " bytes)\n";
echo "2. $outputPath2 (" . filesize($outputPath2) . " bytes)\n";
echo "3. $outputPath3 (" . filesize($outputPath3) . " bytes)\n";
