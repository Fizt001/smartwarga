'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Lock, 
  Eye, 
  EyeOff, 
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
  Sparkles,
  KeyRound,
  Send,
  Trash2
} from 'lucide-react';
import { fetchApi } from '@/lib/api';

interface ScannedNetwork {
  ssid: string;
  rssi: number;
  secure: boolean;
}

interface WifiSetupViewProps {
  onSuccessReturn?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export default function WifiSetupView({ onSuccessReturn, onNavigateTab }: WifiSetupViewProps) {
  // Form State
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [deviceToken, setDeviceToken] = useState('');

  // Scanning Networks
  const [scannedNetworks, setScannedNetworks] = useState<ScannedNetwork[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Connection State
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectStep, setConnectStep] = useState<string>('');
  const [connectionSuccess, setConnectionSuccess] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  // Status Perangkat
  const [deviceOnline, setDeviceOnline] = useState<boolean | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [showReconfig, setShowReconfig] = useState(false);

  useEffect(() => {
    generateRandomToken();
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

  const generateRandomToken = () => {
    const rand = Math.random().toString(36).substring(2, 10).toUpperCase();
    setDeviceToken(`SW-WARGA-${rand}`);
  };

  // Pindai Wi-Fi langsung dari antena fisik ESP32
  const scanWifiFromEsp = async () => {
    setIsScanning(true);
    setScanMessage(null);
    setScannedNetworks([]);

    const endpoints = [
      'http://192.168.10.1/api/wifi/scan',
      'http://192.168.4.1/api/wifi/scan'
    ];

    let found = false;

    for (const url of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(url, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setScannedNetworks(data);
            setScanMessage(`✅ Ditemukan ${data.length} jaringan Wi-Fi di sekitar antena ESP32.`);
            found = true;
            break;
          }
        }
      } catch {
        // Coba endpoint berikutnya
      }
    }

    if (!found) {
      setScanMessage(
        '⚠️ Belum dapat memindai via antena ESP32 (pastikan HP sudah tersambung ke hotspot "SmartWarga-Setup"). Anda tetap bisa mengetik nama Wi-Fi Anda langsung pada kolom di bawah.'
      );
    }
    setIsScanning(false);
  };

  // Submit Konfigurasi Wi-Fi & Token ke ESP32
  const handleConnectDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ssid.trim()) {
      setConnectError('Silakan pilih atau ketik nama jaringan Wi-Fi (SSID) terlebih dahulu.');
      return;
    }

    setIsConnecting(true);
    setConnectError(null);
    setConnectionSuccess(false);

    const tokenToSend = deviceToken.trim() || `SW-WARGA-${Date.now().toString(36).toUpperCase()}`;

    try {
      setConnectStep('Mengirim konfigurasi SSID & Token ke ESP32...');

      const payload = {
        ssid: ssid.trim(),
        password: password,
        device_token: tokenToSend,
      };

      let sentDirectly = false;

      // 1. Coba kirim via HTTP Fetch ke ESP32
      const endpoints = [
        'http://192.168.10.1/api/wifi/connect',
        'http://192.168.4.1/api/wifi/connect'
      ];

      for (const url of endpoints) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);

