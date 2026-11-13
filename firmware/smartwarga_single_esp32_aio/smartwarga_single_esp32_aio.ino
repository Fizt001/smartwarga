/*
 * ==================================================================================================
 * SMART-WARGA: ALL-IN-ONE (AIO) IOT CONTROLLER FIRMWARE (v3.5 DYNAMIC PROVISIONING & NVS)
 * Target Hardware: Single ESP32 DevKit V1 (30-pin / 38-pin)
 * 
 * FITUR ARSITEKTUR TERBARU:
 * 1. ZERO HARDCODED WI-FI:
 *    - Kredensial Wi-Fi (SSID, Password) dan Token Perangkat disimpan di NVS via Preferences.h
 * 2. AUTOMATIC AP PROVISIONING (CAPTIVE PORTAL / REST API):
 *    - Jika belum terkonfigurasi atau gagal konek ke router, otomatis menyalakan Access Point (AP)
 *      SSID: "SmartWarga-Setup" | Password: "12345678" | IP: 192.168.4.1
 *    - Menjalankan WebServer lokal REST API (Port 80) dengan header CORS lengkap:
 *      * GET  /api/wifi/scan    -> Scan Wi-Fi sekitar & return JSON [{ssid, rssi, secure}]
 *      * POST /api/wifi/connect -> Terima JSON {ssid, password, device_token}, simpan ke NVS,
 *                                  dan coba hubungkan ke router
 *      * GET  /api/status       -> Cek status mode (AP / STA), IP, dan koneksi
 * 3. VALIDASI & HANDSHAKE SERVER:
 *    - Setelah terkoneksi ke router (STA), ESP32 mengirim heartbeat ke server web dengan device_token
 *      sehingga status perangkat di web langsung berubah menjadi ONLINE HIJAU.
 * 4. DUAL RFID RC522:
 *    - Reader 1 (SDA: GPIO 5) -> Gerbang Tol / Akses Masuk + Palang Servo (GPIO 13)
 *    - Reader 2 (SDA: GPIO 4) -> Kios Pelayanan & Antrean Terpadu / Bank Sampah
 * 5. LAYAR LCD 16x2 I2C (Alamat 0x27):
 *    - Menampilkan panduan setup AP (192.168.4.1) saat offline, status kartu & antrean saat online.
 * 6. SIRINE WILAYAH & TOMBOL PANIK (GPIO 27):
 *    - Polling status sirine dari server tiap 2 detik, buzzer aktif & LED 2 menyala otomatis.
 * ==================================================================================================
 */

#include <WiFi.h>
#include <WiFiAP.h>
#include <WebServer.h>
#include <Preferences.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ESP32Servo.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ArduinoJson.h>

// ==================================================================================================
// 1. KONFIGURASI DEFAULT SERVER & AP MODE
// ==================================================================================================
const char* AP_SSID_NAME     = "SmartWarga-Setup";
const char* AP_PASSWORD      = "12345678";
const IPAddress AP_LOCAL_IP(192, 168, 4, 1);
const IPAddress AP_GATEWAY(192, 168, 4, 1);
const IPAddress AP_SUBNET(255, 255, 255, 0);

// Domain Server Production SMART-WARGA
const char* DEFAULT_API_BASE_URL = "https://swarga.manajemensystem.my.id";

// Namespace NVS Preferences
const char* PREF_NAMESPACE = "swarga_iot";

// Variabel Konfigurasi Dinamis (disimpan di NVS)
String savedSsid        = "";
String savedPassword    = "";
String savedDeviceToken = "";
String apiBaseUrl       = DEFAULT_API_BASE_URL;

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
Preferences preferences;
WebServer localServer(80);
MFRC522* rfid1 = nullptr; // Reader 1 di Pin 5 (Gerbang)
MFRC522* rfid2 = nullptr; // Reader 2 di Pin 4 (Kios)
Servo gateServo;
LiquidCrystal_I2C lcd(0x27, 16, 2);

enum SystemMode {
  SYSTEM_MODE_AP_PROVISIONING, // Mode Access Point untuk Setup Wi-Fi via Web
  SYSTEM_MODE_STA_ONLINE,       // Mode Normal Terhubung ke Router & Server
  SYSTEM_MODE_STA_CONNECTING    // Mode Transisi Menghubungkan ke Wi-Fi
};

