# SMART-WARGA — Backend RESTful API & IoT Gateway

Backend sistem informasi manajemen lingkungan warga berbasis **Laravel 11+ REST API**, **Laravel Sanctum (Token Auth)**, **Laravel Reverb (Real-Time WebSocket Broadcasting)**, dan **DomPDF (Official PDF Document Generator)**.

---

## 🚀 Fitur Utama Backend

1. **Role-Based Access Control (RBAC):**
   - 6 Tingkatan Akses: `super_admin`, `rw`, `rt`, `bendahara`, `sekretaris`, `warga`.
   - Warga Registration Approval: Status pendaftaran `pending` yang harus di-ACC pengurus RT sebelum menu aktif.
2. **Master Wilayah & Perumahan:**
   - 1 RW menaungi 3 RT (RT 01, RT 02, RT 03).
   - Total 300 unit rumah terdata dengan format Blok A1-A25, B1-B25, C1-C25, D1-D25 per RT.
3. **Modul Keuangan & IPL:**
   - Master tarif IPL (Iuran kas RT + tarikan rutin RW).
   - Generate tagihan bulanan massal untuk seluruh KK terdaftar.
   - Pembayaran instan via Dompet Saldo Warga atau upload bukti transfer manual/QRIS.
   - Top-up saldo dompet warga dengan verifikasi bendahara.
   - Rekapitulasi setoran kas RT ke RW.
4. **Layanan Administrasi Warga:**
   - Pengajuan surat pengantar digital (SKCK, Domisili, SKTM, dll.) dengan validasi berjenjang (RT -> RW) dan auto-generate PDF siap unduh.
   - Pengaduan warga berfoto dengan histori tanggapan pengurus.
   - Agenda kegiatan & pengumuman broadcast dengan RSVP dan donasi sukarela.
   - Etalase UMKM warga dengan tautan direct order WhatsApp.
   - Koperasi simpan pinjam (simulasi tenor dan pencairan ke dompet warga).
   - Peminjaman aset lingkungan (tenda, sound system, kursi).
   - Rukun Kematian (RUKAM) dan pencairan santunan duka.
5. **Gateway Integrasi IoT (3 Node ESP32):**
   - `POST /api/iot/ronda/tap`: Absensi ronda malam dan buka palang pintu gerbang (servo).
   - `POST /api/iot/panic-button`: Tombol darurat fisik dengan broadcast real-time ke web.
   - `GET /api/iot/sirine/status`: Polling status sirine wilayah untuk aktuator relay.
   - `POST /api/iot/bank-sampah/setor`: Timbangan digital sampah daur ulang dengan kalkulasi otomatis dan kredit instan ke saldo dompet warga.
   - `POST /api/iot/posyandu/catat`: Pencatatan mandiri berat & tinggi badan balita.

---

## 🔑 Akun Default Hasil Seeding

Semua akun menggunakan password standar: **`password`**

| Nama | Email | Role | RT | Status | Keterangan |
|---|---|---|---|---|---|
| Super Administrator | `admin@smartwarga.test` | `super_admin` | - | `approved` | Akses penuh seluruh sistem |
| Ketua RW 05 | `rw@smartwarga.test` | `rw` | - | `approved` | Validasi surat, broadcast RW, rekap kas |
| Ketua RT 01 | `rt01@smartwarga.test` | `rt` | 01 | `approved` | ACC pendaftaran, tagihan RT 01 |
| Ketua RT 02 | `rt02@smartwarga.test` | `rt` | 02 | `approved` | Pengurus RT 02 |
| Ketua RT 03 | `rt03@smartwarga.test` | `rt` | 03 | `approved` | Pengurus RT 03 |
| Bendahara Lingkungan | `bendahara@smartwarga.test` | `bendahara` | - | `approved` | Verifikasi IPL, top-up dompet, RUKAM |
| Sekretaris Lingkungan | `sekretaris@smartwarga.test` | `sekretaris` | - | `approved` | Administrasi & pengumuman |
| Budi Santoso | `budi@smartwarga.test` | `warga` | 01 | `approved` | Warga aktif, Blok A1, Saldo awal Rp150.000, RFID: `RFID_WARGA_01` |
| Siti Rahma | `siti@smartwarga.test` | `warga` | 01 | `pending` | Warga baru menunggu ACC pengurus |

