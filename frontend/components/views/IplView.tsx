'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { fetchApi } from '@/lib/api';
import { 
  CreditCard, 
  Wallet, 
  QrCode, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Building,
  Building2,
  Calendar,
  Check,
  X,
  Upload,
  RefreshCw,
  Eye,
  ShieldCheck,
  ArrowRight,
  Info,
  Lock
} from 'lucide-react';

export default function IplView({ 
  onOpenTopup,
  onSwitchToPengurus
}: { 
  onOpenTopup: () => void;
  onSwitchToPengurus?: (subTab: 'sensus' | 'ipl' | 'kegiatan' | 'surat' | 'approval' | 'topup') => void;
}) {
  const { user, refreshUser } = useAuth();
  const isPengurus = ['bendahara', 'sekretaris', 'rt', 'rw', 'super_admin'].includes(user?.role || '');

  // Year filter
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const availableYears = [2024, 2025, 2026, 2027];

  // Calendar data from API
  const [calendarData, setCalendarData] = useState<any | null>(null);
  const [loadingCalendar, setLoadingCalendar] = useState<boolean>(true);

  // Pending billings for Bendahara verification
  const [pendingBillings, setPendingBillings] = useState<any[]>([]);
  const [loadingPending, setLoadingPending] = useState<boolean>(false);

  // Rekapitulasi Kas RT to RW
  const [rekap, setRekap] = useState<any[]>([]);

  // QRIS Payment Modal State
  const [selectedMonthToPay, setSelectedMonthToPay] = useState<any | null>(null);
  const [qrisReference, setQrisReference] = useState<string>('');
  const [qrisNotes, setQrisNotes] = useState<string>('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [payingQris, setPayingQris] = useState<boolean>(false);

  // Wallet Quick Pay Modal / Alternative
  const [showWalletOption, setShowWalletOption] = useState<boolean>(false);

  // Proof Image Preview Modal
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null);

  // Action status message
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isBendaharaOrPengurus = ['bendahara', 'rt', 'rw', 'super_admin'].includes(user?.role || '');

  // 1. Load Calendar for selected year
  const loadCalendar = async (year: number) => {
    setLoadingCalendar(true);
    try {
      const res = await fetchApi(`/ipl/annual-calendar?year=${year}`);
      if (res.success) {
        setCalendarData(res);
      }
    } catch {
      // ignore
    } finally {
      setLoadingCalendar(false);
    }
  };

  // 2. Load Pending Verification Billings (for Bendahara/Pengurus)
  const loadPendingBillings = async () => {
    if (!isBendaharaOrPengurus) return;
    setLoadingPending(true);
    try {
      const res = await fetchApi('/ipl/billings?status=waiting_verification');
      if (res.success && res.data) {
        setPendingBillings(res.data.data || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingPending(false);
    }
  };

  // 3. Load Rekapitulasi Kas RT ke RW
  const loadRekap = async () => {
    try {
      const res = await fetchApi('/ipl/rekap-rw');
      if (res.success && res.data) {
        setRekap(res.data || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadCalendar(selectedYear);
  }, [selectedYear]);

  useEffect(() => {
    loadRekap();
    if (isBendaharaOrPengurus) {
      loadPendingBillings();
    }
  }, [isBendaharaOrPengurus]);

  // Open QRIS payment modal for a month
  const handleOpenQrisModal = (monthItem: any) => {
    setSelectedMonthToPay(monthItem);
    // Generate a default unique reference for demo convenience
    const refCode = `QRIS-${selectedYear}${String(monthItem.month).padStart(2, '0')}-${user?.house?.house_code || 'UNIT'}-${Math.floor(1000 + Math.random() * 9000)}`;
    setQrisReference(refCode);
    setQrisNotes(`Pembayaran IPL Bulan ${monthItem.month_name} ${selectedYear} via QRIS Mandiri`);
    setUploadFile(null);
    setShowWalletOption(false);
    setAlertMsg(null);
  };

  // Submit QRIS Payment
  const handleSubmitQrisPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMonthToPay) return;

    setPayingQris(true);
    setAlertMsg(null);
    try {
      const formData = new FormData();
      formData.append('year', String(selectedYear));
      formData.append('month', String(selectedMonthToPay.month));
      if (qrisReference) formData.append('reference_note', qrisReference);
      if (uploadFile) formData.append('proof_image', uploadFile);

      const res = await fetchApi('/ipl/pay-qris', {
        method: 'POST',
        body: formData,
      });

      if (res.success) {
        setAlertMsg({ type: 'success', text: res.message });
        setSelectedMonthToPay(null);
        await loadCalendar(selectedYear);
        if (isBendaharaOrPengurus) {
          await loadPendingBillings();
        }
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Pembayaran gagal diajukan.' });
    } finally {
      setPayingQris(false);
    }
  };

  // Submit Wallet Payment (instant alternative)
  const handlePayViaWallet = async (billingId: number) => {
    setPayingQris(true);
    setAlertMsg(null);
    try {
      const res = await fetchApi(`/ipl/billings/${billingId}/pay-wallet`, {
        method: 'POST',
      });
      if (res.success) {
        setAlertMsg({ type: 'success', text: res.message });
        setSelectedMonthToPay(null);
        await refreshUser();
        await loadCalendar(selectedYear);
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Gagal potong saldo dompet.' });
    } finally {
      setPayingQris(false);
    }
  };

  // Verify Pending Billing (Bendahara RT / RW action)
  const handleVerifyBilling = async (billingId: number, action: 'approve' | 'reject') => {
    setActionLoadingId(billingId);
    setAlertMsg(null);
    try {
      const res = await fetchApi(`/admin/ipl/billings/${billingId}/verify`, {
        method: 'POST',
        body: JSON.stringify({
          action,
          notes: action === 'approve' ? 'Diverifikasi sah via QRIS' : 'Bukti pembayaran tidak sesuai',
        }),
      });

      if (res.success) {
        setAlertMsg({ type: 'success', text: res.message });
        await loadPendingBillings();
        await loadCalendar(selectedYear);
        await loadRekap();
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Gagal memverifikasi tagihan.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Extract 12 months array safely from either res.data or direct array
  const rawMonths: any[] = Array.isArray(calendarData?.data)
    ? calendarData.data
    : Array.isArray(calendarData)
    ? calendarData
    : [];

  const default12Months = [
    { month: 1, month_name: 'Januari', amount: 50000, base_ipl_amount: 30000, rw_contribution_amount: 20000, status: 'not_generated', is_generated: false },
    { month: 2, month_name: 'Februari', amount: 50000, base_ipl_amount: 30000, rw_contribution_amount: 20000, status: 'not_generated', is_generated: false },
    { month: 3, month_name: 'Maret', amount: 50000, base_ipl_amount: 30000, rw_contribution_amount: 20000, status: 'not_generated', is_generated: false },
    { month: 4, month_name: 'April', amount: 50000, base_ipl_amount: 30000, rw_contribution_amount: 20000, status: 'not_generated', is_generated: false },
    { month: 5, month_name: 'Mei', amount: 50000, base_ipl_amount: 30000, rw_contribution_amount: 20000, status: 'not_generated', is_generated: false },
    { month: 6, month_name: 'Juni', amount: 50000, base_ipl_amount: 30000, rw_contribution_amount: 20000, status: 'not_generated', is_generated: false },
    { month: 7, month_name: 'Juli', amount: 50000, base_ipl_amount: 30000, rw_contribution_amount: 20000, status: 'not_generated', is_generated: false },
    { month: 8, month_name: 'Agustus', amount: 50000, base_ipl_amount: 30000, rw_contribution_amount: 20000, status: 'not_generated', is_generated: false },
    { month: 9, month_name: 'September', amount: 50000, base_ipl_amount: 30000, rw_contribution_amount: 20000, status: 'not_generated', is_generated: false },
    { month: 10, month_name: 'Oktober', amount: 50000, base_ipl_amount: 30000, rw_contribution_amount: 20000, status: 'not_generated', is_generated: false },
    { month: 11, month_name: 'November', amount: 50000, base_ipl_amount: 30000, rw_contribution_amount: 20000, status: 'not_generated', is_generated: false },
    { month: 12, month_name: 'Desember', amount: 50000, base_ipl_amount: 30000, rw_contribution_amount: 20000, status: 'not_generated', is_generated: false },
  ];

  const displayMonths = rawMonths.length > 0 ? rawMonths : default12Months;

  const stats = calendarData?.statistics || {
    paid_months: displayMonths.filter((m: any) => m.status === 'paid').length,
    pending_months: displayMonths.filter((m: any) => m.status === 'waiting_verification').length,
    unpaid_months: displayMonths.filter((m: any) => m.status === 'unpaid').length,
    not_generated_months: displayMonths.filter((m: any) => m.status === 'not_generated').length,
    total_paid: displayMonths.filter((m: any) => m.status === 'paid').reduce((acc: number, m: any) => acc + (Number(m.amount) || 50000), 0),
    total_unpaid: displayMonths.filter((m: any) => m.status === 'unpaid').reduce((acc: number, m: any) => acc + (Number(m.amount) || 50000), 0),
  };

  const houseInfo = calendarData?.house || user?.house;

  // Structural Pengurus (Bendahara, Sekretaris, RT, RW) do not pay IPL
  if (isPengurus) {
    const roleTitle = user?.role === 'bendahara' 
      ? 'Bendahara RT/RW (Pejabat Keuangan)' 
      : user?.role === 'sekretaris' 
      ? 'Sekretaris RT/RW (Pejabat Administrasi)' 
      : user?.role === 'rw' 
      ? 'Ketua RW 05' 
      : user?.role === 'rt' 
      ? `Ketua RT ${user.rt_number}` 
      : 'Super Admin';

    return (
      <div className="max-w-3xl mx-auto my-8 p-8 bg-white border border-amber-200/80 rounded-3xl shadow-xl text-center space-y-5">
        <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <ShieldCheck className="w-9 h-9" />
        </div>
        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 bg-amber-100 text-amber-900 rounded-full border border-amber-300">
            Peran Struktural: Fasilitator Lingkungan
          </span>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            Pengurus Tidak Membayar IPL Hunian
          </h3>
          <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Anda sedang masuk sebagai <strong>{user?.name}</strong> dengan jabatan <strong className="text-amber-800 uppercase">{roleTitle}</strong>.
            <br />
            Dalam sistem SMART-WARGA, warga (KK Utama) memiliki kewajiban membayar IPL dan menikmati fasilitas, sedangkan <strong>pengurus bertindak sebagai fasilitator</strong> untuk mengelola kas, memverifikasi setoran, dan mencairkan anggaran kegiatan.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => onSwitchToPengurus?.(user?.role === 'bendahara' ? 'ipl' : 'sensus')}
            className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs font-black shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition active:scale-95"
          >
            <CreditCard className="w-4 h-4" />
            <span>
              {user?.role === 'bendahara'
                ? 'Buka Tata Kelola Kas & Verifikasi Iuran Warga'
                : 'Buka Panel Tata Kelola Pengurus'}
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* 1. Header Information & Unit Responsibility Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-700/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
              <CreditCard className="w-4 h-4" />
              <span>Iuran Pengelolaan Lingkungan (IPL) & Kas Mandiri</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">
              Kalender Iuran Unit Rumah Tahun {selectedYear}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-300">
              <span className="font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {houseInfo?.house_code || `RT${user?.rt_number || '01'}-UNIT`}
              </span>
              <span>•</span>
              <span className="font-medium">{houseInfo?.full_address || 'Hunian RW 05'}</span>
              <span>•</span>
              <span className="text-slate-400">
                Penanggung Jawab (KK Utama): <strong className="text-white">{houseInfo?.head_of_family?.name || user?.name}</strong>
              </span>
            </div>
          </div>

          {/* Year Filter Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-800/80 rounded-2xl border border-slate-700 self-start md:self-auto">
            {availableYears.map((yr) => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                  selectedYear === yr
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>
        </div>

        {/* Financial Transparency Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-700/60">
          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Status Lunas</span>
            <div className="text-xl font-black text-emerald-400 mt-0.5">
              {stats.paid_months} <span className="text-xs font-semibold text-slate-400">/ 12 Bln</span>
            </div>
            <span className="text-[10px] text-emerald-400/80 font-medium">Rp {Number(stats.total_paid).toLocaleString('id-ID')}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Verifikasi Pending</span>
            <div className="text-xl font-black text-amber-400 mt-0.5">
              {stats.pending_months} <span className="text-xs font-semibold text-slate-400">Bulan</span>
            </div>
            <span className="text-[10px] text-amber-400/80 font-medium">Menunggu ACC Bendahara</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Tagihan Terbit (Wajib Bayar)</span>
            <div className="text-xl font-black text-rose-400 mt-0.5">
              {stats.unpaid_months} <span className="text-xs font-semibold text-slate-400">Bulan</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-rose-400/80 font-medium">Rp {Number(stats.total_unpaid).toLocaleString('id-ID')} ({selectedYear})</span>
              {Number(stats.all_time_unpaid_months || 0) > Number(stats.unpaid_months || 0) && (
                <span className="text-[9px] text-amber-300 font-semibold mt-0.5">
                  Total Lintas Tahun: Rp {Number(stats.all_time_unpaid_amount).toLocaleString('id-ID')} ({stats.all_time_unpaid_months} Bln)
                </span>
              )}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Belum Diterbitkan Pengurus</span>
            <div className="text-xl font-black text-slate-400 mt-0.5">
              {stats.not_generated_months || 0} <span className="text-xs font-semibold text-slate-500">Bulan</span>
            </div>
            <span className="text-[10px] text-slate-400/80 font-medium">Belum ditagihkan ke warga</span>
          </div>
        </div>
      </div>

      {alertMsg && (
        <div className={`p-4 rounded-2xl text-xs font-bold border flex items-center justify-between gap-3 animate-fade-in ${
          alertMsg.type === 'success'
            ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
            : 'bg-red-50 text-red-900 border-red-300'
        }`}>
          <div className="flex items-center gap-2">
            {alertMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{alertMsg.text}</span>
          </div>
          <button
            onClick={() => setAlertMsg(null)}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. KHUSUS PENGURUS / BENDAHARA: ANTREAN VERIFIKASI PEMBAYARAN QRIS */}
      {isBendaharaOrPengurus && pendingBillings.length > 0 && (
        <div className="bg-amber-50/80 border-2 border-amber-300/80 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-amber-950 flex items-center gap-2">
                  <span>Antrean Verifikasi Iuran QRIS Warga (Khusus Bendahara)</span>
                  <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    {pendingBillings.length} Menunggu ACC
                  </span>
                </h3>
                <p className="text-xs text-amber-800">
                  Warga telah melakukan pembayaran QRIS. Periksa bukti transfer dan klik <strong>ACC / Sahkan</strong> untuk mengubah status menjadi Lunas.
                </p>
              </div>
            </div>
            <button
              onClick={loadPendingBillings}
              disabled={loadingPending}
              className="p-2 rounded-xl bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingPending ? 'animate-spin' : ''}`} />
              <span>Segarkan</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs bg-white rounded-2xl overflow-hidden border border-amber-200">
              <thead className="bg-amber-100/60 text-amber-900 font-bold border-b border-amber-200">
                <tr>
                  <th className="py-2.5 px-3">Unit Rumah</th>
                  <th className="py-2.5 px-3">Penanggung Jawab</th>
                  <th className="py-2.5 px-3">Periode</th>
                  <th className="py-2.5 px-3">Nominal</th>
                  <th className="py-2.5 px-3">Metode</th>
                  <th className="py-2.5 px-3">Bukti Bayar</th>
                  <th className="py-2.5 px-3 text-right">Aksi Bendahara</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {pendingBillings.map((bill) => (
                  <tr key={bill.id} className="hover:bg-amber-50/50 transition">
                    <td className="py-3 px-3">
                      <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-900 text-white">
                        {bill.house?.house_code || `RT${bill.house?.rt_number}-${bill.house?.block}${bill.house?.number}`}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800">{bill.house?.head_of_family?.name || bill.user?.name}</div>
                      <div className="text-[10px] text-slate-500">{bill.user?.email}</div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700">
                      Bulan {bill.master?.period_month} / {bill.master?.period_year}
                    </td>
                    <td className="py-3 px-3 font-black text-slate-900">
                      Rp {Number(bill.amount).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {bill.payment_method?.toUpperCase() || 'QRIS'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {bill.payment_proof_path ? (
                        <button
                          onClick={() => setPreviewProofUrl(bill.payment_proof_path)}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat Bukti</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Tanpa Foto Lampiran</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleVerifyBilling(bill.id, 'approve')}
                          disabled={actionLoadingId === bill.id}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1 active:scale-95 disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{actionLoadingId === bill.id ? 'Memproses...' : 'ACC / Sahkan'}</span>
                        </button>
                        <button
                          onClick={() => handleVerifyBilling(bill.id, 'reject')}
                          disabled={actionLoadingId === bill.id}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200"
                        >
                          Tolak
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. KALENDER 12 BULAN PEMBAYARAN IPL (JANUARI - DESEMBER) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-base text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <span>Kalender 12 Bulan Pembayaran IPL (Januari - Desember {selectedYear})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Klik kotak bulan dengan status <strong className="text-rose-600">Belum Bayar</strong> untuk melunasi iuran via <strong>QRIS Mandiri</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-slate-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Lunas (Sah)
            </span>
            <span className="flex items-center gap-1 text-slate-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Pending Bendahara
            </span>
            <span className="flex items-center gap-1 text-slate-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Tagihan Terbit (Belum Bayar)
            </span>
            <span className="flex items-center gap-1 text-slate-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span> Belum Diterbitkan Pengurus
            </span>
          </div>
        </div>

        {loadingCalendar ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
            <span>Memuat kalender 12 bulan tahun {selectedYear}...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayMonths.map((mItem: any) => {
              const isPaid = mItem.status === 'paid';
              const isPending = mItem.status === 'waiting_verification';
              const isUnpaid = mItem.status === 'unpaid';
              const isNotGenerated = mItem.status === 'not_generated' || (!isPaid && !isPending && !isUnpaid);

              return (
                <div
                  key={mItem.month}
                  className={`rounded-2xl p-4 border transition flex flex-col justify-between relative overflow-hidden shadow-sm ${
                    isPaid
                      ? 'bg-gradient-to-br from-emerald-50/70 to-white border-emerald-300 hover:border-emerald-400'
                      : isPending
                      ? 'bg-gradient-to-br from-amber-50/70 to-white border-amber-300 hover:border-amber-400'
                      : isUnpaid
                      ? 'bg-gradient-to-br from-rose-50/60 to-white border-2 border-rose-300 hover:border-rose-400 hover:shadow-md'
                      : 'bg-slate-50/70 border-2 border-dashed border-slate-300 text-slate-400'
                  }`}
                >
                  {/* Top Bar: Month & Status Badge */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-black uppercase tracking-wider ${isNotGenerated ? 'text-slate-500' : 'text-slate-700'}`}>
                        {mItem.month_name}
                      </span>
                      {isPaid && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>LUNAS</span>
                        </span>
                      )}
                      {isPending && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>VERIFIKASI</span>
                        </span>
                      )}
                      {isUnpaid && (
                        <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          <span>BELUM BAYAR</span>
                        </span>
                      )}
                      {isNotGenerated && (
                        <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>BELUM TERBIT</span>
                        </span>
                      )}
                    </div>

                    <div className={`text-lg font-black tracking-tight ${isNotGenerated ? 'text-slate-400' : 'text-slate-900'}`}>
                      Rp {Number(mItem.amount).toLocaleString('id-ID')}
                    </div>

                    <div className="text-[10px] text-slate-400 mt-1 space-y-0.5">
                      {isNotGenerated ? (
                        <div className="italic text-slate-400">
                          Menunggu pengurus RT menerbitkan tagihan periode ini.
                        </div>
                      ) : (
                        <>
                          <div>Kas RT: Rp {Number(mItem.base_ipl_amount).toLocaleString('id-ID')}</div>
                          <div>Kas RW: Rp {Number(mItem.rw_contribution_amount).toLocaleString('id-ID')}</div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action / Verification Details */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    {isPaid ? (
                      <div className="text-[10px] text-emerald-700 font-semibold space-y-0.5">
                        <div className="flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 shrink-0" />
                          <span>Sah ({mItem.payment_method?.toUpperCase() || 'QRIS'})</span>
                        </div>
                        {mItem.verified_by_name && (
                          <div className="text-[9px] text-slate-500 truncate">
                            ACC: {mItem.verified_by_name}
                          </div>
                        )}
                      </div>
                    ) : isPending ? (
                      <div className="space-y-1">
                        <div className="text-[10px] text-amber-800 font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>Menunggu ACC Bendahara RT</span>
                        </div>
                        <div className="text-[9px] text-slate-500">
                          Metode: {mItem.payment_method?.toUpperCase() || 'QRIS'}
                        </div>
                      </div>
                    ) : isUnpaid ? (
                      <button
                        onClick={() => handleOpenQrisModal(mItem)}
                        className="w-full py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 text-white rounded-xl text-xs font-black shadow-md shadow-rose-500/20 active:scale-95 transition flex items-center justify-center gap-1.5"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Bayar via QRIS</span>
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full py-2 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold cursor-not-allowed border border-slate-200 flex items-center justify-center gap-1.5 opacity-70"
                        title="Tagihan untuk bulan ini belum diterbitkan oleh pengurus RT"
                      >
                        <Lock className="w-3 h-3" />
                        <span>Belum Diterbitkan</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. MODAL PEMBAYARAN STANDAR QRIS DIGITAL */}
      {selectedMonthToPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Pembayaran QRIS IPL
                  </h3>
                  <p className="text-xs text-slate-500">
                    Bulan {selectedMonthToPay.month_name} {selectedYear}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMonthToPay(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Official QRIS Card Visual */}
            <div className="mt-4 bg-gradient-to-b from-rose-50 via-white to-slate-50 rounded-2xl p-4 border-2 border-red-500/30 text-center relative overflow-hidden shadow-inner">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-1">
                  <span className="font-mono font-black text-rose-600 text-base tracking-tighter">QRIS</span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase">Standar Pembayaran Nasional</span>
                </div>
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  GPN Terakreditasi
                </span>
              </div>

              {/* Merchant Details */}
              <div className="mt-2 text-left">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Nama Merchant Lingkungan:</div>
                <div className="text-xs font-black text-slate-800">KAS RT & RW 05 MANDIRI</div>
                <div className="text-[10px] font-mono text-slate-500">NMID: ID1020260501001</div>
              </div>

              {/* QR Image Graphic Demonstration */}
              <div className="my-3 p-3 bg-white rounded-2xl border border-slate-200 inline-block shadow-sm">
                {/* SVG QR Code Simulation */}
                <div className="w-44 h-44 mx-auto relative flex items-center justify-center bg-slate-900 rounded-xl p-2.5">
                  <div className="w-full h-full bg-white p-1.5 rounded-lg flex flex-col justify-between">
                    <div className="flex justify-between">
                      <div className="w-9 h-9 border-4 border-black rounded-sm flex items-center justify-center">
                        <div className="w-3.5 h-3.5 bg-black rounded-xs"></div>
                      </div>
                      <div className="w-9 h-9 border-4 border-black rounded-sm flex items-center justify-center">
                        <div className="w-3.5 h-3.5 bg-black rounded-xs"></div>
                      </div>
                    </div>
                    <div className="flex justify-center items-center py-2">
                      <div className="px-2 py-0.5 bg-emerald-600 text-white font-mono text-[9px] font-bold rounded">
                        QRIS WARGA
                      </div>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="w-9 h-9 border-4 border-black rounded-sm flex items-center justify-center">
                        <div className="w-3.5 h-3.5 bg-black rounded-xs"></div>
                      </div>
                      <div className="grid grid-cols-3 gap-0.5 w-8 h-8">
                        <div className="bg-black"></div><div></div><div className="bg-black"></div>
                        <div></div><div className="bg-black"></div><div></div>
                        <div className="bg-black"></div><div className="bg-black"></div><div className="bg-black"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nominal Tagihan */}
              <div className="p-2.5 bg-slate-100/80 rounded-xl text-center">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Nominal yang Harus Ditransfer</span>
                <span className="text-xl font-black text-slate-900">
                  Rp {Number(selectedMonthToPay.amount).toLocaleString('id-ID')}
                </span>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  (Rp 30.000 Kas RT + Rp 20.000 Kas RW)
                </div>
              </div>
            </div>

            {/* Instruction Notice */}
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>Alur Verifikasi:</strong> Setelah Anda menekan <em>"Kirim Pembayaran QRIS"</em>, status bulan ini akan otomatis menjadi <strong>Menunggu Verifikasi Bendahara</strong>. Pembayaran akan sah (Lunas) begitu Bendahara RT meng-ACC.
              </div>
            </div>

            {/* Payment Submission Form */}
            <form onSubmit={handleSubmitQrisPayment} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Referensi Transaksi QRIS:
                </label>
                <input
                  type="text"
                  value={qrisReference}
                  onChange={(e) => setQrisReference(e.target.value)}
                  placeholder="Kode ref dari m-Banking / e-Wallet"
                  required
                  className="w-full text-xs font-mono font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Upload Bukti / Screenshot QRIS (Opsional / Disarankan):
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-600 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-700 cursor-pointer"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMonthToPay(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={payingQris}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{payingQris ? 'Mengirim...' : 'Kirim Pembayaran QRIS'}</span>
                </button>
              </div>

              {/* Or Pay with Warga Wallet option if billing already exists and user has balance */}
              {selectedMonthToPay.billing_id && Number(user?.wallet?.balance || 0) >= Number(selectedMonthToPay.amount) && (
                <div className="pt-2 border-t border-slate-100 text-center">
                  <button
                    type="button"
                    onClick={() => handlePayViaWallet(selectedMonthToPay.billing_id)}
                    disabled={payingQris}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline flex items-center justify-center gap-1 mx-auto"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Atau Bayar Langsung Potong Dompet Warga (Rp {Number(user?.wallet?.balance || 0).toLocaleString('id-ID')})</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL PREVIEW BUKTI TRANSFER */}
      {previewProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-black text-sm text-slate-900">Foto Resi / Bukti Transfer QRIS</h4>
              <button
                onClick={() => setPreviewProofUrl(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 max-h-[70vh] flex items-center justify-center">
              <img
                src={previewProofUrl}
                alt="Bukti Transfer"
                className="max-h-[68vh] object-contain w-auto rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* 6. REKAPITULASI TRANSPARANSI KAS RT KE RW */}
      {rekap.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-600" />
                <span>Transparansi Dana Masuk: Rekapitulasi Kas RT & Setoran Kas RW</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Aliran dana dapat dipantau bersama oleh warga, pengurus RT, dan pengurus RW untuk akuntabilitas penuh.
              </p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200 self-start">
              Transparansi Terbuka
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Wilayah</th>
                  <th className="py-2.5 px-3">Periode</th>
                  <th className="py-2.5 px-3">Warga Lunas</th>
                  <th className="py-2.5 px-3">Porsi Kas RT (Rp 30.000)</th>
                  <th className="py-2.5 px-3">Porsi Kas RW (Rp 20.000)</th>
                  <th className="py-2.5 px-3 font-bold text-slate-700">Total Iuran Terkumpul</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rekap.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-3 font-bold text-slate-800 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>RT {item.rt_number}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{item.period}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900">{item.paid_warga_count}</span>
                      <span className="text-slate-400 text-[10px]"> / 100 Rumah</span>
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-700">
                      Rp {Number(item.kas_rt_terkumpul).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 font-bold text-indigo-700">
                      Rp {Number(item.setoran_rw_wajib).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 font-black text-slate-900">
                      Rp {Number(item.total_iuran).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