enum KioskMode {
  MODE_PELAYANAN_TERPADU, // Mode 0: Antrean Meja Pelayanan Warga (Default)
  MODE_BANK_PLASTIK,      // Mode 1: Timbangan Bank Sampah Plastik
  MODE_BANK_KALENG,       // Mode 2: Timbangan Bank Sampah Kaleng
  MODE_GERBANG_MANUAL     // Mode 3: Gerbang Manual
};

SystemMode currentSystemMode = SYSTEM_MODE_AP_PROVISIONING;
KioskMode currentKioskMode   = MODE_PELAYANAN_TERPADU;

// Timers
unsigned long lastHeartbeatTime   = 0;
const unsigned long HEARTBEAT_INTERVAL = 8000; // Kirim tiap 8 detik
unsigned long lastSirenCheckTime  = 0;
const unsigned long SIREN_CHECK_INTERVAL = 2000; // Cek status sirine tiap 2 detik
unsigned long lastModeBtnPress    = 0;
unsigned long lastPanicBtnPress   = 0;
unsigned long lastSerialDot       = 0;
unsigned long sirenPulseTimer     = 0;
bool sirenPulseState              = false;
bool isSirenAlarming              = false;
bool webSirenActive               = false;
String webSirenReason             = "";

// Flag permintaan reconnect dari WebServer
bool pendingWifiConnect           = false;
String pendingSsid                = "";
String pendingPassword            = "";

// Forward declarations
void startApProvisioningMode();
bool connectToSavedWifi(int timeoutSeconds = 18);
void sendHeartbeatToWeb();
void updateIdleLcd();
void displayLcd(String line1, String line2);
void beepSuccess();
void beepShort();
void beepReject();
void blinkAlienCardAlert(int count = 6);

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

void blinkAlienCardAlert(int count) {
  for (int i = 0; i < count; i++) {
    digitalWrite(PIN_LED_STATUS, HIGH);
    digitalWrite(PIN_BUZZER, HIGH);
    delay(90);
    digitalWrite(PIN_LED_STATUS, LOW);
    digitalWrite(PIN_BUZZER, LOW);
    delay(90);
  }
}

void soundAlarmSirene(int cycles) {
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
  if (currentSystemMode == SYSTEM_MODE_AP_PROVISIONING) {
    displayLcd("SETUP AP: AKTIF", "IP: 192.168.4.1");
    return;
  }

  if (webSirenActive) {
    displayLcd("!! SIRENE AKTIF !!", webSirenReason.length() > 0 ? webSirenReason : "BAHAYA / DARURAT");
    return;
  }

  String modeName = "TEMPELKAN KARTU";
  if (currentKioskMode == MODE_BANK_PLASTIK) modeName = "MD:BS-PLASTIK   ";
  else if (currentKioskMode == MODE_BANK_KALENG) modeName = "MD:BS-KALENG    ";
  else if (currentKioskMode == MODE_GERBANG_MANUAL) modeName = "MD:GERBANG-ONLY ";

  displayLcd("SMART-WARGA AIO", modeName);
}

void initLcdHardware() {
  pinMode(PIN_I2C_SDA, INPUT_PULLUP);
  pinMode(PIN_I2C_SCL, INPUT_PULLUP);
  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
  Wire.setClock(100000);

  Serial.println("➡️ Menginisialisasi LCD 16x2 di alamat 0x27...");
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("SMART-WARGA AIO");
  lcd.setCursor(0, 1);
  lcd.print("MEMUAT SISTEM...");
  Serial.println("✅ Layar LCD 16x2 Berhasil Dinyalakan!");
}

// ==================================================================================================
// 6. MANAJEMEN PENYIMPANAN NVS (PREFERENCES.H)
// ==================================================================================================
void loadCredentialsFromNVS() {
  preferences.begin(PREF_NAMESPACE, true); // Read-only mode
  savedSsid        = preferences.getString("ssid", "");
  savedPassword    = preferences.getString("password", "");
  savedDeviceToken = preferences.getString("token", "");
  apiBaseUrl       = preferences.getString("server", DEFAULT_API_BASE_URL);
  preferences.end();

  Serial.println("\n--- [MEMBACA KREDENSIAL NVS MEMORY] ---");
  Serial.printf("SSID Tersimpan       : %s\n", savedSsid.length() > 0 ? savedSsid.c_str() : "(Kosong / Belum Ada)");
  Serial.printf("Password Tersimpan   : %s\n", savedPassword.length() > 0 ? "********" : "(Kosong)");
  Serial.printf("Device Token         : %s\n", savedDeviceToken.length() > 0 ? savedDeviceToken.c_str() : "(Belum Terdaftar)");
  Serial.printf("API Server Target    : %s\n", apiBaseUrl.c_str());
  Serial.println("----------------------------------------\n");
}

