'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { fetchApi } from '@/lib/api';
import { 
  Building2, 
  LogIn, 
  UserPlus, 
  MapPin, 
  CreditCard, 
  Lock, 
  Mail, 
  Phone, 
  User, 
  CheckCircle2, 
  Clock,
  ShieldCheck,
  Users,
  ArrowRight
} from 'lucide-react';

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

  // Houses lookup data
  const [houses, setHouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch houses when RT / Block changes
  useEffect(() => {
    if (isRegister) {
      const fetchHouses = async () => {
        try {
          const res = await fetchApi(`/houses?rt_number=${regRt}&block=${regBlock}`);
          if (res.success && res.data) {
            setHouses(res.data);
            // Default select first available house or first house
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
  }, [isRegister, regRt, regBlock]);

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
        login(res.data.token, res.data.user);
      }
    } catch (err: any) {
      setErrorMsg(err.message === 'Failed to fetch' ? 'Gagal terhubung ke server. Silakan coba sesaat lagi.' : (err.message || 'Login gagal.'));
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
        // Akun berstatus PENDING harus menunggu ACC Ketua RT, tidak langsung login
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
          login(res.data.token, res.data.user);
        }
      } catch (err: any) {
        setErrorMsg(err.message === 'Failed to fetch' ? 'Gagal terhubung ke server. Silakan coba sesaat lagi.' : (err.message || 'Login gagal.'));
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto py-4">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-3xl mx-auto flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 mb-3">
          <Building2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          SMART<span className="text-emerald-600">-WARGA</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Sistem Terpadu Manajemen Lingkungan Warga RW 05 (RT 01, 02, 03)
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200">
        {/* Tab switch */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setErrorMsg(''); setSuccessMsg(''); }}
            className={`py-2 text-xs font-bold rounded-xl transition ${
              !isRegister ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500'
            }`}
          >
            Masuk Akun
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setErrorMsg(''); setSuccessMsg(''); }}
            className={`py-2 text-xs font-bold rounded-xl transition ${
              isRegister ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500'
            }`}
          >
            Daftar Warga Baru
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200 mb-4">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 mb-4 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. LOGIN FORM */}
        {!isRegister ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Terdaftar:</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full text-xs font-semibold pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="nama@smartwarga.test"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password:</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full text-xs font-semibold pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-500/20 active:scale-95 transition disabled:opacity-50"
            >
              {loading ? 'MEMERIKSA...' : 'MASUK KE SISTEM'}
            </button>

            {/* Quick Demo Credentials & Dropdown Warga */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              {/* Dropdown Fast Login 37 Warga */}
              <div className="p-3.5 bg-emerald-50/90 rounded-2xl border border-emerald-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-emerald-950 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Pilih Akun Warga (37 KK Terdaftar):</span>
                  </label>
                  <span className="text-[9px] text-emerald-800 font-extrabold bg-emerald-200/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
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
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-emerald-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
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
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <span>Masuk Sebagai Warga Terpilih</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Role-Based Quick Buttons (Khusus Pengurus & Struktur Lingkungan) */}
              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500 block mb-2">
                  Pilih Cepat Pengurus Lingkungan (Role-Based):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fillQuickAccount('admin@smartwarga.test', true)}
                    className="px-2.5 py-2 bg-slate-900 text-white text-[11px] font-bold rounded-xl hover:bg-slate-800 flex items-center gap-2 text-left transition active:scale-95 shadow-sm"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0"></span>
                    <div className="truncate">
                      <div>Super Admin</div>
                      <div className="text-[9px] font-normal text-slate-400">Akses Penuh Sistem</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillQuickAccount('rw@smartwarga.test', true)}
                    className="px-2.5 py-2 bg-slate-100 text-slate-800 text-[11px] font-bold rounded-xl border border-slate-300 hover:bg-slate-200 flex items-center gap-2 text-left transition active:scale-95"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-800 shrink-0"></span>
                    <div className="truncate">
                      <div>Ketua RW 05</div>
                      <div className="text-[9px] font-normal text-slate-500">Supervisi Lingkungan</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillQuickAccount('sekretaris_rw@smartwarga.test', true)}
                    className="px-2.5 py-2 bg-purple-50 text-purple-900 text-[11px] font-bold rounded-xl border border-purple-200 hover:bg-purple-100 flex items-center gap-2 text-left transition active:scale-95"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0"></span>
                    <div className="truncate">
                      <div>Ibu Maya (Sekretaris)</div>
                      <div className="text-[9px] font-normal text-purple-700">Sekretaris RW 05</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillQuickAccount('bendahara_rw@smartwarga.test', true)}
                    className="px-2.5 py-2 bg-indigo-50 text-indigo-900 text-[11px] font-bold rounded-xl border border-indigo-200 hover:bg-indigo-100 flex items-center gap-2 text-left transition active:scale-95"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0"></span>
                    <div className="truncate">
                      <div>Pak Hendra (Bendahara)</div>
                      <div className="text-[9px] font-normal text-indigo-700">Bendahara RW 05</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillQuickAccount('rt01@smartwarga.test', true)}
                    className="px-2.5 py-2 bg-slate-100 text-slate-800 text-[11px] font-bold rounded-xl border border-slate-300 hover:bg-slate-200 flex items-center gap-2 text-left transition active:scale-95"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-600 shrink-0"></span>
                    <div className="truncate">
                      <div>Ketua RT 01</div>
                      <div className="text-[9px] font-normal text-slate-500">Pengawasan Wilayah RT</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillQuickAccount('sekretaris_rt01@smartwarga.test', true)}
                    className="px-2.5 py-2 bg-blue-50 text-blue-900 text-[11px] font-bold rounded-xl border border-blue-200 hover:bg-blue-100 flex items-center gap-2 text-left transition active:scale-95"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0"></span>
                    <div className="truncate">
                      <div>Pak Danu (Sekretaris)</div>
                      <div className="text-[9px] font-normal text-blue-700">Sekretaris RT 01</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillQuickAccount('bendahara_rt01@smartwarga.test', true)}
                    className="col-span-2 px-2.5 py-2 bg-emerald-50 text-emerald-900 text-[11px] font-bold rounded-xl border border-emerald-300 hover:bg-emerald-100 flex items-center gap-2 text-left transition active:scale-95"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0"></span>
                    <div className="truncate">
                      <div>Ibu Ratna (Bendahara)</div>
                      <div className="text-[9px] font-normal text-emerald-700">Bendahara RT 01 (ACC Iuran & Keuangan)</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-600 leading-relaxed">
                🔒 <strong>Ketentuan Akses Warga:</strong> Akses login ke sistem dikhususkan bagi <strong>KK Utama</strong> (Penanggung Jawab Rumah). <strong>KK Tambahan tidak memiliki akses login</strong> karena yang bertanggung jawab untuk iuran dan seluruh administrasi unit rumah adalah KK Utama.
              </div>
            </div>
          </form>
        ) : (
          /* 2. REGISTER FORM */
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Sesuai KTP:</label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300"
                placeholder="Contoh: Ahmad Fadilah"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">NIK (16 Digit):</label>
                <input
                  type="text"
                  maxLength={16}
                  value={regNik}
                  onChange={(e) => setRegNik(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-300"
                  placeholder="320101xxxxxxxxxx"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">No. Kartu Keluarga (KK):</label>
                <input
                  type="text"
                  maxLength={16}
                  value={regNoKk}
                  onChange={(e) => setRegNoKk(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-300"
                  placeholder="320101xxxxxxxxxx"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email:</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300"
                  placeholder="email@warga.com"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nomor WhatsApp:</label>
                <input
                  type="text"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300"
                  placeholder="08123456789"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Buat Password:</label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300"
                placeholder="Minimal 6 karakter"
                required
              />
            </div>

            {/* Wilayah & Rumah Selector */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
              <span className="text-[10px] font-extrabold uppercase text-slate-500 block">
                Pilih Alamat Hunian (Kapasitas 300 Rumah):
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Pilih RT:</label>
                  <select
                    value={regRt}
                    onChange={(e) => setRegRt(e.target.value)}
                    className="w-full text-xs font-bold px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="01">RT 01</option>
                    <option value="02">RT 02</option>
                    <option value="03">RT 03</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Pilih Blok:</label>
                  <select
                    value={regBlock}
                    onChange={(e) => setRegBlock(e.target.value)}
                    className="w-full text-xs font-bold px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="A">Blok A (No 1-25)</option>
                    <option value="B">Blok B (No 1-25)</option>
                    <option value="C">Blok C (No 1-25)</option>
                    <option value="D">Blok D (No 1-25)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Nomor / Unit Rumah:</label>
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
                  className="w-full text-xs font-bold px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
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

              {/* Status KK di Rumah */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Status Kartu Keluarga (KK) di Rumah Ini:
                </label>
                <select
                  value={regKkType}
                  onChange={(e: any) => setRegKkType(e.target.value)}
                  className="w-full text-xs font-bold px-2 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-900"
                >
                  <option value="kk_utama">
                    KK Utama (Kepala Rumah Tangga / Penanggung Jawab Tagihan IPL)
                  </option>
                  <option value="kk_pendukung">
                    KK Pendukung / Tambahan (Keluarga Anak Menikah / Kerabat Serumah)
                  </option>
                  <option value="anggota">
                    Anggota Keluarga dalam KK
                  </option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                  * <strong>KK Utama:</strong> Penanggung jawab rumah & penerima tagihan iuran IPL per unit rumah.
                  <br />
                  * <strong>KK Pendukung:</strong> Keluarga tambahan yang berdomisili di rumah yang sama (tercatat di RT).
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                UID Kartu RFID Fisik (Opsional):
              </label>
              <input
                type="text"
                value={regRfid}
                onChange={(e) => setRegRfid(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-300"
                placeholder="Contoh: A1B2C3D4"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Digunakan untuk absensi ronda & transaksi timbangan bank sampah otomatis.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-500/20 active:scale-95 transition disabled:opacity-50"
            >
              {loading ? 'MENDAFTAR...' : 'DAFTAR MENUNGGU ACC RT'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
