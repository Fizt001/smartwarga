'use client';

import React, { useState } from 'react';
import { X, Upload, CheckCircle2, Wallet, QrCode } from 'lucide-react';
import { fetchApi } from '@/lib/api';

export default function TopupModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [amount, setAmount] = useState<number>(50000);
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const presets = [20000, 50000, 100000, 200000, 500000];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Harap lampirkan foto/struk bukti transfer.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('amount', amount.toString());
      formData.append('proof_image', file);
      if (description) formData.append('description', description);

      const res = await fetchApi('/wallet/topup-request', {
        method: 'POST',
        body: formData,
      });

      if (res.success) {
        setMessage('Pengajuan Top-Up berhasil dikirim! Menunggu verifikasi dari Bendahara RT/RW.');
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 2500);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengajukan top-up.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Top-Up Saldo Warga</h3>
            <p className="text-xs text-slate-500">Isi saldo untuk bayar IPL & transaksi lingkungan</p>
          </div>
        </div>

        {/* Bank & QRIS Info Card */}
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 mb-4 text-xs">
          <div className="flex items-center justify-between font-bold text-emerald-900 mb-1">
            <span>Rekening Kas RW 05:</span>
            <span className="bg-emerald-200/80 text-emerald-800 px-2 py-0.5 rounded text-[10px]">BCA / Mandiri / QRIS</span>
          </div>
          <div className="font-mono text-emerald-950 font-extrabold text-sm tracking-wide">
            7120-9988-1234
          </div>
          <div className="text-[11px] text-emerald-700 mt-0.5">a.n Kas Rukun Warga 05 Mandiri</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Preset Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Pilih Nominal Top-Up:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {presets.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setAmount(preset)}
                  className={`py-2 px-1 text-xs rounded-xl font-bold border transition ${
                    amount === preset
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Rp {preset.toLocaleString('id-ID')}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Atau Masukkan Jumlah Manual (Rp):
            </label>
            <input
              type="number"
              min={10000}
              step={5000}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full text-sm font-semibold px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Upload Bukti Transfer / Resi QRIS:
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-600 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200 cursor-pointer"
              required
            />
          </div>

          {error && <div className="text-xs text-red-600 font-semibold">{error}</div>}
          {message && (
            <div className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{message}</span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50"
            >
              {loading ? 'Mengirim...' : 'Kirim Pengajuan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