void saveCredentialsToNVS(String ssid, String password, String token) {
  preferences.begin(PREF_NAMESPACE, false); // Read-write mode
  preferences.putString("ssid", ssid);
  preferences.putString("password", password);
  if (token.length() > 0) {
    preferences.putString("token", token);
  }
  preferences.end();

  savedSsid = ssid;
  savedPassword = password;
  if (token.length() > 0) savedDeviceToken = token;

  Serial.println("💾 [NVS] Kredensial Wi-Fi & Device Token berhasil disimpan secara persisten ke Flash!");
}

void resetCredentialsNVS() {
  preferences.begin(PREF_NAMESPACE, false);
  preferences.clear();
  preferences.end();

  savedSsid = "";
  savedPassword = "";
  savedDeviceToken = "";
  Serial.println("⚠️ [NVS] Kredensial telah di-reset! Beralih ke Mode AP Setup.");
  beepReject();
  startApProvisioningMode();
}

// ==================================================================================================
// 7. REST API ENDPOINTS PADA LOCAL WEBSERVER (PORT 80)
// ==================================================================================================
void setCorsHeaders() {
  localServer.sendHeader("Access-Control-Allow-Origin", "*");
  localServer.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  localServer.sendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
}

// Handle CORS Preflight OPTIONS
void handleCorsPreflight() {
  setCorsHeaders();
  localServer.send(204);
}

// GET /api/wifi/scan -> Scan Wi-Fi & Return JSON Array
void handleApiWifiScan() {
  setCorsHeaders();
  Serial.println("🔍 [REST API] Menerima request pemindaian Wi-Fi (/api/wifi/scan)...");
  displayLcd("MEMINDAI WIFI...", "MOHON TUNGGU..");

  int n = WiFi.scanNetworks();
  Serial.printf("✅ Ditemukan %d jaringan Wi-Fi di sekitar ESP32.\n", n);

  DynamicJsonDocument doc(2048);
  JsonArray array = doc.to<JsonArray>();

  for (int i = 0; i < n; ++i) {
    String foundSsid = WiFi.SSID(i);
    if (foundSsid.length() == 0) continue;

    JsonObject netObj = array.createNestedObject();
    netObj["ssid"]   = foundSsid;
    netObj["rssi"]   = WiFi.RSSI(i);
    netObj["secure"] = (WiFi.encryptionType(i) != WIFI_AUTH_OPEN);
  }

  String response;
  serializeJson(doc, response);
  localServer.send(200, "application/json", response);

  updateIdleLcd();
}

// POST /api/wifi/connect -> Terima payload {ssid, password, device_token}
void handleApiWifiConnect() {
  setCorsHeaders();

  if (!localServer.hasArg("plain")) {
    localServer.send(400, "application/json", "{\"success\":false,\"message\":\"Payload kosong\"}");
    return;
  }

  String body = localServer.arg("plain");
  Serial.printf("📥 [REST API] Payload Konfigurasi Diterima: %s\n", body.c_str());

  DynamicJsonDocument doc(1024);
  DeserializationError err = deserializeJson(doc, body);
  if (err) {
    localServer.send(400, "application/json", "{\"success\":false,\"message\":\"Format JSON tidak valid\"}");
    return;
  }

  String reqSsid     = doc["ssid"].as<String>();
  String reqPassword = doc["password"].as<String>();
  String reqToken    = doc["device_token"].as<String>();

  if (reqSsid.length() == 0) {
    localServer.send(422, "application/json", "{\"success\":false,\"message\":\"SSID tidak boleh kosong\"}");
    return;
  }

  // Simpan ke NVS Preferences
  saveCredentialsToNVS(reqSsid, reqPassword, reqToken);

  // Response sukses ke Web Frontend
  DynamicJsonDocument resDoc(256);
  resDoc["success"] = true;
  resDoc["message"] = "Konfigurasi diterima. Menghubungkan ESP32 ke Wi-Fi router...";
  resDoc["ssid"] = reqSsid;
  String resStr;
  serializeJson(resDoc, resStr);
  localServer.send(200, "application/json", resStr);

  // Jadwalkan koneksi di loop utama
  pendingSsid = reqSsid;
  pendingPassword = reqPassword;
  pendingWifiConnect = true;
}

