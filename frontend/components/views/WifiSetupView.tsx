'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Radio, 
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Globe,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { fetchApi } from '@/lib/api';

interface WifiSetupViewProps {
  onSuccessReturn?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export default function WifiSetupView({ onSuccessReturn, onNavigateTab }: WifiSetupViewProps) {
  const [deviceOnline, setDeviceOnline] = useState<boolean | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [showReconfig, setShowReconfig] = useState(false);

  useEffect(() => {
    checkCurrentDeviceStatus();
    // Polling status perangkat tiap 4 detik untuk auto-detect saat online
    const interval = setInterval(checkCurrentDeviceStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  const checkCurrentDeviceStatus = async () => {
    setCheckingStatus(true);
    try {
      const res = await fetchApi('/iot/device/status');
      if (res && res.is_online !== undefined) {
        setDeviceOnline(Boolean(res.is_online));
      }
    } catch {
      setDeviceOnline(false);
    } finally {
      setCheckingStatus(false);
    }
  };

  const openPortal = () => {
    window.open('http://192.168.10.1/login', '_blank');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Top Banner & Status Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-100/40 to-teal-100/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Koneksi Wi-Fi & Setup IoT
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Hubungkan ESP32 AIO ke router Wi-Fi rumah agar sistem berstatus ONLINE
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 ${
                deviceOnline
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  deviceOnline ? 'bg-emerald-600 animate-ping' : 'bg-rose-500'
                }`}
              />
              {checkingStatus
                ? 'Memeriksa...'
                : deviceOnline
                ? 'STATUS: ONLINE'
                : 'STATUS: OFFLINE'}
            </div>
            <button
              onClick={checkCurrentDeviceStatus}
              title="Cek Status Terkini"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
            >
              <RefreshCw className={`w-4 h-4 ${checkingStatus ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Jika Perangkat Sudah ONLINE dan pengguna tidak meminta rekonfigurasi */}
      {deviceOnline && !showReconfig ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-200/80 space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900">Perangkat IoT ESP32 ONLINE!</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Kontroler ESP32 telah terhubung ke router Wi-Fi dan siap melayani sensor RFID gerbang, kios antrean, serta tombol panik darurat.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                if (onSuccessReturn) onSuccessReturn();
                else if (onNavigateTab) onNavigateTab('dashboard');
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-md shadow-emerald-700/20 transition flex items-center justify-center gap-2"
            >
              <span>Kembali ke Beranda</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowReconfig(true)}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold text-sm transition"
            >
              Ganti Jaringan Wi-Fi
            </button>
          </div>
        </div>
      ) : (
        /* Alur Setup 3 Langkah Jelas Sesuai Konsep Baru */
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-8">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full w-fit mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Petunjuk Sambungan 3 Langkah
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              Cara Menyambungkan ESP32 ke Wi-Fi Rumah
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Saat belum ada Wi-Fi, ESP32 memancarkan sinyal hotspot terbuka. Ikuti 3 langkah berikut dari HP Anda:
            </p>
          </div>

          {/* STEP 1 */}
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white font-black text-base flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/30">
              1
            </div>
            <div className="flex-1 space-y-2.5">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Hubungkan Wi-Fi HP Anda ke Hotspot ESP32
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Buka menu Wi-Fi di HP / Laptop Anda, lalu sambungkan ke hotspot pancingan terbuka:
              </p>

              {/* SSID Info Card */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Nama Hotspot Wi-Fi (SSID):
                  </div>
                  <div className="font-mono text-sm sm:text-base font-black text-emerald-700 flex items-center gap-2">
                    <Wifi className="w-4 h-4" />
                    SmartWarga-Setup
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3.5 py-1.5 rounded-xl">
                    Tanpa Password
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2 */}
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white font-black text-base flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30">
              2
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Jangan Muat Ulang (Reload) Halaman Ini
                </h3>
              </div>
              <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-xs text-amber-950 leading-relaxed">
                <strong>Penting:</strong> Setelah HP tersambung ke <u>SmartWarga-Setup</u>, biarkan halaman browser ini tetap terbuka dan <strong>jangan di-refresh</strong> (karena hotspot ESP32 tidak memiliki kuota internet luar).
              </div>
            </div>
          </div>

          {/* STEP 3 */}
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white font-black text-base flex items-center justify-center shrink-0 shadow-md shadow-blue-600/30">
              3
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Otomatis Muncul di HP atau Buka Portal (192.168.10.1)
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Setelah HP terhubung ke <strong>SmartWarga-Setup</strong>, layar HP biasanya akan <strong>otomatis membuka pop-up Captive Portal</strong> untuk setup Wi-Fi. Jika tidak otomatis terbuka, klik tombol di bawah:
              </p>

              {/* Big Action Button */}
              <div className="pt-1">
                <a
                  href="http://192.168.10.1/login"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-sm sm:text-base shadow-lg shadow-emerald-700/25 transition flex items-center justify-center gap-2.5 text-center"
                >
                  <Globe className="w-5 h-5 shrink-0" />
                  <span>BUKA PORTAL SETUP (192.168.10.1/login)</span>
                  <ExternalLink className="w-4 h-4 shrink-0" />
                </a>
              </div>

              {/* Fitur di dalam Portal Preview */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2 mt-3">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Di halaman portal 192.168.10.1 nanti, Anda dapat:
                </div>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                  <li><strong>Memindai Wi-Fi Sekitar:</strong> Menangkap sinyal Wi-Fi rumah secara nyata via antena ESP32.</li>
                  <li><strong>Pilih Wi-Fi & Isi Password:</strong> Masukkan kata sandi Wi-Fi rumah Anda.</li>
                  <li><strong>Generate Token:</strong> Membuat token autentikasi otomatis untuk keamanan.</li>
                  <li><strong>Klik Hubungkan Perangkat (OK):</strong> ESP32 langsung beralih ke Wi-Fi rumah dan online!</li>
                </ul>
              </div>

              {/* Troubleshooting hint */}
              <div className="p-4 bg-amber-50/90 border border-amber-200/90 rounded-2xl text-xs text-amber-950 space-y-2 mt-3">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Jika di HP Muncul "Tidak Terhubung" atau Gagal Membuka:</span>
                </div>
                <ul className="space-y-1.5 list-disc list-inside text-amber-900 pl-1 leading-relaxed">
                  <li>
                    <strong>Notifikasi Pop-up HP:</strong> Periksa bilah notifikasi HP Anda, ketuk notifikasi <em>"Masuk ke jaringan Wi-Fi / Sign in to network"</em> jika muncul.
                  </li>
                  <li>
                    <strong>Cek Bilah Alamat (URL) di HP:</strong> Browser HP sering otomatis menambahkan <em>https</em>. Jika URL menjadi <code>https://192.168.10.1</code>, <strong>hapus huruf 's'</strong> agar menjadi <code>http://192.168.10.1</code> lalu tekan Enter.
                  </li>
                  <li>
                    <strong>Pilih "Tetap Terhubung":</strong> Jika di HP muncul notifikasi <em>"Wi-Fi ini tidak ada internet. Tetap terhubung?"</em>, ketuk dan pilih <strong>"Ya / Tetap Terhubung"</strong> agar HP tidak memblokir akses ke ESP32.
                  </li>
                  <li>
                    <strong>Alternatif Tab Baru:</strong> Buka tab baru di browser HP lalu ketik langsung: <code>http://192.168.10.1</code>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
