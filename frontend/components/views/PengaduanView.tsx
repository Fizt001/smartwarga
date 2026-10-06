'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { fetchApi } from '@/lib/api';
import { 
  MessageSquareWarning, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Camera, 
  User, 
  Send 
} from 'lucide-react';

export default function PengaduanView() {
  const { user } = useAuth();
  const isPengurus = Boolean(user && ['rt', 'rw', 'sekretaris', 'bendahara', 'super_admin'].includes(user.role));
  const [complaints, setComplaints] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Kebersihan Lingkungan');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Pengurus response modal states
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);
  const [showRespondModal, setShowRespondModal] = useState(false);
  const [respondStatus, setRespondStatus] = useState<'diproses' | 'selesai'>('diproses');
  const [respondNotes, setRespondNotes] = useState('');

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const url = filterStatus !== 'all' ? `/complaints?status=${filterStatus}` : '/complaints';
      const res = await fetchApi(url);
      if (res.success) setComplaints(res.data?.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [filterStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setAlertMsg(null);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      formData.append('description', description);
      if (photo) formData.append('photo', photo);

      const res = await fetchApi('/complaints', {
        method: 'POST',
        body: formData,
      });

      if (res.success) {
        setAlertMsg({ type: 'success', text: res.message });
        setShowModal(false);
        setTitle('');
        setDescription('');
        setPhoto(null);
        await loadComplaints();
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRespondSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setActionLoading(true);
    setAlertMsg(null);
    try {
      const res = await fetchApi(`/admin/complaints/${selectedComplaint.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: respondStatus,
          notes: respondNotes,
        }),
      });

      if (res.success) {
        setAlertMsg({ type: 'success', text: res.message });
        setShowRespondModal(false);
        setSelectedComplaint(null);
        setRespondNotes('');
        await loadComplaints();
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'selesai':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
          </span>
        );
      case 'diproses':
        return (
          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Diproses
          </span>
        );
      default:
        return (
          <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Laporan Masuk
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-base text-slate-800 tracking-tight flex items-center gap-2">
            <MessageSquareWarning className="w-5 h-5 text-amber-600" />
            <span>Pusat Pengaduan & Aspirasi Warga</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Sampaikan laporan fasilitas rusak, ketertiban, atau kebersihan lingkungan.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Buat Laporan</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'Semua Laporan' },
          { id: 'laporan_masuk', label: 'Laporan Masuk' },
          { id: 'diproses', label: 'Sedang Diproses' },
          { id: 'selesai', label: 'Selesai' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterStatus(f.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              filterStatus === f.id
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {alertMsg && (
        <div className={`p-3 rounded-2xl text-xs font-bold border ${
          alertMsg.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {alertMsg.text}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-xs border border-slate-200">
          Memuat riwayat pengaduan...
        </div>
      ) : complaints.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-xs border border-slate-200">
          Belum ada riwayat pengaduan warga.
        </div>
      ) : (
        complaints.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-extrabold text-slate-400">{item.category}</span>
                <h5 className="font-extrabold text-sm text-slate-800 mt-0.5">{item.title}</h5>
                <div className="text-[11px] text-slate-400">
                  Oleh {item.user?.name} ({item.user?.house?.full_address || 'Warga RT ' + item.user?.rt_number}) — {new Date(item.created_at).toLocaleDateString('id-ID')}
                </div>
              </div>
              <div>{getStatusBadge(item.status)}</div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              {item.description}
            </p>

            {item.photo_path && (
              <div>
                <img
                  src={`http://smartwarga.test${item.photo_path}`}
                  alt="Foto Aduan"
                  className="rounded-xl max-h-48 object-cover border border-slate-200"
                />
              </div>
            )}

            {/* Response History Timeline */}
            {(() => {
              let history: any[] = [];
              if (Array.isArray(item.response_history)) {
                history = item.response_history;
              } else if (typeof item.response_history === 'string' && item.response_history.trim().startsWith('[')) {
                try {
                  const parsed = JSON.parse(item.response_history);
                  if (Array.isArray(parsed)) history = parsed;
                } catch {
                  history = [];
                }
              }

              if (!history || history.length === 0) return null;

              return (
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Tanggapan Pengurus:</span>
                  {history.map((hist: any, hIdx: number) => {
                    const timeValue = hist.timestamp || hist.at;
                    const noteText = hist.notes || hist.text || 'Tanggapan pengurus tercatat.';
                    return (
                      <div key={hIdx} className="text-xs bg-emerald-50/60 border border-emerald-100 rounded-xl p-2.5 space-y-0.5">
                        <div className="flex items-center justify-between text-[11px] text-emerald-900 font-bold">
                          <span>{hist.by || 'Pengurus RT/RW'}</span>
                          {timeValue && (
                            <span className="text-[10px] text-emerald-600 font-medium">
                              {new Date(timeValue).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">{noteText}</p>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Pengurus Action Button */}
            {isPengurus && item.status !== 'selesai' && (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => {
                    setSelectedComplaint(item);
                    setRespondStatus(item.status === 'laporan_masuk' ? 'diproses' : 'selesai');
                    setRespondNotes('');
                    setShowRespondModal(true);
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Tindak Lanjut & Tanggapi</span>
                </button>
              </div>
            )}
          </div>
        ))
      )}

      {/* Modal Buat Aduan (Warga) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-black text-slate-900 mb-1">Formulir Pengaduan Lingkungan</h3>
            <p className="text-xs text-slate-500 mb-4">Pengurus RT & RW akan segera menerima notifikasi dan memproses laporan Anda.</p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Pengaduan:</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-300"
                >
                  <option value="Kebersihan Lingkungan">Kebersihan Lingkungan / Sampah</option>
                  <option value="Keamanan & Ketertiban">Keamanan & Ketertiban</option>
                  <option value="Fasilitas Jalan / Lampu">Fasilitas Jalan / Lampu Penerangan</option>
                  <option value="Saluran Air & Drainase">Saluran Air & Drainase</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Laporan Singkat:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Lampu jalan depan Blok B5 padam"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Lengkap / Lokasi:</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tuliskan detail kronologi atau lokasi spesifik..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 h-24"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Foto Pendukung (Opsional):</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-800 cursor-pointer"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-500/20"
                >
                  {actionLoading ? 'Mengirim...' : 'Kirim Pengaduan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Respon Pengurus */}
      {showRespondModal && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-black text-slate-900 mb-1">Tindak Lanjut Pengaduan Lingkungan</h3>
            <p className="text-xs text-slate-500 mb-3">
              Perbarui status dan berikan catatan penanganan resmi untuk pelapor ({selectedComplaint.user?.name}).
            </p>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 mb-4 text-xs">
              <span className="font-extrabold text-slate-800 block">{selectedComplaint.title}</span>
              <span className="text-slate-500 text-[11px]">{selectedComplaint.description}</span>
            </div>
            <form onSubmit={handleRespondSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Perbarui Status Jadi:</label>
                <select
                  value={respondStatus}
                  onChange={(e) => setRespondStatus(e.target.value as any)}
                  className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-300"
                >
                  <option value="diproses">Diproses (Sedang Ditangani Lapangan)</option>
                  <option value="selesai">Selesai (Penanganan Tuntas)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Tanggapan Pengurus:</label>
                <textarea
                  value={respondNotes}
                  onChange={(e) => setRespondNotes(e.target.value)}
                  placeholder="Contoh: Petugas kebersihan/keamanan telah membersihkan lokasi dan situasi kembali kondusif."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 h-24"
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRespondModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-500/20"
                >
                  {actionLoading ? 'Menyimpan...' : 'Simpan Tanggapan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