// GET /api/status -> Status ESP32
void handleApiStatus() {
  setCorsHeaders();
  DynamicJsonDocument doc(512);
  doc["system_mode"]    = (currentSystemMode == SYSTEM_MODE_STA_ONLINE) ? "STA_ONLINE" : "AP_PROVISIONING";
  doc["wifi_connected"] = (WiFi.status() == WL_CONNECTED);
  doc["ip_address"]     = (WiFi.status() == WL_CONNECTED) ? WiFi.localIP().toString() : WiFi.softAPIP().toString();
  doc["ssid"]           = savedSsid;
  doc["device_token"]   = savedDeviceToken;
  doc["uptime_ms"]      = millis();

  String resStr;
  serializeJson(doc, resStr);
  localServer.send(200, "application/json", resStr);
}

void setupLocalWebServer() {
  localServer.on("/api/wifi/scan", HTTP_OPTIONS, handleCorsPreflight);
  localServer.on("/api/wifi/scan", HTTP_GET, handleApiWifiScan);

  localServer.on("/api/wifi/connect", HTTP_OPTIONS, handleCorsPreflight);
  localServer.on("/api/wifi/connect", HTTP_POST, handleApiWifiConnect);

  localServer.on("/api/status", HTTP_OPTIONS, handleCorsPreflight);
  localServer.on("/api/status", HTTP_GET, handleApiStatus);

  localServer.onNotFound([]() {
    setCorsHeaders();
    if (localServer.method() == HTTP_OPTIONS) {
      localServer.send(204);
    } else {
      localServer.send(404, "application/json", "{\"error\":\"Endpoint tidak ditemukan\"}");
    }
  });

  localServer.begin();
  Serial.println("🌐 Local WebServer REST API (Port 80) Aktif!");
}

// ==================================================================================================
// 8. MANAJEMEN MODE KONEKSI (AP PROVISIONING VS STA ONLINE)
// ==================================================================================================
void startApProvisioningMode() {
  currentSystemMode = SYSTEM_MODE_AP_PROVISIONING;
  WiFi.disconnect(true);
  delay(100);

  WiFi.mode(WIFI_AP_STA);
  WiFi.softAPConfig(AP_LOCAL_IP, AP_GATEWAY, AP_SUBNET);
  WiFi.softAP(AP_SSID_NAME, AP_PASSWORD);

  Serial.println("\n=================================================================");
  Serial.println("        🛠️ MODE AP PROVISIONING (SETUP WI-FI) DIAKTIFKAN        ");
  Serial.println("=================================================================");
  Serial.printf("SSID Hotspot  : %s\n", AP_SSID_NAME);
  Serial.printf("Password      : %s\n", AP_PASSWORD);
  Serial.printf("IP Gateway    : %s\n", WiFi.softAPIP().toString().c_str());
  Serial.println("Silakan buka Dashboard Warga menu 'Koneksi Wi-Fi IoT' untuk setup.");
  Serial.println("=================================================================\n");

  displayLcd("SETUP AP: AKTIF", "192.168.4.1");
  digitalWrite(PIN_LED_STATUS, LOW);
}

