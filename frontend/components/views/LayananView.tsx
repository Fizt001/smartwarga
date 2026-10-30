'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { fetchApi } from '@/lib/api';
import { 
  FileText, 
  Store, 
  Landmark, 
  Package, 
  Heart, 
  Baby, 
  Download, 
  Plus, 
  Clock, 
  CheckCircle2, 
  XCircle,
  ExternalLink,
  MessageCircle,
  Calendar,
  AlertCircle,
  Search,
  Syringe,
  Activity,
  HeartPulse,
  HeartHandshake,
  Car,
  Siren,
  Phone,
  Ticket,
  Radio,
  Users,
  IdCard,
  Globe,
  Sparkles
} from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';

interface LayananViewProps {
  currentSubTab?: 'surat' | 'umkm' | 'koperasi' | 'aset' | 'rukam' | 'posyandu';
  onSubTabChange?: (subTab: 'surat' | 'umkm' | 'koperasi' | 'aset' | 'rukam' | 'posyandu') => void;
}

export default function LayananView({ currentSubTab = 'surat', onSubTabChange }: LayananViewProps) {
  const { user } = useAuth();
  const [internalSubTab, setInternalSubTab] = useState<'surat' | 'umkm' | 'koperasi' | 'aset' | 'rukam' | 'posyandu'>(currentSubTab);

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

  useEffect(() => {
    if (currentSubTab) {
      setInternalSubTab(currentSubTab);
    }
  }, [currentSubTab]);

  const subTab = currentSubTab || internalSubTab;

  const isFisikTab = (tab: string) => ['surat', 'aset', 'posyandu'].includes(tab);
  const [activeCategory, setActiveCategory] = useState<'fisik' | 'online'>(
    isFisikTab(subTab) ? 'fisik' : 'online'
  );

  useEffect(() => {
    setActiveCategory(isFisikTab(subTab) ? 'fisik' : 'online');
  }, [subTab]);

  const setSubTab = (newTab: 'surat' | 'umkm' | 'koperasi' | 'aset' | 'rukam' | 'posyandu') => {
    setInternalSubTab(newTab);
    onSubTabChange?.(newTab);
  };

  const handleSwitchCategory = (cat: 'fisik' | 'online') => {
    setActiveCategory(cat);
    if (cat === 'fisik' && !isFisikTab(subTab)) {
      setSubTab('surat');
    } else if (cat === 'online' && isFisikTab(subTab)) {
      setSubTab('umkm');
    }
  };

  // Data states
  const [letters, setLetters] = useState<any[]>([]);
  const [umkmProducts, setUmkmProducts] = useState<any[]>([]);
  const [koperasiLoans, setKoperasiLoans] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [posyanduRecords, setPosyanduRecords] = useState<any[]>([]);
  const [immunizationList, setImmunizationList] = useState<any[]>([]);
  const [elderlyList, setElderlyList] = useState<any[]>([]);
  const [posyanduSection, setPosyanduSection] = useState<'antrean' | 'kms' | 'imunisasi' | 'lansia'>('antrean');
  const [posyanduQueueData, setPosyanduQueueData] = useState<any | null>(null);
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [queueCategory, setQueueCategory] = useState<'balita' | 'lansia' | 'umum'>('balita');
  const [queuePatientName, setQueuePatientName] = useState('');
  const [queuePatientAge, setQueuePatientAge] = useState('');
  const [queueComplaint, setQueueComplaint] = useState('');
  const [queueRfidUid, setQueueRfidUid] = useState('');
  const [isScanningKtpQueue, setIsScanningKtpQueue] = useState(false);

  // RUKAM & Ambulans States
  const [rukamReports, setRukamReports] = useState<any[]>([]);
  const [rukamSummary, setRukamSummary] = useState<any | null>(null);
  const [ambulances, setAmbulances] = useState<any[]>([]);
  const [ambulanceBookings, setAmbulanceBookings] = useState<any[]>([]);
  const [rukamSection, setRukamSection] = useState<'duka' | 'ambulans'>('duka');

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Forms modal states
  const [showSuratModal, setShowSuratModal] = useState(false);
  const [suratType, setSuratType] = useState('domisili');
  const [suratPurpose, setSuratPurpose] = useState('');

  const [showUmkmModal, setShowUmkmModal] = useState(false);
  const [umkmName, setUmkmName] = useState('');
  const [umkmCategory, setUmkmCategory] = useState('Kuliner');
  const [umkmDesc, setUmkmDesc] = useState('');
  const [umkmPrice, setUmkmPrice] = useState(15000);
  const [umkmPhone, setUmkmPhone] = useState('081234567890');
  const [umkmSearch, setUmkmSearch] = useState('');
  const [umkmCategoryFilter, setUmkmCategoryFilter] = useState('Semua');

  const [showKoperasiModal, setShowKoperasiModal] = useState(false);
  const [loanAmount, setLoanAmount] = useState(2000000);
  const [loanTenor, setLoanTenor] = useState(6);
  const [loanPurpose, setLoanPurpose] = useState('Modal usaha warung');

  const [showAssetModal, setShowAssetModal] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [loanQty, setLoanQty] = useState(1);
  const [loanDate, setLoanDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnDate, setReturnDate] = useState(new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]);
  const [donationAmount, setDonationAmount] = useState<number>(0);
  const [myAssetLoans, setMyAssetLoans] = useState<any[]>([]);

  // RUKAM & Ambulans Modal States
  const [showRukamModal, setShowRukamModal] = useState(false);
  const [deceasedName, setDeceasedName] = useState('');
  const [deceasedNik, setDeceasedNik] = useState('');
  const [deceasedAddress, setDeceasedAddress] = useState('');
  const [relation, setRelation] = useState('Orang Tua');
  const [dateOfDeath, setDateOfDeath] = useState(new Date().toISOString().split('T')[0]);
  const [timeOfDeath, setTimeOfDeath] = useState('06:00 WIB');
  const [causeOfDeath, setCauseOfDeath] = useState('Sakit Usia Lanjut');
  const [burialLocation, setBurialLocation] = useState('TPU Pemakaman Warga');
  const [needsAmbulance, setNeedsAmbulance] = useState(true);
  const [needsTentAndChairs, setNeedsTentAndChairs] = useState(true);
  const [rukamNotes, setRukamNotes] = useState('');

  const [showAmbulanceModal, setShowAmbulanceModal] = useState(false);
  const [ambPatientName, setAmbPatientName] = useState('');
  const [ambServiceType, setAmbServiceType] = useState<'emergency' | 'rujukan' | 'jenazah'>('emergency');
  const [ambUrgencyLevel, setAmbUrgencyLevel] = useState<'urgent' | 'scheduled'>('urgent');
  const [ambPickupAddress, setAmbPickupAddress] = useState('');
  const [ambDestinationAddress, setAmbDestinationAddress] = useState('');
  const [ambPickupTime, setAmbPickupTime] = useState('');
  const [ambNotes, setAmbNotes] = useState('');

  // Load relevant data on subTab switch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setAlert(null);
      try {
        if (subTab === 'surat') {
          const res = await fetchApi('/letters');
          if (res.success) setLetters(res.data?.data || []);
        } else if (subTab === 'umkm') {
          const res = await fetchApi('/umkm');
          if (res.success) setUmkmProducts(res.data?.data || []);
        } else if (subTab === 'koperasi') {
          const res = await fetchApi('/koperasi/loans');
          if (res.success) setKoperasiLoans(res.data?.data || []);
        } else if (subTab === 'aset') {
          const res = await fetchApi('/assets');
          if (res.success) setAssets(res.data || []);
          const loansRes = await fetchApi('/assets/loans');
          if (loansRes.success) setMyAssetLoans(loansRes.data?.data || []);
        } else if (subTab === 'rukam') {
          const [rukamRes, sumRes, ambRes, bookRes] = await Promise.all([
            fetchApi('/rukam').catch(() => ({ success: false, data: { data: [] } })),
            fetchApi('/rukam/summary').catch(() => ({ success: false, data: null })),
            fetchApi('/ambulances').catch(() => ({ success: false, data: [] })),
            fetchApi('/ambulances/bookings').catch(() => ({ success: false, data: { data: [] } })),
          ]);
          if (rukamRes.success) setRukamReports(rukamRes.data?.data || []);
          if (sumRes.success) setRukamSummary(sumRes.data);
          if (ambRes.success) setAmbulances(ambRes.data || []);
          if (bookRes.success) setAmbulanceBookings(bookRes.data?.data || []);
        } else if (subTab === 'posyandu') {
          const [kmsRes, imunRes, lansiaRes, queueRes] = await Promise.all([
            fetchApi('/posyandu').catch(() => ({ success: false, data: { data: [] } })),
            fetchApi('/posyandu/immunizations').catch(() => ({ success: false, data: { data: [] } })),
            fetchApi('/posyandu/lansia').catch(() => ({ success: false, data: { data: [] } })),
            fetchApi('/posyandu/queues').catch(() => ({ success: false, data: null })),
          ]);
          if (kmsRes.success) setPosyanduRecords(kmsRes.data?.data || []);
          if (imunRes.success) setImmunizationList(imunRes.data?.data || []);
          if (lansiaRes.success) setElderlyList(lansiaRes.data?.data || []);
          if (queueRes?.success) setPosyanduQueueData(queueRes.data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [subTab]);

  // Handlers
  const handleCreateSurat = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi('/letters', {
        method: 'POST',
        body: JSON.stringify({ type: suratType, purpose: suratPurpose }),
      });
      if (res.success) {
        setAlert({ type: 'success', text: res.message });
        setShowSuratModal(false);
        setSuratPurpose('');
        const refreshed = await fetchApi('/letters');
        if (refreshed.success) setLetters(refreshed.data?.data || []);
      }
    } catch (err: any) {
      setAlert({ type: 'error', text: err.message });
    }
  };

  const handleCreateUmkm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi('/umkm', {
        method: 'POST',
        body: JSON.stringify({
          name: umkmName,
          category: umkmCategory,
          description: umkmDesc,
          price: umkmPrice,
          whatsapp_phone: umkmPhone,
        }),
      });
      if (res.success) {
        setAlert({ type: 'success', text: res.message });
        setShowUmkmModal(false);
        const refreshed = await fetchApi('/umkm');
        if (refreshed.success) setUmkmProducts(refreshed.data?.data || []);
      }
    } catch (err: any) {
      setAlert({ type: 'error', text: err.message });
    }
  };

  const handleApplyLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi('/koperasi/loans', {
        method: 'POST',
        body: JSON.stringify({
          amount: loanAmount,
          tenor_months: loanTenor,
          purpose: loanPurpose,
        }),
      });
      if (res.success) {
        setAlert({ type: 'success', text: res.message });
        setShowKoperasiModal(false);
        const refreshed = await fetchApi('/koperasi/loans');
        if (refreshed.success) setKoperasiLoans(refreshed.data?.data || []);
      }
    } catch (err: any) {
      setAlert({ type: 'error', text: err.message });
    }
  };

  const handleRequestAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId) return;
    try {
      const res = await fetchApi('/assets/loans', {
        method: 'POST',
        body: JSON.stringify({
          asset_id: selectedAssetId,
          quantity: loanQty,
          loan_date: loanDate,
          return_date: returnDate,
          donation_amount: donationAmount,
        }),
      });
      if (res.success) {
        setAlert({ type: 'success', text: res.message });
        setShowAssetModal(false);
        setDonationAmount(0);
        const resAssets = await fetchApi('/assets');
        if (resAssets.success) setAssets(resAssets.data || []);
        const resLoans = await fetchApi('/assets/loans');
        if (resLoans.success) setMyAssetLoans(resLoans.data?.data || []);
      }
    } catch (err: any) {
      setAlert({ type: 'error', text: err.message });
    }
  };

  const handleCreateRukam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi('/rukam', {
        method: 'POST',
        body: JSON.stringify({
          deceased_name: deceasedName,
          deceased_nik: deceasedNik || undefined,
          deceased_address: deceasedAddress,
          relation,
          date_of_death: dateOfDeath,
          time_of_death: timeOfDeath,
          cause_of_death: causeOfDeath,
          burial_location: burialLocation,
          needs_ambulance: needsAmbulance,
          needs_tent_and_chairs: needsTentAndChairs,
          notes: rukamNotes || undefined,
        }),
      });
      if (res.success) {
        setAlert({ type: 'success', text: res.message });
        setShowRukamModal(false);
        setDeceasedName('');
        setDeceasedNik('');
        setDeceasedAddress('');
        const [rRes, sRes, bRes] = await Promise.all([
          fetchApi('/rukam'),
          fetchApi('/rukam/summary'),
          fetchApi('/ambulances/bookings'),
        ]);
        if (rRes.success) setRukamReports(rRes.data?.data || []);
        if (sRes.success) setRukamSummary(sRes.data);
        if (bRes.success) setAmbulanceBookings(bRes.data?.data || []);
      }
    } catch (err: any) {
      setAlert({ type: 'error', text: err.message });
    }
  };

  const handleCreateAmbulanceBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi('/ambulances/bookings', {
        method: 'POST',
        body: JSON.stringify({
          patient_name: ambPatientName,
          service_type: ambServiceType,
          urgency_level: ambUrgencyLevel,
          pickup_address: ambPickupAddress,
          destination_address: ambDestinationAddress,
          pickup_time: ambPickupTime ? ambPickupTime : undefined,
          notes: ambNotes || undefined,
        }),
      });
      if (res.success) {
        setAlert({ type: 'success', text: res.message });
        setShowAmbulanceModal(false);
        setAmbPatientName('');
        setAmbPickupAddress('');
        setAmbDestinationAddress('');
        setAmbNotes('');
        const [bRes, sRes] = await Promise.all([
          fetchApi('/ambulances/bookings'),
          fetchApi('/rukam/summary'),
        ]);
        if (bRes.success) setAmbulanceBookings(bRes.data?.data || []);
        if (sRes.success) setRukamSummary(sRes.data);
      }
    } catch (err: any) {
      setAlert({ type: 'error', text: err.message });
    }
  };

  const handleCancelAmbulanceBooking = (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Batalkan Booking Ambulans?',
      message: 'Apakah Anda yakin ingin membatalkan pemesanan armada ambulans ini?',
      confirmText: 'Ya, Batalkan Booking',
      cancelText: 'Kembali',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          const res = await fetchApi(`/ambulances/bookings/${id}/cancel`, {
            method: 'POST',
          });
          if (res.success) {
            setAlert({ type: 'success', text: res.message });
            const [bRes, aRes] = await Promise.all([
              fetchApi('/ambulances/bookings'),
              fetchApi('/ambulances'),
            ]);
            if (bRes.success) setAmbulanceBookings(bRes.data?.data || []);
            if (aRes.success) setAmbulances(aRes.data || []);
          }
        } catch (err: any) {
          setAlert({ type: 'error', text: err.message });
        }
      },
    });
  };

  const handleTakeQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queuePatientName.trim()) {
      setAlert({ type: 'error', text: 'Nama pasien wajib diisi.' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetchApi('/posyandu/queues', {
        method: 'POST',
        body: JSON.stringify({
          category: queueCategory,
          patient_name: queuePatientName,
          patient_age: queuePatientAge || undefined,
          complaint: queueComplaint || undefined,
          rfid_uid: queueRfidUid || undefined,
        }),
      });
      if (res.success) {
        setAlert({ type: 'success', text: res.message || 'Antrean berhasil diambil!' });
        setShowQueueModal(false);
        setQueuePatientName('');
        setQueuePatientAge('');
        setQueueComplaint('');
        setQueueRfidUid('');
        const qRes = await fetchApi('/posyandu/queues');
        if (qRes.success) setPosyanduQueueData(qRes.data);
      } else {
        setAlert({ type: 'error', text: res.message || 'Gagal mengambil antrean.' });
      }
    } catch (err: any) {
      setAlert({ type: 'error', text: err.message || 'Gagal mengambil antrean posyandu.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelQueue = (queueId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Batalkan Nomor Antrean?',
      message: 'Apakah Anda yakin ingin membatalkan antrean pemeriksaan Posyandu hari ini?',
      confirmText: 'Ya, Batalkan',
      cancelText: 'Kembali',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          const res = await fetchApi(`/posyandu/queues/${queueId}`, { method: 'DELETE' });
          if (res.success) {
            setAlert({ type: 'success', text: 'Nomor antrean berhasil dibatalkan.' });
            const qRes = await fetchApi('/posyandu/queues');
            if (qRes.success) setPosyanduQueueData(qRes.data);
          }
        } catch (err: any) {
          setAlert({ type: 'error', text: err.message || 'Gagal membatalkan antrean.' });
        }
      },
    });
  };

  const handleScanKtpForQueue = async () => {
    setIsScanningKtpQueue(true);
    try {
      const res = await fetchApi('/warga/ktp/latest-scan');
      if (res.success && res.data) {
        setQueueRfidUid(res.data.rfid_uid);
        if (res.data.owner_name && !queuePatientName) {
          setQueuePatientName(res.data.owner_name);
        }
        setAlert({ type: 'success', text: `e-KTP terdeteksi dari ESP32! UID: ${res.data.rfid_uid}` });
      } else {
        setAlert({ type: 'error', text: 'Belum ada kartu e-KTP yang di-tap di reader ESP32 dalam 90 detik terakhir. Silakan tap e-KTP sekarang.' });
      }
    } catch {
      setAlert({ type: 'error', text: 'Gagal menghubungi scanner ESP32.' });
    } finally {
      setIsScanningKtpQueue(false);
    }
  };

  const fisikTabs = [
    { id: 'surat', label: 'Persuratan & SKCK', icon: FileText, desc: 'Draf surat & legalisasi fisik di Balai' },
    { id: 'aset', label: 'Peminjaman Aset', icon: Package, desc: 'Booking inventaris & serah terima barang' },
    { id: 'posyandu', label: 'Posyandu Digital', icon: Baby, desc: 'Antrean meja posyandu & rekam medis' },
  ];

  const onlineTabs = [
    { id: 'umkm', label: 'Etalase UMKM', icon: Store, desc: 'Katalog jualan warga langsung ke WhatsApp' },
    { id: 'koperasi', label: 'Koperasi Warga', icon: Landmark, desc: 'Simpan pinjam & permodalan digital' },
    { id: 'rukam', label: 'RUKAM & Ambulans', icon: HeartHandshake, desc: 'Tanggap lelayu & pemesanan ambulans' },
  ];

  return (
    <div className="space-y-4">
      {/* 1. SEPARASI KATEGORI LAYANAN: FISIK (WAJIB TAP KTP) VS MANDIRI ONLINE */}
      <div className="bg-white rounded-3xl p-3 border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Opsi 1: Layanan Wajib Hadir & Tap KTP */}
          <button
            type="button"
            onClick={() => handleSwitchCategory('fisik')}
            className={`p-3.5 rounded-2xl text-left transition flex items-start gap-3 border ${
              activeCategory === 'fisik'
                ? 'bg-gradient-to-r from-emerald-900 to-teal-900 text-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200/80'
            }`}
          >
            <div className={`p-2.5 rounded-xl shrink-0 ${
              activeCategory === 'fisik' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-200 text-slate-600'
            }`}>
              <IdCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xs sm:text-sm">Layanan Balai & Kios Pelayanan</span>
                <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                  activeCategory === 'fisik' ? 'bg-emerald-400 text-emerald-950' : 'bg-slate-200 text-slate-600'
                }`}>
                  Wajib Tap KTP
                </span>
              </div>
              <p className={`text-[11px] mt-0.5 leading-relaxed ${
                activeCategory === 'fisik' ? 'text-emerald-100/90' : 'text-slate-500'
              }`}>
                Draf via web, proses legalitas & serah terima fisik sah di Reader Kios (SDA 4).
              </p>
            </div>
          </button>

          {/* Opsi 2: Layanan Mandiri Online */}
          <button
            type="button"
            onClick={() => handleSwitchCategory('online')}
            className={`p-3.5 rounded-2xl text-left transition flex items-start gap-3 border ${
              activeCategory === 'online'
                ? 'bg-gradient-to-r from-slate-900 to-blue-950 text-white border-blue-500 shadow-md ring-2 ring-blue-500/20'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200/80'
            }`}
          >
            <div className={`p-2.5 rounded-xl shrink-0 ${
              activeCategory === 'online' ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-200 text-slate-600'
            }`}>
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xs sm:text-sm">Layanan Mandiri Web</span>
                <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                  activeCategory === 'online' ? 'bg-blue-400 text-slate-950' : 'bg-slate-200 text-slate-600'
                }`}>
                  100% Online
                </span>
              </div>
              <p className={`text-[11px] mt-0.5 leading-relaxed ${
                activeCategory === 'online' ? 'text-blue-100/90' : 'text-slate-500'
              }`}>
                Pengajuan tuntas mandiri dari gadget warga tanpa perlu hadir secara fisik ke Balai.
              </p>
            </div>
          </button>
        </div>

        {/* Banner Penjelasan Alur Hukum & Realita Lapangan */}
        <div className={`p-3 rounded-2xl text-xs flex items-start gap-2.5 border ${
          activeCategory === 'fisik'
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
            : 'bg-blue-50 text-blue-900 border-blue-200'
        }`}>
          <div className="shrink-0 mt-0.5 font-bold">
            {activeCategory === 'fisik' ? '🪪' : '💻'}
          </div>
          <div className="leading-relaxed">
            {activeCategory === 'fisik' ? (
              <span>
                <strong>Prinsip Layanan Fisik:</strong> Formulir yang Anda isi di bawah ini berstatus <strong>Draf Pengajuan</strong>. Proses administrasi, serah terima berkas/alat, atau tanda tangan baru dinyatakan <strong>Sah & Resmi</strong> saat Anda hadir langsung di Balai Warga dan menempelkan kartu e-KTP / Kartu Warga di <strong>Reader Kios Pelayanan (SDA Pin 4)</strong>.
              </span>
            ) : (
              <span>
                <strong>Prinsip Layanan Online:</strong> Layanan dalam kategori ini tidak memerlukan kehadiran fisik ke Balai Warga. Transaksi, iklan UMKM, dan permohonan ambulans dapat diselesaikan secara langsung melalui sistem web dan komunikasi WhatsApp.
              </span>
            )}
          </div>
        </div>

        {/* Sub-tab Filtered By Category */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none pt-1 border-t border-slate-100">
          {(activeCategory === 'fisik' ? fisikTabs : onlineTabs).map((item) => {
            const Icon = item.icon;
            const isActive = subTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSubTab(item.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  isActive
                    ? activeCategory === 'fisik' ? 'bg-emerald-700 text-white shadow-sm' : 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {alert && (
        <div className={`p-3 rounded-2xl text-xs font-bold border ${
          alert.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {alert.text}
        </div>
      )}

      {/* 1. PERSURATAN SUBTAB */}
      {subTab === 'surat' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-sm text-slate-800">
              Layanan Surat Pengantar Digital
            </h4>
            <button
              onClick={() => setShowSuratModal(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajukan Surat</span>
            </button>
          </div>

          {letters.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center text-slate-400 text-xs border border-slate-200">
              Belum ada riwayat pengajuan surat pengantar.
            </div>
          ) : (
            letters.map((letItem) => (
              <div key={letItem.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2.5">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      Surat {letItem.type}
                    </span>
                    <h5 className="font-bold text-sm text-slate-800 mt-1">{letItem.purpose}</h5>
                    <div className="text-[11px] text-slate-400">
                      Diajukan: {new Date(letItem.created_at).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                  <div>
                    {letItem.status === 'rw_approved' ? (
                      <div className="text-right space-y-0.5">
                        <span className="bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Siap Diambil di Balai (Wajib Tap KTP)
                        </span>
                        <div className="text-[10px] text-emerald-700 font-medium">
                          Silakan tap e-KTP di Balai untuk serah terima fisik
                        </div>
                      </div>
                    ) : letItem.status === 'rt_approved' ? (
                      <div className="text-right space-y-0.5">
                        <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-blue-600" /> Menunggu Validasi RW
                        </span>
                        <div className="text-[10px] text-slate-400">Telah diverifikasi RT</div>
                      </div>
                    ) : (
                      <div className="text-right space-y-0.5">
                        <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" /> Draf Pengajuan (Menunggu RT)
                        </span>
                        <div className="text-[10px] text-slate-400">Menunggu verifikasi pengurus</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Download PDF button if ready */}
                {letItem.pdf_path && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Surat Sah Elektronik Siap
                    </span>
                    <a
                      href={`/api/letters/${letItem.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh PDF</span>
                    </a>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* 2. ETALASE UMKM SUBTAB */}
      {subTab === 'umkm' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-extrabold text-sm text-slate-800">
                Etalase Produk Warga Mandiri
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Katalog usaha mikro warga RT/RW dengan direct order via WhatsApp.
              </p>
            </div>
            <button
              onClick={() => setShowUmkmModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Jual Produk</span>
            </button>
          </div>

          {/* Search Bar & Category Filter */}
          <div className="space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari produk kuliner, jasa servis, sembako..."
                value={umkmSearch}
                onChange={(e) => setUmkmSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
              {['Semua', 'Kuliner', 'Jasa', 'Fashion', 'Pertanian', 'Lainnya'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setUmkmCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition ${
                    umkmCategoryFilter === cat
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          {umkmProducts
            .filter((prod) => {
              const matchesCat =
                umkmCategoryFilter === 'Semua' ||
                prod.category?.toLowerCase() === umkmCategoryFilter.toLowerCase();
              const matchesSearch =
                !umkmSearch ||
                prod.name?.toLowerCase().includes(umkmSearch.toLowerCase()) ||
                prod.description?.toLowerCase().includes(umkmSearch.toLowerCase()) ||
                prod.category?.toLowerCase().includes(umkmSearch.toLowerCase());
              return matchesCat && matchesSearch;
            }).length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-sm space-y-1">
              <Store className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <div className="font-bold text-xs text-slate-700">Produk Tidak Ditemukan</div>
              <div className="text-[11px] text-slate-400">
                Belum ada produk yang sesuai dengan pencarian atau kategori ini.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {umkmProducts
                .filter((prod) => {
                  const matchesCat =
                    umkmCategoryFilter === 'Semua' ||
                    prod.category?.toLowerCase() === umkmCategoryFilter.toLowerCase();
                  const matchesSearch =
                    !umkmSearch ||
                    prod.name?.toLowerCase().includes(umkmSearch.toLowerCase()) ||
                    prod.description?.toLowerCase().includes(umkmSearch.toLowerCase()) ||
                    prod.category?.toLowerCase().includes(umkmSearch.toLowerCase());
                  return matchesCat && matchesSearch;
                })
                .map((prod) => (
                  <div
                    key={prod.id}
                    className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {prod.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          RT 0{prod.user?.rt_number || '1'}
                        </span>
                      </div>
                      <h5 className="font-bold text-sm text-slate-800 leading-snug mt-1">
                        {prod.name}
                      </h5>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {prod.description}
                      </p>
                      <div className="text-base font-black text-emerald-700 mt-2">
                        Rp {Number(prod.price).toLocaleString('id-ID')}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">
                        Oleh: {prod.user?.name}
                      </span>
                      {prod.whatsapp_link && (
                        <a
                          href={prod.whatsapp_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm transition"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Order WA</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* 3. KOPERASI SUBTAB */}
      {subTab === 'koperasi' && (
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 rounded-2xl">
            <h4 className="font-extrabold text-sm">Koperasi Simpan Pinjam Warga</h4>
            <p className="text-xs text-blue-200 mt-0.5">Bantuan permodalan usaha dan dana talangan darurat warga berizin resmi.</p>
            <button
              onClick={() => setShowKoperasiModal(true)}
              className="mt-3 px-3 py-1.5 bg-white text-blue-900 font-bold text-xs rounded-xl shadow-sm"
            >
              + Ajukan Pinjaman Koperasi
            </button>
          </div>

          <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400 px-1 mt-2">
            Riwayat Pinjaman Anda
          </h5>

          {koperasiLoans.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center text-slate-400 text-xs border border-slate-200">
              Belum ada riwayat pengajuan pinjaman koperasi.
            </div>
          ) : (
            koperasiLoans.map((loan) => (
              <div key={loan.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-800">
                    Rp {Number(loan.amount).toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full uppercase">
                    {loan.status}
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  Tenor: <strong>{loan.tenor_months} Bulan</strong> | Cicilan: <strong>Rp {Number(loan.monthly_installment).toLocaleString('id-ID')}/bln</strong>
                </div>
                <div className="text-xs text-slate-500 italic">"{loan.purpose}"</div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 4. ASET RT SUBTAB */}
      {subTab === 'aset' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-extrabold text-sm text-slate-800">
                Inventaris & Peminjaman Fasum RT/RW
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Pinjam tenda hajatan, sound system portable, kursi lipat, dan terop balai warga.
              </p>
            </div>
          </div>

          {/* Asset List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {assets.map((ast) => (
              <div key={ast.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {ast.category}
                  </span>
                  <h5 className="font-bold text-sm text-slate-800 mt-1">{ast.name}</h5>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Tersedia: <strong className="text-emerald-700">{ast.quantity} Unit</strong> ({ast.condition})
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedAssetId(ast.id);
                    setLoanQty(1);
                    setDonationAmount(0);
                    setShowAssetModal(true);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  Pinjam
                </button>
              </div>
            ))}
          </div>

          {/* My Loans History */}
          <div className="pt-2">
            <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 mb-2">
              Riwayat Peminjaman Aset Saya
            </h5>

            {myAssetLoans.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center text-slate-400 text-xs border border-slate-200">
                Belum ada riwayat peminjaman aset.
              </div>
            ) : (
              <div className="space-y-2">
                {myAssetLoans.map((loan) => (
                  <div key={loan.id} className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-800">{loan.asset?.name}</span>
                        <span className="text-[11px] font-bold text-slate-500">({loan.quantity} Unit)</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Periode: {loan.loan_date} s/d {loan.return_date}
                        {Number(loan.donation_amount) > 0 && ` • Infaq: Rp ${Number(loan.donation_amount).toLocaleString('id-ID')}`}
                      </div>
                    </div>
                    <div>
                      {loan.status === 'requested' && (
                        <div className="text-right space-y-0.5">
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-300 inline-block">
                            Draf Booking (Menunggu ACC RT)
                          </span>
                        </div>
                      )}
                      {loan.status === 'approved' && (
                        <div className="text-right space-y-0.5">
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-300 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Disetujui RT (Wajib Tap KTP di Balai)
                          </span>
                          <div className="text-[10px] text-emerald-700 font-medium">
                            Bawa e-KTP ke Balai untuk serah terima fisik barang
                          </div>
                        </div>
                      )}
                      {loan.status === 'returned' && (
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          Telah Dikembalikan (Sah)
                        </span>
                      )}
                      {loan.status === 'rejected' && (
                        <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          Ditolak
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. POSYANDU DIGITAL SUBTAB */}
      {subTab === 'posyandu' && (
        <div className="space-y-4">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-5 text-white shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <HeartPulse className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base text-white">
                    Posyandu Digital Keluarga
                  </h4>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    Integrasi KMS balita, jadwal imunisasi lengkap, dan pemantauan kesehatan lansia.
                  </p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-white/15 border border-white/20 text-emerald-200">
                Standar Kemenkes
              </span>
            </div>

            {/* Sub-section Switcher */}
            <div className="flex gap-2 pt-2 border-t border-white/15 text-xs font-bold overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setPosyanduSection('antrean')}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                  posyanduSection === 'antrean'
                    ? 'bg-white text-emerald-900 shadow-sm'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>Antrean Posyandu {posyanduQueueData?.my_queue ? '• Aktif' : ''}</span>
              </button>
              <button
                onClick={() => setPosyanduSection('kms')}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                  posyanduSection === 'kms'
                    ? 'bg-white text-emerald-900 shadow-sm'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Baby className="w-3.5 h-3.5" />
                <span>KMS Balita ({posyanduRecords.length})</span>
              </button>
              <button
                onClick={() => setPosyanduSection('imunisasi')}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                  posyanduSection === 'imunisasi'
                    ? 'bg-white text-emerald-900 shadow-sm'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Syringe className="w-3.5 h-3.5" />
                <span>Jadwal Imunisasi ({immunizationList.length})</span>
              </button>
              <button
                onClick={() => setPosyanduSection('lansia')}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                  posyanduSection === 'lansia'
                    ? 'bg-white text-emerald-900 shadow-sm'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Kesehatan Lansia ({elderlyList.length})</span>
              </button>
            </div>
          </div>

          {/* 0. SECTION ANTREAN POSYANDU */}
          {posyanduSection === 'antrean' && (
            <div className="space-y-4">
              {/* Tiket Antrean Saya */}
              {posyanduQueueData?.my_queue ? (
                <div className={`rounded-3xl p-6 text-white shadow-lg border relative overflow-hidden ${
                  posyanduQueueData.my_queue.status === 'calling'
                    ? 'bg-gradient-to-r from-amber-600 to-emerald-700 border-amber-300 animate-pulse'
                    : 'bg-gradient-to-r from-slate-900 to-emerald-950 border-emerald-500/30'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
                        <Ticket className="w-4 h-4" />
                        <span>Tiket Antrean Posyandu Hari Ini</span>
                      </div>
                      <div className="text-4xl font-black mt-2 tracking-tight">
                        {posyanduQueueData.my_queue.queue_number}
                      </div>
                      <div className="text-sm font-semibold text-emerald-100 mt-1">
                        Pasien: <span className="text-white font-bold">{posyanduQueueData.my_queue.patient_name}</span> ({posyanduQueueData.my_queue.category?.toUpperCase()})
                      </div>
                      {posyanduQueueData.my_queue.complaint && (
                        <div className="text-xs text-emerald-200/80 mt-0.5">
                          Keluhan/Tujuan: {posyanduQueueData.my_queue.complaint}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col sm:items-end gap-2">
                      <div className="flex items-center gap-2">
                        {posyanduQueueData.my_queue.status === 'calling' ? (
                          <span className="px-3.5 py-1.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md">
                            <Siren className="w-4 h-4 animate-bounce" /> SEDANG DIPANGGIL!
                          </span>
                        ) : (
                          <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 font-bold text-xs flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> Menunggu Giliran
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleCancelQueue(posyanduQueueData.my_queue.id)}
                        className="text-xs text-rose-300 hover:text-rose-100 font-semibold underline underline-offset-4 mt-2"
                      >
                        Batalkan Tiket Ini
                      </button>
                    </div>
                  </div>
                  {posyanduQueueData.my_queue.status === 'calling' && (
                    <div className="mt-4 pt-3 border-t border-white/20 text-xs font-bold text-amber-200 flex items-center gap-2">
                      📢 Giliran Anda telah dipanggil! Silakan segera menuju meja pemeriksaan Bidan / Kader Posyandu.
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <h5 className="font-extrabold text-base text-slate-800">
                      Ambil Antrean Pemeriksaan Posyandu
                    </h5>
                    <p className="text-xs text-slate-600 max-w-xl">
                      Daftar secara mandiri dari aplikasi atau tap e-KTP di scanner Kios ESP32 untuk mendapatkan nomor urut pemeriksaan Balita & Lansia.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowQueueModal(true)}
                    className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2 whitespace-nowrap active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ambil Antrean Sekarang</span>
                  </button>
                </div>
              )}

              {/* Status Antrean Posyandu Live */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Sedang Dipanggil</div>
                  <div className="text-2xl font-black text-emerald-600 mt-1">
                    {posyanduQueueData?.calling_now?.queue_number || '-'}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    {posyanduQueueData?.calling_now?.patient_name || 'Belum ada panggilan'}
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Menunggu Giliran</div>
                  <div className="text-2xl font-black text-amber-600 mt-1">
                    {posyanduQueueData?.waiting_count || 0}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Pasien dalam antrean</div>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Selesai Diperiksa</div>
                  <div className="text-2xl font-black text-blue-600 mt-1">
                    {posyanduQueueData?.completed_count || 0}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Sudah tercatat KMS</div>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Terdaftar</div>
                  <div className="text-2xl font-black text-slate-800 mt-1">
                    {posyanduQueueData?.total || 0}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Hari ini</div>
                </div>
              </div>

              {/* Tabel Daftar Antrean Hari Ini */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <h5 className="font-extrabold text-sm text-slate-800">Daftar Antrean Hari Ini</h5>
                  </div>
                  <button
                    onClick={async () => {
                      const qRes = await fetchApi('/posyandu/queues');
                      if (qRes.success) setPosyanduQueueData(qRes.data);
                    }}
                    className="text-xs text-slate-500 hover:text-emerald-600 font-semibold"
                  >
                    🔄 Segarkan
                  </button>
                </div>

                {(!posyanduQueueData?.queues || posyanduQueueData.queues.length === 0) ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    Belum ada antrean yang terdaftar hari ini.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {posyanduQueueData.queues.map((q: any) => (
                      <div
                        key={q.id}
                        className={`flex items-center justify-between p-3 rounded-2xl border text-xs transition ${
                          q.status === 'calling'
                            ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold'
                            : q.status === 'completed'
                            ? 'bg-slate-50/70 border-slate-200 text-slate-400'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-black text-sm w-16">{q.queue_number}</span>
                          <div>
                            <div className="font-bold text-slate-900">{q.patient_name}</div>
                            <div className="text-[10px] text-slate-500">
                              Kategori: <span className="capitalize">{q.category}</span> {q.patient_age ? `• Usia: ${q.patient_age}` : ''}
                            </div>
                          </div>
                        </div>
                        <div>
                          {q.status === 'calling' && (
                            <span className="px-2.5 py-1 rounded-full bg-amber-200 text-amber-900 font-bold text-[10px]">
                              📢 Dipanggil
                            </span>
                          )}
                          {q.status === 'waiting' && (
                            <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold text-[10px]">
                              Menunggu
                            </span>
                          )}
                          {q.status === 'completed' && (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                              Selesai
                            </span>
                          )}
                          {q.status === 'cancelled' && (
                            <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-600 text-[10px]">
                              Batal
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 1. SECTION KMS BALITA */}
          {posyanduSection === 'kms' && (
            <div className="space-y-3">
              {posyanduRecords.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-xs border border-slate-200">
                  <Baby className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <div className="font-bold text-slate-700">Belum Ada Catatan KMS Balita</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Data penimbangan balita dari Posyandu atau Terminal IoT Node 3 akan tampil di sini.
                  </div>
                </div>
              ) : (
                posyanduRecords.map((rec) => (
                  <div
                    key={rec.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:border-slate-300 transition space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-black text-sm text-slate-900">{rec.child_name}</h5>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {rec.gender === 'P' ? 'Perempuan' : 'Laki-laki'} • {rec.age_months || 0} Bulan
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Pemeriksaan: {new Date(rec.measured_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {rec.officer?.name && ` oleh ${rec.officer.name}`}
                        </div>
                      </div>

                      {/* KMS Indicator Pill */}
                      <div>
                        {rec.kms_status === 'green' ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Garis Hijau (Normal)
                          </span>
                        ) : rec.kms_status === 'red' ? (
                          <span className="bg-red-100 text-red-800 text-[11px] font-black px-2.5 py-1 rounded-full border border-red-200 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-red-600" /> Bawah Garis Merah (BGM)
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 text-[11px] font-black px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-amber-600" /> Garis Kuning (Waspada)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl text-center">
                      <div className="border-r border-slate-200/60">
                        <div className="text-[10px] text-slate-400 font-bold">Berat Badan</div>
                        <div className="text-base font-black text-slate-900 mt-0.5">{rec.weight_kg} kg</div>
                      </div>
                      <div className="border-r border-slate-200/60">
                        <div className="text-[10px] text-slate-400 font-bold">Tinggi Badan</div>
                        <div className="text-base font-black text-slate-900 mt-0.5">{rec.height_cm} cm</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold">Lingkar Kepala</div>
                        <div className="text-base font-black text-slate-900 mt-0.5">
                          {rec.head_circumference_cm ? `${rec.head_circumference_cm} cm` : '-'}
                        </div>
                      </div>
                    </div>

                    {/* Status Gizi & Edukasi */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                      <div className="text-slate-600">
                        Status Gizi: <strong className="text-slate-900">{rec.nutrition_status || 'Gizi Baik'}</strong>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rec.vitamin_a ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-500'}`}>
                        Vitamin A: {rec.vitamin_a ? 'Sudah Diberikan' : 'Belum Diberikan'}
                      </span>
                    </div>

                    {rec.notes && (
                      <div className="text-[11px] text-slate-500 italic bg-amber-50/70 p-2.5 rounded-xl border border-amber-100">
                        Catatan Kader: "{rec.notes}"
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* 2. SECTION JADWAL IMUNISASI */}
          {posyanduSection === 'imunisasi' && (
            <div className="space-y-3">
              {immunizationList.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-xs border border-slate-200">
                  <Syringe className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <div className="font-bold text-slate-700">Belum Ada Jadwal Imunisasi</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Jadwal vaksinasi anak keluarga Anda akan dirilis dan diperbarui oleh Kader Posyandu.
                  </div>
                </div>
              ) : (
                immunizationList.map((imun) => (
                  <div
                    key={imun.id}
                    className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          {imun.vaccine_name}
                        </span>
                        <h6 className="font-bold text-sm text-slate-900">{imun.child_name}</h6>
                      </div>
                      <div className="text-xs text-slate-500">
                        Target Usia: <strong>{imun.target_age_months} Bulan</strong> • Jadwal: {new Date(imun.scheduled_date).toLocaleDateString('id-ID')}
                      </div>
                      {imun.administered_date && (
                        <div className="text-[11px] text-emerald-600 font-bold">
                          Diberikan pada: {new Date(imun.administered_date).toLocaleDateString('id-ID')}
                          {imun.batch_number && ` (Batch #${imun.batch_number})`}
                        </div>
                      )}
                    </div>

                    <div>
                      {imun.status === 'completed' ? (
                        <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Menunggu
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 3. SECTION KESEHATAN LANSIA */}
          {posyanduSection === 'lansia' && (
            <div className="space-y-3">
              {elderlyList.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-xs border border-slate-200">
                  <Activity className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <div className="font-bold text-slate-700">Belum Ada Rekam Medis Lansia</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Hasil pemeriksaan tensi darah, gula darah, dan kolesterol lansia keluarga akan tampil di sini.
                  </div>
                </div>
              ) : (
                elderlyList.map((lansia) => (
                  <div
                    key={lansia.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-black text-sm text-slate-900">{lansia.elderly_name}</h5>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {lansia.age} Tahun • {lansia.gender === 'P' ? 'Perempuan' : 'Laki-laki'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Diperiksa: {new Date(lansia.examined_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>

                      {/* Blood Pressure Badge */}
                      <span
                        className={`text-[11px] font-black px-2.5 py-1 rounded-full border ${
                          lansia.blood_pressure_status === 'normal'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : lansia.blood_pressure_status === 'prehypertension'
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-red-100 text-red-800 border-red-200'
                        }`}
                      >
                        Tensi: {lansia.systolic}/{lansia.diastolic} mmHg
                      </span>
                    </div>

                    {/* Biomarkers Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-2xl text-xs">
                      <div>
                        <div className="text-slate-400 text-[10px]">Gula Darah (GDS)</div>
                        <div className="font-black text-slate-900 mt-0.5">
                          {lansia.blood_sugar ? `${lansia.blood_sugar} mg/dL` : '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px]">Kolesterol Total</div>
                        <div className="font-black text-slate-900 mt-0.5">
                          {lansia.cholesterol ? `${lansia.cholesterol} mg/dL` : '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px]">Asam Urat</div>
                        <div className="font-black text-slate-900 mt-0.5">
                          {lansia.uric_acid ? `${lansia.uric_acid} mg/dL` : '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px]">Lingkar Perut</div>
                        <div className="font-black text-slate-900 mt-0.5">
                          {lansia.waist_circumference_cm ? `${lansia.waist_circumference_cm} cm` : '-'}
                        </div>
                      </div>
                    </div>

                    {/* Assessment & Recommendations */}
                    <div className="text-xs space-y-1 pt-1">
                      <div className="text-slate-700">
                        Diagnosa Awal: <strong className="text-slate-900">{lansia.risk_assessment}</strong>
                      </div>
                      {lansia.recommendations && (
                        <div className="text-[11px] text-teal-800 bg-teal-50 p-2.5 rounded-xl border border-teal-100">
                          Saran Kader: "{lansia.recommendations}"
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* 6. RUKAM & AMBULANS SIAGA SUBTAB */}
      {subTab === 'rukam' && (
        <div className="space-y-4">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 rounded-3xl p-5 text-white shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <HeartHandshake className="w-5 h-5 text-rose-300" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base text-white">
                    RUKAM & Ambulans Siaga Warga
                  </h4>
                  <p className="text-xs text-rose-200 mt-0.5">
                    Layanan kepedulian duka cita, santunan kas RT/RW, dan armada darurat 24 jam.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={() => setShowRukamModal(true)}
                  className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-950/40 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Lapor Duka</span>
                </button>
                <button
                  onClick={() => setShowAmbulanceModal(true)}
                  className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition"
                >
                  <Siren className="w-3.5 h-3.5" />
                  <span>Panggil Ambulans</span>
                </button>
              </div>
            </div>

            {/* Quick KPI Stats & Hotline */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/15 text-xs">
              <div className="bg-white/10 rounded-2xl p-2.5 backdrop-blur-sm">
                <div className="text-[10px] text-rose-200">Santunan RUKAM</div>
                <div className="text-xs sm:text-sm font-black text-white mt-0.5">
                  Rp 1.500.000 <span className="text-[10px] font-normal text-rose-200">/ jiwa</span>
                </div>
              </div>
              <div className="bg-white/10 rounded-2xl p-2.5 backdrop-blur-sm">
                <div className="text-[10px] text-rose-200">Total Santunan Kas</div>
                <div className="text-xs sm:text-sm font-black text-emerald-300 mt-0.5">
                  Rp {(rukamSummary?.total_disbursed_nominal || 0).toLocaleString('id-ID')}
                </div>
              </div>
              <div className="bg-white/10 rounded-2xl p-2.5 backdrop-blur-sm">
                <div className="text-[10px] text-rose-200">Armada Siaga Siap</div>
                <div className="text-xs sm:text-sm font-black text-amber-300 mt-0.5">
                  {rukamSummary?.ambulances_available ?? ambulances.filter(a => a.status === 'available').length} Unit Siap
                </div>
              </div>
              <div className="bg-white/10 rounded-2xl p-2.5 backdrop-blur-sm flex items-center gap-2">
                <Phone className="w-4 h-4 text-rose-300 shrink-0" />
                <div>
                  <div className="text-[10px] text-rose-200">Call Center 24 Jam</div>
                  <div className="text-[11px] font-black text-white">0811-9988-7766</div>
                </div>
              </div>
            </div>

            {/* Section Switcher */}
            <div className="flex gap-2 pt-1 border-t border-white/15 text-xs font-bold">
              <button
                onClick={() => setRukamSection('duka')}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                  rukamSection === 'duka'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>Kabar Duka & Santunan ({rukamReports.length})</span>
              </button>
              <button
                onClick={() => setRukamSection('ambulans')}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                  rukamSection === 'ambulans'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>Armada & Booking Ambulans ({ambulanceBookings.length})</span>
              </button>
            </div>
          </div>

          {/* SECTION 1: KABAR DUKA & SANTUNAN */}
          {rukamSection === 'duka' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                  Kabar Duka Cita & Status Santunan Warga
                </h5>
                <button
                  onClick={() => setShowRukamModal(true)}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Buat Laporan Baru</span>
                </button>
              </div>

              {rukamReports.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80">
                  <HeartHandshake className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">Belum ada laporan duka cita warga</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Semoga seluruh warga senantiasa diberikan kesehatan dan keberkahan.</p>
                </div>
              ) : (
                rukamReports.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-3 hover:border-slate-300 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-rose-900 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                            Berita Duka
                          </span>
                          <h5 className="font-black text-sm text-slate-900">
                            Alm/Almh. {item.deceased_name}
                          </h5>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                          <div>
                            Alamat Duka: <strong>{item.deceased_address}</strong>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-400">
                            <span>Wafat: {new Date(item.date_of_death).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} {item.time_of_death ? `(${item.time_of_death})` : ''}</span>
                            {item.cause_of_death && <span>• Penyebab: {item.cause_of_death}</span>}
                            {item.burial_location && <span>• Pemakaman: {item.burial_location}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Status Santunan Badge */}
                      <div className="self-start sm:self-auto">
                        <span
                          className={`text-[11px] font-black px-3 py-1 rounded-full border ${
                            item.status === 'disbursed'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : item.status === 'verified'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {item.status === 'disbursed'
                            ? 'Santunan Dicairkan'
                            : item.status === 'verified'
                            ? 'Terverifikasi (Siap Cair)'
                            : 'Menunggu Verifikasi'}
                        </span>
                      </div>
                    </div>

                    {/* Assistance Requirements & Financial Aid Card */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400">Pelapor / Keluarga</div>
                        <div className="font-bold text-slate-800 mt-0.5">
                          {item.reporter?.name ?? 'Warga'} ({item.relation})
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">Bantuan Diperlukan</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.needs_ambulance && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                              Ambulans Jenazah
                            </span>
                          )}
                          {item.needs_tent_and_chairs && (
                            <span className="text-[10px] font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                              Tenda & Kursi RT
                            </span>
                          )}
                          {!item.needs_ambulance && !item.needs_tent_and_chairs && (
                            <span className="text-slate-500 text-[11px]">-</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">Santunan Duka Kas RT</div>
                        <div className="font-black text-rose-700 mt-0.5">
                          Rp {(Number(item.disbursement_amount) || 1500000).toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>

                    {item.notes && (
                      <div className="text-[11px] text-slate-600 bg-rose-50/50 p-2.5 rounded-xl border border-rose-100">
                        Catatan Duka: "{item.notes}"
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* SECTION 2: ARMADA & BOOKING AMBULANS */}
          {rukamSection === 'ambulans' && (
            <div className="space-y-4">
              {/* Fleet status cards */}
              <div>
                <h5 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider mb-2">
                  Daftar Armada Ambulans Siaga Warga
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ambulances.length === 0 ? (
                    <div className="bg-white rounded-2xl p-4 border border-slate-200 text-center col-span-2 text-xs text-slate-500">
                      Belum ada armada terdaftar. Silakan hubungi pengurus RT/RW.
                    </div>
                  ) : (
                    ambulances.map((amb) => (
                      <div
                        key={amb.id}
                        className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-start justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Car className="w-4 h-4 text-slate-700" />
                            <h6 className="font-extrabold text-xs text-slate-900">{amb.name}</h6>
                            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded">
                              {amb.vehicle_number}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Tipe: <strong className="capitalize">{amb.type}</strong>
                          </div>
                          {amb.driver_name && (
                            <div className="text-[11px] text-slate-600 flex items-center gap-1">
                              <span>Driver: {amb.driver_name}</span>
                              {amb.driver_phone && <span className="text-slate-400">({amb.driver_phone})</span>}
                            </div>
                          )}
                        </div>

                        <span
                          className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                            amb.status === 'available'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : amb.status === 'in_service'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-red-50 text-red-800 border-red-200'
                          }`}
                        >
                          {amb.status === 'available'
                            ? 'Siap Siaga'
                            : amb.status === 'in_service'
                            ? 'Sedang Bertugas'
                            : 'Perawatan'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Bookings List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                    Riwayat Permintaan & Tugas Ambulans
                  </h5>
                  <button
                    onClick={() => setShowAmbulanceModal(true)}
                    className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Panggil Ambulans Baru</span>
                  </button>
                </div>

                {ambulanceBookings.length === 0 ? (
                  <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80">
                    <Car className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-600">Belum ada riwayat booking ambulans</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Gunakan tombol "Panggil Ambulans" untuk kebutuhan darurat atau rujukan.</p>
                  </div>
                ) : (
                  ambulanceBookings.map((b) => (
                    <div
                      key={b.id}
                      className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                              {b.booking_code}
                            </span>
                            <h6 className="font-black text-sm text-slate-900">{b.patient_name}</h6>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                                b.urgency_level === 'urgent'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {b.urgency_level === 'urgent' ? 'Darurat (Urgent)' : 'Terjadwal'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                            <div>Jemput: <strong>{b.pickup_address}</strong></div>
                            <div>Tujuan: <strong>{b.destination_address}</strong></div>
                          </div>
                        </div>

                        {/* Status Badge & Actions */}
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <span
                            className={`text-[11px] font-black px-3 py-1 rounded-full border ${
                              b.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : b.status === 'dispatched'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : b.status === 'cancelled'
                                ? 'bg-slate-100 text-slate-600 border-slate-200'
                                : 'bg-blue-50 text-blue-800 border-blue-200'
                            }`}
                          >
                            {b.status === 'completed'
                              ? 'Tugas Selesai'
                              : b.status === 'dispatched'
                              ? 'Armada Meluncur'
                              : b.status === 'cancelled'
                              ? 'Dibatalkan'
                              : 'Menunggu Disposisi'}
                          </span>

                          {b.status === 'requested' && b.user_id === user?.id && (
                            <button
                              onClick={() => handleCancelAmbulanceBooking(b.id)}
                              className="text-[11px] font-bold text-red-600 hover:text-red-700 px-2 py-1 rounded-lg border border-red-200 hover:bg-red-50 transition"
                            >
                              Batalkan
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Driver & Vehicle Dispatched Info */}
                      {b.status === 'dispatched' && (
                        <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                          <div className="flex items-center gap-2">
                            <Siren className="w-4 h-4 text-amber-700 animate-pulse" />
                            <div>
                              <span className="font-bold text-amber-950">
                                {b.ambulance?.name ?? 'Ambulans Siaga'} ({b.ambulance?.vehicle_number ?? '-'})
                              </span>
                              <div className="text-[11px] text-amber-800">
                                Driver: {b.driver_name || 'Petugas Siaga RW'} • Telp: {b.driver_phone || '081234567890'}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-1 rounded-lg">
                            Sedang Meluncur
                          </span>
                        </div>
                      )}

                      {b.notes && (
                        <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl">
                          Catatan: "{b.notes}"
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Surat */}
      {showSuratModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-black text-slate-900 mb-1">Pengajuan Surat Pengantar</h3>
            <p className="text-xs text-slate-500 mb-4">Surat akan diverifikasi RT lalu divalidasi oleh Ketua RW.</p>
            <form onSubmit={handleCreateSurat} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Surat:</label>
                <select
                  value={suratType}
                  onChange={(e) => setSuratType(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-300"
                >
                  <option value="domisili">Surat Keterangan Domisili</option>
                  <option value="skck">Surat Pengantar SKCK</option>
                  <option value="sktm">Surat Keterangan Tidak Mampu (SKTM)</option>
                  <option value="lainnya">Surat Keterangan Umum Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Keperluan Pengantar:</label>
                <textarea
                  value={suratPurpose}
                  onChange={(e) => setSuratPurpose(e.target.value)}
                  placeholder="Contoh: Mengurus perpanjangan SIM / pembukaan rekening bank"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 h-24"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowSuratModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  Kirim Pengajuan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal UMKM */}
      {showUmkmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-black text-slate-900 mb-1">Tambah Produk UMKM Warga</h3>
            <form onSubmit={handleCreateUmkm} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Produk / Jasa:</label>
                <input
                  type="text"
                  value={umkmName}
                  onChange={(e) => setUmkmName(e.target.value)}
                  placeholder="Contoh: Donat Kentang Lembut Isi Coklat"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori:</label>
                  <input
                    type="text"
                    value={umkmCategory}
                    onChange={(e) => setUmkmCategory(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Harga (Rp):</label>
                  <input
                    type="number"
                    value={umkmPrice}
                    onChange={(e) => setUmkmPrice(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nomor WhatsApp:</label>
                <input
                  type="text"
                  value={umkmPhone}
                  onChange={(e) => setUmkmPhone(e.target.value)}
                  placeholder="08123456789"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi:</label>
                <textarea
                  value={umkmDesc}
                  onChange={(e) => setUmkmDesc(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 h-20"
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUmkmModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  Pasang Iklan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Koperasi */}
      {showKoperasiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-black text-slate-900 mb-1">Simulasi Pinjaman Koperasi</h3>
            <form onSubmit={handleApplyLoan} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Pinjaman (Rp):</label>
                <input
                  type="number"
                  min={500000}
                  max={10000000}
                  step={500000}
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="w-full text-sm font-bold px-3 py-2.5 rounded-xl border border-slate-300"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilihan Tenor:</label>
                <select
                  value={loanTenor}
                  onChange={(e) => setLoanTenor(Number(e.target.value))}
                  className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-300"
                >
                  <option value={3}>3 Bulan</option>
                  <option value={6}>6 Bulan</option>
                  <option value={12}>12 Bulan</option>
                  <option value={24}>24 Bulan</option>
                </select>
              </div>
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs space-y-1">
                <div className="text-slate-600">Perkiraan Angsuran Bulanan:</div>
                <div className="text-base font-black text-indigo-900">
                  Rp {Math.round((loanAmount / loanTenor) + (loanAmount * 0.01)).toLocaleString('id-ID')} / bulan
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tujuan / Keperluan Pinjaman:</label>
                <input
                  type="text"
                  value={loanPurpose}
                  onChange={(e) => setLoanPurpose(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowKoperasiModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                >
                  Ajukan Pinjaman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Aset */}
      {showAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-black text-slate-900 mb-1">Pinjam Aset Fasum</h3>
            <p className="text-xs text-slate-500 mb-3">
              {assets.find(a => a.id === selectedAssetId)?.name} (Tersedia: {assets.find(a => a.id === selectedAssetId)?.quantity} unit)
            </p>
            <form onSubmit={handleRequestAsset} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Unit:</label>
                <input
                  type="number"
                  min={1}
                  max={assets.find(a => a.id === selectedAssetId)?.quantity || 100}
                  value={loanQty}
                  onChange={(e) => setLoanQty(Number(e.target.value))}
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tgl Pinjam:</label>
                  <input
                    type="date"
                    value={loanDate}
                    onChange={(e) => setLoanDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tgl Kembali:</label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Infaq / Kas Pemeliharaan Sukarela (Rp):</label>
                <input
                  type="number"
                  min={0}
                  step={5000}
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(Number(e.target.value))}
                  placeholder="Contoh: 25000 (Sukarela)"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                />
                <span className="text-[10px] text-slate-400">Digunakan untuk perawatan kain terpal/kabel/kebersihan aset.</span>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssetModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20"
                >
                  Ajukan Peminjaman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Lapor Duka Cita (RUKAM) */}
      {showRukamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative my-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Laporan Duka Cita (RUKAM)</h3>
                <p className="text-xs text-slate-500">Santunan kas RT/RW Rp 1.500.000 & pendampingan pemulasaran.</p>
              </div>
            </div>

            <form onSubmit={handleCreateRukam} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Alm/Almh:</label>
                  <input
                    type="text"
                    required
                    value={deceasedName}
                    onChange={(e) => setDeceasedName(e.target.value)}
                    placeholder="Nama lengkap almarhum/almh"
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">NIK (Opsional):</label>
                  <input
                    type="text"
                    value={deceasedNik}
                    onChange={(e) => setDeceasedNik(e.target.value)}
                    placeholder="16 digit NIK almarhum"
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hubungan Keluarga:</label>
                  <select
                    value={relation}
                    onChange={(e) => setRelation(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-300"
                  >
                    <option value="Orang Tua">Orang Tua (Ayah / Ibu)</option>
                    <option value="Suami / Istri">Suami / Istri</option>
                    <option value="Anak">Anak</option>
                    <option value="Saudara Kandung">Saudara Kandung</option>
                    <option value="Mertua">Mertua</option>
                    <option value="Kerabat">Kerabat Dekat</option>
                    <option value="Tetangga">Warga / Tetangga</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Penyebab Wafat:</label>
                  <input
                    type="text"
                    value={causeOfDeath}
                    onChange={(e) => setCauseOfDeath(e.target.value)}
                    placeholder="Contoh: Sakit Lansia / Sakit"
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Rumah Duka:</label>
                <input
                  type="text"
                  required
                  value={deceasedAddress}
                  onChange={(e) => setDeceasedAddress(e.target.value)}
                  placeholder="Contoh: Jl. Melati Blok C No. 12, RT 03"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Wafat:</label>
                  <input
                    type="date"
                    required
                    value={dateOfDeath}
                    onChange={(e) => setDateOfDeath(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jam Wafat:</label>
                  <input
                    type="text"
                    value={timeOfDeath}
                    onChange={(e) => setTimeOfDeath(e.target.value)}
                    placeholder="Contoh: 04:30 WIB"
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rencana Pemakaman / TPU:</label>
                <input
                  type="text"
                  value={burialLocation}
                  onChange={(e) => setBurialLocation(e.target.value)}
                  placeholder="Contoh: TPU Karet Bivak / TPU Semper (Ba'da Ashar)"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300"
                />
              </div>

              {/* Bantuan Layanan Pendukung */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                  Bantuan Layanan Fasum & Armada:
                </span>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={needsAmbulance}
                    onChange={(e) => setNeedsAmbulance(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600"
                  />
                  <span>Permintaan Armada Ambulans Jenazah RT/RW</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={needsTentAndChairs}
                    onChange={(e) => setNeedsTentAndChairs(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600"
                  />
                  <span>Permintaan Pemasangan Tenda & Kursi Duka Warga</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Tambahan (Opsional):</label>
                <textarea
                  value={rukamNotes}
                  onChange={(e) => setRukamNotes(e.target.value)}
                  placeholder="Kebutuhan mendesak lainnya..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 h-16"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRukamModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/30"
                >
                  Kirim Laporan Duka
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Panggil / Booking Ambulans */}
      {showAmbulanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative my-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
                <Siren className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Panggil Ambulans Siaga</h3>
                <p className="text-xs text-slate-500">Armada darurat & rujukan rumah sakit 24 jam gratis untuk warga.</p>
              </div>
            </div>

            <form onSubmit={handleCreateAmbulanceBooking} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pasien / Jenazah:</label>
                <input
                  type="text"
                  required
                  value={ambPatientName}
                  onChange={(e) => setAmbPatientName(e.target.value)}
                  placeholder="Nama lengkap pasien yang membutuhkan"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Layanan:</label>
                  <select
                    value={ambServiceType}
                    onChange={(e) => setAmbServiceType(e.target.value as any)}
                    className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-300"
                  >
                    <option value="emergency">Darurat Medis / Melahirkan</option>
                    <option value="rujukan">Antar Rujukan ke RS</option>
                    <option value="jenazah">Antar Jenazah ke TPU/Duka</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tingkat Urgensi:</label>
                  <select
                    value={ambUrgencyLevel}
                    onChange={(e) => setAmbUrgencyLevel(e.target.value as any)}
                    className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-300"
                  >
                    <option value="urgent">🚨 DARURAT (Meluncur Segera)</option>
                    <option value="scheduled">📅 Terjadwal (Sesuai Waktu)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Penjemputan:</label>
                <input
                  type="text"
                  required
                  value={ambPickupAddress}
                  onChange={(e) => setAmbPickupAddress(e.target.value)}
                  placeholder="Contoh: Jl. Mawar Blok B No. 4, RT 02"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Tujuan (RS / Puskesmas / TPU):</label>
                <input
                  type="text"
                  required
                  value={ambDestinationAddress}
                  onChange={(e) => setAmbDestinationAddress(e.target.value)}
                  placeholder="Contoh: RSUD Pasar Minggu / IGD RS Fatmawati"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Waktu Jemput (Jika Terjadwal):</label>
                <input
                  type="datetime-local"
                  value={ambPickupTime}
                  onChange={(e) => setAmbPickupTime(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Kebutuhan Pasien (Oksigen / Brankar):</label>
                <textarea
                  value={ambNotes}
                  onChange={(e) => setAmbNotes(e.target.value)}
                  placeholder="Contoh: Pasien sesak napas butuh oksigen aktif dan brankar tidur."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 h-16"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAmbulanceModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-black shadow-md shadow-amber-500/20"
                >
                  Kirim Permintaan Ambulans
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ambil Antrean Posyandu */}
      {showQueueModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-800 text-base">Ambil Antrean Posyandu</h3>
              </div>
              <button
                onClick={() => setShowQueueModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTakeQueue} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Pemeriksaan:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setQueueCategory('balita')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      queueCategory === 'balita'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    👶 Balita
                  </button>
                  <button
                    type="button"
                    onClick={() => setQueueCategory('lansia')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      queueCategory === 'lansia'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    👵 Lansia
                  </button>
                  <button
                    type="button"
                    onClick={() => setQueueCategory('umum')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      queueCategory === 'umum'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    🩺 Umum
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pasien (Balita / Lansia / Warga):</label>
                <input
                  type="text"
                  required
                  value={queuePatientName}
                  onChange={(e) => setQueuePatientName(e.target.value)}
                  placeholder="Contoh: Balita Muhammad / Ibu Siti Aminah"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Usia Pasien (Bulan / Tahun):</label>
                <input
                  type="text"
                  value={queuePatientAge}
                  onChange={(e) => setQueuePatientAge(e.target.value)}
                  placeholder="Contoh: 18 Bulan atau 68 Tahun"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Keluhan / Keperluan Pemeriksaan:</label>
                <textarea
                  value={queueComplaint}
                  onChange={(e) => setQueueComplaint(e.target.value)}
                  placeholder="Contoh: Timbang KMS bulanan, imunisasi campak, atau cek tensi & gula darah."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 h-16 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Integrasi Tap e-KTP Scanner ESP32 */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                    <span>Verifikasi e-KTP / Kartu RFID (Opsional):</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleScanKtpForQueue}
                    disabled={isScanningKtpQueue}
                    className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-bold transition flex items-center gap-1"
                  >
                    {isScanningKtpQueue ? '⏳ Memeriksa...' : '📡 Pindai dari ESP32'}
                  </button>
                </div>
                <input
                  type="text"
                  value={queueRfidUid}
                  onChange={(e) => setQueueRfidUid(e.target.value)}
                  placeholder="UID Kartu (Otomatis terisi jika tap di ESP32)"
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 font-mono"
                />
                <p className="text-[10px] text-slate-500">
                  Tip: Tap e-KTP Anda di reader ESP32 (SDA Pin 4 atau Pin 5), lalu klik tombol di atas untuk mengisi UID secara otomatis.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQueueModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition"
                >
                  {loading ? 'Memproses...' : 'Dapatkan Nomor Antrean'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
      />
    </div>
  );
}
