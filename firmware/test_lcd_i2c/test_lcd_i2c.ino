/*
 * ==================================================================================================
 * SMART-WARGA: TEST & DIAGNOSTIK LAYAR LCD 16x2 I2C
 * ==================================================================================================
 * Upload sketch ini untuk mengecek dan mengatasi LCD yang belum tampil.
 * 
 * KONEKSI KABEL KE ESP32:
 * 1. GND -> GND ESP32
 * 2. VCC -> VIN / 5V ESP32 (WAJIB 5V, JANGAN 3.3V!)
 * 3. SDA -> GPIO 21 ESP32
 * 4. SCL -> GPIO 22 ESP32
 * ==================================================================================================
 */

#include <Wire.h>
#include <LiquidCrystal_I2C.h>

#define PIN_I2C_SDA 21
#define PIN_I2C_SCL 22

LiquidCrystal_I2C* lcd = nullptr;
byte detectedAddr = 0;

void setup() {
  Serial.begin(115200);
  delay(1500);

  Serial.println("\n\n=======================================================");
  Serial.println("  SMART-WARGA: DIAGNOSTIK LCD 16x2 I2C (ESP32)");
  Serial.println("=======================================================");

  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
  Wire.setClock(100000); // 100 kHz standard speed

  Serial.println("Memindai bus I2C pada SDA: GPIO 21, SCL: GPIO 22...");

  int nDevices = 0;
  for (byte address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    byte error = Wire.endTransmission();

    if (error == 0) {
      Serial.printf("🔍 [KETEMU!] Perangkat I2C terdeteksi di alamat HEX: 0x%02X\n", address);
      if (detectedAddr == 0) detectedAddr = address;
      nDevices++;
    } else if (error == 4) {
      Serial.printf("❌ Error tidak dikenal pada alamat 0x%02X\n", address);
    }
    delay(2);
  }

  if (nDevices == 0) {
    Serial.println("\n⚠️ [HASIL SCAN] TIDAK ADA perangkat I2C yang terdeteksi!");
    Serial.println("-------------------------------------------------------");
    Serial.println("PENYEBAB & SOLUSI:");
    Serial.println("1. Kabel SDA/SCL terbalik atau longgar: SDA wajib ke GPIO 21, SCL ke GPIO 22.");
    Serial.println("2. VCC belum dapat 5V: Pastikan VCC dicolok ke VIN (5V dari USB).");
    Serial.println("3. Coba tes pakai fallback alamat standar: 0x27");
    Serial.println("-------------------------------------------------------\n");
    detectedAddr = 0x27; // Coba paksa 0x27
  } else {
    Serial.printf("\n✅ [HASIL SCAN] Berhasil mendeteksi LCD di alamat: 0x%02X\n", detectedAddr);
  }

  Serial.printf("Menginisialisasi LiquidCrystal_I2C(0x%02X, 16, 2)...\n", detectedAddr);
  lcd = new LiquidCrystal_I2C(detectedAddr, 16, 2);
  lcd->init();
  lcd->backlight();

  // Tes Kedipkan Backlight 3 Kali (Membuktikan komunikasi I2C aktif)
  Serial.println("Menguji kedip lampu latar (Backlight)...");
  for (int i = 0; i < 3; i++) {
    lcd->noBacklight();
    delay(300);
    lcd->backlight();
    delay(300);
  }

  lcd->clear();
  lcd->setCursor(0, 0);
  lcd->print("SMART-WARGA AIO");
  lcd->setCursor(0, 1);
  lcd->print("LCD OK! 0x" + String(detectedAddr, HEX));

  Serial.println("✅ Teks berhasil dikirim ke layar LCD!");
  Serial.println("\n⚠️ JIKA LAMPU MENYALA TAPI TEKS MASIH BELUM KELIHATAN:");
  Serial.println("-> AMBIL OBENG KECIL, PUTAR TRIMPOT (POTENSIOMETER KOTAK BIRU DI BELAKANG LCD)!");
  Serial.println("-> Putar ke kanan/kiri perlahan sampai tulisan muncul tajam.\n");
}

void loop() {
  static unsigned long lastUpdate = 0;
  static int counter = 0;

  if (millis() - lastUpdate >= 1000) {
    lastUpdate = millis();
    counter++;

    if (lcd) {
      lcd->setCursor(0, 1);
      lcd->print("Detik: " + String(counter) + "s   ");
    }
    Serial.printf("LCD Berjalan: Detik %d\n", counter);
  }
}