---

## 🛠️ Instalasi & Menjalankan Lokal

### 1. Prasyarat
- macOS + **Laravel Herd** (PHP 8.3+)
- MySQL Database (`smart_warga_db`)

### 2. Setup Database & Environment
```bash
cd backend

# Buat database jika belum ada
mysql -u root -e "CREATE DATABASE IF NOT EXISTS smart_warga_db;"

# Hubungkan domain Herd
herd link smartwarga

# Jalankan migrasi dan seeding data awal
php artisan migrate:fresh --seed

# Hubungkan symlink storage publik
php artisan storage:link
```

### 3. Real-Time WebSocket (Laravel Reverb)
Jalankan server WebSocket Reverb saat development:
```bash
php artisan reverb:start
```

---

## 📡 Daftar REST API Endpoints

### Publik & Autentikasi
- `POST /api/auth/register` — Daftar warga baru
- `POST /api/auth/login` — Login mendapatkan Bearer Token
- `POST /api/auth/logout` — Logout dan hapus token
- `GET /api/auth/profile` — Profil pengguna aktif
- `GET /api/houses` — Daftar 300 rumah dan status hunian
- `GET /api/waste-rates` — Daftar harga sampah per kg

### Layanan Warga (Bearer Token)
- `GET /api/wallet/balance` & `GET /api/wallet/transactions`
- `POST /api/wallet/topup-request` — Pengajuan top-up saldo
- `GET /api/ipl/billings` — Daftar tagihan IPL
- `POST /api/ipl/billings/{id}/pay-wallet` — Bayar IPL potong saldo dompet
- `POST /api/ipl/billings/{id}/pay-upload` — Bayar IPL upload bukti transfer
- `GET /api/letters` & `POST /api/letters` — Pengajuan surat pengantar
- `GET /api/letters/{id}/download` — Unduh PDF surat pengantar sah
- `GET /api/complaints` & `POST /api/complaints` — Pengaduan warga berfoto
- `GET /api/announcements` — Pengumuman lingkungan
- `POST /api/announcements/{id}/rsvp` — Konfirmasi kehadiran gotong-royong
- `POST /api/announcements/{id}/donate` — Donasi sukarela
- `GET /api/umkm` & `POST /api/umkm` — Etalase produk warga
- `GET /api/assets` & `POST /api/assets/loans` — Pinjam tenda, kursi, dll.
- `GET /api/koperasi/loans` & `POST /api/koperasi/loans` — Pengajuan pinjaman koperasi
- `POST /api/rukam` — Laporan duka RUKAM

### Pengurus & Admin (`/api/admin/...`)
- `GET /api/admin/warga` — Daftar warga (filter pending/approved)
- `POST /api/admin/warga/{id}/approve` — ACC pendaftaran warga
- `POST /api/admin/ipl/generate/{masterId}` — Generate massal tagihan IPL
- `POST /api/admin/ipl/billings/{id}/verify` — Verifikasi bayar IPL
- `POST /api/admin/wallet/topups/{id}/verify` — Verifikasi top-up dompet
- `POST /api/admin/letters/{id}/approve-rt` & `approve-rw` — Validasi surat
- `PATCH /api/admin/complaints/{id}/status` — Perbarui status pengaduan
- `POST /api/admin/rukam/{id}/disburse` — Pencairan santunan duka

### Integrasi IoT ESP32 (`/api/iot/...`)
- `POST /api/iot/ronda/tap` — Absensi tap kartu ronda + buka servo gerbang
- `POST /api/iot/panic-button` — Pemicu tombol panik darurat
- `GET /api/iot/sirine/status` — Cek status sirine untuk aktuator relay
- `POST /api/iot/sirine/toggle` — Saklar manual sirine dari web
- `POST /api/iot/bank-sampah/setor` — Timbang sampah & kredit saldo dompet
- `POST /api/iot/posyandu/catat` — Rekam timbangan balita posyandu
- `GET /api/iot/devices` — Status kesehatan hardware (last ping)
