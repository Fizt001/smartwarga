/*
 * ==================================================================================================
 * SMART-WARGA: SKETCH PANCINGAN & PENGUJIAN STEP-BY-STEP (ESP32 <-> RFID <-> WEB)
 * Folder: firmware/test_rfid_ktp_web/test_rfid_ktp_web.ino
 * ==================================================================================================
 * 
 * TUJUAN SKETCH INI:
 * 1. Pancing & deteksi hardware RFID RC522 secara langsung (Pin 4 & Pin 5)
 * 2. Tes pembacaan fisik e-KTP & Pin Tag biru dengan sensitivitas antena MAKSIMAL (48dB)
 * 3. Tes konektivitas ESP32 ke Web SMART-WARGA (swarga.manajemensystem.my.id)
 * 4. TRIK PANCINGAN: Bisa ketik 't' di Serial Monitor untuk simulasi tap kartu ke website!
 * 
 * WIRING RFID RC522 KE ESP32:
 * - 3.3V  -> 3V3 (JANGAN 5V!)
 * - GND   -> GND
 * - RST   -> GPIO 26 (atau GPIO 22)
 * - MISO  -> GPIO 19
 * - MOSI  -> GPIO 23
 * - SCK   -> GPIO 18
 * - SDA   -> GPIO 4 (atau GPIO 5) -> sketch ini otomatis mendeteksi mana yang dicolok!
 * ==================================================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ArduinoJson.h>

// ==================================================================================================
// 1. KONFIGURASI WIFI & SERVER WEB
// ==================================================================================================
const char* WIFI_SSID     = "Sumsang";                      // Sesuaikan jika berubah
const char* WIFI_PASSWORD = "123456789";         // Masukkan password hotspot Anda
const char* API_BASE_URL  = "https://swarga.manajemensystem.my.id";

// PIN DEFINISI
#define PIN_SPI_SCK   18
#define PIN_SPI_MISO  19
#define PIN_SPI_MOSI  23
#define PIN_RFID_RST  26    // Ubah ke 22 jika Anda menyambung RST ke 22
#define PIN_SDA_A     4     // Kandidat Pin SDA 1
#define PIN_SDA_B     5     // Kandidat Pin SDA 2

#define PIN_LED       2     // On-board LED Biru ESP32 (indikator tap)
#define PIN_BUZZER    25    // Buzzer (opsional)

// Objek RFID
MFRC522* rfidActive = nullptr;
int activeSdaPin = -1;

// Timer & Counter
unsigned long lastSerialDot = 0;
unsigned long lastWebHeartbeat = 0;
const unsigned long HEARTBEAT_INTERVAL = 8000; // Kirim tiap 8 detik agar status Web SELALU ONLINE (HIJAU)
unsigned long scanCount = 0;

// ==================================================================================================
// HELPER BACA UID KARTU MENJADI STRING HEX
// ==================================================================================================
String getUidString(MFRC522* dev) {
  String uid = "";
  for (byte i = 0; i < dev->uid.size; i++) {
    if (dev->uid.uidByte[i] < 0x10) uid += "0";
    uid += String(dev->uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  return uid;
}

// ==================================================================================================
// HELPER IDENTIFIKASI TIPE KARTU (e-KTP vs MIFARE PIN TAG)
// ==================================================================================================
String getCardTypeName(byte piccType) {
  switch (piccType) {
    case MFRC522::PICC_TYPE_ISO_14443_4:
      return "e-KTP (Smart Card ISO 14443-4)";
    case MFRC522::PICC_TYPE_MIFARE_1K:
      return "Mifare Classic 1K (Pin Tag Biru / Kartu Putih)";
    case MFRC522::PICC_TYPE_MIFARE_4K:
      return "Mifare Classic 4K";
    case MFRC522::PICC_TYPE_MIFARE_UL:
      return "Mifare Ultralight";
    default:
      return "Kartu RFID 13.56 MHz (Tipe: " + String(piccType) + ")";
  }
}

// ==================================================================================================
// CEK KEBERADAAN KARTU (DUAL METHOD: REQA + WUPA WAKE-UP UNTUK e-KTP)
// ==================================================================================================
bool detectCardPresent(MFRC522* dev) {
  if (!dev) return false;
  // Cara 1: Standar RequestA
  if (dev->PICC_IsNewCardPresent()) return true;

  // Cara 2: Wake-Up WUPA (Wajib untuk e-KTP SmartMX dan Tag Clone)
  byte bufferATQA[2];
  byte bufferSize = sizeof(bufferATQA);
  MFRC522::StatusCode status = dev->PICC_WakeupA(bufferATQA, &bufferSize);
  return (status == MFRC522::STATUS_OK);
}

// ==================================================================================================
// KIRIM HASIL SCAN KE WEBSITE SMART-WARGA
// ==================================================================================================
void sendScanToWeb(String rfidUid, String sourceLabel) {
  scanCount++;
  Serial.println("\n=======================================================");
  Serial.printf("🎉 [%lu] KARTU TERDETEKSI DARI %s!\n", scanCount, sourceLabel.c_str());
  Serial.println("=======================================================");
  Serial.printf(">>> UID KARTU: [ %s ] <<<\n", rfidUid.c_str());

  // Indikator LED berkedip cepat
  digitalWrite(PIN_LED, HIGH);
  digitalWrite(PIN_BUZZER, HIGH);
  delay(120);
  digitalWrite(PIN_BUZZER, LOW);
  delay(80);
  digitalWrite(PIN_BUZZER, HIGH);
  delay(120);
  digitalWrite(PIN_BUZZER, LOW);
  digitalWrite(PIN_LED, LOW);

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ [WEB] WiFi belum tersambung! Data UID belum bisa dikirim ke web.");
    Serial.println("   (Tapi hardware RFID Anda SUDAH 100% SUKSES membaca kartu!)");
    return;
  }

  Serial.println("[WEB] Mengirim UID ke Server SMART-WARGA...");
  Serial.printf("      Target URL: %s/api/iot/ktp/scan\n", API_BASE_URL);

  HTTPClient http;
  String url = String(API_BASE_URL) + "/api/iot/ktp/scan";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("User-Agent", "ESP32-Tester-SmartWarga");

  StaticJsonDocument<256> doc;
  doc["rfid_uid"]  = rfidUid;
  doc["device_id"] = "TEST_ENROLLER_ESP32";
  String payload;
  serializeJson(doc, payload);

  int httpCode = http.POST(payload);
  String response = http.getString();
  http.end();

  if (httpCode == 200 || httpCode == 201) {
    Serial.println("✅ [BERHASIL 200] Data UID berhasil diterima server!");
    Serial.println("   Sekarang buka website SMART-WARGA -> Login -> Klik 'Tautkan e-KTP'.");
    Serial.printf("   Response Server: %s\n", response.c_str());
  } else {
    Serial.printf("❌ [GAGAL HTTP %d] Respon server: %s\n", httpCode, response.c_str());
  }
  Serial.println("-------------------------------------------------------\n");
}

// ==================================================================================================
// KIRIM HEARTBEAT BERKALA KE WEBSITE (MENJAGA STATUS WEB SELALU ONLINE HIJAU)
// ==================================================================================================
void sendHeartbeatToWeb() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(API_BASE_URL) + "/api/iot/heartbeat";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("User-Agent", "ESP32-Tester-SmartWarga");

  StaticJsonDocument<128> doc;
  doc["device_type"] = "all";
  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  http.end();

  if (code == 200) {
    Serial.print(" [💚 WEB ONLINE] ");
  } else {
    Serial.printf(" [⚠️ Heartbeat HTTP %d] ", code);
  }
}

// ==================================================================================================
// TEST PING KE WEBSITE (UNTUK MEMASTIKAN ESP32 BISA AKSES CLOUD)
// ==================================================================================================
void testWebPing() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ [PING] WiFi tidak terhubung.");
    return;
  }

  Serial.println("\n[PING] Mencoba menghubungi website SMART-WARGA...");
  HTTPClient http;
  String url = String(API_BASE_URL) + "/api/iot/heartbeat";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<128> doc;
  doc["device_type"] = "all";
  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  http.end();

  if (code == 200) {
    Serial.printf("✅ [PING SUKSES] Website merespon HTTP %d! (Koneksi ESP32 -> Web NORMAL)\n", code);
  } else {
    Serial.printf("⚠️ [PING GAGAL] HTTP Status: %d\n", code);
  }
}

// ==================================================================================================
// SETUP DETEKSI PIN RFID
// ==================================================================================================
void initRfidHardware() {
  pinMode(PIN_RFID_RST, OUTPUT);
  digitalWrite(PIN_RFID_RST, LOW);
  delay(30);
  digitalWrite(PIN_RFID_RST, HIGH);
  delay(30);

  SPI.begin(PIN_SPI_SCK, PIN_SPI_MISO, PIN_SPI_MOSI);

  Serial.println("\n--- [MEMERIKSA SAMBUNGAN KABEL RFID RC522] ---");

  // Tes Pin 4
  pinMode(PIN_SDA_A, OUTPUT);
  digitalWrite(PIN_SDA_A, HIGH);
  MFRC522 testA(PIN_SDA_A, MFRC522::UNUSED_PIN);
  testA.PCD_Init();
  byte verA = testA.PCD_ReadRegister(MFRC522::VersionReg);
  Serial.printf("-> Pin 4 (GPIO 4): Firmware Version = 0x%02X %s\n", 
                verA, (verA != 0x00 && verA != 0xFF) ? "✅ TERHUBUNG!" : "(Tidak Terhubung)");

  // Tes Pin 5
  pinMode(PIN_SDA_B, OUTPUT);
  digitalWrite(PIN_SDA_B, HIGH);
  MFRC522 testB(PIN_SDA_B, MFRC522::UNUSED_PIN);
  testB.PCD_Init();
  byte verB = testB.PCD_ReadRegister(MFRC522::VersionReg);
  Serial.printf("-> Pin 5 (GPIO 5): Firmware Version = 0x%02X %s\n", 
                verB, (verB != 0x00 && verB != 0xFF) ? "✅ TERHUBUNG!" : "(Tidak Terhubung)");

  // Pilih Pin yang terhubung
  if (verA != 0x00 && verA != 0xFF) {
    activeSdaPin = PIN_SDA_A;
    Serial.println("🌟 Menggunakan Pin SDA di GPIO 4.");
  } else if (verB != 0x00 && verB != 0xFF) {
    activeSdaPin = PIN_SDA_B;
    Serial.println("🌟 Menggunakan Pin SDA di GPIO 5.");
  } else {
    activeSdaPin = PIN_SDA_A; // Default ke Pin 4
    Serial.println("⚠️ RC522 belum terdeteksi di Pin 4 maupun Pin 5.");
    Serial.println("   Periksa kabel 3.3V, GND, MOSI(23), MISO(19), SCK(18), RST(26/22).");
  }

  // Buat instance pembaca aktif
  if (rfidActive) delete rfidActive;
  rfidActive = new MFRC522(activeSdaPin, MFRC522::UNUSED_PIN);
  rfidActive->PCD_Init();
  
  // RAHASIA AGAR e-KTP & PIN TAG RESPON CEPAT: ANTENNA GAIN MAKSIMAL (48dB)
  rfidActive->PCD_SetAntennaGain(MFRC522::RxGain_max);

  Serial.printf("✅ Modul RFID Siap di GPIO %d dengan Sensitivitas Antena Maksimal (48dB)!\n", activeSdaPin);
}

// ==================================================================================================
// SETUP
// ==================================================================================================
void setup() {
  Serial.begin(115200);
  delay(1200);

  pinMode(PIN_LED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_LED, LOW);
  digitalWrite(PIN_BUZZER, LOW);

  Serial.println("\n");
  Serial.println("=================================================================");
  Serial.println("       SMART-WARGA: TESTER PANCINGAN RFID e-KTP & WEB API        ");
  Serial.println("=================================================================");
  Serial.println("PETUNJUK TRIK PANCINGAN SERIAL MONITOR:");
  Serial.println("1. Tempelkan e-KTP atau Pin Tag biru ke sensor untuk membaca.");
  Serial.println("2. Ketik huruf 't' lalu tekan ENTER untuk SIMULASI TAP KARTU ke web.");
  Serial.println("3. Ketik huruf 'w' lalu tekan ENTER untuk TEST PING KONEKSI WEB.");
  Serial.println("4. Ketik huruf 's' lalu tekan ENTER untuk SCAN ULANG PIN RFID.");
  Serial.println("=================================================================");

  // Inisialisasi RFID
  initRfidHardware();

  // Koneksi WiFi Hotspot
  Serial.printf("\n[WiFi] Menghubungkan ke hotspot: %s ", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    digitalWrite(PIN_LED, !digitalRead(PIN_LED));
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(PIN_LED, HIGH);
    Serial.println("\n✅ [WiFi] Terhubung! IP Lokal ESP32: " + WiFi.localIP().toString());
    testWebPing();
  } else {
    digitalWrite(PIN_LED, LOW);
    Serial.println("\n⚠️ [WiFi] Belum terhubung (mode offline). Pastikan password hotspot benar.");
    Serial.println("   (Anda tetap bisa test baca RFID secara offline terlebih dahulu!)");
  }

  Serial.println("\n>>> SILAKAN TEMPELKAN e-KTP ATAU PIN TAG KE MODUL RC522 SEKARANG! <<<");
  Serial.println("----------------------------------------------------------------------");
}

// ==================================================================================================
// LOOP
// ==================================================================================================
void loop() {
  unsigned long now = millis();

  // 1. Trik Keyboard Serial Monitor
  if (Serial.available() > 0) {
    char key = Serial.read();
    if (key == 't' || key == 'T') {
      Serial.println("\n[TRIK PANCINGAN] Mensimulasikan Tap e-KTP Dummy ke Website...");
      sendScanToWeb("KTP_TEST_998877", "SIMULASI KEYBOARD 'T'");
    } else if (key == 'w' || key == 'W') {
      testWebPing();
    } else if (key == 's' || key == 'S') {
      initRfidHardware();
    }
  }

  // 2. Deteksi Kartu Fisik
  if (detectCardPresent(rfidActive)) {
    if (rfidActive->PICC_ReadCardSerial()) {
      String uid = getUidString(rfidActive);
      byte piccType = rfidActive->PICC_GetType(rfidActive->uid.sak);
      String cardTypeName = getCardTypeName(piccType);

      Serial.println("\n-------------------------------------------------------");
      Serial.printf("✨ Tipe Kartu: %s\n", cardTypeName.c_str());
      sendScanToWeb(uid, "SENSOR FISIK RC522 (GPIO " + String(activeSdaPin) + ")");

      // Istirahatkan kartu agar tidak terbaca spam
      rfidActive->PICC_HaltA();
      rfidActive->PCD_StopCrypto1();
      delay(1200);
    }
  }

  // 3. Pengiriman Heartbeat Berkala ke Server (Tiap 8 Detik agar Web Selalu ONLINE HIJAU)
  if (now - lastWebHeartbeat >= HEARTBEAT_INTERVAL) {
    lastWebHeartbeat = now;
    if (WiFi.status() == WL_CONNECTED) {
      sendHeartbeatToWeb();
    } else {
      Serial.print(" [WiFi Terputus, mencoba konek ulang...] ");
      WiFi.reconnect();
    }
  }

  // 4. Detak Jantung di Serial Monitor (Tiap 2 detik)
  if (now - lastSerialDot >= 2000) {
    lastSerialDot = now;
    Serial.print(".");
  }

  delay(30);
}

