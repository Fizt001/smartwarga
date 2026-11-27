'use client';

import React, { useEffect, useState } from 'react';
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
  Search,
  ChevronRight,
  Building2
} from 'lucide-react';

const platformFeatures = [
  {
    icon: ShieldCheck,
    tag: 'Hardware IoT',
    tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconColor: 'bg-emerald-600 text-white',
    title: 'Keamanan Gerbang & Pos Satpam',
    desc: 'Otomasi palang servo gerbang via RFID e-KTP, absensi ronda malam satpam, dan log akses kendaraan real-time.',
  },
  {
    icon: CreditCard,
    tag: 'Transparansi',
    tagColor: 'bg-blue-50 text-blue-700 border-blue-200',
    iconColor: 'bg-blue-600 text-white',
    title: 'Iuran Warga (IPL) & Kas Terbuka',
    desc: 'Kalender tagihan IPL 12 bulan, pembayaran QRIS/Dompet Warga, verifikasi Bendahara, serta rekap kas RT ke RW terbuka.',
  },
  {
    icon: FileText,
    tag: 'Persuratan',
    tagColor: 'bg-purple-50 text-purple-700 border-purple-200',
    iconColor: 'bg-purple-600 text-white',
    title: 'Surat Pengantar Digital & PDF',
    desc: 'Pengajuan surat pengantar RT/RW secara online dengan alur validasi berjenjang RT & RW hingga dokumen siap cetak.',
  },
  {
    icon: Volume2,
    tag: 'Darurat 24 Jam',
    tagColor: 'bg-rose-50 text-rose-700 border-rose-200',
    iconColor: 'bg-rose-600 text-white',
    title: 'Tombol Panik & Sirine Terpadu',
    desc: 'Peringatan bahaya satu sentuhan yang langsung membunyikan sirine fisik pos gerbang dan mengirim alert ke petugas.',
  },
  {
    icon: Recycle,
    tag: 'Kios Mandiri',
    tagColor: 'bg-amber-50 text-amber-700 border-amber-200',
    iconColor: 'bg-amber-600 text-white',
    title: 'Kios Pelayanan & Bank Sampah',
    desc: 'Anjungan mandiri di Balai Warga untuk antrean pelayanan e-KTP terdaftar, pairing kartu baru, dan setor bank sampah.',
  },
  {
    icon: Users,
    tag: 'Sensus RW 05',
    tagColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    iconColor: 'bg-indigo-600 text-white',
    title: 'Sensus 300 Hunian & KK Utama',
    desc: 'Pendataan unit rumah RT 01-03 yang memisahkan KK Utama (penanggung jawab IPL) dengan KK Pendukung secara rapi.',
  },
];

const roleSummaries = [
  { name: 'Super Admin', desc: 'Kontrol penuh seluruh modul & konfigurasi IoT', badge: 'bg-slate-900 text-white' },
  { name: 'Ketua RW 05', desc: 'Supervisi 3 RT, approval surat RW & audit kas', badge: 'bg-slate-100 text-slate-800 border border-slate-300' },
  { name: 'Sekretaris RW / RT', desc: 'Validasi penomoran surat, agenda kegiatan & aset', badge: 'bg-purple-50 text-purple-800 border border-purple-200' },
  { name: 'Bendahara RW / RT', desc: 'Generate tagihan IPL, ACC QRIS, top-up & pencairan kas', badge: 'bg-emerald-50 text-emerald-800 border border-emerald-200' },
  { name: 'Ketua RT 01–03', desc: 'ACC warga baru, sensus hunian & persetujuan tingkat RT', badge: 'bg-blue-50 text-blue-800 border border-blue-200' },
  { name: 'Satpam Gerbang', desc: 'Monitoring pos gerbang, palang servo, ronda & sirine', badge: 'bg-blue-950 text-white' },
  { name: 'Warga (KK Utama)', desc: 'Bayar IPL, ajukan surat, pantau kas, aduan & tombol panik', badge: 'bg-teal-50 text-teal-800 border border-teal-200' },
];

