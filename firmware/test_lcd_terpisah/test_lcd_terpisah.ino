/*
 * ==================================================================================================
 * SMART-WARGA: SKETCH KHUSUS PENGUJIAN LCD 16x2 I2C (STANDALONE / TERPISAH)
 * ==================================================================================================
 * Gunakan sketch ini murni HANYA untuk mengetes layar LCD tanpa sensor lain.
 * 
 * LANGKAH SAMBUNGAN KABEL FISIK KE ESP32:
 * 1. GND (LCD) -> Pin GND (ESP32)
 * 2. VCC (LCD) -> Pin VIN atau 5V (ESP32)  <-- [WAJIB 5V! Jangan ke 3.3V, LCD tidak akan muncul huruf]
 * 3. SDA (LCD) -> GPIO 21 (ESP32)
 * 4. SCL (LCD) -> GPIO 22 (ESP32)
 * 
 * JUMPER BACKLIGHT:
 * Di belakang LCD ada 2 pin dengan penutup plastik hitam (jumper).
 * Pastikan penutup plastik hitam ini TERPASANG kencang!
 * ==================================================================================================
 */

#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// Definisi Pin I2C ESP32
#define PIN_SDA 21
#define PIN_SCL 22

LiquidCrystal_I2C* lcd = nullptr;
byte lcdAddress = 0;
bool isBacklightOn = true;

// Fungsi untuk memindai alamat I2C
byte scanI2CAddress() {
  Serial.println("\n-------------------------------------------------------");
  Serial.println("🔍 Sedang memindai pin SDA: GPIO 21 & SCL: GPIO 22...");
  
  byte found = 0;
  int count = 0;

  for (byte addr = 1; addr < 127; addr++) {
    Wire.beginTransmission(addr);
    byte error = Wire.endTransmission();

    if (error == 0) {
      Serial.printf("✨ [DITEMUKAN!] Ada perangkat I2C di alamat HEX: 0x%02X\n", addr);
      if (found == 0) found = addr;
      count++;
    } else if (error == 4) {
      Serial.printf("⚠️ Error jalur I2C pada alamat 0x%02X\n", addr);
    }
    delay(2);
  }

  if (count == 0) {
    Serial.println("❌ [HASIL SCAN] TIDAK ADA PERANGKAT I2C YANG MERESPONS!");
    Serial.println("-------------------------------------------------------");
    Serial.println("KEMUNGKINAN MASALAH:");
    Serial.println("1. Kabel SDA (GPIO 21) atau SCL (GPIO 22) longgar / terbalik.");
    Serial.println("2. VCC belum dapat 5V: Pastikan dicolok ke pin VIN.");
    Serial.println("3. Kabel jumper ada yang putus di dalam.");
    Serial.println("-------------------------------------------------------");
  } else {
    Serial.printf("✅ Total %d perangkat I2C berhasil terdeteksi!\n", count);
  }
  return found;
}

// Fungsi inisialisasi LCD pada alamat tertentu
void initLcd(byte addr) {
  lcdAddress = addr;
  Serial.printf("\n➡️ Menginisialisasi LCD pada alamat 0x%02X...\n", addr);

  if (lcd != nullptr) {
    delete lcd;
    lcd = nullptr;
  }

  lcd = new LiquidCrystal_I2C(addr, 16, 2);
  lcd->init();
  lcd->backlight();
  isBacklightOn = true;

  // Bersihkan layar dan cetak teks
  lcd->clear();
  lcd->setCursor(0, 0);
  lcd->print("SMART-WARGA AIO");
  lcd->setCursor(0, 1);
  lcd->print("ADDR: 0x" + String(addr, HEX) + " OK!");

  Serial.println("✅ Perintah teks 'SMART-WARGA AIO' telah dikirim ke LCD.");
  Serial.println("💡 PERHATIKAN FISIK LAYAR LCD SEKARANG:");
  Serial.println("   - Jika layar menyala biru terang tapi huruf tidak kelihatan:");
  Serial.println("     --> AMBIL OBENG KECIL, PUTAR TRIMPOT (KOTAK BIRU DI BELAKANG LCD)!");
  Serial.println("     --> Putar perlahan ke kanan atau ke kiri sampai hurufnya kontras dan jelas.");
}

void setup() {
  Serial.begin(115200);
  delay(2000); // Tunggu Serial Monitor siap

  Serial.println("\n\n=======================================================");
  Serial.println("       SMART-WARGA: PENGUJIAN LCD 16x2 I2C (v1.0)");
  Serial.println("=======================================================");

  // Inisialisasi I2C Wire dengan pullup
  pinMode(PIN_SDA, INPUT_PULLUP);
  pinMode(PIN_SCL, INPUT_PULLUP);
  Wire.begin(PIN_SDA, PIN_SCL);
  Wire.setClock(100000); // 100 kHz standard speed

  // Pindai alamat I2C
  byte addr = scanI2CAddress();

  if (addr != 0) {
    initLcd(addr);
  } else {
    Serial.println("⚠️ Scan gagal menemukan alamat. Mencoba paksa alamat default 0x27...");
    initLcd(0x27);
  }

  Serial.println("\n-------------------------------------------------------");
  Serial.println("PETUNJUK KONTROL VIA SERIAL MONITOR:");
  Serial.println("  Ketik '1' + Enter -> Tes paksa alamat 0x27");
  Serial.println("  Ketik '2' + Enter -> Tes paksa alamat 0x3F");
  Serial.println("  Ketik 's' + Enter -> Pindai (Scan) ulang jalur I2C");
  Serial.println("  Ketik 'b' + Enter -> Kedipkan lampu latar (Backlight Test)");
  Serial.println("-------------------------------------------------------\n");
}

void loop() {
  static unsigned long lastSec = 0;
  static int detik = 0;

  // Baca input perintah dari Serial Monitor
  if (Serial.available() > 0) {
    char cmd = Serial.read();

    if (cmd == '1') {
      Serial.println("\n[MANUAL] Menguji paksa alamat 0x27...");
      initLcd(0x27);
    } else if (cmd == '2') {
      Serial.println("\n[MANUAL] Menguji paksa alamat 0x3F...");
      initLcd(0x3F);
    } else if (cmd == 's' || cmd == 'S') {
      byte addr = scanI2CAddress();
      if (addr != 0) initLcd(addr);
    } else if (cmd == 'b' || cmd == 'B') {
      if (lcd) {
        isBacklightOn = !isBacklightOn;
        if (isBacklightOn) {
          lcd->backlight();
          Serial.println("💡 Lampu Backlight: ON");
        } else {
          lcd->noBacklight();
          Serial.println("💡 Lampu Backlight: OFF");
        }
      }
    }
  }

  // Update timer di baris ke-2 LCD setiap 1 detik
  if (millis() - lastSec >= 1000) {
    lastSec = millis();
    detik++;

    if (lcd != nullptr) {
      lcd->setCursor(0, 1);
      lcd->print("Detik: " + String(detik) + "s (0x" + String(lcdAddress, HEX) + ")");
    }
    Serial.printf("[Status LCD] Berjalan normal: %d detik\n", detik);
  }
}