bool connectToSavedWifi(int timeoutSeconds) {
  if (savedSsid.length() == 0) {
    Serial.println("⚠️ [WiFi] Belum ada SSID tersimpan di NVS.");
    return false;
  }

  currentSystemMode = SYSTEM_MODE_STA_CONNECTING;
  Serial.printf("\n[WiFi] Menghubungkan ke Router: %s ", savedSsid.c_str());
  displayLcd("KONEKSI WIFI...", savedSsid);

  WiFi.mode(WIFI_AP_STA);
  WiFi.begin(savedSsid.c_str(), savedPassword.c_str());

  int attempts = 0;
  int maxAttempts = timeoutSeconds * 2;
  while (WiFi.status() != WL_CONNECTED && attempts < maxAttempts) {
    delay(500);
    Serial.print(".");
    digitalWrite(PIN_LED_STATUS, !digitalRead(PIN_LED_STATUS));
    localServer.handleClient();
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    currentSystemMode = SYSTEM_MODE_STA_ONLINE;
    digitalWrite(PIN_LED_STATUS, HIGH);
    Serial.println("\n✅ [WiFi] Sukses Terhubung!");
    Serial.printf("IP ESP32 : %s\n", WiFi.localIP().toString().c_str());
    displayLcd("WIFI TERHUBUNG!", WiFi.localIP().toString());
    beepSuccess();
    delay(1200);

    // Kirim handshake pertama kali ke backend
    sendHeartbeatToWeb();
    updateIdleLcd();
    return true;
  } else {
    Serial.println("\n❌ [WiFi] Gagal terhubung ke router. Kembali ke Mode AP Setup.");
    digitalWrite(PIN_LED_STATUS, LOW);
    displayLcd("GAGAL KONEK WIFI", "KEMBALI KE SETUP");
    beepReject();
    delay(1500);
    startApProvisioningMode();
    return false;
  }
}

// ==================================================================================================
// 9. PEMBACAAN RAW HX711 (TIMBANGAN LOAD CELL 5KG)
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
  if (raw == 0) return 450.0;
  float weight = abs((float)raw) / 420.0;
  if (weight < 10.0) weight = 200.0;
  return weight;
}

// ==================================================================================================
// 10. INISIALISASI & DETEKSI RFID RC522 (PIN 4 & PIN 5)
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

  digitalWrite(inactiveSsPin, HIGH);
  digitalWrite(activeSsPin, LOW);
  delayMicroseconds(20);

  dev->PCD_WriteRegister(MFRC522::RFCfgReg, 0x07 << 4);

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

  // Reader 1 di Pin 5 (Gerbang)
  digitalWrite(PIN_RFID2_SS, HIGH);
  digitalWrite(PIN_RFID1_SS, LOW);
  rfid1 = new MFRC522(PIN_RFID1_SS, PIN_RFID_RST);
  rfid1->PCD_Init();
  delay(30);
  byte v1 = rfid1->PCD_ReadRegister(MFRC522::VersionReg);
  digitalWrite(PIN_RFID1_SS, HIGH);
  Serial.printf("Reader 1 [GERBANG - SDA: GPIO 5] Versi Firmware: 0x%02X\n", v1);

  // Reader 2 di Pin 4 (Kios)
  digitalWrite(PIN_RFID1_SS, HIGH);
  digitalWrite(PIN_RFID2_SS, LOW);
  rfid2 = new MFRC522(PIN_RFID2_SS, PIN_RFID_RST);
  rfid2->PCD_Init();
  delay(30);
  byte v2 = rfid2->PCD_ReadRegister(MFRC522::VersionReg);
  digitalWrite(PIN_RFID2_SS, HIGH);
  Serial.printf("Reader 2 [KIOS PELAYANAN - SDA: GPIO 4] Versi Firmware: 0x%02X\n", v2);
}

void openGateBarrier() {
  Serial.println("🚪 [SERVO] Membuka Palang Gerbang (90 Derajat)...");
  gateServo.write(90);
  delay(4000);
  Serial.println("🚪 [SERVO] Menutup Kembali Palang Gerbang (0 Derajat)...");
  gateServo.write(0);
}

