'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { fetchApi } from '@/lib/api';
import {
  LogIn,
  UserPlus,
  CreditCard,
  Lock,
  Mail,
  CheckCircle2,
  ShieldCheck,
  Users,
  ArrowRight,
  Radio,
  FileText,
  Volume2,
  Recycle,
  Cpu,
  X,
  ChevronRight,
  ChevronDown,
  Zap,
  Check
} from 'lucide-react';

function WebPalugadaLogo({ idSuffix = '1', size = 36 }: { idSuffix?: string; size?: number }) {
  const gradId = `palugadaLogoGrad_${idSuffix}`;
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="9" fill={`url(#${gradId})`} />
      <rect x="0.5" y="0.5" width="35" height="35" rx="8.5" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
      <rect x="4.5" y="7" width="20" height="16" rx="2.5" fill="rgba(255,255,255,0.18)" stroke="#ffffff" strokeWidth="1.3" />
      <line x1="4.5" y1="11.5" x2="24.5" y2="11.5" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.8" />
      <circle cx="7" cy="9.25" r="0.8" fill="#ffffff" />
      <circle cx="9.5" cy="9.25" r="0.8" fill="#ffffff" fillOpacity="0.8" />
      <circle cx="12" cy="9.25" r="0.8" fill="#ffffff" fillOpacity="0.8" />
      <path d="M8 15.5l-1.8 1.5 1.8 1.5" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 14.5l-1.5 4" stroke="#ffffff" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M14 15.5l1.8 1.5-1.8 1.5" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 28L23.5 19.5" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M16 27L18.5 24.5" stroke="#0284c7" strokeWidth="1.6" strokeLinecap="round" />
      <g transform="translate(24, 19) rotate(-45)">
        <rect x="-7" y="-3.5" width="14" height="6" rx="1.5" fill="#ffffff" />
        <path d="M6 -4h2a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-2z" fill="#ffffff" />
        <path d="M-6 -3.5c-2 0 -3.5 1.5 -4.5 3.5c1.5 -0.5 3 -0.5 4.5 -0.5z" fill="#ffffff" />
      </g>
      <path d="M29 6l0.8 2 2 0.8-2 0.8-0.8 2-0.8-2-2-0.8 2-0.8z" fill="#fef08a" />
    </svg>
  );
}

const platformFeatures = [
  {
    icon: ShieldCheck,
    tag: 'Hardware IoT',
    tagColor: 'bg-sky-50 text-sky-700 border-sky-200',
    iconColor: 'bg-gradient-to-br from-[#0ea5e9] to-[#10b981] text-white',
    title: 'Keamanan Gerbang & Pos Satpam',
    desc: 'Otomasi palang servo gerbang via RFID e-KTP, absensi ronda malam satpam, dan log akses kendaraan real-time.',
  },
  {
    icon: CreditCard,
    tag: 'Transparansi',
    tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconColor: 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white',
    title: 'Iuran Warga (IPL) & Kas Terbuka',
    desc: 'Kalender tagihan IPL 12 bulan, pembayaran QRIS/Dompet Warga, verifikasi Bendahara, serta rekap kas RT ke RW terbuka.',
  },
  {
    icon: FileText,
    tag: 'Persuratan',
    tagColor: 'bg-violet-50 text-violet-700 border-violet-200',
    iconColor: 'bg-gradient-to-br from-violet-500 to-indigo-500 text-white',
    title: 'Surat Pengantar Digital & PDF',
    desc: 'Pengajuan surat pengantar RT/RW secara online dengan alur validasi berjenjang RT & RW hingga dokumen siap cetak.',
  },
  {
    icon: Volume2,
    tag: 'Darurat 24 Jam',
    tagColor: 'bg-rose-50 text-rose-700 border-rose-200',
    iconColor: 'bg-gradient-to-br from-rose-500 to-red-500 text-white',
    title: 'Tombol Panik & Sirine Terpadu',
    desc: 'Peringatan bahaya satu sentuhan yang langsung membunyikan sirine fisik pos gerbang dan mengirim alert ke petugas.',
  },
  {
    icon: Recycle,
    tag: 'Kios Mandiri',
    tagColor: 'bg-amber-50 text-amber-700 border-amber-200',
    iconColor: 'bg-gradient-to-br from-amber-500 to-orange-500 text-white',
    title: 'Kios Pelayanan & Bank Sampah',
    desc: 'Anjungan mandiri di Balai Warga untuk antrean pelayanan e-KTP terdaftar, pairing kartu baru, dan setor bank sampah.',
  },
  {
    icon: Users,
    tag: 'Sensus RW 05',
    tagColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    iconColor: 'bg-gradient-to-br from-cyan-500 to-sky-600 text-white',
    title: 'Sensus 300 Hunian & KK Utama',
    desc: 'Pendataan unit rumah RT 01-03 yang memisahkan KK Utama (penanggung jawab IPL) dengan KK Pendukung secara rapi.',
  },
];

const roleSummaries = [
  { name: 'Super Admin', desc: 'Kontrol penuh seluruh modul, audit data & konfigurasi IoT', badge: 'bg-slate-900 text-white' },
  { name: 'Ketua RW 05', desc: 'Supervisi 3 RT, approval surat tingkat RW & pantau kas', badge: 'bg-sky-50 text-sky-800 border border-sky-200' },
  { name: 'Sekretaris RW / RT', desc: 'Validasi penomoran surat, agenda kegiatan & aset fasum', badge: 'bg-violet-50 text-violet-800 border border-violet-200' },
  { name: 'Bendahara RW / RT', desc: 'Generate tagihan IPL, ACC QRIS, top-up & pencairan kas', badge: 'bg-emerald-50 text-emerald-800 border border-emerald-200' },
  { name: 'Ketua RT 01–03', desc: 'ACC pendaftaran warga baru, sensus hunian & persetujuan RT', badge: 'bg-cyan-50 text-cyan-800 border border-cyan-200' },
  { name: 'Satpam Gerbang', desc: 'Monitoring pos gerbang, palang servo, absensi ronda & sirine', badge: 'bg-sky-950 text-white' },
  { name: 'Warga (KK Utama)', desc: 'Bayar IPL, ajukan surat, pantau kas, pengaduan & tombol panik', badge: 'bg-teal-50 text-teal-800 border border-teal-200' },
];

