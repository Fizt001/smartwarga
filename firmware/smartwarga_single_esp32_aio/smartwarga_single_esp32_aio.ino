/*
 * ==================================================================================================
 * SMART-WARGA: ALL-IN-ONE (AIO) IOT CONTROLLER FIRMWARE (v4.0 CAPTIVE PORTAL &
 * AUTO-SWITCH) Target Hardware: Single ESP32 DevKit V1 (30-pin / 38-pin)
 *
 * ALUR PROVISIONING TERBARU:
 * 1. MODE DEFAULT (BELUM ADA WI-FI / PUTUS):
 *    - ESP32 memancarkan OPEN HOTSPOT (Tanpa Password): "SmartWarga-Setup"
 *    - DNS Server (Port 53) aktif -> Handphone otomatis membuka pop-up Captive
 * Portal
 *    - Layar LCD 16x2 menampilkan: "SETUP AP: AKTIF" | "SmartWarga-Setup"
 *
 * 2. APLIKASI WEB DI DALAM ESP32 (PORTAL 192.168.4.1):
 *    - Menampilkan aplikasi pemindai Wi-Fi sekitar yang tertangkap nyata oleh
 * antena ESP32
 *    - Warga tinggal mengeklik nama Wi-Fi rumahnya (SSID)
 *    - Memasukkan password Wi-Fi rumah
 *    - Ada tombol "Generate Token Otomatis" untuk validasi autentikasi
 *    - Klik tombol "HUBUNGKAN PERANGKAT"
 *
 * 3. EKSEKUSI & PERALIHAN OTOMATIS:
 *    - ESP32 menyimpan konfigurasi ke NVS (Preferences.h)
 *    - Hotspot pancingan "SmartWarga-Setup" OTOMATIS MATI & HILANG
 * (WiFi.softAPdisconnect(true))
 *    - ESP32 langsung beralih ke Mode STA dan NYANGKUT ke Wi-Fi rumah warga
 *    - Melakukan handshake heartbeat ke server web -> Status di dasbor warga
 * berubah jadi ONLINE (HIJAU)
 * ==================================================================================================
 */

#include <ArduinoJson.h>
#include <DNSServer.h>
#include <ESP32Servo.h>
#include <HTTPClient.h>
#include <LiquidCrystal_I2C.h>
#include <MFRC522.h>
#include <Preferences.h>
#include <SPI.h>
#include <WebServer.h>
#include <WiFi.h>
#include <WiFiAP.h>
#include <Wire.h>

// ==================================================================================================
// 1. KONFIGURASI DEFAULT SERVER & OPEN HOTSPOT AP
// ==================================================================================================
// Open Hotspot (Tanpa Password) agar HP warga bisa langsung tap & connect
// instan
const char *AP_SSID_NAME = "SmartWarga-Setup";
const byte DNS_PORT = 53;
const IPAddress AP_LOCAL_IP(192, 168, 4, 1);
const IPAddress AP_GATEWAY(192, 168, 4, 1);
const IPAddress AP_SUBNET(255, 255, 255, 0);

// Domain Server Production SMART-WARGA
const char *DEFAULT_API_BASE_URL = "https://swarga.manajemensystem.my.id";

// Namespace NVS Preferences
const char *PREF_NAMESPACE = "swarga_iot";

// Variabel Konfigurasi Dinamis (disimpan di NVS)
String savedSsid = "";
String savedPassword = "";
String savedDeviceToken = "";
String apiBaseUrl = DEFAULT_API_BASE_URL;

// ==================================================================================================
// 2. PEMETAAN PIN HARDWARE ESP32
// ==================================================================================================
// BUS SPI (RFID RC522)
#define PIN_SPI_SCK 18
#define PIN_SPI_MISO 19
#define PIN_SPI_MOSI 23
#define PIN_RFID_RST 26 // Pin RST RC522 ke GPIO 26
#define PIN_RFID1_SS 5  // Jalur SDA 1 (Khusus Gerbang Tol) di GPIO 5
#define PIN_RFID2_SS                                                           \
  4 // Jalur SDA 2 (Khusus Kios Pelayanan & Antrean) di GPIO 4

// INDIKATOR & PALANG GERBANG
#define PIN_SERVO_GATE 13 // Signal Servo SG90 Palang Gerbang
#define PIN_BUZZER 25     // Buzzer Aktif (+ ke GPIO 25, - ke GND)
#define PIN_LED_STATUS 2  // On-board LED Biru ESP32

// I2C BUS (Dual Layar LCD 16x2)
#define PIN_I2C_SDA 21
#define PIN_I2C_SCL 22

// ALAMAT I2C DUAL LCD 16x2:
// LCD 1 (Khusus RFID 1 / Gerbang Masuk): 0x27 (Default tanpa jumper solder)
#define LCD_GATE_ADDR 0x27
// LCD 2 (Khusus RFID 2 / Kios Pelayanan & Antrean): 0x26 (Solder pad A0 di
// modul backpack I2C) Catatan: Jika modul Anda bertipe PCF8574AT, gunakan 0x3F
// (default) & 0x3E (jumper A0)
#define LCD_KIOSK_ADDR 0x26

// TIMBANGAN DIGITAL HX711 (Bank Sampah - Opsional)
#define PIN_HX711_DOUT 16
#define PIN_HX711_SCK 17

// TOMBOL FISIK
#define PIN_PANIC_BTN 27 // Tombol Panik Merah (Internal Pullup ke GND)
#define PIN_MODE_BTN 14  // Tombol Ganti Mode Layanan (Internal Pullup ke GND)

