'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { fetchApi } from '@/lib/api';
import { 
  Wallet, 
  PlusCircle, 
  FileText, 
  CreditCard, 
  MessageSquareWarning, 
  ShieldAlert, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  MapPin, 
  Volume2, 
  VolumeX, 
  DoorOpen, 
  Recycle, 
  PhoneCall, 
  Radio, 
  ArrowRight,
  ShieldCheck,
  Building,
  Building2,
  Home,
  UserCheck,
  Users,
  Edit3,
  Trash2,
  UserPlus,
  IdCard,
  Briefcase,
  Heart,
  Info,
  Bell,
  Sparkles,
  Check,
  X,
  Gift,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function DashboardView({
  onNavigateTab,
  onOpenPanic,
  onOpenTopup,
}: {
  onNavigateTab: (tab: string) => void;
  onOpenPanic: () => void;
  onOpenTopup: () => void;
}) {
  const { user, isApproved, refreshUser } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [billings, setBillings] = useState<any[]>([]);
  const [iplSummary, setIplSummary] = useState<any>(null);
  const [sirenStatus, setSirenStatus] = useState<any>(null);
  const [wasteRates, setWasteRates] = useState<any[]>([]);
  const [lastRonda, setLastRonda] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // RSVP & Gotong Royong Modal State
  const [selectedEventRsvp, setSelectedEventRsvp] = useState<any | null>(null);
  const [rsvpStatus, setRsvpStatus] = useState<'hadir' | 'tidak_hadir'>('hadir');
  const [rsvpReason, setRsvpReason] = useState<string>('');
  const [rsvpContribution, setRsvpContribution] = useState<string>('');
  const [rsvpLoading, setRsvpLoading] = useState<boolean>(false);
  const [rsvpSuccessMsg, setRsvpSuccessMsg] = useState<string>('');

  // Donation Modal State (Swadaya Defisit Acara)
  const [selectedEventDonate, setSelectedEventDonate] = useState<any | null>(null);
  const [donationAmount, setDonationAmount] = useState<string>('50000');
  const [donationLoading, setDonationLoading] = useState<boolean>(false);
  const [donationSuccessMsg, setDonationSuccessMsg] = useState<string>('');

  // Daftar Anggota Keluarga Serumah
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [familyLoading, setFamilyLoading] = useState(false);
  const [isKkUtamaOpen, setIsKkUtamaOpen] = useState(true);
  const [isKkPendukungOpen, setIsKkPendukungOpen] = useState(true);

  // Modal Edit Biodata Pribadi (KK Utama)
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileForm, setProfileForm] = useState({
    name: '',
    nik: '',
    no_kk: '',
    birth_place: '',
    birth_date: '',
    gender: 'Laki-laki',
    religion: 'Islam',
    occupation: '',
    marital_status: 'Kawin',
    blood_type: 'O',
    phone: '',
  });

  // Modal Tambah / Edit Anggota Keluarga
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [familyMemberLoading, setFamilyMemberLoading] = useState(false);
  const [familyMemberError, setFamilyMemberError] = useState('');
  const [familyMemberSuccess, setFamilyMemberSuccess] = useState('');
  const [familyForm, setFamilyForm] = useState({
    name: '',
    relationship: 'Istri',
    nik: '',
    no_kk: '',
    birth_place: '',
    birth_date: '',
    gender: 'Perempuan',
    religion: 'Islam',
    occupation: 'Ibu Rumah Tangga',
    marital_status: 'Kawin',
    blood_type: 'O',
    phone: '',
    kk_type: 'anggota',
  });

  // Modal Tambah KK Tambahan Legacy (Opsional)
  const [showAddKkModal, setShowAddKkModal] = useState(false);
  const [newKkName, setNewKkName] = useState('');
  const [newKkNik, setNewKkNik] = useState('');
  const [newKkNoKk, setNewKkNoKk] = useState('');
  const [newKkRelation, setNewKkRelation] = useState('Anak Sudah Menikah Serumah');
  const [newKkPhone, setNewKkPhone] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  const loadFamilyMembers = async () => {
    if (!isApproved) return;
    setFamilyLoading(true);
    try {
      const res = await fetchApi('/warga/family-members');
      if (res.success && res.data) {
        setFamilyMembers(res.data);
      }
    } catch {
      // ignore
    } finally {
      setFamilyLoading(false);
    }
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [annRes, billRes, devRes, wasteRes, rondaRes] = await Promise.all([
          isApproved ? fetchApi('/announcements').catch(() => ({ success: false, data: { data: [] } })) : { success: false, data: { data: [] } },
          isApproved ? fetchApi('/ipl/billings?status=unpaid').catch(() => ({ success: false, data: { data: [] } })) : { success: false, data: { data: [] } },
          fetchApi('/iot/devices').catch(() => ({ success: false })),
          fetchApi('/waste-rates').catch(() => ({ success: false })),
          fetchApi('/iot/ronda/logs').catch(() => ({ success: false })),
        ]);

        if (annRes.success) setAnnouncements(annRes.data?.data || []);
        if (billRes.success) {
          setBillings(billRes.data?.data || []);
          setIplSummary(billRes.summary || null);
        }
        if (devRes.success) setSirenStatus(devRes.data?.siren_status || null);
        if (wasteRes.success) setWasteRates(wasteRes.data || []);
        if (rondaRes.success && rondaRes.data?.data?.length > 0) setLastRonda(rondaRes.data.data[0]);

        if (isApproved) {
          await loadFamilyMembers();
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [isApproved]);

  const openProfileModal = () => {
    if (!user) return;
    setProfileForm({
      name: user.name || '',
      nik: user.nik || '',
      no_kk: user.no_kk || user.house?.head_of_family?.no_kk || '',
      birth_place: (user as any).birth_place || '',
      birth_date: (user as any).birth_date ? String((user as any).birth_date).substring(0, 10) : '',
      gender: (user as any).gender || 'Laki-laki',
      religion: (user as any).religion || 'Islam',
      occupation: (user as any).occupation || '',
      marital_status: (user as any).marital_status || 'Kawin',
      blood_type: (user as any).blood_type || 'O',
      phone: user.phone || '',
    });
    setProfileError('');
    setProfileSuccess('');
    setShowProfileModal(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      const res = await fetchApi('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileForm),
      });
      if (res.success) {
        setProfileSuccess('Biodata KK Utama berhasil disimpan!');
        await refreshUser();
        await loadFamilyMembers();
        setTimeout(() => {
          setShowProfileModal(false);
          setProfileSuccess('');
        }, 1200);
      }
    } catch (err: any) {
      setProfileError(err.message || 'Gagal memperbarui biodata.');
    } finally {
      setProfileLoading(false);
    }
  };

  const openAddFamilyModal = (targetKkType: 'kk_utama' | 'kk_pendukung' = 'kk_utama') => {
    setEditingMember(null);
    const targetNoKk = targetKkType === 'kk_pendukung'
      ? (familyMembers.find(m => m.kk_type === 'kk_pendukung' || m.relationship === 'KK Tambahan')?.no_kk || '')
      : (user?.no_kk || user?.house?.head_of_family?.no_kk || '');

    setFamilyForm({
      name: '',
      relationship: targetKkType === 'kk_pendukung' ? 'KK Tambahan' : 'Istri',
      nik: '',
      no_kk: targetNoKk,
      birth_place: '',
      birth_date: '',
      gender: targetKkType === 'kk_pendukung' ? 'Laki-laki' : 'Perempuan',
      religion: (user as any)?.religion || 'Islam',
      occupation: '',
      marital_status: 'Kawin',
      blood_type: 'O',
      phone: '',
      kk_type: targetKkType === 'kk_pendukung' ? 'kk_pendukung' : 'anggota',
    });
    setFamilyMemberError('');
    setFamilyMemberSuccess('');
    setShowFamilyModal(true);
  };

  const openEditFamilyModal = (member: any) => {
    setEditingMember(member);
    setFamilyForm({
      name: member.name || '',
      relationship: member.relationship || (member.kk_type === 'kk_pendukung' ? 'KK Tambahan' : 'Anggota Keluarga'),
      nik: member.nik || '',
      no_kk: member.no_kk || '',
      birth_place: member.birth_place || '',
      birth_date: member.birth_date ? String(member.birth_date).substring(0, 10) : '',
      gender: member.gender || 'Laki-laki',
      religion: member.religion || 'Islam',
      occupation: member.occupation || '',
      marital_status: member.marital_status || 'Kawin',
      blood_type: member.blood_type || 'O',
      phone: member.phone || '',
      kk_type: member.kk_type || 'anggota',
    });
    setFamilyMemberError('');
    setFamilyMemberSuccess('');
    setShowFamilyModal(true);
  };

  const handleSaveFamilyMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setFamilyMemberLoading(true);
    setFamilyMemberError('');
    setFamilyMemberSuccess('');
    try {
      let res;
      if (editingMember) {
        res = await fetchApi(`/warga/family-members/${editingMember.id}`, {
          method: 'PUT',
          body: JSON.stringify(familyForm),
        });
      } else {
        res = await fetchApi('/warga/family-members', {
          method: 'POST',
          body: JSON.stringify(familyForm),
        });
      }

      if (res.success) {
        setFamilyMemberSuccess(res.message);
        await loadFamilyMembers();
        await refreshUser();
        setTimeout(() => {
          setShowFamilyModal(false);
          setFamilyMemberSuccess('');
        }, 1200);
      }
    } catch (err: any) {
      setFamilyMemberError(err.message || 'Gagal menyimpan data anggota keluarga.');
    } finally {
      setFamilyMemberLoading(false);
    }
  };

  const handleDeleteFamilyMember = async (memberId: number, memberName: string) => {
    if (!confirm(`Hapus data anggota keluarga "${memberName}" dari unit rumah ini?`)) {
      return;
    }
    try {
      const res = await fetchApi(`/warga/family-members/${memberId}`, {
        method: 'DELETE',
      });
      if (res.success) {
        await loadFamilyMembers();
        await refreshUser();
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus data.');
    }
  };

  const handleAddKkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');
    setModalSuccess('');
    try {
      const res = await fetchApi('/warga/add-family-kk', {
        method: 'POST',
        body: JSON.stringify({
          name: newKkName,
          no_kk: newKkNoKk,
          nik: newKkNik,
          phone: newKkPhone || null,
          relation: newKkRelation,
        }),
      });

      if (res.success) {
        setModalSuccess(res.message);
        await refreshUser();
        await loadFamilyMembers();
        setTimeout(() => {
          setShowAddKkModal(false);
          setNewKkName('');
          setNewKkNik('');
          setNewKkNoKk('');
          setNewKkPhone('');
          setModalSuccess('');
        }, 1500);
      }
    } catch (err: any) {
      setModalError(err.message || 'Gagal menambahkan KK Tambahan.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenRsvpModal = (event: any) => {
    setSelectedEventRsvp(event);
    setRsvpStatus(event.rsvp_meta?.my_rsvp?.status || 'hadir');
    setRsvpReason(event.rsvp_meta?.my_rsvp?.reason || '');
    setRsvpContribution(event.rsvp_meta?.my_rsvp?.contribution_note || '');
    setRsvpSuccessMsg('');
  };

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventRsvp) return;
    setRsvpLoading(true);
    setRsvpSuccessMsg('');
    try {
      const res = await fetchApi(`/announcements/${selectedEventRsvp.id}/rsvp`, {
        method: 'POST',
        body: JSON.stringify({
          status: rsvpStatus,
          reason: rsvpStatus === 'tidak_hadir' ? rsvpReason : null,
          contribution_note: rsvpContribution,
        }),
      });
      if (res.success) {
        setRsvpSuccessMsg(res.message);
        const annRes = await fetchApi('/announcements');
        if (annRes.success) setAnnouncements(annRes.data?.data || []);
        setTimeout(() => {
          setSelectedEventRsvp(null);
          setRsvpSuccessMsg('');
        }, 1200);
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan konfirmasi kehadiran.');
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleOpenDonateModal = (event: any) => {
    setSelectedEventDonate(event);
    setDonationAmount(event.financial_transparency?.extra_fee_per_family ? String(event.financial_transparency.extra_fee_per_family) : '50000');
    setDonationSuccessMsg('');
  };

  const handleDonateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventDonate) return;
    setDonationLoading(true);
    setDonationSuccessMsg('');
    try {
      const formData = new FormData();
      formData.append('amount', donationAmount);
      const blob = new Blob(['sample_proof'], { type: 'text/plain' });
      formData.append('proof_image', blob, 'bukti_donasi_swadaya.jpg');

      const token = localStorage.getItem('smartwarga_token') || localStorage.getItem('token');
      const res = await fetch(`/api/announcements/${selectedEventDonate.id}/donate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: formData,
      }).then(r => r.json());

      if (res.success) {
        setDonationSuccessMsg(res.message);
        const annRes = await fetchApi('/announcements');
        if (annRes.success) setAnnouncements(annRes.data?.data || []);
        setTimeout(() => {
          setSelectedEventDonate(null);
          setDonationSuccessMsg('');
        }, 1500);
      } else {
        alert(res.message || 'Gagal mengirim donasi.');
      }
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim donasi.');
    } finally {
      setDonationLoading(false);
    }
  };

  const displayAddress = user?.house?.full_address || (user?.rt_number ? `RT ${user.rt_number} / RW 05` : 'Lingkungan RW 05');
  const totalUnpaidAmount = iplSummary?.all_time_unpaid_amount ?? billings.reduce((sum: number, b: any) => sum + (Number(b.amount) || 0), 0);
  const totalUnpaidCount = iplSummary?.all_time_unpaid_count ?? billings.length;

  // Pemisahan Kartu Keluarga (KK Utama vs KK Pendukung)
  const kkUtamaNo = user?.no_kk || user?.house?.head_of_family?.no_kk || '';
  const kkPendukungHead = familyMembers.find(
    (m) => m.kk_type === 'kk_pendukung' || m.relationship === 'KK Tambahan' || (m.no_kk && m.no_kk !== kkUtamaNo)
  );
  const kkPendukungNo = kkPendukungHead?.no_kk || (user?.house?.kk_pendukung?.[0]?.no_kk) || (user?.id === 8 ? '3201012345670002' : '');

  const kkUtamaMembers = familyMembers.filter((m) => {
    if (m.kk_type === 'kk_pendukung' || m.relationship === 'KK Tambahan') return false;
    if (kkPendukungNo && m.no_kk === kkPendukungNo && m.no_kk !== kkUtamaNo) return false;
    return true;
  });

  const kkPendukungMembers = familyMembers.filter((m) => {
    if (m.kk_type === 'kk_pendukung' || m.relationship === 'KK Tambahan') return true;
    if (kkPendukungNo && m.no_kk === kkPendukungNo && m.no_kk !== kkUtamaNo) return true;
    return false;
  });

  return (
    <div className="w-full space-y-6">
      {/* 1. Pending Approval Banner */}
      {!isApproved && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-5 rounded-3xl shadow-lg shadow-orange-500/20 relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-100 mb-1">
                <Clock className="w-4 h-4" />
                <span>Status Akun: Menunggu Persetujuan Pengurus</span>
              </div>
              <h3 className="text-lg font-black leading-snug">
                Pendaftaran Anda Sedang Diverifikasi oleh Pengurus RT {user?.rt_number || 'Setempat'}
              </h3>
              <p className="text-xs text-amber-100 mt-1 max-w-2xl leading-relaxed">
                Data hunian Anda di <strong className="text-white underline">{displayAddress}</strong> sedang dalam antrean verifikasi. Seluruh menu persuratan, tagihan IPL, dan layanan warga akan aktif seketika setelah disetujui.
              </p>
            </div>
            <span className="px-3.5 py-1.5 bg-white/20 backdrop-blur-md rounded-xl text-xs font-bold border border-white/30 whitespace-nowrap">
              Pending Approval
            </span>
          </div>
        </div>
      )}

      {/* 1.5 Alert Hari-H & Pengingat Kegiatan Warga */}
      {announcements.filter((a) => a.reminder_meta?.is_today).map((todayEvent) => (
        <div key={todayEvent.id} className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white p-5 rounded-3xl shadow-xl shadow-red-600/20 relative overflow-hidden border border-red-400">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-amber-200">
                <Bell className="w-4 h-4 animate-bounce text-amber-300" />
                <span>PEMBERITAHUAN HARI-H KEGIATAN: BERLANGSUNG HARI INI!</span>
              </div>
              <h3 className="text-xl font-black tracking-tight">{todayEvent.title}</h3>
              <p className="text-xs text-rose-100 max-w-2xl leading-relaxed">{todayEvent.content}</p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-amber-100 font-semibold">
                <span>🕒 Jam: {new Date(todayEvent.event_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                <span>• 📍 Tingkat: {todayEvent.scope?.toUpperCase()}</span>
                {todayEvent.financial_transparency?.extra_fee_per_family > 0 ? (
                  <span className="font-bold text-white bg-black/25 px-2 py-0.5 rounded">Iuran Insidental: Rp {Number(todayEvent.financial_transparency.extra_fee_per_family).toLocaleString('id-ID')}</span>
                ) : (
                  <span className="font-bold text-emerald-200 bg-black/25 px-2 py-0.5 rounded">Biaya 100% Ditutup Kas (Warga Rp 0)</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
              <button
                onClick={() => handleOpenRsvpModal(todayEvent)}
                className="px-4 py-2.5 bg-white text-rose-700 hover:bg-rose-50 rounded-2xl text-xs font-black shadow-md flex items-center gap-1.5 active:scale-95 transition"
              >
                <Check className="w-4 h-4" />
                <span>{todayEvent.rsvp_meta?.my_rsvp ? 'Ubah Konfirmasi RSVP' : 'Konfirmasi Kehadiran / Izin'}</span>
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* 2. Top Widescreen Stats Grid (4 Fluid Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Saldo Dompet */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-emerald-500/50 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dompet Warga</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              Rp {Number(user?.wallet?.balance || 0).toLocaleString('id-ID')}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Auto-Kredit Bank Sampah
              </span>
              <button
                onClick={onOpenTopup}
                disabled={!isApproved}
                className="text-xs font-extrabold text-emerald-700 hover:text-emerald-800 disabled:opacity-40"
              >
                + Top-Up
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Status Tagihan IPL Akumulatif */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-500/50 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {totalUnpaidCount > 1 ? 'Total Tagihan IPL' : 'Iuran IPL Warga'}
            </span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              totalUnpaidCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              {totalUnpaidCount > 0 ? (
                <>
                  <span className="text-amber-600">Rp {Number(totalUnpaidAmount).toLocaleString('id-ID')}</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                    {totalUnpaidCount === 1 ? 'Belum Lunas' : `${totalUnpaidCount} Bulan Belum Lunas`}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-emerald-700">Lunas / Bebas Tagihan</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </>
              )}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-400 truncate max-w-[180px]">
                {totalUnpaidCount > 1 
                  ? `Akumulasi ${totalUnpaidCount} bulan terbit` 
                  : totalUnpaidCount === 1 && billings[0]?.master
                  ? `Periode ${billings[0].master.period_month}/${billings[0].master.period_year}`
                  : 'Kas RT 01-03 & Rutin RW'}
              </span>
              <button
                onClick={() => onNavigateTab('ipl')}
                className="text-xs font-extrabold text-blue-600 hover:text-blue-700 whitespace-nowrap"
              >
                Lihat Tagihan
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: Identitas Hunian & Status KK */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-500/50 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unit Rumah & Kartu Keluarga</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Home className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-900 text-white">
                {user?.house?.house_code || (user?.house ? `RT${user.house.rt_number}-${user.house.block}${user.house.number}` : 'RW 05')}
              </span>
              <span className="text-xs font-bold text-slate-800 truncate">
                {user?.house?.full_address || displayAddress}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold">
                {user?.is_head_of_house || user?.kk_type === 'kk_utama' ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" /> KK Utama (PJ Rumah)
                  </span>
                ) : user?.kk_type === 'kk_pendukung' ? (
                  <span className="text-teal-700 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> KK Pendukung / Tambahan
                  </span>
                ) : (
                  <span className="text-slate-600">Anggota Keluarga</span>
                )}
              </span>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                {user?.role?.toUpperCase()}
              </span>
            </div>

            {(user?.is_head_of_house || user?.kk_type === 'kk_utama') && (
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-medium">KK Tambahan Serumah:</span>
                <button
                  type="button"
                  onClick={() => setShowAddKkModal(true)}
                  className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Tambah KK</span>
                </button>
              </div>
            )}

            {user?.house?.kk_pendukung && user.house.kk_pendukung.length > 0 && (
              <div className="mt-2 text-[10px] text-teal-800 bg-teal-50 border border-teal-100 p-1.5 rounded-xl font-medium">
                KK Tambahan: {user.house.kk_pendukung.map((k: any) => k.name).join(', ')}
              </div>
            )}
          </div>
        </div>

        {/* Card 4: Status Keamanan IoT */}
        <div className={`rounded-3xl p-5 border transition flex flex-col justify-between shadow-sm ${
          sirenStatus?.is_active 
            ? 'bg-red-50 border-red-300 text-red-950 animate-pulse'
            : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Keamanan IoT Wilayah</span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              sirenStatus?.is_active ? 'bg-red-500 text-white animate-bounce' : 'bg-emerald-100 text-emerald-700'
            }`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${sirenStatus?.is_active ? 'bg-red-600 animate-ping' : 'bg-emerald-500'}`}></span>
              <span className="text-base font-black tracking-tight">
                {sirenStatus?.is_active ? 'ALARM SIRINE AKTIF!' : 'Kondisi Aman Siaga'}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-500">3 Node ESP32 Online</span>
              <button
                onClick={onOpenPanic}
                className="text-xs font-extrabold text-red-600 hover:text-red-700"
              >
                🚨 Panic Button
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main 2-Column Responsive Widescreen Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Layanan Cepat + Agenda & Pengumuman + Tagihan Aktif */}
        <div className="lg:col-span-8 space-y-6">
          {/* Layanan Cepat Bar */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Pusat Layanan Cepat Warga
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => onNavigateTab('ipl')}
                disabled={!isApproved}
                className="p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50/80 border border-slate-200/80 hover:border-emerald-400 text-left transition group active:scale-95 disabled:opacity-40"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2.5 group-hover:scale-110 transition">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="font-bold text-xs text-slate-900 group-hover:text-emerald-700">Bayar IPL</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Potong dompet / transfer</div>
              </button>

              <button
                onClick={() => onNavigateTab('layanan')}
                disabled={!isApproved}
                className="p-4 rounded-2xl bg-slate-50 hover:bg-blue-50/80 border border-slate-200/80 hover:border-blue-400 text-left transition group active:scale-95 disabled:opacity-40"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-2.5 group-hover:scale-110 transition">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="font-bold text-xs text-slate-900 group-hover:text-blue-700">Surat Pengantar</div>
                <div className="text-[10px] text-slate-500 mt-0.5">SKCK, Domisili, SKTM</div>
              </button>

              <button
                onClick={() => onNavigateTab('pengaduan')}
                disabled={!isApproved}
                className="p-4 rounded-2xl bg-slate-50 hover:bg-amber-50/80 border border-slate-200/80 hover:border-amber-400 text-left transition group active:scale-95 disabled:opacity-40"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-2.5 group-hover:scale-110 transition">
                  <MessageSquareWarning className="w-5 h-5" />
                </div>
                <div className="font-bold text-xs text-slate-900 group-hover:text-amber-700">Pusat Aduan</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Lapor sampah / fasilitas</div>
              </button>

              <button
                onClick={onOpenPanic}
                className="p-4 rounded-2xl bg-red-50 hover:bg-red-100/90 border border-red-200 text-left transition group active:scale-95 shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center mb-2.5 shadow-md shadow-red-500/30 group-hover:scale-110 transition">
                  <ShieldAlert className="w-5 h-5 animate-pulse" />
                </div>
                <div className="font-black text-xs text-red-700">PANIC BUTTON</div>
                <div className="text-[10px] text-red-500 mt-0.5">Sinyal darurat sirine</div>
              </button>
            </div>
          </div>

          {/* Card: Struktur Unit Rumah & Entitas Kartu Keluarga */}
          {user?.house && (
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                    <Home className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-900 text-white">
                        {user.house.house_code || `RT${user.house.rt_number}-${user.house.block}${user.house.number}`}
                      </span>
                      <h4 className="font-black text-sm text-slate-900">
                        {user.house.full_address}
                      </h4>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Entitas Utama Penagihan IPL & Hak Akses Administrasi RT {user.house.rt_number}
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                  Unit Rumah Terdata
                </span>
              </div>

              {/* KK Breakdown: KK Utama vs KK Pendukung */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* KK Utama Box */}
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-emerald-800 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" /> KK Utama (PJ Rumah)
                    </span>
                    {(user.is_head_of_house || user.kk_type === 'kk_utama') && (
                      <span className="text-[9px] bg-emerald-600 text-white font-extrabold px-1.5 py-0.5 rounded">
                        Anda
                      </span>
                    )}
                  </div>
                  <div className="font-black text-sm text-slate-900">
                    {user.house.head_of_family?.name || (user.is_head_of_house ? user.name : 'Budi Santoso')}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    No. KK: <strong className="font-mono">{user.house.head_of_family?.no_kk || user.no_kk || '3201012345670001'}</strong>
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold pt-0.5">
                    * Bertanggung jawab atas pembayaran iuran IPL per unit rumah.
                  </div>
                </div>

                {/* KK Pendukung Box */}
                <div className="p-3.5 bg-teal-50/60 border border-teal-200 rounded-2xl text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-teal-800 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> KK Pendukung / Tambahan
                    </span>
                    {user.kk_type === 'kk_pendukung' && (
                      <span className="text-[9px] bg-teal-600 text-white font-extrabold px-1.5 py-0.5 rounded">
                        Anda
                      </span>
                    )}
                  </div>
                  {user.house.kk_pendukung && user.house.kk_pendukung.length > 0 ? (
                    <div className="space-y-1">
                      {user.house.kk_pendukung.map((kk: any) => (
                        <div key={kk.id} className="text-[11px]">
                          <strong className="text-slate-800">{kk.name}</strong>
                          <span className="text-slate-500 font-mono text-[10px] block">No KK: {kk.no_kk || '-'}</span>
                        </div>
                      ))}
                    </div>
                  ) : user.kk_type === 'kk_pendukung' ? (
                    <div>
                      <div className="font-black text-sm text-slate-900">{user.name}</div>
                      <div className="text-[11px] text-slate-600 font-mono">No. KK: {user.no_kk || '3201012345670002'}</div>
                    </div>
                  ) : (
                    <div className="text-slate-500 text-[11px] py-1">
                      {user.id === 8 ? (
                        <div>
                          <strong className="text-slate-800">Eko Santoso</strong>
                          <span className="text-slate-500 font-mono text-[10px] block">No KK: 3201012345670002 (Anak sudah menikah)</span>
                        </div>
                      ) : (
                        'Tidak ada KK tambahan di rumah ini.'
                      )}
                    </div>
                  )}
                  <div className="text-[10px] text-teal-700 font-semibold pt-0.5">
                    * Tercatat berdomisili di RT tanpa dikenakan tagihan IPL ganda.
                  </div>
                </div>
              </div>

              {/* Profil & Biodata Kependudukan KK Utama */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                      <IdCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-xs text-slate-900">
                        Biodata Kependudukan KK Utama (Penanggung Jawab Rumah)
                      </h5>
                      <p className="text-[10px] text-slate-500">
                        Digunakan untuk keperluan administrasi surat pengantar RT/RW, sensus, dan Posyandu.
                      </p>
                    </div>
                  </div>
                  {(user.is_head_of_house || user.kk_type === 'kk_utama') && (
                    <button
                      type="button"
                      onClick={openProfileModal}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 shrink-0 self-start sm:self-center"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Edit Biodata Saya</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-2 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/70 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">NIK (No. KTP)</span>
                    <span className="font-mono font-bold text-slate-800 text-[11px]">
                      {user.nik || <span className="text-amber-600 font-normal italic">Belum diisi</span>}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Nomor KK</span>
                    <span className="font-mono font-bold text-slate-800 text-[11px]">
                      {user.no_kk || user.house?.head_of_family?.no_kk || <span className="text-amber-600 font-normal italic">Belum diisi</span>}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Tempat, Tgl Lahir</span>
                    <span className="font-bold text-slate-800 text-[11px]">
                      {(user as any).birth_place || '-'}{' '}
                      {(user as any).birth_date ? `, ${new Date((user as any).birth_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Jenis Kelamin / Agama</span>
                    <span className="font-bold text-slate-800 text-[11px]">
                      {(user as any).gender || 'Laki-laki'} / {(user as any).religion || 'Islam'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Pekerjaan</span>
                    <span className="font-bold text-slate-800 text-[11px]">
                      {(user as any).occupation || <span className="text-slate-400 font-normal">-</span>}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Status Perkawinan</span>
                    <span className="font-bold text-slate-800 text-[11px]">
                      {(user as any).marital_status || 'Kawin'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Golongan Darah</span>
                    <span className="font-bold text-slate-800 text-[11px]">
                      {(user as any).blood_type || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">No. WhatsApp / HP</span>
                    <span className="font-bold text-slate-800 text-[11px]">
                      {user.phone || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Manajemen Kartu Keluarga & Anggota Serumah (Terpisah KK Utama & KK Pendukung) */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                        <span>Manajemen Kartu Keluarga Serumah</span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black">
                          Total {familyMembers.length || 1} Jiwa
                        </span>
                      </h5>
                      <p className="text-[10px] text-slate-500">
                        Dipisahkan berdasarkan Kartu Keluarga (KK Inti & KK Tambahan) pada unit {user.house.house_code}.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 1. ACCORDION / CARD: KK UTAMA (KK INTI) */}
                <div className="rounded-2xl border border-emerald-200 bg-white overflow-hidden shadow-xs transition">
                  {/* Header / Accordion Toggle */}
                  <div 
                    onClick={() => setIsKkUtamaOpen(!isKkUtamaOpen)}
                    className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50/50 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-emerald-100/40 transition select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Home className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-emerald-950">
                            Kartu Keluarga Utama (KK Inti)
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black tracking-wide uppercase">
                            PJ Unit Rumah
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-white text-emerald-900 text-[10px] font-extrabold border border-emerald-200">
                            {kkUtamaMembers.length} Jiwa
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5 font-medium flex items-center gap-2 flex-wrap">
                          <span>No. KK: <strong className="font-mono text-slate-800">{kkUtamaNo || '-'}</strong></span>
                          <span>•</span>
                          <span>Kepala Keluarga: <strong className="text-slate-800">{user.house?.head_of_family?.name || user.name}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {(user.is_head_of_house || user.kk_type === 'kk_utama') && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openAddFamilyModal('kk_utama');
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs transition active:scale-95"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>+ Tambah Anggota</span>
                        </button>
                      )}
                      <div className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                        {isKkUtamaOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Body List KK Utama */}
                  {isKkUtamaOpen && (
                    <div className="p-3 space-y-2 border-t border-emerald-100 bg-white">
                      {kkUtamaMembers.length > 0 ? (
                        kkUtamaMembers.map((member) => (
                          <div
                            key={member.id}
                            className={`p-2.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                              member.id === user.id
                                ? 'bg-emerald-50/70 border-emerald-200'
                                : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                member.id === user.id
                                  ? 'bg-emerald-600 text-white'
                                  : member.gender === 'Perempuan' || member.relationship === 'Istri'
                                  ? 'bg-pink-100 text-pink-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {member.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-extrabold text-slate-900 text-xs">
                                    {member.name}
                                  </span>
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                    member.is_head_of_house || member.kk_type === 'kk_utama'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : member.relationship === 'Istri'
                                      ? 'bg-pink-100 text-pink-800'
                                      : member.relationship === 'Anak'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}>
                                    {member.relationship || (member.is_head_of_house ? 'Kepala Keluarga' : 'Anggota Keluarga')}
                                  </span>
                                  {member.id === user.id && (
                                    <span className="text-[9px] bg-emerald-600 text-white font-extrabold px-1.5 py-0.2 rounded">
                                      Anda (Login)
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-0.5 flex-wrap">
                                  <span>NIK: <strong className="font-mono text-slate-700">{member.nik || '-'}</strong></span>
                                  <span>•</span>
                                  <span>Tgl Lahir: <strong className="text-slate-700">{member.birth_date ? new Date(member.birth_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'}) : (member.birth_place || '-')}</strong></span>
                                  {member.occupation && (
                                    <>
                                      <span>•</span>
                                      <span>Pekerjaan: <strong className="text-slate-700">{member.occupation}</strong></span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                              {member.id !== user.id && (user.is_head_of_house || user.kk_type === 'kk_utama') && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => openEditFamilyModal(member)}
                                    className="px-2 py-1 text-[10px] font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1 transition"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteFamilyMember(member.id, member.name)}
                                    className="px-2 py-1 text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-1 transition"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Hapus</span>
                                  </button>
                                </>
                              )}
                              {member.id === user.id && (
                                <span className="text-[9px] text-emerald-700 font-bold px-2 py-0.5 bg-emerald-50 rounded-lg">
                                  Penanggung Jawab Rumah
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                          Belum ada anggota keluarga terdaftar di KK Utama.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. ACCORDION / CARD: KK PENDUKUNG / TAMBAHAN */}
                <div className="rounded-2xl border border-teal-200 bg-white overflow-hidden shadow-xs transition">
                  {/* Header / Accordion Toggle */}
                  <div 
                    onClick={() => setIsKkPendukungOpen(!isKkPendukungOpen)}
                    className="p-3.5 bg-gradient-to-r from-teal-50 to-cyan-50/50 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-teal-100/40 transition select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-teal-950">
                            Kartu Keluarga Pendukung / Tambahan
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[9px] font-black tracking-wide uppercase">
                            Bebas IPL Ganda
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-white text-teal-900 text-[10px] font-extrabold border border-teal-200">
                            {kkPendukungMembers.length} Jiwa
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5 font-medium flex items-center gap-2 flex-wrap">
                          <span>No. KK: <strong className="font-mono text-slate-800">{kkPendukungNo || '-'}</strong></span>
                          <span>•</span>
                          <span>Kepala KK: <strong className="text-slate-800">{kkPendukungHead?.name || (user?.house?.kk_pendukung?.[0]?.name) || (user?.id === 8 ? 'Eko Santoso' : 'Belum Ada')}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {(user.is_head_of_house || user.kk_type === 'kk_utama') && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openAddFamilyModal('kk_pendukung');
                          }}
                          className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs transition active:scale-95"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>+ Tambah Anggota</span>
                        </button>
                      )}
                      <div className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                        {isKkPendukungOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Body List KK Pendukung */}
                  {isKkPendukungOpen && (
                    <div className="p-3 space-y-2 border-t border-teal-100 bg-white">
                      <div className="p-2.5 bg-teal-50/70 border border-teal-200 rounded-xl text-[10px] text-teal-800 leading-relaxed">
                        ℹ️ <strong>Ketentuan KK Pendukung:</strong> Kartu Keluarga mandiri yang tinggal dalam satu atap unit rumah fisik ini. Tercatat sah untuk sensus & persuratan RT/RW <strong>tanpa dikenakan iuran IPL ganda</strong> (beban IPL hanya dibebankan pada KK Utama).
                      </div>

                      {kkPendukungMembers.length > 0 ? (
                        kkPendukungMembers.map((member) => (
                          <div
                            key={member.id}
                            className={`p-2.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                              member.id === user.id
                                ? 'bg-teal-50/80 border-teal-300'
                                : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                member.id === user.id
                                  ? 'bg-teal-600 text-white'
                                  : member.gender === 'Perempuan' || member.relationship === 'Istri'
                                  ? 'bg-pink-100 text-pink-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {member.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-extrabold text-slate-900 text-xs">
                                    {member.name}
                                  </span>
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                                    {member.relationship || 'KK Tambahan'}
                                  </span>
                                  {member.id === user.id && (
                                    <span className="text-[9px] bg-teal-600 text-white font-extrabold px-1.5 py-0.2 rounded">
                                      Anda (Login)
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-0.5 flex-wrap">
                                  <span>NIK: <strong className="font-mono text-slate-700">{member.nik || '-'}</strong></span>
                                  <span>•</span>
                                  <span>Tgl Lahir: <strong className="text-slate-700">{member.birth_date ? new Date(member.birth_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'}) : (member.birth_place || '-')}</strong></span>
                                  {member.occupation && (
                                    <>
                                      <span>•</span>
                                      <span>Pekerjaan: <strong className="text-slate-700">{member.occupation}</strong></span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                              {member.id !== user.id && (user.is_head_of_house || user.kk_type === 'kk_utama') && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => openEditFamilyModal(member)}
                                    className="px-2 py-1 text-[10px] font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1 transition"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteFamilyMember(member.id, member.name)}
                                    className="px-2 py-1 text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-1 transition"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Hapus</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                          Tidak ada KK tambahan di unit rumah ini.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Unpaid IPL Alert banner if any */}
          {isApproved && totalUnpaidCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-200/80 text-amber-800 rounded-2xl">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                    {totalUnpaidCount > 1 
                      ? `Tagihan IPL Tertunggak (${totalUnpaidCount} Periode Bulan)` 
                      : 'Tagihan IPL Belum Lunas'}
                  </div>
                  <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                    {totalUnpaidCount > 1
                      ? `Total Akumulasi Tagihan: Rp ${Number(totalUnpaidAmount).toLocaleString('id-ID')}`
                      : `Periode ${billings[0]?.master?.period_month} / ${billings[0]?.master?.period_year} — Rp ${Number(totalUnpaidAmount).toLocaleString('id-ID')}`}
                  </div>
                  <div className="text-xs text-amber-700 mt-0.5">
                    {totalUnpaidCount > 1
                      ? `Terdapat ${totalUnpaidCount} bulan tagihan yang belum dilunasi lintas periode. Dapat dibayar langsung dari Saldo Dompet Warga.`
                      : 'Dapat dibayar instan menggunakan Saldo Dompet Warga Anda.'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('ipl')}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95 whitespace-nowrap flex items-center gap-1.5"
              >
                <span>Bayar Sekarang</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Announcements & Agenda Warga */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-base text-slate-900 tracking-tight">
                    Pengumuman & Agenda Lingkungan RW 05
                  </h4>
                  <p className="text-xs text-slate-500">Siaran resmi kegiatan gotong royong dan informasi pengurus</p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('layanan')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                Lihat Semua & RSVP
              </button>
            </div>

            {announcements.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Belum ada pengumuman kegiatan baru untuk periode ini.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {announcements.map((item) => (
                  <div key={item.id} className="p-4 bg-slate-50 rounded-3xl border border-slate-200 flex flex-col justify-between hover:border-slate-300 transition shadow-xs space-y-3">
                    <div>
                      {/* Top Badges & Countdown Reminder */}
                      <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.type === 'event' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {item.type === 'event' ? 'Agenda Lingkungan' : 'Pengumuman'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            Tingkat {item.scope.toUpperCase()}
                          </span>
                        </div>

                        {item.reminder_meta && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                            item.reminder_meta.reminder_type === 'hari_h'
                              ? 'bg-red-100 text-red-700 border border-red-300 animate-pulse'
                              : item.reminder_meta.reminder_type === 'h_min_1'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : item.reminder_meta.reminder_type === 'h_min_7'
                              ? 'bg-purple-100 text-purple-800'
                              : item.reminder_meta.reminder_type === 'h_min_14'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            <Clock className="w-3 h-3" />
                            <span>{item.reminder_meta.reminder_label}</span>
                          </span>
                        )}
                      </div>

                      <h5 className="font-black text-sm text-slate-900 leading-snug">{item.title}</h5>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{item.content}</p>

                      {/* Financial Transparency & Deficit Info */}
                      {item.financial_transparency && (
                        <div className="mt-3 p-3 bg-white rounded-2xl border border-slate-200 text-xs space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-slate-500">Alokasi Anggaran:</span>
                            <span className="text-emerald-700">
                              Rp {Number(item.financial_transparency.budget_amount).toLocaleString('id-ID')}{' '}
                              ({item.financial_transparency.budget_source === 'kas_rt' ? 'Kas RT' : item.financial_transparency.budget_source === 'kas_rw' ? 'Kas RW' : 'Swadaya'})
                            </span>
                          </div>

                          {/* Kas Over / Defisit & Permintaan Swadaya */}
                          {item.financial_transparency.donation_target > 0 && (
                            <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-amber-950 space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-black text-amber-900">
                                <span>KAS KURANG / DEFISIT: Dibuka Swadaya Warga</span>
                                <span>{item.financial_transparency.donation_progress_percent}%</span>
                              </div>
                              <div className="w-full bg-amber-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-amber-600 h-full rounded-full transition-all duration-500"
                                  style={{ width: `${Math.min(100, item.financial_transparency.donation_progress_percent)}%` }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-[10px]">
                                <span>Terkumpul: <strong>Rp {Number(item.financial_transparency.total_donations_collected).toLocaleString('id-ID')}</strong></span>
                                <span>Target: <strong>Rp {Number(item.financial_transparency.donation_target).toLocaleString('id-ID')}</strong></span>
                              </div>
                            </div>
                          )}

                          {/* Iuran Tambahan Insidental */}
                          {item.financial_transparency.extra_fee_per_family > 0 ? (
                            <div className="text-[10px] text-rose-700 font-bold bg-rose-50 px-2 py-1 rounded-lg">
                              ⚠️ Iuran Insidental Tambahan: Rp {Number(item.financial_transparency.extra_fee_per_family).toLocaleString('id-ID')} / KK
                            </div>
                          ) : (
                            <div className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-lg flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Biaya 100% Ditutup Kas RT/RW (Warga Bayar Rp 0)</span>
                            </div>
                          )}

                          {/* SPJ Realisasi Pengeluaran */}
                          {item.financial_transparency.financial_report_notes && (
                            <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100 leading-tight">
                              <strong>Laporan Realisasi:</strong> {item.financial_transparency.financial_report_notes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-200/60">
                      {item.event_date && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{new Date(item.event_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })} WIB</span>
                        </div>
                      )}

                      {/* RSVP Kehadiran & Donasi Controls */}
                      {item.allow_rsvp && (
                        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="text-[11px] font-semibold text-slate-600">
                            {item.rsvp_meta?.my_rsvp ? (
                              item.rsvp_meta.my_rsvp.status === 'hadir' ? (
                                <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  <span>Anda Konfirmasi HADIR</span>
                                </span>
                              ) : (
                                <span className="text-rose-700 font-bold flex items-center gap-1" title={item.rsvp_meta.my_rsvp.reason}>
                                  <X className="w-3 h-3" />
                                  <span>Anda Izin: {item.rsvp_meta.my_rsvp.reason || 'Tidak Hadir'}</span>
                                </span>
                              )
                            ) : (
                              <span className="text-slate-400">Belum Konfirmasi RSVP</span>
                            )}
                            <div className="text-[10px] text-slate-400">
                              {item.rsvp_meta?.total_hadir || 0} Hadir • {item.rsvp_meta?.total_tidak_hadir || 0} Izin
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {item.allow_donation && (
                              <button
                                onClick={() => handleOpenDonateModal(item)}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition flex items-center gap-1"
                              >
                                <Gift className="w-3 h-3" />
                                <span>Donasi</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenRsvpModal(item)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition"
                            >
                              RSVP Kehadiran / Izin
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): IoT Status Widget + Bank Sampah + Kontak Pengurus */}
        <div className="lg:col-span-4 space-y-6">
          {/* Mini IoT Monitoring Widget */}
          <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-200">
                  Node Status & IoT Live
                </h4>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono">
                Real-Time
              </span>
            </div>

            {/* Siren state mini */}
            <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${sirenStatus?.is_active ? 'bg-red-500 text-white animate-bounce' : 'bg-slate-700 text-slate-300'}`}>
                  {sirenStatus?.is_active ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </div>
                <div>
                  <div className="font-bold text-slate-100">Sirine RT 01-03</div>
                  <div className="text-[10px] text-slate-400">{sirenStatus?.is_active ? 'BERBUNYI' : 'Siaga Aman'}</div>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('iot')}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300"
              >
                Panel IoT
              </button>
            </div>

            {/* Last Ronda tap mini */}
            <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                  <DoorOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-100">Pos Gerbang Utama</div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                    {lastRonda ? `Tap: ${lastRonda.user?.name}` : 'Servo Otomatis Normal'}
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-slate-400">
                {lastRonda ? new Date(lastRonda.tapped_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Aktif'}
              </span>
            </div>

            {/* Quick simulation link */}
            <button
              onClick={() => onNavigateTab('iot')}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              Buka Layar Monitoring IoT Lengkap
            </button>
          </div>

          {/* Bank Sampah Rates Widget */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Recycle className="w-4 h-4 text-emerald-600" />
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-800">
                  Tarif Bank Sampah Mandiri
                </h4>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                Node 3
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Timbang sampah daur ulang di terminal balai warga. Saldo rupiah langsung ditambahkan ke Dompet Warga seketika.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <div className="text-[11px] font-bold text-slate-500">Kaleng / Logam</div>
                <div className="text-sm font-black text-emerald-700 mt-0.5">Rp 5.000 / kg</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <div className="text-[11px] font-bold text-slate-500">Botol / Plastik</div>
                <div className="text-sm font-black text-emerald-700 mt-0.5">Rp 2.000 / kg</div>
              </div>
            </div>
          </div>

          {/* Emergency & Neighborhood Contacts */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">
              Kontak Siaga Lingkungan
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <div className="font-bold text-slate-800">Pos Satpam Gerbang</div>
                  <div className="text-[10px] text-slate-500">24 Jam Siaga Patroli</div>
                </div>
                <span className="font-mono text-emerald-700 font-bold text-xs">0811-0000-001</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <div className="font-bold text-slate-800">Sekretariat RW 05</div>
                  <div className="text-[10px] text-slate-500">Administrasi & Izin</div>
                </div>
                <span className="font-mono text-indigo-700 font-bold text-xs">0811-0000-002</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Tambah KK Tambahan (Khusus KK Utama) */}
      {showAddKkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Tambah Kartu Keluarga (KK) Tambahan
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Unit Rumah: <span className="font-mono font-bold text-slate-800">{user?.house?.house_code}</span> ({user?.house?.full_address})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddKkModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-950 leading-relaxed">
              🔒 <strong>Ketentuan Warga:</strong> Sesuai regulasi lingkungan, <strong>KK Tambahan tidak memiliki akses login</strong>. Seluruh tanggung jawab pembayaran iuran IPL, pengelolaan tagihan, dan pengurusan persuratan di unit rumah ini menjadi wewenang dan kewajiban penuh Anda sebagai <strong>KK Utama</strong>.
            </div>

            {modalError && (
              <div className="mt-3 p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
                {modalError}
              </div>
            )}

            {modalSuccess && (
              <div className="mt-3 p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{modalSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAddKkSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Kepala KK Tambahan:
                </label>
                <input
                  type="text"
                  value={newKkName}
                  onChange={(e) => setNewKkName(e.target.value)}
                  placeholder="Contoh: Eko Pratama"
                  required
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor KK (16 Digit):
                  </label>
                  <input
                    type="text"
                    value={newKkNoKk}
                    onChange={(e) => setNewKkNoKk(e.target.value)}
                    placeholder="327101..."
                    required
                    maxLength={16}
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIK Kepala KK Tambahan:
                  </label>
                  <input
                    type="text"
                    value={newKkNik}
                    onChange={(e) => setNewKkNik(e.target.value)}
                    placeholder="327101..."
                    required
                    maxLength={16}
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hubungan Keluarga dengan KK Utama:
                </label>
                <select
                  value={newKkRelation}
                  onChange={(e) => setNewKkRelation(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  <option value="Anak Sudah Menikah Serumah">Anak Sudah Menikah (Tinggal Serumah)</option>
                  <option value="Menantu Serumah">Menantu Serumah</option>
                  <option value="Orang Tua / Mertua">Orang Tua / Mertua</option>
                  <option value="Kerabat / Famili Lain">Kerabat / Famili Lain</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor WhatsApp / HP (Opsional):
                </label>
                <input
                  type="text"
                  value={newKkPhone}
                  onChange={(e) => setNewKkPhone(e.target.value)}
                  placeholder="0812..."
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddKkModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 disabled:opacity-50 transition active:scale-95"
                >
                  {modalLoading ? 'Menyimpan...' : 'Simpan & Daftarkan KK'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 1: Edit Biodata Pribadi KK Utama */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <IdCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Lengkapi Biodata Kependudukan (KK Utama)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Unit Rumah: <span className="font-mono font-bold text-slate-800">{user?.house?.house_code}</span> ({user?.house?.full_address})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold transition"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-2xl text-[11px] text-blue-900 leading-relaxed">
              📋 <strong>Informasi Kependudukan:</strong> Biodata ini digunakan secara otomatis untuk penerbitan <strong>Surat Pengantar RT/RW resmi</strong> (SKCK, Domisili, SKTM) dan pendataan sensus warga RW 05.
            </div>

            {profileError && (
              <div className="mt-3 p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
                {profileError}
              </div>
            )}

            {profileSuccess && (
              <div className="mt-3 p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap (Sesuai KTP):
                </label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="Nama Lengkap"
                  required
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIK (Nomor Induk Kependudukan / No. KTP 16 Digit):
                  </label>
                  <input
                    type="text"
                    value={profileForm.nik}
                    onChange={(e) => setProfileForm({ ...profileForm, nik: e.target.value })}
                    placeholder="327101..."
                    maxLength={16}
                    required
                    className="w-full text-xs font-mono font-bold px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Kartu Keluarga (KK 16 Digit):
                  </label>
                  <input
                    type="text"
                    value={profileForm.no_kk}
                    onChange={(e) => setProfileForm({ ...profileForm, no_kk: e.target.value })}
                    placeholder="327101..."
                    maxLength={16}
                    required
                    className="w-full text-xs font-mono font-bold px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tempat Lahir:
                  </label>
                  <input
                    type="text"
                    value={profileForm.birth_place}
                    onChange={(e) => setProfileForm({ ...profileForm, birth_place: e.target.value })}
                    placeholder="Contoh: Jakarta"
                    required
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Lahir:
                  </label>
                  <input
                    type="date"
                    value={profileForm.birth_date}
                    onChange={(e) => setProfileForm({ ...profileForm, birth_date: e.target.value })}
                    required
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jenis Kelamin:
                  </label>
                  <select
                    value={profileForm.gender}
                    onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="Laki-laki">Laki-laki (L)</option>
                    <option value="Perempuan">Perempuan (P)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Agama:
                  </label>
                  <select
                    value={profileForm.religion}
                    onChange={(e) => setProfileForm({ ...profileForm, religion: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="Islam">Islam</option>
                    <option value="Kristen">Kristen</option>
                    <option value="Katolik">Katolik</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                    <option value="Konghucu">Konghucu</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pekerjaan:
                  </label>
                  <input
                    type="text"
                    value={profileForm.occupation}
                    onChange={(e) => setProfileForm({ ...profileForm, occupation: e.target.value })}
                    placeholder="Karyawan Swasta / PNS / dll"
                    required
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status Perkawinan:
                  </label>
                  <select
                    value={profileForm.marital_status}
                    onChange={(e) => setProfileForm({ ...profileForm, marital_status: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="Kawin">Kawin</option>
                    <option value="Belum Kawin">Belum Kawin</option>
                    <option value="Cerai Hidup">Cerai Hidup</option>
                    <option value="Cerai Mati">Cerai Mati</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Golongan Darah:
                  </label>
                  <select
                    value={profileForm.blood_type}
                    onChange={(e) => setProfileForm({ ...profileForm, blood_type: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                    <option value="-">- (Tidak Tahu)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor WhatsApp / HP Aktif:
                </label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="081234567890"
                  required
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 transition active:scale-95"
                >
                  {profileLoading ? 'Menyimpan...' : 'Simpan Biodata Saya'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Tambah / Edit Anggota Keluarga */}
      {showFamilyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingMember ? 'Edit Anggota Keluarga' : 'Tambah Anggota Keluarga Serumah'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Unit Rumah: <span className="font-mono font-bold text-slate-800">{user?.house?.house_code}</span> ({user?.house?.full_address})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFamilyModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold transition"
              >
                ✕
              </button>
            </div>

            {familyMemberError && (
              <div className="mt-3 p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
                {familyMemberError}
              </div>
            )}

            {familyMemberSuccess && (
              <div className="mt-3 p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{familyMemberSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveFamilyMember} className="mt-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hubungan dalam Keluarga:
                  </label>
                  <select
                    value={familyForm.relationship}
                    onChange={(e) => {
                      const rel = e.target.value;
                      let defKkType = 'anggota';
                      let defGender = familyForm.gender;
                      if (rel === 'Istri') {
                        defGender = 'Perempuan';
                      } else if (rel === 'Suami') {
                        defGender = 'Laki-laki';
                      } else if (rel === 'KK Tambahan') {
                        defKkType = 'kk_pendukung';
                      }
                      setFamilyForm({
                        ...familyForm,
                        relationship: rel,
                        gender: defGender,
                        kk_type: defKkType,
                      });
                    }}
                    className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-teal-300 bg-teal-50 text-teal-950 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="Istri">Istri</option>
                    <option value="Suami">Suami</option>
                    <option value="Anak">Anak</option>
                    <option value="Orang Tua">Orang Tua</option>
                    <option value="Mertua">Mertua</option>
                    <option value="Famili Lain">Famili / Kerabat Lain</option>
                    <option value="KK Tambahan">KK Tambahan (Keluarga Anak Menikah Serumah)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap (Sesuai KTP/Akta):
                  </label>
                  <input
                    type="text"
                    value={familyForm.name}
                    onChange={(e) => setFamilyForm({ ...familyForm, name: e.target.value })}
                    placeholder="Nama Lengkap"
                    required
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIK (16 Digit KTP/KIA):
                  </label>
                  <input
                    type="text"
                    value={familyForm.nik}
                    onChange={(e) => setFamilyForm({ ...familyForm, nik: e.target.value })}
                    placeholder="327101..."
                    maxLength={16}
                    className="w-full text-xs font-mono font-bold px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor KK:
                  </label>
                  <input
                    type="text"
                    value={familyForm.no_kk}
                    onChange={(e) => setFamilyForm({ ...familyForm, no_kk: e.target.value })}
                    placeholder="327101..."
                    maxLength={16}
                    className="w-full text-xs font-mono font-bold px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tempat Lahir:
                  </label>
                  <input
                    type="text"
                    value={familyForm.birth_place}
                    onChange={(e) => setFamilyForm({ ...familyForm, birth_place: e.target.value })}
                    placeholder="Contoh: Bandung"
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Lahir:
                  </label>
                  <input
                    type="date"
                    value={familyForm.birth_date}
                    onChange={(e) => setFamilyForm({ ...familyForm, birth_date: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jenis Kelamin:
                  </label>
                  <select
                    value={familyForm.gender}
                    onChange={(e) => setFamilyForm({ ...familyForm, gender: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
                  >
                    <option value="Laki-laki">Laki-laki (L)</option>
                    <option value="Perempuan">Perempuan (P)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Agama:
                  </label>
                  <select
                    value={familyForm.religion}
                    onChange={(e) => setFamilyForm({ ...familyForm, religion: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
                  >
                    <option value="Islam">Islam</option>
                    <option value="Kristen">Kristen</option>
                    <option value="Katolik">Katolik</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                    <option value="Konghucu">Konghucu</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pekerjaan / Aktivitas:
                  </label>
                  <input
                    type="text"
                    value={familyForm.occupation}
                    onChange={(e) => setFamilyForm({ ...familyForm, occupation: e.target.value })}
                    placeholder="Pelajar / Mahasiswa / IRT"
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status Perkawinan:
                  </label>
                  <select
                    value={familyForm.marital_status}
                    onChange={(e) => setFamilyForm({ ...familyForm, marital_status: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
                  >
                    <option value="Belum Kawin">Belum Kawin</option>
                    <option value="Kawin">Kawin</option>
                    <option value="Cerai Hidup">Cerai Hidup</option>
                    <option value="Cerai Mati">Cerai Mati</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Golongan Darah:
                  </label>
                  <select
                    value={familyForm.blood_type}
                    onChange={(e) => setFamilyForm({ ...familyForm, blood_type: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                    <option value="-">- (Tidak Tahu)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor WhatsApp / HP (Opsional):
                </label>
                <input
                  type="text"
                  value={familyForm.phone}
                  onChange={(e) => setFamilyForm({ ...familyForm, phone: e.target.value })}
                  placeholder="0812..."
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowFamilyModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={familyMemberLoading}
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-500/20 disabled:opacity-50 transition active:scale-95"
                >
                  {familyMemberLoading ? 'Menyimpan...' : (editingMember ? 'Simpan Perubahan' : 'Daftarkan Anggota')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RSVP KEHADIRAN / IZIN GOTONG ROYONG */}
      {selectedEventRsvp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">Konfirmasi Kehadiran / RSVP</h4>
                  <p className="text-[11px] text-slate-500 truncate max-w-[220px]">{selectedEventRsvp.title}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEventRsvp(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {rsvpSuccessMsg && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{rsvpSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleRsvpSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Status Partisipasi Anda:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRsvpStatus('hadir')}
                    className={`p-3 rounded-2xl border font-bold text-center transition flex flex-col items-center gap-1 ${
                      rsvpStatus === 'hadir'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Hadir Langsung</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRsvpStatus('tidak_hadir')}
                    className={`p-3 rounded-2xl border font-bold text-center transition flex flex-col items-center gap-1 ${
                      rsvpStatus === 'tidak_hadir'
                        ? 'bg-rose-50 border-rose-500 text-rose-900 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <X className="w-4 h-4 text-rose-600" />
                    <span>Izin / Berhalangan</span>
                  </button>
                </div>
              </div>

              {rsvpStatus === 'tidak_hadir' && (
                <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-2xl space-y-2.5">
                  <div className="text-[11px] font-bold text-rose-900">
                    Keterangan Izin Gotong Royong / Acara:
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 font-semibold block mb-1">
                      Alasan Ketidakhadiran (Sakit / Dinas / Halangan):
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Sedang tugas dinas luar kota / Sakit"
                      value={rsvpReason}
                      onChange={(e) => setRsvpReason(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-rose-300 text-xs bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-600 font-semibold block mb-1">
                      Bentuk Kontribusi Pengganti (Opsional):
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Mengirim 2 dus air mineral & gorengan ke pos"
                      value={rsvpContribution}
                      onChange={(e) => setRsvpContribution(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-rose-300 text-xs bg-white font-medium"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Catatan ini akan tampil di daftar gotong royong agar pengurus & warga mengetahui partisipasi Anda.
                    </span>
                  </div>
                </div>
              )}

              {rsvpStatus === 'hadir' && (
                <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-1 text-emerald-950 text-[11px]">
                  <div className="font-bold">Terima kasih atas kepedulian Anda!</div>
                  <p className="text-emerald-800">
                    Kehadiran Anda sangat berarti untuk kerukunan dan kebersihan lingkungan kita bersama.
                  </p>
                  <div className="pt-1.5">
                    <label className="text-[10px] text-slate-600 font-semibold block mb-1">
                      Peralatan yang Dibawa (Opsional):
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Siap bawa cangkul / mesin potong rumput"
                      value={rsvpContribution}
                      onChange={(e) => setRsvpContribution(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-emerald-300 text-xs bg-white font-medium"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedEventRsvp(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={rsvpLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition"
                >
                  {rsvpLoading ? 'Menyimpan...' : 'Simpan Konfirmasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DONASI SWADAYA (DEFISIT ANGGARAN KEGIATAN) */}
      {selectedEventDonate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">Donasi Swadaya Acara Warga</h4>
                  <p className="text-[11px] text-slate-500 truncate max-w-[220px]">{selectedEventDonate.title}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEventDonate(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {donationSuccessMsg && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{donationSuccessMsg}</span>
              </div>
            )}

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 space-y-1">
              <div className="font-bold">Informasi Kebutuhan Dana:</div>
              <p className="leading-relaxed text-[11px]">
                Kas {selectedEventDonate.financial_transparency?.budget_source === 'kas_rt' ? 'RT' : 'RW'} mengalokasikan Rp {Number(selectedEventDonate.financial_transparency?.budget_amount).toLocaleString('id-ID')}. Sisa kekurangan dana dihimpun melalui donasi sukarela warga.
              </p>
            </div>

            <form onSubmit={handleDonateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nominal Donasi Sukarela (Rp):</label>
                <input
                  type="number"
                  required
                  min="5000"
                  step="5000"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-black text-sm text-slate-900"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div>• Salurkan ke Rekening Bersama / QRIS Bendahara {selectedEventDonate.scope?.toUpperCase()}</div>
                <div>• Bank Mandiri: <strong>132-00-9876543-1</strong> a.n Paguyuban Smart Warga</div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedEventDonate(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={donationLoading}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md shadow-amber-600/20 active:scale-95 transition"
                >
                  {donationLoading ? 'Mengirim...' : 'Kirim Donasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
