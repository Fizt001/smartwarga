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
  ChevronUp,
  Package,
  HeartPulse
} from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';
import { ToastContainer, ToastItem } from '@/components/Toast';

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
  const [calendarData, setCalendarData] = useState<any | null>(null);
  const [sirenStatus, setSirenStatus] = useState<any>(null);
  const [iotOnlineCount, setIotOnlineCount] = useState<number | null>(null);
  const [iotTotalCount, setIotTotalCount] = useState<number>(3);
  const [wasteRates, setWasteRates] = useState<any[]>([]);
  const [lastRonda, setLastRonda] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Sesi Antrean Kios Pelayanan (SDA Pin 4) & Riwayat Gerbang (SDA Pin 5)
  const [kioskQueueSession, setKioskQueueSession] = useState<any | null>(null);
  const [kioskActionLoading, setKioskActionLoading] = useState(false);
  const [myGateLogs, setMyGateLogs] = useState<any[]>([]);

  const weeklyGateActivity = React.useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    myGateLogs.forEach((log) => {
      try {
        const d = new Date(log.tapped_at);
        counts[d.getDay()] += 1;
      } catch {}
    });
    return [
      { day: 'Sen', count: counts[1] },
      { day: 'Sel', count: counts[2] },
      { day: 'Rab', count: counts[3] },
      { day: 'Kam', count: counts[4] },
      { day: 'Jum', count: counts[5] },
      { day: 'Sab', count: counts[6] },
      { day: 'Min', count: counts[0] },
    ];
  }, [myGateLogs]);

  const monthsList = [
    { num: 1, name: 'Jan' },
    { num: 2, name: 'Feb' },
    { num: 3, name: 'Mar' },
    { num: 4, name: 'Apr' },
    { num: 5, name: 'Mei' },
    { num: 6, name: 'Jun' },
    { num: 7, name: 'Jul' },
    { num: 8, name: 'Agu' },
    { num: 9, name: 'Sep' },
    { num: 10, name: 'Okt' },
    { num: 11, name: 'Nov' },
    { num: 12, name: 'Des' },
  ];

  // Toast notifications state
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const addToast = (type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { id, type, message, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };
  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Custom Confirmation Dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info' | 'success';
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Konfirmasi',
    cancelText: 'Batal',
    variant: 'danger',
    onConfirm: () => {},
  });

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
  const [isBiodataOpen, setIsBiodataOpen] = useState(false);

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

  // Modal Perekaman e-KTP Mandiri (RFID Scan)
  const [showKtpModal, setShowKtpModal] = useState(false);
  const [ktpPolling, setKtpPolling] = useState(false);
  const [detectedUid, setDetectedUid] = useState<string>('');
  const [detectedOwner, setDetectedOwner] = useState<string | null>(null);
  const [detectedOwnerHouse, setDetectedOwnerHouse] = useState<string | null>(null);
  const [ktpManualUid, setKtpManualUid] = useState<string>('');
  const [ktpLoading, setKtpLoading] = useState(false);
  const [ktpError, setKtpError] = useState('');
  const [ktpSuccess, setKtpSuccess] = useState('');

  useEffect(() => {
    let interval: any = null;
    if (showKtpModal) {
      setKtpPolling(true);
      setKtpError('');
      setKtpSuccess('');
      const pollScan = async () => {
        try {
          const res = await fetchApi('/warga/ktp/latest-scan');
          if (res.success && res.data?.rfid_uid) {
            setDetectedUid(res.data.rfid_uid);
            setKtpManualUid(res.data.rfid_uid);
            if (res.data.already_registered && res.data.owner_name && res.data.owner_id !== user?.id) {
              setDetectedOwner(res.data.owner_name);
              setDetectedOwnerHouse(res.data.owner_house);
            } else {
              setDetectedOwner(null);
              setDetectedOwnerHouse(null);
            }
          }
        } catch {
          // ignore network hiccups
        }
      };
      pollScan();
      interval = setInterval(pollScan, 1500);
    } else {
      setKtpPolling(false);
      setDetectedUid('');
      setDetectedOwner(null);
      setDetectedOwnerHouse(null);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showKtpModal, user?.id]);

  const handlePairKtp = async (uidToPair: string) => {
    if (!uidToPair || !uidToPair.trim()) {
      setKtpError('Silakan scan e-KTP pada scanner ESP32 atau masukkan UID kartu.');
      return;
    }
    setKtpLoading(true);
    setKtpError('');
    setKtpSuccess('');
    try {
      const res = await fetchApi('/warga/ktp/pair', {
        method: 'POST',
        body: JSON.stringify({ rfid_uid: uidToPair.trim() }),
      });
      if (res.success) {
        setKtpSuccess(res.message);
        await refreshUser();
        // Otomatis selesaikan sesi antrean kios jika ada agar antrean tertutup & giliran warga berikutnya maju
        handleCompleteKioskSession('Registrasi e-KTP', 'Penautan kartu e-KTP fisik berhasil.');
        setTimeout(() => {
          setShowKtpModal(false);
          setKtpSuccess('');
        }, 1800);
      } else {
        setKtpError(res.message || 'Gagal menautkan kartu e-KTP.');
      }
    } catch (err: any) {
      setKtpError(err.message || 'Terjadi kesalahan saat menautkan e-KTP.');
    } finally {
      setKtpLoading(false);
    }
  };

  const promptUnpairKtp = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Lepas Tautan Fisik e-KTP?',
      message: 'Apakah Anda yakin ingin melepas tautan fisik e-KTP dari akun Anda? Palang gerbang otomatis dan kios bank sampah tidak akan mengenali kartu ini sampai ditautkan kembali.',
      confirmText: 'Ya, Lepas Tautan',
      cancelText: 'Batal',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        setKtpLoading(true);
        try {
          const res = await fetchApi('/warga/ktp/unpair', {
            method: 'DELETE',
          });
          if (res.success) {
            addToast('success', res.message || 'Tautan e-KTP berhasil dilepas.', 'e-KTP Dilepas');
            await refreshUser();
          }
        } catch (err: any) {
          addToast('error', err.message || 'Gagal melepas tautan e-KTP.', 'Gagal Melepas');
        } finally {
          setKtpLoading(false);
        }
      },
    });
  };

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
        if (devRes.success) {
          setSirenStatus(devRes.data?.siren_status || null);
          setIotOnlineCount(devRes.data?.online_count ?? devRes.data?.devices?.filter((d: any) => d.is_online).length ?? 0);
          setIotTotalCount(devRes.data?.total_count ?? devRes.data?.devices?.length ?? 3);
        }
        if (wasteRes.success) setWasteRates(wasteRes.data || []);
        if (rondaRes.success && rondaRes.data?.data?.length > 0) setLastRonda(rondaRes.data.data[0]);

        if (isApproved) {
          await loadFamilyMembers();
          fetchApi(`/ipl/annual-calendar?year=${new Date().getFullYear()}`).then((cRes) => {
            if (cRes?.success && cRes.data) setCalendarData(cRes.data);
            else if (cRes?.calendar) setCalendarData(cRes);
          }).catch(() => {});
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [isApproved]);

  // Polling Real-Time Sesi Antrean Kios Pelayanan (SDA Pin 4) & Riwayat Gerbang Tol (SDA Pin 5)
  useEffect(() => {
    if (!user) return;
    const fetchKioskAndGate = async () => {
      try {
        const [qRes, gateRes] = await Promise.all([
          fetchApi('/pelayanan/active-session').catch(() => ({ success: false })),
          fetchApi('/warga/gate-logs').catch(() => ({ success: false })),
        ]);
        if (qRes.success && qRes.data) {
          setKioskQueueSession(qRes.data);
        }
        if (gateRes.success && gateRes.data?.data) {
          setMyGateLogs(gateRes.data.data);
        }
      } catch {
        // ignore
      }
    };

    fetchKioskAndGate();
    const interval = setInterval(fetchKioskAndGate, 3000);
    return () => clearInterval(interval);
  }, [user]);

  // Handlers Kios Pelayanan Terpadu
  const handleCompleteKioskSession = async (serviceType: string, notes: string) => {
    setKioskActionLoading(true);
    try {
      const res = await fetchApi('/pelayanan/complete-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: serviceType,
          service_notes: notes,
        }),
      });
      if (res.success) {
        addToast('success', res.message, 'Pelayanan Selesai');
        const qRes = await fetchApi('/pelayanan/active-session');
        if (qRes.success) setKioskQueueSession(qRes.data);
      } else {
        addToast('error', res.message || 'Gagal menyelesaikan sesi.', 'Error');
      }
    } catch (err: any) {
      addToast('error', err.message || 'Gagal menyelesaikan sesi pelayanan.', 'Error');
    } finally {
      setKioskActionLoading(false);
    }
  };

  const handleLegalizeKioskItem = async (itemType: 'letter' | 'loan' | 'posyandu', itemId: number) => {
    if (!kioskQueueSession?.my_queue?.id) return;
    setKioskActionLoading(true);
    try {
      const res = await fetchApi('/pelayanan/legalize-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queue_id: kioskQueueSession.my_queue.id,
          item_type: itemType,
          item_id: itemId,
        }),
      });
      if (res.success) {
        addToast('success', res.message || 'Permohonan berhasil disahkan via Tap KTP!', 'Sah & Terverifikasi');
        const qRes = await fetchApi('/pelayanan/active-session');
        if (qRes.success) setKioskQueueSession(qRes.data);
      } else {
        addToast('error', res.message || 'Gagal mengesahkan permohonan.', 'Error');
      }
    } catch (err: any) {
      addToast('error', err.message || 'Terjadi kesalahan saat legalisasi permohonan.', 'Error');
    } finally {
      setKioskActionLoading(false);
    }
  };

  const handleCancelKioskQueue = async (queueId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Batalkan Antrean Pelayanan?',
      message: 'Apakah Anda yakin ingin membatalkan antrean Anda di Kios Pelayanan?',
      confirmText: 'Ya, Batalkan',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          const res = await fetchApi('/pelayanan/cancel-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ queue_id: queueId }),
          });
          if (res.success) {
            addToast('info', res.message, 'Antrean Dibatalkan');
            const qRes = await fetchApi('/pelayanan/active-session');
            if (qRes.success) setKioskQueueSession(qRes.data);
          }
        } catch (err: any) {
          addToast('error', err.message || 'Gagal membatalkan antrean.', 'Error');
        }
      },
    });
  };

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

  const handleDeleteFamilyMember = (memberId: number, memberName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Anggota Keluarga?',
      message: `Apakah Anda yakin ingin menghapus data "${memberName}" dari daftar anggota keluarga rumah ini? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Hapus Anggota',
      cancelText: 'Batal',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          const res = await fetchApi(`/warga/family-members/${memberId}`, {
            method: 'DELETE',
          });
          if (res.success) {
            addToast('success', `Anggota keluarga "${memberName}" berhasil dihapus.`, 'Berhasil Dihapus');
            await loadFamilyMembers();
            await refreshUser();
          }
        } catch (err: any) {
          addToast('error', err.message || 'Gagal menghapus data.', 'Gagal');
        }
      },
    });
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
      addToast('error', err.message || 'Gagal menyimpan konfirmasi kehadiran.', 'Gagal');
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
        addToast('success', 'Donasi Anda berhasil disalurkan. Terima kasih!', 'Donasi Berhasil');
        const annRes = await fetchApi('/announcements');
        if (annRes.success) setAnnouncements(annRes.data?.data || []);
        setTimeout(() => {
          setSelectedEventDonate(null);
          setDonationSuccessMsg('');
        }, 1500);
      } else {
        addToast('error', res.message || 'Gagal mengirim donasi.', 'Donasi Gagal');
      }
    } catch (err: any) {
      addToast('error', err.message || 'Gagal mengirim donasi.', 'Donasi Gagal');
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

      {/* 2. Top Widescreen Stats Grid (Mode Mobile: Card 1 & 2 dibuat 50% kiri-kanan) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Saldo Dompet (50% di mobile) */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-emerald-500/50 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Dompet Warga</span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Wallet className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-base sm:text-xl lg:text-2xl font-black text-slate-900 tracking-tight truncate">
              Rp {Number(user?.wallet?.balance || 0).toLocaleString('id-ID')}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mt-2 pt-2 border-t border-slate-100">
              <span className="text-[10px] sm:text-[11px] text-emerald-600 font-semibold flex items-center gap-1 truncate">
                <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="truncate">Auto-Kredit Bank Sampah</span>
              </span>
              <button
                onClick={onOpenTopup}
                disabled={!isApproved}
                className="text-[11px] sm:text-xs font-extrabold text-emerald-700 hover:text-emerald-800 disabled:opacity-40 self-end sm:self-auto"
              >
                + Top-Up
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Status Tagihan IPL Akumulatif (50% di mobile) */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-500/50 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
              {totalUnpaidCount > 1 ? 'Total Tagihan IPL' : 'Iuran IPL Warga'}
            </span>
            <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${
              totalUnpaidCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              <CreditCard className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-base sm:text-xl font-black text-slate-900 tracking-tight flex flex-col sm:flex-row sm:items-center gap-1">
              {totalUnpaidCount > 0 ? (
                <>
                  <span className="text-amber-600 truncate">Rp {Number(totalUnpaidAmount).toLocaleString('id-ID')}</span>
                  <span className="text-[9px] sm:text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-full w-fit">
                    {totalUnpaidCount === 1 ? 'Belum Lunas' : `${totalUnpaidCount} Bulan Belum Lunas`}
                  </span>
                </>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-emerald-700 text-xs sm:text-base">Lunas / Bebas Tagihan</span>
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mt-2 pt-2 border-t border-slate-100">
              <span className="text-[10px] sm:text-[11px] text-slate-400 truncate max-w-[180px]">
                {totalUnpaidCount > 1 
                  ? `Akumulasi ${totalUnpaidCount} bulan terbit` 
                  : totalUnpaidCount === 1 && billings[0]?.master
                  ? `Periode ${billings[0].master.period_month}/${billings[0].master.period_year}`
                  : 'Kas RT 01-03 & Rutin RW'}
              </span>
              <button
                onClick={() => onNavigateTab('ipl')}
                className="text-[11px] sm:text-xs font-extrabold text-blue-600 hover:text-blue-700 whitespace-nowrap self-end sm:self-auto"
              >
                Lihat Tagihan
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: Identitas Hunian & Status KK (50% di mobile) */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-500/50 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Unit Rumah & KK</span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <Home className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] sm:text-xs font-black px-1.5 py-0.5 rounded bg-slate-900 text-white shrink-0">
                {user?.house?.house_code || (user?.house ? `RT${user.house.rt_number}-${user.house.block}${user.house.number}` : 'RW 05')}
              </span>
              <span className="text-xs font-bold text-slate-800 truncate">
                {user?.house?.full_address || displayAddress}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mt-2 pt-2 border-t border-slate-100">
              <span className="text-[10px] sm:text-[11px] font-bold truncate">
                {user?.is_head_of_house || user?.kk_type === 'kk_utama' ? (
                  <span className="text-emerald-700 flex items-center gap-1 truncate">
                    <UserCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> <span className="truncate">KK Utama</span>
                  </span>
                ) : user?.kk_type === 'kk_pendukung' ? (
                  <span className="text-teal-700 flex items-center gap-1 truncate">
                    <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> <span className="truncate">KK Tambahan</span>
                  </span>
                ) : (
                  <span className="text-slate-600 truncate">Anggota Keluarga</span>
                )}
              </span>
              <span className="text-[9px] sm:text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded-full w-fit self-end sm:self-auto">
                {user?.role?.toUpperCase()}
              </span>
            </div>

            {(user?.is_head_of_house || user?.kk_type === 'kk_utama') && (
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium truncate hidden sm:inline">KK Tambahan:</span>
                <button
                  type="button"
                  onClick={() => setShowAddKkModal(true)}
                  className="text-[10px] sm:text-[11px] font-extrabold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline ml-auto"
                >
                  <PlusCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                  <span>+ Tambah KK</span>
                </button>
              </div>
            )}

            {user?.house?.kk_pendukung && user.house.kk_pendukung.length > 0 && (
              <div className="mt-1.5 text-[9px] sm:text-[10px] text-teal-800 bg-teal-50 border border-teal-100 p-1.5 rounded-xl font-medium truncate">
                KK: {user.house.kk_pendukung.map((k: any) => k.name).join(', ')}
              </div>
            )}
          </div>
        </div>

        {/* Card 4: Layanan Mandiri Warga (50% di mobile) */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-emerald-500/50 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Layanan Warga</span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
              <FileText className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-xs sm:text-base font-black text-slate-900 tracking-tight truncate">
              {announcements.length > 0 ? `${announcements.length} Agenda Lingkungan` : 'Surat & Aset Fasum'}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mt-2 pt-2 border-t border-slate-100">
              <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">
                Layanan Digital & Balai
              </span>
              <button
                onClick={() => onNavigateTab('layanan')}
                className="text-[11px] sm:text-xs font-extrabold text-teal-700 hover:text-teal-800 whitespace-nowrap self-end sm:self-auto"
              >
                Buka Layanan
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2.5 Banner Akses Fisik e-KTP & Sensor RFID (Tipis & Ringkas) */}
      {user && (
        <div className={`rounded-2xl p-3 sm:p-4 transition border shadow-sm relative overflow-hidden ${
          user?.rfid_uid 
            ? 'bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white border-emerald-500/30' 
            : 'bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-950 text-white border-indigo-500/30'
        }`}>
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
                user?.rfid_uid 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30' 
                  : 'bg-indigo-500/20 text-indigo-400 border border-indigo-400/30 animate-pulse'
              }`}>
                <IdCard className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-black tracking-tight text-white truncate">
                    {user?.rfid_uid ? 'Akses Fisik e-KTP Aktif' : 'Perekaman e-KTP / RFID Warga'}
                  </h3>
                  {user?.rfid_uid ? (
                    <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/40">
                      <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400" />
                      UID: {user.rfid_uid}
                    </span>
                  ) : (
                    <span className="text-[9px] sm:text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/40">
                      Belum Ditautkan
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 truncate leading-tight">
                  {user?.rfid_uid 
                    ? 'Kartu terintegrasi: Gerbang Satpam (90°), Bank Sampah & Posyandu.'
                    : 'Tap kartu e-KTP di scanner ESP32 untuk akses gerbang & layanan mandiri.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
              {user?.rfid_uid ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowKtpModal(true)}
                    className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition border border-white/10"
                  >
                    Ganti Kartu
                  </button>
                  <button
                    type="button"
                    onClick={promptUnpairKtp}
                    disabled={ktpLoading}
                    className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[11px] font-bold transition border border-rose-500/30 disabled:opacity-50"
                  >
                    Lepas
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowKtpModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-[11px] font-black shadow-md transition active:scale-95 flex items-center gap-1.5"
                >
                  <Radio className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                  <span>📲 Tautkan e-KTP</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2.5. SESI ANTREAN KIOS PELAYANAN (SDA PIN 4) - HANYA MUNCUL JIKA SEDANG MELAKUKAN TAP KARTU */}
      {kioskQueueSession?.my_queue && (
        <div className="w-full">
          {kioskQueueSession.is_my_turn ? (
            /* CASE 1: GILIRAN ANDA SEDANG AKTIF! */
            <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 rounded-3xl p-6 text-white shadow-xl border-2 border-emerald-400 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                      <Sparkles className="w-4 h-4" /> MEJA PELAYANAN SEDANG AKTIF
                    </span>
                    <span className="text-xs text-emerald-200 font-bold">
                      Antrean #{kioskQueueSession.my_queue.queue_number}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                    Giliran Anda, {kioskQueueSession.my_queue.citizen_name}!
                  </h3>
                  <p className="text-xs text-emerald-100 max-w-xl">
                    Anda berhasil absen lewat kartu RFID di Kios Pelayanan. Silakan pilih layanan yang ingin Anda lakukan di bawah ini. Begitu selesai, sesi Anda langsung tertutup otomatis untuk melayani antrean warga berikutnya.
                  </p>
                </div>

                <button
                  onClick={() => handleCompleteKioskSession('Selesai Mandiri', 'Warga telah menyelesaikan keperluannya di kios pelayanan.')}
                  disabled={kioskActionLoading}
                  className="px-5 py-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-black text-xs shadow-lg transition active:scale-95 flex items-center gap-2 self-start sm:self-center whitespace-nowrap"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Selesai & Tutup Sesi</span>
                </button>
              </div>

              {/* JIKA ADA DRAF PENGAJUAN / PERMOHONAN YANG SIAP DISAHKAN SEKARANG */}
              {kioskQueueSession.active_pending_items && kioskQueueSession.active_pending_items.total_pending > 0 && (
                <div className="mt-5 p-4 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-ping" />
                      <h4 className="text-xs sm:text-sm font-black text-white">
                        Draf Pengajuan Anda Siap Disahkan Sekarang ({kioskQueueSession.active_pending_items.total_pending})
                      </h4>
                    </div>
                    <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950">
                      Tap KTP Terverifikasi
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100">
                    Kartu e-KTP Anda telah terdeteksi di Meja Kios (SDA Pin 4). Klik tombol legalisasi di bawah ini untuk mengesahkan permohonan secara resmi:
                  </p>

                  <div className="space-y-2 pt-1">
                    {/* 1. Pending Letters */}
                    {kioskQueueSession.active_pending_items.pending_letters?.map((letter: any) => (
                      <div key={`letter-${letter.id}`} className="bg-slate-900/60 rounded-xl p-3 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <FileText className="w-4 h-4 text-blue-300 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-xs text-white">
                              Surat {letter.type.toUpperCase()}: <span className="font-normal text-slate-200">{letter.purpose}</span>
                            </div>
                            <div className="text-[10px] text-emerald-300 mt-0.5">
                              Status: {letter.status === 'rw_approved' ? 'Telah Di-ACC Pengurus RW' : 'Draf Pengajuan'}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleLegalizeKioskItem('letter', letter.id)}
                          disabled={kioskActionLoading}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5 shadow whitespace-nowrap self-end sm:self-center"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Sahkan & Serahkan Surat</span>
                        </button>
                      </div>
                    ))}

                    {/* 2. Pending Asset Loans */}
                    {kioskQueueSession.active_pending_items.pending_loans?.map((loan: any) => (
                      <div key={`loan-${loan.id}`} className="bg-slate-900/60 rounded-xl p-3 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <Package className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-xs text-white">
                              Pinjam {loan.asset?.name || 'Aset Fasum'} ({loan.quantity} Unit)
                            </div>
                            <div className="text-[10px] text-emerald-300 mt-0.5">
                              Periode: {loan.loan_date} s/d {loan.return_date} • Status: Siap Serah Terima Fisik
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleLegalizeKioskItem('loan', loan.id)}
                          disabled={kioskActionLoading}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5 shadow whitespace-nowrap self-end sm:self-center"
                        >
                          <Package className="w-3.5 h-3.5" />
                          <span>Sahkan Akad & Ambil Barang</span>
                        </button>
                      </div>
                    ))}

                    {/* 3. Pending Posyandu Queues */}
                    {kioskQueueSession.active_pending_items.pending_posyandu_queues?.map((pos: any) => (
                      <div key={`pos-${pos.id}`} className="bg-slate-900/60 rounded-xl p-3 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <HeartPulse className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-xs text-white">
                              Antrean Posyandu #{pos.queue_number}: <span className="font-normal text-slate-200">{pos.patient_name} ({pos.category})</span>
                            </div>
                            <div className="text-[10px] text-emerald-300 mt-0.5">
                              Status: Terdaftar • Menunggu Konfirmasi Masuk Meja
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleLegalizeKioskItem('posyandu', pos.id)}
                          disabled={kioskActionLoading}
                          className="px-3.5 py-1.5 rounded-xl bg-rose-400 hover:bg-rose-300 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5 shadow whitespace-nowrap self-end sm:self-center"
                        >
                          <HeartPulse className="w-3.5 h-3.5" />
                          <span>Konfirmasi Hadir di Posyandu</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pilihan Layanan Cepat Sesi Ini */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/20">
                <button
                  onClick={() => setShowKtpModal(true)}
                  className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-left transition group active:scale-95"
                >
                  <IdCard className="w-5 h-5 text-indigo-300 mb-1.5 group-hover:scale-110 transition" />
                  <div className="font-bold text-xs text-white">Registrasi / Tautkan KTP</div>
                  <div className="text-[10px] text-emerald-200">Kaitkan UID kartu fisik ini</div>
                </button>

                <button
                  onClick={() => onNavigateTab('layanan')}
                  className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-left transition group active:scale-95"
                >
                  <Heart className="w-5 h-5 text-rose-300 mb-1.5 group-hover:scale-110 transition" />
                  <div className="font-bold text-xs text-white">Posyandu Digital</div>
                  <div className="text-[10px] text-emerald-200">KMS Balita & Lansia</div>
                </button>

                <button
                  onClick={() => onNavigateTab('pengaduan')}
                  className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-left transition group active:scale-95"
                >
                  <MessageSquareWarning className="w-5 h-5 text-amber-300 mb-1.5 group-hover:scale-110 transition" />
                  <div className="font-bold text-xs text-white">Buat Pengaduan</div>
                  <div className="text-[10px] text-emerald-200">Lapor keluhan / PJU mati</div>
                </button>

                <button
                  onClick={() => onNavigateTab('layanan')}
                  className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-left transition group active:scale-95"
                >
                  <FileText className="w-5 h-5 text-blue-300 mb-1.5 group-hover:scale-110 transition" />
                  <div className="font-bold text-xs text-white">Surat Pengantar</div>
                  <div className="text-[10px] text-emerald-200">Domisili, SKCK, Usaha</div>
                </button>
              </div>
            </div>
          ) : (
            /* CASE 2: ANDA SEDANG MENUNGGU GILIRAN */
            <div className="bg-gradient-to-r from-amber-500 via-orange-600 to-slate-900 rounded-3xl p-5 text-white shadow-lg border border-amber-300/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
                    <Clock className="w-6 h-6 text-amber-200 animate-spin" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                      Antrean Kios Pelayanan • Nomor #{kioskQueueSession.my_queue.queue_number}
                    </div>
                    <div className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                      Mohon Menunggu: Meja Pelayanan Sedang Melayani <span className="underline decoration-amber-300 font-black">{kioskQueueSession.active_session?.citizen_name || 'Antrean Sebelum Anda'}</span>
                    </div>
                    <div className="text-xs text-amber-100/90 mt-0.5">
                      {kioskQueueSession.people_ahead > 0 ? `${kioskQueueSession.people_ahead} orang lagi di depan Anda.` : 'Anda adalah antrean berikutnya!'} Harap standby di dekat Kios.
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleCancelKioskQueue(kioskQueueSession.my_queue.id)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition border border-white/20"
                  >
                    Batalkan Antrean
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Main 2-Column Responsive Widescreen Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Layanan Cepat + Agenda & Pengumuman + Tagihan Aktif */}
        <div className="lg:col-span-8 space-y-6">
          {/* Minimal Quick Action Bar (Fleksibel Resize 4 Kolom di Desktop & Mobile Tanpa Terpotong) */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5 w-full">
            <button
              onClick={() => onNavigateTab('ipl')}
              disabled={!isApproved}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-1.5 sm:px-3 py-2 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 text-[11px] sm:text-xs font-bold text-slate-700 hover:text-emerald-700 shadow-2xs min-w-0 transition active:scale-95"
              title="Bayar IPL"
            >
              <div className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CreditCard className="w-3 h-3" />
              </div>
              <span className="truncate">Bayar IPL</span>
            </button>

            <button
              onClick={() => onNavigateTab('layanan')}
              disabled={!isApproved}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-1.5 sm:px-3 py-2 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 text-[11px] sm:text-xs font-bold text-slate-700 hover:text-blue-700 shadow-2xs min-w-0 transition active:scale-95"
              title="Surat Pengantar"
            >
              <div className="w-5 h-5 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <FileText className="w-3 h-3" />
              </div>
              <span className="truncate">Surat Pengantar</span>
            </button>

            <button
              onClick={() => onNavigateTab('pengaduan')}
              disabled={!isApproved}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-1.5 sm:px-3 py-2 rounded-xl bg-white hover:bg-amber-50 border border-slate-200 text-[11px] sm:text-xs font-bold text-slate-700 hover:text-amber-700 shadow-2xs min-w-0 transition active:scale-95"
              title="Pusat Aduan"
            >
              <div className="w-5 h-5 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <MessageSquareWarning className="w-3 h-3" />
              </div>
              <span className="truncate">Pusat Aduan</span>
            </button>

            <button
              onClick={onOpenPanic}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-1.5 sm:px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[11px] sm:text-xs font-black shadow-2xs min-w-0 transition active:scale-95"
              title="Tombol Darurat Panic"
            >
              <ShieldAlert className="w-3.5 h-3.5 animate-pulse shrink-0" />
              <span className="truncate">PANIC</span>
            </button>
          </div>

          {/* DIAGRAM 1: DIAGRAM STATUS & RIWAYAT PEMBAYARAN IPL (12 BULAN) */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900">
                    Diagram Riwayat IPL Tahun {new Date().getFullYear()}
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Visualisasi status iuran kas RT & RW per bulan
                  </p>
                </div>
              </div>
              {calendarData?.summary && (
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {calendarData.summary.paid_count || 0} / 12 Bulan Lunas
                  </span>
                  <span className="text-xs font-black text-slate-800">
                    {Math.round(((calendarData.summary.paid_count || 0) / Math.max(1, (calendarData.summary.paid_count || 0) + (calendarData.summary.unpaid_count || 0))) * 100)}%
                  </span>
                </div>
              )}
            </div>

            {/* Progress Bar Persentase Pelunasan */}
            <div className="space-y-1">
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.min(100, Math.round(((calendarData?.summary?.paid_count || 0) / 12) * 100))}%` 
                  }}
                />
                <div 
                  className="bg-amber-400 h-full transition-all duration-500"
                  style={{ 
                    width: `${Math.min(100, Math.round(((calendarData?.summary?.unpaid_count || 0) / 12) * 100))}%` 
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>Terbayar: Rp {Number(calendarData?.summary?.total_paid || 0).toLocaleString('id-ID')}</span>
                <span className="text-amber-700 font-bold">
                  Tunggakan: Rp {Number(calendarData?.summary?.total_unpaid || totalUnpaidAmount || 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Diagram Batang 12 Bulan (Jan s/d Des) */}
            <div className="pt-1">
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 sm:gap-2">
                {monthsList.map((m) => {
                  const mData = calendarData?.calendar?.find((c: any) => c.month === m.num);
                  const isPaid = mData?.status === 'paid';
                  const isUnpaid = mData?.status === 'unpaid';
                  const isWaiting = mData?.status === 'waiting_verification';

                  return (
                    <div 
                      key={m.num}
                      onClick={() => isUnpaid && onNavigateTab('ipl')}
                      className={`flex flex-col items-center p-1.5 rounded-xl border text-center transition ${
                        isPaid 
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800' 
                          : isWaiting
                          ? 'bg-blue-50/70 border-blue-200 text-blue-800'
                          : isUnpaid
                          ? 'bg-amber-50/80 border-amber-300 text-amber-900 cursor-pointer hover:scale-105 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                      }`}
                    >
                      <span className="text-[10px] font-black">{m.name}</span>
                      
                      {/* Bar indicator */}
                      <div className="w-full bg-white/60 rounded-full h-7 flex items-end justify-center my-1 overflow-hidden p-0.5">
                        <div 
                          className={`w-full rounded-md transition-all flex items-center justify-center text-[8px] font-bold ${
                            isPaid 
                              ? 'h-full bg-emerald-500 text-white' 
                              : isWaiting
                              ? 'h-4/5 bg-blue-500 text-white'
                              : isUnpaid
                              ? 'h-3/5 bg-amber-500 text-white animate-pulse'
                              : 'h-1/4 bg-slate-300'
                          }`}
                        >
                          {isPaid ? '✓' : isWaiting ? '⌛' : isUnpaid ? '!' : ''}
                        </div>
                      </div>

                      <span className="text-[8px] font-bold tracking-tight">
                        {isPaid ? 'Lunas' : isWaiting ? 'Verif' : isUnpaid ? 'Tagihan' : 'N/A'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 text-[10px] pt-1 border-t border-slate-100 flex-wrap">
              <span className="flex items-center gap-1.5 font-medium text-emerald-800">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Lunas
              </span>
              <span className="flex items-center gap-1.5 font-medium text-amber-800">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Belum Lunas
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span> Belum Terbit
              </span>
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
                        {user?.house?.house_code || (user?.house ? `RT${user.house.rt_number}-${user.house.block}${user.house.number}` : 'RW 05')}
                      </span>
                      <h4 className="font-black text-sm text-slate-900">
                        {user?.house?.full_address || 'Alamat Unit Belum Terdata'}
                      </h4>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Entitas Utama Penagihan IPL & Hak Akses Administrasi RT {user?.house?.rt_number || user?.rt_number || '01'}
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                  Unit Rumah Terdata
                </span>
              </div>

              {/* DIAGRAM 4: KOMPOSISI PENGHUNI RUMAH */}
              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-700 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Diagram Penghuni Unit Rumah</span>
                  </span>
                  <span className="font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                    {familyMembers.length || 1} Jiwa Terdata
                  </span>
                </div>

                {/* Segmented Distribution Bar */}
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden flex">
                  <div 
                    className="bg-emerald-600 h-full transition-all"
                    style={{ width: `${Math.max(25, (kkUtamaMembers.length / Math.max(1, familyMembers.length)) * 100)}%` }}
                    title="KK Utama"
                  />
                  <div 
                    className="bg-teal-500 h-full transition-all"
                    style={{ width: `${(kkPendukungMembers.length / Math.max(1, familyMembers.length)) * 100}%` }}
                    title="KK Tambahan"
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-600">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span> KK Utama ({kkUtamaMembers.length || 1} Jiwa)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-teal-500"></span> KK Tambahan ({kkPendukungMembers.length} Jiwa)
                  </span>
                </div>
              </div>

              {/* KK Breakdown: KK Utama vs KK Pendukung */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* KK Utama Box */}
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-emerald-800 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" /> KK Utama (PJ Rumah)
                    </span>
                    {(user?.is_head_of_house || user?.kk_type === 'kk_utama') && (
                      <span className="text-[9px] bg-emerald-600 text-white font-extrabold px-1.5 py-0.5 rounded">
                        Anda
                      </span>
                    )}
                  </div>
                  <div className="font-black text-sm text-slate-900">
                    {user?.house?.head_of_family?.name || (user?.is_head_of_house ? user?.name : 'Kepala Keluarga')}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    No. KK: <strong className="font-mono">{user?.house?.head_of_family?.no_kk || user?.no_kk || '-'}</strong>
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
                    {user?.kk_type === 'kk_pendukung' && (
                      <span className="text-[9px] bg-teal-600 text-white font-extrabold px-1.5 py-0.5 rounded">
                        Anda
                      </span>
                    )}
                  </div>
                  {user?.house?.kk_pendukung && user.house.kk_pendukung.length > 0 ? (
                    <div className="space-y-1">
                      {user.house.kk_pendukung.map((kk: any) => (
                        <div key={kk.id} className="text-[11px]">
                          <strong className="text-slate-800">{kk.name}</strong>
                          <span className="text-slate-500 font-mono text-[10px] block">No KK: {kk.no_kk || '-'}</span>
                        </div>
                      ))}
                    </div>
                  ) : user?.kk_type === 'kk_pendukung' ? (
                    <div>
                      <div className="font-black text-sm text-slate-900">{user?.name}</div>
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
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => setIsBiodataOpen(!isBiodataOpen)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                    >
                      <span>{isBiodataOpen ? 'Tutup Detail' : 'Lihat Biodata'}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition ${isBiodataOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {(user.is_head_of_house || user.kk_type === 'kk_utama') && (
                      <button
                        type="button"
                        onClick={openProfileModal}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition active:scale-95"
                      >
                        <Edit3 className="w-3 h-3 text-blue-400" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                </div>

                {isBiodataOpen && (
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
                )}
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
                        Dipisahkan berdasarkan Kartu Keluarga (KK Inti & KK Tambahan) pada unit {user?.house?.house_code || 'Hunian Warga'}.
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
                          <span>Kepala Keluarga: <strong className="text-slate-800">{user?.house?.head_of_family?.name || user?.name || '-'}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {(user?.is_head_of_house || user?.kk_type === 'kk_utama') && (
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
                              member.id === user?.id
                                ? 'bg-emerald-50/70 border-emerald-200'
                                : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                member.id === user?.id
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
                                  {member.id === user?.id && (
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
                              {member.id !== user?.id && (user?.is_head_of_house || user?.kk_type === 'kk_utama') && (
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
                              {member.id === user?.id && (
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
                      {(user?.is_head_of_house || user?.kk_type === 'kk_utama') && (
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
                              member.id === user?.id
                                ? 'bg-teal-50/80 border-teal-300'
                                : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                member.id === user?.id
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
                                  {member.id === user?.id && (
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
                              {member.id !== user?.id && (user?.is_head_of_house || user?.kk_type === 'kk_utama') && (
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

        {/* Right Column (4 cols): Riwayat Gerbang Tol + IoT Status + Kontak Pengurus */}
        <div className="lg:col-span-4 space-y-6">
          {/* DIAGRAM 3: Aktivitas Keluar-Masuk Gerbang Tol Warga (SDA Pin 5) - Diagram Batang 7 Hari */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <DoorOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-800">
                    Aktivitas Gerbang Tol (7 Hari)
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Frekuensi tap akses palang otomatis per hari
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {weeklyGateActivity.reduce((acc, curr) => acc + curr.count, 0)}x Tap Minggu Ini
              </span>
            </div>

            {/* Visual Bar Chart: 7 Hari (Sen s/d Min) */}
            <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100">
              {(() => {
                const maxCount = Math.max(1, ...weeklyGateActivity.map((x) => x.count));
                const todayIdx = new Date().getDay();
                // Map js getDay (0 = Min, 1 = Sen) to weeklyGateActivity index: Sen=0, Sel=1, Rab=2, Kam=3, Jum=4, Sab=5, Min=6
                const dayToIdx = [6, 0, 1, 2, 3, 4, 5];
                const currentDayMappedIdx = dayToIdx[todayIdx];

                return (
                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2 items-end pt-2">
                    {weeklyGateActivity.map((item, idx) => {
                      const isToday = idx === currentDayMappedIdx;
                      const heightPercent = item.count > 0 ? Math.max(20, Math.round((item.count / maxCount) * 100)) : 8;
                      return (
                        <div key={item.day} className="flex flex-col items-center gap-1.5">
                          <span className={`text-[10px] font-bold ${item.count > 0 ? 'text-emerald-700' : 'text-slate-300'}`}>
                            {item.count > 0 ? item.count : '0'}
                          </span>
                          <div className="w-full bg-slate-200/60 rounded-lg h-16 flex items-end p-0.5 overflow-hidden">
                            <div
                              className={`w-full rounded-md transition-all duration-500 ${
                                isToday
                                  ? 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-xs'
                                  : item.count > 0
                                  ? 'bg-emerald-500/70'
                                  : 'bg-slate-300/40'
                              }`}
                              style={{ height: `${heightPercent}%` }}
                            />
                          </div>
                          <span className={`text-[10px] font-bold ${isToday ? 'text-emerald-700 font-black underline' : 'text-slate-500'}`}>
                            {item.day}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Riwayat Tap Terakhir Ringkas */}
            {myGateLogs.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Riwayat Tap Terakhir
                </div>
                {myGateLogs.slice(0, 2).map((log: any) => (
                  <div key={log.id} className="p-2 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="font-bold text-slate-700 text-[11px]">{log.post_id || 'Pos Gerbang Utama'}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(log.tapped_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DIAGRAM 2: Diagram Nilai Tukar Bank Sampah Mandiri (Horizontal Bar Chart) */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                  <Recycle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-800">
                    Diagram Nilai Bank Sampah
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Perbandingan kurs rupiah komoditas daur ulang
                  </p>
                </div>
              </div>
              <span className="text-[10px] bg-teal-50 text-teal-700 font-bold px-2 py-0.5 rounded-full border border-teal-200">
                Auto-Kredit Dompet
              </span>
            </div>

            {/* Diagram Batang Horizontal Perbandingan Nilai */}
            <div className="space-y-2.5 pt-1">
              {[
                { name: 'Minyak Jelantah', unit: 'Liter', price: 6000, percent: 100, color: 'bg-amber-500' },
                { name: 'Kaleng / Logam', unit: 'Kg', price: 5000, percent: 83, color: 'bg-indigo-500' },
                { name: 'Botol Plastik PET', unit: 'Kg', price: 2000, percent: 33, color: 'bg-emerald-500' },
                { name: 'Kardus / Kertas', unit: 'Kg', price: 1500, percent: 25, color: 'bg-blue-400' },
              ].map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700 text-[11px]">{item.name}</span>
                    <span className="font-extrabold text-slate-900 text-xs">
                      Rp {item.price.toLocaleString('id-ID')} <span className="text-[10px] text-slate-400 font-normal">/{item.unit}</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full ${item.color} transition-all duration-500`}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-1 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
              <span>📍 Timbang mandiri di Balai Warga</span>
              <span className="font-semibold text-emerald-700">Tap e-KTP langsung cair</span>
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

      {/* Modal Perekaman Mandiri e-KTP (RFID) */}
      {showKtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-inner">
                  <IdCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Pendaftaran e-KTP Fisik Mandiri
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Akun: <span className="font-bold text-slate-800">{user?.name}</span> ({user?.house?.house_code || 'Warga RT'})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowKtpModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold transition"
              >
                ✕
              </button>
            </div>

            {/* Petunjuk Penggunaan */}
            <div className="mt-4 p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl text-[11px] text-blue-900 leading-relaxed">
              💡 <strong>Cara Registrasi Cepat:</strong>
              <ol className="list-decimal list-inside mt-1.5 space-y-1 text-blue-800 font-medium">
                <li>Bawa fisik <strong>e-KTP</strong> atau kartu RFID Anda ke dekat sensor <strong>ESP32</strong> (bisa Kios Balai Warga Mode <em>REG-KTP</em> atau Scanner Meja Satpam).</li>
                <li>Tempelkan (tap) kartu pada scanner RFID. Radar di bawah akan otomatis mendeteksi UID kartu Anda dalam 1 detik!</li>
              </ol>
            </div>

            {/* Pesan Error / Sukses */}
            {ktpError && (
              <div className="mt-3 p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
                {ktpError}
              </div>
            )}

            {ktpSuccess && (
              <div className="mt-3 p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{ktpSuccess}</span>
              </div>
            )}

            {/* Radar Listening Area */}
            <div className="mt-4 p-5 rounded-2xl bg-slate-900 text-white text-center relative overflow-hidden shadow-inner">
              <div className="flex flex-col items-center justify-center relative z-10 py-2">
                <div className="relative mb-3">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    detectedUid ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-400'
                  }`}>
                    {detectedUid ? <CheckCircle2 className="w-8 h-8 text-emerald-400" /> : <Radio className="w-8 h-8 animate-pulse text-indigo-400" />}
                  </div>
                  {!detectedUid && (
                    <span className="absolute inset-0 rounded-full border-2 border-indigo-400/40 animate-ping pointer-events-none"></span>
                  )}
                </div>

                <div className="text-xs font-bold text-slate-300">
                  {detectedUid ? 'KARTU e-KTP TERDETEKSI DARI SCANNER' : 'MENDENGARKAN SCANNER ESP32...'}
                </div>

                {detectedUid ? (
                  <div className="mt-2 text-xl font-mono font-black text-emerald-300 bg-emerald-950/80 px-4 py-1.5 rounded-xl border border-emerald-500/40 tracking-wider">
                    {detectedUid}
                  </div>
                ) : (
                  <div className="mt-1 text-[11px] text-slate-400 animate-pulse">
                    Silakan tempelkan e-KTP Anda ke scanner sekarang...
                  </div>
                )}

                {detectedOwner && (
                  <div className="mt-2.5 p-2 bg-amber-500/20 border border-amber-400/40 rounded-xl text-[11px] text-amber-200 font-medium">
                    ⚠️ Kartu ini saat ini sudah terdaftar milik <strong>{detectedOwner}</strong> ({detectedOwnerHouse || 'Warga'}).
                  </div>
                )}
              </div>
            </div>

            {/* Tombol Tautkan Otomatis (Jika Terdeteksi) */}
            {detectedUid && !detectedOwner && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => handlePairKtp(detectedUid)}
                  disabled={ktpLoading}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{ktpLoading ? 'Menautkan e-KTP...' : `Tautkan e-KTP (${detectedUid}) ke Akun Saya`}</span>
                </button>
              </div>
            )}

            {/* Opsi Input Manual (Fallback untuk Pengujian Tanpa Hardware) */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Atau Masukkan / Ubah UID Kartu Manual (Untuk Uji Coba):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ktpManualUid}
                  onChange={(e) => setKtpManualUid(e.target.value.toUpperCase())}
                  placeholder="Contoh: 04A1B2C3"
                  className="flex-1 text-xs font-mono font-bold px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase"
                />
                <button
                  type="button"
                  onClick={() => handlePairKtp(ktpManualUid)}
                  disabled={ktpLoading || !ktpManualUid.trim()}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition disabled:opacity-40"
                >
                  {ktpLoading ? 'Proses...' : 'Tautkan'}
                </button>
              </div>
            </div>

            {/* Footer Tutup */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowKtpModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Floating Modern Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Modern In-App Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        variant={confirmDialog.variant}
        loading={ktpLoading}
      />
    </div>
  );
}