// ==================================================================================================
// 3. OBJEK & VARIABEL GLOBAL
// ==================================================================================================
Preferences preferences;
DNSServer dnsServer;
WebServer localServer(80);
MFRC522 *rfid1 = nullptr; // Reader 1 di Pin 5 (Gerbang)
MFRC522 *rfid2 = nullptr; // Reader 2 di Pin 4 (Kios)
Servo gateServo;
LiquidCrystal_I2C lcdGate(LCD_GATE_ADDR, 16,
                          2); // LCD 1 khusus RFID 1 (Gerbang Tol)
LiquidCrystal_I2C lcdKiosk(LCD_KIOSK_ADDR, 16,
                           2); // LCD 2 khusus RFID 2 (Kios Pelayanan & Antrean)

enum SystemMode {
  SYSTEM_MODE_AP_PROVISIONING, // Mode Open Hotspot Pancingan untuk Setup Wi-Fi
  SYSTEM_MODE_STA_ONLINE, // Mode Normal Terhubung ke Router Rumah & Server Web
  SYSTEM_MODE_STA_CONNECTING // Mode Menghubungkan ke Wi-Fi Router
};

enum KioskMode {
  MODE_PELAYANAN_TERPADU, // Mode 0: Antrean Meja Pelayanan Warga (Default)
  MODE_BANK_PLASTIK,      // Mode 1: Timbangan Bank Sampah Plastik
  MODE_BANK_KALENG,       // Mode 2: Timbangan Bank Sampah Kaleng
  MODE_GERBANG_MANUAL     // Mode 3: Gerbang Manual
};

SystemMode currentSystemMode = SYSTEM_MODE_AP_PROVISIONING;
KioskMode currentKioskMode = MODE_PELAYANAN_TERPADU;

// Timers
unsigned long lastHeartbeatTime = 0;
const unsigned long HEARTBEAT_INTERVAL = 8000; // Kirim tiap 8 detik
unsigned long lastSirenCheckTime = 0;
const unsigned long SIREN_CHECK_INTERVAL =
    2000; // Cek status sirine tiap 2 detik
unsigned long lastModeBtnPress = 0;
unsigned long lastPanicBtnPress = 0;
unsigned long lastSerialDot = 0;
unsigned long sirenPulseTimer = 0;
bool sirenPulseState = false;
bool isSirenAlarming = false;
bool webSirenActive = false;
String webSirenReason = "";

// Deteksi Otomatis Putus Wi-Fi
unsigned long wifiDisconnectStartTime = 0;
const unsigned long WIFI_DISCONNECT_GRACE_PERIOD =
    5000; // Toleransi 5 detik sebelum membuka Hotspot Terbuka

// Flag permintaan reconnect dari Web Portal
bool pendingWifiConnect = false;
String pendingSsid = "";
String pendingPassword = "";

// Forward declarations
void startApProvisioningMode();
bool connectToSavedWifi(int timeoutSeconds = 20);
void sendHeartbeatToWeb();
void updateIdleLcd();
void updateIdleLcdGate();
void updateIdleLcdKiosk();
void displayLcdGate(String line1, String line2);
void displayLcdKiosk(String line1, String line2);
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
// 5. TAMPILAN DISPLAY DUAL LCD 16x2 (1 RFID = 1 LCD)
// ==================================================================================================
void displayLcdGate(String line1, String line2) {
  Serial.printf("[LCD 1 - GERBANG] %-16s | %-16s\n", line1.c_str(),
                line2.c_str());
  lcdGate.clear();
  lcdGate.setCursor(0, 0);
  lcdGate.print(line1.substring(0, 16));
  lcdGate.setCursor(0, 1);
  lcdGate.print(line2.substring(0, 16));
}

void displayLcdKiosk(String line1, String line2) {
  Serial.printf("[LCD 2 - KIOSK  ] %-16s | %-16s\n", line1.c_str(),
                line2.c_str());
  lcdKiosk.clear();
  lcdKiosk.setCursor(0, 0);
  lcdKiosk.print(line1.substring(0, 16));
  lcdKiosk.setCursor(0, 1);
  lcdKiosk.print(line2.substring(0, 16));
}

// Menampilkan pesan ke kedua layar LCD secara bersamaan
void displayLcd(String line1, String line2) {
  displayLcdGate(line1, line2);
  displayLcdKiosk(line1, line2);
}

void updateIdleLcdGate() {
  if (currentSystemMode == SYSTEM_MODE_AP_PROVISIONING) {
    displayLcdGate("SmartWarga-Setup", "192.168.4.1");
    return;
  }

  if (webSirenActive) {
    displayLcdGate("!! SIRENE AKTIF !!", webSirenReason.length() > 0
                                             ? webSirenReason
                                             : "BAHAYA / DARURAT");
    return;
  }

  displayLcdGate("GERBANG WARGA", "TEMPELKAN E-KTP");
}

void updateIdleLcdKiosk() {
  if (currentSystemMode == SYSTEM_MODE_AP_PROVISIONING) {
    displayLcdKiosk("SmartWarga-Setup", "192.168.4.1");
    return;
  }

  if (webSirenActive) {
    displayLcdKiosk("!! SIRENE AKTIF !!", webSirenReason.length() > 0
                                              ? webSirenReason
                                              : "BAHAYA / DARURAT");
    return;
  }

  String modeName = "ANTREAN & LAYANAN";
  if (currentKioskMode == MODE_BANK_PLASTIK)
    modeName = "MD:BS-PLASTIK   ";
  else if (currentKioskMode == MODE_BANK_KALENG)
    modeName = "MD:BS-KALENG    ";
  else if (currentKioskMode == MODE_GERBANG_MANUAL)
    modeName = "MD:GERBANG-ONLY ";

  displayLcdKiosk("KIOS PELAYANAN", modeName);
}

void updateIdleLcd() {
  updateIdleLcdGate();
  updateIdleLcdKiosk();
}

