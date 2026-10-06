/*
 * ==================================================================================
 * SMART-WARGA IoT Node 3: Terminal Mandiri Bank Sampah & Posyandu Balita
 * Hardware: ESP32 + RFID RC522 + Timbangan HX711 Load Cell + Sensor Jarak HC-SR04 + LCD I2C
 * Backend Endpoint: http://smartwarga.test (atau IP lokal host, misal: 192.168.1.50)
 * ==================================================================================
 *
 * WIRING DIAGRAM (ESP32):
 * ----------------------------------------------------
 * RFID RC522 (SPI):
 *   - SDA/SS -> GPIO 5
 *   - SCK    -> GPIO 18
 *   - MOSI   -> GPIO 23
 *   - MISO   -> GPIO 19
 *   - RST    -> GPIO 4
 *   - 3.3V & GND
 *
 * LOAD CELL + MODUL HX711 (Timbangan Digital):
 *   - DT/DOUT-> GPIO 16
 *   - SCK    -> GPIO 17
 *   - VCC    -> 5V, GND -> GND
 *
 * SENSOR ULTRA SONIK HC-SR04 (Pengukur Tinggi Balita):
 *   - TRIG   -> GPIO 12
 *   - ECHO   -> GPIO 14
 *   - VCC    -> 5V, GND -> GND
 *
 * TOMBOL PEMILIH KATEGORI / MODE:
 *   - Tombol 1 (Kaleng / Mode Toggle)  -> GPIO 32 (PULLUP)
 *   - Tombol 2 (Plastik / Tare Scale)  -> GPIO 33 (PULLUP)
 *
 * LCD I2C 16x2:
 *   - SDA    -> GPIO 21
 *   - SCL    -> GPIO 22
 *   - VCC    -> 5V, GND -> GND
 * ----------------------------------------------------
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ArduinoJson.h>

// ====== KONFIGURASI WIFI & SERVER ======
const char* WIFI_SSID     = "SMART_WARGA_WIFI";
// IP VPS Production SMART-WARGA (Port 8004 - Bebas konflik dengan SIAKAD Hub)
const char* API_BASE_URL  = "http://202.155.13.156:8004"; 

// ====== PIN DEFINITIONS ======
#define RFID_SS_PIN     5
#define RFID_RST_PIN    4

#define HX711_DOUT_PIN  16
#define HX711_SCK_PIN   17

#define US_TRIG_PIN     12
#define US_ECHO_PIN     14

#define BTN_KALENG      32
#define BTN_PLASTIK     33
#define BUZZER_PIN      15

// Inisialisasi Perangkat
MFRC522 rfc522(RFID_SS_PIN, RFID_RST_PIN);
LiquidCrystal_I2C lcd(0x27, 16, 2); // Alamat I2C 0x27 atau 0x3F

enum TerminalMode {
  MODE_BANK_SAMPAH,
  MODE_POSYANDU
};

TerminalMode currentMode = MODE_BANK_SAMPAH;
String selectedCategory = "kaleng"; // "kaleng" atau "plastik"

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n[NODE 3] Inisialisasi Terminal Bank Sampah & Posyandu...");

  pinMode(BTN_KALENG, INPUT_PULLUP);
  pinMode(BTN_PLASTIK, INPUT_PULLUP);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(US_TRIG_PIN, OUTPUT);
  pinMode(US_ECHO_PIN, INPUT);

  // Inisialisasi LCD
  Wire.begin(21, 22);
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("SMART-WARGA IOT");
  lcd.setCursor(0, 1);
  lcd.print("Booting Sistem..");

  // Inisialisasi SPI & RFID
  SPI.begin();
  rfc522.PCD_Init();

  connectToWiFi();

  updateLcdDisplay();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }

  // 1. Cek Tombol Pilihan Kategori / Switch
  handleButtons();

  // 2. Cek apakah ada kartu RFID ditempelkan
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

  Serial.printf("\n[RFID TAP] Mode: %s | UID: %s\n", 
    currentMode == MODE_BANK_SAMPAH ? "Bank Sampah" : "Posyandu", 
    rfidUid.c_str()
  );

  beep(1, 100);

  if (currentMode == MODE_BANK_SAMPAH) {
    prosesBankSampah(rfidUid);
  } else {
    prosesPosyandu(rfidUid);
  }

  rfc522.PICC_HaltA();
  rfc522.PCD_StopCrypto1();

  delay(2000);
  updateLcdDisplay();
}

// ====== PROSES SETOR BANK SAMPAH ======
void prosesBankSampah(String uid) {
  // Simulasi pembacaan Load Cell HX711 (Gram)
  // Pada implementasi fisik: ganti dengan hx711.get_units(10)
  float beratGram = bacaLoadCellGram();

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Memproses Data..");
  lcd.setCursor(0, 1);
  lcd.printf("%s: %.0fg", selectedCategory.c_str(), beratGram);

  HTTPClient http;
  String url = String(API_BASE_URL) + "/api/iot/bank-sampah/setor";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> doc;
  doc["rfid_uid"]   = uid;
  doc["kategori"]   = selectedCategory;
  doc["berat_gram"] = beratGram;

  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = http.POST(requestBody);

  if (httpCode > 0) {
    String payload = http.getString();
    Serial.println("[RESPONSE]: " + payload);

    StaticJsonDocument<512> resDoc;
    deserializeJson(resDoc, payload);

    bool success = resDoc["success"] | false;
    const char* line1 = resDoc["lcd_line1"] | "SUKSES";
    const char* line2 = resDoc["lcd_line2"] | "SALDO BERTAMBAH";

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print(line1);
    lcd.setCursor(0, 1);
    lcd.print(line2);

    if (success) {
      beep(2, 100);
    } else {
      beep(1, 600);
    }
  } else {
    lcd.clear();
    lcd.print("Gagal Koneksi!");
    lcd.setCursor(0, 1);
    lcd.print("Periksa Server");
  }

  http.end();
  delay(3500);
}

// ====== PROSES PENGUKURAN POSYANDU ======
void prosesPosyandu(String uid) {
  float beratKg = bacaLoadCellGram() / 1000.0;
  float tinggiCm = bacaTinggiBadanCm();

  if (beratKg < 1.0) beratKg = 9.8; // Default dummy jika sensor kosong saat demo
  if (tinggiCm < 30.0) tinggiCm = 78.5;

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Mencatat Medis..");
  lcd.setCursor(0, 1);
  lcd.printf("BB:%.1f TB:%.1f", beratKg, tinggiCm);

  HTTPClient http;
  String url = String(API_BASE_URL) + "/api/iot/posyandu/catat";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> doc;
  doc["rfid_uid"]  = uid;
  doc["berat_kg"]  = beratKg;
  doc["tinggi_cm"] = tinggiCm;

  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = http.POST(requestBody);
  if (httpCode > 0) {
    beep(2, 100);
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("POSYANDU SUKSES");
    lcd.setCursor(0, 1);
    lcd.printf("TB:%.0f BB:%.1fkg", tinggiCm, beratKg);
  } else {
    lcd.clear();
    lcd.print("Gagal Rekam!");
  }
  http.end();
  delay(3500);
}

// ====== BACA SENSOR JARAK / TINGGI BADAN ======
float bacaTinggiBadanCm() {
  digitalWrite(US_TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(US_TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(US_TRIG_PIN, LOW);

  long duration = pulseIn(US_ECHO_PIN, HIGH, 30000);
  if (duration == 0) return 78.5; // Demo fallback

  float distanceCm = duration * 0.034 / 2;
  // Tinggi balita = Tinggi sensor dari lantai (misal 150cm) - jarak terukur
  float tinggiBalita = 150.0 - distanceCm;
  return constrain(tinggiBalita, 40.0, 130.0);
}

// ====== BACA LOAD CELL TIMBANGAN ======
float bacaLoadCellGram() {
  // Simulasi nilai timbangan jika hardware LoadCell riil belum dikalibrasi
  return 1250.0; // 1.25 kg
}

void handleButtons() {
  if (digitalRead(BTN_KALENG) == LOW) {
    delay(200);
    if (currentMode == MODE_BANK_SAMPAH) {
      selectedCategory = "kaleng";
    } else {
      currentMode = MODE_BANK_SAMPAH;
    }
    beep(1, 50);
    updateLcdDisplay();
  }

  if (digitalRead(BTN_PLASTIK) == LOW) {
    delay(200);
    if (currentMode == MODE_BANK_SAMPAH) {
      selectedCategory = "plastik";
    } else {
      currentMode = MODE_POSYANDU;
    }
    beep(1, 50);
    updateLcdDisplay();
  }
}

void updateLcdDisplay() {
  lcd.clear();
  if (currentMode == MODE_BANK_SAMPAH) {
    lcd.setCursor(0, 0);
    lcd.printf("BANK SAMPAH: %s", selectedCategory == "kaleng" ? "KLG" : "PLS");
    lcd.setCursor(0, 1);
    lcd.print("TAP KARTU WARGA");
  } else {
    lcd.setCursor(0, 0);
    lcd.print("POSYANDU BALITA");
    lcd.setCursor(0, 1);
    lcd.print("TAP KARTU / ANAK");
  }
}

void connectToWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int count = 0;
  while (WiFi.status() != WL_CONNECTED && count < 10) {
    delay(400);
    count++;
  }
}

void beep(int times, int durationMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(durationMs);
    digitalWrite(BUZZER_PIN, LOW);
    if (i < times - 1) delay(80);
  }
}
