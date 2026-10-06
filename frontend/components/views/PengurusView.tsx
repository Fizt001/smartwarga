'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { fetchApi } from '@/lib/api';
import { 
  ShieldCheck, 
  Users, 
  CreditCard, 
  FileCheck2, 
  Wallet, 
  Check, 
  X, 
  Building, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Layers,
  Receipt,
  Zap,
  RefreshCw,
  Home,
  Search,
  MapPin,
  UserCheck,
  Building2,
  Tag,
  Calendar,
  Info,
  Shield,
  Truck,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Package,
  Plus,
  Landmark,
  Store,
  MessageCircle,
  Baby,
  Syringe,
  HeartPulse,
  Activity,
  HeartHandshake,
  Car,
  Siren,
  Phone
} from 'lucide-react';

interface PengurusViewProps {
  currentSubTab?: 'sensus' | 'ipl' | 'kegiatan' | 'surat' | 'approval' | 'topup' | 'aset' | 'koperasi' | 'posyandu' | 'rukam';
  onSubTabChange?: (tab: 'sensus' | 'ipl' | 'kegiatan' | 'surat' | 'approval' | 'topup' | 'aset' | 'koperasi' | 'posyandu' | 'rukam') => void;
}

export default function PengurusView({ currentSubTab, onSubTabChange }: PengurusViewProps = {}) {
  const { user } = useAuth();
  
  // Default subTab based on Pengurus Role
  const initialTab = user?.role === 'bendahara' 
    ? 'ipl' 
    : user?.role === 'sekretaris' 
    ? 'kegiatan' 
    : 'sensus';

  const [internalSubTab, setInternalSubTab] = useState<'sensus' | 'ipl' | 'kegiatan' | 'surat' | 'approval' | 'topup' | 'aset' | 'koperasi' | 'posyandu' | 'rukam'>(
    currentSubTab || initialTab
  );

  const subTab = currentSubTab || internalSubTab;

  const setSubTab = (tab: 'sensus' | 'ipl' | 'kegiatan' | 'surat' | 'approval' | 'topup' | 'aset' | 'koperasi' | 'posyandu' | 'rukam') => {
    setInternalSubTab(tab);
    if (onSubTabChange) {
      onSubTabChange(tab);
    }
  };

  useEffect(() => {
    if (currentSubTab && currentSubTab !== internalSubTab) {
      setInternalSubTab(currentSubTab);
    }
  }, [currentSubTab]);

  // Census & 300 Houses State
  const [selectedRt, setSelectedRt] = useState<string>(user?.rt_number || '01');
  const [selectedBlock, setSelectedBlock] = useState<string>('all');
  const [selectedOccupancy, setSelectedOccupancy] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [censusHouses, setCensusHouses] = useState<any[]>([]);
  const [censusStats, setCensusStats] = useState<any>({
    total_houses: 100,
    occupied_houses: 0,
    empty_houses: 100,
    total_kk_utama: 0,
    total_kk_pendukung: 0,
  });
  const [selectedHouseDetail, setSelectedHouseDetail] = useState<any | null>(null);

  const [pendingWarga, setPendingWarga] = useState<any[]>([]);
  const [iplMasters, setIplMasters] = useState<any[]>([]);
  const [pendingBillings, setPendingBillings] = useState<any[]>([]);
  const [pendingTopups, setPendingTopups] = useState<any[]>([]);
  const [pendingLetters, setPendingLetters] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [rekap, setRekap] = useState<any[]>([]);

  // Generate Massal State (Year dropdown & RT filter)
  const [generateYear, setGenerateYear] = useState<number>(2026);
  const [generateRt, setGenerateRt] = useState<string>(user?.rt_number || '01');

  // New Event / Budget Request State (Khusus Sekretaris)
  const [showEventModal, setShowEventModal] = useState<boolean>(false);
  const [eventTitle, setEventTitle] = useState<string>('');
  const [eventContent, setEventContent] = useState<string>('');
  const [eventScope, setEventScope] = useState<string>(user?.rt_number ? `rt${user.rt_number}` : 'rw');
  const [eventType, setEventType] = useState<'announcement' | 'event'>('event');
  const [eventDate, setEventDate] = useState<string>('2026-10-15');
  const [eventBudget, setEventBudget] = useState<string>('1500000');
  const [eventBudgetSource, setEventBudgetSource] = useState<'kas_rt' | 'kas_rw' | 'swadaya'>(
    user?.rt_number ? 'kas_rt' : 'kas_rw'
  );

  // Payroll & Operational Expenses State (Satpam, Sampah, Operasional)
  const [payrollSummary, setPayrollSummary] = useState<any | null>(null);
  const [payrollExpenses, setPayrollExpenses] = useState<any[]>([]);
  const [auditSim, setAuditSim] = useState<any | null>(null);
  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);
  const [expenseForm, setExpenseForm] = useState<{
    level: 'rt' | 'rw';
    rt_number: string;
    category: string;
    title: string;
    recipient_name: string;
    recipient_role: string;
    amount: string;
    period_month: number;
    period_year: number;
    payment_method: 'transfer' | 'tunai';
    notes: string;
  }>({
    level: user?.role === 'rw' ? 'rw' : 'rt',
    rt_number: user?.rt_number || '01',
    category: user?.role === 'rw' ? 'gaji_satpam' : 'kebersihan_lingkungan',
    title: '',
    recipient_name: '',
    recipient_role: '',
    amount: '1000000',
    period_month: 10,
    period_year: 2026,
    payment_method: 'transfer',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Asset Management States
  const [assetLoans, setAssetLoans] = useState<any[]>([]);
  const [assetList, setAssetList] = useState<any[]>([]);
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetCategory, setNewAssetCategory] = useState<'tenda' | 'sound_system' | 'kursi' | 'lainnya'>('tenda');
  const [newAssetQty, setNewAssetQty] = useState(1);
  const [newAssetCondition, setNewAssetCondition] = useState('Baik');

  // Koperasi & UMKM States
  const [koperasiLoans, setKoperasiLoans] = useState<any[]>([]);
  const [umkmList, setUmkmList] = useState<any[]>([]);

  // Posyandu Digital States
  const [posyanduBalita, setPosyanduBalita] = useState<any[]>([]);
  const [posyanduImun, setPosyanduImun] = useState<any[]>([]);
  const [posyanduLansia, setPosyanduLansia] = useState<any[]>([]);
  const [posyanduStats, setPosyanduStats] = useState<any | null>(null);
  const [posyanduAdminSection, setPosyanduAdminSection] = useState<'balita' | 'imunisasi' | 'lansia'>('balita');

  // Balita Modal Form State
  const [showBalitaModal, setShowBalitaModal] = useState(false);
  const [balitaName, setBalitaName] = useState('');
  const [balitaGender, setBalitaGender] = useState<'L' | 'P'>('L');
  const [balitaAgeMonths, setBalitaAgeMonths] = useState(12);
  const [balitaWeight, setBalitaWeight] = useState(9.5);
  const [balitaHeight, setBalitaHeight] = useState(75.0);
  const [balitaHeadCirc, setBalitaHeadCirc] = useState(45.0);
  const [balitaVitA, setBalitaVitA] = useState(false);
  const [balitaNotes, setBalitaNotes] = useState('');

  // Imunisasi Modal Form State
  const [showImunModal, setShowImunModal] = useState(false);
  const [imunChildName, setImunChildName] = useState('');
  const [imunVaccine, setImunVaccine] = useState('DPT-HB-Hib 1');
  const [imunTargetAge, setImunTargetAge] = useState(2);
  const [imunDate, setImunDate] = useState(new Date().toISOString().split('T')[0]);

  // Lansia Modal Form State
  const [showLansiaModal, setShowLansiaModal] = useState(false);
  const [lansiaName, setLansiaName] = useState('');
  const [lansiaGender, setLansiaGender] = useState<'L' | 'P'>('L');
  const [lansiaAge, setLansiaAge] = useState(65);
  const [lansiaRt, setLansiaRt] = useState('01');
  const [lansiaSystolic, setLansiaSystolic] = useState(125);
  const [lansiaDiastolic, setLansiaDiastolic] = useState(82);
  const [lansiaBloodSugar, setLansiaBloodSugar] = useState('110');
  const [lansiaCholesterol, setLansiaCholesterol] = useState('185');
  const [lansiaUricAcid, setLansiaUricAcid] = useState('5.5');
  const [lansiaWaist, setLansiaWaist] = useState('82');

  // RUKAM & Ambulans Pengurus States
  const [rukamList, setRukamList] = useState<any[]>([]);
  const [rukamStats, setRukamStats] = useState<any | null>(null);
  const [ambulancesList, setAmbulancesList] = useState<any[]>([]);
  const [ambulanceBookingsList, setAmbulanceBookingsList] = useState<any[]>([]);
  const [rukamAdminSection, setRukamAdminSection] = useState<'laporan' | 'ambulans'>('laporan');

  // Disburse Modal State
  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [selectedRukamForDisburse, setSelectedRukamForDisburse] = useState<any | null>(null);
  const [disburseAmount, setDisburseAmount] = useState<number>(1500000);
  const [disburseToWallet, setDisburseToWallet] = useState(true);

  // Add Ambulance Modal State
  const [showAddAmbulanceModal, setShowAddAmbulanceModal] = useState(false);
  const [ambPlate, setAmbPlate] = useState('');
  const [ambNameInput, setAmbNameInput] = useState('');
  const [ambTypeInput, setAmbTypeInput] = useState<'emergency' | 'jenazah' | 'multipurpose'>('multipurpose');
  const [ambDriverInput, setAmbDriverInput] = useState('');
  const [ambPhoneInput, setAmbPhoneInput] = useState('');
  const [ambNotesInput, setAmbNotesInput] = useState('');

  // Dispatch Ambulance Modal State
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedBookingForDispatch, setSelectedBookingForDispatch] = useState<any | null>(null);
  const [dispatchAmbulanceId, setDispatchAmbulanceId] = useState<number | null>(null);
  const [dispatchDriverName, setDispatchDriverName] = useState('');
  const [dispatchDriverPhone, setDispatchDriverPhone] = useState('');

  const loadCensus = async () => {
    try {
      let url = `/houses/census?rt_number=${selectedRt}`;
      if (selectedBlock !== 'all') url += `&block=${selectedBlock}`;
      if (selectedOccupancy !== 'all') url += `&is_occupied=${selectedOccupancy === 'occupied'}`;
      const res = await fetchApi(url);
      if (res.success) {
        setCensusHouses(res.data || []);
        if (res.statistics) setCensusStats(res.statistics);
      }
    } catch {
      // ignore
    }
  };

  const loadData = async () => {
    setLoading(true);
    setAlertMsg(null);
    try {
      const [
        wargaRes, masterRes, billRes, topupRes, letRes, annRes, rekapRes, 
        payrollRes, expensesRes, auditRes, loansRes, assetsRes, kopRes, 
        umkmRes, posBalitaRes, posImunRes, posLansiaRes, posSummaryRes,
        rukamRes, rukamSumRes, ambRes, ambBookRes
      ] = await Promise.all([
        fetchApi('/admin/warga?status=pending').catch(() => ({ success: false, data: { data: [] } })),
        fetchApi(`/admin/ipl/masters?year=${generateYear}`).catch(() => ({ success: false, data: [] })),
        fetchApi('/ipl/billings?status=waiting_verification').catch(() => ({ success: false, data: { data: [] } })),
        fetchApi('/admin/wallet/pending-topups').catch(() => ({ success: false, data: { data: [] } })),
        fetchApi('/letters').catch(() => ({ success: false, data: { data: [] } })),
        fetchApi('/announcements').catch(() => ({ success: false, data: { data: [] } })),
        fetchApi('/admin/ipl/rekap-rw').catch(() => ({ success: false, data: [] })),
        fetchApi('/payroll/summary?month=10&year=2026').catch(() => ({ success: false, data: null })),
        fetchApi('/admin/payroll/expenses?month=10&year=2026').catch(() => ({ success: false, data: { data: [] } })),
        fetchApi('/payroll/audit-simulation').catch(() => ({ success: false, data: null })),
        fetchApi('/assets/loans').catch(() => ({ success: false, data: { data: [] } })),
        fetchApi('/assets').catch(() => ({ success: false, data: [] })),
        fetchApi('/koperasi/loans').catch(() => ({ success: false, data: { data: [] } })),
        fetchApi('/umkm').catch(() => ({ success: false, data: { data: [] } })),
        fetchApi('/posyandu').catch(() => ({ success: false, data: { data: [] } })),
        fetchApi('/posyandu/immunizations').catch(() => ({ success: false, data: { data: [] } })),
        fetchApi('/posyandu/lansia').catch(() => ({ success: false, data: { data: [] } })),
        fetchApi('/posyandu/summary').catch(() => ({ success: false, data: null })),
        fetchApi('/rukam').catch(() => ({ success: false, data: { data: [] } })),
        fetchApi('/rukam/summary').catch(() => ({ success: false, data: null })),
        fetchApi('/ambulances').catch(() => ({ success: false, data: [] })),
        fetchApi('/ambulances/bookings').catch(() => ({ success: false, data: { data: [] } })),
      ]);

      if (wargaRes.success) setPendingWarga(wargaRes.data?.data || []);
      if (masterRes.success) setIplMasters(masterRes.data || []);
      if (billRes.success) setPendingBillings(billRes.data?.data || []);
      if (topupRes.success) setPendingTopups(topupRes.data?.data || []);
      if (letRes.success) setPendingLetters(letRes.data?.data || []);
      if (annRes.success) setAnnouncements(annRes.data?.data || []);
      if (rekapRes.success) setRekap(rekapRes.data || []);
      if (payrollRes?.success) setPayrollSummary(payrollRes);
      if (expensesRes?.success) setPayrollExpenses(expensesRes.data?.data || []);
      if (auditRes?.success) setAuditSim(auditRes);
      if (loansRes?.success) setAssetLoans(loansRes.data?.data || []);
      if (assetsRes?.success) setAssetList(assetsRes.data || []);
      if (kopRes?.success) setKoperasiLoans(kopRes.data?.data || []);
      if (umkmRes?.success) setUmkmList(umkmRes.data?.data || []);
      if (posBalitaRes?.success) setPosyanduBalita(posBalitaRes.data?.data || []);
      if (posImunRes?.success) setPosyanduImun(posImunRes.data?.data || []);
      if (posLansiaRes?.success) setPosyanduLansia(posLansiaRes.data?.data || []);
      if (posSummaryRes?.success) setPosyanduStats(posSummaryRes.data);
      if (rukamRes?.success) setRukamList(rukamRes.data?.data || []);
      if (rukamSumRes?.success) setRukamStats(rukamSumRes.data);
      if (ambRes?.success) setAmbulancesList(ambRes.data || []);
      if (ambBookRes?.success) setAmbulanceBookingsList(ambBookRes.data?.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  // Sekretaris creates event with budget
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setAlertMsg(null);
    try {
      const res = await fetchApi('/announcements', {
        method: 'POST',
        body: JSON.stringify({
          title: eventTitle,
          content: eventContent,
          scope: eventScope,
          type: eventType,
          event_date: eventDate || null,
          budget_amount: eventBudget ? parseFloat(eventBudget) : null,
          budget_source: eventBudgetSource,
          allow_rsvp: true,
          allow_donation: false,
        }),
      });

      if (res.success) {
        setAlertMsg({ type: 'success', text: res.message });
        setShowEventModal(false);
        setEventTitle('');
        setEventContent('');
        await loadData();
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Gagal menerbitkan agenda.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Bendahara decides on event budget
  const handleBudgetDecision = async (id: number, action: 'approve' | 'disburse' | 'reject', notes?: string) => {
    setActionLoading(true);
    setAlertMsg(null);
    try {
      const res = await fetchApi(`/admin/announcements/${id}/budget-decision`, {
        method: 'POST',
        body: JSON.stringify({
          action,
          notes: notes || (action === 'approve' ? 'Anggaran disetujui Bendahara' : action === 'disburse' ? 'Dana telah dicairkan dari kas' : 'Pengajuan anggaran ditolak'),
        }),
      });

      if (res.success) {
        setAlertMsg({ type: 'success', text: res.message });
        await loadData();
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Gagal memproses keputusan anggaran.' });
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (subTab === 'sensus') {
      loadCensus();
    } else {
      loadData();
    }
  }, [subTab, selectedRt, selectedBlock, selectedOccupancy, generateYear]);

  const handleAssignHead = async (houseId: number, userId: number) => {
    setActionLoading(true);
    try {
      const res = await fetchApi(`/houses/${houseId}/assign-head`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
      });
      if (res.success) {
        setAlertMsg({ type: 'success', text: res.message });
        await loadCensus();
        if (selectedHouseDetail?.id === houseId) {
          setSelectedHouseDetail(res.data);
        }
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Warga Approval Action
  const handleApproveWarga = async (id: number) => {
    setActionLoading(true);
    try {
      const res = await fetchApi(`/admin/warga/${id}/approve`, { method: 'POST' });
      if (res.success) {
        setAlertMsg({ type: 'success', text: res.message });
        await loadData();
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Mass IPL Generation
  const handleGenerateIpl = async (masterId: number) => {
    setActionLoading(true);
    try {
      const res = await fetchApi(`/admin/ipl/generate/${masterId}`, { method: 'POST' });
      if (res.success) {
        setAlertMsg({ type: 'success', text: res.message });
        await loadData();
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Mass IPL Generation by Period (Creates master on the fly if needed)
  const handleGeneratePeriod = async (rtNumber: string, month: number, year: number) => {
    setActionLoading(true);
    setAlertMsg(null);
    try {
      const res = await fetchApi('/admin/ipl/generate-period', {
        method: 'POST',
        body: JSON.stringify({
          rt_number: rtNumber,
          period_month: month,
          period_year: year,
        }),
      });
      if (res.success) {
        setAlertMsg({ type: 'success', text: res.message });
        await loadData();
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Gagal generate tagihan periode.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Verify Billing Payment
  const handleVerifyBilling = async (id: number, action: 'approve' | 'reject') => {
    setActionLoading(true);
    try {
      const res = await fetchApi(`/admin/ipl/billings/${id}/verify`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      if (res.success) {
        setAlertMsg({ type: 'success', text: res.message });
        await loadData();
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Verify Topup
  const handleVerifyTopup = async (id: number, action: 'approve' | 'reject') => {
    setActionLoading(true);
    try {
      const res = await fetchApi(`/admin/wallet/topups/${id}/verify`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      if (res.success) {
        setAlertMsg({ type: 'success', text: res.message });
        await loadData();
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Approve Letter RT / RW
  const handleApproveLetter = async (id: number, stage: 'rt' | 'rw') => {
    setActionLoading(true);
    try {
      const endpoint = stage === 'rt' ? `/admin/letters/${id}/approve-rt` : `/admin/letters/${id}/approve-rw`;
      const res = await fetchApi(endpoint, { method: 'POST' });
      if (res.success) {
        setAlertMsg({ type: 'success', text: res.message });
        await loadData();
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Approve Operational Expense / Payroll (Ketua RT / Ketua RW)
  const handleApproveExpense = async (id: number) => {
    setActionLoading(true);
    try {
      const res = await fetchApi(`/admin/payroll/expenses/${id}/approve`, { method: 'POST' });
      if (res.success) {
        setAlertMsg({ type: 'success', text: res.message });
        await loadData();
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Disburse Operational Expense / Payroll (Bendahara)
  const handleDisburseExpense = async (id: number) => {
    setActionLoading(true);
    try {
      const res = await fetchApi(`/admin/payroll/expenses/${id}/disburse`, { method: 'POST' });
      if (res.success) {
        setAlertMsg({ type: 'success', text: res.message });
        await loadData();
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Asset Loan Handlers (Pengurus RT/RW)
  const handleApproveAssetLoan = async (id: number) => {
    setActionLoading(true);
    try {
      const res = await fetchApi(`/admin/assets/loans/${id}/approve`, { method: 'POST' });
      if (res.success) {
        setAlertMsg({ type: 'success', text: res.message });
        await loadData();
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectAssetLoan = async (id: number) => {
    setActionLoading(true);
    try {
      const res = await fetchApi(`/admin/assets/loans/${id}/reject`, { method: 'POST' });
      if (res.success) {
        setAlertMsg({ type: 'success', text: res.message });
        await loadData();
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturnAssetLoan = async (id: number) => {
    setActionLoading(true);
    try {
      const res = await fetchApi(`/admin/assets/loans/${id}/return`, { method: 'POST' });
      if (res.success) {
        setAlertMsg({ type: 'success', text: res.message });
        await loadData();
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStoreNewAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetchApi('/admin/assets', {
        method: 'POST',
        body: JSON.stringify({
          name: newAssetName,
          category: newAssetCategory,
          quantity: newAssetQty,
          condition: newAssetCondition,
          rt_number: user?.rt_number || '01',
        }),
      });
      if (res.success) {
        setAlertMsg({ type: 'success', text: res.message });
        setShowAddAssetModal(false);
        setNewAssetName('');
        setNewAssetQty(1);
        await loadData();
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Koperasi Loan Decision Handlers
  const handleDecideKoperasiLoan = async (id: number, action: 'approve' | 'reject') => {
    setActionLoading(true);
    setAlertMsg(null);
    try {
      const res = await fetchApi(`/admin/koperasi/loans/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ action, disburse_to_wallet: true }),
      });
      if (res.success) {
        setAlertMsg({ type: 'success', text: res.message });
        await loadData();
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Gagal memproses pinjaman koperasi.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Posyandu Digital Handlers
  const handleStoreBalita = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setAlertMsg(null);
    try {
      const res = await fetchApi('/posyandu', {
        method: 'POST',
        body: JSON.stringify({
          child_name: balitaName,
          gender: balitaGender,
          age_months: Number(balitaAgeMonths),
          weight_kg: Number(balitaWeight),
          height_cm: Number(balitaHeight),
          head_circumference_cm: Number(balitaHeadCirc),
          vitamin_a: balitaVitA,
          notes: balitaNotes,
        }),
      });
      if (res.success) {
        setAlertMsg({ type: 'success', text: res.message });
        setShowBalitaModal(false);
        setBalitaName('');
        await loadData();
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Gagal mencatat data KMS balita.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStoreImun = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setAlertMsg(null);
    try {
      const res = await fetchApi('/posyandu/immunizations', {
        method: 'POST',
        body: JSON.stringify({
          child_name: imunChildName,
          vaccine_name: imunVaccine,
          target_age_months: Number(imunTargetAge),
          scheduled_date: imunDate,
        }),
      });
      if (res.success) {
        setAlertMsg({ type: 'success', text: res.message });
        setShowImunModal(false);
        setImunChildName('');
        await loadData();
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Gagal menyimpan jadwal imunisasi.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteImun = async (id: number) => {
    setActionLoading(true);
    try {
      const res = await fetchApi(`/posyandu/immunizations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'completed',
          batch_number: 'VAX-' + Date.now().toString().slice(-6),
        }),
      });
      if (res.success) {
        setAlertMsg({ type: 'success', text: res.message });
        await loadData();
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Gagal memperbarui status imunisasi.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStoreLansia = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setAlertMsg(null);
    try {
      const res = await fetchApi('/posyandu/lansia', {
        method: 'POST',
        body: JSON.stringify({
          elderly_name: lansiaName,
          gender: lansiaGender,
          age: Number(lansiaAge),
          rt_number: lansiaRt,
          systolic: Number(lansiaSystolic),
          diastolic: Number(lansiaDiastolic),
          blood_sugar: lansiaBloodSugar ? Number(lansiaBloodSugar) : null,
          cholesterol: lansiaCholesterol ? Number(lansiaCholesterol) : null,
          uric_acid: lansiaUricAcid ? Number(lansiaUricAcid) : null,
          waist_circumference_cm: lansiaWaist ? Number(lansiaWaist) : null,
        }),
      });
      if (res.success) {
        setAlertMsg({ type: 'success', text: res.message });
        setShowLansiaModal(false);
        setLansiaName('');
        await loadData();
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Gagal mencatat data skrining lansia.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Create Operational Expense / Payroll
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetchApi('/admin/payroll/expenses', {
        method: 'POST',
        body: JSON.stringify({
          ...expenseForm,
          amount: Number(expenseForm.amount),
        }),
      });
      if (res.success) {
        setAlertMsg({ type: 'success', text: res.message });
        setShowExpenseModal(false);
        await loadData();
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // RUKAM & Ambulans Handlers
  const handleVerifyRukam = async (id: number) => {
    setActionLoading(true);
    try {
      const res = await fetchApi(`/rukam/${id}/verify`, { method: 'POST' });
      if (res.success) {
        setAlertMsg({ type: 'success', text: res.message });
        await loadData();
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Gagal memverifikasi laporan duka.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDisburseModal = (item: any) => {
    setSelectedRukamForDisburse(item);
    setDisburseAmount(Number(item.disbursement_amount) || 1500000);
    setShowDisburseModal(true);
  };

  const handleDisburseRukam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRukamForDisburse) return;
    setActionLoading(true);
    try {
      const res = await fetchApi(`/rukam/${selectedRukamForDisburse.id}/disburse`, {
        method: 'POST',
        body: JSON.stringify({
          amount: disburseAmount,
          disburse_to_wallet: disburseToWallet,
        }),
      });
      if (res.success) {
        setAlertMsg({ type: 'success', text: res.message });
        setShowDisburseModal(false);
        await loadData();
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Gagal mencairkan santunan duka.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStoreAmbulance = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetchApi('/ambulances', {
        method: 'POST',
        body: JSON.stringify({
          vehicle_number: ambPlate,
          name: ambNameInput,
          type: ambTypeInput,
          driver_name: ambDriverInput || undefined,
          driver_phone: ambPhoneInput || undefined,
          notes: ambNotesInput || undefined,
        }),
      });
      if (res.success) {
        setAlertMsg({ type: 'success', text: res.message });
        setShowAddAmbulanceModal(false);
        setAmbPlate('');
        setAmbNameInput('');
        setAmbDriverInput('');
        setAmbPhoneInput('');
        setAmbNotesInput('');
        await loadData();
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Gagal menambahkan armada ambulans.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateAmbulanceStatus = async (id: number, status: string) => {
    setActionLoading(true);
    try {
      const res = await fetchApi(`/ambulances/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (res.success) {
        setAlertMsg({ type: 'success', text: res.message });
        await loadData();
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Gagal mengubah status armada.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDispatchModal = (booking: any) => {
    setSelectedBookingForDispatch(booking);
    const available = ambulancesList.find((a) => a.status === 'available');
    setDispatchAmbulanceId(available ? available.id : ambulancesList[0]?.id || null);
    setDispatchDriverName(available?.driver_name || 'Driver Tim Siaga RW');
    setDispatchDriverPhone(available?.driver_phone || '081234567890');
    setShowDispatchModal(true);
  };

  const handleDispatchAmbulance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForDispatch || !dispatchAmbulanceId) return;
    setActionLoading(true);
    try {
      const res = await fetchApi(`/ambulances/bookings/${selectedBookingForDispatch.id}/dispatch`, {
        method: 'POST',
        body: JSON.stringify({
          ambulance_id: dispatchAmbulanceId,
          driver_name: dispatchDriverName,
          driver_phone: dispatchDriverPhone,
        }),
      });
      if (res.success) {
        setAlertMsg({ type: 'success', text: res.message });
        setShowDispatchModal(false);
        await loadData();
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Gagal mendisposisikan armada ambulans.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteAmbulanceBooking = async (id: number) => {
    if (!confirm('Apakah tugas ambulans ini sudah selesai dan armada kembali siap siaga?')) return;
    setActionLoading(true);
    try {
      const res = await fetchApi(`/ambulances/bookings/${id}/complete`, { method: 'POST' });
      if (res.success) {
        setAlertMsg({ type: 'success', text: res.message });
        await loadData();
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Gagal menyelesaikan tugas ambulans.' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Panel */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Tata Kelola RT / RW Digital & Pemisahan Peran</span>
            </div>
            <h3 className="text-xl font-black tracking-tight mt-1">
              {user?.role === 'bendahara' ? 'Pusat Keuangan & Kas (Bendahara)' :
               user?.role === 'sekretaris' ? 'Pusat Agenda & Administrasi (Sekretaris)' :
               'Dashboard Supervisi Wilayah Lingkungan'}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Masuk sebagai: <strong className="text-white">{user?.name}</strong> • Jabatan:{' '}
              <span className="font-bold text-emerald-400">
                {user?.role === 'bendahara' ? `Bendahara ${user.rt_number ? 'RT ' + user.rt_number : 'RW 05'}` :
                 user?.role === 'sekretaris' ? `Sekretaris ${user.rt_number ? 'RT ' + user.rt_number : 'RW 05'}` :
                 user?.role === 'rt' ? `Ketua RT ${user.rt_number}` :
                 user?.role === 'rw' ? 'Ketua RW 05' : 'Super Admin'}
              </span>
            </p>
          </div>
        </div>

        {/* Sub-tab selection */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5 p-1 bg-slate-800 rounded-2xl mt-4">
          <button
            onClick={() => setSubTab('sensus')}
            className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              subTab === 'sensus' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Sensus 300</span>
          </button>
          <button
            onClick={() => setSubTab('ipl')}
            className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              subTab === 'ipl' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>
              {user?.role === 'rt' 
                ? `ACC Iuran RT ${user.rt_number}` 
                : user?.role === 'rw' 
                ? 'Kas RT & Setoran RW' 
                : 'Kas & Iuran'} {pendingBillings.length > 0 && `(${pendingBillings.length})`}
            </span>
          </button>
          <button
            onClick={() => setSubTab('kegiatan')}
            className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              subTab === 'kegiatan' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Agenda & Anggaran</span>
          </button>
          <button
            onClick={() => setSubTab('surat')}
            className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              subTab === 'surat' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Surat RT/RW</span>
          </button>
          <button
            onClick={() => setSubTab('approval')}
            className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              subTab === 'approval' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>ACC Warga {pendingWarga.length > 0 && `(${pendingWarga.length})`}</span>
          </button>
          <button
            onClick={() => setSubTab('topup')}
            className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              subTab === 'topup' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Top-Up {pendingTopups.length > 0 && `(${pendingTopups.length})`}</span>
          </button>
          <button
            onClick={() => setSubTab('aset')}
            className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              subTab === 'aset' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Aset Fasum {assetLoans.filter(l => l.status === 'requested').length > 0 && `(${assetLoans.filter(l => l.status === 'requested').length})`}</span>
          </button>
          <button
            onClick={() => setSubTab('koperasi')}
            className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              subTab === 'koperasi' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Koperasi & UMKM {koperasiLoans.filter(l => l.status === 'submitted').length > 0 && `(${koperasiLoans.filter(l => l.status === 'submitted').length})`}</span>
          </button>
          <button
            onClick={() => setSubTab('posyandu')}
            className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              subTab === 'posyandu' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            <span>Posyandu Digital</span>
          </button>
          <button
            onClick={() => setSubTab('rukam')}
            className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              subTab === 'rukam' ? 'bg-rose-700 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>RUKAM & Ambulans {rukamList.filter(r => r.status === 'reported').length > 0 && `(${rukamList.filter(r => r.status === 'reported').length})`}</span>
          </button>
        </div>
      </div>

      {alertMsg && (
        <div className={`p-3.5 rounded-2xl text-xs font-bold border ${
          alertMsg.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {alertMsg.text}
        </div>
      )}

      {/* 0. SENSUS 300 UNIT RUMAH & STRUKTUR KK */}
      {subTab === 'sensus' && (
        <div className="space-y-4">
          {/* Header & Stats Banner */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                  <span>Sensus 300 Unit Rumah & Entitas Penagihan KK</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  100 unit rumah per RT (RT 01, 02, 03). Masing-masing rumah memiliki <strong>KK Utama</strong> sebagai penanggung jawab penagihan IPL, dan dapat menampung <strong>KK Pendukung / Tambahan</strong>.
                </p>
              </div>

              {/* RT Selector Switcher */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl self-stretch sm:self-auto">
                {['01', '02', '03'].map((rtNum) => (
                  <button
                    key={rtNum}
                    onClick={() => setSelectedRt(rtNum)}
                    className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-black rounded-xl transition ${
                      selectedRt === rtNum
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    RT {rtNum} (100 Rumah)
                  </button>
                ))}
              </div>
            </div>

            {/* 4 Stat Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Kapasitas RT {selectedRt}</span>
                <span className="text-xl font-black text-slate-900">{censusStats.total_houses} Unit</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Blok A, B, C, D (25/blok)</span>
              </div>
              <div className="bg-emerald-50/70 rounded-2xl p-3 border border-emerald-200">
                <span className="text-[10px] font-bold uppercase text-emerald-700 block">Rumah Terisi</span>
                <span className="text-xl font-black text-emerald-800">{censusStats.occupied_houses} Unit</span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">{censusStats.empty_houses} unit masih kosong</span>
              </div>
              <div className="bg-blue-50/70 rounded-2xl p-3 border border-blue-200">
                <span className="text-[10px] font-bold uppercase text-blue-700 block">KK Utama (Penanggung Jawab)</span>
                <span className="text-xl font-black text-blue-800">{censusStats.total_kk_utama} KK</span>
                <span className="text-[10px] text-blue-600 block mt-0.5">Penerima tagihan iuran IPL</span>
              </div>
              <div className="bg-teal-50/70 rounded-2xl p-3 border border-teal-200">
                <span className="text-[10px] font-bold uppercase text-teal-700 block">KK Pendukung / Tambahan</span>
                <span className="text-xl font-black text-teal-800">{censusStats.total_kk_pendukung} KK</span>
                <span className="text-[10px] text-teal-600 block mt-0.5">Anak menikah / kerabat serumah</span>
              </div>
            </div>

            {/* Filters Bar: Block + Occupancy + Search */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Filter Blok:</span>
                {['all', 'A', 'B', 'C', 'D'].map((b) => (
                  <button
                    key={b}
                    onClick={() => setSelectedBlock(b)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                      selectedBlock === b
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {b === 'all' ? 'Semua Blok' : `Blok ${b} (1-25)`}
                  </button>
                ))}

                <span className="text-xs font-bold text-slate-600 ml-2">Status:</span>
                {['all', 'occupied', 'empty'].map((occ) => (
                  <button
                    key={occ}
                    onClick={() => setSelectedOccupancy(occ)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                      selectedOccupancy === occ
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {occ === 'all' ? 'Semua' : occ === 'occupied' ? 'Terisi' : 'Kosong'}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari kode rumah / KK..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Grid 100 Rumah */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {censusHouses
              .filter((h) => {
                if (!searchQuery) return true;
                const q = searchQuery.toLowerCase();
                const codeMatch = h.house_code?.toLowerCase().includes(q);
                const addrMatch = h.full_address?.toLowerCase().includes(q);
                const headMatch = h.head_of_family?.name?.toLowerCase().includes(q);
                const pendukungMatch = h.kk_pendukung?.some((k: any) => k.name?.toLowerCase().includes(q));
                return codeMatch || addrMatch || headMatch || pendukungMatch;
              })
              .map((h) => {
                const latestBill = h.billings?.[0];
                return (
                  <div
                    key={h.id}
                    className={`rounded-2xl p-4 border transition flex flex-col justify-between hover:shadow-md ${
                      h.is_occupied
                        ? 'bg-white border-slate-200 hover:border-emerald-400'
                        : 'bg-slate-50/80 border-dashed border-slate-300 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div>
                      {/* Top Header: House Code & Badge */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-slate-900 text-white">
                          {h.house_code || `RT${h.rt_number}-${h.block}${h.number}`}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            h.is_occupied
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {h.is_occupied ? 'TERISI' : 'KOSONG'}
                        </span>
                      </div>

                      <h5 className="font-bold text-xs text-slate-800 mb-2">
                        {h.full_address}
                      </h5>

                      {h.is_occupied ? (
                        <div className="space-y-2 text-xs">
                          {/* KK Utama */}
                          <div className="bg-emerald-50/70 p-2 rounded-xl border border-emerald-100">
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-800 uppercase">
                              <UserCheck className="w-3 h-3" />
                              <span>KK Utama (PJ Rumah)</span>
                            </div>
                            <div className="font-extrabold text-slate-900 mt-0.5 truncate">
                              {h.head_of_family?.name || 'Belum Ditetapkan'}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                              NIK: {h.head_of_family?.nik || '-'}
                            </div>
                          </div>

                          {/* KK Pendukung */}
                          <div className="bg-teal-50/50 p-2 rounded-xl border border-teal-100">
                            <div className="flex items-center justify-between text-[10px] font-black text-teal-800 uppercase">
                              <span>KK Pendukung / Tambahan</span>
                              <span className="px-1.5 py-0.2 rounded-full bg-teal-200/60 font-bold">
                                {h.kk_pendukung?.length || 0} KK
                              </span>
                            </div>
                            {h.kk_pendukung?.length > 0 ? (
                              <div className="text-[11px] text-slate-800 font-semibold mt-0.5 truncate">
                                {h.kk_pendukung.map((k: any) => k.name).join(', ')}
                              </div>
                            ) : (
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Tidak ada KK tambahan
                              </div>
                            )}
                          </div>

                          {/* IPL Status */}
                          <div className="pt-1 flex items-center justify-between text-[11px]">
                            <span className="text-slate-500 text-[10px]">IPL Bulan Ini:</span>
                            {latestBill ? (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  latestBill.status === 'paid'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {latestBill.status === 'paid' ? 'LUNAS' : 'BELUM BAYAR'}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">-</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="py-4 text-center text-slate-400 text-xs">
                          Rumah siap huni / belum ada warga terdaftar
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => setSelectedHouseDetail(h)}
                        className="w-full py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-emerald-600 hover:text-white rounded-xl transition"
                      >
                        Detail Rumah & KK
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* MODAL DETAIL UNIT RUMAH & KELOLA KK */}
      {selectedHouseDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-slate-900 text-white mr-2">
                  {selectedHouseDetail.house_code || `RT${selectedHouseDetail.rt_number}-${selectedHouseDetail.block}${selectedHouseDetail.number}`}
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    selectedHouseDetail.is_occupied
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {selectedHouseDetail.is_occupied ? 'BERPENGHUNI' : 'KOSONG'}
                </span>
                <h4 className="font-black text-lg text-slate-900 mt-2">
                  {selectedHouseDetail.full_address}
                </h4>
              </div>
              <button
                onClick={() => setSelectedHouseDetail(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Penanggung Jawab Rumah (KK UTAMA) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>1. KK Utama (Penanggung Jawab Unit Rumah)</span>
                </span>
              </div>
              {selectedHouseDetail.head_of_family ? (
                <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-xs space-y-1">
                  <div className="text-sm font-black text-slate-900">
                    {selectedHouseDetail.head_of_family.name}
                  </div>
                  <div className="text-slate-600">
                    No. KK: <strong className="font-mono">{selectedHouseDetail.head_of_family.no_kk || '-'}</strong> | NIK: <strong className="font-mono">{selectedHouseDetail.head_of_family.nik || '-'}</strong>
                  </div>
                  <div className="text-slate-500">
                    HP: {selectedHouseDetail.head_of_family.phone || '-'} | Email: {selectedHouseDetail.head_of_family.email}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold pt-1">
                    * Segala tagihan iuran IPL dan tanggung jawab lingkungan unit rumah ini dialamatkan kepada KK Utama.
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">
                  Belum ada KK Utama yang ditetapkan untuk rumah ini.
                </div>
              )}
            </div>

            {/* KK PENDUKUNG / TAMBAHAN */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-teal-600" />
                  <span>2. KK Pendukung / Tambahan ({selectedHouseDetail.kk_pendukung?.length || 0})</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Keluarga yang sudah menikah atau kerabat yang tinggal serumah dengan nomor KK terpisah.
              </p>

              {selectedHouseDetail.kk_pendukung?.length > 0 ? (
                <div className="space-y-2">
                  {selectedHouseDetail.kk_pendukung.map((kk: any) => (
                    <div key={kk.id} className="p-3 bg-teal-50/60 border border-teal-200 rounded-2xl text-xs flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{kk.name}</div>
                        <div className="text-[11px] text-slate-600">
                          No. KK: <strong className="font-mono">{kk.no_kk || '-'}</strong> | NIK: <strong className="font-mono">{kk.nik || '-'}</strong>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAssignHead(selectedHouseDetail.id, kk.id)}
                        disabled={actionLoading}
                        className="px-2.5 py-1 text-[11px] font-bold bg-white text-teal-800 border border-teal-300 hover:bg-teal-100 rounded-lg shadow-sm"
                      >
                        Jadikan KK Utama
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 text-slate-400 rounded-xl text-xs text-center">
                  Tidak ada KK Tambahan di rumah ini.
                </div>
              )}
            </div>

            {/* DAFTAR SELURUH WARGA RESIDENTS */}
            <div className="space-y-2">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                3. Seluruh Penghuni Terdata ({selectedHouseDetail.residents?.length || 0} Jiwa)
              </span>
              <div className="space-y-1">
                {selectedHouseDetail.residents?.map((res: any) => (
                  <div key={res.id} className="p-2 bg-slate-50 rounded-xl text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">{res.name}</span>
                      <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                        {res.kk_type === 'kk_utama' ? 'KK Utama' : res.kk_type === 'kk_pendukung' ? 'KK Pendukung' : 'Anggota'}
                      </span>
                    </div>
                    {res.id !== selectedHouseDetail.head_of_family_id && (
                      <button
                        onClick={() => handleAssignHead(selectedHouseDetail.id, res.id)}
                        disabled={actionLoading}
                        className="text-[10px] text-blue-600 hover:underline font-bold"
                      >
                        Pilih sbg KK Utama
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedHouseDetail(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Tutup Sensus Rumah
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. APPROVAL WARGA */}
      {subTab === 'approval' && (
        <div className="space-y-3">
          <h4 className="font-extrabold text-sm text-slate-800 px-1">
            Daftar Pendaftaran Warga Menunggu ACC RT
          </h4>

          {pendingWarga.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-xs border border-slate-200">
              Tidak ada warga berstatus pending saat ini. Semua telah disetujui.
            </div>
          ) : (
            pendingWarga.map((warga) => (
              <div key={warga.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-sm text-slate-900">{warga.name}</h5>
                  <div className="text-xs text-slate-600 mt-0.5">{warga.house?.full_address || 'RT ' + warga.rt_number}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Email: {warga.email} | HP: {warga.phone || '-'} | RFID: {warga.rfid_uid || 'Belum ada'}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproveWarga(warga.id)}
                    disabled={actionLoading}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1 active:scale-95 transition"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>ACC Warga</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 2. KELOLA KAS, VERIFIKASI IURAN & ANGGARAN (KHUSUS BENDAHARA) */}
      {subTab === 'ipl' && (
        <div className="space-y-5">
          {/* Role info banner for RT & Bendahara */}
          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-3xl text-xs text-emerald-950 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-emerald-900">
                {user?.role === 'rt'
                  ? `Pusat Keuangan & Otoritas Kas RT ${user.rt_number} (Ketua RT & Bendahara)`
                  : user?.role === 'rw'
                  ? 'Supervisi Keuangan & Setoran Kas RT ke RW 05 (Ketua RW & Bendahara RW)'
                  : 'Pusat Keuangan & Otoritas Kas (Tugas Pokok Bendahara RT / RW)'}
              </div>
              <p className="mt-0.5 text-emerald-800 leading-relaxed">
                {user?.role === 'rt'
                  ? `Sebagai Ketua RT ${user.rt_number}, Anda memiliki kewenangan penuh bersama Bendahara untuk memverifikasi dan meng-ACC setoran iuran IPL warganya. Pembayaran iuran otomatis membagi saldo: 60% (Rp 30.000) masuk Kas RT ${user.rt_number} dan 40% (Rp 20.000) disetorkan ke Kas RW 05.`
                  : user?.role === 'rw'
                  ? 'Sebagai Ketua RW 05, Anda dapat memantau transparansi pembayaran setiap warga dari RT 01, RT 02, dan RT 03, mengawasi setoran wajib Rp 20.000/KK (40%) dari tiap RT, serta mengelola kas bersama RW untuk kegiatan lingkungan.'
                  : 'Sesuai prinsip pemisahan peran (Separation of Duties), Bendahara bertugas meng-ACC dan memvalidasi iuran masuk dari warga, mengawasi saldo Kas RT (Rp 30.000/KK) dan Kas RW (Rp 20.000/KK), serta menyetujui pencairan anggaran kegiatan yang diajukan oleh Sekretaris.'}
              </p>
            </div>
          </div>

          {/* A. Pending Verifications dari Warga */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Verifikasi Pembayaran IPL QRIS / Transfer Masuk ({pendingBillings.length})</span>
              </h4>
              <span className="text-[11px] font-bold text-slate-500">
                {user?.role === 'rt' ? `Otoritas ACC: Ketua RT ${user.rt_number} & Bendahara RT` : 'Otoritas ACC: Bendahara & Ketua RT/RW'}
              </span>
            </div>

            {pendingBillings.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center text-slate-400 text-xs border border-slate-200">
                Tidak ada pembayaran IPL yang menunggu verifikasi saat ini.
              </div>
            ) : (
              pendingBillings.map((bill) => (
                <div key={bill.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-900 text-white">
                        {bill.house?.house_code || `RT${bill.house?.rt_number}-${bill.house?.block}${bill.house?.number}`}
                      </span>
                      <span className="font-bold text-sm text-slate-900">
                        {bill.house?.head_of_family?.name || bill.user?.name} (KK Utama)
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      {bill.house?.full_address} — Periode {bill.master?.period_month}/{bill.master?.period_year}
                    </div>
                    <div className="text-xs font-black text-emerald-700 mt-0.5">
                      Rp {Number(bill.amount).toLocaleString('id-ID')}
                      <span className="text-[10px] font-normal text-slate-500 ml-2">
                        (Kas RT: Rp {Number(bill.master?.base_ipl_amount || 30000).toLocaleString('id-ID')} | Setoran RW: Rp {Number(bill.master?.rw_contribution_amount || 20000).toLocaleString('id-ID')})
                      </span>
                    </div>
                    {bill.payment_proof_path && (
                      <a
                        href={`http://smartwarga.test${bill.payment_proof_path}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 mt-1 font-semibold"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Lihat Foto Resi / Screenshot QRIS</span>
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => handleVerifyBilling(bill.id, 'approve')}
                      disabled={actionLoading}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1 active:scale-95 transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>ACC / Sahkan Lunas</span>
                    </button>
                    <button
                      onClick={() => handleVerifyBilling(bill.id, 'reject')}
                      disabled={actionLoading}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200"
                    >
                      Tolak
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* B. Persetujuan Pencairan Anggaran Kegiatan Lingkungan */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-600" />
                <span>Persetujuan Anggaran Kegiatan (Pengajuan oleh Sekretaris)</span>
              </h4>
              <span className="text-[11px] font-bold text-slate-400">
                Pencairan Kas RT / Kas RW
              </span>
            </div>

            {announcements.filter((a) => a.budget_amount && a.budget_amount > 0).length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center text-slate-400 text-xs border border-slate-200">
                Belum ada pengajuan anggaran kegiatan yang tercatat.
              </div>
            ) : (
              announcements
                .filter((a) => a.budget_amount && a.budget_amount > 0)
                .map((ann) => (
                  <div key={ann.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          {ann.scope?.toUpperCase()}
                        </span>
                        <h5 className="font-bold text-sm text-slate-900">{ann.title}</h5>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Diajukan oleh: <strong>{ann.author?.name}</strong> • Sumber Dana:{' '}
                        <strong className="text-slate-800">
                          {ann.budget_source === 'kas_rt' ? 'Kas RT Setempat' : ann.budget_source === 'kas_rw' ? 'Kas Induk RW 05' : 'Swadaya'}
                        </strong>
                      </div>
                      <div className="text-sm font-black text-slate-900 mt-1">
                        Anggaran Diajukan: <span className="text-emerald-700">Rp {Number(ann.budget_amount).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-500">Status Anggaran:</span>
                        {ann.budget_status === 'approved' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                            Disetujui Bendahara
                          </span>
                        ) : ann.budget_status === 'disbursed' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full">
                            Dana Telah Dicairkan
                          </span>
                        ) : ann.budget_status === 'rejected' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full">
                            Ditolak Bendahara
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                            Menunggu Keputusan Bendahara
                          </span>
                        )}
                        {ann.budget_approved_by && (
                          <span className="text-[10px] text-slate-400">
                            (ACC: {ann.budget_approver?.name || 'Bendahara'})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      {ann.budget_status === 'proposed' && (
                        <>
                          <button
                            onClick={() => handleBudgetDecision(ann.id, 'approve')}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
                          >
                            ACC Anggaran
                          </button>
                          <button
                            onClick={() => handleBudgetDecision(ann.id, 'reject')}
                            disabled={actionLoading}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200"
                          >
                            Tolak
                          </button>
                        </>
                      )}
                      {ann.budget_status === 'approved' && (
                        <button
                          onClick={() => handleBudgetDecision(ann.id, 'disburse')}
                          disabled={actionLoading}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm"
                        >
                          Cairkan Kas
                        </button>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>

          {/* C. Rekapitulasi Kas RT ke RW (Transparansi Finansial & Pembagian Hasil) */}
          {rekap.length > 0 && (
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      Rekapitulasi Kas RT & Setoran Kas RW (Transparansi Finansial)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Bagi hasil resmi: <strong className="text-emerald-700">60% Kas RT (Rp 30.000/KK)</strong> & <strong className="text-indigo-700">40% Setoran Wajib Kas RW (Rp 20.000/KK)</strong>.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
                    60% Kas RT
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-1 bg-indigo-50 text-indigo-800 rounded-full border border-indigo-200">
                    40% Kas RW
                  </span>
                </div>
              </div>

              {/* Stat Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                    {user?.role === 'rt' ? `Total Kas RT ${user.rt_number} (60%)` : 'Total Kas Seluruh RT (60%)'}
                  </span>
                  <div className="text-lg font-black text-emerald-950 mt-0.5">
                    Rp {Number(
                      user?.role === 'rt'
                        ? (rekap.find((r) => r.rt_number === user.rt_number)?.kas_rt_terkumpul || 0)
                        : rekap.reduce((acc, r) => acc + Number(r.kas_rt_terkumpul || 0), 0)
                    ).toLocaleString('id-ID')}
                  </div>
                  <span className="text-[10px] text-emerald-700 block mt-0.5">
                    {user?.role === 'rt' ? 'Hak operasional lokal RT' : 'Total saldo lokal di 3 RT'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200">
                  <span className="text-[10px] uppercase font-bold text-indigo-800 block">
                    {user?.role === 'rt' ? `Setoran Terkumpul ke RW 05 (40%)` : 'Total Akumulasi Kas RW 05 (40%)'}
                  </span>
                  <div className="text-lg font-black text-indigo-950 mt-0.5">
                    Rp {Number(
                      user?.role === 'rt'
                        ? (rekap.find((r) => r.rt_number === user.rt_number)?.setoran_rw_wajib || 0)
                        : rekap.reduce((acc, r) => acc + Number(r.setoran_rw_wajib || 0), 0)
                    ).toLocaleString('id-ID')}
                  </div>
                  <span className="text-[10px] text-indigo-700 block mt-0.5">
                    {user?.role === 'rt' ? 'Setoran wajib dari RT ke RW' : 'Setoran masuk dari RT 01, 02, 03'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    {user?.role === 'rt' ? `Total Pungutan Iuran RT ${user.rt_number}` : 'Total Iuran Se-RW 05'}
                  </span>
                  <div className="text-lg font-black text-slate-900 mt-0.5">
                    Rp {Number(
                      user?.role === 'rt'
                        ? (rekap.find((r) => r.rt_number === user.rt_number)?.total_iuran || 0)
                        : rekap.reduce((acc, r) => acc + Number(r.total_iuran || 0), 0)
                    ).toLocaleString('id-ID')}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {user?.role === 'rt' 
                      ? `${rekap.find((r) => r.rt_number === user.rt_number)?.paid_warga_count || 0} KK Lunas`
                      : `${rekap.reduce((acc, r) => acc + Number(r.paid_warga_count || 0), 0)} KK Lunas se-RW 05`}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Wilayah RT</th>
                      <th className="py-2.5 px-3">Warga Lunas</th>
                      <th className="py-2.5 px-3 text-emerald-800">Porsi Kas RT (60% • Rp 30.000)</th>
                      <th className="py-2.5 px-3 text-indigo-800">Setoran Kas RW (40% • Rp 20.000)</th>
                      <th className="py-2.5 px-3 font-bold text-slate-900">Total Terhimpun (100%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rekap
                      .filter((item) => (user?.role === 'rt' ? item.rt_number === user.rt_number : true))
                      .map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 font-bold text-slate-800">
                            RT {item.rt_number}
                            {user?.rt_number === item.rt_number && (
                              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                                RT Anda
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-semibold">{item.paid_warga_count} KK</td>
                          <td className="py-3 px-3 font-extrabold text-emerald-700">Rp {Number(item.kas_rt_terkumpul).toLocaleString('id-ID')}</td>
                          <td className="py-3 px-3 font-extrabold text-indigo-700">Rp {Number(item.setoran_rw_wajib).toLocaleString('id-ID')}</td>
                          <td className="py-3 px-3 font-black text-slate-900">Rp {Number(item.total_iuran).toLocaleString('id-ID')}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <p leading-relaxed>
                  <strong>Catatan Transparansi:</strong> Warga dan Ketua RT hanya dapat melihat kas dan warga di wilayah RT-nya sendiri. Pengurus RW memiliki wewenang supervisi lintas RT untuk memantau kepatuhan setoran 40% (Rp 20.000/KK) dari masing-masing RT guna pendanaan fasilitas umum bersama se-RW 05.
                </p>
              </div>
            </div>
          )}

          {/* D. PENGGAJIAN SATPAM, PEMBAYARAN SAMPAH & AUDIT KECUKUPAN KAS */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <span>Penggajian Satpam, Pembayaran Sampah & Buku Kas Operasional</span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Payroll & Fixed Cost
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Pengelolaan gaji satpam gerbang utama (Node 1) dan retribusi truk sampah dikelola oleh <strong>Bendahara RW & Ketua RW</strong> dari jatah 40% Setoran Kas RW. Kebersihan lorong dan ronda dikelola oleh <strong>Bendahara RT & Ketua RT</strong> dari jatah 60% Kas RT.
                  </p>
                </div>
              </div>

              {['bendahara', 'rw', 'rt', 'super_admin'].includes(user?.role || '') && (
                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition shrink-0"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>+ Catat Beban / Gaji Baru</span>
                </button>
              )}
            </div>

            {/* Metrik Finansial & Cash Flow Rutin */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Kartu 1: Total Beban Bulanan */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total Beban Rutin Terdaftar (Bulan 10/2026)
                </span>
                <div className="text-xl font-black text-slate-900 mt-1">
                  Rp {Number((payrollSummary?.expenses?.total_rw_expenses || 0) + (payrollSummary?.expenses?.total_rt_expenses || 0)).toLocaleString('id-ID')}
                </div>
                <div className="text-[11px] text-slate-600 mt-1 space-y-0.5">
                  <div className="flex justify-between">
                    <span>• Gaji Satpam RW:</span>
                    <span className="font-bold">Rp {Number(payrollSummary?.expenses?.breakdown?.gaji_satpam || 0).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Truk Sampah Terpadu:</span>
                    <span className="font-bold">Rp {Number(payrollSummary?.expenses?.breakdown?.uang_sampah || 0).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Kebersihan Lorong RT:</span>
                    <span className="font-bold">Rp {Number(payrollSummary?.expenses?.breakdown?.kebersihan_rt || 0).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

              {/* Kartu 2: Kecukupan Kas RW vs Beban Satpam & Sampah */}
              <div className={`p-4 border rounded-2xl ${
                payrollSummary?.cash_flow_health?.is_rw_surplus 
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' 
                  : 'bg-amber-50/80 border-amber-200 text-amber-950'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    Status Kas RW vs Beban Satpam/Sampah
                  </span>
                  {payrollSummary?.cash_flow_health?.is_rw_surplus ? (
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-amber-600" />
                  )}
                </div>
                <div className="text-xl font-black mt-1">
                  {payrollSummary?.cash_flow_health?.is_rw_surplus ? 'SURPLUS / CUKUP' : 'DEFISIT / KURANG'}
                </div>
                <div className="text-xs font-semibold mt-1">
                  Porsi Kas RW Terkumpul: <span className="font-extrabold">Rp {Number(payrollSummary?.income?.kas_rw_portion_40 || 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="text-[11px] mt-1 leading-snug">
                  {payrollSummary?.cash_flow_health?.is_rw_surplus ? (
                    <span className="text-emerald-800">Kas RW mampu melunasi seluruh gaji satpam & retribusi sampah dengan surplus cadangan.</span>
                  ) : (
                    <span className="text-amber-900 font-medium">
                      {payrollSummary?.cash_flow_health?.deficit_warning || 'Penerimaan belum cukup menutupi gaji satpam & armada sampah.'}
                    </span>
                  )}
                </div>
              </div>

              {/* Kartu 3: Titik Impas (Break-Even KK Kepatuhan Warga) */}
              <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl text-indigo-950">
                <span className="text-[11px] font-bold uppercase tracking-wider block text-indigo-800">
                  Kewajiban Warga: Titik Impas Kepatuhan
                </span>
                <div className="text-xl font-black text-indigo-900 mt-1">
                  {payrollSummary?.cash_flow_health?.current_paid_kk || 0} / {payrollSummary?.cash_flow_health?.break_even_kk_required || 250} KK
                </div>
                <span className="text-[11px] text-indigo-700 block mt-1 font-semibold">
                  Target KK Wajib Bayar Tanpa Menunggak
                </span>
                <p className="text-[11px] text-indigo-900/80 mt-1 leading-relaxed">
                  Dengan tarif IPL Rp 50.000 (Setoran RW Rp 20.000/KK), dibutuhkan minimal <strong>{payrollSummary?.cash_flow_health?.break_even_kk_required || 250} KK tertib membayar</strong> setiap bulan agar gaji satpam dan pengangkutan sampah tidak terhenti!
                </p>
              </div>
            </div>

            {/* Widget Simulasi Stres Finansial (Jawaban Analisis) */}
            {auditSim && (
              <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Audit Simulasi Kelayakan Kas Perumahan (300 Unit Rumah)</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    3 RT @ 100 Rumah = 300 KK
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] pt-1 border-t border-slate-800">
                  <div className="p-3 bg-slate-800/80 rounded-xl space-y-1">
                    <div className="font-bold text-emerald-400">Skenario Ideal: 300 KK Lunas 100%</div>
                    <div>• Total IPL Masuk: <strong>Rp 15.000.000 / bulan</strong></div>
                    <div>• Kas RW (40%): <strong>Rp 6.000.000</strong> (Tepat menutup 2 Satpam + Armada Sampah)</div>
                    <div>• Kas RT (60%): <strong>Rp 3.000.000 / RT</strong> (Surplus Rp 1.200.000 / bulan untuk kas darurat RT)</div>
                    <div className="text-emerald-300 text-[10px] mt-1 font-semibold">
                      Hasil: Satpam & Sampah TERBAYAR PENUH 100% tanpa defisit.
                    </div>
                  </div>
                  <div className="p-3 bg-slate-800/80 rounded-xl space-y-1">
                    <div className="font-bold text-rose-400">Skenario Menunggak: 30% Warga Tidak Bayar (210 KK)</div>
                    <div>• Total IPL Masuk: <strong>Rp 10.500.000 / bulan</strong></div>
                    <div>• Kas RW (40%): <strong>Rp 4.200.000</strong> (DEFISIT Rp 1.800.000 dari beban Rp 6 Juta)</div>
                    <div className="text-rose-300 text-[10px] mt-1 font-semibold leading-relaxed">
                      Dampak: Gaji satpam atau retribusi truk sampah tidak cukup dibayar. Oleh karena itu, sistem mewajibkan seluruh warga membayar tiap bulan dan tidak boleh menunggak.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tabel Realisasi Pengeluaran Rutin & Penggajian */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                  Daftar Realisasi Penggajian & Pembayaran Operasional
                </h5>
                <span className="text-[11px] text-slate-500 font-semibold">
                  Total {payrollExpenses.length} transaksi tercatat
                </span>
              </div>

              {payrollExpenses.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
                  Belum ada catatan pengeluaran rutin untuk periode ini.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Tingkat & Kategori</th>
                        <th className="py-2.5 px-3">Nama Pos & Penerima</th>
                        <th className="py-2.5 px-3">Nominal Beban</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Otoritas Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payrollExpenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3">
                            <span className={`inline-block font-mono text-[10px] font-black px-2 py-0.5 rounded ${
                              exp.level === 'rw' ? 'bg-indigo-900 text-white' : 'bg-emerald-900 text-white'
                            }`}>
                              {exp.level === 'rw' ? 'RW 05' : `RT ${exp.rt_number}`}
                            </span>
                            <div className="text-[11px] text-slate-600 mt-1 capitalize font-medium">
                              {exp.category.replace(/_/g, ' ')}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{exp.title}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Penerima: <span className="font-semibold text-slate-700">{exp.recipient_name}</span> {exp.recipient_role && `(${exp.recipient_role})`}
                            </div>
                            {exp.notes && (
                              <div className="text-[10px] text-slate-400 mt-0.5 italic">
                                {exp.notes}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 font-extrabold text-slate-900">
                            Rp {Number(exp.amount).toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-3">
                            {exp.status === 'paid' ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center gap-1 w-max">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>LUNAS DICAIRKAN</span>
                              </span>
                            ) : exp.status === 'approved' ? (
                              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold flex items-center gap-1 w-max">
                                <Check className="w-3 h-3" />
                                <span>DISETUJUI KETUA</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold flex items-center gap-1 w-max">
                                <Clock className="w-3 h-3" />
                                <span>MENUNGGU ACC</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {exp.status === 'draft' && ['rw', 'rt', 'super_admin'].includes(user?.role || '') && (
                                <button
                                  onClick={() => handleApproveExpense(exp.id)}
                                  disabled={actionLoading}
                                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold shadow-sm active:scale-95 transition"
                                >
                                  ACC Ketua
                                </button>
                              )}
                              {exp.status === 'approved' && ['bendahara', 'rw', 'rt', 'super_admin'].includes(user?.role || '') && (
                                <button
                                  onClick={() => handleDisburseExpense(exp.id)}
                                  disabled={actionLoading}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-black shadow-sm active:scale-95 transition flex items-center gap-1"
                                >
                                  <CreditCard className="w-3 h-3" />
                                  <span>Cairkan / Bayar</span>
                                </button>
                              )}
                              {exp.status === 'paid' && (
                                <span className="text-[10px] text-slate-400 font-semibold">
                                  Selesai
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Modal Form Catat Pengeluaran / Gaji Baru */}
          {showExpenseModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">Catat Pengeluaran / Gaji Rutin Baru</h4>
                      <p className="text-[11px] text-slate-500">Mencatat beban gaji satpam, retribusi sampah, atau kebersihan</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowExpenseModal(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateExpense} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Tingkat Pengelolaan</label>
                      <select
                        value={expenseForm.level}
                        onChange={(e) => setExpenseForm({ ...expenseForm, level: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                      >
                        <option value="rw">Tingkat RW (Dari Kas RW 40%)</option>
                        <option value="rt">Tingkat RT (Dari Kas RT 60%)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Kategori Beban</label>
                      <select
                        value={expenseForm.category}
                        onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                      >
                        <option value="gaji_satpam">Gaji Satpam Pos Gerbang (RW)</option>
                        <option value="uang_sampah">Retribusi Truk Sampah Terpadu (RW)</option>
                        <option value="kebersihan_lingkungan">Kebersihan Saluran/Lorong (RT)</option>
                        <option value="listrik_iot_fasum">Listrik Pos/Fasum & IoT</option>
                        <option value="perawatan_fasum">Perawatan Fasilitas Umum</option>
                        <option value="honor_operasional">Honor / Operasional Pengurus</option>
                        <option value="lainnya">Lainnya</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Judul Pengeluaran / Gaji</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Gaji Satpam Pos Gerbang Utama Bulan Ini"
                      value={expenseForm.title}
                      onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Nama Penerima</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Bambang Sudrajat"
                        value={expenseForm.recipient_name}
                        onChange={(e) => setExpenseForm({ ...expenseForm, recipient_name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Peran / Instansi</label>
                      <input
                        type="text"
                        placeholder="Contoh: Satpam / DLH / Petugas RT"
                        value={expenseForm.recipient_role}
                        onChange={(e) => setExpenseForm({ ...expenseForm, recipient_role: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Nominal (Rp)</label>
                      <input
                        type="number"
                        required
                        min="1000"
                        step="1000"
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 font-black text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Metode Bayar</label>
                      <select
                        value={expenseForm.payment_method}
                        onChange={(e) => setExpenseForm({ ...expenseForm, payment_method: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                      >
                        <option value="transfer">Transfer Bank</option>
                        <option value="tunai">Tunai / Cash</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Catatan Keterangan</label>
                    <textarea
                      rows={2}
                      placeholder="Keterangan alokasi atau dasar pembayaran..."
                      value={expenseForm.notes}
                      onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowExpenseModal(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 active:scale-95 transition"
                    >
                      {actionLoading ? 'Menyimpan...' : 'Simpan Pengeluaran'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* E. Generate Massal Tagihan Bulanan (Per Periode & Tahun) */}
          {(() => {
            const monthsNames = [
              'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
              'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
            ];
            const targetRts = generateRt === 'all' ? ['01', '02', '03'] : [generateRt];
            const displayedPeriods: Array<{
              rt_number: string;
              month: number;
              month_name: string;
              year: number;
              master_id: number | null;
              billings_count: number;
              total_amount: number;
            }> = [];

            targetRts.forEach((rt) => {
              for (let m = 1; m <= 12; m++) {
                const match = iplMasters.find(
                  (master) =>
                    master.rt_number === rt &&
                    Number(master.period_month) === m &&
                    Number(master.period_year) === generateYear
                );

                displayedPeriods.push({
                  rt_number: rt,
                  month: m,
                  month_name: monthsNames[m - 1],
                  year: generateYear,
                  master_id: match ? match.id : null,
                  billings_count: match ? Number(match.billings_count || 0) : 0,
                  total_amount: match ? Number(match.total_amount || 50000) : 50000,
                });
              }
            });

            const publishedCount = displayedPeriods.filter((p) => p.billings_count > 0).length;
            const pendingCount = displayedPeriods.filter((p) => p.billings_count === 0).length;

            return (
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                        <span>Generate Massal Tagihan Bulanan</span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          Tahun {generateYear}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Menerbitkan tagihan IPL secara otomatis ke seluruh unit rumah aktif di RT terkait (1 Rumah = 1 Tagihan). Anda dapat memilih tahun untuk menerbitkan tagihan berjalan ataupun mendahului (<em>curi start</em>) untuk tahun depan.
                      </p>
                    </div>
                  </div>

                  {/* Year Dropdown & RT Selector Controls */}
                  <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                    {/* Year Dropdown */}
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 pl-2">Tahun:</span>
                      <select
                        value={generateYear}
                        onChange={(e) => setGenerateYear(Number(e.target.value))}
                        className="bg-white font-black text-xs text-slate-800 rounded-xl px-2.5 py-1.5 border border-slate-200 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value={2025}>2025 (Tahun Lalu)</option>
                        <option value={2026}>2026 (Tahun Ini - Aktif)</option>
                        <option value={2027}>2027 (Tahun Depan - Curi Start)</option>
                        <option value={2028}>2028 (Tahun Berikutnya)</option>
                      </select>
                    </div>

                    {/* RT Selector Pills */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                      {['01', '02', '03', 'all'].map((rtVal) => (
                        <button
                          key={rtVal}
                          onClick={() => setGenerateRt(rtVal)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                            generateRt === rtVal
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {rtVal === 'all' ? 'Semua RT' : `RT ${rtVal}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quick Status Legend & Counter */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 px-1">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200"></span>
                      <span>Sudah Digenerate: {publishedCount} Periode</span>
                    </span>
                    <span className="flex items-center gap-1.5 font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-200"></span>
                      <span>Belum Digenerate: {pendingCount} Periode</span>
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Setiap periode menagih ke seluruh unit rumah berpenghuni di RT terpilih.
                  </span>
                </div>

                {/* 12 Months Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                  {displayedPeriods.map((item) => {
                    const isGenerated = item.billings_count > 0;
                    return (
                      <div
                        key={`${item.rt_number}-${item.month}-${item.year}`}
                        className={`p-4 rounded-2xl border-2 flex flex-col justify-between transition-all ${
                          isGenerated
                            ? 'bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/40 border-emerald-400/80 shadow-sm'
                            : 'bg-gradient-to-br from-amber-50/70 via-slate-50 to-orange-50/40 border-dashed border-amber-400 shadow-sm'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-extrabold text-xs text-slate-800">
                              RT {item.rt_number} — Periode {item.month}/{item.year}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 shadow-xs ${
                                isGenerated
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-amber-400 text-slate-950'
                              }`}
                            >
                              {isGenerated ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-white" />
                                  <span>Sudah Digenerate</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 text-slate-950" />
                                  <span>Belum Digenerate</span>
                                </>
                              )}
                            </span>
                          </div>

                          <div className="text-xs font-semibold text-slate-500">
                            Bulan {item.month_name} {item.year}
                          </div>

                          <div className="text-xl font-black text-slate-900">
                            Rp {Number(item.total_amount).toLocaleString('id-ID')}
                            <span className="text-[10px] font-normal text-slate-400 ml-1.5">/ rumah</span>
                          </div>

                          <div className={`text-[11px] font-bold ${isGenerated ? 'text-emerald-800' : 'text-amber-800'}`}>
                            {isGenerated
                              ? `✅ ${item.billings_count} Tagihan Unit Rumah Aktif Terbit`
                              : '⏳ Tagihan belum keluar ke warga (0 rumah terbit)'}
                          </div>

                          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 flex items-center justify-between">
                            <span>Kas RT: Rp 30.000</span>
                            <span>Setoran RW: Rp 20.000</span>
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            item.master_id
                              ? handleGenerateIpl(item.master_id)
                              : handleGeneratePeriod(item.rt_number, item.month, item.year)
                          }
                          disabled={actionLoading}
                          className={`mt-4 w-full py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 active:scale-95 ${
                            isGenerated
                              ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 shadow-xs'
                              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-600/25'
                          }`}
                        >
                          {isGenerated ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Sudah Terbit (Sinkronkan Ulang)</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                              <span>
                                {item.year > 2026
                                  ? `⚡ Curi Start / Terbitkan RT ${item.rt_number}`
                                  : `⚡ Terbitkan Tagihan Massal RT ${item.rt_number}`}
                              </span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 3. AGENDA & KEGIATAN LINGKUNGAN (KHUSUS SEKRETARIS) */}
      {subTab === 'kegiatan' && (
        <div className="space-y-5">
          {/* Role info banner for Sekretaris */}
          <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-3xl text-xs text-blue-950 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="font-extrabold text-sm text-blue-900">
                  Pusat Agenda & Kegiatan Lingkungan (Tugas Pokok Sekretaris RT / RW)
                </div>
                <p className="mt-0.5 text-blue-800 leading-relaxed">
                  Sekretaris bertugas mengoordinasikan kegiatan lingkungan (misal: Kerja Bakti, 17 Agustus, Senam Warga) serta <strong>mengajukan kebutuhan anggaran kegiatan ke Bendahara</strong> untuk disetujui dan dicairkan dari Kas RT / Kas RW.
                </p>
              </div>
              <button
                onClick={() => setShowEventModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 whitespace-nowrap active:scale-95 transition"
              >
                + Buat Agenda & Ajukan Anggaran
              </button>
            </div>
          </div>

          {/* Daftar Agenda & Pengumuman */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-slate-800 px-1">
              Daftar Agenda Kegiatan & Status Anggaran ({announcements.length})
            </h4>

            {announcements.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-xs border border-slate-200">
                Belum ada agenda kegiatan yang diterbitkan.
              </div>
            ) : (
              announcements.map((ann) => (
                <div key={ann.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          {ann.scope?.toUpperCase()}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {ann.event_date ? `Tgl Acara: ${new Date(ann.event_date).toLocaleDateString('id-ID')}` : 'Pengumuman Umum'}
                        </span>
                      </div>
                      <h5 className="font-black text-sm text-slate-900">{ann.title}</h5>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ann.content}</p>
                    </div>

                    {ann.budget_amount && (
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-semibold block">Pengajuan Anggaran</span>
                        <span className="text-sm font-black text-emerald-700">
                          Rp {Number(ann.budget_amount).toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                  </div>

                  {ann.budget_amount && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="text-slate-500">
                        Sumber:{' '}
                        <strong className="text-slate-800">
                          {ann.budget_source === 'kas_rt' ? 'Kas RT' : ann.budget_source === 'kas_rw' ? 'Kas RW 05' : 'Swadaya'}
                        </strong>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-400">Status Bendahara:</span>
                        {ann.budget_status === 'approved' ? (
                          <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                            ✓ Disetujui
                          </span>
                        ) : ann.budget_status === 'disbursed' ? (
                          <span className="text-[10px] font-black px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full">
                            ✓ Kas Dicairkan
                          </span>
                        ) : ann.budget_status === 'rejected' ? (
                          <span className="text-[10px] font-black px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full">
                            ✕ Ditolak
                          </span>
                        ) : (
                          <span className="text-[10px] font-black px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                            ⏳ Menunggu ACC Bendahara
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Modal Buat Agenda & Pengajuan Anggaran (Khusus Sekretaris) */}
          {showEventModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">
                        Buat Agenda Kegiatan Lingkungan
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Diajukan oleh Sekretaris ({user?.name})
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowEventModal(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateEvent} className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama / Judul Kegiatan:
                    </label>
                    <input
                      type="text"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      placeholder="Contoh: Kerja Bakti Lingkungan Bersih RT 01"
                      required
                      className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Cakupan Wilayah:
                      </label>
                      <select
                        value={eventScope}
                        onChange={(e) => setEventScope(e.target.value)}
                        className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                      >
                        <option value="rt01">Tingkat RT 01</option>
                        <option value="rt02">Tingkat RT 02</option>
                        <option value="rt03">Tingkat RT 03</option>
                        <option value="rw">Tingkat RW 05 (Semua RT)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tanggal Pelaksanaan:
                      </label>
                      <input
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Kebutuhan Anggaran Biaya (Rp):
                      </label>
                      <input
                        type="number"
                        value={eventBudget}
                        onChange={(e) => setEventBudget(e.target.value)}
                        placeholder="Contoh: 1500000"
                        className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Sumber Pembiayaan:
                      </label>
                      <select
                        value={eventBudgetSource}
                        onChange={(e) => setEventBudgetSource(e.target.value as any)}
                        className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                      >
                        <option value="kas_rt">Kas RT Setempat</option>
                        <option value="kas_rw">Kas Induk RW 05</option>
                        <option value="swadaya">Swadaya / Donasi Sukarela</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Deskripsi & Rincian Rencana Kegiatan:
                    </label>
                    <textarea
                      value={eventContent}
                      onChange={(e) => setEventContent(e.target.value)}
                      rows={3}
                      placeholder="Jelaskan tujuan, jadwal, perlengkapan yang dibutuhkan, dan rincian alokasi biaya..."
                      required
                      className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                    💡 <strong>Catatan Prosedural:</strong> Pengajuan anggaran ini akan dikirim ke <strong>Bendahara RT / RW</strong> untuk verifikasi dan persetujuan pencairan kas.
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowEventModal(false)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition disabled:opacity-50"
                    >
                      {actionLoading ? 'Menerbitkan...' : 'Terbitkan & Ajukan Anggaran'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. VERIFIKASI TOP-UP */}
      {subTab === 'topup' && (
        <div className="space-y-3">
          <h4 className="font-extrabold text-sm text-slate-800 px-1">
            Pengajuan Top-Up Saldo Dompet Warga
          </h4>

          {pendingTopups.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-xs border border-slate-200">
              Tidak ada pengajuan top-up yang menunggu verifikasi.
            </div>
          ) : (
            pendingTopups.map((tx) => (
              <div key={tx.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-sm text-slate-900">{tx.user?.name}</h5>
                  <div className="text-base font-black text-emerald-700 mt-0.5">
                    Rp {Number(tx.amount).toLocaleString('id-ID')}
                  </div>
                  {tx.proof_path && (
                    <a
                      href={`http://smartwarga.test${tx.proof_path}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 mt-1 font-semibold"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Lihat Bukti Transfer / Resi</span>
                    </a>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleVerifyTopup(tx.id, 'approve')}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm"
                  >
                    Tambah Saldo
                  </button>
                  <button
                    onClick={() => handleVerifyTopup(tx.id, 'reject')}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-xl"
                  >
                    Tolak
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 4. VALIDASI SURAT PENGANTAR RT/RW */}
      {subTab === 'surat' && (
        <div className="space-y-3">
          <h4 className="font-extrabold text-sm text-slate-800 px-1">
            Validasi Persuratan Warga
          </h4>

          {pendingLetters.filter(l => l.status === 'submitted' || l.status === 'rt_approved').length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-xs border border-slate-200">
              Tidak ada surat yang memerlukan persetujuan saat ini.
            </div>
          ) : (
            pendingLetters
              .filter(l => l.status === 'submitted' || l.status === 'rt_approved')
              .map((letter) => (
                <div key={letter.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      Surat {letter.type}
                    </span>
                    <h5 className="font-bold text-sm text-slate-900 mt-1">{letter.purpose}</h5>
                    <div className="text-xs text-slate-500 mt-0.5">Pemohon: {letter.user?.name} ({letter.user?.house?.full_address})</div>
                  </div>

                  <div>
                    {letter.status === 'submitted' && (
                      <button
                        onClick={() => handleApproveLetter(letter.id, 'rt')}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm"
                      >
                        ACC Tingkat RT
                      </button>
                    )}

                    {letter.status === 'rt_approved' && (
                      <button
                        onClick={() => handleApproveLetter(letter.id, 'rw')}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm"
                      >
                        Validasi RW & Generate PDF
                      </button>
                    )}
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {/* 5. PEMINJAMAN & INVENTARIS ASET FASUM */}
      {subTab === 'aset' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-extrabold text-sm text-slate-800">
                Peminjaman Aset & Fasilitas Umum (Fasum)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola permohonan pinjam tenda, kursi, sound system, terop balai warga serta ketersediaan stok.
              </p>
            </div>
            <button
              onClick={() => setShowAddAssetModal(true)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Aset</span>
            </button>
          </div>

          {/* Permohonan Pinjam Masuk */}
          <div className="space-y-2">
            <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-500">
              Antrean Permohonan Pinjam
            </h5>

            {assetLoans.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center text-slate-400 text-xs border border-slate-200">
                Tidak ada permohonan peminjaman aset saat ini.
              </div>
            ) : (
              assetLoans.map((loan) => (
                <div key={loan.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        {loan.asset?.category}
                      </span>
                      <h5 className="font-bold text-sm text-slate-900">{loan.asset?.name} ({loan.quantity} Unit)</h5>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Peminjam: <strong>{loan.user?.name}</strong> ({loan.user?.house?.full_address || 'RT ' + loan.user?.rt_number})
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Periode: {loan.loan_date} s/d {loan.return_date}
                      {Number(loan.donation_amount) > 0 && ` • Infaq: Rp ${Number(loan.donation_amount).toLocaleString('id-ID')}`}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {loan.status === 'requested' && (
                      <>
                        <button
                          onClick={() => handleRejectAssetLoan(loan.id)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200"
                        >
                          Tolak
                        </button>
                        <button
                          onClick={() => handleApproveAssetLoan(loan.id)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm"
                        >
                          Setujui Pinjam (ACC)
                        </button>
                      </>
                    )}

                    {loan.status === 'approved' && (
                      <button
                        onClick={() => handleReturnAssetLoan(loan.id)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm"
                      >
                        Tandai Dikembalikan
                      </button>
                    )}

                    {loan.status === 'returned' && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full">
                        Selesai Dikembalikan
                      </span>
                    )}

                    {loan.status === 'rejected' && (
                      <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2.5 py-1 rounded-full">
                        Ditolak
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Stok Inventaris Wilayah */}
          <div className="pt-3">
            <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 mb-2">
              Daftar Stok Inventaris Fasum
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {assetList.map((ast) => (
                <div key={ast.id} className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm">
                  <div className="text-[10px] uppercase font-bold text-slate-400">{ast.category}</div>
                  <h6 className="font-bold text-sm text-slate-900 mt-0.5">{ast.name}</h6>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500">Stok Total:</span>
                    <span className="font-extrabold text-slate-900">{ast.quantity} Unit</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-0.5">
                    <span>Kondisi:</span>
                    <span className="text-emerald-700 font-bold">{ast.condition}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. KOPERASI SIMPAN PINJAM & ETALASE UMKM WARGA */}
      {subTab === 'koperasi' && (
        <div className="space-y-5">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 text-white shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <Landmark className="w-6 h-6 text-indigo-300" />
                </div>
                <div>
                  <h4 className="font-black text-lg text-white tracking-tight">
                    Koperasi Simpan Pinjam & Etalase UMKM Warga
                  </h4>
                  <p className="text-xs text-indigo-200 mt-0.5">
                    Verifikasi persetujuan pinjaman usaha mikro, pencairan langsung ke Dompet Warga, serta promosi produk UMKM.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Auto-Disburse Active
                </span>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/10">
              <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                <div className="text-[10px] uppercase font-bold text-indigo-200">Total Dicairkan</div>
                <div className="text-base font-black text-white mt-0.5">
                  Rp {koperasiLoans
                    .filter((l) => l.status === 'disbursed')
                    .reduce((sum, l) => sum + Number(l.amount || 0), 0)
                    .toLocaleString('id-ID')}
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                <div className="text-[10px] uppercase font-bold text-amber-200">Menunggu ACC</div>
                <div className="text-base font-black text-amber-300 mt-0.5">
                  {koperasiLoans.filter((l) => l.status === 'submitted').length} Pengajuan
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                <div className="text-[10px] uppercase font-bold text-indigo-200">Total Pinjaman</div>
                <div className="text-base font-black text-white mt-0.5">
                  {koperasiLoans.length} Berkas
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                <div className="text-[10px] uppercase font-bold text-emerald-200">Katalog UMKM</div>
                <div className="text-base font-black text-emerald-300 mt-0.5">
                  {umkmList.length} Produk Aktif
                </div>
              </div>
            </div>
          </div>

          {/* 1. Antrean Verifikasi Pinjaman Mikro Masuk */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Antrean Verifikasi Pinjaman Usaha Mikro</span>
                </h5>
                <p className="text-xs text-slate-500 mt-0.5">
                  Persetujuan oleh Bendahara / Pengurus RT/RW dengan pencairan saldo otomatis ke Dompet Warga.
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                {koperasiLoans.filter((l) => l.status === 'submitted').length} Menunggu
              </span>
            </div>

            {koperasiLoans.filter((l) => l.status === 'submitted').length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-sm space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h6 className="font-bold text-sm text-slate-800">Tidak Ada Antrean Pengajuan</h6>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Semua permohonan pinjaman mikro usaha warga telah diproses oleh Pengurus / Bendahara Koperasi.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {koperasiLoans
                  .filter((l) => l.status === 'submitted')
                  .map((loan) => (
                    <div
                      key={loan.id}
                      className="bg-white rounded-3xl p-5 border border-amber-200 shadow-sm hover:shadow-md transition space-y-4 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none"></div>

                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            Menunggu Persetujuan
                          </span>
                          <h6 className="font-extrabold text-base text-slate-900 mt-2">
                            {loan.user?.name || 'Warga'}
                          </h6>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <Home className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {loan.user?.house?.full_address || `RT 0${loan.user?.rt_number || '1'}`}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs text-slate-400 font-semibold">Nominal Pinjaman</div>
                          <div className="text-lg font-black text-indigo-900">
                            Rp {Number(loan.amount).toLocaleString('id-ID')}
                          </div>
                        </div>
                      </div>

                      {/* Detail Finansial & Cicilan */}
                      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="text-slate-400 text-[11px]">Tenor Pinjaman:</div>
                          <div className="font-black text-slate-800 mt-0.5">{loan.tenor_months} Bulan</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[11px]">Estimasi Cicilan:</div>
                          <div className="font-black text-indigo-700 mt-0.5">
                            Rp {Number(loan.monthly_installment).toLocaleString('id-ID')} / bln
                          </div>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-slate-200/60">
                          <div className="text-slate-400 text-[11px]">Keperluan / Rencana Usaha:</div>
                          <div className="font-medium text-slate-700 italic mt-0.5">
                            "{loan.purpose}"
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleDecideKoperasiLoan(loan.id, 'reject')}
                          disabled={actionLoading}
                          className="flex-1 py-2.5 px-3 rounded-2xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Tolak</span>
                        </button>
                        <button
                          onClick={() => handleDecideKoperasiLoan(loan.id, 'approve')}
                          disabled={actionLoading}
                          className="flex-2 py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Setujui & Cairkan ke Dompet</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* 2. Riwayat Pinjaman Terproses */}
          <div className="space-y-3 pt-2">
            <h5 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-slate-600" />
              <span>Riwayat Pengajuan Pinjaman Terverifikasi</span>
            </h5>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              {koperasiLoans.filter((l) => l.status !== 'submitted').length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  Belum ada riwayat pinjaman yang selesai diproses.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {koperasiLoans
                    .filter((l) => l.status !== 'submitted')
                    .map((loan) => (
                      <div key={loan.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                loan.status === 'disbursed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {loan.status === 'disbursed' ? 'Dana Dicairkan' : 'Ditolak'}
                            </span>
                            <h6 className="font-bold text-sm text-slate-900">{loan.user?.name}</h6>
                            <span className="text-xs text-slate-400">
                              ({loan.user?.house?.full_address || `RT ${loan.user?.rt_number}`})
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">
                            Keperluan: <span className="italic font-medium">"{loan.purpose}"</span>
                          </div>
                        </div>

                        <div className="text-right space-y-1">
                          <div className="text-sm font-black text-slate-900">
                            Rp {Number(loan.amount).toLocaleString('id-ID')}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Tenor {loan.tenor_months} bln • Cicilan Rp {Number(loan.monthly_installment).toLocaleString('id-ID')}/bln
                          </div>
                          {loan.disbursed_at && (
                            <div className="text-[10px] text-emerald-600 font-bold flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Cair {new Date(loan.disbursed_at).toLocaleDateString('id-ID')}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* 3. Katalog Produk & Promosi UMKM Warga */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Store className="w-4 h-4 text-emerald-600" />
                  <span>Katalog Promosi Produk UMKM Warga</span>
                </h5>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar usaha mikro warga yang aktif dipromosikan ke seluruh lingkungan RT/RW.
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                {umkmList.length} Produk
              </span>
            </div>

            {umkmList.length === 0 ? (
              <div className="bg-white rounded-3xl p-6 text-center text-slate-400 text-xs border border-slate-200">
                Belum ada produk UMKM yang didaftarkan oleh warga.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {umkmList.map((prod) => (
                  <div
                    key={prod.id}
                    className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {prod.category}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">
                          RT 0{prod.user?.rt_number || '1'}
                        </span>
                      </div>
                      <h6 className="font-bold text-sm text-slate-900 mt-2 line-clamp-1">
                        {prod.name}
                      </h6>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {prod.description}
                      </p>
                      <div className="text-base font-black text-emerald-700 mt-2">
                        Rp {Number(prod.price).toLocaleString('id-ID')}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-600">
                        {prod.user?.name}
                      </span>
                      {prod.whatsapp_link && (
                        <a
                          href={prod.whatsapp_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Hubungi Penjual</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. POSYANDU DIGITAL TERPADU (KMS BALITA, IMUNISASI, LANSIA) */}
      {subTab === 'posyandu' && (
        <div className="space-y-5">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-teal-900 via-emerald-950 to-slate-900 rounded-3xl p-6 text-white shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <HeartPulse className="w-6 h-6 text-emerald-300" />
                </div>
                <div>
                  <h4 className="font-black text-lg text-white tracking-tight">
                    Posyandu Digital Terpadu RW 05
                  </h4>
                  <p className="text-xs text-emerald-200 mt-0.5">
                    KMS Balita kurva WHO, jadwal imunisasi dasar lengkap, serta pemantauan biomarker kesehatan lansia.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Standar Kemenkes & WHO
                </span>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/10">
              <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                <div className="text-[10px] uppercase font-bold text-emerald-200">Balita Terdata</div>
                <div className="text-base font-black text-white mt-0.5">
                  {posyanduBalita.length} Anak
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                <div className="text-[10px] uppercase font-bold text-emerald-200">KMS Garis Hijau</div>
                <div className="text-base font-black text-emerald-300 mt-0.5">
                  {posyanduBalita.filter((b) => b.kms_status === 'green').length} Balita Normal
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                <div className="text-[10px] uppercase font-bold text-blue-200">Imunisasi Lengkap</div>
                <div className="text-base font-black text-blue-300 mt-0.5">
                  {posyanduImun.filter((i) => i.status === 'completed').length} / {posyanduImun.length}
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                <div className="text-[10px] uppercase font-bold text-amber-200">Lansia Terpantau</div>
                <div className="text-base font-black text-amber-300 mt-0.5">
                  {posyanduLansia.length} Warga
                </div>
              </div>
            </div>
          </div>

          {/* Sub-module Navigation Bar */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex gap-2">
              <button
                onClick={() => setPosyanduAdminSection('balita')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  posyanduAdminSection === 'balita'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Baby className="w-3.5 h-3.5" />
                <span>KMS Balita ({posyanduBalita.length})</span>
              </button>
              <button
                onClick={() => setPosyanduAdminSection('imunisasi')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  posyanduAdminSection === 'imunisasi'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Syringe className="w-3.5 h-3.5" />
                <span>Jadwal Imunisasi ({posyanduImun.length})</span>
              </button>
              <button
                onClick={() => setPosyanduAdminSection('lansia')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  posyanduAdminSection === 'lansia'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Kesehatan Lansia ({posyanduLansia.length})</span>
              </button>
            </div>

            {/* Quick Action Button */}
            <div>
              {posyanduAdminSection === 'balita' && (
                <button
                  onClick={() => setShowBalitaModal(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Catat Penimbangan Balita</span>
                </button>
              )}
              {posyanduAdminSection === 'imunisasi' && (
                <button
                  onClick={() => setShowImunModal(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Jadwalkan Vaksin</span>
                </button>
              )}
              {posyanduAdminSection === 'lansia' && (
                <button
                  onClick={() => setShowLansiaModal(true)}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Skrining Lansia</span>
                </button>
              )}
            </div>
          </div>

          {/* 1. CONTENT: KMS BALITA */}
          {posyanduAdminSection === 'balita' && (
            <div className="space-y-3">
              {posyanduBalita.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-sm space-y-2">
                  <Baby className="w-8 h-8 mx-auto text-slate-300" />
                  <h6 className="font-bold text-sm text-slate-800">Belum Ada Rekam Penimbangan Balita</h6>
                  <p className="text-xs text-slate-500">
                    Klik tombol "Catat Penimbangan Balita" untuk memasukkan data berat, tinggi, dan evaluasi kurva KMS.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {posyanduBalita.map((balita) => (
                    <div
                      key={balita.id}
                      className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3 hover:border-slate-300 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-extrabold text-base text-slate-900">{balita.child_name}</h5>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                              {balita.gender === 'P' ? 'Perempuan' : 'Laki-laki'} • {balita.age_months || 0} bln
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Orang Tua: <strong>{balita.parent?.name || 'Warga'}</strong> ({balita.parent?.house?.full_address || `RT ${balita.parent?.rt_number || '01'}`})
                          </div>
                        </div>

                        <div>
                          {balita.kms_status === 'green' ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Garis Hijau (Normal)
                            </span>
                          ) : balita.kms_status === 'red' ? (
                            <span className="bg-red-100 text-red-800 text-[10px] font-black px-2.5 py-1 rounded-full border border-red-200 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-red-600" /> BGM / Gizi Buruk
                            </span>
                          ) : (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-amber-600" /> Garis Kuning (Waspada)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Metrik Tumbuh Kembang */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl text-center">
                        <div className="border-r border-slate-200/60">
                          <div className="text-[10px] text-slate-400 font-bold">Berat Badan</div>
                          <div className="text-base font-black text-slate-900 mt-0.5">{balita.weight_kg} kg</div>
                        </div>
                        <div className="border-r border-slate-200/60">
                          <div className="text-[10px] text-slate-400 font-bold">Tinggi Badan</div>
                          <div className="text-base font-black text-slate-900 mt-0.5">{balita.height_cm} cm</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold">Lingkar Kepala</div>
                          <div className="text-base font-black text-slate-900 mt-0.5">
                            {balita.head_circumference_cm ? `${balita.head_circumference_cm} cm` : '-'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <div className="text-slate-600">
                          Status Gizi: <strong className="text-slate-900">{balita.nutrition_status}</strong>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${balita.vitamin_a ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-500'}`}>
                          Vit. A: {balita.vitamin_a ? 'Sudah' : 'Belum'}
                        </span>
                      </div>

                      {balita.notes && (
                        <div className="text-[11px] text-slate-500 italic bg-amber-50/70 p-2.5 rounded-xl border border-amber-100">
                          Catatan: "{balita.notes}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. CONTENT: JADWAL & REKAM IMUNISASI */}
          {posyanduAdminSection === 'imunisasi' && (
            <div className="space-y-3">
              {posyanduImun.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-sm space-y-2">
                  <Syringe className="w-8 h-8 mx-auto text-slate-300" />
                  <h6 className="font-bold text-sm text-slate-800">Belum Ada Jadwal Imunisasi</h6>
                  <p className="text-xs text-slate-500">
                    Klik "Jadwalkan Vaksin" untuk mengatur jadwal imunisasi balita warga.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="divide-y divide-slate-100">
                    {posyanduImun.map((imun) => (
                      <div
                        key={imun.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                              {imun.vaccine_name}
                            </span>
                            <h6 className="font-bold text-sm text-slate-900">{imun.child_name}</h6>
                            <span className="text-xs text-slate-400">
                              ({imun.target_age_months} Bulan)
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">
                            Jadwal: {new Date(imun.scheduled_date).toLocaleDateString('id-ID')}
                            {imun.administered_date && ` • Disuntikkan: ${new Date(imun.administered_date).toLocaleDateString('id-ID')}`}
                            {imun.batch_number && ` • Batch: #${imun.batch_number}`}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {imun.status === 'scheduled' ? (
                            <button
                              onClick={() => handleCompleteImun(imun.id)}
                              disabled={actionLoading}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Tandai Selesai Suntik</span>
                            </button>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. CONTENT: PEMANTAUAN KESEHATAN LANSIA */}
          {posyanduAdminSection === 'lansia' && (
            <div className="space-y-3">
              {posyanduLansia.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-sm space-y-2">
                  <Activity className="w-8 h-8 mx-auto text-slate-300" />
                  <h6 className="font-bold text-sm text-slate-800">Belum Ada Data Skrining Lansia</h6>
                  <p className="text-xs text-slate-500">
                    Klik "Skrining Lansia" untuk mencatat tekanan darah, gula darah sewaktu, dan kolesterol warga senior.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {posyanduLansia.map((lansia) => (
                    <div
                      key={lansia.id}
                      className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3 hover:border-slate-300 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-extrabold text-base text-slate-900">{lansia.elderly_name}</h5>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                              {lansia.age} Tahun • RT {lansia.rt_number || '01'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            Diperiksa: {new Date(lansia.examined_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
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

                      {/* Biomarker Cards */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl text-xs text-center">
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold">Gula Darah (GDS)</div>
                          <div className="text-sm font-black text-slate-900 mt-0.5">
                            {lansia.blood_sugar ? `${lansia.blood_sugar} mg/dL` : '-'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold">Kolesterol</div>
                          <div className="text-sm font-black text-slate-900 mt-0.5">
                            {lansia.cholesterol ? `${lansia.cholesterol} mg/dL` : '-'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold">Asam Urat</div>
                          <div className="text-sm font-black text-slate-900 mt-0.5">
                            {lansia.uric_acid ? `${lansia.uric_acid} mg/dL` : '-'}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs space-y-1 pt-1">
                        <div className="text-slate-700">
                          Diagnosa: <strong className="text-slate-900">{lansia.risk_assessment}</strong>
                        </div>
                        {lansia.recommendations && (
                          <div className="text-[11px] text-teal-800 bg-teal-50 p-2.5 rounded-xl border border-teal-100">
                            Saran: "{lansia.recommendations}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 8. RUKAM & AMBULANS SIAGA PENGURUS VIEW */}
      {subTab === 'rukam' && (
        <div className="space-y-4">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 rounded-3xl p-5 text-white shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <HeartHandshake className="w-6 h-6 text-rose-300" />
                </div>
                <div>
                  <h4 className="font-black text-base sm:text-lg text-white">
                    RUKAM & Manajemen Armada Ambulans Siaga RW 05
                  </h4>
                  <p className="text-xs text-rose-200 mt-0.5">
                    Verifikasi duka cita warga, pencairan santunan kas RT/RW Rp 1.500.000, dan kesiapsiagaan ambulans 24 jam.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddAmbulanceModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Armada</span>
                </button>
              </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-white/15">
              <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
                <div className="text-[10px] text-rose-200 uppercase font-bold tracking-wider">Total Kematian Terdata</div>
                <div className="text-lg font-black text-white mt-0.5">
                  {rukamStats?.total_deceased ?? rukamList.length} <span className="text-xs font-normal text-rose-200">Warga</span>
                </div>
              </div>
              <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
                <div className="text-[10px] text-rose-200 uppercase font-bold tracking-wider">Total Santunan Kas Cair</div>
                <div className="text-lg font-black text-emerald-300 mt-0.5">
                  Rp {(rukamStats?.total_disbursed_nominal || 0).toLocaleString('id-ID')}
                </div>
              </div>
              <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
                <div className="text-[10px] text-rose-200 uppercase font-bold tracking-wider">Menunggu Verifikasi</div>
                <div className="text-lg font-black text-amber-300 mt-0.5">
                  {rukamStats?.pending_verification ?? rukamList.filter(r => r.status === 'reported').length} <span className="text-xs font-normal text-rose-200">Laporan</span>
                </div>
              </div>
              <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
                <div className="text-[10px] text-rose-200 uppercase font-bold tracking-wider">Armada Siaga Siap</div>
                <div className="text-lg font-black text-sky-300 mt-0.5">
                  {rukamStats?.ambulances_available ?? ambulancesList.filter(a => a.status === 'available').length} <span className="text-xs font-normal text-rose-200">Unit Siap</span>
                </div>
              </div>
            </div>

            {/* Sub-Section Switcher */}
            <div className="flex gap-2 pt-1 border-t border-white/15 text-xs font-bold">
              <button
                onClick={() => setRukamAdminSection('laporan')}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                  rukamAdminSection === 'laporan'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>Laporan Duka & Santunan Kas ({rukamList.length})</span>
              </button>
              <button
                onClick={() => setRukamAdminSection('ambulans')}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                  rukamAdminSection === 'ambulans'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>Armada & Disposisi Booking ({ambulanceBookingsList.length})</span>
              </button>
            </div>
          </div>

          {/* SUB-SECTION 1: LAPORAN DUKA & SANTUNAN */}
          {rukamAdminSection === 'laporan' && (
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-extrabold text-sm text-slate-900">
                    Daftar Pelaporan RUKAM & Santunan Duka Warga
                  </h5>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verifikasi berkas kematian dan instruksikan pencairan santunan kas RT/RW Rp 1.500.000 ke keluarga.
                  </p>
                </div>
              </div>

              {rukamList.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Belum ada laporan duka cita yang diajukan warga.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="pb-3">Almarhum / Almh</th>
                        <th className="pb-3">Pelapor / Keluarga</th>
                        <th className="pb-3">Bantuan Fasum</th>
                        <th className="pb-3">Santunan Kas RT</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Aksi Pengurus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {rukamList.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5">
                            <div className="font-bold text-slate-900">Alm/Almh. {item.deceased_name}</div>
                            <div className="text-[11px] text-slate-500">
                              Wafat: {new Date(item.date_of_death).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                            {item.burial_location && (
                              <div className="text-[10px] text-slate-400">TPU: {item.burial_location}</div>
                            )}
                          </td>
                          <td className="py-3.5">
                            <div className="font-bold text-slate-800">{item.reporter?.name ?? 'Warga'}</div>
                            <div className="text-[11px] text-slate-500">
                              Hubungan: <strong>{item.relation}</strong> • {item.deceased_address}
                            </div>
                          </td>
                          <td className="py-3.5">
                            <div className="flex flex-col gap-1">
                              {item.needs_ambulance && (
                                <span className="inline-block text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded w-fit">
                                  Ambulans Jenazah
                                </span>
                              )}
                              {item.needs_tent_and_chairs && (
                                <span className="inline-block text-[10px] font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded w-fit">
                                  Tenda & Kursi RT
                                </span>
                              )}
                              {!item.needs_ambulance && !item.needs_tent_and_chairs && (
                                <span className="text-slate-400 text-[11px]">-</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5">
                            <div className="font-black text-rose-700">
                              Rp {(Number(item.disbursement_amount) || 1500000).toLocaleString('id-ID')}
                            </div>
                          </td>
                          <td className="py-3.5">
                            <span
                              className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                                item.status === 'disbursed'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : item.status === 'verified'
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              {item.status === 'disbursed'
                                ? 'Santunan Cair'
                                : item.status === 'verified'
                                ? 'Terverifikasi'
                                : 'Menunggu Verifikasi'}
                            </span>
                          </td>
                          <td className="py-3.5 text-right">
                            {item.status === 'reported' && (
                              <button
                                onClick={() => handleVerifyRukam(item.id)}
                                disabled={actionLoading}
                                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition"
                              >
                                Verifikasi
                              </button>
                            )}
                            {item.status === 'verified' && (
                              <button
                                onClick={() => handleOpenDisburseModal(item)}
                                disabled={actionLoading}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition"
                              >
                                Cairkan Santunan
                              </button>
                            )}
                            {item.status === 'disbursed' && (
                              <span className="text-[11px] font-bold text-emerald-600 flex items-center justify-end gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Lunas Kas</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* SUB-SECTION 2: ARMADA & DISPOSISI AMBULANS */}
          {rukamAdminSection === 'ambulans' && (
            <div className="space-y-4">
              {/* Fleet Management Card */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-extrabold text-sm text-slate-900">
                      Armada Ambulans Siaga RW 05
                    </h5>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Kelola kesiapsiagaan kendaraan darurat dan pembaruan status armada.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddAmbulanceModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Armada</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                  {ambulancesList.map((amb) => (
                    <div
                      key={amb.id}
                      className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2.5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Car className="w-4 h-4 text-slate-700" />
                            <h6 className="font-black text-xs text-slate-900">{amb.name}</h6>
                          </div>
                          <span className="text-[10px] font-mono font-bold bg-white text-slate-800 px-1.5 py-0.5 rounded border border-slate-200 mt-1 inline-block">
                            {amb.vehicle_number}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
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
                            ? 'Sedang Tugas'
                            : 'Perawatan'}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600 space-y-0.5">
                        <div>Tipe: <strong className="capitalize">{amb.type}</strong></div>
                        <div>Driver: {amb.driver_name || 'Tim Siaga RW'} ({amb.driver_phone || '-'})</div>
                      </div>

                      {/* Status quick toggle */}
                      <div className="pt-2 border-t border-slate-200/60 flex gap-1">
                        <button
                          onClick={() => handleUpdateAmbulanceStatus(amb.id, 'available')}
                          className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition ${
                            amb.status === 'available' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          Siap
                        </button>
                        <button
                          onClick={() => handleUpdateAmbulanceStatus(amb.id, 'in_service')}
                          className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition ${
                            amb.status === 'in_service' ? 'bg-amber-500 text-slate-900' : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          Tugas
                        </button>
                        <button
                          onClick={() => handleUpdateAmbulanceStatus(amb.id, 'maintenance')}
                          className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition ${
                            amb.status === 'maintenance' ? 'bg-red-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          Bengkel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bookings & Dispatch Table */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
                <div>
                  <h5 className="font-extrabold text-sm text-slate-900">
                    Disposisi Permintaan & Jadwal Ambulans
                  </h5>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tugaskan driver dan armada ambulans siaga untuk warga yang membutuhkan segera.
                  </p>
                </div>

                {ambulanceBookingsList.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    Belum ada permintaan booking ambulans.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                          <th className="pb-3">Kode & Pasien</th>
                          <th className="pb-3">Layanan & Urgensi</th>
                          <th className="pb-3">Rute Penjemputan</th>
                          <th className="pb-3">Armada & Driver</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3 text-right">Aksi Disposisi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {ambulanceBookingsList.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3.5">
                              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded">
                                {b.booking_code}
                              </span>
                              <div className="font-bold text-slate-900 mt-1">{b.patient_name}</div>
                              <div className="text-[10px] text-slate-400">
                                Pemohon: {b.user?.name ?? 'Warga'} ({b.user?.house?.rt_number ? `RT ${b.user.house.rt_number}` : ''})
                              </div>
                            </td>
                            <td className="py-3.5">
                              <span className="capitalize font-bold text-slate-800 block">{b.service_type}</span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded inline-block mt-0.5 ${
                                  b.urgency_level === 'urgent'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {b.urgency_level === 'urgent' ? '🚨 Darurat' : '📅 Terjadwal'}
                              </span>
                            </td>
                            <td className="py-3.5">
                              <div className="text-[11px] text-slate-700">Jemput: <strong>{b.pickup_address}</strong></div>
                              <div className="text-[11px] text-slate-500">Tujuan: {b.destination_address}</div>
                            </td>
                            <td className="py-3.5">
                              {b.ambulance ? (
                                <div>
                                  <div className="font-bold text-slate-800">{b.ambulance.name}</div>
                                  <div className="text-[10px] text-slate-500">
                                    Driver: {b.driver_name} ({b.driver_phone})
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">Belum ditugaskan</span>
                              )}
                            </td>
                            <td className="py-3.5">
                              <span
                                className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
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
                                  ? 'Selesai'
                                  : b.status === 'dispatched'
                                  ? 'Meluncur'
                                  : b.status === 'cancelled'
                                  ? 'Batal'
                                  : 'Diminta'}
                              </span>
                            </td>
                            <td className="py-3.5 text-right">
                              {b.status === 'requested' && (
                                <button
                                  onClick={() => handleOpenDispatchModal(b)}
                                  disabled={actionLoading}
                                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs shadow-sm transition"
                                >
                                  Disposisi Armada
                                </button>
                              )}
                              {b.status === 'dispatched' && (
                                <button
                                  onClick={() => handleCompleteAmbulanceBooking(b.id)}
                                  disabled={actionLoading}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition"
                                >
                                  Selesai Tugas
                                </button>
                              )}
                              {b.status === 'completed' && (
                                <span className="text-[11px] font-bold text-emerald-600 flex items-center justify-end gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Tuntas</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Tambah Balita KMS */}
      {showBalitaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black text-slate-900 mb-1">Catat Penimbangan & KMS Balita</h3>
            <p className="text-xs text-slate-500 mb-4">
              Kurva berat dan status gizi akan dievaluasi otomatis sesuai standar WHO.
            </p>
            <form onSubmit={handleStoreBalita} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Balita:</label>
                <input
                  type="text"
                  value={balitaName}
                  onChange={(e) => setBalitaName(e.target.value)}
                  placeholder="Contoh: Muhammad Rayyan"
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Kelamin:</label>
                  <select
                    value={balitaGender}
                    onChange={(e) => setBalitaGender(e.target.value as any)}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Usia (Bulan):</label>
                  <input
                    type="number"
                    min={0}
                    max={72}
                    value={balitaAgeMonths}
                    onChange={(e) => setBalitaAgeMonths(Number(e.target.value))}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Berat (kg):</label>
                  <input
                    type="number"
                    step="0.05"
                    value={balitaWeight}
                    onChange={(e) => setBalitaWeight(Number(e.target.value))}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tinggi (cm):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={balitaHeight}
                    onChange={(e) => setBalitaHeight(Number(e.target.value))}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">LK (cm):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={balitaHeadCirc}
                    onChange={(e) => setBalitaHeadCirc(Number(e.target.value))}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="vitA"
                  checked={balitaVitA}
                  onChange={(e) => setBalitaVitA(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="vitA" className="text-xs font-bold text-slate-700">
                  Pemberian Kapsul Vitamin A (Februari/Agustus)
                </label>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Kader Posyandu:</label>
                <textarea
                  value={balitaNotes}
                  onChange={(e) => setBalitaNotes(e.target.value)}
                  placeholder="Contoh: MPASI adekuat, kurva naik mengikuti garis hijau."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 h-16"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBalitaModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  {actionLoading ? 'Menyimpan...' : 'Simpan Data KMS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Jadwal Imunisasi */}
      {showImunModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-black text-slate-900 mb-1">Jadwalkan Imunisasi Balita</h3>
            <p className="text-xs text-slate-500 mb-4">Tambahkan jadwal vaksinasi dasar lengkap balita.</p>
            <form onSubmit={handleStoreImun} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Balita:</label>
                <input
                  type="text"
                  value={imunChildName}
                  onChange={(e) => setImunChildName(e.target.value)}
                  placeholder="Contoh: Alifa Zahra"
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Vaksin:</label>
                <select
                  value={imunVaccine}
                  onChange={(e) => setImunVaccine(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300"
                >
                  <option value="Hepatitis B (HB0)">Hepatitis B (HB0) - 0 Bulan</option>
                  <option value="BCG">BCG - 1 Bulan</option>
                  <option value="Polio 1 (Tetes)">Polio 1 (Tetes) - 1 Bulan</option>
                  <option value="DPT-HB-Hib 1">DPT-HB-Hib 1 - 2 Bulan</option>
                  <option value="Polio 2 (Tetes)">Polio 2 (Tetes) - 2 Bulan</option>
                  <option value="PCV 1">PCV 1 - 2 Bulan</option>
                  <option value="DPT-HB-Hib 2">DPT-HB-Hib 2 - 3 Bulan</option>
                  <option value="Polio 3 (Tetes)">Polio 3 (Tetes) - 3 Bulan</option>
                  <option value="Campak-Rubella (MR)">Campak-Rubella (MR) - 9 Bulan</option>
                  <option value="DPT-HB-Hib Lanjutan">DPT-HB-Hib Lanjutan - 18 Bulan</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Usia (Bulan):</label>
                  <input
                    type="number"
                    min={0}
                    value={imunTargetAge}
                    onChange={(e) => setImunTargetAge(Number(e.target.value))}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Jadwal:</label>
                  <input
                    type="date"
                    value={imunDate}
                    onChange={(e) => setImunDate(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImunModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                >
                  {actionLoading ? 'Menyimpan...' : 'Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Skrining Lansia */}
      {showLansiaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black text-slate-900 mb-1">Skrining Kesehatan Lansia</h3>
            <p className="text-xs text-slate-500 mb-4">Catat biomarker tensi darah, glukosa, dan asam urat.</p>
            <form onSubmit={handleStoreLansia} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lansia:</label>
                <input
                  type="text"
                  value={lansiaName}
                  onChange={(e) => setLansiaName(e.target.value)}
                  placeholder="Contoh: Mbah Suwito"
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gender:</label>
                  <select
                    value={lansiaGender}
                    onChange={(e) => setLansiaGender(e.target.value as any)}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Usia:</label>
                  <input
                    type="number"
                    min={45}
                    max={120}
                    value={lansiaAge}
                    onChange={(e) => setLansiaAge(Number(e.target.value))}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Wilayah RT:</label>
                  <input
                    type="text"
                    value={lansiaRt}
                    onChange={(e) => setLansiaRt(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sistolik (mmHg):</label>
                  <input
                    type="number"
                    min={60}
                    max={260}
                    value={lansiaSystolic}
                    onChange={(e) => setLansiaSystolic(Number(e.target.value))}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Diastolik (mmHg):</label>
                  <input
                    type="number"
                    min={40}
                    max={160}
                    value={lansiaDiastolic}
                    onChange={(e) => setLansiaDiastolic(Number(e.target.value))}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">GDS (mg/dL):</label>
                  <input
                    type="number"
                    value={lansiaBloodSugar}
                    onChange={(e) => setLansiaBloodSugar(e.target.value)}
                    placeholder="120"
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kolesterol:</label>
                  <input
                    type="number"
                    value={lansiaCholesterol}
                    onChange={(e) => setLansiaCholesterol(e.target.value)}
                    placeholder="180"
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Asam Urat:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={lansiaUricAcid}
                    onChange={(e) => setLansiaUricAcid(e.target.value)}
                    placeholder="5.5"
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLansiaModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold"
                >
                  {actionLoading ? 'Menyimpan...' : 'Simpan Skrining'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Aset Baru */}
      {showAddAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-black text-slate-900 mb-1">Tambah Aset Inventaris Fasum</h3>
            <p className="text-xs text-slate-500 mb-4">Catat inventaris baru barang milik RT/RW untuk dipinjamkan ke warga.</p>
            <form onSubmit={handleStoreNewAsset} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Aset / Fasilitas:</label>
                <input
                  type="text"
                  value={newAssetName}
                  onChange={(e) => setNewAssetName(e.target.value)}
                  placeholder="Contoh: Terop Panggung 6x8M / Kursi Lipat"
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori:</label>
                  <select
                    value={newAssetCategory}
                    onChange={(e) => setNewAssetCategory(e.target.value as any)}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300"
                  >
                    <option value="tenda">Tenda / Terop</option>
                    <option value="sound_system">Sound System</option>
                    <option value="kursi">Kursi / Meja</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Unit:</label>
                  <input
                    type="number"
                    min={1}
                    value={newAssetQty}
                    onChange={(e) => setNewAssetQty(Number(e.target.value))}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kondisi Barang:</label>
                <input
                  type="text"
                  value={newAssetCondition}
                  onChange={(e) => setNewAssetCondition(e.target.value)}
                  placeholder="Contoh: Baik Lengkap dengan Terpal"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAssetModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold"
                >
                  {actionLoading ? 'Menyimpan...' : 'Simpan Aset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pencairan Santunan Duka RUKAM */}
      {showDisburseModal && selectedRukamForDisburse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Pencairan Santunan Kas RT</h3>
                <p className="text-xs text-slate-500">Santunan duka cita untuk keluarga almarhum.</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1 mb-4">
              <div>Almarhum: <strong className="text-slate-900">Alm/Almh. {selectedRukamForDisburse.deceased_name}</strong></div>
              <div>Pelapor: <strong className="text-slate-800">{selectedRukamForDisburse.reporter?.name}</strong> ({selectedRukamForDisburse.relation})</div>
              <div className="text-slate-500">Alamat: {selectedRukamForDisburse.deceased_address}</div>
            </div>

            <form onSubmit={handleDisburseRukam} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nominal Santunan Kas (Rp):</label>
                <input
                  type="number"
                  min={100000}
                  step={50000}
                  required
                  value={disburseAmount}
                  onChange={(e) => setDisburseAmount(Number(e.target.value))}
                  className="w-full text-xs font-black text-rose-700 px-3 py-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <input
                  type="checkbox"
                  checked={disburseToWallet}
                  onChange={(e) => setDisburseToWallet(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600"
                />
                <span>Kreditkan langsung ke Dompet Digital Warga Pelapor</span>
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDisburseModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30"
                >
                  {actionLoading ? 'Memproses...' : 'Cairkan Santunan Kas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Armada Ambulans */}
      {showAddAmbulanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Registrasi Armada Ambulans</h3>
                <p className="text-xs text-slate-500">Tambahkan kendaraan operasional siaga warga.</p>
              </div>
            </div>

            <form onSubmit={handleStoreAmbulance} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Plat Polisi:</label>
                <input
                  type="text"
                  required
                  value={ambPlate}
                  onChange={(e) => setAmbPlate(e.target.value)}
                  placeholder="Contoh: B 1928 SWR"
                  className="w-full text-xs font-mono font-bold uppercase px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Armada / Tipe Mobil:</label>
                <input
                  type="text"
                  required
                  value={ambNameInput}
                  onChange={(e) => setAmbNameInput(e.target.value)}
                  placeholder="Contoh: Ambulans APV Siaga RW 05"
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Layanan Armada:</label>
                <select
                  value={ambTypeInput}
                  onChange={(e) => setAmbTypeInput(e.target.value as any)}
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300"
                >
                  <option value="multipurpose">Multiguna (Pasien Medis & Jenazah)</option>
                  <option value="emergency">Khusus Darurat Medis / Gawat Darurat</option>
                  <option value="jenazah">Khusus Mobil Jenazah Duka</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Driver Siaga:</label>
                  <input
                    type="text"
                    value={ambDriverInput}
                    onChange={(e) => setAmbDriverInput(e.target.value)}
                    placeholder="Contoh: Pak Joko"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No. Telp Driver:</label>
                  <input
                    type="text"
                    value={ambPhoneInput}
                    onChange={(e) => setAmbPhoneInput(e.target.value)}
                    placeholder="081234567890"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan / Kelengkapan Alat:</label>
                <textarea
                  value={ambNotesInput}
                  onChange={(e) => setAmbNotesInput(e.target.value)}
                  placeholder="Lengkap dengan tabung O2, brankar dorong, sirine siaga."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 h-16"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAmbulanceModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold"
                >
                  {actionLoading ? 'Menyimpan...' : 'Daftarkan Armada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Disposisi Armada Ambulans */}
      {showDispatchModal && selectedBookingForDispatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
                <Siren className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Disposisi Armada Siaga</h3>
                <p className="text-xs text-slate-500">Tugaskan kendaraan dan driver ke lokasi penjemputan.</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1 mb-4">
              <div>Kode Booking: <strong className="font-mono text-slate-900">{selectedBookingForDispatch.booking_code}</strong></div>
              <div>Pasien/Jenazah: <strong className="text-slate-800">{selectedBookingForDispatch.patient_name}</strong></div>
              <div>Jemput: <span className="text-slate-700">{selectedBookingForDispatch.pickup_address}</span></div>
              <div>Tujuan: <span className="text-slate-700 font-bold">{selectedBookingForDispatch.destination_address}</span></div>
            </div>

            <form onSubmit={handleDispatchAmbulance} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Armada Ambulans:</label>
                <select
                  required
                  value={dispatchAmbulanceId || ''}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setDispatchAmbulanceId(id);
                    const amb = ambulancesList.find(a => a.id === id);
                    if (amb?.driver_name) setDispatchDriverName(amb.driver_name);
                    if (amb?.driver_phone) setDispatchDriverPhone(amb.driver_phone);
                  }}
                  className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-300"
                >
                  {ambulancesList.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.vehicle_number}) - Status: {a.status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Driver Bertugas:</label>
                  <input
                    type="text"
                    required
                    value={dispatchDriverName}
                    onChange={(e) => setDispatchDriverName(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No. Telp Driver:</label>
                  <input
                    type="text"
                    required
                    value={dispatchDriverPhone}
                    onChange={(e) => setDispatchDriverPhone(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-black text-xs shadow-md shadow-amber-500/20"
                >
                  {actionLoading ? 'Mengirim...' : 'Kirim / Meluncurkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
