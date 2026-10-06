# SMART-WARGA — Frontend Web Platform (Next.js App Router)

Aplikasi antarmuka web modern untuk platform SMART-WARGA yang dirancang dengan pendekatan **Mobile-First Responsive Layout**, ikon **Lucide React**, dan **Tailwind CSS**. Dilengkapi dengan fitur **Toggle Desktop vs Mobile Device View** untuk kemudahan pengujian tampilan smartphone secara langsung.

---

## 📱 Fitur & Tampilan Antarmuka

1. **Dual Display Mode (Toggle Desktop vs Mobile Frame):**
   - **Mode Mobile Frame:** Menampilkan aplikasi dalam bingkai simulasi smartphone (lengkap dengan notch/island) untuk pengalaman resident app yang realistis.
   - **Mode Desktop Wide:** Tampilan responsif lebar penuh untuk dashboard pengurus RT / RW dan monitor IoT.
2. **Autentikasi & Registrasi Warga Interaktif:**
   - Pemilihan RT (01, 02, 03), Blok (A, B, C, D), dan Nomor Rumah (1-25) yang otomatis terhubung ke kuota 300 unit rumah di database.
   - Deteksi rumah berpenghuni vs tersedia.
   - Quick Demo Credential chips untuk login cepat ke akun dummy (`Budi`, `Siti`, `RT 01`, `Ketua RW`, `Super Admin`).
3. **Banner Status Pending:**
   - Warga yang baru mendaftar mendapatkan status `pending` dan notifikasi bahwa pendaftarannya sedang menunggu persetujuan dari pengurus RT.
4. **Dompet Warga & Keuangan IPL:**
   - Kartu saldo live dengan tombol Top-Up instan (modal QRIS / rekening transfer).
   - Riwayat tagihan IPL bulanan dengan 2 opsi bayar:
     * **Potong Saldo Dompet Warga:** Pemotongan instan 1-klik, status otomatis LUNAS.
     * **Upload Bukti Transfer / QRIS:** Mengunggah resi untuk diverifikasi pengurus.
   - Rekapitulasi setoran kas RT ke RW.
5. **Pusat Layanan Warga (LayananView):**
   - **Surat Pengantar RT/RW:** Form pengajuan surat, tracking status berjenjang (`Diajukan` -> `Disetujui RT` -> `Disetujui RW`), dan tombol unduh PDF resmi sah elektronik.
   - **Etalase UMKM Warga:** Katalog produk/jasa warga dengan tombol *Direct WhatsApp Order* dan form tambah jualan.
   - **Koperasi Simpan Pinjam:** Kalkulator cicilan bulanan otomatis dan form pengajuan pinjaman modal.
   - **Peminjaman Aset RT:** Daftar inventaris (tenda, sound system, kursi) dan form permohonan pinjam.
   - **Posyandu Balita:** Rekam medis tumbuh kembang anak (BB & TB).
6. **Pusat Pengaduan & Aspirasi (PengaduanView):**
   - Form lapor berfoto + kategori (Kebersihan, Keamanan, Fasilitas, Ketertiban).
   - Timeline histori tanggapan pengurus dari `Laporan Masuk` -> `Diproses` -> `Selesai`.
7. **Pusat Monitoring IoT Real-Time (IoTView):**
   - Indikator Status Sirine Wilayah (berkedip merah saat darurat aktif).
   - Saklar kendali manual sirine (ON/OFF).
   - **Live Hardware Demonstration Panel:** Tombol simulasi hardware (*Test Tap Kartu Ronda & Buka Palang*, *Test Timbang Kaleng 2.5kg*, *Test Timbang Plastik 5kg*, *Test Panic Button Pos*).
   - Log Absensi Ronda Pos Satpam, Log Timbangan Bank Sampah (otomatis mengkreditkan saldo rupiah ke dompet warga), dan Status Kesehatan 3 Node ESP32.
8. **Dashboard Pengurus Lingkungan (PengurusView):**
   - Tab ACC / Approval pendaftaran warga pending.
   - Generate massal tagihan IPL bulanan seluruh KK.
   - Verifikasi bukti transfer IPL dan verifikasi pengajuan Top-Up saldo.
   - Validasi persuratan tingkat RT & RW.

---

## 🛠️ Menjalankan di Lingkungan Lokal

### 1. Prasyarat
- Node.js 18+ (atau 20+ LTS)
- Backend Laravel berjalan di `http://smartwarga.test`

### 2. Instalasi Dependensi
```bash
cd frontend
npm install
```

### 3. Konfigurasi Endpoint (.env.local)
File `.env.local` otomatis mengarah ke API Backend Laravel Herd:
```env
NEXT_PUBLIC_API_URL=http://smartwarga.test/api
```

### 4. Menjalankan Server Pengembangan
```bash
npm run dev
```
Buka browser pada: [http://localhost:3000](http://localhost:3000)

### 5. Build Produksi
```bash
npm run build
npm start
```