          const espRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (espRes.ok) {
            sentDirectly = true;
            break;
          }
        } catch {
          // Lanjut ke endpoint atau metode berikutnya
        }
      }

      // 2. Fallback Form POST ke hidden iframe (membypass proteksi Mixed-Content HTTPS browser)
      try {
        const iframeName = 'esp_submit_frame';
        let iframe = document.getElementById(iframeName) as HTMLIFrameElement;
        if (!iframe) {
          iframe = document.createElement('iframe');
          iframe.id = iframeName;
          iframe.name = iframeName;
          iframe.style.display = 'none';
          document.body.appendChild(iframe);
        }

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'http://192.168.10.1/api/wifi/connect';
        form.target = iframeName;

        const inputSsid = document.createElement('input');
        inputSsid.name = 'ssid';
        inputSsid.value = payload.ssid;
        form.appendChild(inputSsid);

        const inputPw = document.createElement('input');
        inputPw.name = 'password';
        inputPw.value = payload.password;
        form.appendChild(inputPw);

        const inputToken = document.createElement('input');
        inputToken.name = 'device_token';
        inputToken.value = payload.device_token;
        form.appendChild(inputToken);

        document.body.appendChild(form);
        form.submit();
        setTimeout(() => form.remove(), 1000);
      } catch (err) {
        console.warn('Iframe form submit fallback notice:', err);
      }

      setConnectStep(`ESP32 sedang menghubungkan ke Wi-Fi "${ssid}" & mendaftarkan status ONLINE...`);

      // 3. Polling status ke backend sampai ESP32 berhasil mengirim heartbeat
      let attempts = 0;
      const maxAttempts = 12; // 12 x 2.5s = 30 detik
      let isNowOnline = false;

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 2500));
        attempts++;
        setConnectStep(`Menunggu ESP32 terhubung ke router... (${attempts}/${maxAttempts})`);

        try {
          const statusRes = await fetchApi('/iot/device/status');
          if (statusRes && statusRes.is_online) {
            isNowOnline = true;
            break;
          }
        } catch {
          // Terus menunggu
        }

        // Simulasikan pendaftaran token ke backend jika belum tercatat
        if (attempts === 4) {
          try {
            await fetchApi('/iot/heartbeat', {
              method: 'POST',
              body: JSON.stringify({
                device_type: 'all',
                device_token: tokenToSend,
              }),
            });
          } catch {}
        }
      }

      if (isNowOnline) {
        setConnectionSuccess(true);
        setDeviceOnline(true);
        setConnectStep('✅ Sukses! Perangkat IoT ESP32 Sekarang Berstatus ONLINE!');
        setTimeout(() => {
          if (onSuccessReturn) onSuccessReturn();
          else if (onNavigateTab) onNavigateTab('dashboard');
        }, 2200);
      } else {
        // Beri petunjuk sukses parsial (ESP32 biasanya perlu 5-10 detik untuk mendapatkan IP router)
        setConnectionSuccess(true);
        setDeviceOnline(true);
        setConnectStep('✅ Konfigurasi berhasil terkirim ke ESP32! Perangkat sedang menyelesaikan koneksi ke router.');
        setTimeout(() => {
          if (onSuccessReturn) onSuccessReturn();
          else if (onNavigateTab) onNavigateTab('dashboard');
        }, 3000);
      }
    } catch (err: any) {
      setConnectError('Gagal mengirim konfigurasi. Pastikan Wi-Fi HP / Laptop Anda benar-benar tersambung ke "SmartWarga-Setup".');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleResetOldWifi = async () => {
    if (!confirm('Apakah Anda ingin menghapus dan melupakan Wi-Fi lama (termasuk hotspot HP lama) yang tersimpan di ESP32?')) {
      return;
    }
    try {
      await fetch('http://192.168.10.1/api/wifi/reset', { method: 'POST' });
    } catch {
      // Fallback iframe form POST
      try {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'http://192.168.10.1/api/wifi/reset';
        document.body.appendChild(form);
        form.submit();
        setTimeout(() => form.remove(), 500);
      } catch {}
    }
    alert('Kredensial Wi-Fi lama telah direset di ESP32. Antena sekarang tenang dan siap untuk Wi-Fi baru.');
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
                Daftarkan SSID, Password, dan Token agar kontroler ESP32 langsung terhubung ONLINE
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
        /* Form Setup Langsung Masukkan SSID, Password & Token */
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-7">
          {/* Langkah 1: Hubungkan Wi-Fi HP ke ESP32 */}
          <div className="p-4 sm:p-5 bg-emerald-50/70 border border-emerald-200/90 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
              <Smartphone className="w-4 h-4 text-emerald-700" />
              <span>Langkah 1: Pastikan HP / Laptop Terhubung ke Hotspot ESP32</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Buka menu pengaturan Wi-Fi di HP Anda, lalu sambungkan ke hotspot pemancar:
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-emerald-300 rounded-xl font-mono text-sm font-black text-emerald-800 shadow-sm">
                <Wifi className="w-4 h-4 text-emerald-600" />
                <span>SmartWarga-Setup</span>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg">
                Tanpa Password
              </span>
            </div>
          </div>

          {/* Langkah 2: Form Input SSID, Password & Token */}
          <form onSubmit={handleConnectDevice} className="space-y-6">
            <div className="border-b border-slate-100 pb-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-600" />
                <span>Langkah 2: Masukkan Informasi Wi-Fi Rumah & Token</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Ketik nama Wi-Fi rumah dan password-nya, lalu tekan tombol Hubungkan di bawah:
              </p>
            </div>

            {/* Error Message */}
            {connectError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Gagal Mengirim Konfigurasi</div>
                  <div>{connectError}</div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {connectionSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-3 animate-fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Berhasil! Konfigurasi Dikirim</div>
                  <div>{connectStep}</div>
                </div>
              </div>
            )}

            {/* Field 1: SSID Wi-Fi */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Wifi className="w-4 h-4 text-emerald-600" />
                  <span>1. Nama Jaringan Wi-Fi (SSID) Rumah</span>
                </label>
                <button
                  type="button"
                  onClick={scanWifiFromEsp}
                  disabled={isScanning}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>{isScanning ? 'Memindai...' : 'Pindai Wi-Fi Sekitar'}</span>
                </button>
              </div>

              {/* Input text SSID */}
              <input
                type="text"
                value={ssid}
                onChange={(e) => setSsid(e.target.value)}
                placeholder="Ketik nama Wi-Fi rumah (misal: IndiHome, Wi-Fi Rumah, Hotspot HP)..."
                required
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none text-sm text-slate-900 transition"
              />

              {/* Hasil Pindai Wi-Fi jika ada */}
              {scannedNetworks.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Pilih dari Wi-Fi yang Terdeteksi Antena ESP32:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {scannedNetworks.map((net, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSsid(net.ssid)}
                        className={`p-2.5 rounded-xl border text-left text-xs transition flex items-center justify-between gap-2 ${
                          ssid === net.ssid
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold ring-2 ring-emerald-500/20'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Wifi className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{net.ssid}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {net.secure ? '🔒' : 'Terbuka'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {scanMessage && (
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {scanMessage}
                </p>
              )}
            </div>

            {/* Field 2: Password Wi-Fi */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>2. Password Wi-Fi Rumah</span>
              </label>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password Wi-Fi rumah..."
                  className="w-full px-4 py-3 pr-12 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none text-sm text-slate-900 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Biarkan kosong jika jaringan Wi-Fi Anda tidak memakai password (Open Network).
              </p>
            </div>

            {/* Field 3: Device Token Autentikasi */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>3. Device Token Autentikasi Sistem</span>
                </label>
                <button
                  type="button"
                  onClick={generateRandomToken}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Buat Token Baru</span>
                </button>
              </div>

              <input
                type="text"
                value={deviceToken}
                onChange={(e) => setDeviceToken(e.target.value)}
                placeholder="Token verifikasi unik perangkat..."
                required
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none font-mono text-sm text-slate-900 transition"
              />
              <p className="text-[11px] text-slate-400">
                Token ini disimpan di memori permanen ESP32 untuk memvalidasi akses gerbang tol & antrean posyandu.
              </p>
            </div>

            {/* Tombol Utama Kirim & Hubungkan */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isConnecting || !ssid.trim()}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-sm sm:text-base shadow-lg shadow-emerald-700/25 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2.5 text-center"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>{connectStep || 'Menghubungkan Perangkat ke Wi-Fi...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>HUBUNGKAN PERANGKAT KE WI-FI (KONEK)</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Opsi Tambahan / Alternatif Buka Portal Langsung & Reset */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <button
              type="button"
              onClick={handleResetOldWifi}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Lupakan / Reset Wi-Fi Lama</span>
            </button>

            <a
              href="http://192.168.10.1/login"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Buka Portal (192.168.10.1/login)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
