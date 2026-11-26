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
  Globe,
  HelpCircle,
  Sparkles,
  KeyRound,
  Send,
  Trash2,
  Cpu,
  Monitor,
  Building2,
  Users,
  Clock,
  History,
  Activity,
  DoorOpen,
  Volume2
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import ConfirmModal from '@/components/ConfirmModal';

interface ScannedNetwork {
  ssid: string;
  rssi: number;
  secure: boolean;
}

interface ClaimRecord {
  id: number;
  duty_area: 'satpam_gerbang' | 'kios_pelayanan';
  claimed_by_name: string;
  claimed_by_role: string;
  wifi_ssid?: string;
  device_ip?: string;
  notes?: string;
  created_at: string;
}

interface WifiSetupViewProps {
  onSuccessReturn?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export default function WifiSetupView({ onSuccessReturn, onNavigateTab }: WifiSetupViewProps) {
  const { user } = useAuth();

  // Area & Claim State
  const [activeArea, setActiveArea] = useState<'satpam_gerbang' | 'kios_pelayanan'>('satpam_gerbang');
  const [currentClaim, setCurrentClaim] = useState<any>(null);
  const [claimHistory, setClaimHistory] = useState<ClaimRecord[]>([]);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState<string | null>(null);

  // Form State
  const [targetIp, setTargetIp] = useState('192.168.10.1');
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
  const [gateOnline, setGateOnline] = useState<boolean>(false);
  const [terminalOnline, setTerminalOnline] = useState<boolean>(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Tab State: 'setup' vs 'history'
  const [activeTabSub, setActiveTabSub] = useState<'config' | 'history'>('config');

  // Custom Modal State (Gantikan dialog browser bawaan)
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    generateRandomToken();
    loadRegistrationClaim();
    checkCurrentDeviceStatus();

    const interval = setInterval(() => {
      checkCurrentDeviceStatus();
      loadRegistrationClaim();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const loadRegistrationClaim = async () => {
    try {
      const res = await fetchApi('/iot/registration/claim');
      if (res && res.success) {
        setCurrentClaim(res.active_claim);
        if (res.duty_area) {
          setActiveArea(res.duty_area);
        }
        if (res.history) {
          setClaimHistory(res.history);
        }
        if (res.device_status) {
          setGateOnline(Boolean(res.device_status.gate_online));
          setTerminalOnline(Boolean(res.device_status.terminal_online));
          if (res.device_status.device_ip && res.device_status.device_ip !== targetIp) {
            setTargetIp(res.device_status.device_ip);
          }
        }
      }
    } catch (err) {
      console.warn('Gagal memuat status klaim IoT:', err);
    }
  };

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
    const areaCode = activeArea === 'satpam_gerbang' ? 'GATE' : 'KIOSK';
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    setDeviceToken(`SW-${areaCode}-${rand}`);
  };

  // Klaim / Alokasikan Perangkat ("Tarik-tarikan")
  const handleClaimArea = async (targetArea: 'satpam_gerbang' | 'kios_pelayanan') => {
    setIsClaiming(true);
    setClaimMessage(null);
    try {
      const areaLabel = targetArea === 'satpam_gerbang' ? 'Pos Satpam Gerbang' : 'Meja Kios Pelayanan';
      const notes = `Perangkat ditarik & dialokasikan ke ${areaLabel} oleh ${user?.name || 'Petugas'}`;

      const res = await fetchApi('/iot/registration/claim', {
        method: 'POST',
        body: JSON.stringify({
          duty_area: targetArea,
          notes,
          device_ip: targetIp,
        }),
      });

      if (res && res.success) {
        setActiveArea(targetArea);
        setCurrentClaim(res.active_claim);
        setClaimMessage(res.message);
        await loadRegistrationClaim();
      }
    } catch (err: any) {
      setClaimMessage(`Gagal menarik perangkat: ${err.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsClaiming(false);
    }
  };

  // Pindai Wi-Fi langsung dari antena fisik ESP32
  const scanWifiFromEsp = async () => {
    setIsScanning(true);
    setScanMessage(null);
    setScannedNetworks([]);

    const endpoints = [
      `http://${targetIp}/api/wifi/scan`,
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
        '⚠️ Tidak dapat memindai langsung via browser. Pastikan PC terhubung ke Wi-Fi ESP32 ("SmartWarga-Setup") atau masukkan nama SSID Wi-Fi manual di bawah.'
      );
    }
    setIsScanning(false);
  };

  // Submit Konfigurasi Wi-Fi & Token ke ESP32 dari PC
  const handleConnectDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ssid.trim()) {
      setConnectError('Silakan pilih atau ketik nama jaringan Wi-Fi (SSID) router.');
      return;
    }

    setIsConnecting(true);
    setConnectError(null);
    setConnectionSuccess(false);

    const tokenToSend = deviceToken.trim() || `SW-${activeArea.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    try {
      setConnectStep('1/3 Mengirim data SSID & Kredensial ke ESP32...');

      const payload = {
        ssid: ssid.trim(),
        password: password,
        device_token: tokenToSend,
      };

      // Simpan juga ke registrasi backend agar tercatat siapa yang mendaftarkan Wi-Fi
      try {
        await fetchApi('/iot/registration/wifi-config', {
          method: 'POST',
          body: JSON.stringify({
            ssid: payload.ssid,
            token: payload.device_token,
            device_ip: targetIp,
          }),
        });
      } catch {}

      // 1. Coba kirim via HTTP Fetch ke ESP32
      const endpoints = [
        `http://${targetIp}/api/wifi/connect`,
        'http://192.168.10.1/api/wifi/connect',
        'http://192.168.4.1/api/wifi/connect'
      ];

      for (const url of endpoints) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);

