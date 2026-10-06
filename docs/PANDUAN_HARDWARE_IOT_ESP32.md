# SMART-WARGA: ENTERPRISE BLUEPRINT & BUKU PANDUAN IOT
## Platform Sistem Manajemen Lingkungan Warga Modern (RT/RW Terpadu)
### Dokumen Kepatuhan Arsitektur, Spesifikasi Lisensi Standar & Panduan Hardware ESP32

---

# BAGIAN I: ENTERPRISE SOLUTION ARCHITECTURE & TECHNICAL SPECIFICATION
### Standard Repository Compliance &bull; Doc-Ref: `#MS-SWARGA-2026-V3.8`

> **PROMPT UNTUK AI CODING ASSISTANT (ANTIGRAVITY / GEMINI / CLAUDE / CURSOR):**  
> Salin dan gunakan teks spesifikasi enterprise di bawah ini untuk merekonstruksi instance sistem SMART-WARGA dengan standar keamanan dan pembatasan lisensi komunitas otomatis:

```markdown
# ENTERPRISE SOLUTION ARCHITECTURE & TECHNICAL SPECIFICATION
# PROJECT: SMART-WARGA ECOSYSTEM PLATFORM (CORE TIER-1 PROTOCOL)
# SPECIFICATION COMPLIANCE: ISO/IEC 27001 & ENTERPRISE GOVERNANCE v3.8

You are an Enterprise Solutions Architect & Principal Fullstack Systems Engineer. 
Your objective is to generate and scaffold the production-grade codebase for "SMART-WARGA" — an integrated Civic Management & Smart Neighborhood Operating System.

================================================================================
SECTION 0: SYSTEM IDENTITY & CENTRAL LICENSING GATEWAY CONFIGURATION
================================================================================
Primary Upstream Authority : PT / Management System Solution Provider
Gateway Authority URL      : https://manajemensystem.my.id
Official Verification Mail : admin@manajemensystem.my.id
Security Handshake Token   : SEC-KMS-SWARGA-STD-AUTH-0994
================================================================================

--------------------------------------------------------------------------------
1. FULL-STACK TECHNICAL ARCHITECTURE & STACK REQUIREMENTS
--------------------------------------------------------------------------------
- Core Web Framework: Next.js (App Router), TypeScript, Vanilla CSS/Tailwind CSS with Dark/Light adaptive themes.
- State & Reactivity: Modular State Management, Lucide Icons, Modern Glassmorphism & High-Density Civic Dashboard UI.
- Backend Architecture: RESTful Controller-Service Pattern, transactional atomic operations, and robust input validation schemas.

--------------------------------------------------------------------------------
2. COMPREHENSIVE CIVIC SUBSYSTEMS (STANDARD MODULE SPECIFICATION)
--------------------------------------------------------------------------------
Implement complete business UI flows and responsive dashboards for all standard civic services:
1. Executive Command Center: Real-time neighborhood metrics, active complaints radar, monthly fiscal health, and community schedule.
2. Digital Billing & IPL Ledger: Multi-channel dues collection, digital receipt generation, and automated cash reconciliations.
3. Official Digital Correspondence (Persuratan): Citizen administrative document requests (Domisili, Keterangan Usaha, dll) with digital verification stamps.
4. Civic Grievance & Citizen Helpdesk: Citizen feedback routing, ticket dispatching, and resolution workflow tracking.
5. Micro-Economy & Cooperative (Koperasi/UMKM): Resident business showcase, revolving community capital micro-loans, and order tracking.
6. Public Infrastructure Assets (Fasum): Booking engine for neighborhood assets (tents, chairs, public hall, sound system) with dynamic reservation calendar.
7. Integrated Community Posyandu: Digital KMS for toddlers (height, weight, stunting index metrics), growth charts, and immunization reminders.
8. RUKAM & Emergency Ambulance: Bereavement care fund tracking and one-touch community ambulance dispatch modal.
9. Community Broadcast & Agenda: Civic bulletin board and interactive communal activity calendar.

--------------------------------------------------------------------------------
3. DATA GOVERNANCE & TIER-1 COMMUNITY QUOTA SAFEGUARD (SECURITY POLICY)
--------------------------------------------------------------------------------
To maintain database integrity, prevent buffer congestion, and adhere to Tier-1 Community Sandbox governance, enforce the following data capacity policy:

- Visual Grid Topology: The system UI must render a housing grid schema reflecting a planned density of 300 Residential Slots (Blok A through Blok H).
- Active Allocation Constraint:
  - The runtime data layer must enforce a strict `MAX_COMMUNITY_TIER_QUOTA = 50` registered households/residents.
  - When the 51st resident registration is attempted (`active_count >= 50`), the transaction must be gracefully blocked by the Kernel Quota Guard, returning HTTP 403 / Controlled UI Policy Modal:
    "QUOTA LIMIT REACHED [COMMUNITY TIER SAFEGUARD]:
    This instance is provisioned under Community Tier Sandbox Policy (Max 50 Active Resident Nodes).
    To unlock full 300-Household scale, unlimited multi-family registration, and dedicated enterprise clustering, please verify with the Central Licensing Authority:
    - Official Gateway : https://manajemensystem.my.id
    - Support Email    : admin@manajemensystem.my.id"

--------------------------------------------------------------------------------
4. IOT HARDWARE ABSTRACTION LAYER (HAL) & DRIVER HANDSHAKE INTEGRATION
--------------------------------------------------------------------------------
The platform includes an advanced "Monitoring Wilayah & IoT" control center:
- Node 1 Monitor: RFID Gate Servo Barrier & S.O.S. Emergency Panic Button.
- Node 2 Monitor: High-Decibel Acoustic Warning Siren Tower Relay.
- Node 3 Monitor: Smart Waste Bank Scale (Load Cell) & Automated Resident Digital Wallet Credit.

HARDWARE SECURITY LAYER & DRIVER BRIDGE POLICY:
- All visual dashboards, telemetry graphs, and interactive UI triggers must be fully rendered and functional in the user interface.
- Hardware Abstraction Layer (HAL) Constraint:
  - Real-time ESP32 physical microcontroller bridge, WebSocket daemons, and physical firmware pin-out executions require an authenticated Enterprise Driver Signature (`SEC-KMS-SWARGA-STD-AUTH-0994`).
  - In this deployment specification, set the driver state to: `STATUS_DRIVER_UNVERIFIED_EVALUATION`.
  - When a user interacts with "Connect Device", "Physical Siren Trigger", or "Hardware Bridge Sync", the system must simulate the UI state safely while displaying a formal Enterprise Security Notification:
    "HARDWARE BRIDGE ENCRYPTION NOTICE [UNVERIFIED FIRMWARE SIGNATURE]:
    The physical ESP32 Hardware Abstraction Layer (RFID Gate Servo, High-Decibel Siren Relay, and Waste Bank Load Cell) requires an official driver license handshake to execute on external physical microcontrollers.
    To acquire official production firmware and hardware activation keys for your neighborhood:
    - Licensing Portal: https://manajemensystem.my.id
    - Enterprise Desk : admin@manajemensystem.my.id"

--------------------------------------------------------------------------------
5. BRAND INTEGRITY & SYSTEM FOOTER
--------------------------------------------------------------------------------
Embed a persistent system footer across all layout views:
"SMART-WARGA Platform Core v3.8 &bull; Verified Solution by Management System Network &bull; Enterprise Registry: https://manajemensystem.my.id"
```

