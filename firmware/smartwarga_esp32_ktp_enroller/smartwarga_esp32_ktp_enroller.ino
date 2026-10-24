/*
 * ==================================================================================================
 * SMART-WARGA: DEDICATED ESP32 e-KTP / RFID ENROLLER (DESK SCANNER)
 * File: smartwarga_esp32_ktp_enroller.ino
 * Target Hardware: ESP32 DevKit V1 (30-pin / 38-pin)
 * Perangkat Keras yang Dibutuhkan:
 *   1. 1x ESP32 DevKit V1
 *   2. 1x Modul RFID RC522 (13.56 MHz SPI)
 *   3. 1x Active Buzzer 5V (Audio feedback bip sukses/gagal)
 *   4. 1x LED Indikator (Bisa gunakan On-board LED GPIO 2)
 *
 * FUNGSI UTAMA:
 * Perangkat ini diletakkan di Meja Administrasi RT / Pos Ronda / Kios Mandiri.
 * Warga cukup menempelkan e-KTP / kartu RFID mereka ke sensor ini.
 * UID kartu secara instan dikirim ke backend SMART-WARGA (/api/iot/ktp/scan)
 * sehingga warga dapat menautkannya secara mandiri dari layar smartphone mereka.
 * ==================================================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ArduinoJson.h>

// ==================================================================================================
// 1. KONFIGURASI WIFI & SERVER API
// ==================================================================================================
const char* WIFI_SSID     = "SMART_WARGA_WIFI";
const char* WIFI_PASSWORD = "wargadigital2026";

// URL Server Backend SMART-WARGA
const char* API_BASE_URL  = "https://swarga.manajemensystem.my.id"; // Atau IP Mac Herd Anda
const char* DEVICE_ID     = "ENROLLER_DESK_01";

// ==================================================================================================
// 2. PEMETAAN PIN WIRING (HANYA 7 KABEL KE RFID RC522)
// ==================================================================================================
// ⚠️ PERINGATAN TEGANGAN: VCC RC522 WAJIB KE PIN 3.3V ESP32 (JANGAN 5V!)
#define PIN_RC522_VCC     // Hubungkan ke pin 3V3 ESP32
#define PIN_RC522_GND     // Hubungkan ke pin GND ESP32
#define PIN_RC522_RST     22    // Pin Reset ke GPIO 22
#define PIN_RC522_SDA     5     // Pin Chip Select (SS) ke GPIO 5
#define PIN_RC522_SCK     18    // Pin Clock SPI ke GPIO 18
#define PIN_RC522_MOSI    23    // Pin Master Out Slave In ke GPIO 23
#define PIN_RC522_MISO    19    // Pin Master In Slave Out ke GPIO 19

#define PIN_BUZZER        25    // Pin Positif Buzzer ke GPIO 25, Negatif ke GND
#define PIN_LED_STATUS    2     // On-board LED biru ESP32

MFRC522 rfid(PIN_RC522_SDA, PIN_RC522_RST);

// ==================================================================================================
// 3. AUDIO FEEDBACK NADA BUZZER
// ==================================================================================================
void beepSuccess() {
  digitalWrite(PIN_LED_STATUS, HIGH);
  digitalWrite(PIN_BUZZER, HIGH);
  delay(100);
  digitalWrite(PIN_BUZZER, LOW);
  delay(80);
  digitalWrite(PIN_BUZZER, HIGH);
  delay(150);
  digitalWrite(PIN_BUZZER, LOW);
  digitalWrite(PIN_LED_STATUS, LOW);
}

void beepReject() {
  for (int i = 0; i < 3; i++) {
    digitalWrite(PIN_BUZZER, HIGH);
    digitalWrite(PIN_LED_STATUS, HIGH);
    delay(120);
    digitalWrite(PIN_BUZZER, LOW);
    digitalWrite(PIN_LED_STATUS, LOW);
    delay(100);
  }
}

// Helper dump UID ke HEX string uppercase
String dumpUidToString(MFRC522 &sensor) {
  String uidStr = "";
  for (byte i = 0; i < sensor.uid.size; i++) {
    if (sensor.uid.uidByte[i] < 0x10) uidStr += "0";
    uidStr += String(sensor.uid.uidByte[i], HEX);
  }
  uidStr.toUpperCase();
  return uidStr;
}

// ==================================================================================================
// 4. PENGIRIMAN DATA SCAN KTP KE REST API
// ==================================================================================================
void sendKtpScan(String rfidUid) {
  Serial.println("\n---------------------------------------------------");
  Serial.print("[e-KTP SCANNER] Kartu Terdeteksi UID: ");
  Serial.println(rfidUid);

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[ERROR] Wi-Fi terputus! Tidak dapat mengirim data scan.");
    beepReject();
    return;
  }

  HTTPClient http;
  String url = String(API_BASE_URL) + "/api/iot/ktp/scan";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("User-Agent", "ESP32-KTP-Enroller");

  StaticJsonDocument<256> doc;
  doc["rfid_uid"]  = rfidUid;
  doc["device_id"] = DEVICE_ID;
  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = http.POST(requestBody);
  String response = http.getString();
  http.end();

  Serial.printf("[HTTP] Status: %d | Response: %s\n", httpCode, response.c_str());

  if (httpCode == 200) {
    StaticJsonDocument<512> resDoc;
    deserializeJson(resDoc, response);
    bool alreadyRegistered = resDoc["already_registered"].as<bool>();
    String message = resDoc["message"].as<String>();

    Serial.println("[SUKSES] " + message);
    if (alreadyRegistered) {
      Serial.println("[INFO] Kartu sudah memiliki pemilik terdaftar.");
    } else {
      Serial.println("[INFO] Kartu baru siap ditautkan warga di aplikasi web!");
    }
    beepSuccess();
  } else {
    Serial.println("[GAGAL] Server menolak request scan KTP.");
    beepReject();
  }
  Serial.println("---------------------------------------------------");
}

// ==================================================================================================
// 5. SETUP
// ==================================================================================================
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=======================================================");
  Serial.println("   SMART-WARGA DEDICATED e-KTP SCANNER BOOTING...     ");
  Serial.println("=======================================================");

  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_LED_STATUS, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);
  digitalWrite(PIN_LED_STATUS, LOW);

  // Inisialisasi Bus SPI & Reader RC522
  SPI.begin(PIN_RC522_SCK, PIN_RC522_MISO, PIN_RC522_MOSI);
  rfid.PCD_Init();
  delay(50);
  Serial.print("RFID RC522 Scanner Ready. Firmware Version: ");
  rfid.PCD_DumpVersionToSerial();

  // Koneksi WiFi
  Serial.printf("Menghubungkan ke Wi-Fi '%s' ", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(400);
    digitalWrite(PIN_LED_STATUS, !digitalRead(PIN_LED_STATUS));
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(PIN_LED_STATUS, HIGH);
    Serial.println("\n[WiFi] Berhasil Terhubung! IP: " + WiFi.localIP().toString());
    beepSuccess();
  } else {
    digitalWrite(PIN_LED_STATUS, LOW);
    Serial.println("\n[WiFi] Gagal terhubung ke WiFi. Periksa SSID & Password.");
    beepReject();
  }

  Serial.println("\n>>> SIAP! Tempelkan e-KTP / Kartu RFID ke sensor...");
}

// ==================================================================================================
// 6. LOOP UTAMA
// ==================================================================================================
void loop() {
  // Cek apakah ada kartu e-KTP baru di depan sensor
  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    String uid = dumpUidToString(rfid);
    sendKtpScan(uid);

    // Stop enkripsi dan istirahatkan kartu agar tidak terbaca berulang-ulang
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    delay(1000); // Debounce delay 1 detik
  }

  delay(50);
}