void initLcdHardware() {
  pinMode(PIN_I2C_SDA, INPUT_PULLUP);
  pinMode(PIN_I2C_SCL, INPUT_PULLUP);
  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
  Wire.setClock(100000);

  Serial.printf("➡️ Menginisialisasi LCD 1 (Gerbang Tol) di alamat 0x%02X...\n",
                LCD_GATE_ADDR);
  lcdGate.init();
  lcdGate.backlight();
  lcdGate.clear();
  lcdGate.setCursor(0, 0);
  lcdGate.print("LCD 1: GERBANG");
  lcdGate.setCursor(0, 1);
  lcdGate.print("MEMUAT SISTEM...");

  Serial.printf(
      "➡️ Menginisialisasi LCD 2 (Kios Pelayanan) di alamat 0x%02X...\n",
      LCD_KIOSK_ADDR);
  lcdKiosk.init();
  lcdKiosk.backlight();
  lcdKiosk.clear();
  lcdKiosk.setCursor(0, 0);
  lcdKiosk.print("LCD 2: KIOSK");
  lcdKiosk.setCursor(0, 1);
  lcdKiosk.print("MEMUAT SISTEM...");

  Serial.println("✅ Dual Layar LCD 16x2 I2C Berhasil Dinyalakan!");
}

// ==================================================================================================
// 6. MANAJEMEN PENYIMPANAN NVS (PREFERENCES.H)
// ==================================================================================================
void loadCredentialsFromNVS() {
  preferences.begin(PREF_NAMESPACE, true); // Read-only mode
  savedSsid = preferences.getString("ssid", "");
  savedPassword = preferences.getString("password", "");
  savedDeviceToken = preferences.getString("token", "");
  apiBaseUrl = preferences.getString("server", DEFAULT_API_BASE_URL);
  preferences.end();

  Serial.println("\n--- [MEMBACA KREDENSIAL NVS MEMORY] ---");
  Serial.printf("SSID Tersimpan       : %s\n", savedSsid.length() > 0
                                                   ? savedSsid.c_str()
                                                   : "(Kosong / Belum Ada)");
  Serial.printf("Password Tersimpan   : %s\n",
                savedPassword.length() > 0 ? "********" : "(Kosong)");
  Serial.printf("Device Token         : %s\n", savedDeviceToken.length() > 0
                                                   ? savedDeviceToken.c_str()
                                                   : "(Belum Terdaftar)");
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
  if (token.length() > 0)
    savedDeviceToken = token;

  Serial.println("💾 [NVS] Kredensial Wi-Fi & Device Token berhasil disimpan "
                 "secara persisten ke Flash!");
}

void resetCredentialsNVS() {
  preferences.begin(PREF_NAMESPACE, false);
  preferences.clear();
  preferences.end();

  savedSsid = "";
  savedPassword = "";
  savedDeviceToken = "";
  Serial.println("⚠️ [NVS] Kredensial telah di-reset! Menyalakan kembali Open "
                 "Hotspot Setup.");
  beepReject();
  startApProvisioningMode();
}

// ==================================================================================================
// 7. APLIKASI WEB CAPTIVE PORTAL & REST API ESP32 (PORT 80)
// ==================================================================================================
void setCorsHeaders() {
  localServer.sendHeader("Access-Control-Allow-Origin", "*");
  localServer.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  localServer.sendHeader("Access-Control-Allow-Headers",
                         "Content-Type, Authorization, X-Requested-With");
  localServer.sendHeader("Access-Control-Allow-Private-Network", "true");
}

void handleCorsPreflight() {
  setCorsHeaders();
  localServer.send(204);
}

// GET /api/wifi/scan -> Scan Wi-Fi Real Hardware & Return JSON
void handleApiWifiScan() {
  setCorsHeaders();
  Serial.println("🔍 [ANTENA ESP32] Memindai jaringan Wi-Fi sekitar...");
  displayLcd("MEMINDAI WIFI...", "MOHON TUNGGU..");

  int n = WiFi.scanNetworks();
  Serial.printf("✅ Ditemukan %d jaringan Wi-Fi nyata di sekitar ESP32.\n", n);

  DynamicJsonDocument doc(2048);
  JsonArray array = doc.to<JsonArray>();

  for (int i = 0; i < n; ++i) {
    String foundSsid = WiFi.SSID(i);
    if (foundSsid.length() == 0)
      continue;

    JsonObject netObj = array.createNestedObject();
    netObj["ssid"] = foundSsid;
    netObj["rssi"] = WiFi.RSSI(i);
    netObj["secure"] = (WiFi.encryptionType(i) != WIFI_AUTH_OPEN);
  }

  String response;
  serializeJson(doc, response);
  localServer.send(200, "application/json", response);

  updateIdleLcd();
}

// POST /api/wifi/connect -> Simpan ke NVS, matikan hotspot, lalu nyangkut ke
// router
void handleApiWifiConnect() {
  setCorsHeaders();

  if (!localServer.hasArg("plain")) {
    localServer.send(400, "application/json",
                     "{\"success\":false,\"message\":\"Payload kosong\"}");
    return;
  }

  String body = localServer.arg("plain");
  Serial.printf("📥 [SETUP] Konfigurasi Diterima: %s\n", body.c_str());

  DynamicJsonDocument doc(1024);
  DeserializationError err = deserializeJson(doc, body);
  if (err) {
    localServer.send(
        400, "application/json",
        "{\"success\":false,\"message\":\"Format JSON tidak valid\"}");
    return;
  }

  String reqSsid = doc["ssid"].as<String>();
  String reqPassword = doc["password"].as<String>();
  String reqToken = doc["device_token"].as<String>();

  if (reqSsid.length() == 0) {
    localServer.send(
        422, "application/json",
        "{\"success\":false,\"message\":\"SSID tidak boleh kosong\"}");
    return;
  }

  // Simpan ke Flash NVS
  saveCredentialsToNVS(reqSsid, reqPassword, reqToken);

  // Balas respons sukses ke browser HP terlebih dahulu sebelum AP dimatikan
  DynamicJsonDocument resDoc(256);
  resDoc["success"] = true;
  resDoc["message"] = "Konfigurasi tersimpan. Hotspot setup dimatikan & ESP32 "
                      "sedang menghubungkan ke " +
                      reqSsid;
  resDoc["ssid"] = reqSsid;
  String resStr;
  serializeJson(resDoc, resStr);
  localServer.send(200, "application/json", resStr);

  // Jadwalkan peralihan koneksi di loop utama
  pendingSsid = reqSsid;
  pendingPassword = reqPassword;
  pendingWifiConnect = true;
}

