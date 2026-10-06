'use client';

import React from 'react';
import { 
  Building2, 
  Home, 
  CreditCard, 
  FileText, 
  MessageSquareWarning, 
  Cpu, 
  ShieldCheck, 
  ShieldAlert, 
  LogOut, 
  PlusCircle, 
  Wallet,
  MapPin,
  Clock,
  Calendar,
  FileCheck2,
  Users,
  Award,
  Package,
  Landmark,
  HeartPulse,
  HeartHandshake
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pengurusSubTab?: string;
  onNavigateTab?: (tab: string, subTab?: string) => void;
  onOpenPanic: () => void;
  onOpenTopup: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  pengurusSubTab,
  onNavigateTab,
  onOpenPanic,
  onOpenTopup,
}: SidebarProps) {
  const { user, logout, isPengurus, isApproved } = useAuth();

  const handleNav = (tabId: string, subTab?: string) => {
    if (onNavigateTab) {
      onNavigateTab(tabId, subTab);
    } else {
      setActiveTab(tabId);
    }
  };

  const isNavActive = (tabId: string, subTab?: string) => {
    if (tabId === 'pengurus') {
      if (activeTab !== 'pengurus') return false;
      if (subTab && pengurusSubTab) {
        return pengurusSubTab === subTab;
      }
      return true;
    }
    return activeTab === tabId;
  };

  // 1. Navigation items for Warga (KK Utama)
  const residentNavItems = [
    { id: 'dashboard', label: 'Beranda Warga', icon: Home, desc: 'Ringkasan & Agenda Lingkungan' },
    { id: 'ipl', label: 'Iuran IPL Saya', icon: CreditCard, desc: 'Kalender 12 Bulan & QRIS Mandiri' },
    { id: 'layanan', label: 'Layanan Warga', icon: FileText, desc: 'Surat, UMKM, Aset & Koperasi' },
    { id: 'pengaduan', label: 'Pusat Pengaduan', icon: MessageSquareWarning, desc: 'Aspirasi & Lapor Fasilitas' },
    { id: 'iot', label: 'Monitoring IoT Live', icon: Cpu, desc: 'Sirine, Ronda & Bank Sampah', isLive: true },
  ];

  // 2. Navigation items for Bendahara (Facilitator - Financial & Cash Authority)
  const bendaharaNavItems = [
    { 
      id: 'pengurus', 
      subTab: 'ipl', 
      label: 'Verifikasi Iuran & Kas RT', 
      icon: CreditCard, 
      desc: 'ACC Setoran QRIS & Kas RT/RW' 
    },
    { 
      id: 'pengurus', 
      subTab: 'kegiatan', 
      label: 'Pencairan Kas Kegiatan', 
      icon: Calendar, 
      desc: 'Realisasi Anggaran dari Sekretaris' 
    },
    { 
      id: 'pengurus', 
      subTab: 'topup', 
      label: 'Verifikasi Top-Up Warga', 
      icon: Wallet, 
      desc: 'ACC Permintaan Saldo Dompet Warga' 
    },
    { 
      id: 'pengurus', 
      subTab: 'koperasi', 
      label: 'Koperasi & Pinjaman Mikro', 
      icon: Landmark, 
      desc: 'ACC & Pencairan Modal Usaha Warga' 
    },
    { 
      id: 'pengurus', 
      subTab: 'rukam', 
      label: 'Santunan RUKAM & Duka', 
      icon: HeartHandshake, 
      desc: 'Pencairan Kas Duka Rp 1.5jt' 
    },
    { 
      id: 'pengurus', 
      subTab: 'sensus', 
      label: 'Sensus 300 Hunian', 
      icon: Building2, 
      desc: 'Data 100 Unit Rumah & KK per RT' 
    },
    { 
      id: 'iot', 
      label: 'Monitoring Wilayah & IoT', 
      icon: Cpu, 
      desc: 'Sirine Panic & Keamanan Wilayah', 
      isLive: true 
    },
  ];

  // 3. Navigation items for Sekretaris (Facilitator - Administration & Events)
  const sekretarisNavItems = [
    { 
      id: 'pengurus', 
      subTab: 'kegiatan', 
      label: 'Agenda Kegiatan & Anggaran', 
      icon: Calendar, 
      desc: 'Buat Agenda & Ajukan Dana Kas' 
    },
    { 
      id: 'pengurus', 
      subTab: 'surat', 
      label: 'Validasi Surat Pengantar', 
      icon: FileCheck2, 
      desc: 'Beri Nomor & ACC Surat Warga' 
    },
    { 
      id: 'pengurus', 
      subTab: 'aset', 
      label: 'Peminjaman Aset Fasum', 
      icon: Package, 
      desc: 'Kelola Tenda, Sound & Kursi' 
    },
    { 
      id: 'pengurus', 
      subTab: 'posyandu', 
      label: 'Posyandu Digital Terpadu', 
      icon: HeartPulse, 
      desc: 'KMS Balita, Imunisasi & Lansia' 
    },
    { 
      id: 'pengurus', 
      subTab: 'rukam', 
      label: 'RUKAM & Ambulans Siaga', 
      icon: HeartHandshake, 
      desc: 'Pelaporan Duka & Armada Darurat' 
    },
    { 
      id: 'pengaduan', 
      label: 'Pusat Pengaduan Warga', 
      icon: MessageSquareWarning, 
      desc: 'Keluhan & Aspirasi Lingkungan' 
    },
    { 
      id: 'pengurus', 
      subTab: 'sensus', 
      label: 'Sensus 300 Hunian', 
      icon: Building2, 
      desc: 'Data Kependudukan RT/RW' 
    },
    { 
      id: 'iot', 
      label: 'Monitoring Wilayah & IoT', 
      icon: Cpu, 
      desc: 'Sirine Panic & Keamanan Wilayah', 
      isLive: true 
    },
  ];

  // 4. Navigation items for Ketua RT / Ketua RW / Super Admin (Leaders & Overseers)
  const isRtLeader = user?.role === 'rt';
  const isRwLeader = user?.role === 'rw' || user?.role === 'super_admin';

  const leaderNavItems = [
    { 
      id: 'pengurus', 
      subTab: 'sensus', 
      label: isRtLeader ? `Sensus 100 Hunian RT ${user?.rt_number || '01'}` : 'Sensus 300 Hunian (RT 01-03)', 
      icon: Building2, 
      desc: isRtLeader ? `Data 100 Rumah di RT ${user?.rt_number || '01'}` : 'Supervisi 300 Rumah di RW 05' 
    },
    { 
      id: 'pengurus', 
      subTab: 'approval', 
      label: isRtLeader ? `ACC Warga Baru RT ${user?.rt_number || '01'}` : 'Persetujuan Warga Baru', 
      icon: Users, 
      desc: 'Validasi & ACC Pendaftaran KK' 
    },
    { 
      id: 'pengurus', 
      subTab: 'ipl', 
      label: isRtLeader ? `Verifikasi Iuran & Kas RT ${user?.rt_number || '01'}` : 'Rekapitulasi Kas & Setoran RW', 
      icon: CreditCard, 
      desc: isRtLeader ? `ACC Pembayaran Warga & Kas RT` : 'Porsi 40% Kas RW & Rekap RT 01-03' 
    },
    { 
      id: 'pengurus', 
      subTab: 'kegiatan', 
      label: 'Agenda Kegiatan & Anggaran', 
      icon: Calendar, 
      desc: 'Monitoring Kegiatan & Anggaran' 
    },
    { 
      id: 'pengurus', 
      subTab: 'surat', 
      label: isRtLeader ? `Validasi Surat RT ${user?.rt_number || '01'}` : 'Pengesahan Surat RW 05', 
      icon: FileCheck2, 
      desc: isRtLeader ? 'ACC Pengantar RT' : 'Tanda Tangan Digital RW' 
    },
    { 
      id: 'pengurus', 
      subTab: 'aset', 
      label: 'Peminjaman Aset Fasum', 
      icon: Package, 
      desc: 'Kelola Tenda, Sound & Kursi' 
    },
    { 
      id: 'pengurus', 
      subTab: 'koperasi', 
      label: 'Koperasi & Pinjaman Mikro', 
      icon: Landmark, 
      desc: 'Supervisi Pinjaman & UMKM Warga' 
    },
    { 
      id: 'pengurus', 
      subTab: 'posyandu', 
      label: 'Posyandu & Kesehatan Warga', 
      icon: HeartPulse, 
      desc: 'Monitoring Gizi Balita & Lansia' 
    },
    { 
      id: 'pengurus', 
      subTab: 'rukam', 
      label: 'RUKAM & Ambulans Siaga', 
      icon: HeartHandshake, 
      desc: 'Santunan Kas RT & Armada Siaga' 
    },
    { 
      id: 'pengaduan', 
      label: 'Tindak Lanjut Pengaduan', 
      icon: MessageSquareWarning, 
      desc: 'Respon & Solusi Keluhan Warga' 
    },
    { 
      id: 'iot', 
      label: 'Monitoring Wilayah & IoT', 
      icon: Cpu, 
      desc: 'Sirine Panic & Keamanan Wilayah', 
      isLive: true 
    },
  ];

  // Determine current active navigation list and section title based on role
  const isBendahara = user?.role === 'bendahara';
  const isSekretaris = user?.role === 'sekretaris';
  const isLeader = user?.role === 'rt' || user?.role === 'rw' || user?.role === 'super_admin';

  const navItems = isBendahara 
    ? bendaharaNavItems 
    : isSekretaris 
    ? sekretarisNavItems 
    : isLeader 
    ? leaderNavItems 
    : residentNavItems;

  const sectionTitle = isBendahara
    ? 'TATA KELOLA BENDAHARA (FASILITATOR)'
    : isSekretaris
    ? 'ADMINISTRASI & AGENDA (SEKRETARIS)'
    : isLeader
    ? 'SUPERVISI & TATA KELOLA WILAYAH'
    : 'MENU UTAMA WARGA (KK UTAMA)';

  return (
    <aside className="w-72 bg-white border-r border-slate-200/90 h-[calc(100vh-4rem)] sticky top-16 flex flex-col justify-between p-4 shrink-0 shadow-sm z-30 overflow-y-auto">
      <div className="space-y-6">
        {/* Status Profile Card: Distinct for Pengurus vs Resident */}
        {user && (
          <div className={`p-4 rounded-2xl shadow-md space-y-2.5 text-white ${
            isBendahara
              ? 'bg-gradient-to-tr from-slate-900 via-amber-950 to-slate-900 border border-amber-500/30'
              : isSekretaris
              ? 'bg-gradient-to-tr from-slate-900 via-cyan-950 to-slate-900 border border-cyan-500/30'
              : isLeader
              ? 'bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30'
              : 'bg-gradient-to-tr from-slate-900 via-slate-800 to-emerald-950'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1 truncate max-w-[150px]">
                <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">
                  {user.house?.full_address || (user.rt_number ? `RT ${user.rt_number} / RW 05` : 'Lingkungan RW 05')}
                </span>
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                isBendahara
                  ? 'bg-amber-400 text-slate-950'
                  : isSekretaris
                  ? 'bg-cyan-400 text-slate-950'
                  : isLeader
                  ? 'bg-indigo-300 text-slate-950'
                  : isApproved
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {isBendahara
                  ? 'Bendahara'
                  : isSekretaris
                  ? 'Sekretaris'
                  : user.role === 'rw'
                  ? 'Ketua RW'
                  : user.role === 'rt'
                  ? `Ketua RT ${user.rt_number}`
                  : isApproved ? 'KK Utama' : 'Pending'}
              </span>
            </div>

            <div>
              <div className="text-sm font-extrabold truncate text-white">{user.name}</div>
              <div className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
                {isPengurus ? (
                  <>
                    <Award className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>Pejabat Struktural Wilayah</span>
                  </>
                ) : (
                  <span>KK Utama Penanggung Jawab Unit</span>
                )}
              </div>
            </div>

            {/* Bottom Section: Pengurus facilitator details vs Resident Wallet */}
            {isPengurus ? (
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
                <div>
                  <div className="text-slate-400 font-medium">Peran Struktural:</div>
                  <div className="font-bold text-amber-300">
                    {isBendahara
                      ? 'Verifikasi Kas & Iuran RT'
                      : isSekretaris
                      ? 'Tata Usaha & Persuratan'
                      : 'Otoritas & Supervisi Wilayah'}
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-white/10 text-slate-300 rounded text-[9px] font-semibold border border-white/15">
                  Fasilitator
                </span>
              </div>
            ) : (
              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400">Saldo Dompet Warga:</div>
                  <div className="text-sm font-black text-emerald-400">
                    Rp {Number(user.wallet?.balance || 0).toLocaleString('id-ID')}
                  </div>
                </div>
                <button
                  onClick={onOpenTopup}
                  disabled={!isApproved}
                  className="p-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition shadow-sm"
                  title="Top-Up Saldo"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Topup</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Role-Specific Navigation Menu */}
        <div>
          <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-3 mb-2 flex items-center justify-between">
            <span>{sectionTitle}</span>
            {isPengurus && <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />}
          </div>
          <nav className="space-y-1">
            {navItems.map((item: any) => {
              const Icon = item.icon;
              const isActive = isNavActive(item.id, item.subTab);
              return (
                <button
                  key={`${item.id}-${item.subTab || 'main'}`}
                  onClick={() => handleNav(item.id, item.subTab)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition group ${
                    isActive
                      ? isBendahara
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20 font-bold'
                        : isSekretaris
                        ? 'bg-cyan-700 text-white shadow-md shadow-cyan-700/20 font-bold'
                        : isLeader
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-bold'
                        : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg transition ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-emerald-600'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs flex items-center justify-between">
                      <span className="truncate">{item.label}</span>
                      {item.isLive && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1 shrink-0"></span>
                      )}
                    </div>
                    <div className={`text-[10px] truncate ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                      {item.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Shortcuts: Panic Button & Logout */}
      <div className="pt-4 border-t border-slate-100 space-y-2">
        <button
          onClick={onOpenPanic}
          className="w-full py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs font-black rounded-xl shadow-md shadow-red-500/20 flex items-center justify-center gap-2 active:scale-95 transition"
        >
          <ShieldAlert className="w-4 h-4 animate-bounce" />
          <span>TOMBOL PANIK DARURAT</span>
        </button>

        <button
          onClick={logout}
          className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition flex items-center justify-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar Akun</span>
        </button>
      </div>
    </aside>
  );
}
