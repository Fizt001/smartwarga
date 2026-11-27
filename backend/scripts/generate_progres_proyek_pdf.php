<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Barryvdh\DomPDF\Facade\Pdf;

$html = <<<'HTML'
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>Panduan & Draf Jawaban Formulir Progres Proyek - SMART-WARGA RW 05</title>
<style>
  @page {
    margin: 14mm 15mm 14mm 15mm;
  }
  body {
    font-family: 'Helvetica', 'Arial', sans-serif;
    color: #1e293b;
    font-size: 9pt;
    line-height: 1.45;
    margin: 0;
    padding: 0;
  }
  .header-banner {
    background-color: #0f172a;
    color: #ffffff;
    padding: 16px 20px;
    border-radius: 8px;
    border-bottom: 4px solid #10b981;
    margin-bottom: 16px;
  }
  .brand-tag {
    display: inline-block;
    background-color: #064e3b;
    color: #6ee7b7;
    font-size: 7.5pt;
    font-weight: bold;
    padding: 3px 10px;
    border-radius: 10px;
    border: 1px solid #10b981;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
  }
  .doc-title {
    font-size: 15pt;
    font-weight: bold;
    color: #ffffff;
    margin: 2px 0 4px 0;
  }
  .doc-subtitle {
    font-size: 9pt;
    color: #cbd5e1;
    margin: 0;
  }
  .meta-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
    border-top: 1px solid #334155;
    padding-top: 8px;
  }
  .meta-table td {
    font-size: 8pt;
    color: #94a3b8;
    padding-top: 6px;
  }
  .meta-table strong {
    color: #f8fafc;
  }
  .section-title {
    font-size: 11pt;
    font-weight: bold;
    color: #0f172a;
    background-color: #f1f5f9;
    border-left: 4px solid #10b981;
    padding: 6px 10px;
    margin: 14px 0 8px 0;
  }
  .section-intro {
    font-size: 8.5pt;
    color: #475569;
    margin: 0 0 8px 0;
  }
  table.checklist {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 12px;
  }
  table.checklist th {
    background-color: #0f172a;
    color: #ffffff;
    text-align: left;
    font-size: 8.5pt;
    padding: 6px 8px;
    border: 1px solid #0f172a;
  }
  table.checklist td {
    padding: 6px 8px;
    border: 1px solid #cbd5e1;
    font-size: 8.5pt;
    vertical-align: middle;
  }
  table.checklist tr:nth-child(even) td {
    background-color: #f8fafc;
  }
  .badge-check {
    display: inline-block;
    background-color: #d1fae5;
    color: #065f46;
    border: 1px solid #34d399;
    font-weight: bold;
    font-size: 7.5pt;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
  }
  .badge-role {
    display: inline-block;
    background-color: #e0e7ff;
    color: #3730a3;
    font-weight: bold;
    font-size: 7.5pt;
    padding: 1px 6px;
    border-radius: 4px;
  }
  .module-card {
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 8px 11px;
    margin-bottom: 8px;
    background-color: #ffffff;
    page-break-inside: avoid;
  }
  .module-header {
    font-size: 9.5pt;
    font-weight: bold;
    color: #065f46;
    margin-bottom: 4px;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 3px;
  }
  .module-row {
    font-size: 8.5pt;
    margin: 3px 0;
    color: #334155;
  }
  .module-row strong {
    color: #0f172a;
  }
  .screenshot-box {
    border: 1px solid #bae6fd;
    background-color: #f0f9ff;
    border-radius: 6px;
    padding: 8px 11px;
    margin-bottom: 8px;
    page-break-inside: avoid;
  }
  .screenshot-title {
    font-size: 9.2pt;
    font-weight: bold;
    color: #0369a1;
    margin-bottom: 3px;
  }
  .screenshot-desc {
    font-size: 8.4pt;
    color: #1e293b;
    margin: 0;
  }
  .issue-box {
    border: 1px solid #fecdd3;
    background-color: #fff1f2;
    border-radius: 6px;
    padding: 8px 11px;
    margin-bottom: 8px;
    page-break-inside: avoid;
  }
  .issue-title {
    font-size: 9pt;
    font-weight: bold;
    color: #9f1239;
    margin-bottom: 3px;
  }
  .plan-box {
    border: 1px solid #fde68a;
    background-color: #fffbeb;
    border-radius: 6px;
    padding: 8px 11px;
    margin-bottom: 8px;
    page-break-inside: avoid;
  }
  .plan-title {
    font-size: 9pt;
    font-weight: bold;
    color: #92400e;
    margin-bottom: 3px;
  }
  ul.compact {
    margin: 4px 0 4px 16px;
    padding: 0;
  }
  ul.compact li {
    margin-bottom: 4px;
    font-size: 8.5pt;
    color: #1e293b;
  }
  .footer-note {
    margin-top: 14px;
    padding-top: 8px;
    border-top: 1px solid #cbd5e1;
    font-size: 7.5pt;
    color: #64748b;
    text-align: center;
  }
  code {
    font-family: monospace;
    background-color: #f1f5f9;
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 8pt;
    color: #0f172a;
  }