// ==================================================================================================
// 11. LOGIKA TAP KARTU READER 1 & READER 2
// ==================================================================================================
void processGateTap(String rfidUid) {
  Serial.println("\n=======================================================");
  Serial.printf("🚗 [GERBANG TOL - PIN 5] Kartu Di-tap! UID: [ %s ]\n", rfidUid.c_str());
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
  String url = apiBaseUrl + "/api/iot/ronda/tap";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("User-Agent", "ESP32-AIO-Gate");

  StaticJsonDocument<256> doc;
  doc["rfid_uid"]     = rfidUid;
  doc["post_id"]      = "POS_GERBANG_UTAMA";
  doc["device_token"] = savedDeviceToken;
  String payload;
  serializeJson(doc, payload);

  int code = http.POST(payload);
  String response = http.getString();
  http.end();

  Serial.printf("[WEB /ronda/tap] HTTP Status: %d -> Response: %s\n", code, response.c_str());

  if (code == 200) {
    StaticJsonDocument<512> resDoc;
    deserializeJson(resDoc, response);

    String name  = resDoc["user"]["name"].as<String>();
    String line1 = resDoc["lcd_line1"].as<String>();
    String line2 = resDoc["lcd_line2"].as<String>();

    displayLcd(line1.length() > 0 ? line1 : name, 
               line2.length() > 0 ? line2 : "GERBANG TERBUKA");
    beepSuccess();
    openGateBarrier();
  } else {
    displayLcd("KARTU ASING!", "TIDAK TERDAFTAR");
    Serial.println("❌ [DITOLAK] Kartu asing / belum terdaftar!");
    blinkAlienCardAlert(6);
    delay(1000);
  }

  updateIdleLcd();
}

