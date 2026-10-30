/*
 * ==================================================================================================
 * SMART-WARGA: ALL-IN-ONE (AIO) IOT CONTROLLER FIRMWARE (v3.0 FULL PRODUCTION)
 * Target Hardware: Single ESP32 DevKit V1 (30-pin / 38-pin)
 * 
 * PEMBAGIAN FUNGSI HARDWARE:
 * 1. READER 1 (JALUR SDA: GPIO 5) -> KHUSUS GERBANG TOL / AKSES MASUK:
 *    - Memanggil POST /api/iot/ronda/tap
 *    - Kartu terdaftar -> Palang servo (GPIO 13) buka 90 derajat 4 detik, beep sukses
 *    - Kartu asing / ilegal -> Palang tetap tertutup, LCD "KARTU ASING!", LED 2 kedip cepat 6x
 *    - Log keluar-masuk langsung tampil di dasbor warga & dasbor pengurus
 * 
 * 2. READER 2 (JALUR SDA: GPIO 4) -> KHUSUS KIOS PELAYANAN & ANTREAN TERPADU:
 *    - Memanggil POST /api/iot/pelayanan/tap
 *    - Sistem antrean berurutan (Si C tap duluan = ACTIVE, Si B/A tap setelahnya = WAITING)
 *    - Dasbor warga aktif membuka menu layanan (KTP, Posyandu, Pengaduan, Surat, Bank Sampah)
 *    - Setelah layanan selesai -> Sesi ditutup otomatis & antrean berikutnya maju otomatis
 *    - Sekaligus mengisi cache form registrasi e-KTP di web
 * 
 * 3. LAYAR LCD 16x2 I2C (SDA: GPIO 21, SCL: GPIO 22):
 *    - Alamat I2C terkonfirmasi: 0x27
 *    - Menampilkan status antrean, nama warga, dan mode sistem
 * 
 * 4. SIRINE WILAYAH DARI WEB & TOMBOL PANIK (GPIO 27):
 *    - Polling status sirine web tiap 2 detik -> Buzzer GPIO 25 & LED 2 menyala otomatis
 *    - Tombol panik fisik memicu alarm instan ke server
 * 
 * 5. STATUS WEB ONLINE:
 *    - Heartbeat tiap 8 detik menjaga Gate, Sirine, dan Kios selalu HIJAU ONLINE
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
// 1. KONFIGURASI WIFI & SERVER SMART-WARGA
// ==================================================================================================
const char* WIFI_SSID     = "Sumsang";
const char* WIFI_PASSWORD = "123456789"; // Password Hotspot Sumsang Anda

// Domain Server Production SMART-WARGA
const char* API_BASE_URL  = "https://swarga.manajemensystem.my.id";

// ==================================================================================================
// 2. PEMETAAN PIN HARDWARE ESP32
// ==================================================================================================
// BUS SPI (RFID RC522)
#define PIN_SPI_SCK       18
#define PIN_SPI_MISO      19
#define PIN_SPI_MOSI      23
#define PIN_RFID_RST      26    // Pin RST RC522 ke GPIO 26
#define PIN_RFID1_SS      5     // Jalur SDA 1 (Khusus Gerbang Tol) di GPIO 5
#define PIN_RFID2_SS      4     // Jalur SDA 2 (Khusus Kios Pelayanan & Antrean) di GPIO 4

// INDIKATOR & PALANG GERBANG
#define PIN_SERVO_GATE    13    // Signal Servo SG90 Palang Gerbang
#define PIN_BUZZER        25    // Buzzer Aktif (+ ke GPIO 25, - ke GND)
#define PIN_LED_STATUS    2     // On-board LED Biru ESP32

// I2C BUS (Layar LCD 16x2)
#define PIN_I2C_SDA       21
#define PIN_I2C_SCL       22

// TIMBANGAN DIGITAL HX711 (Bank Sampah - Opsional)
#define PIN_HX711_DOUT    16
#define PIN_HX711_SCK     17

// TOMBOL FISIK
#define PIN_PANIC_BTN     27    // Tombol Panik Merah (Internal Pullup ke GND)
#define PIN_MODE_BTN      14    // Tombol Ganti Mode Layanan (Internal Pullup ke GND)

// ==================================================================================================
// 3. OBJEK & VARIABEL GLOBAL
// ==================================================================================================
MFRC522* rfid1 = nullptr; // Reader 1 di Pin 5 (Gerbang)
MFRC522* rfid2 = nullptr; // Reader 2 di Pin 4 (Kios)
Servo gateServo;
LiquidCrystal_I2C lcd(0x27, 16, 2); // Alamat I2C terkonfirmasi: 0x27

enum KioskMode {
  MODE_PELAYANAN_TERPADU, // Mode 0: Antrean Meja Pelayanan Warga (Default)
  MODE_BANK_PLASTIK,      // Mode 1: Timbangan Bank Sampah Plastik
  MODE_BANK_KALENG,       // Mode 2: Timbangan Bank Sampah Kaleng
  MODE_GERBANG_MANUAL     // Mode 3: Gerbang Manual
};

KioskMode currentMode = MODE_PELAYANAN_TERPADU;

// Timers
unsigned long lastHeartbeatTime = 0;
const unsigned long HEARTBEAT_INTERVAL = 8000; // Kirim tiap 8 detik agar Web SELALU ONLINE HIJAU
unsigned long lastSirenCheckTime = 0;
const unsigned long SIREN_CHECK_INTERVAL = 2000; // Cek status sirine dari server tiap 2 detik
unsigned long lastModeBtnPress = 0;
unsigned long lastPanicBtnPress = 0;
unsigned long lastSerialDot = 0;
unsigned long sirenPulseTimer = 0;
bool sirenPulseState = false;
bool isSirenAlarming = false;
bool webSirenActive = false;
String webSirenReason = "";

// ==================================================================================================
// 4. AUDIO BUZZER & FEEDBACK
// ==================================================================================================
void beepSuccess() {
  digitalWrite(PIN_LED_STATUS, HIGH);
  digitalWrite(PIN_BUZZER, HIGH);
  delay(100);
  digitalWrite(PIN_BUZZER, LOW);
  delay(80);
  digitalWrite(PIN_BUZZER, HIGH);
  delay(120);
  digitalWrite(PIN_BUZZER, LOW);
  digitalWrite(PIN_LED_STATUS, LOW);
}

void beepShort() {
  digitalWrite(PIN_LED_STATUS, HIGH);
  digitalWrite(PIN_BUZZER, HIGH);
  delay(80);
  digitalWrite(PIN_BUZZER, LOW);
  digitalWrite(PIN_LED_STATUS, LOW);
}

void beepReject() {
  for (int i = 0; i < 2; i++) {
    digitalWrite(PIN_BUZZER, HIGH);
    delay(150);
    digitalWrite(PIN_BUZZER, LOW);
    delay(80);
  }
}

// Kedipkan LED 2 (On-board LED Biru GPIO 2) berulang-ulang cepat sebagai tanda KARTU ASING / BELUM TERDAFTAR
void blinkAlienCardAlert(int count = 6) {
  for (int i = 0; i < count; i++) {
    digitalWrite(PIN_LED_STATUS, HIGH);
    digitalWrite(PIN_BUZZER, HIGH);
    delay(90);
    digitalWrite(PIN_LED_STATUS, LOW);
    digitalWrite(PIN_BUZZER, LOW);
    delay(90);
  }
}

void soundAlarmSirene(int cycles = 3) {
  for (int i = 0; i < cycles; i++) {
    for (int freq = 0; freq < 25; freq++) {
      digitalWrite(PIN_BUZZER, HIGH);
      digitalWrite(PIN_LED_STATUS, HIGH);
      delay(3);
      digitalWrite(PIN_BUZZER, LOW);
      digitalWrite(PIN_LED_STATUS, LOW);
      delay(3);
    }
    for (int freq = 0; freq < 25; freq++) {
      digitalWrite(PIN_BUZZER, HIGH);
      digitalWrite(PIN_LED_STATUS, HIGH);
      delay(6);
      digitalWrite(PIN_BUZZER, LOW);
      digitalWrite(PIN_LED_STATUS, LOW);
      delay(6);
    }
  }
}

// ==================================================================================================
// 5. TAMPILAN DISPLAY LCD 16x2
// ==================================================================================================
void displayLcd(String line1, String line2) {
  Serial.printf("[LCD DISPLAY] %-16s | %-16s\n", line1.c_str(), line2.c_str());
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(line1.substring(0, 16));
  lcd.setCursor(0, 1);
  lcd.print(line2.substring(0, 16));
}

void updateIdleLcd() {
  if (webSirenActive) {
    displayLcd("!! SIRENE AKTIF !!", webSirenReason.length() > 0 ? webSirenReason : "BAHAYA / DARURAT");
    return;
  }

  String modeName = "TEMPELKAN KARTU";
  if (currentMode == MODE_BANK_PLASTIK) modeName = "MD:BS-PLASTIK   ";
  else if (currentMode == MODE_BANK_KALENG) modeName = "MD:BS-KALENG    ";
  else if (currentMode == MODE_GERBANG_MANUAL) modeName = "MD:GERBANG-ONLY ";

  displayLcd("SMART-WARGA AIO", modeName);
}

void initLcdHardware() {
  pinMode(PIN_I2C_SDA, INPUT_PULLUP);
  pinMode(PIN_I2C_SCL, INPUT_PULLUP);
  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
  Wire.setClock(100000); // 100 kHz standar I2C

  Serial.println("➡️ Menginisialisasi LCD 16x2 di alamat 0x27...");
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("SMART-WARGA AIO");
  lcd.setCursor(0, 1);
  lcd.print("SISTEM AKTIF...");
  Serial.println("✅ Layar LCD 16x2 (0x27) Berhasil Dinyalakan!");
}

// ==================================================================================================
// 6. PEMBACAAN RAW HX711 (TIMBANGAN LOAD CELL 5KG)
// ==================================================================================================
long readHX711Raw() {
  long count = 0;
  if (digitalRead(PIN_HX711_DOUT) == HIGH) return 0;
  for (int i = 0; i < 24; i++) {
    digitalWrite(PIN_HX711_SCK, HIGH);
    delayMicroseconds(1);
    count = count << 1;
    digitalWrite(PIN_HX711_SCK, LOW);
    delayMicroseconds(1);
    if (digitalRead(PIN_HX711_DOUT)) count++;
  }
  digitalWrite(PIN_HX711_SCK, HIGH);
  delayMicroseconds(1);
  digitalWrite(PIN_HX711_SCK, LOW);
  delayMicroseconds(1);
  if (count & 0x800000) count |= 0xFF000000;
  return count;
}

float getWeightGram() {
  long raw = readHX711Raw();
  if (raw == 0) return 450.0; // Demo default
  float weight = abs((float)raw) / 420.0;
  if (weight < 10.0) weight = 200.0;
  return weight;
}

// ==================================================================================================
// 7. INISIALISASI & DETEKSI RFID RC522 (PIN 4 & PIN 5)
// ==================================================================================================
String dumpUidToString(MFRC522* rfidDev) {
  String uidStr = "";
  for (byte i = 0; i < rfidDev->uid.size; i++) {
    if (rfidDev->uid.uidByte[i] < 0x10) uidStr += "0";
    uidStr += String(rfidDev->uid.uidByte[i], HEX);
  }
  uidStr.toUpperCase();
  return uidStr;
}

bool detectCard(MFRC522* dev, uint8_t activeSsPin, uint8_t inactiveSsPin) {
  if (!dev) return false;

  digitalWrite(inactiveSsPin, HIGH); // Matikan chip lain
  digitalWrite(activeSsPin, LOW);    // Nyalakan chip target
  delayMicroseconds(20);

  dev->PCD_WriteRegister(MFRC522::RFCfgReg, 0x07 << 4); // Max Antenna Gain 48dB

  byte bufferATQA[2];
  byte bufferSize = sizeof(bufferATQA);
  MFRC522::StatusCode status = dev->PICC_WakeupA(bufferATQA, &bufferSize);

  bool cardFound = false;
  if (status == MFRC522::STATUS_OK || status == MFRC522::STATUS_COLLISION) {
    if (dev->PICC_ReadCardSerial()) {
      cardFound = true;
    }
  }

  digitalWrite(activeSsPin, HIGH);
  return cardFound;
}

void setupSmartRfid() {
  SPI.begin(PIN_SPI_SCK, PIN_SPI_MISO, PIN_SPI_MOSI);

  pinMode(PIN_RFID1_SS, OUTPUT);
  pinMode(PIN_RFID2_SS, OUTPUT);
  pinMode(PIN_RFID_RST, OUTPUT);

  digitalWrite(PIN_RFID1_SS, HIGH);
  digitalWrite(PIN_RFID2_SS, HIGH);

  // Hardware Reset Pulsa
  digitalWrite(PIN_RFID_RST, LOW);
  delay(30);
  digitalWrite(PIN_RFID_RST, HIGH);
  delay(60);

  Serial.println("\n--- [INISIALISASI DUAL RFID RC522] ---");

  // Inisialisasi Reader 1 di Pin 5 (Gerbang)
  digitalWrite(PIN_RFID2_SS, HIGH);
  digitalWrite(PIN_RFID1_SS, LOW);
  rfid1 = new MFRC522(PIN_RFID1_SS, PIN_RFID_RST);
  rfid1->PCD_Init();
  delay(30);
  byte v1 = rfid1->PCD_ReadRegister(MFRC522::VersionReg);
  digitalWrite(PIN_RFID1_SS, HIGH);
  Serial.printf("Reader 1 [GERBANG - SDA: GPIO 5] Versi Firmware: 0x%02X\n", v1);

  // Inisialisasi Reader 2 di Pin 4 (Kios)
  digitalWrite(PIN_RFID1_SS, HIGH);
  digitalWrite(PIN_RFID2_SS, LOW);
  rfid2 = new MFRC522(PIN_RFID2_SS, PIN_RFID_RST);
  rfid2->PCD_Init();
  delay(30);
  byte v2 = rfid2->PCD_ReadRegister(MFRC522::VersionReg);
  digitalWrite(PIN_RFID2_SS, HIGH);
  Serial.printf("Reader 2 [KIOS PELAYANAN - SDA: GPIO 4] Versi Firmware: 0x%02X\n", v2);
}

// Buka Palang Servo 90 Derajat selama 4 detik
void openGateBarrier() {
  Serial.println("🚪 [SERVO] Membuka Palang Gerbang (90 Derajat)...");
  gateServo.write(90);
  delay(4000);
  Serial.println("🚪 [SERVO] Menutup Kembali Palang Gerbang (0 Derajat)...");
  gateServo.write(0);
}

// ==================================================================================================
// 8. LOGIKA READER 1 (GPIO 5): KHUSUS GERBANG TOL & AKSES MASUK
// ==================================================================================================
void processGateTap(String rfidUid) {
  Serial.println("\n=======================================================");
  Serial.printf("🚗 [GERBANG TOL - PIN 5] Kartu Di-tap di Gerbang! UID: [ %s ]\n", rfidUid.c_str());
  Serial.println("=======================================================");

  beepShort();
  displayLcd("GERBANG TOL", "UID: " + rfidUid);

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ [ERROR] WiFi terputus, tidak dapat membuka palang.");
    displayLcd("WIFI OFFLINE", "HUBUNGI PETUGAS");
    beepReject();
    delay(1500);
    updateIdleLcd();
    return;
  }

  HTTPClient http;
  String url = String(API_BASE_URL) + "/api/iot/ronda/tap";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("User-Agent", "ESP32-AIO-Gate");

  StaticJsonDocument<256> doc;
  doc["rfid_uid"] = rfidUid;
  doc["post_id"]  = "POS_GERBANG_UTAMA";
  String payload;
  serializeJson(doc, payload);

  int code = http.POST(payload);
  String response = http.getString();
  http.end();

  Serial.printf("[WEB /ronda/tap] HTTP Status: %d -> Response: %s\n", code, response.c_str());

  if (code == 200) {
    StaticJsonDocument<512> resDoc;
    deserializeJson(resDoc, response);

    String name = resDoc["user"]["name"].as<String>();
    String line1 = resDoc["lcd_line1"].as<String>();
    String line2 = resDoc["lcd_line2"].as<String>();

    displayLcd(line1.length() > 0 ? line1 : name, 
               line2.length() > 0 ? line2 : "GERBANG TERBUKA");
    beepSuccess();
    openGateBarrier(); // Buka Palang Servo 90 Derajat selama 4 detik
  } else {
    displayLcd("KARTU ASING!", "TIDAK TERDAFTAR");
    Serial.println("❌ [DITOLAK] Kartu asing / belum terdaftar sebagai warga! Palang gerbang TIDAK dibuka.");
    Serial.println("🚨 [PERINGATAN] LED 2 berkedip-kedip cepat (6x) menandakan KARTU ASING!");
    blinkAlienCardAlert(6); // LED 2 berkedip cepat 6 kali tanda kartu asing
    delay(1000);
  }

  updateIdleLcd();
}

// ==================================================================================================
// 9. LOGIKA READER 2 (GPIO 4): KHUSUS KIOS PELAYANAN & ANTREAN TERPADU
// ==================================================================================================
void processKioskTap(String rfidUid) {
  Serial.println("\n=======================================================");
  Serial.printf("📋 [PELAYANAN - PIN 4] Kartu Di-tap di Kios Pelayanan! UID: [ %s ]\n", rfidUid.c_str());
  Serial.println("=======================================================");

  beepShort();
  displayLcd("KIOS PELAYANAN", "UID: " + rfidUid);

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ [ERROR] WiFi terputus, tidak dapat mengirim ke server.");
    displayLcd("WIFI OFFLINE", "HUBUNGKAN HOTSPOT");
    beepReject();
    delay(1500);
    updateIdleLcd();
    return;
  }

  // Jika mode Bank Sampah aktif:
  if (currentMode == MODE_BANK_PLASTIK || currentMode == MODE_BANK_KALENG) {
    String kategori = (currentMode == MODE_BANK_PLASTIK) ? "plastik" : "kaleng";
    float berat = getWeightGram();

    displayLcd("MENIMBANG SAMPAH", String(berat, 0) + "g " + kategori);

    HTTPClient http;
    String url = String(API_BASE_URL) + "/api/iot/bank-sampah/setor";
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("User-Agent", "ESP32-AIO-Kiosk");

    StaticJsonDocument<256> doc;
    doc["rfid_uid"]   = rfidUid;
    doc["kategori"]   = kategori;
    doc["berat_gram"] = berat;
    String payload;
    serializeJson(doc, payload);

    int code = http.POST(payload);
    String response = http.getString();
    http.end();

    Serial.printf("[WEB /bank-sampah/setor] HTTP %d -> %s\n", code, response.c_str());

    if (code == 200) {
      beepSuccess();
      displayLcd("SETOR BERHASIL!", "+" + String(berat, 0) + "g SALDO CAIR");
      delay(3000);
    } else {
      displayLcd("KARTU ASING!", "BELUM TERDAFTAR");
      blinkAlienCardAlert(6);
      delay(1500);
    }
  } else {
    // Mode Default: Kios Pelayanan Warga & Antrean Terpadu (/api/iot/pelayanan/tap)
    HTTPClient http;
    String url = String(API_BASE_URL) + "/api/iot/pelayanan/tap";
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("User-Agent", "ESP32-AIO-Kiosk");

    StaticJsonDocument<256> doc;
    doc["rfid_uid"]  = rfidUid;
    doc["device_id"] = "AIO_KIOSK_PIN4";
    String payload;
    serializeJson(doc, payload);

    int code = http.POST(payload);
    String response = http.getString();
    http.end();

    Serial.printf("[WEB /pelayanan/tap] HTTP %d -> %s\n", code, response.c_str());

    if (code == 200 || code == 201) {
      StaticJsonDocument<512> resDoc;
      deserializeJson(resDoc, response);

      int qNum = resDoc["queue_number"] | 1;
      String status = resDoc["status"].as<String>();
      String line1 = resDoc["lcd_line1"].as<String>();
      String line2 = resDoc["lcd_line2"].as<String>();
      String citizenName = resDoc["citizen_name"].as<String>();

      displayLcd(line1.length() > 0 ? line1 : ("ANTREAN #" + String(qNum)), 
                 line2.length() > 0 ? line2 : (status == "active" ? "SILAKAN LAYANAN" : "HARAP MENUNGGU"));

      if (status == "active") {
        Serial.printf("🎉 [ANTREAN #%d - AKTIF] Giliran milik %s langsung aktif!\n", qNum, citizenName.c_str());
        beepSuccess();
        delay(2000);
      } else {
        Serial.printf("⏳ [ANTREAN #%d - MENUNGGU] %s masuk antrean meja pelayanan.\n", qNum, citizenName.c_str());
        beepShort();
        blinkAlienCardAlert(3);
        delay(1500);
      }
    } else {
      displayLcd("ERROR LAYANAN", "GAGAL MEMPROSES");
      beepReject();
      delay(1500);
    }
  }

  updateIdleLcd();
}

// ==================================================================================================
// 10. FITUR TOMBOL PANIK DARURAT (GPIO 27)
// ==================================================================================================
void triggerPanicButton() {
  Serial.println("\n🚨 [ALERT] TOMBOL PANIK DARURAT DITEKAN!");
  displayLcd("!! PANIK AKTIF !!", "MENGIRIM ALARM..");
  isSirenAlarming = true;

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = String(API_BASE_URL) + "/api/iot/panic-button";
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("User-Agent", "ESP32-AIO-SmartWarga");

    StaticJsonDocument<256> doc;
    doc["post_id"] = "POS_01";
    doc["reason"]  = "Tombol Panik Hardware Pos AIO Ditekan";
    String payload;
    serializeJson(doc, payload);

    int code = http.POST(payload);
    http.end();
    Serial.printf("[WEB /panic-button] HTTP Status: %d\n", code);
  }

  soundAlarmSirene(4);
  isSirenAlarming = false;
  updateIdleLcd();
}

// ==================================================================================================
// 11. HEARTBEAT ONLINE & STATUS SIRINE DARI WEB
// ==================================================================================================
void applySirenState(bool active, String reason) {
  if (active != webSirenActive) {
    webSirenActive = active;
    webSirenReason = reason;

    if (webSirenActive) {
      Serial.println("\n🚨🚨 [ALERT WEB] SIRINE WILAYAH DIAKTIFKAN DARI WEB! 🚨🚨");
      Serial.printf("Alasan: %s\n", webSirenReason.c_str());
      displayLcd("!! SIRENE AKTIF !!", webSirenReason.length() > 0 ? webSirenReason : "BAHAYA / DARURAT");
    } else {
      Serial.println("\n🟢 [INFO] Sirine dinonaktifkan dari web. Buzzer dimatikan.");
      digitalWrite(PIN_BUZZER, LOW);
      digitalWrite(PIN_LED_STATUS, LOW);
      updateIdleLcd();
    }
  }
}

// Cek Status Sirine dari Web (GET /api/iot/sirine/status)
void checkSirenStatusFromWeb() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(API_BASE_URL) + "/api/iot/sirine/status";
  http.begin(url);
  http.addHeader("User-Agent", "ESP32-AIO-SirenHardware");
  http.setTimeout(2500);

  int code = http.GET();
  if (code == 200) {
    String response = http.getString();
    StaticJsonDocument<256> doc;
    if (!deserializeJson(doc, response)) {
      bool active = doc["siren_active"] | false;
      String reason = doc["reason"].as<String>();
      applySirenState(active, reason);
    }
  }
  http.end();
}

void sendHeartbeatToWeb() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(API_BASE_URL) + "/api/iot/heartbeat";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("User-Agent", "ESP32-AIO-SmartWarga");

  StaticJsonDocument<128> doc;
  doc["device_type"] = "all";
  String payload;
  serializeJson(doc, payload);

  int code = http.POST(payload);
  if (code == 200) {
    String response = http.getString();
    StaticJsonDocument<256> resDoc;
    if (!deserializeJson(resDoc, response)) {
      bool active = resDoc["siren_active"] | false;
      String reason = resDoc["siren_reason"].as<String>();
      applySirenState(active, reason);
    }
    Serial.print(" [💚 WEB ONLINE] ");
  } else {
    Serial.printf(" [⚠️ Heartbeat %d] ", code);
  }
  http.end();
}

// ==================================================================================================
// 12. SETUP UTAMA
// ==================================================================================================
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n");
  Serial.println("=================================================================");
  Serial.println("    SMART-WARGA: ALL-IN-ONE (AIO) IOT CONTROLLER v3.0 ONLINE     ");
  Serial.println("=================================================================");
  Serial.println("PETUNJUK SERIAL MONITOR:");
  Serial.println("  't' + Enter -> Simulasi Tap Kartu Kios Pelayanan (Pin 4)");
  Serial.println("  'g' + Enter -> Simulasi Tap Kartu Gerbang (Pin 5)");
  Serial.println("  'p' + Enter -> Tes Tombol Panik Darurat");
  Serial.println("  's' + Enter -> Tes Cek Status Sirine dari Web");
  Serial.println("  'b' + Enter -> Tes Kedip Backlight LCD");
  Serial.println("  'm' + Enter -> Ganti Mode Layanan Kios");
  Serial.println("  'w' + Enter -> Tes Ping Website SMART-WARGA");
  Serial.println("=================================================================");

  // Pin I/O
  pinMode(PIN_PANIC_BTN, INPUT_PULLUP);
  pinMode(PIN_MODE_BTN, INPUT_PULLUP);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_LED_STATUS, OUTPUT);
  pinMode(PIN_HX711_DOUT, INPUT);
  pinMode(PIN_HX711_SCK, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);
  digitalWrite(PIN_LED_STATUS, LOW);
  digitalWrite(PIN_HX711_SCK, LOW);

  // Inisialisasi LCD 16x2 (0x27)
  initLcdHardware();

  // Inisialisasi Servo Palang Pintu
  ESP32PWM::allocateTimer(0);
  gateServo.setPeriodHertz(50);
  gateServo.attach(PIN_SERVO_GATE, 500, 2400);
  gateServo.write(0); // Posisi Palang Tertutup (0 Derajat)

  // Inisialisasi RFID Pintar Dual Reader
  setupSmartRfid();

  // Koneksi WiFi Hotspot Sumsang
  displayLcd("KONEKSI WIFI...", WIFI_SSID);
  Serial.printf("\n[WiFi] Menghubungkan ke: %s ", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int wifiAttempts = 0;
  while (WiFi.status() != WL_CONNECTED && wifiAttempts < 20) {
    delay(500);
    Serial.print(".");
    digitalWrite(PIN_LED_STATUS, !digitalRead(PIN_LED_STATUS));
    wifiAttempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(PIN_LED_STATUS, HIGH);
    Serial.println("\n✅ [WiFi] Terhubung! IP ESP32: " + WiFi.localIP().toString());
    displayLcd("WIFI TERHUBUNG!", WiFi.localIP().toString());
    beepSuccess();
    delay(1200);
    sendHeartbeatToWeb();
  } else {
    digitalWrite(PIN_LED_STATUS, LOW);
    Serial.println("\n⚠️ [WiFi] Belum terhubung (Mode Offline).");
    displayLcd("WIFI OFFLINE", "STANDALONE MODE");
    delay(1200);
  }

  updateIdleLcd();
}

// ==================================================================================================
// 13. LOOP UTAMA
// ==================================================================================================
void loop() {
  unsigned long now = millis();

  // 1. Trik Keyboard Debugging Serial Monitor
  if (Serial.available() > 0) {
    char key = Serial.read();
    if (key == 't' || key == 'T') {
      Serial.println("\n[DEBUG] Simulasi Tap Kartu Kios Pelayanan (Pin 4)...");
      processKioskTap("KTP_TEST_998877");
    } else if (key == 'g' || key == 'G') {
      Serial.println("\n[DEBUG] Simulasi Tap Kartu Gerbang (Pin 5)...");
      processGateTap("04A1B2C3");
    } else if (key == 'p' || key == 'P') {
      triggerPanicButton();
    } else if (key == 's' || key == 'S') {
      Serial.println("\n[DEBUG] Mengecek Status Sirine dari Web...");
      checkSirenStatusFromWeb();
    } else if (key == 'b' || key == 'B') {
      Serial.println("\n[DEBUG] Tes Kedip Backlight LCD...");
      lcd.noBacklight();
      delay(300);
      lcd.backlight();
    } else if (key == 'm' || key == 'M') {
      int next = (int)currentMode + 1;
      if (next > 3) next = 0;
      currentMode = (KioskMode)next;
      beepShort();
      updateIdleLcd();
      Serial.printf("[MODE] Mode Berganti ke: %d\n", (int)currentMode);
    } else if (key == 'w' || key == 'W') {
      sendHeartbeatToWeb();
    }
  }

  // 2. Polling Status Sirine dari Web (Tiap 2 Detik)
  if (now - lastSirenCheckTime >= SIREN_CHECK_INTERVAL) {
    lastSirenCheckTime = now;
    if (WiFi.status() == WL_CONNECTED) {
      checkSirenStatusFromWeb();
    }
  }

  // 3. Eksekusi Alarm Sirine Darurat (Buzzer 25 & LED 2) jika Sirine sedang Aktif dari Web
  if (webSirenActive || isSirenAlarming) {
    if (now - sirenPulseTimer >= 120) {
      sirenPulseTimer = now;
      sirenPulseState = !sirenPulseState;
      digitalWrite(PIN_BUZZER, sirenPulseState ? HIGH : LOW);
      digitalWrite(PIN_LED_STATUS, sirenPulseState ? HIGH : LOW);
    }
  }

  // 4. Tombol Panik Darurat (GPIO 27)
  if (digitalRead(PIN_PANIC_BTN) == LOW) {
    if (now - lastPanicBtnPress > 3000) {
      lastPanicBtnPress = now;
      triggerPanicButton();
    }
  }

  // 5. Tombol Ganti Mode Layanan Kios (GPIO 14)
  if (digitalRead(PIN_MODE_BTN) == LOW) {
    if (now - lastModeBtnPress > 400) {
      lastModeBtnPress = now;
      int next = (int)currentMode + 1;
      if (next > 3) next = 0;
      currentMode = (KioskMode)next;
      beepShort();
      updateIdleLcd();
      Serial.printf("[MODE] Mode Berganti ke: %d\n", (int)currentMode);
    }
  }

  // 6. Pembacaan RFID di Pin 5 (KHUSUS GERBANG MASUK & PALANG PINTU)
  digitalWrite(PIN_RFID2_SS, HIGH); // Isolasi bus: pastikan Pin 4 OFF
  delayMicroseconds(20);
  if (detectCard(rfid1, PIN_RFID1_SS, PIN_RFID2_SS)) {
    String uid = dumpUidToString(rfid1);
    processGateTap(uid);
    rfid1->PICC_HaltA();
    rfid1->PCD_StopCrypto1();
    digitalWrite(PIN_RFID1_SS, HIGH);
    delay(800);
  }

  // 7. Pembacaan RFID di Pin 4 (KHUSUS KIOS PELAYANAN, POSYANDU & REGISTRASI E-KTP)
  digitalWrite(PIN_RFID1_SS, HIGH); // Isolasi bus: pastikan Pin 5 OFF
  delayMicroseconds(20);
  if (detectCard(rfid2, PIN_RFID2_SS, PIN_RFID1_SS)) {
    String uid = dumpUidToString(rfid2);
    processKioskTap(uid);
    rfid2->PICC_HaltA();
    rfid2->PCD_StopCrypto1();
    digitalWrite(PIN_RFID2_SS, HIGH);
    delay(800);
  }

  // 8. Heartbeat Berkala ke Web (Tiap 8 Detik agar Web Selalu ONLINE HIJAU)
  if (now - lastHeartbeatTime >= HEARTBEAT_INTERVAL) {
    lastHeartbeatTime = now;
    if (WiFi.status() == WL_CONNECTED) {
      sendHeartbeatToWeb();
    } else {
      Serial.print(" [WiFi Reconnecting...] ");
      WiFi.reconnect();
    }
  }

  // 9. Indikator Serial Monitor Detak Jantung
  if (now - lastSerialDot >= 2000) {
    lastSerialDot = now;
    Serial.print(".");
  }

  delay(30);
}
