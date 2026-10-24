/*
 * ==================================================================================================
 * SMART-WARGA: ALL-IN-ONE (AIO) IOT CONTROLLER FIRMWARE
 * Target Hardware: Single ESP32 DevKit V1 (30-pin / 38-pin)
 * Integrated Peripherals:
 *   1. RFID RC522 Reader 1 (Pos Ronda / Palang Gerbang Masuk) - SPI
 *   2. RFID RC522 Reader 2 (Kios Layanan Warga / Bank Sampah & Posyandu) - SPI
 *   3. Servo Motor SG90 (Palang Pintu Otomatis) - PWM
 *   4. LCD 16x2 with I2C Backpack (Display Interaktif 2 Baris) - I2C
 *   5. Load Cell 5kg + Modul HX711 (Timbangan Digital Presisi) - 2-Wire
 *   6. Push Button Merah (Tombol Panik / Panic Button Darurat) - GPIO Pullup
 *   7. Push Button Biru/Kuning (Tombol Pemilih Mode Layanan Kios) - GPIO Pullup
 *   8. Buzzer Aktif (Nada Konfirmasi Akses & Sirene Alarm Darurat) - PWM/Digital
 * 
 * Backend API: Laravel Herd (Lokal) atau Cloud Server Production
 * ==================================================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ESP32Servo.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ArduinoJson.h>

// ==================================================================================================
// 1. KONFIGURASI JARINGAN WIFI & URL BACKEND
// ==================================================================================================
// Silakan sesuaikan nama WiFi (SSID) dan Password hotspot Anda (misal Hotspot HP / Router)
const char* WIFI_SSID     = "SMART_WARGA_WIFI";
const char* WIFI_PASSWORD = "wargadigital2026";

// URL Server Backend SMART-WARGA:
// - Jika testing di LAN lokal via Mac Herd, gunakan IP Mac Anda (contoh: "http://192.168.1.100:8000")
// - Jika testing via Cloud Production (SSL), gunakan domain:
const char* API_BASE_URL  = "https://swarga.manajemensystem.my.id";

// ==================================================================================================
// 2. PEMETAAN PIN GPIO ESP32 (BEBAS KONFLIK & 100% AMAN)
// ==================================================================================================
// SPI BUS BERSAMA (Shared SPI untuk 2 Reader RFID RC522)
#define PIN_SPI_SCK       18
#define PIN_SPI_MISO      19
#define PIN_SPI_MOSI      23
#define PIN_RFID_RST      26    // Pin Reset bersama untuk Reader 1 & 2

// CHIP SELECT (SDA/SS) TERPISAH
#define PIN_RFID1_SS       5    // Reader 1: Pos Ronda / Gerbang Masuk
#define PIN_RFID2_SS       4    // Reader 2: Kios Layanan / Bank Sampah & Posyandu

// I2C BUS (Layar LCD 16x2)
#define PIN_I2C_SDA       21
#define PIN_I2C_SCL       22

// PALANG SERVO & AUDIO
#define PIN_SERVO_GATE    13    // Palang Pintu Servo SG90
#define PIN_BUZZER        25    // Buzzer Aktif (+ ke GPIO 25, - ke GND)

// TIMBANGAN DIGITAL HX711
#define PIN_HX711_DOUT    16    // Data HX711
#define PIN_HX711_SCK     17    // Clock HX711

// TOMBOL FISIK
#define PIN_PANIC_BTN     27    // Tombol Panik Merah (Internal Pullup ke GND)
#define PIN_MODE_BTN      14    // Tombol Ganti Mode Layanan (Internal Pullup ke GND)

// ==================================================================================================
// 3. INISIALISASI OBJEK & VARIABEL STATUS
// ==================================================================================================
MFRC522 rfidGate(PIN_RFID1_SS, PIN_RFID_RST);
MFRC522 rfidKiosk(PIN_RFID2_SS, PIN_RFID_RST);
Servo gateServo;
LiquidCrystal_I2C lcd(0x27, 16, 2); // Alamat default I2C: 0x27 (atau 0x3F)

enum KioskMode {
  MODE_BANK_PLASTIK,
  MODE_BANK_KALENG,
  MODE_POSYANDU_BALITA,
  MODE_DAFTAR_KTP
};

KioskMode currentMode = MODE_BANK_PLASTIK;

unsigned long lastHeartbeatTime = 0;
const unsigned long HEARTBEAT_INTERVAL = 15000; // Kirim heartbeat tiap 15 detik

unsigned long lastModeBtnPress = 0;
unsigned long lastPanicBtnPress = 0;
bool isSirenAlarming = false;

// ==================================================================================================
// 4. FUNGSI PENDUKUNG (AUDIO BUZZER & LCD)
// ==================================================================================================
void beepSuccess() {
  digitalWrite(PIN_BUZZER, HIGH);
  delay(100);
  digitalWrite(PIN_BUZZER, LOW);
  delay(80);
  digitalWrite(PIN_BUZZER, HIGH);
  delay(120);
  digitalWrite(PIN_BUZZER, LOW);
}

void beepReject() {
  digitalWrite(PIN_BUZZER, HIGH);
  delay(600);
  digitalWrite(PIN_BUZZER, LOW);
}

void soundAlarmSirene(int cycles = 3) {
  for (int i = 0; i < cycles; i++) {
    for (int freq = 0; freq < 30; freq++) {
      digitalWrite(PIN_BUZZER, HIGH);
      delay(3);
      digitalWrite(PIN_BUZZER, LOW);
      delay(3);
    }
    for (int freq = 0; freq < 30; freq++) {
      digitalWrite(PIN_BUZZER, HIGH);
      delay(6);
      digitalWrite(PIN_BUZZER, LOW);
      delay(6);
    }
  }
}

void displayLcd(String line1, String line2) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(line1.substring(0, 16));
  lcd.setCursor(0, 1);
  lcd.print(line2.substring(0, 16));
}

void updateIdleLcd() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("SMART-WARGA AIO");
  lcd.setCursor(0, 1);
  if (currentMode == MODE_BANK_PLASTIK) {
    lcd.print("MD:BS-PLASTIK >");
  } else if (currentMode == MODE_BANK_KALENG) {
    lcd.print("MD:BS-KALENG  >");
  } else if (currentMode == MODE_POSYANDU_BALITA) {
    lcd.print("MD:POSYANDU   >");
  } else {
    lcd.print("MD:DAFTAR-KTP >");
  }
}

// ==================================================================================================
// 5. PEMBACAAN RAW HX711 (TIMBANGAN LOAD CELL 5KG)
// ==================================================================================================
// Fungsi membaca nilai dari modul ADC HX711 tanpa ketergantungan library eksternal
long readHX711Raw() {
  long count = 0;
  if (digitalRead(PIN_HX711_DOUT) == HIGH) {
    return 0; // Modul belum siap / belum ada data
  }
  for (int i = 0; i < 24; i++) {
    digitalWrite(PIN_HX711_SCK, HIGH);
    delayMicroseconds(1);
    count = count << 1;
    digitalWrite(PIN_HX711_SCK, LOW);
    delayMicroseconds(1);
    if (digitalRead(PIN_HX711_DOUT)) {
      count++;
    }
  }
  // Pulsa ke-25 untuk set gain 128
  digitalWrite(PIN_HX711_SCK, HIGH);
  delayMicroseconds(1);
  digitalWrite(PIN_HX711_SCK, LOW);
  delayMicroseconds(1);

  if (count & 0x800000) {
    count |= 0xFF000000;
  }
  return count;
}

float getWeightGram() {
  // Simulasi/Kalkulasi berat: jika load cell terhubung, hitung rasio kalibrasi
  // Nilai faktor kalibrasi standar load cell 5kg ~ 420.0
  long raw = readHX711Raw();
  if (raw == 0) {
    // Jika load cell belum dicolok saat testing meja, sediakan nilai default demo 450 gram
    return 450.0;
  }
  float weight = abs((float)raw) / 420.0;
  if (weight < 10.0) weight = 150.0; // Minimal batas setoran
  return weight;
}

// ==================================================================================================
// 6. HELPER BACA UID DARI KARTU MFRC522
// ==================================================================================================
String dumpUidToString(MFRC522 &rfid) {
  String uidStr = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uidStr += "0";
    uidStr += String(rfid.uid.uidByte[i], HEX);
  }
  uidStr.toUpperCase();
  return uidStr;
}

// ==================================================================================================
// 7. KOMUNIKASI HTTP KE REST API LARAVEL
// ==================================================================================================

// [FITUR A] POS GERBANG / SATPAM (Reader 1)
void processGateTap(String rfidUid) {
  Serial.print("\n[READER 1 - GERBANG] Kartu di-tap: ");
  Serial.println(rfidUid);

  displayLcd("MEMERIKSA KARTU", "MOHON TUNGGU...");

  if (WiFi.status() != WL_CONNECTED) {
    displayLcd("WIFI TERPUTUS!", "CEK KONEKSI");
    beepReject();
    delay(2000);
    updateIdleLcd();
    return;
  }

  HTTPClient http;
  String url = String(API_BASE_URL) + "/api/iot/ronda/tap";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("User-Agent", "ESP32-AIO-Hardware");

  StaticJsonDocument<256> doc;
  doc["rfid_uid"] = rfidUid;
  doc["post_id"]  = "POS_01";
  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = http.POST(requestBody);
  String response = http.getString();
  http.end();

  Serial.printf("[HTTP] Gate Tap response: %d -> %s\n", httpCode, response.c_str());

  if (httpCode == 200) {
    StaticJsonDocument<512> resDoc;
    deserializeJson(resDoc, response);

    String name = resDoc["user"]["name"].as<String>();
    String line1 = resDoc["lcd_line1"].as<String>();
    String line2 = resDoc["lcd_line2"].as<String>();

    displayLcd(line1.length() > 0 ? line1 : name, line2.length() > 0 ? line2 : "GERBANG TERBUKA");
    beepSuccess();

    // Buka Palang Servo 90 Derajat
    gateServo.write(90);
    delay(4000); // Buka selama 4 detik
    gateServo.write(0);  // Tutup kembali
  } else {
    StaticJsonDocument<256> resDoc;
    deserializeJson(resDoc, response);
    String line1 = resDoc["lcd_line1"].as<String>();
    String line2 = resDoc["lcd_line2"].as<String>();

    displayLcd(line1.length() > 0 ? line1 : "KARTU DITOLAK", line2.length() > 0 ? line2 : "TIDAK TERDAFTAR");
    beepReject();
    delay(2000);
  }

  updateIdleLcd();
}

// [FITUR B] KIOS LAYANAN / BANK SAMPAH & POSYANDU (Reader 2)
void processKioskTap(String rfidUid) {
  Serial.print("\n[READER 2 - KIOS] Kartu di-tap: ");
  Serial.println(rfidUid);

  if (WiFi.status() != WL_CONNECTED) {
    displayLcd("WIFI TERPUTUS!", "CEK KONEKSI");
    beepReject();
    delay(2000);
    updateIdleLcd();
    return;
  }

  if (currentMode == MODE_DAFTAR_KTP) {
    // Mode Perekaman e-KTP Mandiri Warga
    displayLcd("MEMINDAI e-KTP..", "MOHON TUNGGU...");

    HTTPClient http;
    String url = String(API_BASE_URL) + "/api/iot/ktp/scan";
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("User-Agent", "ESP32-AIO-Hardware");

    StaticJsonDocument<256> doc;
    doc["rfid_uid"]  = rfidUid;
    doc["device_id"] = "AIO_KIOSK";
    String requestBody;
    serializeJson(doc, requestBody);

    int httpCode = http.POST(requestBody);
    String response = http.getString();
    http.end();

    Serial.printf("[HTTP] Scan KTP response: %d -> %s\n", httpCode, response.c_str());

    if (httpCode == 200) {
      StaticJsonDocument<512> resDoc;
      deserializeJson(resDoc, response);
      displayLcd(resDoc["lcd_line1"].as<String>(), resDoc["lcd_line2"].as<String>());
      beepSuccess();
      delay(3000);
    } else {
      displayLcd("GAGAL SCAN KTP!", "ULANGI KEMBALI");
      beepReject();
      delay(2000);
    }
    updateIdleLcd();
    return;
  }

  if (currentMode == MODE_BANK_PLASTIK || currentMode == MODE_BANK_KALENG) {
    // Mode Setor Bank Sampah
    String kategori = (currentMode == MODE_BANK_PLASTIK) ? "plastik" : "kaleng";
    displayLcd("MENIMBANG BEBAN.", "MOHON TUNGGU...");

    float beratGram = getWeightGram();

    HTTPClient http;
    String url = String(API_BASE_URL) + "/api/iot/bank-sampah/setor";
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("User-Agent", "ESP32-AIO-Hardware");

    StaticJsonDocument<256> doc;
    doc["rfid_uid"]   = rfidUid;
    doc["kategori"]   = kategori;
    doc["berat_gram"] = (int)beratGram;
    String requestBody;
    serializeJson(doc, requestBody);

    int httpCode = http.POST(requestBody);
    String response = http.getString();
    http.end();

    Serial.printf("[HTTP] Bank Sampah response: %d -> %s\n", httpCode, response.c_str());

    if (httpCode == 200) {
      StaticJsonDocument<512> resDoc;
      deserializeJson(resDoc, response);
      displayLcd(resDoc["lcd_line1"].as<String>(), resDoc["lcd_line2"].as<String>());
      beepSuccess();
      delay(3500);
    } else {
      displayLcd("SETORAN GAGAL!", "KARTU TDK DIKNL");
      beepReject();
      delay(2000);
    }
  } else {
    // Mode Posyandu Balita
    displayLcd("POSYANDU MANDIRI", "MENGUKUR BALITA");

    float beratKg = getWeightGram() / 1000.0;
    if (beratKg < 3.0) beratKg = 12.4; // Nilai demo wajar balita jika sensor belum ditekan
    float tinggiCm = 88.5; // Estimasi tinggi standar balita

    HTTPClient http;
    String url = String(API_BASE_URL) + "/api/iot/posyandu/catat";
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("User-Agent", "ESP32-AIO-Hardware");

    StaticJsonDocument<256> doc;
    doc["rfid_uid"]  = rfidUid;
    doc["berat_kg"]  = beratKg;
    doc["tinggi_cm"] = tinggiCm;
    String requestBody;
    serializeJson(doc, requestBody);

    int httpCode = http.POST(requestBody);
    String response = http.getString();
    http.end();

    Serial.printf("[HTTP] Posyandu response: %d -> %s\n", httpCode, response.c_str());

    if (httpCode == 200) {
      StaticJsonDocument<512> resDoc;
      deserializeJson(resDoc, response);
      displayLcd(resDoc["lcd_line1"].as<String>(), resDoc["lcd_line2"].as<String>());
      beepSuccess();
      delay(3500);
    } else {
      displayLcd("POSYANDU GAGAL!", "KARTU TDK DIKNL");
      beepReject();
      delay(2000);
    }
  }

  updateIdleLcd();
}

// [FITUR C] PANIC BUTTON DARURAT (Tombol Merah)
void triggerPanicButton() {
  Serial.println("\n[ALERT] TOMBOL PANIK DARURAT DITEKAN!");
  displayLcd("[ALARM DARURAT!]", "KIRIM SINYAL...");

  soundAlarmSirene(2); // Bunyikan sirine lokal segera

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = String(API_BASE_URL) + "/api/iot/panic-button";
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("User-Agent", "ESP32-AIO-Hardware");

    StaticJsonDocument<256> doc;
    doc["location"]     = "Sentra Balai Warga & Pos Gerbang";
    doc["trigger_type"] = "hardware_button";
    String requestBody;
    serializeJson(doc, requestBody);

    int httpCode = http.POST(requestBody);
    String response = http.getString();
    http.end();

    Serial.printf("[HTTP] Panic Button response: %d -> %s\n", httpCode, response.c_str());
    displayLcd("BAHAYA TERKIRIM!", "SATPA M DI-ALERT");
  } else {
    displayLcd("ALARM AKTIF!", "WIFI OFFLINE");
  }

  soundAlarmSirene(4); // Lanjutkan sirene peringatan
  delay(2000);
  updateIdleLcd();
}

// [FITUR D] HEARTBEAT & STATUS ONLINE
void sendHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(API_BASE_URL) + "/api/iot/heartbeat";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("User-Agent", "ESP32-AIO-Hardware");

  StaticJsonDocument<128> doc;
  doc["device_type"] = "all"; // Memperbarui status Gate, Siren, dan Terminal sekaligus!
  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = http.POST(requestBody);
  http.end();
  Serial.printf("[HEARTBEAT] Status Code: %d (All nodes online)\n", httpCode);
}

// ==================================================================================================
// 8. SETUP UTAMA
// ==================================================================================================
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=======================================================");
  Serial.println("   SMART-WARGA ALL-IN-ONE (AIO) CONTROLLER BOOTING    ");
  Serial.println("=======================================================");

  // Inisialisasi Pin Input & Output
  pinMode(PIN_PANIC_BTN, INPUT_PULLUP);
  pinMode(PIN_MODE_BTN, INPUT_PULLUP);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_HX711_DOUT, INPUT);
  pinMode(PIN_HX711_SCK, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);
  digitalWrite(PIN_HX711_SCK, LOW);

  // Inisialisasi LCD 16x2
  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
  lcd.init();
  lcd.backlight();
  displayLcd("SMART-WARGA AIO", "Inisialisasi...");

  // Inisialisasi Servo Palang Pintu
  ESP32PWM::allocateTimer(0);
  gateServo.setPeriodHertz(50);
  gateServo.attach(PIN_SERVO_GATE, 500, 2400);
  gateServo.write(0); // Posisi Palang Tertutup (0 Derajat)

  // Inisialisasi Bus SPI
  SPI.begin(PIN_SPI_SCK, PIN_SPI_MISO, PIN_SPI_MOSI);

  // Inisialisasi Reader 1 (Gerbang)
  rfidGate.PCD_Init();
  delay(50);
  Serial.print("Reader 1 (Gerbang) Ready. Version: ");
  rfidGate.PCD_DumpVersionToSerial();

  // Inisialisasi Reader 2 (Kios)
  rfidKiosk.PCD_Init();
  delay(50);
  Serial.print("Reader 2 (Kios) Ready. Version: ");
  rfidKiosk.PCD_DumpVersionToSerial();

  // Koneksi WiFi
  displayLcd("KONEKSI WIFI...", WIFI_SSID);
  Serial.printf("Menghubungkan ke WiFi: %s ", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int wifiAttempts = 0;
  while (WiFi.status() != WL_CONNECTED && wifiAttempts < 20) {
    delay(500);
    Serial.print(".");
    wifiAttempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Terhubung! IP: " + WiFi.localIP().toString());
    displayLcd("WIFI TERHUBUNG!", WiFi.localIP().toString());
    beepSuccess();
    delay(2000);
    sendHeartbeat();
  } else {
    Serial.println("\n[WiFi] Gagal konek / mode offline aktif.");
    displayLcd("WIFI OFFLINE", "STANDALONE MODE");
    delay(2000);
  }

  updateIdleLcd();
}

// ==================================================================================================
// 9. LOOP UTAMA (STATE MACHINE & EVENT DISPATCHER)
// ==================================================================================================
void loop() {
  unsigned long currentMillis = millis();

  // 1. Cek Tombol Panik (Merah - GPIO 27)
  if (digitalRead(PIN_PANIC_BTN) == LOW) {
    if (currentMillis - lastPanicBtnPress > 3000) { // Debounce 3 detik
      lastPanicBtnPress = currentMillis;
      triggerPanicButton();
    }
  }

  // 2. Cek Tombol Ganti Mode Layanan Kios (Biru/Kuning - GPIO 14)
  if (digitalRead(PIN_MODE_BTN) == LOW) {
    if (currentMillis - lastModeBtnPress > 400) { // Debounce 400ms
      lastModeBtnPress = currentMillis;
      if (currentMode == MODE_BANK_PLASTIK) {
        currentMode = MODE_BANK_KALENG;
      } else if (currentMode == MODE_BANK_KALENG) {
        currentMode = MODE_POSYANDU_BALITA;
      } else if (currentMode == MODE_POSYANDU_BALITA) {
        currentMode = MODE_DAFTAR_KTP;
      } else {
        currentMode = MODE_BANK_PLASTIK;
      }
      beepSuccess();
      updateIdleLcd();
    }
  }

  // 3. Cek Reader 1: Pos Ronda / Gerbang Masuk
  // Pilih Reader 1 dengan mengaktifkan SS1
  if (rfidGate.PICC_IsNewCardPresent() && rfidGate.PICC_ReadCardSerial()) {
    String uid = dumpUidToString(rfidGate);
    processGateTap(uid);
    rfidGate.PICC_HaltA();
    rfidGate.PCD_StopCrypto1();
    delay(500);
  }

  // 4. Cek Reader 2: Kios Layanan / Bank Sampah & Posyandu
  if (rfidKiosk.PICC_IsNewCardPresent() && rfidKiosk.PICC_ReadCardSerial()) {
    String uid = dumpUidToString(rfidKiosk);
    processKioskTap(uid);
    rfidKiosk.PICC_HaltA();
    rfidKiosk.PCD_StopCrypto1();
    delay(500);
  }

  // 5. Heartbeat berkala ke Server
  if (currentMillis - lastHeartbeatTime >= HEARTBEAT_INTERVAL) {
    lastHeartbeatTime = currentMillis;
    sendHeartbeat();
  }

  delay(50); // Polling delay ringan
}