void processKioskTap(String rfidUid) {
  Serial.println("\n=======================================================");
  Serial.printf("📋 [PELAYANAN - PIN 4] Kartu Di-tap di Kios! UID: [ %s ]\n", rfidUid.c_str());
  Serial.println("=======================================================");

  beepShort();
  displayLcd("KIOS PELAYANAN", "UID: " + rfidUid);

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ [ERROR] WiFi terputus, tidak dapat mengirim ke server.");
    displayLcd("WIFI OFFLINE", "HUBUNGKAN WIFI");
    beepReject();
    delay(1500);
    updateIdleLcd();
    return;
  }

  if (currentKioskMode == MODE_BANK_PLASTIK || currentKioskMode == MODE_BANK_KALENG) {
    String kategori = (currentKioskMode == MODE_BANK_PLASTIK) ? "plastik" : "kaleng";
    float berat = getWeightGram();

    displayLcd("MENIMBANG SAMPAH", String(berat, 0) + "g " + kategori);

    HTTPClient http;
    String url = apiBaseUrl + "/api/iot/bank-sampah/setor";
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("User-Agent", "ESP32-AIO-Kiosk");

    StaticJsonDocument<256> doc;
    doc["rfid_uid"]     = rfidUid;
    doc["kategori"]     = kategori;
    doc["berat_gram"]   = berat;
    doc["device_token"] = savedDeviceToken;
    String payload;
    serializeJson(doc, payload);

    int code = http.POST(payload);
    http.end();

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
    HTTPClient http;
    String url = apiBaseUrl + "/api/iot/pelayanan/tap";
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("User-Agent", "ESP32-AIO-Kiosk");

    StaticJsonDocument<256> doc;
    doc["rfid_uid"]     = rfidUid;
    doc["device_id"]    = "AIO_KIOSK_PIN4";
    doc["device_token"] = savedDeviceToken;
    String payload;
    serializeJson(doc, payload);

    int code = http.POST(payload);
    String response = http.getString();
    http.end();

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
        beepSuccess();
        delay(2000);
      } else {
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
// 12. FITUR TOMBOL PANIK DARURAT (GPIO 27)
// ==================================================================================================
void triggerPanicButton() {
  Serial.println("\n🚨 [ALERT] TOMBOL PANIK DARURAT DITEKAN!");
  displayLcd("!! PANIK AKTIF !!", "MENGIRIM ALARM..");
  isSirenAlarming = true;

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = apiBaseUrl + "/api/iot/panic-button";
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("User-Agent", "ESP32-AIO-SmartWarga");

    StaticJsonDocument<256> doc;
    doc["post_id"]      = "POS_01";
    doc["reason"]       = "Tombol Panik Hardware Pos AIO Ditekan";
    doc["device_token"] = savedDeviceToken;
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
// 13. HEARTBEAT ONLINE & STATUS SIRINE DARI WEB
// ==================================================================================================
void applySirenState(bool active, String reason) {
  if (active != webSirenActive) {
    webSirenActive = active;
    webSirenReason = reason;

    if (webSirenActive) {
      Serial.println("\n🚨🚨 [ALERT WEB] SIRINE WILAYAH DIAKTIFKAN DARI WEB! 🚨🚨");
      displayLcd("!! SIRENE AKTIF !!", webSirenReason.length() > 0 ? webSirenReason : "BAHAYA / DARURAT");
    } else {
      Serial.println("\n🟢 [INFO] Sirine dinonaktifkan dari web. Buzzer dimatikan.");
      digitalWrite(PIN_BUZZER, LOW);
      digitalWrite(PIN_LED_STATUS, (WiFi.status() == WL_CONNECTED) ? HIGH : LOW);
      updateIdleLcd();
    }
  }
}

void checkSirenStatusFromWeb() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = apiBaseUrl + "/api/iot/sirine/status";
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
  String url = apiBaseUrl + "/api/iot/heartbeat";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("User-Agent", "ESP32-AIO-SmartWarga");

  StaticJsonDocument<256> doc;
  doc["device_type"]  = "all";
  doc["device_key"]   = "DEVICE_AIO_SWARGA";
  doc["device_token"] = savedDeviceToken;
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
// 14. SETUP UTAMA
// ==================================================================================================
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n");
  Serial.println("=================================================================");
  Serial.println("    SMART-WARGA: AIO IOT CONTROLLER v3.5 (DYNAMIC PROVISIONING) ");
  Serial.println("=================================================================");
  Serial.println("PETUNJUK SERIAL MONITOR:");
  Serial.println("  't' + Enter -> Simulasi Tap Kartu Kios (Pin 4)");
  Serial.println("  'g' + Enter -> Simulasi Tap Kartu Gerbang (Pin 5)");
  Serial.println("  'p' + Enter -> Tes Tombol Panik");
  Serial.println("  'r' + Enter -> Reset NVS Wi-Fi & Kembali ke Mode AP Setup");
  Serial.println("  's' + Enter -> Cek Status Sirine dari Web");
  Serial.println("  'm' + Enter -> Ganti Mode Layanan Kios");
  Serial.println("  'w' + Enter -> Kirim Heartbeat Manual");
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

  // Inisialisasi LCD 16x2
  initLcdHardware();

  // Inisialisasi Servo Palang Pintu
  ESP32PWM::allocateTimer(0);
  gateServo.setPeriodHertz(50);
  gateServo.attach(PIN_SERVO_GATE, 500, 2400);
  gateServo.write(0);

  // Inisialisasi Dual RFID RC522
  setupSmartRfid();

  // Inisialisasi Local WebServer REST API (Port 80)
  setupLocalWebServer();

  // Baca Kredensial NVS
  loadCredentialsFromNVS();

  // Jika ada SSID tersimpan, coba hubungkan ke router
  if (savedSsid.length() > 0) {
    if (!connectToSavedWifi(15)) {
      startApProvisioningMode();
    }
  } else {
    Serial.println("⚠️ Belum ada konfigurasi Wi-Fi. Mengaktifkan Mode AP Provisioning...");
    startApProvisioningMode();
  }

  updateIdleLcd();
}

// ==================================================================================================
// 15. LOOP UTAMA
// ==================================================================================================
void loop() {
  unsigned long now = millis();

  // 1. Selalu Layani Local WebServer (Port 80)
  localServer.handleClient();

  // 2. Eksekusi Permintaan Koneksi Wi-Fi dari Form Web jika ada
  if (pendingWifiConnect) {
    pendingWifiConnect = false;
    Serial.printf("\n🔄 [PROVISIONING] Memproses permintaan koneksi ke: %s\n", pendingSsid.c_str());
    connectToSavedWifi(20);
  }

  // 3. Trik Keyboard Debugging Serial Monitor
  if (Serial.available() > 0) {
    char key = Serial.read();
    if (key == 't' || key == 'T') {
      Serial.println("\n[DEBUG] Simulasi Tap Kios Pelayanan (Pin 4)...");
      processKioskTap("KTP_TEST_998877");
    } else if (key == 'g' || key == 'G') {
      Serial.println("\n[DEBUG] Simulasi Tap Gerbang (Pin 5)...");
      processGateTap("04A1B2C3");
    } else if (key == 'p' || key == 'P') {
      triggerPanicButton();
    } else if (key == 'r' || key == 'R') {
      resetCredentialsNVS();
    } else if (key == 's' || key == 'S') {
      checkSirenStatusFromWeb();
    } else if (key == 'm' || key == 'M') {
      int next = (int)currentKioskMode + 1;
      if (next > 3) next = 0;
      currentKioskMode = (KioskMode)next;
      beepShort();
      updateIdleLcd();
      Serial.printf("[MODE] Mode Berganti ke: %d\n", (int)currentKioskMode);
    } else if (key == 'w' || key == 'W') {
      sendHeartbeatToWeb();
    }
  }

  // 4. Polling Status Sirine dari Web tiap 2 detik (Hanya saat STA Online)
  if (now - lastSirenCheckTime >= SIREN_CHECK_INTERVAL) {
    lastSirenCheckTime = now;
    if (WiFi.status() == WL_CONNECTED) {
      checkSirenStatusFromWeb();
    }
  }

  // 5. Eksekusi Alarm Sirine Darurat (Buzzer 25 & LED 2)
  if (webSirenActive || isSirenAlarming) {
    if (now - sirenPulseTimer >= 120) {
      sirenPulseTimer = now;
      sirenPulseState = !sirenPulseState;
      digitalWrite(PIN_BUZZER, sirenPulseState ? HIGH : LOW);
      digitalWrite(PIN_LED_STATUS, sirenPulseState ? HIGH : LOW);
    }
  }

  // 6. Tombol Panik Darurat Fisik (GPIO 27)
  if (digitalRead(PIN_PANIC_BTN) == LOW) {
    if (now - lastPanicBtnPress > 3000) {
      lastPanicBtnPress = now;
      triggerPanicButton();
    }
  }

  // 7. Tombol Mode (GPIO 14): Klik biasa ganti mode, Tahan 5 detik reset Wi-Fi
  if (digitalRead(PIN_MODE_BTN) == LOW) {
    unsigned long pressStart = millis();
    while (digitalRead(PIN_MODE_BTN) == LOW) {
      delay(50);
      if (millis() - pressStart > 5000) {
        // Tahan 5 detik -> Reset NVS Wi-Fi
        Serial.println("⚠️ [TOMBOL MODE] Ditekan 5 detik: RESET NVS WI-FI!");
        resetCredentialsNVS();
        while (digitalRead(PIN_MODE_BTN) == LOW) delay(100);
        return;
      }
    }
    if (millis() - pressStart > 200 && millis() - pressStart < 2000) {
      int next = (int)currentKioskMode + 1;
      if (next > 3) next = 0;
      currentKioskMode = (KioskMode)next;
      beepShort();
      updateIdleLcd();
      Serial.printf("[MODE] Mode Berganti ke: %d\n", (int)currentKioskMode);
    }
  }

  // 8. Pembacaan RFID di Pin 5 (GERBANG MASUK)
  digitalWrite(PIN_RFID2_SS, HIGH);
  delayMicroseconds(20);
  if (detectCard(rfid1, PIN_RFID1_SS, PIN_RFID2_SS)) {
    String uid = dumpUidToString(rfid1);
    processGateTap(uid);
    rfid1->PICC_HaltA();
    rfid1->PCD_StopCrypto1();
    digitalWrite(PIN_RFID1_SS, HIGH);
    delay(800);
  }

  // 9. Pembacaan RFID di Pin 4 (KIOS PELAYANAN & POSYANDU)
  digitalWrite(PIN_RFID1_SS, HIGH);
  delayMicroseconds(20);
  if (detectCard(rfid2, PIN_RFID2_SS, PIN_RFID1_SS)) {
    String uid = dumpUidToString(rfid2);
    processKioskTap(uid);
    rfid2->PICC_HaltA();
    rfid2->PCD_StopCrypto1();
    digitalWrite(PIN_RFID2_SS, HIGH);
    delay(800);
  }

  // 10. Heartbeat Berkala ke Web (Tiap 8 Detik agar Web Selalu ONLINE HIJAU)
  if (now - lastHeartbeatTime >= HEARTBEAT_INTERVAL) {
    lastHeartbeatTime = now;
    if (WiFi.status() == WL_CONNECTED) {
      sendHeartbeatToWeb();
    } else if (currentSystemMode == SYSTEM_MODE_STA_ONLINE) {
      Serial.print(" [WiFi Reconnecting...] ");
      WiFi.reconnect();
    }
  }

  // 11. Indikator Serial Monitor Detak Jantung
  if (now - lastSerialDot >= 2000) {
    lastSerialDot = now;
    Serial.print(".");
  }

  delay(30);
}