</style>
</head>
<body>

  <div class="header-banner">
    <div class="brand-tag">SMART-WARGA &bull; PLATFORM DIGITAL RW 05 &amp; IOT TERPADU</div>
    <div class="doc-title">Panduan &amp; Draf Jawaban Formulir Progres Proyek</div>
    <p class="doc-subtitle">Ringkasan Fitur Selesai, Pemetaan Aktor, Panduan Bukti Screenshot, Rencana Lanjutan, serta Catatan Kendala Teknis</p>
    <table class="meta-table">
      <tr>
        <td><strong>Aplikasi:</strong> SMART-WARGA RW 05</td>
        <td><strong>URL Produksi:</strong> https://swarga.manajemensystem.my.id</td>
        <td><strong>Stack:</strong> Next.js + Laravel + ESP32 IoT</td>
      </tr>
    </table>
  </div>

  <!-- BAGIAN 1 -->
  <div class="section-title">1. Checklist Fitur yang Sudah Selesai Dikerjakan (Formulir Google Form)</div>
  <p class="section-intro">Pada bagian pilihan ganda/kotak centang di formulir, <strong>centang seluruh 7 opsi</strong> berikut karena seluruhnya sudah diimplementasikan pada backend, frontend, dan integrasi hardware:</p>

  <table class="checklist">
    <thead>
      <tr>
        <th style="width: 8%;">Status</th>
        <th style="width: 42%;">Opsi di Formulir</th>
        <th style="width: 50%;">Bukti Implementasi di Sistem SMART-WARGA</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge-check">[v]</span></td>
        <td><strong>Autentikasi (Login / Register / Manajemen Role)</strong></td>
        <td>Laravel Sanctum token auth, registrasi + scan RFID, ACC RT, 8 role RBAC.</td>
      </tr>
      <tr>
        <td><span class="badge-check">[v]</span></td>
        <td><strong>Dashboard Ringkasan / Statistik</strong></td>
        <td>Beranda Warga, Dashboard Pengurus (Sensus/Kas), &amp; Dashboard Pos Gerbang Satpam.</td>
      </tr>
      <tr>
        <td><span class="badge-check">[v]</span></td>
        <td><strong>Manajemen Data Warga dan Kartu Keluarga</strong></td>
        <td>Sensus 300 unit hunian (RT 01-03), pemisahan KK Utama vs KK Tambahan, anggota keluarga.</td>
      </tr>
      <tr>
        <td><span class="badge-check">[v]</span></td>
        <td><strong>Layanan Surat Pengantar / Administrasi</strong></td>
        <td>Pengajuan surat online, ACC berjenjang RT &amp; RW, unduh PDF, + Aset/UMKM/Koperasi/Posyandu/RUKAM.</td>
      </tr>
      <tr>
        <td><span class="badge-check">[v]</span></td>
        <td><strong>Pencatatan Iuran / Keuangan Kas</strong></td>
        <td>Kalender IPL 12 bulan, QRIS/Upload/Dompet Warga, top-up, gaji rutin, &amp; rekap kas RT-RW.</td>
      </tr>
      <tr>
        <td><span class="badge-check">[v]</span></td>
        <td><strong>Laporan / Aspirasi / Pengaduan Warga</strong></td>
        <td>Pusat pengaduan fasilitas dengan pelacakan status + Tombol Panik Darurat terhubung sirine.</td>
      </tr>
      <tr>
        <td><span class="badge-check">[v]</span></td>
        <td><strong>Integrasi Scanner RFID</strong></td>
        <td>ESP32 Dual-Area (Reader 1 Gerbang Pin 5 + Servo; Reader 2 Kios Pin 4 + LCD) &amp; pairing e-KTP.</td>
      </tr>
    </tbody>
  </table>

  <!-- BAGIAN 2 -->
  <div class="section-title">2. Draf Jawaban: Daftar Fitur Selesai, Fungsi Utama, dan Aktor Pengakses</div>
  <p class="section-intro">Salin penjelasan terstruktur berikut ke kolom isian <em>"Jelaskan daftar fitur yang sudah selesai, fungsi utama, serta aktor yang dapat mengaksesnya"</em>:</p>

  <div class="module-card">
    <div class="module-header">1. Autentikasi, Registrasi Warga &amp; Manajemen Role (RBAC)</div>
    <div class="module-row"><strong>Fungsi Utama:</strong> Login/logout berbasis token (Laravel Sanctum), pendaftaran warga baru beserta pemilihan blok/unit rumah dan pemindaian UID e-KTP/RFID langsung dari ESP32, verifikasi/persetujuan (ACC) akun baru oleh Ketua RT, serta pembatasan login khusus KK Utama.</div>
    <div class="module-row"><strong>Aktor:</strong> <span class="badge-role">Super Admin</span> <span class="badge-role">Ketua RW 05</span> <span class="badge-role">Sekretaris RW/RT</span> <span class="badge-role">Bendahara RW/RT</span> <span class="badge-role">Ketua RT</span> <span class="badge-role">Satpam Gerbang</span> <span class="badge-role">Warga (KK Utama)</span></div>
  </div>

  <div class="module-card">
    <div class="module-header">2. Dashboard Ringkasan &amp; Statistik Lingkungan</div>
    <div class="module-row"><strong>Fungsi Utama:</strong> Menampilkan ringkasan status hunian, jumlah KK terdaftar, status tagihan IPL, saldo dompet warga, agenda kegiatan dan pengumuman RW, status antrean kios pelayanan, serta status kesehatan perangkat IoT secara real-time.</div>
    <div class="module-row"><strong>Aktor:</strong> Warga (Beranda Warga), Pengurus RT/RW &amp; Super Admin (Dashboard Pengurus), Satpam (Dashboard Monitoring Pos Gerbang &amp; IoT).</div>
  </div>

  <div class="module-card">
    <div class="module-header">3. Manajemen Data Warga, Sensus Hunian &amp; Kartu Keluarga (KK)</div>
    <div class="module-row"><strong>Fungsi Utama:</strong> Pendataan 300 unit hunian (RT 01, 02, 03), pemisahan status KK Utama (penanggung jawab rumah &amp; IPL) dengan KK Pendukung/Anggota Keluarga, pengelolaan data anggota keluarga serumah, serta penetapan Kepala Keluarga oleh pengurus.</div>
    <div class="module-row"><strong>Aktor:</strong> Super Admin, Ketua RW, Ketua RT, Sekretaris, Bendahara (mengelola sensus &amp; ACC warga), serta Warga KK Utama (mengelola anggota keluarga serumah).</div>
  </div>

  <div class="module-card">
    <div class="module-header">4. Layanan Surat Pengantar &amp; Administrasi Digital</div>
    <div class="module-row"><strong>Fungsi Utama:</strong> Pengajuan surat pengantar RT/RW secara online, alur validasi dan persetujuan berjenjang (RT lalu RW), penerbitan dokumen PDF siap unduh, serta modul layanan terpadu (Peminjaman Aset Fasum, UMKM Warga, Koperasi Mikro, Posyandu Digital, RUKAM &amp; Ambulans Siaga).</div>
    <div class="module-row"><strong>Aktor:</strong> Warga KK Utama (mengajukan &amp; mengunduh surat/layanan), Sekretaris &amp; Ketua RT/RW / Super Admin (memberi nomor, memvalidasi, menyetujui/menolak).</div>
  </div>

  <div class="module-card">
    <div class="module-header">5. Pencatatan Iuran Lingkungan (IPL), Dompet Warga &amp; Keuangan Kas</div>
    <div class="module-row"><strong>Fungsi Utama:</strong> Kalender tagihan IPL 12 bulan, pembayaran via QRIS / unggah bukti transfer / potong saldo dompet warga, top-up saldo, verifikasi setoran, pencatatan pengeluaran rutin (gaji satpam &amp; petugas kebersihan), serta transparansi rekap kas RT ke RW.</div>
    <div class="module-row"><strong>Aktor:</strong> Warga KK Utama (melihat tagihan, membayar IPL, top-up, memantau transparansi kas), Bendahara RT/RW &amp; Super Admin (generate tagihan, ACC pembayaran/top-up, pencairan kas), Ketua RT/RW (supervisi &amp; audit).</div>
  </div>

  <div class="module-card">
    <div class="module-header">6. Laporan / Aspirasi / Pengaduan Warga &amp; Tombol Panik Darurat</div>
    <div class="module-row"><strong>Fungsi Utama:</strong> Pelaporan keluhan fasilitas maupun aspirasi lingkungan lengkap dengan pelacakan status penanganan, serta Tombol Panik Darurat yang memicu sirine fisik di pos satpam dan broadcast peringatan ke petugas.</div>
    <div class="module-row"><strong>Aktor:</strong> Warga KK Utama (membuat laporan &amp; memicu tombol panik), Ketua RT/RW, Sekretaris, Satpam Gerbang, dan Super Admin (menindaklanjuti laporan &amp; mengendalikan status sirine).</div>
  </div>

  <div class="module-card">
    <div class="module-header">7. Integrasi Hardware IoT &amp; Scanner RFID (ESP32 Dual-Area: Gerbang &amp; Kios)</div>
    <div class="module-row"><strong>Fungsi Utama:</strong> Satu modul ESP32 mengendalikan 2 RFID Reader RC522 sekaligus &mdash; <strong>Area 1 (Pos Gerbang):</strong> tap e-KTP/RFID membuka palang pintu servo otomatis, absensi ronda, dan sirine darurat; <strong>Area 2 (Meja Kios):</strong> tap e-KTP terdaftar untuk nomor antrean &amp; legalisasi layanan, pairing kartu baru, dan setor Bank Sampah. Kartu asing/tidak terdaftar otomatis ditolak masuk antrean. Dilengkapi menu setup Wi-Fi ESP32 khusus petugas di PC Station.</div>
    <div class="module-row"><strong>Aktor:</strong> Satpam Gerbang, Petugas Kios/Pengurus RT/RW, Super Admin (monitoring IoT, setup Wi-Fi perangkat, legalisasi layanan), serta Warga terdaftar (tap e-KTP di gerbang/kios &amp; pairing kartu mandiri).</div>
  </div>

  <!-- BAGIAN 3 -->
  <div class="section-title">3. Panduan Pengambilan 4 Bukti Screenshot (Unggahan Google Form)</div>
  <p class="section-intro">Ambil tangkapan layar langsung dari aplikasi produksi <code>https://swarga.manajemensystem.my.id</code> sesuai urutan berikut:</p>

  <div class="screenshot-box">
    <div class="screenshot-title">Screenshot 1 &mdash; Halaman Dashboard Utama atau Halaman Login</div>
    <p class="screenshot-desc"><strong>Saran Terbaik:</strong> Ambil screenshot <strong>Halaman Login Dashboard SMART-WARGA</strong> yang tampil 1 layar penuh di desktop (memperlihatkan logo, statistik wilayah, showcase 6 fitur aplikasi, dan form login + tombol cepat role). <em>Alternatif:</em> Login sebagai Ketua RW / Super Admin lalu screenshot halaman dashboard utama.</p>
  </div>

  <div class="screenshot-box">
    <div class="screenshot-title">Screenshot 2 &mdash; Fitur Manajemen Data yang Sudah Berfungsi</div>
    <p class="screenshot-desc">Login sebagai <strong>Super Admin</strong> atau <strong>Ketua RT 01</strong>, lalu buka menu <strong>Sensus 300 Hunian</strong> (menampilkan data rumah, KK Utama/Tambahan, dan status persetujuan warga) <em>atau</em> menu <strong>Verifikasi Iuran &amp; Kas RT</strong> (menampilkan daftar tagihan dan mutasi kas).</p>
  </div>

  <div class="screenshot-box">
    <div class="screenshot-title">Screenshot 3 &mdash; Bukti Proses Berjalan atau Form Tambah/Edit Data</div>
    <p class="screenshot-desc">Pilih salah satu: (a) Buka tab <strong>Daftar Warga Baru</strong> di halaman Login yang memperlihatkan form NIK, KK, unit rumah, dan tombol <em>"Pindai ESP32"</em>; atau (b) Login sebagai <strong>Warga (Budi Santoso)</strong> dan buka form <strong>Ajukan Surat Pengantar / Buat Pengaduan / Pembayaran IPL</strong>; atau (c) Login sebagai Bendahara/Sekretaris saat memproses ACC.</p>
  </div>

  <div class="screenshot-box">
    <div class="screenshot-title">Screenshot 4 &mdash; Fitur Tambahan RFID</div>
    <p class="screenshot-desc">Login sebagai <strong>Pak Bambang (Satpam)</strong> atau <strong>Super Admin</strong>, lalu screenshot halaman <strong>Monitoring Wilayah &amp; IoT</strong> (status ESP32 Online, log tap RFID gerbang, antrean Kios Pelayanan, kontrol Sirine) atau halaman <strong>Setup Wi-Fi IoT</strong> (integrasi Dual-Area Gerbang &amp; Kios). Jika memungkinkan, gabungkan dalam 1 kolase bersama foto fisik rangkaian ESP32 + RFID RC522.</p>
  </div>

  <!-- BAGIAN 4 -->
  <div class="section-title">4. Draf Jawaban: Fitur Belum Selesai / Rencana Lanjutan &amp; Kendala Teknis</div>
  <p class="section-intro">Salin ringkasan berikut ke pertanyaan terakhir <em>"Sebutkan fitur yang sedang atau belum dikerjakan beserta kendala teknis yang ditemui"</em>:</p>

  <div class="plan-box">
    <div class="plan-title">Fitur yang Sedang Disempurnakan / Rencana Pengembangan Lanjutan:</div>
    <ul class="compact">
      <li><strong>Otomasi Payment Gateway QRIS (Webhook Real-time):</strong> Pembayaran IPL via QRIS dan upload bukti transfer saat ini sudah berjalan dengan verifikasi Bendahara RT; tahap berikutnya integrasi webhook Payment Gateway agar status lunas berubah otomatis.</li>
      <li><strong>Notifikasi WhatsApp Gateway Otomatis:</strong> Pengiriman pengingat tagihan IPL, status ACC surat pengantar, dan alert Tombol Panik secara otomatis ke nomor WhatsApp warga/petugas.</li>
      <li><strong>Kalibrasi Permanen &amp; Casing Hardware Bank Sampah:</strong> Penyempurnaan kalibrasi sensor timbangan digital (load cell) dan perakitan casing permanen untuk modul ESP32, servo palang, dan LCD di lapangan.</li>
    </ul>
  </div>

  <div class="issue-box">
    <div class="issue-title">Kendala Teknis yang Ditemui Selama Pengembangan &amp; Solusinya:</div>
    <ul class="compact">
      <li><strong>Stabilitas Daya &amp; Koneksi Wi-Fi ESP32 (Brownout &amp; Mixed-Content Browser):</strong> Saat ESP32 menyalakan hotspot setup bersamaan dengan polling 2 reader RFID dan servo, lonjakan arus memicu reset brownout serta browser HP memblokir scan Wi-Fi lokal dari domain HTTPS. <strong>Solusi:</strong> Pengaturan daya TX Wi-Fi ke 13 dBm, jeda polling RFID saat mode setup, pemindahan setup ke PC Station petugas (Satpam/Kios), dan aktivasi Dual-Area otomatis.</li>
      <li><strong>Validasi Kartu RFID Asing di Meja Kios:</strong> Sebelumnya kartu tanpa identitas sempat mendapat nomor antrean otomatis. <strong>Solusi:</strong> Pengetatan validasi <code>rfid_uid</code> pada endpoint <code>/api/iot/pelayanan/tap</code> agar kartu asing langsung ditolak dengan pesan LCD <em>"KARTU ASING / BELUM TERDAFTAR"</em>, sambil tetap menyimpan UID ke cache untuk pendaftaran kartu baru.</li>
      <li><strong>Kompleksitas Hak Akses Multi-Role &amp; Multi-KK:</strong> Penyelarasan wewenang 8 role pengguna (Super Admin, RW, RT, Sekretaris, Bendahara, Satpam, Warga) dan pembatasan login khusus KK Utama agar penagihan IPL per unit rumah serta alur persetujuan tidak tumpang tindih.</li>
    </ul>
  </div>

  <div class="footer-note">
    Dokumen Panduan Pengisian Progres Proyek SMART-WARGA RW 05 &bull; Dibuat otomatis dari kondisi aktual codebase dan server produksi.
  </div>

</body>
</html>
HTML;

$pdf = Pdf::loadHTML($html)->setPaper('a4', 'portrait');

$outputPath = '/Users/admin/Herd/smartwarga/docs/Panduan_Jawaban_Progres_Proyek_SMART_WARGA.pdf';
$pdf->save($outputPath);

echo "PDF berhasil dibuat: {$outputPath} (" . filesize($outputPath) . " bytes)\n";