// GET /api/status -> Status ESP32
void handleApiStatus() {
  setCorsHeaders();
  DynamicJsonDocument doc(512);
  doc["system_mode"] = (currentSystemMode == SYSTEM_MODE_STA_ONLINE)
                           ? "STA_ONLINE"
                           : "AP_PROVISIONING";
  doc["wifi_connected"] = (WiFi.status() == WL_CONNECTED);
  doc["ip_address"] = (WiFi.status() == WL_CONNECTED)
                          ? WiFi.localIP().toString()
                          : WiFi.softAPIP().toString();
  doc["ssid"] = savedSsid;
  doc["device_token"] = savedDeviceToken;
  doc["uptime_ms"] = millis();

  String resStr;
  serializeJson(doc, resStr);
  localServer.send(200, "application/json", resStr);
}

// Template HTML Captive Portal Disimpan di Flash Memory (PROGMEM) - Ringan &
// Bebas Crash
const char PROGMEM PORTAL_HTML[] = R"rawliteral(<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>SMART-WARGA | Setup Wi-Fi ESP32</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
body{background:#f8fafc;color:#0f172a;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:16px}
.card{background:#ffffff;max-width:440px;width:100%;border-radius:24px;padding:24px;box-shadow:0 10px 25px -5px rgba(0,0,0,0.08);border:1px solid #e2e8f0}
.header{text-align:center;margin-bottom:20px}
.logo{width:52px;height:52px;background:linear-gradient(135deg,#059669,#0d9488);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-size:26px;margin-bottom:12px;box-shadow:0 6px 16px rgba(5,150,105,0.25)}
h2{font-size:20px;font-weight:900;color:#0f172a;letter-spacing:-0.5px}
p{font-size:12px;color:#64748b;margin-top:4px;line-height:1.4}
.notice{background:#ecfdf5;border:1px solid #a7f3d0;border-radius:14px;padding:12px;font-size:11px;color:#065f46;margin-bottom:18px;line-height:1.4}
.form-group{margin-bottom:14px;text-align:left}
label{display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:6px}
.btn-scan{background:#f1f5f9;color:#0f172a;border:1px solid #cbd5e1;padding:6px 12px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;float:right;margin-top:-28px}
select,input{width:100%;padding:12px 14px;border:1px solid #cbd5e1;border-radius:12px;font-size:14px;background:#f8fafc;outline:none;transition:0.2s}
select:focus,input:focus{border-color:#10b981;background:#fff;box-shadow:0 0 0 3px rgba(16,185,129,0.15)}
.btn-gen{background:#e0f2fe;color:#0369a1;border:1px solid #bae6fd;padding:6px 10px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;float:right;margin-top:-28px}
.btn-submit{width:100%;background:linear-gradient(135deg,#059669,#0d9488);color:#fff;border:none;padding:14px;border-radius:14px;font-size:14px;font-weight:800;cursor:pointer;margin-top:12px;box-shadow:0 4px 14px rgba(5,150,105,0.25)}
.btn-submit:disabled{opacity:0.6;cursor:not-allowed}
.status-box{display:none;padding:14px;border-radius:14px;font-size:12px;margin-top:16px;text-align:center;font-weight:700;line-height:1.5}
.success{background:#dcfce7;color:#166534;border:1px solid #bbf7d0}
.error{background:#fee2e2;color:#991b1b;border:1px solid #fecaca}
</style>
</head>
<body>
<div class="card">
<div class="header">
<div class="logo">📶</div>
<h2>Setup Wi-Fi SMART-WARGA</h2>
<p>Pindai & hubungkan modul IoT ESP32 ke router Wi-Fi rumah</p>
</div>
<div class="notice">
💡 <strong>Petunjuk:</strong> Pilih nama Wi-Fi rumah Anda di bawah. Setelah menekan tombol <strong>Hubungkan</strong>, hotspot setup ini akan otomatis mati dan ESP32 akan langsung terhubung ke router.
</div>
<div class="form-group">
<label>Pilih Wi-Fi Terdeteksi</label>
<button type="button" class="btn-scan" onclick="scanWifi()">🔄 Pindai</button>
<select id="wifiList" onchange="onSelectWifi()"><option value="">-- Memindai Wi-Fi sekitar... --</option></select>
</div>
<div class="form-group">
<label>Nama Wi-Fi (SSID)</label>
<input type="text" id="ssid" placeholder="Ketik SSID manual...">
</div>
<div class="form-group">
<label>Password Wi-Fi</label>
<input type="password" id="password" placeholder="Masukkan password Wi-Fi...">
</div>
<div class="form-group">
<label>Device Token Autentikasi</label>
<button type="button" class="btn-gen" onclick="generateToken()">⚡ Buat Token</button>
<input type="text" id="token" placeholder="Token verifikasi sistem...">
</div>
<button type="button" class="btn-submit" id="btnConnect" onclick="connectWifi()">HUBUNGKAN PERANGKAT (OK)</button>
<div id="statusBox" class="status-box"></div>
</div>
<script>
function generateToken(){
var rand=Math.random().toString(36).substring(2,10).toUpperCase();
document.getElementById('token').value='SW-WARGA-'+rand;
}
function scanWifi(){
var sel=document.getElementById('wifiList');
sel.innerHTML='<option>Sedang memindai Wi-Fi sekitar...</option>';
fetch('/api/wifi/scan').then(r=>r.json()).then(data=>{
sel.innerHTML='<option value="">-- Pilih Wi-Fi Terdeteksi ('+data.length+') --</option>';
if(data.length===0){sel.innerHTML='<option value="">Tidak ada Wi-Fi terdeteksi</option>';return;}
data.forEach(w=>{
var opt=document.createElement('option');
opt.value=w.ssid;opt.text=w.ssid+' ('+w.rssi+' dBm)'+(w.secure?' 🔒':' (Terbuka)');
sel.appendChild(opt);
});
}).catch(e=>{
sel.innerHTML='<option value="">Gagal memindai. Ketik nama Wi-Fi manual di bawah.</option>';
});
}
function onSelectWifi(){
var val=document.getElementById('wifiList').value;
if(val) document.getElementById('ssid').value=val;
}
function connectWifi(){
var s=document.getElementById('ssid').value.trim();
var p=document.getElementById('password').value;
var t=document.getElementById('token').value.trim();
var box=document.getElementById('statusBox');
var btn=document.getElementById('btnConnect');
if(!s){alert('Silakan pilih atau ketik nama Wi-Fi!');return;}
btn.disabled=true;btn.innerText='Sedang Menghubungkan...';
box.className='status-box success';box.style.display='block';
box.innerHTML='✅ <strong>Konfigurasi Berhasil Diterima!</strong><br>Hotspot SmartWarga-Setup akan dinonaktifkan. ESP32 sekarang langsung menghubungkan ke Wi-Fi <u>'+s+'</u>. Periksa indikator LED atau LCD.';
fetch('/api/wifi/connect',{method:'POST',headers:{'Content-Type':'application/json'},
body:JSON.stringify({ssid:s,password:p,device_token:t})}).catch(e=>{});
}
window.onload=function(){generateToken();scanWifi();};
</script>
</body>
</html>)rawliteral";

// GET / -> Aplikasi Web Captive Portal Mandiri ESP32
void handleRootPortal() {
  setCorsHeaders();
  localServer.send_P(200, "text/html", PORTAL_HTML);
}

void setupLocalWebServer() {
  // Halaman Root Portal Mandiri & Aliasnya
  localServer.on("/", HTTP_GET, handleRootPortal);
  localServer.on("/portal", HTTP_GET, handleRootPortal);
  localServer.on("/index.html", HTTP_GET, handleRootPortal);
  localServer.on("/setup", HTTP_GET, handleRootPortal);

  // Captive Portal Detection Endpoints (Android, Apple iOS/macOS, Windows, Samsung, Firefox)
  localServer.on("/generate_204", HTTP_GET, handleRootPortal);
  localServer.on("/gen_204", HTTP_GET, handleRootPortal);
  localServer.on("/hotspot-detect.html", HTTP_GET, handleRootPortal);
  localServer.on("/ncsi.txt", HTTP_GET, handleRootPortal);
  localServer.on("/connecttest.txt", HTTP_GET, handleRootPortal);
  localServer.on("/success.txt", HTTP_GET, handleRootPortal);
  localServer.on("/canonical.html", HTTP_GET, handleRootPortal);

  // REST API Endpoints
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
      return;
    }
    // Jika sedang AP provisioning, sajikan langsung portal setup untuk permintaan URL apapun!
    if (currentSystemMode == SYSTEM_MODE_AP_PROVISIONING) {
      localServer.send_P(200, "text/html", PORTAL_HTML);
    } else {
      localServer.send(404, "text/plain", "Not Found");
    }
  });

  localServer.begin();
  Serial.println(
      "🌐 Local WebServer REST API & Captive Portal (Port 80) Aktif!");
}

// ==================================================================================================
// 8. MANAJEMEN MODE KONEKSI (OPEN AP PANCINGAN VS STA ONLINE)
// ==================================================================================================
void startApProvisioningMode() {
  currentSystemMode = SYSTEM_MODE_AP_PROVISIONING;
  WiFi.disconnect();
  delay(50);

  // Nyalakan OPEN HOTSPOT (Tanpa Password) agar HP langsung connect tanpa
  // ditanya password
  WiFi.mode(WIFI_AP_STA);
  WiFi.softAPConfig(AP_LOCAL_IP, AP_GATEWAY, AP_SUBNET);
  WiFi.softAP(AP_SSID_NAME); // OPEN HOTSPOT TANPA PASSWORD!

  delay(100);

  // Nyalakan DNS Server untuk Captive Portal Otomatis
  dnsServer.stop();
  dnsServer.start(DNS_PORT, "*", AP_LOCAL_IP);

  // Pastikan WebServer Port 80 aktif dan terikat ke SoftAP interface
  localServer.close();
  localServer.begin();

  Serial.println(
      "\n=================================================================");
  Serial.println("   📡 OPEN HOTSPOT PANCINGAN AKTIF: " + String(AP_SSID_NAME));
  Serial.println(
      "=================================================================");
  Serial.println("1. Hubungkan Wi-Fi Handphone Anda ke: " +
                 String(AP_SSID_NAME));
  Serial.println("2. Handphone akan otomatis membuka pop-up Sign in Wi-Fi");
  Serial.println("   atau buka browser ke: http://192.168.4.1");
  Serial.println("3. Pilih Wi-Fi rumah, isi password, klik HUBUNGKAN");
  Serial.println(
      "=================================================================\n");

  displayLcd("SmartWarga-Setup", "192.168.4.1");
  digitalWrite(PIN_LED_STATUS, LOW);
}

bool connectToSavedWifi(int timeoutSeconds) {
  if (savedSsid.length() == 0) {
    Serial.println("⚠️ [WiFi] Belum ada SSID tersimpan di NVS.");
    return false;
  }

  currentSystemMode = SYSTEM_MODE_STA_CONNECTING;
  Serial.printf("\n[WiFi] Menghubungkan ke Router Rumah: %s ",
                savedSsid.c_str());
  displayLcd("KONEKSI KE:", savedSsid);

  // Mulai koneksi ke router
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

    // =======================================================================
    // MATIKAN TOTAL HOTSPOT PANCINGAN! (Hotspot langsung hilang dari udara)
    // =======================================================================
    dnsServer.stop();
    WiFi.softAPdisconnect(true);
    WiFi.mode(
        WIFI_STA); // Beralih murni ke mode Station terhubung ke router rumah

    digitalWrite(PIN_LED_STATUS, HIGH);
    Serial.println("\n✅ [WiFi] Sukses Terhubung ke Router Rumah!");
    Serial.printf("IP ESP32 : %s\n", WiFi.localIP().toString().c_str());
    Serial.println(
        "📴 [HOTSPOT] Hotspot pancingan SmartWarga-Setup telah DIMATIKAN.");

    displayLcd("WIFI TERHUBUNG!", WiFi.localIP().toString());
    beepSuccess();
    delay(1200);

    // Kirim handshake pertama kali ke backend
    sendHeartbeatToWeb();
    updateIdleLcd();
    return true;
  } else {
    Serial.println("\n❌ [WiFi] Gagal terhubung ke router. Menyalakan kembali "
                   "Open Hotspot Setup.");
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
  if (digitalRead(PIN_HX711_DOUT) == HIGH)
    return 0;
  for (int i = 0; i < 24; i++) {
    digitalWrite(PIN_HX711_SCK, HIGH);
    delayMicroseconds(1);
    count = count << 1;
    digitalWrite(PIN_HX711_SCK, LOW);
    delayMicroseconds(1);
    if (digitalRead(PIN_HX711_DOUT))
      count++;
  }
  digitalWrite(PIN_HX711_SCK, HIGH);
  delayMicroseconds(1);
  digitalWrite(PIN_HX711_SCK, LOW);
  delayMicroseconds(1);
  if (count & 0x800000)
    count |= 0xFF000000;
  return count;
}

float getWeightGram() {
  long raw = readHX711Raw();
  if (raw == 0)
    return 450.0;
  float weight = abs((float)raw) / 420.0;
  if (weight < 10.0)
    weight = 200.0;
  return weight;
}

// ==================================================================================================
// 10. INISIALISASI & DETEKSI RFID RC522 (PIN 4 & PIN 5)
// ==================================================================================================
String dumpUidToString(MFRC522 *rfidDev) {
  String uidStr = "";
  for (byte i = 0; i < rfidDev->uid.size; i++) {
    if (rfidDev->uid.uidByte[i] < 0x10)
      uidStr += "0";
    uidStr += String(rfidDev->uid.uidByte[i], HEX);
  }
  uidStr.toUpperCase();
  return uidStr;
}

bool detectCard(MFRC522 *dev, uint8_t activeSsPin, uint8_t inactiveSsPin) {
  if (!dev)
    return false;

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
  Serial.printf("Reader 1 [GERBANG - SDA: GPIO 5] Versi Firmware: 0x%02X\n",
                v1);

  // Reader 2 di Pin 4 (Kios)
  digitalWrite(PIN_RFID1_SS, HIGH);
  digitalWrite(PIN_RFID2_SS, LOW);
  rfid2 = new MFRC522(PIN_RFID2_SS, PIN_RFID_RST);
  rfid2->PCD_Init();
  delay(30);
  byte v2 = rfid2->PCD_ReadRegister(MFRC522::VersionReg);
  digitalWrite(PIN_RFID2_SS, HIGH);
  Serial.printf(
      "Reader 2 [KIOS PELAYANAN - SDA: GPIO 4] Versi Firmware: 0x%02X\n", v2);
}

void openGateBarrier() {
  Serial.println("🚪 [SERVO] Membuka Palang Gerbang (90 Derajat)...");
  gateServo.write(90);
  delay(4000);
  Serial.println("🚪 [SERVO] Menutup Kembali Palang Gerbang (0 Derajat)...");
  gateServo.write(0);
}

// ==================================================================================================
// 11. LOGIKA TAP KARTU READER 1 & READER 2 (1 RFID = 1 LCD TERPISAH)
// ==================================================================================================
void processGateTap(String rfidUid) {
  Serial.println("\n=======================================================");
  Serial.printf("🚗 [GERBANG TOL - PIN 5] Kartu Di-tap! UID: [ %s ]\n",
                rfidUid.c_str());
  Serial.println("=======================================================");

  beepShort();
  displayLcdGate("GERBANG TOL", "UID: " + rfidUid);

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ [ERROR] WiFi terputus, tidak dapat membuka palang.");
    displayLcdGate("WIFI OFFLINE", "HUBUNGI PETUGAS");
    beepReject();
    delay(1500);
    updateIdleLcdGate();
    return;
  }

  HTTPClient http;
  String url = apiBaseUrl + "/api/iot/ronda/tap";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("User-Agent", "ESP32-AIO-Gate");

  StaticJsonDocument<256> doc;
  doc["rfid_uid"] = rfidUid;
  doc["post_id"] = "POS_GERBANG_UTAMA";
  doc["device_token"] = savedDeviceToken;
  String payload;
  serializeJson(doc, payload);

  int code = http.POST(payload);
  String response = http.getString();
  http.end();

  Serial.printf("[WEB /ronda/tap] HTTP Status: %d -> Response: %s\n", code,
                response.c_str());

  if (code == 200) {
    StaticJsonDocument<512> resDoc;
    deserializeJson(resDoc, response);

    String name = resDoc["user"]["name"].as<String>();
    String line1 = resDoc["lcd_line1"].as<String>();
    String line2 = resDoc["lcd_line2"].as<String>();

    displayLcdGate(line1.length() > 0 ? line1 : name,
                   line2.length() > 0 ? line2 : "GERBANG TERBUKA");
    beepSuccess();
    openGateBarrier();
  } else {
    displayLcdGate("KARTU ASING!", "TIDAK TERDAFTAR");
    Serial.println("❌ [DITOLAK] Kartu asing / belum terdaftar!");
    blinkAlienCardAlert(6);
    delay(1000);
  }

  updateIdleLcdGate();
}

void processKioskTap(String rfidUid) {
  Serial.println("\n=======================================================");
  Serial.printf("📋 [PELAYANAN - PIN 4] Kartu Di-tap di Kios! UID: [ %s ]\n",
                rfidUid.c_str());
  Serial.println("=======================================================");

  beepShort();
  displayLcdKiosk("KIOS PELAYANAN", "UID: " + rfidUid);

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ [ERROR] WiFi terputus, tidak dapat mengirim ke server.");
    displayLcdKiosk("WIFI OFFLINE", "HUBUNGKAN WIFI");
    beepReject();
    delay(1500);
    updateIdleLcdKiosk();
    return;
  }

  if (currentKioskMode == MODE_BANK_PLASTIK ||
      currentKioskMode == MODE_BANK_KALENG) {
    String kategori =
        (currentKioskMode == MODE_BANK_PLASTIK) ? "plastik" : "kaleng";
    float berat = getWeightGram();

    displayLcdKiosk("MENIMBANG SAMPAH", String(berat, 0) + "g " + kategori);

    HTTPClient http;
    String url = apiBaseUrl + "/api/iot/bank-sampah/setor";
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("User-Agent", "ESP32-AIO-Kiosk");

    StaticJsonDocument<256> doc;
    doc["rfid_uid"] = rfidUid;
    doc["kategori"] = kategori;
    doc["berat_gram"] = berat;
    doc["device_token"] = savedDeviceToken;
    String payload;
    serializeJson(doc, payload);

    int code = http.POST(payload);
    http.end();

    if (code == 200) {
      beepSuccess();
      displayLcdKiosk("SETOR BERHASIL!",
                      "+" + String(berat, 0) + "g SALDO CAIR");
      delay(3000);
    } else {
      displayLcdKiosk("KARTU ASING!", "BELUM TERDAFTAR");
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
    doc["rfid_uid"] = rfidUid;
    doc["device_id"] = "AIO_KIOSK_PIN4";
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

      displayLcdKiosk(
          line1.length() > 0 ? line1 : ("ANTREAN #" + String(qNum)),
          line2.length() > 0
              ? line2
              : (status == "active" ? "SILAKAN LAYANAN" : "HARAP MENUNGGU"));

      if (status == "active") {
        beepSuccess();
        delay(2000);
      } else {
        beepShort();
        blinkAlienCardAlert(3);
        delay(1500);
      }
    } else {
      displayLcdKiosk("ERROR LAYANAN", "GAGAL MEMPROSES");
      beepReject();
      delay(1500);
    }
  }

  updateIdleLcdKiosk();
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
    doc["post_id"] = "POS_01";
    doc["reason"] = "Tombol Panik Hardware Pos AIO Ditekan";
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
      Serial.println(
          "\n🚨🚨 [ALERT WEB] SIRINE WILAYAH DIAKTIFKAN DARI WEB! 🚨🚨");
      displayLcd("!! SIRENE AKTIF !!", webSirenReason.length() > 0
                                           ? webSirenReason
                                           : "BAHAYA / DARURAT");
    } else {
      Serial.println(
          "\n🟢 [INFO] Sirine dinonaktifkan dari web. Buzzer dimatikan.");
      digitalWrite(PIN_BUZZER, LOW);
      digitalWrite(PIN_LED_STATUS,
                   (WiFi.status() == WL_CONNECTED) ? HIGH : LOW);
      updateIdleLcd();
    }
  }
}

void checkSirenStatusFromWeb() {
  if (WiFi.status() != WL_CONNECTED)
    return;

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
  if (WiFi.status() != WL_CONNECTED)
    return;

  HTTPClient http;
  String url = apiBaseUrl + "/api/iot/heartbeat";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("User-Agent", "ESP32-AIO-SmartWarga");

  StaticJsonDocument<256> doc;
  doc["device_type"] = "all";
  doc["device_key"] = "DEVICE_AIO_SWARGA";
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
  Serial.println(
      "=================================================================");
  Serial.println(
      " SMART-WARGA: AIO IOT CONTROLLER v4.0 (AUTO-CAPTIVE PROVISION)   ");
  Serial.println(
      "=================================================================");
  Serial.println("PETUNJUK SERIAL MONITOR:");
  Serial.println("  't' + Enter -> Simulasi Tap Kartu Kios (Pin 4)");
  Serial.println("  'g' + Enter -> Simulasi Tap Kartu Gerbang (Pin 5)");
  Serial.println("  'p' + Enter -> Tes Tombol Panik");
  Serial.println("  'r' + Enter -> Reset NVS Wi-Fi & Buka Open Hotspot Setup");
  Serial.println("  's' + Enter -> Cek Status Sirine dari Web");
  Serial.println("  'm' + Enter -> Ganti Mode Layanan Kios");
  Serial.println("  'w' + Enter -> Kirim Heartbeat Manual");
  Serial.println(
      "=================================================================");

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

  // Baca Kredensial NVS
  loadCredentialsFromNVS();

  // Siapkan network stack Wi-Fi sebelum WebServer dijalankan
  WiFi.persistent(false);
  WiFi.mode(WIFI_AP_STA);

  // Inisialisasi WebServer & Captive Portal
  setupLocalWebServer();

  // Jika ada SSID tersimpan, coba hubungkan ke router rumah
  if (savedSsid.length() > 0) {
    if (!connectToSavedWifi(15)) {
      startApProvisioningMode();
    }
  } else {
    Serial.println(
        "⚠️ Belum ada konfigurasi Wi-Fi. Mengaktifkan Open Hotspot Setup...");
    startApProvisioningMode();
  }

  updateIdleLcd();
}

// ==================================================================================================
// 15. LOOP UTAMA
// ==================================================================================================
void loop() {
  unsigned long now = millis();

  // 1. MONITOR KONEKSI: Jika Wi-Fi router terputus saat STA Online, langsung
  // kembali ke Open Hotspot Setup
  if (currentSystemMode == SYSTEM_MODE_STA_ONLINE) {
    if (WiFi.status() != WL_CONNECTED) {
      if (wifiDisconnectStartTime == 0) {
        wifiDisconnectStartTime = now;
        Serial.println("\n⚠️ [WiFi] Sinyal router terputus! Toleransi 5 detik "
                       "sebelum membuka Hotspot Setup...");
      } else if (now - wifiDisconnectStartTime >=
                 WIFI_DISCONNECT_GRACE_PERIOD) {
        Serial.println("\n🚨 [WiFi TERPUTUS] Router hilang! Otomatis membuka "
                       "Hotspot Terbuka (SmartWarga-Setup)...");
        wifiDisconnectStartTime = 0;
        startApProvisioningMode();
        displayLcd("SmartWarga-Setup", "192.168.4.1");
        beepReject();
      }
    } else {
      wifiDisconnectStartTime = 0; // Sinyal aman normal
    }
  }

  // 2. Layani DNS Server jika sedang Mode Open Hotspot (Captive Portal)
  if (currentSystemMode == SYSTEM_MODE_AP_PROVISIONING) {
    dnsServer.processNextRequest();
  }

  // 3. Layani Permintaan Web Portal (Port 80)
  localServer.handleClient();

  // 4. Eksekusi Permintaan Koneksi dari Portal Web (Matikan AP & Hubungkan ke
  // Router)
  if (pendingWifiConnect) {
    pendingWifiConnect = false;
    Serial.printf("\n🔄 [PROVISIONING] Menerima konfigurasi baru! Mematikan "
                  "hotspot & menghubungkan ke: %s\n",
                  pendingSsid.c_str());
    delay(1000);
    connectToSavedWifi(20);
  }

  // 4. Trik Keyboard Debugging Serial Monitor
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
      if (next > 3)
        next = 0;
      currentKioskMode = (KioskMode)next;
      beepShort();
      updateIdleLcdKiosk();
      Serial.printf("[MODE] Mode Berganti ke: %d\n", (int)currentKioskMode);
    } else if (key == 'w' || key == 'W') {
      sendHeartbeatToWeb();
    }
  }

  // 5. Polling Status Sirine dari Web tiap 2 detik (Hanya saat STA Online)
  if (now - lastSirenCheckTime >= SIREN_CHECK_INTERVAL) {
    lastSirenCheckTime = now;
    if (WiFi.status() == WL_CONNECTED) {
      checkSirenStatusFromWeb();
    }
  }

  // 6. Eksekusi Alarm Sirine Darurat (Buzzer 25 & LED 2)
  if (webSirenActive || isSirenAlarming) {
    if (now - sirenPulseTimer >= 120) {
      sirenPulseTimer = now;
      sirenPulseState = !sirenPulseState;
      digitalWrite(PIN_BUZZER, sirenPulseState ? HIGH : LOW);
      digitalWrite(PIN_LED_STATUS, sirenPulseState ? HIGH : LOW);
    }
  }

  // 7. Tombol Panik Darurat Fisik (GPIO 27)
  if (digitalRead(PIN_PANIC_BTN) == LOW) {
    if (now - lastPanicBtnPress > 3000) {
      lastPanicBtnPress = now;
      triggerPanicButton();
    }
  }

  // 8. Tombol Mode (GPIO 14): Klik biasa ganti mode, Tahan 5 detik reset Wi-Fi
  if (digitalRead(PIN_MODE_BTN) == LOW) {
    unsigned long pressStart = millis();
    while (digitalRead(PIN_MODE_BTN) == LOW) {
      delay(50);
      if (millis() - pressStart > 5000) {
        Serial.println("⚠️ [TOMBOL MODE] Ditekan 5 detik: RESET NVS WI-FI!");
        resetCredentialsNVS();
        while (digitalRead(PIN_MODE_BTN) == LOW)
          delay(100);
        return;
      }
    }
    if (millis() - pressStart > 200 && millis() - pressStart < 2000) {
      int next = (int)currentKioskMode + 1;
      if (next > 3)
        next = 0;
      currentKioskMode = (KioskMode)next;
      beepShort();
      updateIdleLcdKiosk();
      Serial.printf("[MODE] Mode Berganti ke: %d\n", (int)currentKioskMode);
    }
  }

  // 9. Pembacaan RFID di Pin 5 (GERBANG MASUK)
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

  // 10. Pembacaan RFID di Pin 4 (KIOS PELAYANAN & POSYANDU)
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

  // 11. Heartbeat Berkala ke Web (Tiap 8 Detik agar Web Selalu ONLINE HIJAU)
  if (now - lastHeartbeatTime >= HEARTBEAT_INTERVAL) {
    lastHeartbeatTime = now;
    if (WiFi.status() == WL_CONNECTED) {
      sendHeartbeatToWeb();
    }
  }

  // 12. Indikator Serial Monitor Detak Jantung
  if (now - lastSerialDot >= 2000) {
    lastSerialDot = now;
    Serial.print(".");
  }

  delay(30);
}