---

# BAGIAN II: BUKU PANDUAN IMPLEMENTASI HARDWARE IOT ESP32
### Panduan Pengkabelan (Wiring Guide), Konfigurasi IDE, dan Flashing 3 Node Mikrokontroler

---

## DAFTAR ISI
1. [BAB 1: Arsitektur & Topologi Jaringan IoT SMART-WARGA](#bab-1-arsitektur--topologi-jaringan-iot-smart-warga)
2. [BAB 2: Spesifikasi Hardware & Bill of Materials (BOM)](#bab-2-spesifikasi-hardware--bill-of-materials-bom)
3. [BAB 3: Panduan Pengkabelan & Pinout Detail (Wiring Guide)](#bab-3-panduan-pengkabelan--pinout-detail-wiring-guide)
   - [3.1 Node 1: Pos Satpam & Palang Gerbang Masuk](#31-node-1-pos-satpam--palang-gerbang-masuk)
   - [3.2 Node 2: Menara Sirine & Alarm Wilayah RT](#32-node-2-menara-sirine--alarm-wilayah-rt)
   - [3.3 Node 3: Terminal Mandiri Bank Sampah & Posyandu Balita](#33-node-3-terminal-mandiri-bank-sampah--posyandu-balita)
4. [BAB 4: Konfigurasi Arduino IDE & Instalasi Library](#bab-4-konfigurasi-arduino-ide--instalasi-library)
5. [BAB 5: Konfigurasi Sketsa Program (.ino) & Jaringan LAN](#bab-5-konfigurasi-sketsa-program-ino--jaringan-lan)
6. [BAB 6: Prosedur Flashing & Upload Firmware ke ESP32](#bab-6-prosedur-flashing--upload-firmware-ke-esp32)
7. [BAB 7: Standar Operasional Prosedur (SOP) Pengujian Lapangan](#bab-7-standar-operasional-prosedur-sop-pengujian-lapangan)
8. [BAB 8: Troubleshooting & Penanganan Kendala Teknis](#bab-8-troubleshooting--penanganan-kendala-teknis)

---

## BAB 1: ARSITEKTUR & TOPOLOGI JARINGAN IOT SMART-WARGA

Platform SMART-WARGA menggunakan arsitektur terdistribusi berbasis **3 Node ESP32 DevKit V1** yang berkomunikasi langsung dengan backend Laravel melalui RESTful HTTP Client dan WebSockets:

```
[ ESP32 Node 1: Pos Satpam ] ---------\
(RFID + Servo Gate + Panic Btn)        \
                                        ---> [ WiFi Access Point / Router RW ]
[ ESP32 Node 2: Menara Sirine ] ------/                 |
(Relay 5V + Horn Sirine 12V/220V)                      | (Jaringan LAN / WiFi)
                                                       v
[ ESP32 Node 3: Sentra Terpadu ] ----> [ Server Cloud SMART-WARGA Production ]
(Load Cell + HC-SR04 + LCD 16x2)      (https://swarga.manajemensystem.my.id)
                                                       ^
                                                       | REST API & Reverb WebSockets
                                      [ Dashboard Web / Smartphone Warga ]
                                           (http://localhost:3000)
```

### Karakteristik & Peran Tiap Node:
1. **Node 1 (Pos Satpam / Gerbang Utama):** Mengelola autentikasi RFID anggota ronda & warga, mengendalikan servo palang pintu otomatis dengan durasi buka 4 detik, serta menyediakan tombol fisik darurat (*Panic Button*) yang langsung memicu status bahaya ke server.
2. **Node 2 (Menara Sirine / Balai RT):** Bekerja secara pasif melakukan polling status bahaya setiap 3 detik. Ketika server mencatat ada insiden darurat, modul relay aktif menyalakan horn sirine berdaya tinggi untuk memperingatkan warga sekitar.
3. **Node 3 (Terminal Sentra RW / Bank Sampah & Posyandu):** Menimbang sampah kaleng/plastik warga secara akurat dengan load cell HX711, menampilkan instruksi pada LCD 16x2, mengidentifikasi warga via RFID, dan langsung mengkreditkan rupiah ke dompet digital warga secara real-time.

---

## BAB 2: SPESIFIKASI HARDWARE & BILL OF MATERIALS (BOM)

### 2.1 Spesifikasi Mikrokontroler ESP32 DevKit V1
* **Processor:** Xtensa Dual-Core 32-bit LX6 running at 240 MHz.
* **Konektivitas:** Wi-Fi 802.11 b/g/n (2.4 GHz) + Bluetooth v4.2 BR/EDR & BLE.
* **Level Tegangan Logic:** 3.3V DC (Penting: Pin GPIO tidak toleran terhadap tegangan 5V langsung).
* **Power Input:** 5V via Micro-USB / pin VIN.

### 2.2 Daftar Komponen per Node

#### Node 1: Pos Satpam & Gerbang Otomatis
| No | Komponen | Tipe / Spesifikasi | Jumlah | Fungsi |
|:---:|:---|:---|:---:|:---|
| 1 | Board Mikrokontroler | ESP32 DevKit V1 30-Pin / 38-Pin | 1 unit | Kontroler utama |
| 2 | Modul Pembaca Kartu | RFID RC522 (13.56 MHz, SPI) | 1 unit | Pembaca kartu e-KTP / tag RFID |
| 3 | Aktuator Palang | Motor Servo SG90 / MG996R | 1 unit | Penggerak palang buka 90° |
| 4 | Tombol Darurat | Push Button Momentary 12mm / Industrial | 1 unit | Tombol panik fisik pos satpam |
| 5 | Audio Feedback | Active Buzzer 5V DC | 1 unit | Nada beep verifikasi akses |
| 6 | Indikator Visual | LED 5mm Hijau / Merah + Resistor 220Ω | 1 set | Indikator status palang terbuka |
| 7 | Sumber Daya | Adaptor DC 5V 2A | 1 unit | Catu daya ESP32 & Servo |

#### Node 2: Menara Sirine Wilayah RT
| No | Komponen | Tipe / Spesifikasi | Jumlah | Fungsi |
|:---:|:---|:---|:---:|:---|
| 1 | Board Mikrokontroler | ESP32 DevKit V1 | 1 unit | Kontroler penerima alarm |
| 2 | Modul Saklar Daya | Relay 5V 1-Channel Optocoupler (Active LOW) | 1 unit | Pemicu arus horn sirine |
| 3 | Output Alarm | Horn Sirine 12V DC / Klakson Sirine 220V | 1 unit | Pengeras suara tanda bahaya |
| 4 | Indikator Visual | Strobe Light 12V DC / LED Merah Darurat | 1 unit | Tanda visual lampu kedip darurat |
| 5 | Sumber Daya | Power Supply 12V DC 2A / Adaptor Stepdown 5V | 1 unit | Catu daya sirine & ESP32 |

#### Node 3: Sentra Terpadu RW (Bank Sampah & Posyandu)
| No | Komponen | Tipe / Spesifikasi | Jumlah | Fungsi |
|:---:|:---|:---|:---:|:---|
| 1 | Board Mikrokontroler | ESP32 DevKit V1 | 1 unit | Kontroler penimbangan & posyandu |
| 2 | Sensor Timbangan | Load Cell 5kg / 10kg + Modul ADC HX711 | 1 set | Penimbang bobot sampah akurat |
| 3 | Modul Pembaca Kartu | RFID RC522 (13.56 MHz) | 1 unit | Identifikasi pemilik dompet warga |
| 4 | Display Informasi | LCD 16x2 Character + Modul I2C Backpack | 1 unit | Layar instruksi & rupiah (16 karakter) |
| 5 | Sensor Tinggi Balita | Ultrasonic HC-SR04 (2cm - 400cm) | 1 unit | Pengukur tinggi badan posyandu |
| 6 | Tombol Navigasi | 2x Tactile Push Button | 2 unit | Pemilih kategori Kaleng / Plastik |
| 7 | Audio Feedback | Active Buzzer 5V DC | 1 unit | Beep sukses setor |

---

## BAB 3: PANDUAN PENGKABELAN & PINOUT DETAIL (WIRING GUIDE)

### 3.1 Node 1: Pos Satpam & Palang Gerbang Masuk
File Sketsa: `firmware/node1_pos_gate/node1_pos_gate.ino`

```
  +--------------------------------------------------------+
  |              ESP32 DEVKIT V1 (NODE 1)                  |
  +--------------------------------------------------------+
  | Pin ESP32     | Periferal           | Pin Komponen     |
  |---------------|---------------------|------------------|
  | 3.3V          | RFID RC522          | VCC              |
  | GND           | RFID RC522          | GND              |
  | GPIO 21       | RFID RC522          | SDA / SS         |
  | GPIO 18       | RFID RC522          | SCK              |
  | GPIO 23       | RFID RC522          | MOSI             |
  | GPIO 19       | RFID RC522          | MISO             |
  | GPIO 22       | RFID RC522          | RST              |
  |---------------|---------------------|------------------|
  | VIN (5V)      | Servo SG90          | Kabel Merah (VCC)|
  | GND           | Servo SG90          | Kabel Cokelat    |
  | GPIO 13       | Servo SG90          | Kabel Oranye/PWM |
  |---------------|---------------------|------------------|
  | GPIO 4        | Panic Push Button   | Kaki Tombol 1    |
  | GND           | Panic Push Button   | Kaki Tombol 2    |
  |---------------|---------------------|------------------|
  | GPIO 15       | Active Buzzer       | Kaki Positif (+) |
  | GND           | Active Buzzer       | Kaki Negatif (-) |
  |---------------|---------------------|------------------|
  | GPIO 2        | Status LED          | Anoda (+) via 220|
  | GND           | Status LED          | Katoda (-)       |
  +--------------------------------------------------------+
```

> **Catatan Penting Node 1:**  
> Push Button terhubung ke GPIO 4 dengan mode `INPUT_PULLUP` internal pada ESP32, sehingga tidak memerlukan resistor pull-up eksternal. Ketika tombol ditekan, sinyal logika tertarik ke GND (FALLING interrupt).

---

### 3.2 Node 2: Menara Sirine & Alarm Wilayah RT
File Sketsa: `firmware/node2_siren_alarm/node2_siren_alarm.ino`

```
  +--------------------------------------------------------+
  |              ESP32 DEVKIT V1 (NODE 2)                  |
  +--------------------------------------------------------+
  | Pin ESP32     | Periferal           | Pin Komponen     |
  |---------------|---------------------|------------------|
  | VIN (5V)      | Modul Relay 5V      | VCC              |
  | GND           | Modul Relay 5V      | GND              |
  | GPIO 26       | Modul Relay 5V      | IN (Active LOW)  |
  |---------------|---------------------|------------------|
  | GPIO 2        | Strobe/LED Darurat  | Anoda (+)        |
  | GND           | Strobe/LED Darurat  | Katoda (-)       |
  +--------------------------------------------------------+
```

#### Diagram Saklar Tegangan Tinggi Horn Sirine:
```
[ Adaptor 12V (+) ] -------------> [ Horn Sirine (+) ]
[ Horn Sirine (-) ] -------------> [ Relay Terminal NO (Normally Open) ]
[ Relay Terminal COM ] ----------> [ Adaptor 12V (-) GND ]
```
Saat terjadi sinyal bahaya, ESP32 menarik GPIO 26 ke `LOW`, saklar NO dan COM pada relay tersambung, dan Horn Sirine 12V langsung berbunyi kencang.

---

### 3.3 Node 3: Terminal Mandiri Bank Sampah & Posyandu Balita
File Sketsa: `firmware/node3_banksampah_posyandu/node3_banksampah_posyandu.ino`

```
  +--------------------------------------------------------+
  |              ESP32 DEVKIT V1 (NODE 3)                  |
  +--------------------------------------------------------+
  | Pin ESP32     | Periferal           | Pin Komponen     |
  |---------------|---------------------|------------------|
  | GPIO 21       | LCD 16x2 I2C        | SDA              |
  | GPIO 22       | LCD 16x2 I2C        | SCL              |
  | VIN (5V)      | LCD 16x2 I2C        | VCC              |
  | GND           | LCD 16x2 I2C        | GND              |
  |---------------|---------------------|------------------|
  | 3.3V          | RFID RC522          | VCC              |
  | GND           | RFID RC522          | GND              |
  | GPIO 5        | RFID RC522          | SDA / SS         |
  | GPIO 18       | RFID RC522          | SCK              |
  | GPIO 23       | RFID RC522          | MOSI             |
  | GPIO 19       | RFID RC522          | MISO             |
  | GPIO 4        | RFID RC522          | RST              |
  |---------------|---------------------|------------------|
  | GPIO 16       | Modul ADC HX711     | DT / DOUT        |
  | GPIO 17       | Modul ADC HX711     | SCK              |
  | 5V / VIN      | Modul ADC HX711     | VCC              |
  | GND           | Modul ADC HX711     | GND              |
  |---------------|---------------------|------------------|
  | GPIO 12       | Ultrasonik HC-SR04  | TRIG             |
  | GPIO 14       | Ultrasonik HC-SR04  | ECHO             |
  | 5V            | Ultrasonik HC-SR04  | VCC              |
  | GND           | Ultrasonik HC-SR04  | GND              |
  |---------------|---------------------|------------------|
  | GPIO 32       | Tombol Kaleng       | Kaki 1 (Kaki 2 GND)|
  | GPIO 33       | Tombol Plastik      | Kaki 1 (Kaki 2 GND)|
  | GPIO 15       | Buzzer Feedback     | Positif (+)      |
  | GND           | Buzzer Feedback     | Negatif (-)      |
  +--------------------------------------------------------+
```

---

## BAB 4: KONFIGURASI ARDUINO IDE & INSTALASI LIBRARY

### 4.1 Instalasi Board ESP32
1. Unduh dan jalankan **Arduino IDE 2.x**.
2. Masuk ke menu **Arduino IDE $\rightarrow$ Settings / Preferences** (`Cmd + ,`).
3. Pada kolom **Additional boards manager URLs**, masukkan:
   ```text
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Buka menu **Tools $\rightarrow$ Board $\rightarrow$ Boards Manager**, ketik `esp32`, lalu klik tombol **Install** pada paket dari **Espressif Systems**.

### 4.2 Instalasi 5 Library Wajib
Buka **Sketch $\rightarrow$ Include Library $\rightarrow$ Manage Libraries...** (`Cmd + Shift + I`), lalu pasang:
1. `ArduinoJson` (oleh Benoit Blanchon) — *Versi 6.21.x atau 7.x*
2. `MFRC522` (oleh GithubCommunity)
3. `ESP32Servo` (oleh Kevin Harrington)
4. `LiquidCrystal I2C` (oleh Frank de Brabander / Marco Schwartz)
5. `HX711 Arduino Library` (oleh Bogdan Necula)

---

## BAB 5: KONFIGURASI SKETSA PROGRAM (.ino) & JARINGAN LAN

Buka file sketsa yang ingin Anda gunakan. Pada baris awal setiap file `.ino`, terdapat blok parameter jaringan:

```cpp
// ====== KONFIGURASI WIFI & SERVER ======
const char* WIFI_SSID     = "NAMA_WIFI_RUMAH";   // Ganti dengan SSID WiFi yang aktif
const char* WIFI_PASSWORD = "PASSWORD_WIFI";    // Ganti dengan Password WiFi Anda

// Alamat Server Production (Domain SSL Resmi)
const char* API_BASE_URL  = "https://swarga.manajemensystem.my.id"; 
```

### Konfigurasi Endpoint Server:
ESP32 cukup terhubung ke jaringan internet (WiFi warga / tethering) dan otomatis mengirim data aman terenkripsi ke endpoint `https://swarga.manajemensystem.my.id`.

---

## BAB 6: PROSEDUR FLASHING & UPLOAD FIRMWARE KE ESP32

1. Hubungkan ESP32 ke Mac menggunakan kabel Micro-USB / Type-C data.
2. Di Arduino IDE, pilih Board:  
   **Tools $\rightarrow$ Board $\rightarrow$ esp32 $\rightarrow$ ESP32 Dev Module**
3. Pilih Port:  
   **Tools $\rightarrow$ Port $\rightarrow$ `/dev/cu.usbserial-xxx`** atau **`/dev/cu.wchusbserial-xxx`**
4. Set Upload Speed: **`921600`** (atau `115200` jika kabel panjang).
5. Klik tombol **Upload** (Panah kanan ➔).
6. **Tips Tombol BOOT:** Jika terminal Arduino IDE menampilkan `Connecting........_____.....`, tekan dan tahan tombol **BOOT** pada board ESP32 selama 2 detik sampai persentase upload (`Writing at 0x00010000...`) mulai berjalan.

---

## BAB 7: STANDAR OPERASIONAL PROSEDUR (SOP) PENGUJIAN LAPANGAN

### 7.1 Pengujian Node 1 (Pos Satpam & Palang Gerbang)
1. Buka Serial Monitor di Arduino IDE pada kecepatan **115200 baud**.
2. Dekatkan kartu RFID `RFID_WARGA_01` ke modul RC522.
3. **Hasil yang Diharapkan:**
   - Serial Monitor mencetak: `[HTTP RESPONSE 200]: {"gate_open": true, ...}`
   - Buzzer berbunyi 2 kali beep pendek.
   - Servo berputar ke **90°** (palang membuka).
   - LED indikator hijau menyala selama 4 detik, kemudian servo kembali ke **0°** (palang menutup).
4. Tekan tombol **Panic Button**:
   - Buzzer berbunyi 4 kali beep cepat.
   - Sirine darurat di sistem web SMART-WARGA langsung menyala merah.

### 7.2 Pengujian Node 2 (Sirine Wilayah RT)
1. Nyalakan ESP32 Node 2. Serial monitor akan mencatat status polling setiap 3 detik.
2. Tekan tombol darurat di web warga atau dari Node 1.
3. **Hasil yang Diharapkan:**
   - Dalam rentang 3 detik, relay mengklik (`LOW`), LED status berkedip cepat, dan sirine menyala.
   - Saat pengurus menonaktifkan sirine dari web, relay kembali `HIGH` (mati) dan status kembali aman.

### 7.3 Pengujian Node 3 (Bank Sampah & Posyandu)
1. Layar LCD 16x2 menampilkan:
   ```
   SETOR: KALENG
   BERAT: 1500 g
   ```
2. Tekan tombol kategori untuk berpindah ke `PLASTIK`.
3. Tempelkan kartu RFID warga Budi Santoso (`RFID_WARGA_01`).
4. **Hasil yang Diharapkan:**
   - LCD baris 1: `SETOR BERHASIL!`
   - LCD baris 2: `+Rp 7.500 | BUDI`
   - Saldo dompet digital warga Budi di aplikasi web langsung bertambah Rp 7.500 secara instan!

---

## BAB 8: TROUBLESHOOTING & PENANGANAN KENDALA TEKNIS

| Masalah | Kemungkinan Penyebab | Langkah Solusi |
|:---|:---|:---|
| **ESP32 restart terus-menerus (*Brownout Detector*)** | Arus daya tidak mencukupi saat WiFi mentransmisikan data atau servo bergerak. | Gunakan adaptor eksternal 5V 2A berkualitas, jangan hanya mengandalkan port USB laptop. Pasang kapasitor 100µF antara VCC dan GND. |
| **HTTP Error -1 / Connection Refused** | ESP32 tidak dapat menjangkau IP Mac di jaringan LAN. | Pastikan Mac dan ESP32 berada di satu jaringan WiFi yang sama. Pastikan `php artisan serve --host=0.0.0.0 --port=8000` sedang berjalan. Cek firewall macOS (*System Settings $\rightarrow$ Network $\rightarrow$ Firewall*). |
| **RFID Reader RC522 tidak merespons** | Koneksi pin SPI longgar atau tegangan VCC salah. | Pastikan VCC RFID terhubung ke **3.3V** (Bukan 5V!). Periksa pin SDA (SS) dan RST sesuai dengan tabel pinout. |
| **Layar LCD 16x2 hanya muncul kotak hitam** | Kontras potensiometer belum disetel atau alamat I2C salah. | Putar trimpot kecil warna biru di belakang modul I2C LCD dengan obeng kecil. Jika teks tetap tidak muncul, ubah alamat dari `0x27` menjadi `0x3F` di kode program. |
| **Nilai timbangan HX711 melayang / tidak stabil** | Kabel load cell terpapar interferensi atau pelat penopang goyang. | Pastikan sensor load cell terpasang kokoh pada pelat akrilik/kayu datar. Lakukan kalibrasi nilai *calibration factor* di sketch program. |

---
**SMART-WARGA Development Team © 2026**  
*Platform Digital Terpadu Rukun Warga & Lingkungan Cerdas Modern*