const wargaAccounts = [
  { name: 'Budi Santoso', email: 'budi@smartwarga.test', unit: 'RT 01 Blok A No. 01' },
  { name: 'Joko Widodo', email: 'joko@smartwarga.test', unit: 'RT 01 Blok A No. 03' },
  { name: 'Achmad Vickry Firdaus', email: 'achmad.vickry@smartwarga.test', unit: 'RT 01 Blok A No. 04' },
  { name: 'Cikal Prayoga', email: 'cikal.prayoga@smartwarga.test', unit: 'RT 01 Blok A No. 05' },
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
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* 1. Top Announcement Strip */}
      <div className="bg-emerald-800 text-emerald-50 text-[11px] sm:text-xs font-semibold py-2 px-4 text-center">
        ✨ Selamat datang di Portal Digital <strong>SMART-WARGA RW 05</strong> &mdash; Layanan Warga Praktis, Transparan &amp; Terintegrasi IoT ESP32
      </div>

      {/* 2. Sticky Portal Navbar (Tombol Login & Daftar selalu terlihat di HP maupun Desktop) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-emerald-500/30 bg-emerald-950 shadow-sm shrink-0">
              <img src="/icon-192.png" alt="SMART-WARGA" className="w-full h-full object-cover" />
            </div>
            <div className="truncate">
              <div className="font-black text-base sm:text-lg text-slate-900 tracking-tight leading-tight">
                SMART<span className="text-emerald-600">-WARGA</span>
              </div>
              <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 leading-none">
                Digital RW 05 &amp; IoT Platform
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
            <a href="#fitur" className="hover:text-emerald-700 transition">
              Fitur Unggulan
            </a>
            <a href="#iot" className="hover:text-emerald-700 transition">
              Integrasi IoT ESP32
            </a>
            <a href="#role" className="hover:text-emerald-700 transition">
              Akses 8 Role
            </a>
          </nav>

          {/* Top Action Buttons (Selalu terlihat di HP tanpa scroll) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="px-3 sm:px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
              <span>Masuk</span>
            </button>
            <button
              type="button"
              onClick={() => openAuthModal('register')}
              className="px-3 sm:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Daftar Warga</span>
              <span className="sm:hidden">Daftar</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. Hero Section (Luas, Font Proporsional, Nyaman Dibaca di Desktop & HP) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-950 via-slate-950 to-slate-950 py-14 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
        {/* Ambient Background Glows & Grid */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[680px] h-[360px] bg-emerald-500/20 rounded-full blur-[130px]" />
          <div className="absolute bottom-0 right-0 w-[420px] h-[320px] bg-cyan-500/10 rounded-full blur-[120px]" />
          <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-900/50 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-bold mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Portal Komunitas RW 05 Cerdas &amp; Terintegrasi IoT ESP32</span>
          </div>

          {/* Grand Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
            Kelola Lingkungan RW 05
            <span className="block mt-1 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Lebih Aman, Cerdas &amp; Transparan
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto mt-5 leading-relaxed">
            Selamat datang di Portal Digital <strong className="text-white">SMART-WARGA RW 05</strong>. Bersama mewujudkan tata kelola lingkungan modern melalui layanan surat digital, transparansi iuran IPL, pengaduan cepat, dan keamanan gerbang RFID otomatis.
          </p>

          {/* Main CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-8">
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition active:scale-95"
            >
              <LogIn className="w-5 h-5" />
              <span>Masuk / Pilih Akun Sistem</span>
            </button>
            <a
              href="#fitur"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition"
            >
              <Search className="w-4 h-4 text-emerald-400" />
              <span>Jelajahi Fitur &amp; IoT</span>
            </a>
          </div>

          {/* 4 Main Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 max-w-4xl mx-auto mt-12 sm:mt-14">
            <div className="bg-slate-900/75 border border-slate-800 backdrop-blur-md rounded-2xl p-5 text-center shadow-sm">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">37 KK</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-300 mt-1">Kepala Keluarga Aktif</div>
            </div>
            <div className="bg-slate-900/75 border border-slate-800 backdrop-blur-md rounded-2xl p-5 text-center shadow-sm">
              <div className="text-2xl sm:text-3xl font-black text-cyan-400">300</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-300 mt-1">Kapasitas Unit Hunian</div>
            </div>
            <div className="bg-slate-900/75 border border-slate-800 backdrop-blur-md rounded-2xl p-5 text-center shadow-sm">
              <div className="text-2xl sm:text-3xl font-black text-violet-400">3 RT</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-300 mt-1">Wilayah RT 01, 02 &amp; 03</div>
            </div>
            <div className="bg-slate-900/75 border border-slate-800 backdrop-blur-md rounded-2xl p-5 text-center shadow-sm">
              <div className="text-2xl sm:text-3xl font-black text-amber-400">2 Area</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-300 mt-1">IoT Gerbang &amp; Kios Siaga</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Section Fitur Unggulan (Light Background, Font Nyaman) */}
      <section id="fitur" className="bg-slate-50 text-slate-900 py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-block text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full mb-3">
              Ekosistem Aplikasi
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              Fitur Unggulan SMART-WARGA
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2.5">
              Seluruh kebutuhan administrasi, keuangan, pelayanan warga, hingga kontrol keamanan fisik lingkungan terintegrasi dalam satu platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {platformFeatures.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.iconColor} shadow-sm`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${item.tagColor}`}>
                        {item.tag}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Section Keunggulan Khas: Arsitektur IoT ESP32 Dual-Area */}
      <section id="iot" className="bg-slate-900 text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-cyan-300 bg-cyan-950 border border-cyan-500/30 px-3 py-1 rounded-full mb-3">
              <Cpu className="w-3.5 h-3.5" />
              Keunggulan Hardware Terintegrasi
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Arsitektur IoT ESP32 Dual-Area Otomatis
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mt-2.5">
              Satu modul mikrokontroler ESP32 mengendalikan dua pos fisik sekaligus &mdash; cukup koneksikan Wi-Fi dari PC Pos Satpam atau Meja Kios, kedua area langsung siaga bersamaan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-950/80 border border-indigo-500/30 rounded-2xl p-6 space-y-3">
              <div className="inline-block text-xs font-black uppercase tracking-wider text-indigo-300 bg-indigo-500/15 px-3 py-1 rounded-lg border border-indigo-400/30">
                Area 1 &bull; Pos Satpam Gerbang Utama
              </div>
              <h3 className="text-lg font-extrabold text-white">Palang Pintu Otomatis &amp; Ronda Malam</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Dilengkapi <strong>RFID Reader 1 (Pin 5)</strong> untuk tap e-KTP warga membuka <strong>Palang Servo (Pin 13)</strong>, absensi ronda satpam, serta <strong>Sirine Buzzer (Pin 14)</strong> yang aktif saat Tombol Panik ditekan.
              </p>
            </div>

            <div className="bg-slate-950/80 border border-emerald-500/30 rounded-2xl p-6 space-y-3">
              <div className="inline-block text-xs font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/15 px-3 py-1 rounded-lg border border-emerald-400/30">
                Area 2 &bull; Meja Kios Pelayanan Terpadu
              </div>
              <h3 className="text-lg font-extrabold text-white">Antrean Kios, Pairing e-KTP &amp; Bank Sampah</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Menggunakan <strong>RFID Reader 2 (Pin 4)</strong> dan layar <strong>LCD 16x2 I2C</strong>. Kartu warga terdaftar otomatis mendapat nomor antrean pelayanan &amp; legalisasi berkas, sedangkan kartu asing otomatis ditolak.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Section Akses Role & CTA Penutup */}
      <section id="role" className="bg-white text-slate-900 py-14 sm:py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Akses Terpadu Berbasis Peran (RBAC)</h2>
              <p className="text-sm text-slate-600 mt-1">
                Setiap warga (KK Utama) hingga struktur pengurus RT/RW dan Satpam memiliki hak akses yang terukur.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold flex items-center justify-center gap-2 shadow-md transition active:scale-95 shrink-0"
            >
              <span>Buka Dialog Masuk</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {roleSummaries.map((role, i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                <span className={`inline-block text-xs font-extrabold px-2.5 py-1 rounded-lg mb-2 ${role.badge}`}>
                  {role.name}
                </span>
                <p className="text-xs sm:text-sm text-slate-600 leading-snug">{role.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-6 px-4 text-center text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-bold text-slate-200">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>SMART-WARGA RW 05</span>
          </div>
          <div>Sistem Terpadu Manajemen Lingkungan Warga &amp; IoT ESP32 Dual-Area</div>
        </div>
      </footer>

      {/* 7. DIALOG MODAL LOGIN & DAFTAR (Dibuka dari tombol atas / Hero — nyaman di HP & Desktop) */}
      {showAuthModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
          onClick={() => setShowAuthModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Portal Masuk SMART-WARGA"
        >
          <div
            className="bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[92vh] overflow-y-auto p-5 sm:p-7 relative space-y-5"
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
              <div className="w-11 h-11 rounded-2xl overflow-hidden border border-emerald-500/30 bg-emerald-950 shadow-sm shrink-0">
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
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`py-2 text-xs sm:text-sm font-bold rounded-xl transition ${
                  !isRegister ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
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
                className={`py-2 text-xs sm:text-sm font-bold rounded-xl transition ${
                  isRegister ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
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
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">Email Terdaftar:</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full text-sm font-bold text-slate-900 bg-white pl-10 pr-3.5 py-2.5 rounded-xl border-2 border-slate-300 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition shadow-xs"
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
                      className="w-full text-sm font-bold text-slate-900 bg-white pl-10 pr-3.5 py-2.5 rounded-xl border-2 border-slate-300 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition shadow-xs"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-black shadow-lg shadow-emerald-600/25 active:scale-95 transition disabled:opacity-50"
                >
                  {loading ? 'MEMERIKSA...' : 'MASUK KE SISTEM'}
                </button>

                {/* Quick Demo Credentials & Dropdown Warga */}
                <div className="pt-4 border-t border-slate-200 space-y-4">
                  {/* Dropdown Fast Login 37 Warga */}
                  <div className="p-3.5 bg-emerald-50/90 rounded-2xl border border-emerald-200 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-emerald-700" />
                        <span>Pilih Akun Warga (37 KK Terdaftar):</span>
                      </label>
                      <span className="text-[10px] text-emerald-800 font-extrabold bg-emerald-200/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
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
                        className="w-full text-xs sm:text-sm font-bold px-3 py-2.5 rounded-xl border-2 border-emerald-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                      >
                        <option value="">-- Pilih Nama Warga Untuk Masuk Cepat --</option>
                        {wargaAccounts.map((w) => (
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
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
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
                        className="px-3 py-2.5 bg-gradient-to-r from-slate-900 to-blue-950 text-white text-xs font-bold rounded-xl border border-blue-500/40 hover:from-slate-800 hover:to-blue-900 flex items-center gap-2 text-left transition active:scale-95 shadow-sm"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0 animate-ping" />
                        <div className="truncate">
                          <div>Pak Bambang (Satpam)</div>
                          <div className="text-[10px] font-normal text-blue-200">Pos Gerbang (Palang &amp; IoT)</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 leading-relaxed">
                    🔒 <strong>Ketentuan Akses Warga:</strong> Akses login sistem dikhususkan bagi <strong>KK Utama</strong> (Penanggung Jawab Rumah). <strong>KK Tambahan tidak memiliki akses login</strong> karena penanggung jawab iuran dan administrasi rumah adalah KK Utama.
                  </div>
                </div>
              </form>
            ) : (
              /* 2. REGISTER FORM */
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Nama Lengkap Sesuai KTP:</label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full text-sm font-bold text-slate-900 bg-white px-3.5 py-2.5 rounded-xl border-2 border-slate-300 focus:border-emerald-600 focus:outline-none"
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
                      className="w-full text-xs sm:text-sm font-mono font-bold text-slate-900 bg-white px-3 py-2.5 rounded-xl border-2 border-slate-300 focus:border-emerald-600 focus:outline-none"
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
                      className="w-full text-xs sm:text-sm font-mono font-bold text-slate-900 bg-white px-3 py-2.5 rounded-xl border-2 border-slate-300 focus:border-emerald-600 focus:outline-none"
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
                      className="w-full text-xs sm:text-sm font-bold text-slate-900 bg-white px-3 py-2.5 rounded-xl border-2 border-slate-300 focus:border-emerald-600 focus:outline-none"
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
                      className="w-full text-xs sm:text-sm font-bold text-slate-900 bg-white px-3 py-2.5 rounded-xl border-2 border-slate-300 focus:border-emerald-600 focus:outline-none"
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
                    className="w-full text-sm font-bold text-slate-900 bg-white px-3.5 py-2.5 rounded-xl border-2 border-slate-300 focus:border-emerald-600 focus:outline-none"
                    placeholder="Minimal 6 karakter"
                    required
                  />
                </div>

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
                      className="w-full text-xs font-bold px-2.5 py-2 rounded-xl border-2 border-emerald-300 bg-emerald-50 text-emerald-950"
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
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      <span>UID Kartu RFID / e-KTP Fisik:</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsScanningRfid(!isScanningRfid)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition flex items-center gap-1 shadow-xs ${
                        isScanningRfid
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      <Radio className={`w-3.5 h-3.5 ${isScanningRfid ? 'animate-spin' : ''}`} />
                      <span>{isScanningRfid ? 'Batalkan Scan' : 'Pindai dari ESP32'}</span>
                    </button>
                  </div>

                  {isScanningRfid && (
                    <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-center gap-2 animate-pulse">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping shrink-0" />
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
                    className="w-full text-sm font-mono font-bold text-slate-900 px-3 py-2 rounded-xl border-2 border-slate-300 bg-white uppercase focus:border-emerald-600 focus:outline-none"
                    placeholder="Contoh: A1B2C3D4 (atau klik Pindai dari ESP32)"
                  />
                  <span className="text-[11px] text-slate-500 block leading-snug">
                    Kartu otomatis terhubung untuk buka palang gerbang otomatis, antrean Kios Pelayanan, dan setor Bank Sampah.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-black shadow-lg shadow-emerald-600/25 active:scale-95 transition disabled:opacity-50"
                >
                  {loading ? 'MENDAFTAR...' : 'DAFTAR MENUNGGU ACC RT'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