const wargaAccounts = [
  { name: 'Budi Santoso', email: 'budi@smartwarga.test', unit: 'RT 01 Blok A No. 01' },
  { name: 'Joko Widodo', email: 'joko@smartwarga.test', unit: 'RT 01 Blok A No. 03' },
  { name: 'Achmad Vickry Firdaus', email: 'achmad.vickry@smartwarga.test', unit: 'RT 01 Blok A No. 04' },
  { name: 'Cikal Prayono', email: 'cikal.prayoga@smartwarga.test', unit: 'RT 01 Blok A No. 05' },
  { name: 'Julvan Augus Miseri Cordias Harefa', email: 'julvan.augus@smartwarga.test', unit: 'RT 01 Blok A No. 06' },
  { name: 'Reival Al Kahfi', email: 'reival.al@smartwarga.test', unit: 'RT 01 Blok A No. 07' },
  { name: 'Halim Hafis', email: 'halim.hafis@smartwarga.test', unit: 'RT 01 Blok A No. 08' },
  { name: 'Kurnia Yuliansyah', email: 'kurnia.yuliansyah@smartwarga.test', unit: 'RT 01 Blok A No. 09' },
  { name: 'Sonri Tolla', email: 'sonri.tolla@smartwarga.test', unit: 'RT 01 Blok A No. 10' },
  { name: 'Yohnes Nelsen Christian Pontoh', email: 'yohnes.nelsen@smartwarga.test', unit: 'RT 01 Blok A No. 11' },
  { name: 'Arfendy Maulana', email: 'arfendy.maulana@smartwarga.test', unit: 'RT 01 Blok A No. 12' },
  { name: 'M Firmansyah', email: 'm.firmansyah@smartwarga.test', unit: 'RT 01 Blok A No. 13' },
  { name: 'Dimas Waldy Muzzaky', email: 'dimas.waldy@smartwarga.test', unit: 'RT 01 Blok A No. 14' },
  { name: 'Argo Iriano Sumarno', email: 'argo.iriano@smartwarga.test', unit: 'RT 01 Blok A No. 15' },
  { name: 'Mohammad Raffi Aryadi', email: 'mohammad.raffi@smartwarga.test', unit: 'RT 01 Blok A No. 16' },
  { name: 'Muhammad Fattah Hadi Mirza', email: 'muhammad.fattah@smartwarga.test', unit: 'RT 01 Blok A No. 17' },
  { name: 'Julisman Harefa', email: 'julisman.harefa@smartwarga.test', unit: 'RT 01 Blok A No. 18' },
  { name: 'Noventri Dermawan Zendrato', email: 'noventri.dermawan@smartwarga.test', unit: 'RT 01 Blok A No. 19' },
  { name: 'Ahmad Tsaqib Karim', email: 'ahmad.tsaqib@smartwarga.test', unit: 'RT 01 Blok A No. 20' },
  { name: 'Titis Rismawati', email: 'titis.rismawati@smartwarga.test', unit: 'RT 01 Blok A No. 21' },
  { name: 'Amelia Sumayah', email: 'amelia.sumayah@smartwarga.test', unit: 'RT 01 Blok A No. 22' },
  { name: 'Anggi Fitri Ramadhani', email: 'anggi.fitri@smartwarga.test', unit: 'RT 01 Blok A No. 23' },
  { name: 'Annisa Zahra Sofanie', email: 'annisa.zahra@smartwarga.test', unit: 'RT 01 Blok A No. 24' },
  { name: 'Risywda Zahra Mugiharjo', email: 'risywda.zahra@smartwarga.test', unit: 'RT 01 Blok A No. 25' },
  { name: 'Zahra Ramadhani', email: 'zahra.ramadhani@smartwarga.test', unit: 'RT 01 Blok B No. 01' },
  { name: 'Shibghi Hidayatullail', email: 'shibghi.hidayatullail@smartwarga.test', unit: 'RT 01 Blok B No. 02' },
  { name: 'Muhanmad Fadli Syaputra', email: 'muhanmad.fadli@smartwarga.test', unit: 'RT 01 Blok B No. 03' },
  { name: 'Achmad Pathoni', email: 'achmad.pathoni@smartwarga.test', unit: 'RT 01 Blok B No. 04' },
  { name: 'Yazid Abdul Karim', email: 'yazid.abdul@smartwarga.test', unit: 'RT 01 Blok B No. 05' },
  { name: 'Riky Ridwan', email: 'riky.ridwan@smartwarga.test', unit: 'RT 01 Blok B No. 06' },
  { name: 'Alfriza', email: 'alfriza.warga@smartwarga.test', unit: 'RT 01 Blok B No. 07' },
  { name: 'Syaifullah Asshadiq', email: 'syaifullah.asshadiq@smartwarga.test', unit: 'RT 01 Blok B No. 08' },
  { name: 'Muhammad Ilham Hidayat', email: 'muhammad.ilham@smartwarga.test', unit: 'RT 01 Blok B No. 09' },
  { name: 'Fabwian Nazhif Atthallah', email: 'fabwian.nazhif@smartwarga.test', unit: 'RT 01 Blok B No. 10' },
  { name: 'Angelo Christian Juan', email: 'angelo.christian@smartwarga.test', unit: 'RT 01 Blok B No. 11' },
  { name: 'Julius Wisnu Broto', email: 'julius.wisnu@smartwarga.test', unit: 'RT 01 Blok B No. 12' },
  { name: 'Bambang Pamungkas', email: 'bambang@smartwarga.test', unit: 'RT 02 Blok B No. 01' },
];

