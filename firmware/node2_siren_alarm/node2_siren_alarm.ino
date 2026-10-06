/*
 * ==================================================================================
 * SMART-WARGA IoT Node 2: Titik Sirine Wilayah RT (Alarm Wilayah Terdistribusi)
 * Hardware: ESP32 DevKit V1 + Modul Relay 5V + Horn Sirine 12V/220V + Strobe LED
 * Backend Endpoint: http://smartwarga.test (atau IP lokal host, misal: 192.168.1.50)
 * ==================================================================================
 *
 * WIRING DIAGRAM (ESP32):
 * ----------------------------------------------------
 * MODUL RELAY 5V (Pemicu Sirine):
 *   - VCC   -> 5V (VIN)
 *   - GND   -> GND
 *   - IN    -> GPIO 26 (Active LOW atau Active HIGH)
 *
 * LED INDIKATOR STATUS ALARM:
 *   - Anoda -> GPIO 2 (Melalui Resistor 220 Ohm)
 *   - Katoda-> GND
 * ----------------------------------------------------
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ====== KONFIGURASI WIFI & SERVER ======
const char* WIFI_SSID     = "SMART_WARGA_WIFI";
const char* WIFI_PASSWORD = "wargadigital2026";

// IP VPS Production SMART-WARGA (Port 8004 - Bebas konflik dengan SIAKAD Hub)
const char* API_BASE_URL  = "http://202.155.13.156:8004"; 

// ====== PIN DEFINITIONS ======
#define RELAY_PIN       26   // Kontrol Horn Sirine
#define LED_PIN         2    // Status LED Internal / External
#define RELAY_ACTIVE_LEVEL LOW  // LOW = Relay Nyala (Modul Relay Optocoupler umumnya Active LOW)
#define RELAY_IDLE_LEVEL   HIGH

// Interval Polling (Detik)
const unsigned long POLL_INTERVAL_MS = 3000; 
unsigned long lastPollTime = 0;

bool currentSirenState = false;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n[NODE 2] Inisialisasi Titik Sirine Wilayah SMART-WARGA...");

  pinMode(RELAY_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);

  // Pastikan sirine mati saat start up
  digitalWrite(RELAY_PIN, RELAY_IDLE_LEVEL);
  digitalWrite(LED_PIN, LOW);

  connectToWiFi();

  Serial.println("[NODE 2] Siap memantau status darurat dari Server...");
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }

  unsigned long currentMillis = millis();
  if (currentMillis - lastPollTime >= POLL_INTERVAL_MS) {
    lastPollTime = currentMillis;
    checkSirenStatus();
  }

  // Jika sirine aktif, buat pola kedip LED darurat
  if (currentSirenState) {
    digitalWrite(LED_PIN, (millis() / 250) % 2 == 0 ? HIGH : LOW);
  } else {
    digitalWrite(LED_PIN, LOW);
  }
}

// ====== CEK STATUS SIRINE KE SERVER ======
void checkSirenStatus() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(API_BASE_URL) + "/api/iot/sirine/status";
  http.begin(url);
  http.setTimeout(3000);

  int httpCode = http.GET();

  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();
    
    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, payload);

    if (!error) {
      bool sirenActive = doc["siren_active"] | false;
      const char* reason = doc["reason"] | "";

      if (sirenActive != currentSirenState) {
        currentSirenState = sirenActive;

        if (currentSirenState) {
          Serial.println("\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
          Serial.println("[ALARM AKTIF] BAHAYA / KEADAAN DARURAT TERDETEKSI!");
          Serial.printf("Alasan: %s\n", reason);
          Serial.println(">> MENYALAKAN RELAY SIRINE <<");
          Serial.println("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
          digitalWrite(RELAY_PIN, RELAY_ACTIVE_LEVEL);
        } else {
          Serial.println("\n[ALARM DINONAKTIFKAN] Kondisi Wilayah Kembali Normal.");
          Serial.println(">> MEMATIKAN RELAY SIRINE <<");
          digitalWrite(RELAY_PIN, RELAY_IDLE_LEVEL);
        }
      }
    }
  } else {
    Serial.printf("[WARN] Gagal menghubungi endpoint sirine (Kode: %d)\n", httpCode);
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
    Serial.println("\nWiFi belum terhubung.");
  }
}
