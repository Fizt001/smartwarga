/*
 * ==================================================================================
 * SMART-WARGA IoT Node 1: Pos Satpam / Gerbang Masuk Utama
 * Hardware: ESP32 DevKit V1 + RFID RC522 (SPI) + Servo SG90 + Push Button + I2C LCD
 * Backend Endpoint: http://smartwarga.test (atau IP lokal server Herd, misal: 192.168.1.100)
 * ==================================================================================
 *
 * WIRING DIAGRAM (ESP32):
 * ----------------------------------------------------
 * RFID RC522 (SPI):
 *   - VCC   -> 3.3V
 *   - RST   -> GPIO 22
 *   - GND   -> GND
 *   - MISO  -> GPIO 19 (MISO)
 *   - MOSI  -> GPIO 23 (MOSI)
 *   - SCK   -> GPIO 18 (SCK)
 *   - SDA/SS-> GPIO 21
 *
 * SERVO SG90 (Palang Pintu):
 *   - Signal-> GPIO 13
 *   - VCC   -> 5V (VIN)
 *   - GND   -> GND
 *
 * PANIC BUTTON (Tombol Darurat Hardware):
 *   - Pin 1 -> GPIO 4 (Internal PULLUP)
 *   - Pin 2 -> GND
 *
 * LCD I2C 16x2 (Opsional):
 *   - SDA   -> GPIO 21 (atau software I2C / GPIO 14)
 *   - SCL   -> GPIO 22 (atau software I2C / GPIO 27)
 *   - VCC   -> 5V, GND -> GND
 * ----------------------------------------------------
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ESP32Servo.h>
#include <ArduinoJson.h>

// ====== KONFIGURASI WIFI & SERVER ======
const char* WIFI_SSID     = "SMART_WARGA_WIFI";
const char* WIFI_PASSWORD = "wargadigital2026";

// IP VPS Production SMART-WARGA (Port 8004 - Bebas konflik dengan SIAKAD Hub)
const char* API_BASE_URL  = "http://202.155.13.156:8004"; 
const char* POST_ID       = "POS_01";

// ====== PIN DEFINITIONS ======
#define SS_PIN          21
#define RST_PIN         22
#define SERVO_PIN       13
#define PANIC_BTN_PIN   4
#define BUZZER_PIN      15
#define LED_INDICATOR   2

// ====== OBJECT INITIALIZATION ======
MFRC522 rfc522(SS_PIN, RST_PIN);
Servo gateServo;

// Debounce Panic Button
volatile bool panicTriggered = false;
unsigned long lastPanicTime = 0;

void IRAM_ATTR handlePanicInterrupt() {
  unsigned long now = millis();
  if (now - lastPanicTime > 3000) { // Debounce 3 detik
    panicTriggered = true;
    lastPanicTime = now;
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n[NODE 1] Inisialisasi Pos Satpam SMART-WARGA...");

  // Pin Modes
  pinMode(PANIC_BTN_PIN, INPUT_PULLUP);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_INDICATOR, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_INDICATOR, LOW);

  // Attach Interrupt Panic Button
  attachInterrupt(digitalPinToInterrupt(PANIC_BTN_PIN), handlePanicInterrupt, FALLING);

  // Inisialisasi Servo
  ESP32PWM::allocateTimer(0);
  gateServo.setPeriodHertz(50);
  gateServo.attach(SERVO_PIN, 500, 2400);
  gateServo.write(0); // Posisi Palang Tertutup (0 Derajat)

  // Inisialisasi SPI & RFID
  SPI.begin();
  rfc522.PCD_Init();
  delay(100);
  rfc522.PCD_DumpVersionToSerial();

  // Koneksi WiFi
  connectToWiFi();

  Serial.println("[NODE 1] Siap Beroperasi! Silakan tap kartu RFID atau tekan Panic Button.");
}

void loop() {
  // 1. Cek Koneksi WiFi
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }

  // 2. Handle Panic Button Darurat
  if (panicTriggered) {
    panicTriggered = false;
    sendPanicAlert();
  }

  // 3. Cek apakah ada kartu RFID didekatkan
  if (!rfc522.PICC_IsNewCardPresent() || !rfc522.PICC_ReadCardSerial()) {
    delay(50);
    return;
  }

  // Baca UID Kartu RFID
  String rfidUid = "";
  for (byte i = 0; i < rfc522.uid.size; i++) {
    if (rfc522.uid.uidByte[i] < 0x10) rfidUid += "0";
    rfidUid += String(rfc522.uid.uidByte[i], HEX);
  }
  rfidUid.toUpperCase();

  Serial.print("\n[RFID Dideteksi] UID: ");
  Serial.println(rfidUid);

  // Beep feedback saat kartu terbaca
  beep(1, 100);

  // Kirim data absensi / tap gerbang ke Backend Laravel
  sendRondaTap(rfidUid);

  // Hentikan enkripsi pada kartu yang terbaca
  rfc522.PICC_HaltA();
  rfc522.PCD_StopCrypto1();

  delay(1000);
}

// ====== FUNGSI KIRIM TAP RONDA & BUKA PALANG ======
void sendRondaTap(String uid) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[ERROR] WiFi Terputus!");
    return;
  }

  HTTPClient http;
  String url = String(API_BASE_URL) + "/api/iot/ronda/tap";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  // Siapkan Payload JSON
  StaticJsonDocument<200> doc;
  doc["rfid_uid"] = uid;
  doc["post_id"]  = POST_ID;

  String requestBody;
  serializeJson(doc, requestBody);

  Serial.println("[HTTP POST] Mengirim ke: " + url);
  int httpCode = http.POST(requestBody);

  if (httpCode > 0) {
    String payload = http.getString();
    Serial.print("[HTTP RESPONSE ");
    Serial.print(httpCode);
    Serial.println("]: " + payload);

    StaticJsonDocument<512> resDoc;
    DeserializationError error = deserializeJson(resDoc, payload);

    if (!error) {
      bool gateOpen = resDoc["gate_open"] | false;
      const char* msg = resDoc["message"] | "";

      if (gateOpen) {
        Serial.println(">> AKSES DITERIMA: " + String(msg));
        beep(2, 80); // 2 kali beep cepat tanda sukses
        bukaPalangPintu();
      } else {
        Serial.println(">> AKSES DITOLAK: " + String(msg));
        beep(1, 600); // 1 kali beep panjang tanda gagal
      }
    }
  } else {
    Serial.printf("[ERROR] HTTP Request Gagal: %s\n", http.errorToString(httpCode).c_str());
  }

  http.end();
}

// ====== FUNGSI BUKA SERVO PALANG PINTU ======
void bukaPalangPintu() {
  digitalWrite(LED_INDICATOR, HIGH);
  Serial.println(">> Palang Terbuka (Servo 90 Derajat)");
  gateServo.write(90); // Palang Terbuka
  delay(4000);        // Palang terbuka selama 4 detik

  Serial.println(">> Menutup Palang (Servo 0 Derajat)");
  gateServo.write(0);  // Palang Menutup
  digitalWrite(LED_INDICATOR, LOW);
}

// ====== FUNGSI KIRIM PANIC BUTTON ======
void sendPanicAlert() {
  Serial.println("\n[ALARM] !!! PANIC BUTTON POS SATPAM DITEKAN !!!");
  beep(4, 150);

  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(API_BASE_URL) + "/api/iot/panic-button";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<200> doc;
  doc["location"] = "Pos Gerbang Utama RT 01-03";
  doc["trigger_type"] = "hardware_button";

  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = http.POST(requestBody);
  if (httpCode > 0) {
    Serial.println("[PANIC SUCCESS] Notifikasi Darurat Terkirim ke Server!");
  } else {
    Serial.println("[PANIC FAILED] Gagal menghubungi server.");
  }
  http.end();
}

void connectToWiFi() {
  Serial.print("Menghubungkan ke WiFi: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Terhubung! IP Address: " + WiFi.localIP().toString());
  } else {
    Serial.println("\nGagal terhubung WiFi. Akan mencoba lagi di background.");
  }
}

void beep(int times, int durationMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(durationMs);
    digitalWrite(BUZZER_PIN, LOW);
    if (i < times - 1) delay(100);
  }
}