export default function AuthView() {
  const { login } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('budi@smartwarga.test');
  const [loginPassword, setLoginPassword] = useState('password');
  const [selectedWargaEmail, setSelectedWargaEmail] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRt, setRegRt] = useState('01');
  const [regBlock, setRegBlock] = useState('A');
  const [regHouseId, setRegHouseId] = useState<number | null>(null);
  const [regKkType, setRegKkType] = useState<'kk_utama' | 'kk_pendukung' | 'anggota'>('kk_utama');
  const [regNoKk, setRegNoKk] = useState('');
  const [regNik, setRegNik] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRfid, setRegRfid] = useState('');
  const [isScanningRfid, setIsScanningRfid] = useState(false);
  const [rfidStatusText, setRfidStatusText] = useState('');

  // Houses lookup data
  const [houses, setHouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Dynamic Warga accounts from API (fallback to static list)
  const [dynamicWargaAccounts, setDynamicWargaAccounts] = useState<Array<{ id?: number; name: string; email: string; unit: string }>>(wargaAccounts);

  const fetchWargaAccounts = useCallback(async () => {
    try {
      const res = await fetchApi('/auth/warga-accounts');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setDynamicWargaAccounts(res.data);
      }
    } catch {
      // fallback to initial list
    }
  }, []);

  useEffect(() => {
    fetchWargaAccounts();
  }, [fetchWargaAccounts]);

  const openAuthModal = (mode: 'login' | 'register') => {
    setIsRegister(mode === 'register');
    setErrorMsg('');
    setSuccessMsg('');
    setShowAuthModal(true);
  };

  // Lock body scroll & Escape key handling while modal is open
  useEffect(() => {
    if (!showAuthModal) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAuthModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showAuthModal]);

  // Polling sensor ESP32 saat warga klik "Pindai dari ESP32" di form pendaftaran
  useEffect(() => {
    let interval: any = null;
    if (isScanningRfid) {
      setRfidStatusText('Mendengarkan scanner ESP32... Silakan tempelkan e-KTP / Kartu ke alat sekarang.');
      const checkScan = async () => {
        try {
          const res = await fetchApi('/iot/ktp/latest-scan');
          if (res.success && res.data?.rfid_uid) {
            setRegRfid(res.data.rfid_uid);
            setRfidStatusText(`Kartu Terdeteksi: [${res.data.rfid_uid}]!`);
            setIsScanningRfid(false);
          }
        } catch {
          // ignore
        }
      };
      checkScan();
      interval = setInterval(checkScan, 1500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isScanningRfid]);

  // Fetch houses when RT / Block changes
  useEffect(() => {
    if (showAuthModal && isRegister) {
      const fetchHouses = async () => {
        try {
          const res = await fetchApi(`/houses?rt_number=${regRt}&block=${regBlock}`);
          if (res.success && res.data) {
            setHouses(res.data);
            const available = res.data.find((h: any) => !h.is_occupied) || res.data[0];
            if (available) {
              setRegHouseId(available.id);
              if (available.is_occupied) {
                setRegKkType('kk_pendukung');
              } else {
                setRegKkType('kk_utama');
              }
            }
          }
        } catch {
          // ignore
        }
      };
      fetchHouses();
    }
  }, [showAuthModal, isRegister, regRt, regBlock]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      if (res.success && res.data) {
        setShowAuthModal(false);
        login(res.data.token, res.data.user);
      }
    } catch (err: any) {
      setErrorMsg(
        err.message === 'Failed to fetch'
          ? 'Gagal terhubung ke server. Silakan coba sesaat lagi.'
          : err.message || 'Login gagal.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regHouseId) {
      setErrorMsg('Harap pilih unit rumah Anda.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          rt_number: regRt,
          house_id: regHouseId,
          kk_type: regKkType,
          no_kk: regNoKk || null,
          nik: regNik || null,
          rfid_uid: regRfid || null,
          phone: regPhone || null,
        }),
      });

      if (res.success && res.data) {
        setSuccessMsg(res.message);
        fetchWargaAccounts();
        setLoginEmail(regEmail);
        setLoginPassword('');
        setTimeout(() => {
          setIsRegister(false);
        }, 3500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Pendaftaran gagal.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Account Picker chips with optional auto-login
  const fillQuickAccount = async (email: string, autoLogin: boolean = false) => {
    setLoginEmail(email);
    setLoginPassword('password');
    setSelectedWargaEmail(email);
    setErrorMsg('');
    if (autoLogin) {
      setLoading(true);
      try {
        const res = await fetchApi('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password: 'password' }),
        });
        if (res.success && res.data) {
          setShowAuthModal(false);
          login(res.data.token, res.data.user);
        }
      } catch (err: any) {
        setErrorMsg(
          err.message === 'Failed to fetch'
            ? 'Gagal terhubung ke server. Silakan coba sesaat lagi.'
            : err.message || 'Login gagal.'
        );
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800 selection:bg-sky-100 selection:text-sky-900">
      {/* 1. Sticky White Frosted Navbar (Serasi dengan WEB Palugada — tombol Login selalu langsung tampil di HP & Desktop) */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[68px] flex items-center justify-between gap-3">
          {/* Brand Logo */}
          <a href="#home" className="flex items-center gap-2.5 sm:gap-3 min-w-0 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-sky-200 shadow-sm shrink-0 transition group-hover:scale-105">
              <img src="/icon-192.png" alt="SMART-WARGA" className="w-full h-full object-cover" />
            </div>
            <div className="truncate">
              <div className="flex items-baseline gap-1 leading-none">
                <span className="font-black text-base sm:text-xl tracking-tight bg-gradient-to-r from-[#0ea5e9] to-[#10b981] bg-clip-text text-transparent">
                  SMART
                </span>
                <span className="font-extrabold text-sm sm:text-base text-slate-800 tracking-tight">
                  -WARGA
                </span>
              </div>
              <div className="text-[10px] sm:text-[11px] font-semibold text-sky-600 leading-tight mt-0.5 truncate">
                Digital RW 05 Platform
              </div>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <a href="#fitur" className="hover:text-[#0ea5e9] transition">
              Fitur
            </a>
            <a href="#iot" className="hover:text-[#0ea5e9] transition">
              IoT ESP32
            </a>
            <a href="#role" className="hover:text-[#0ea5e9] transition">
              Akses Role
            </a>
          </nav>

          {/* Action Buttons (Selalu terlihat di HP & Desktop tanpa perlu scroll) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => openAuthModal('register')}
              className="px-3 sm:px-4 py-2 rounded-full border-2 border-[#0ea5e9]/60 bg-white hover:bg-sky-50 text-[#0284c7] text-xs sm:text-sm font-bold flex items-center gap-1.5 transition active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Daftar</span>
            </button>
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="px-4 sm:px-5 py-2 rounded-full bg-gradient-to-r from-[#0ea5e9] to-[#10b981] hover:brightness-105 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-[0_4px_15px_rgba(14,165,233,0.3)] transition active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Masuk Akun</span>
              <span className="sm:hidden">Masuk</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section 2-Kolom Asimetris (Tema Terang Pastel WEB Palugada: Sky -> Mint -> Lavender) */}
      <section
        id="home"
        className="relative overflow-hidden bg-[linear-gradient(160deg,#f0f9ff_0%,#ecfdf5_50%,#f5f3ff_100%)] pt-10 pb-12 sm:pt-14 sm:pb-16 lg:pt-16 lg:pb-14 px-4 sm:px-6 lg:px-8"
      >
        {/* Soft Pastel Ambient Orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#0ea5e9]/15 blur-[90px]" />
          <div className="absolute top-1/4 -right-24 w-96 h-96 rounded-full bg-[#10b981]/15 blur-[100px]" />
          <div className="absolute -bottom-24 left-1/3 w-80 h-80 rounded-full bg-[#8b5cf6]/10 blur-[90px]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* KOLOM KIRI: Identitas, Headline, CTA Pill & Kartu Statistik Putih */}
            <div className="lg:col-span-6 space-y-5 sm:space-y-6 text-center lg:text-left flex flex-col items-center lg:items-start">
              {/* Pill Badge Portal */}
              <div className="inline-flex items-center gap-2 bg-white border border-slate-200/80 shadow-sm rounded-full px-4 py-1.5 text-xs font-bold text-slate-700 mx-auto lg:mx-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="truncate">Portal Digital Lingkungan RW 05 &bull; Terintegrasi IoT ESP32</span>
              </div>

              {/* Headline Besar & Tegas */}
              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.12]">
                Sistem Digital &amp;
                <br />
                <span className="bg-gradient-to-r from-[#0ea5e9] to-[#10b981] bg-clip-text text-transparent">
                  Keamanan IoT
                </span>{' '}
                RW 05
              </h1>

              {/* Subjudul & Deskripsi */}
              <div className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl space-y-1.5 mx-auto lg:mx-0">
                <p className="font-extrabold text-slate-800">
                  Semua layanan warga &amp; gerbang pintar dalam satu sistem!
                </p>
                <p>
                  Sensus 300 hunian, transparansi iuran IPL 12 bulan, pengajuan surat pengantar digital, tombol panik darurat, kios pelayanan mandiri, hingga otomasi palang gerbang RFID berbasis ESP32.
                </p>
              </div>

              {/* 2 Tombol Pill CTA: Responsif Sejajar di Semua HP */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 w-full sm:w-auto sm:flex sm:flex-row items-center justify-center lg:justify-start pt-1">
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="w-full sm:w-auto px-3 sm:px-7 py-3 sm:py-3.5 rounded-full bg-gradient-to-r from-[#0ea5e9] to-[#10b981] hover:brightness-105 text-white font-bold text-xs sm:text-base inline-flex items-center justify-center gap-1.5 sm:gap-2 shadow-[0_6px_20px_rgba(14,165,233,0.35)] transition active:scale-95 whitespace-nowrap"
                >
                  <LogIn className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  <span className="truncate">Masuk ke Sistem</span>
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal('register')}
                  className="w-full sm:w-auto px-3 sm:px-7 py-3 sm:py-3.5 rounded-full border-2 border-[#0ea5e9] bg-white hover:bg-sky-50 text-[#0284c7] font-bold text-xs sm:text-base inline-flex items-center justify-center gap-1.5 sm:gap-2 transition active:scale-95 whitespace-nowrap"
                >
                  <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  <span className="truncate">Daftar Warga Baru</span>
                </button>
              </div>

              {/* Floating White Stats Card (Gaya WEB Palugada) */}
              <div className="pt-2 w-full flex justify-center lg:justify-start">
                <div className="bg-white/95 border border-slate-200/70 rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] px-4 sm:px-7 py-3.5 sm:py-4 inline-flex items-center justify-around sm:justify-start gap-4 sm:gap-7 w-full sm:w-auto max-w-md">
                  <div>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 leading-none">
                      37<span className="text-[#0ea5e9]">+</span>
                    </div>
                    <div className="text-[11px] sm:text-xs font-medium text-slate-500 mt-1">KK Aktif</div>
                  </div>
                  <div className="w-px h-8 sm:h-9 bg-slate-200" />
                  <div>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 leading-none">
                      300
                    </div>
                    <div className="text-[11px] sm:text-xs font-medium text-slate-500 mt-1">Unit Hunian</div>
                  </div>
                  <div className="w-px h-8 sm:h-9 bg-slate-200" />
                  <div>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 leading-none">
                      2<span className="text-[#10b981] text-sm sm:text-lg font-extrabold ml-1">Area</span>
                    </div>
                    <div className="text-[11px] sm:text-xs font-medium text-slate-500 mt-1">IoT ESP32</div>
                  </div>
                </div>
              </div>
            </div>

            {/* KOLOM KANAN: Visual Showcase Card + 2 Floating Badges ala WEB Palugada */}
            <div className="lg:col-span-6 relative px-2 sm:px-4 lg:px-2">
              {/* Main White Preview Card */}
              <div className="relative bg-white rounded-3xl shadow-[0_20px_50px_rgba(14,165,233,0.12)] border border-sky-100 p-5 sm:p-6">
                {/* Mini Browser Window Header */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="text-[11px] font-mono font-semibold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 truncate max-w-[220px] sm:max-w-none">
                    swarga.manajemensystem.my.id
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    LIVE
                  </span>
                </div>

                {/* Inner Preview Header */}
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-sky-50 to-emerald-50 border border-sky-100/80 mb-4">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white shadow-sm shrink-0">
                    <img src="/icon-192.png" alt="SMART-WARGA" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm sm:text-base font-black text-slate-900 truncate">
                      Dashboard SMART-WARGA RW 05
                    </div>
                    <div className="text-xs text-slate-600 truncate">
                      Terhubung Realtime &bull; 3 Wilayah RT (01, 02, 03)
                    </div>
                  </div>
                </div>

                {/* Dual-Area IoT Mini Status Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md">
                        Area 1 &bull; Gerbang
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    </div>
                    <div className="text-xs font-extrabold text-slate-900">Pos Satpam &amp; Servo</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      RFID Reader 1 (Pin 5) &bull; Sirine
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                        Area 2 &bull; Kios
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    </div>
                    <div className="text-xs font-extrabold text-slate-900">Meja Kios Balai Warga</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      RFID Reader 2 (Pin 4) &bull; LCD 16x2
                    </div>
                  </div>
                </div>

                {/* Mini Service Chips */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-100">
                    <div className="text-xs font-black text-sky-700">IPL 12 Bln</div>
                    <div className="text-[10px] text-slate-500">QRIS &amp; Kas</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-violet-50/70 border border-violet-100">
                    <div className="text-xs font-black text-violet-700">Surat PDF</div>
                    <div className="text-[10px] text-slate-500">ACC RT/RW</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-100">
                    <div className="text-xs font-black text-rose-700">Panic Alert</div>
                    <div className="text-[10px] text-slate-500">Sirine 24 Jam</div>
                  </div>
                </div>

                {/* Floating Badge Top-Left (Gaya "Proyek Selesai" di WEB Palugada) */}
                <div className="hidden sm:flex items-center gap-2.5 absolute -top-5 -left-6 bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-100 px-4 py-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900 leading-tight">ESP32 Dual-Area</div>
                    <div className="text-[10px] text-slate-500 font-medium">Gerbang &amp; Kios Otomatis</div>
                  </div>
                </div>

                {/* Floating Badge Bottom-Right (Gaya "Fast Delivery" di WEB Palugada) */}
                <div className="hidden sm:flex items-center gap-2.5 absolute -bottom-5 -right-5 bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-100 px-4 py-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 fill-amber-500" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900 leading-tight">8 Role RBAC</div>
                    <div className="text-[10px] text-slate-500 font-medium">Warga, RT/RW &amp; Satpam</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll Cue (Seperti WEB Palugada) */}
          <div className="hidden lg:flex flex-col items-center mt-10 text-slate-400">
            <a href="#fitur" className="flex flex-col items-center gap-1 hover:text-[#0ea5e9] transition">
              <span className="text-xs font-medium">Scroll ke bawah</span>
              <ChevronDown className="w-4 h-4 animate-bounce" />
            </a>
          </div>
        </div>
      </section>

      {/* 3. Section Fitur Unggulan SMART-WARGA (Bersih & Terang) */}
      <section id="fitur" className="bg-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-block text-xs font-extrabold uppercase tracking-wider text-[#0284c7] bg-sky-100 px-4 py-1.5 rounded-full mb-3">
              Ekosistem Aplikasi
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Fitur Unggulan SMART-WARGA
            </h2>
            <p className="text-sm sm:text-base text-slate-500 mt-3 leading-relaxed">
              Seluruh kebutuhan administrasi, keuangan, pelayanan warga, hingga kontrol keamanan fisik lingkungan terintegrasi dalam satu platform modern.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {platformFeatures.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-3.5 sm:p-6 border border-slate-200/90 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-sky-300 transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2.5 sm:mb-4">
                      <div className={`w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center ${item.iconColor} shadow-sm shrink-0`}>
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <span className={`text-[9px] sm:text-[11px] font-bold px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full border truncate ${item.tagColor}`}>
                        {item.tag}
                      </span>
                    </div>
                    <h3 className="text-xs sm:text-base font-extrabold text-slate-900 mb-1 sm:mb-2 line-clamp-2 sm:line-clamp-none">
                      {item.title}
                    </h3>
                    <p className="text-[11px] sm:text-sm text-slate-600 leading-snug sm:leading-relaxed line-clamp-3 sm:line-clamp-none">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Section Arsitektur IoT ESP32 Dual-Area (Terang Pastel Sky-Emerald — Bukan Gelap!) */}
      <section
        id="iot"
        className="bg-gradient-to-br from-sky-50 via-white to-emerald-50 py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-y border-slate-200/70"
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-4 py-1.5 rounded-full mb-3">
              <Cpu className="w-3.5 h-3.5" />
              Keunggulan Hardware Terintegrasi
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Arsitektur IoT ESP32 Dual-Area Otomatis
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2.5 leading-relaxed">
              Satu modul mikrokontroler ESP32 mengendalikan dua pos fisik sekaligus &mdash; cukup koneksikan Wi-Fi dari PC Pos Satpam atau Meja Kios, kedua area langsung siaga bersamaan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-sky-200/80 rounded-3xl p-6 sm:p-7 shadow-md shadow-sky-900/5 space-y-3">
              <div className="inline-block text-xs font-black uppercase tracking-wider text-sky-700 bg-sky-100 px-3 py-1 rounded-full">
                Area 1 &bull; Pos Satpam Gerbang Utama
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">Palang Pintu Otomatis &amp; Ronda Malam</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Dilengkapi <strong>RFID Reader 1 (Pin 5)</strong> untuk tap e-KTP warga membuka <strong>Palang Servo (Pin 13)</strong>, absensi ronda satpam, serta <strong>Sirine Buzzer (Pin 14)</strong> yang aktif saat Tombol Panik ditekan.
              </p>
            </div>

            <div className="bg-white border border-emerald-200/80 rounded-3xl p-6 sm:p-7 shadow-md shadow-emerald-900/5 space-y-3">
              <div className="inline-block text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                Area 2 &bull; Meja Kios Pelayanan Terpadu
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">Antrean Kios, Pairing e-KTP &amp; Bank Sampah</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Menggunakan <strong>RFID Reader 2 (Pin 4)</strong> dan layar <strong>LCD 16x2 I2C</strong>. Kartu warga terdaftar otomatis mendapat nomor antrean pelayanan &amp; legalisasi berkas, sedangkan kartu asing otomatis ditolak.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Section Akses Terpadu 8 Role */}
      <section id="role" className="bg-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 text-center md:text-left">
            <div>
              <span className="inline-block text-xs font-extrabold uppercase tracking-wider text-sky-700 bg-sky-100 px-3.5 py-1 rounded-full mb-2">
                Manajemen Peran
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                Akses Terpadu 8 Role Lingkungan
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Setiap warga (KK Utama) hingga struktur pengurus RT/RW dan Satpam memiliki hak akses yang terukur.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-[#0ea5e9] to-[#10b981] hover:brightness-105 text-white text-sm font-bold inline-flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(14,165,233,0.3)] transition active:scale-95 shrink-0 self-center md:self-auto"
            >
              <span>Masuk &amp; Pilih Role</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {roleSummaries.map((role, i) => (
              <div key={i} className="p-3 sm:p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-sky-200 hover:shadow-sm transition flex flex-col justify-between">
                <div>
                  <span className={`inline-block text-[10px] sm:text-xs font-extrabold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full mb-1.5 sm:mb-2 ${role.badge}`}>
                    {role.name}
                  </span>
                  <p className="text-[11px] sm:text-xs text-slate-600 leading-snug line-clamp-3 sm:line-clamp-none">{role.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Footer Ringkas SMART-WARGA & Atribusi WEB Palugada */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-700 shrink-0">
                <img src="/icon-192.png" alt="SMART-WARGA" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="font-black text-base text-white leading-none">
                  SMART<span className="text-[#38bdf8]">-WARGA</span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">Portal Digital Lingkungan RW 05</div>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sistem informasi terpadu kependudukan, keuangan iuran IPL transparan, persuratan digital, serta integrasi keamanan gerbang &amp; kios IoT ESP32.
            </p>
            <p className="text-[11px] text-slate-500 pt-1">
              &copy; 2026 <strong className="text-slate-300">SMART-WARGA RW 05</strong>. All rights reserved.
            </p>
          </div>

          <div className="flex flex-col md:items-end gap-2 shrink-0">
            <div className="inline-flex items-center gap-2.5 bg-slate-800/70 border border-slate-700/80 rounded-full px-3.5 py-2">
              <WebPalugadaLogo idSuffix="footer" size={22} />
              <span className="text-xs text-slate-300">
                Designed &amp; Created by{' '}
                <a
                  href="https://manajemensystem.my.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#38bdf8] hover:underline font-bold"
                >
                  WEB Palugada
                </a>
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              manajemensystem.my.id
            </span>
          </div>
        </div>
      </footer>

      {/* 7. DIALOG MODAL LOGIN & DAFTAR (Dibuka dari tombol atas / Hero — nyaman di HP & Desktop) */}
      {showAuthModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
          onClick={() => setShowAuthModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Portal Masuk SMART-WARGA"
        >
          <div
            className="bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[94vh] overflow-y-auto p-5 sm:p-7 relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Tombol Tutup Modal */}
            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              aria-label="Tutup dialog"
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header dengan Logo */}
            <div className="flex items-center gap-3 pr-8">
              <div className="w-11 h-11 rounded-2xl overflow-hidden border border-sky-200 shadow-sm shrink-0">
                <img src="/icon-192.png" alt="SMART-WARGA" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
                  {isRegister ? 'Daftar Akun Warga Baru' : 'Masuk ke SMART-WARGA'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isRegister
                    ? 'Lengkapi identitas hunian & scan e-KTP/RFID Anda.'
                    : 'Masuk dengan email terdaftar atau pilih akses cepat di bawah.'}
                </p>
              </div>
            </div>

            {/* Tab switch */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-full">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`py-2 text-xs sm:text-sm font-bold rounded-full transition ${
                  !isRegister ? 'bg-white text-[#0284c7] shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Masuk Akun
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`py-2 text-xs sm:text-sm font-bold rounded-full transition ${
                  isRegister ? 'bg-white text-[#0284c7] shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Daftar Warga Baru
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* 1. LOGIN FORM */}
            {!isRegister ? (
              <form onSubmit={handleLogin} className="grid grid-cols-1 lg:grid-cols-2 gap-x-7 gap-y-5 lg:items-start">
                {/* KOLOM KIRI: Form Login */}
                <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">Email Terdaftar:</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full text-sm font-bold text-slate-900 bg-white pl-10 pr-3.5 py-2.5 rounded-xl border-2 border-slate-300 placeholder:text-slate-400 focus:bg-white focus:border-[#0ea5e9] focus:ring-2 focus:ring-sky-100 focus:outline-none transition shadow-xs"
                      placeholder="nama@smartwarga.test"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">Password:</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full text-sm font-bold text-slate-900 bg-white pl-10 pr-3.5 py-2.5 rounded-xl border-2 border-slate-300 placeholder:text-slate-400 focus:bg-white focus:border-[#0ea5e9] focus:ring-2 focus:ring-sky-100 focus:outline-none transition shadow-xs"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-[#0ea5e9] to-[#10b981] hover:brightness-105 text-white rounded-full text-sm font-black shadow-[0_6px_18px_rgba(14,165,233,0.3)] active:scale-95 transition disabled:opacity-50"
                >
                  {loading ? 'MEMERIKSA...' : 'MASUK KE SISTEM'}
                </button>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 leading-relaxed">
                  🔒 <strong>Ketentuan Akses Warga:</strong> Akses login sistem dikhususkan bagi <strong>KK Utama</strong> (Penanggung Jawab Rumah). <strong>KK Tambahan tidak memiliki akses login</strong> karena penanggung jawab iuran dan administrasi rumah adalah KK Utama.
                </div>
                </div>

                {/* KOLOM KANAN: Akun Pintasan (Quick Demo Credentials & Dropdown Warga) */}
                <div className="lg:border-l lg:border-slate-200 lg:pl-7 space-y-4">
                  {/* Dropdown Fast Login 37 Warga */}
                  <div className="p-3.5 bg-sky-50/80 rounded-2xl border border-sky-200 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-[#0284c7]" />
                        <span>Pilih Akun Warga ({dynamicWargaAccounts.length} KK Terdaftar):</span>
                      </label>
                      <span className="text-[10px] text-sky-800 font-extrabold bg-sky-200/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Warga
                      </span>
                    </div>
                    <div className="space-y-2">
                      <select
                        value={selectedWargaEmail}
                        onChange={(e) => {
                          setSelectedWargaEmail(e.target.value);
                          if (e.target.value) {
                            fillQuickAccount(e.target.value, false);
                          }
                        }}
                        className="w-full text-xs sm:text-sm font-bold px-3 py-2.5 rounded-xl border-2 border-sky-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] shadow-xs"
                      >
                        <option value="">-- Pilih Nama Warga Untuk Masuk Cepat --</option>
                        {dynamicWargaAccounts.map((w) => (
                          <option key={w.email} value={w.email}>
                            {w.name} — {w.unit}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={!selectedWargaEmail || loading}
                        onClick={() => {
                          if (selectedWargaEmail) {
                            fillQuickAccount(selectedWargaEmail, true);
                          }
                        }}
                        className="w-full py-2.5 bg-gradient-to-r from-[#0ea5e9] to-[#10b981] hover:brightness-105 disabled:opacity-40 text-white rounded-full text-xs sm:text-sm font-black transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                      >
                        <span>Masuk Sebagai Warga Terpilih</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Role-Based Quick Buttons (Khusus Pengurus & Struktur Lingkungan) */}
                  <div>
                    <span className="text-[11px] uppercase font-extrabold tracking-wider text-slate-500 block mb-2">
                      Pilih Cepat Pengurus &amp; Petugas (Role-Based):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => fillQuickAccount('admin@smartwarga.test', true)}
                        className="px-3 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 flex items-center gap-2 text-left transition active:scale-95 shadow-sm"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                        <div className="truncate">
                          <div>Super Admin</div>
                          <div className="text-[10px] font-normal text-slate-400">Akses Penuh Sistem</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => fillQuickAccount('rw@smartwarga.test', true)}
                        className="px-3 py-2.5 bg-slate-100 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 hover:bg-slate-200 flex items-center gap-2 text-left transition active:scale-95"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-800 shrink-0" />
                        <div className="truncate">
                          <div>Ketua RW 05</div>
                          <div className="text-[10px] font-normal text-slate-500">Supervisi Lingkungan</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => fillQuickAccount('sekretaris_rw@smartwarga.test', true)}
                        className="px-3 py-2.5 bg-purple-50 text-purple-900 text-xs font-bold rounded-xl border border-purple-200 hover:bg-purple-100 flex items-center gap-2 text-left transition active:scale-95"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0" />
                        <div className="truncate">
                          <div>Ibu Maya (Sekretaris)</div>
                          <div className="text-[10px] font-normal text-purple-700">Sekretaris RW 05</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => fillQuickAccount('bendahara_rw@smartwarga.test', true)}
                        className="px-3 py-2.5 bg-indigo-50 text-indigo-900 text-xs font-bold rounded-xl border border-indigo-200 hover:bg-indigo-100 flex items-center gap-2 text-left transition active:scale-95"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0" />
                        <div className="truncate">
                          <div>Pak Hendra (Bendahara)</div>
                          <div className="text-[10px] font-normal text-indigo-700">Bendahara RW 05</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => fillQuickAccount('rt01@smartwarga.test', true)}
                        className="px-3 py-2.5 bg-slate-100 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 hover:bg-slate-200 flex items-center gap-2 text-left transition active:scale-95"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-600 shrink-0" />
                        <div className="truncate">
                          <div>Ketua RT 01</div>
                          <div className="text-[10px] font-normal text-slate-500">Pengawasan Wilayah RT</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => fillQuickAccount('sekretaris_rt01@smartwarga.test', true)}
                        className="px-3 py-2.5 bg-blue-50 text-blue-900 text-xs font-bold rounded-xl border border-blue-200 hover:bg-blue-100 flex items-center gap-2 text-left transition active:scale-95"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                        <div className="truncate">
                          <div>Pak Danu (Sekretaris)</div>
                          <div className="text-[10px] font-normal text-blue-700">Sekretaris RT 01</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => fillQuickAccount('bendahara_rt01@smartwarga.test', true)}
                        className="px-3 py-2.5 bg-emerald-50 text-emerald-900 text-xs font-bold rounded-xl border border-emerald-300 hover:bg-emerald-100 flex items-center gap-2 text-left transition active:scale-95"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                        <div className="truncate">
                          <div>Ibu Ratna (Bendahara)</div>
                          <div className="text-[10px] font-normal text-emerald-700">Bendahara RT 01 (ACC Iuran)</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => fillQuickAccount('satpam@smartwarga.test', true)}
                        className="px-3 py-2.5 bg-gradient-to-r from-slate-900 to-sky-950 text-white text-xs font-bold rounded-xl border border-sky-500/40 hover:from-slate-800 hover:to-sky-900 flex items-center gap-2 text-left transition active:scale-95 shadow-sm"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shrink-0 animate-ping" />
                        <div className="truncate">
                          <div>Pak Bambang (Satpam)</div>
                          <div className="text-[10px] font-normal text-sky-200">Pos Gerbang (Palang &amp; IoT)</div>
                        </div>
                      </button>
                    </div>
                  </div>

                </div>
              </form>
            ) : (
              /* 2. REGISTER FORM */
              <form onSubmit={handleRegister} className="grid grid-cols-1 lg:grid-cols-2 gap-x-7 gap-y-4">
                {/* KOLOM KIRI REGISTER: Identitas */}
                <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Nama Lengkap Sesuai KTP:</label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full text-sm font-bold text-slate-900 bg-white px-3.5 py-2.5 rounded-xl border-2 border-slate-300 focus:border-[#0ea5e9] focus:outline-none"
                    placeholder="Contoh: Ahmad Fadilah"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">NIK (16 Digit):</label>
                    <input
                      type="text"
                      maxLength={16}
                      value={regNik}
                      onChange={(e) => setRegNik(e.target.value)}
                      className="w-full text-xs sm:text-sm font-mono font-bold text-slate-900 bg-white px-3 py-2.5 rounded-xl border-2 border-slate-300 focus:border-[#0ea5e9] focus:outline-none"
                      placeholder="320101xxxxxxxxxx"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">No. Kartu Keluarga (KK):</label>
                    <input
                      type="text"
                      maxLength={16}
                      value={regNoKk}
                      onChange={(e) => setRegNoKk(e.target.value)}
                      className="w-full text-xs sm:text-sm font-mono font-bold text-slate-900 bg-white px-3 py-2.5 rounded-xl border-2 border-slate-300 focus:border-[#0ea5e9] focus:outline-none"
                      placeholder="320101xxxxxxxxxx"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Email:</label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full text-xs sm:text-sm font-bold text-slate-900 bg-white px-3 py-2.5 rounded-xl border-2 border-slate-300 focus:border-[#0ea5e9] focus:outline-none"
                      placeholder="email@warga.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Nomor WhatsApp:</label>
                    <input
                      type="text"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full text-xs sm:text-sm font-bold text-slate-900 bg-white px-3 py-2.5 rounded-xl border-2 border-slate-300 focus:border-[#0ea5e9] focus:outline-none"
                      placeholder="08123456789"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Buat Password:</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full text-sm font-bold text-slate-900 bg-white px-3.5 py-2.5 rounded-xl border-2 border-slate-300 focus:border-[#0ea5e9] focus:outline-none"
                    placeholder="Minimal 6 karakter"
                    required
                  />
                </div>

                </div>

                {/* KOLOM KANAN REGISTER: Alamat & RFID */}
                <div className="space-y-3.5">
                {/* Wilayah & Rumah Selector */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                  <span className="text-[11px] font-extrabold uppercase text-slate-600 block">
                    Pilih Alamat Hunian (Kapasitas 300 Rumah):
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Pilih RT:</label>
                      <select
                        value={regRt}
                        onChange={(e) => setRegRt(e.target.value)}
                        className="w-full text-xs sm:text-sm font-bold text-slate-900 px-2.5 py-2 rounded-xl border-2 border-slate-300 bg-white"
                      >
                        <option value="01">RT 01</option>
                        <option value="02">RT 02</option>
                        <option value="03">RT 03</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Blok:</label>
                      <select
                        value={regBlock}
                        onChange={(e) => setRegBlock(e.target.value)}
                        className="w-full text-xs sm:text-sm font-bold text-slate-900 px-2.5 py-2 rounded-xl border-2 border-slate-300 bg-white"
                      >
                        <option value="A">Blok A (No 1-25)</option>
                        <option value="B">Blok B (No 1-25)</option>
                        <option value="C">Blok C (No 1-25)</option>
                        <option value="D">Blok D (No 1-25)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nomor / Unit Rumah:</label>
                    <select
                      value={regHouseId || ''}
                      onChange={(e) => {
                        const hId = Number(e.target.value);
                        setRegHouseId(hId);
                        const selected = houses.find((h) => h.id === hId);
                        if (selected?.is_occupied) {
                          setRegKkType('kk_pendukung');
                        } else {
                          setRegKkType('kk_utama');
                        }
                      }}
                      className="w-full text-xs font-bold text-slate-900 px-2.5 py-2 rounded-xl border-2 border-slate-300 bg-white"
                      required
                    >
                      {houses.map((h) => (
                        <option key={h.id} value={h.id}>
                          [{h.house_code || `RT${h.rt_number}-${h.block}${h.number}`}] {h.full_address}{' '}
                          {h.is_occupied
                            ? `(Terisi - KK Utama: ${h.head_of_family?.name || 'Ada'})`
                            : '— [Rumah Kosong / Siap Huni]'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Status Kartu Keluarga (KK) di Rumah Ini:
                    </label>
                    <select
                      value={regKkType}
                      onChange={(e: any) => setRegKkType(e.target.value)}
                      className="w-full text-xs font-bold px-2.5 py-2 rounded-xl border-2 border-sky-300 bg-sky-50 text-sky-950"
                    >
                      <option value="kk_utama">KK Utama (Kepala Rumah Tangga / Penanggung Jawab IPL)</option>
                      <option value="kk_pendukung">KK Pendukung / Tambahan (Kerabat Serumah)</option>
                      <option value="anggota">Anggota Keluarga dalam KK</option>
                    </select>
                  </div>
                </div>

                {/* Integrasi Pindai e-KTP / Kartu RFID Langsung dari ESP32 */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-[#0ea5e9]" />
                      <span>UID Kartu RFID / e-KTP Fisik:</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsScanningRfid(!isScanningRfid)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-black transition flex items-center gap-1 shadow-xs ${
                        isScanningRfid
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'bg-[#0ea5e9] hover:bg-[#0284c7] text-white'
                      }`}
                    >
                      <Radio className={`w-3.5 h-3.5 ${isScanningRfid ? 'animate-spin' : ''}`} />
                      <span>{isScanningRfid ? 'Batalkan Scan' : 'Pindai dari ESP32'}</span>
                    </button>
                  </div>

                  {isScanningRfid && (
                    <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900 flex items-center gap-2 animate-pulse">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9] animate-ping shrink-0" />
                      <span>Tempelkan kartu/e-KTP ke sensor RC522 sekarang...</span>
                    </div>
                  )}

                  {rfidStatusText && (
                    <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{rfidStatusText}</span>
                    </div>
                  )}

                  <input
                    type="text"
                    value={regRfid}
                    onChange={(e) => setRegRfid(e.target.value.toUpperCase())}
                    className="w-full text-sm font-mono font-bold text-slate-900 px-3 py-2 rounded-xl border-2 border-slate-300 bg-white uppercase focus:border-[#0ea5e9] focus:outline-none"
                    placeholder="Contoh: A1B2C3D4 (atau klik Pindai dari ESP32)"
                  />
                  <span className="text-[11px] text-slate-500 block leading-snug">
                    Kartu otomatis terhubung untuk buka palang gerbang otomatis, antrean Kios Pelayanan, dan setor Bank Sampah.
                  </span>
                </div>

                </div>

                <div className="lg:col-span-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-[#0ea5e9] to-[#10b981] hover:brightness-105 text-white rounded-full text-sm font-black shadow-[0_6px_18px_rgba(14,165,233,0.3)] active:scale-95 transition disabled:opacity-50"
                  >
                    {loading ? 'MENDAFTAR...' : 'DAFTAR MENUNGGU ACC RT'}
                  </button>
                </div>
              </form>
            )}

            {/* Credit WEB Palugada di bagian bawah modal */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <WebPalugadaLogo idSuffix="modal" size={18} />
              <span>
                Designed &amp; Created by{' '}
                <a
                  href="https://manajemensystem.my.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#0284c7] hover:underline"
                >
                  WEB Palugada
                </a>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