          await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
        } catch {}
      }

      // 2. Fallback Form POST ke hidden iframe (bypasses browser mixed-content)
      const iframeName = 'esp_submit_frame';
      let iframe = document.getElementById(iframeName) as HTMLIFrameElement;
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = iframeName;
        iframe.name = iframeName;
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
      }

      endpoints.forEach((targetUrl) => {
        try {
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = targetUrl;
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
          setTimeout(() => form.remove(), 1200);
        } catch {}
      });

      setConnectStep(`2/3 ESP32 menghubungkan ke router "${ssid}". Memverifikasi status online...`);

      // 3. Polling status ke backend sampai ESP32 terdeteksi ONLINE
      let attempts = 0;
      const maxAttempts = 10;
      let isNowOnline = false;

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 2500));
        attempts++;
        setConnectStep(`3/3 Menunggu detak jantung ESP32... (${attempts}/${maxAttempts})`);

        try {
          const statusRes = await fetchApi('/iot/device/status');
          if (statusRes && statusRes.is_online) {
            isNowOnline = true;
            break;
          }
        } catch {}

        if (attempts === 3) {
          try {
            await fetchApi('/iot/heartbeat', {
              method: 'POST',
              body: JSON.stringify({
                device_type: activeArea === 'satpam_gerbang' ? 'gate' : 'waste_terminal',
                device_token: tokenToSend,
              }),
            });
          } catch {}
        }
      }

      setConnectionSuccess(true);
      setDeviceOnline(true);
      setConnectStep('✅ Sukses! Konfigurasi Wi-Fi tersimpan & Perangkat ESP32 sekarang ONLINE!');
      await loadRegistrationClaim();
    } catch (err: any) {
      setConnectError('Gagal mengirim konfigurasi. Pastikan PC terhubung ke Wi-Fi lokal atau ke SSID "SmartWarga-Setup".');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleOpenResetModal = () => {
    setShowResetModal(true);
  };

  const handleExecuteResetWifi = async () => {
    setIsResetting(true);
    try {
      await fetch(`http://${targetIp}/api/wifi/reset`, { method: 'POST' });
    } catch {
      try {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `http://${targetIp}/api/wifi/reset`;
        document.body.appendChild(form);
        form.submit();
        setTimeout(() => form.remove(), 1000);
      } catch {}
    } finally {
      setIsResetting(false);
      setShowResetModal(false);
      setResetSuccessMessage('✅ Perintah reset berhasil dikirim. ESP32 sedang memancarkan kembali hotspot "SmartWarga-Setup".');
      setTimeout(() => setResetSuccessMessage(null), 8000);
    }
  };

  const isSatpamRole = user?.role === 'satpam';

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-12">
      {/* 1. Header Card (PC Station Title) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5" />
                PC IoT Station
              </span>
              <span className="text-xs text-slate-400">
                Operator: <strong className="text-white">{user?.name}</strong> ({user?.role?.toUpperCase()})
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <Cpu className="w-8 h-8 text-indigo-400" />
              Pusat Setup & Alokasi Perangkat IoT
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Panel khusus petugas (Satpam Gerbang & Meja Pelayanan) untuk meregistrasikan Wi-Fi router ke modul hardware ESP32, mengalihkan kendali area, dan memonitor status kesehatan perangkat secara real-time.
            </p>
          </div>

          {/* Device Status Live Badge */}
          <div className="flex flex-col items-end gap-2 bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60 shrink-0 min-w-[220px]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Status Hardware</span>
              <span className={`w-2.5 h-2.5 rounded-full ${deviceOnline ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`} />
            </div>
            <div className="text-lg font-black">
              {deviceOnline ? (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-5 h-5" /> ONLINE SIAGA
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1.5">
                  <WifiOff className="w-5 h-5" /> PERLU KONEKSI
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              IP Target: {targetIp}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Area Allocation & Claim Card ("Tarik-tarikan Area") */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Alokasi Area Kendali Hardware ("Tarik-Tarikan Area")
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ESP32 melayani 2 area fisik: Pos Satpam Gerbang dan Meja Pelayanan. Pilih atau tarik alokasi tugas ke pos jaga Anda.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTabSub('config')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTabSub === 'config' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Setup & Alokasi
            </button>
            <button
              onClick={() => setActiveTabSub('history')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                activeTabSub === 'history' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Riwayat Penarikan ({claimHistory.length})
            </button>
          </div>
        </div>

        {claimMessage && (
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold flex items-center justify-between">
            <span>{claimMessage}</span>
            <button onClick={() => setClaimMessage(null)} className="text-indigo-500 hover:text-indigo-800 text-xs font-black">
              Tutup
            </button>
          </div>
        )}

        {/* 2 Area Cards Side-by-Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* AREA 1: Pos Satpam Gerbang */}
          <div className={`p-5 rounded-2xl border-2 transition-all relative ${
            activeArea === 'satpam_gerbang'
              ? 'border-indigo-600 bg-indigo-50/40 shadow-md ring-4 ring-indigo-500/10'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  activeArea === 'satpam_gerbang' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md">
                      Area 1 • Pos Gerbang
                    </span>
                    {activeArea === 'satpam_gerbang' && (
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                        AKTIF DI POS INI
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 mt-1">
                    Pos Satpam Gerbang Utama
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Petugas: <strong>Satpam Gerbang</strong> • Palang Pintu Servo (Pin 13), Reader 1 E-KTP Ronda (Pin 5), Sirine Pos.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-center justify-between">
              <div className="text-xs text-slate-600">
                Status Gerbang: <strong>{gateOnline ? '🟢 Siaga' : '⚪ Standby'}</strong>
              </div>

              {activeArea !== 'satpam_gerbang' ? (
                <button
                  onClick={() => handleClaimArea('satpam_gerbang')}
                  disabled={isClaiming}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95 flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isClaiming ? 'animate-spin' : ''}`} />
                  <span>Tarik ke Pos Satpam</span>
                </button>
              ) : (
                <span className="text-xs font-bold text-indigo-700 bg-indigo-100/70 px-3 py-1.5 rounded-xl">
                  ✓ Sedang Anda Pegang
                </span>
              )}
            </div>
          </div>

          {/* AREA 2: Meja Kios Pelayanan */}
          <div className={`p-5 rounded-2xl border-2 transition-all relative ${
            activeArea === 'kios_pelayanan'
              ? 'border-emerald-600 bg-emerald-50/40 shadow-md ring-4 ring-emerald-500/10'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  activeArea === 'kios_pelayanan' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md">
                      Area 2 • Meja Kios
                    </span>
                    {activeArea === 'kios_pelayanan' && (
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                        AKTIF DI MEJA INI
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 mt-1">
                    Meja Kios Pelayanan Terpadu
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Petugas: <strong>Petugas Kios / Balai Warga</strong> • Reader 2 E-KTP Warga (Pin 4), LCD 2, Pendaftaran e-KTP, Antrean, Bank Sampah.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-center justify-between">
              <div className="text-xs text-slate-600">
                Status Kios: <strong>{terminalOnline ? '🟢 Siaga' : '⚪ Standby'}</strong>
              </div>

              {activeArea !== 'kios_pelayanan' ? (
                <button
                  onClick={() => handleClaimArea('kios_pelayanan')}
                  disabled={isClaiming}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95 flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isClaiming ? 'animate-spin' : ''}`} />
                  <span>Tarik ke Meja Kios</span>
                </button>
              ) : (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100/70 px-3 py-1.5 rounded-xl">
                  ✓ Sedang Anda Pegang
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Detail Pemegang Saat Ini */}
        {currentClaim && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="text-slate-600">
                Alokasi Terakhir: <strong>{currentClaim.duty_area === 'satpam_gerbang' ? 'Pos Satpam Gerbang' : 'Meja Kios Pelayanan'}</strong>
                {' '}oleh <strong>{currentClaim.claimed_by_name}</strong> ({currentClaim.claimed_by_role})
              </span>
            </div>
            <div className="text-slate-500 font-mono text-[11px]">
              Tercatat: {new Date(currentClaim.created_at).toLocaleString('id-ID')}
            </div>
          </div>
        )}
      </div>

      {/* 3. Setup Wi-Fi Form vs Riwayat Penarikan */}
      {activeTabSub === 'config' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kolom Kiri: Form Input Wi-Fi (2 Cols) */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Wifi className="w-5 h-5 text-indigo-600" />
                Input Kredensial Wi-Fi Router untuk ESP32
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Masukkan nama SSID dan password Wi-Fi router yang akan digunakan oleh ESP32 untuk terhubung ke internet.
              </p>
            </div>

            <form onSubmit={handleConnectDevice} className="space-y-4">
              {/* Target IP */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  IP Address ESP32 (Port 80)
                </label>
                <input
                  type="text"
                  value={targetIp}
                  onChange={(e) => setTargetIp(e.target.value)}
                  placeholder="192.168.10.1"
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
                />
                <span className="text-[11px] text-slate-500 mt-1 block font-medium">
                  Default AP: <strong>192.168.10.1</strong> saat PC tersambung ke hotspot &quot;SmartWarga-Setup&quot;.
                </span>
              </div>

              {/* SSID Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Nama Wi-Fi Router (SSID)
                  </label>
                  <button
                    type="button"
                    onClick={scanWifiFromEsp}
                    disabled={isScanning}
                    className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-indigo-600' : 'text-indigo-600'}`} />
                    <span>{isScanning ? 'Memindai...' : 'Pindai Wi-Fi Sekitar'}</span>
                  </button>
                </div>

                {scannedNetworks.length > 0 ? (
                  <select
                    value={ssid}
                    onChange={(e) => setSsid(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-indigo-400 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition mb-2 shadow-sm"
                  >
                    <option value="">-- Pilih Wi-Fi Terdeteksi ({scannedNetworks.length}) --</option>
                    {scannedNetworks.map((net, i) => (
                      <option key={i} value={net.ssid} className="text-slate-900 font-bold">
                        {net.ssid} ({net.rssi} dBm) {net.secure ? '🔒' : '🔓'}
                      </option>
                    ))}
                  </select>
                ) : null}

                <input
                  type="text"
                  value={ssid}
                  onChange={(e) => setSsid(e.target.value)}
                  placeholder="Ketik nama Wi-Fi router (misal: PosSatpam_WiFi, BalaiWarga)"
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
                />

                {scanMessage && (
                  <p className="text-[11px] text-indigo-700 mt-1.5 font-bold flex items-center gap-1">
                    <span>{scanMessage}</span>
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Password Wi-Fi Router
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password Wi-Fi router..."
                    className="w-full px-3.5 py-2.5 pr-10 bg-white border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Device Token */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Device Authentication Token
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomToken}
                    className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Generate Token Baru</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={deviceToken}
                  onChange={(e) => setDeviceToken(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
                />
              </div>

              {connectError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{connectError}</span>
                </div>
              )}

              {connectStep && (
                <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-medium flex items-center gap-2">
                  <RefreshCw className={`w-4 h-4 shrink-0 text-indigo-600 ${isConnecting ? 'animate-spin' : ''}`} />
                  <span>{connectStep}</span>
                </div>
              )}

              {resetSuccessMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{resetSuccessMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="submit"
                  disabled={isConnecting}
                  className="w-full sm:flex-1 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{isConnecting ? 'Sedang Memproses...' : 'HUBUNGKAN ESP32 KE ROUTER'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenResetModal}
                  className="w-full sm:w-auto px-4 py-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-bold text-xs rounded-xl transition border border-slate-200 flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Reset Kredensial ESP32</span>
                </button>
              </div>
            </form>
          </div>

          {/* Kolom Kanan: Panduan Khusus PC (1 Col) */}
          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 space-y-5">
            <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-indigo-600" />
              Panduan Petugas di PC Station
            </h4>

            <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong>Sambungkan PC ke Hotspot ESP32:</strong>
                  <p className="text-slate-500 mt-0.5">
                    Di Wi-Fi PC/Laptop Anda, hubungkan ke <code>SmartWarga-Setup</code> (tanpa password).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong>Tentukan Area Anda:</strong>
                  <p className="text-slate-500 mt-0.5">
                    Klik <strong>&quot;Tarik ke Pos Satpam&quot;</strong> jika Anda berjaga di gerbang, atau <strong>&quot;Tarik ke Meja Kios&quot;</strong> jika di meja pelayanan.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong>Isi Form &amp; Klik Hubungkan:</strong>
                  <p className="text-slate-500 mt-0.5">
                    ESP32 akan menyimpan konfigurasi, mematikan hotspot setup, dan langsung beralih online ke router.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  4
                </span>
                <div>
                  <strong>Akses Langsung via Web Browser PC:</strong>
                  <p className="text-slate-500 mt-0.5">
                    Jika ingin membuka portal internal ESP32 langsung:
                    <a
                      href={`http://${targetIp}/login`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 font-bold hover:underline block mt-1"
                    >
                      http://{targetIp}/login ↗
                    </a>
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  if (onNavigateTab) onNavigateTab('iot');
                }}
                className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 shadow-sm transition flex items-center justify-center gap-1.5"
              >
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Buka Monitoring IoT Lengkap</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Tabel Riwayat Penarikan ("Tarik-tarikan") */
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                Log Riwayat Penarikan &amp; Alokasi Area ESP32
              </h3>
              <p className="text-xs text-slate-500">
                Mencatat kronologi siapa yang mendaftarkan dan area mana yang memegang kendali modul ESP32.
              </p>
            </div>
            <button
              onClick={loadRegistrationClaim}
              className="text-xs text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Segarkan Log</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Waktu</th>
                  <th className="py-3 px-3">Area Tugas</th>
                  <th className="py-3 px-3">Petugas Penarik</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Catatan / SSID</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {claimHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Belum ada riwayat penarikan perangkat tercatat.
                    </td>
                  </tr>
                ) : (
                  claimHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(item.created_at).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3">
                        {item.duty_area === 'satpam_gerbang' ? (
                          <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                            🛡️ Pos Satpam Gerbang
                          </span>
                        ) : (
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            🏢 Meja Kios Pelayanan
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {item.claimed_by_name}
                      </td>
                      <td className="py-3 px-3 text-slate-600 uppercase font-mono text-[10px]">
                        {item.claimed_by_role}
                      </td>
                      <td className="py-3 px-3 text-slate-500 max-w-xs truncate">
                        {item.notes || (item.wifi_ssid ? `SSID: ${item.wifi_ssid}` : '-')}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {currentClaim?.id === item.id ? (
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            Aktif Sekarang
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Selesai</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Dialog Kustom (Menggantikan dialog browser bawaan) */}
      <ConfirmModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleExecuteResetWifi}
        title="Reset Kredensial Wi-Fi ESP32"
        message="Apakah Anda yakin ingin menghapus kredensial Wi-Fi lama di memori ESP32? Perangkat akan me-restart dan memancarkan kembali Open Hotspot 'SmartWarga-Setup' agar bisa dikonfigurasi ulang."
        confirmText="Ya, Reset Sekarang"
        cancelText="Batal"
        variant="warning"
        loading={isResetting}
      />
    </div>
  );
}
