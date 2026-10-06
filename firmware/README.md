# SMART-WARGA — Firmware IoT (3 Node ESP32)

Direktori ini berisi kode sumber Arduino C++ untuk 3 perangkat IoT berbasis mikrokontroler **ESP32 DevKit V1** yang terintegrasi secara langsung dengan Backend REST API SMART-WARGA.

---

## 📦 Daftar Node & Fungsi

| Node | Lokasi | Hardware Utama | Fungsi Sistem |
|---|---|---|---|
| **Node 1** (`node1_pos_gate/`) | Pos Satpam / Gerbang Utama | ESP32, RFID RC522, Servo SG90, Panic Push Button, Buzzer | Absensi ronda malam, akses buka palang otomatis, tombol darurat hardware |
| **Node 2** (`node2_siren_alarm/`) | Balai Warga RT 01-03 | ESP32, Modul Relay 5V Optocoupler, Horn Sirine 12V/220V | Receiver alarm wilayah terdistribusi, polling status darurat |
| **Node 3** (`node3_banksampah_posyandu/`) | Sentra Terpadu RW | ESP32, RFID RC522, Load Cell HX711, HC-SR04, LCD 16x2 I2C | Timbangan sampah otomatis (kredit saldo dompet instan) & Kios Posyandu balita |

---

## 🛠️ Pustaka Arduino yang Diperlukan (Library Manager)

Sebelum melakukan kompilasi di Arduino IDE / PlatformIO, pasang library berikut:
1. `ArduinoJson` (oleh Benoit Blanchon) — Versi 6.x / 7.x
2. `MFRC522` (oleh GithubCommunity) — Untuk pembaca RFID 13.56MHz
3. `ESP32Servo` (oleh Kevin Harrington) — Untuk kendali motor servo SG90
4. `LiquidCrystal I2C` (oleh Frank de Brabander / Marco Schwartz) — Layar LCD 16x2 I2C
5. `HX711 Arduino Library` (oleh Bogdan Necula) — Sensor timbangan digital

---

## 🔌 Panduan Pengkabelan (Pinout Diagram)

### Node 1: Pos Satpam & Palang Gerbang
```
ESP32 DevKit V1          Komponen External
-----------------        -----------------
3.3V             ------> RFID RC522 VCC
GND              ------> RFID GND, Servo GND, Button GND
GPIO 21 (SDA)    ------> RFID SDA (SS)
GPIO 18 (SCK)    ------> RFID SCK
GPIO 23 (MOSI)   ------> RFID MOSI
GPIO 19 (MISO)   ------> RFID MISO
GPIO 22 (RST)    ------> RFID RST
GPIO 13 (PWM)    ------> Servo SG90 Signal (Kabel Kuning / Oranye)
5V / VIN         ------> Servo SG90 Power (Kabel Merah)
GPIO 4 (PULLUP)  ------> Push Button Panic (Kaki 1), Kaki 2 ke GND
GPIO 15          ------> Buzzer Positif (+), Negatif ke GND
```

### Node 2: Sirine Wilayah RT
```
ESP32 DevKit V1          Komponen External
-----------------        -----------------
5V / VIN         ------> Modul Relay 5V VCC
GND              ------> Modul Relay 5V GND
GPIO 26          ------> Modul Relay IN (Sinyal Kontrol)
GPIO 2           ------> Status LED Anoda (via 220 Ohm)
GND              ------> Status LED Katoda
```

### Node 3: Terminal Bank Sampah & Posyandu
```
ESP32 DevKit V1          Komponen External
-----------------        -----------------
3.3V & GND       ------> RFID RC522 Power
GPIO 5           ------> RFID SDA (SS)
GPIO 18, 23, 19  ------> RFID SCK, MOSI, MISO
GPIO 4           ------> RFID RST
GPIO 16 (DT)     ------> Modul HX711 DOUT
GPIO 17 (SCK)    ------> Modul HX711 SCK
GPIO 12 (TRIG)   ------> Sensor HC-SR04 TRIG
GPIO 14 (ECHO)   ------> Sensor HC-SR04 ECHO
GPIO 21 (SDA)    ------> LCD I2C SDA
GPIO 22 (SCL)    ------> LCD I2C SCL
GPIO 32 (PULLUP) ------> Tombol Kategori Kaleng / Mode Switch
GPIO 33 (PULLUP) ------> Tombol Kategori Plastik / Tare Scale
```

---

## ⚙️ Konfigurasi Jaringan & Endpoint Backend

Buka setiap sketsa `.ino` dan sesuaikan parameter berikut:
```cpp
const char* WIFI_SSID     = "NAMA_WIFI_ANDA";
const char* WIFI_PASSWORD = "PASSWORD_WIFI";

// Masukkan IP komputer server lokal (bukan 'localhost' karena diakses dari ESP32)
const char* API_BASE_URL  = "http://192.168.1.100"; 
```

> **Tips:** Pastikan firewall di komputer Mac Anda mengizinkan koneksi masuk (*incoming connection*) pada port Herd / Nginx.

---

## 🧪 Pengujian via Serial Monitor

1. Set baudrate Serial Monitor ke `115200 baud`.
2. Tekan tombol **EN / RST** pada ESP32.
3. Amati pesan boot dan status koneksi WiFi.
4. Dekatkan kartu RFID dummy (`RFID_WARGA_01` atau `RFID_WARGA_02`) ke sensor.
5. Verifikasi bahwa respons JSON dari backend berhasil diterima dan aktuator (servo / relay / LCD) merespons dengan benar.
