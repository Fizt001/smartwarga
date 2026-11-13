'use client';

import React, { useState, useEffect } from 'react';
import { X, Volume2, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';
import { fetchApi } from '@/lib/api';

export default function PanicModal({
  isOpen,
  onClose,
  defaultLocation = 'Kediaman Warga',
}: {
  isOpen: boolean;
  onClose: () => void;
  defaultLocation?: string;
}) {
  const [location, setLocation] = useState(defaultLocation);
  const [loading, setLoading] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLocation(defaultLocation);
      setStatusMsg(null);
    }
  }, [isOpen, defaultLocation]);

  if (!isOpen) return null;

  const triggerPanic = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetchApi('/iot/panic-button', {
        method: 'POST',
        body: JSON.stringify({
          location: location || 'Kediaman Warga',
          trigger_type: 'mobile_app_button',
        }),
      });

      if (res.success) {
        setStatusMsg({
          text: 'ALARM DARURAT BERHASIL DIAKTIFKAN! Petugas ronda & warga telah diberi tahu.',
          type: 'success',
        });
        setTimeout(() => {
          onClose();
          setStatusMsg(null);
        }, 2500);
      }
    } catch (err: any) {
      setStatusMsg({
        text: err.message || 'Gagal mengirim sinyal darurat.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSafe = async () => {
    setCanceling(true);
    setStatusMsg(null);
    try {
      // Matikan sirine dan tandai semua log darurat aktif menjadi selesai/handled
      await fetchApi('/iot/sirine/toggle', {
        method: 'POST',
        body: JSON.stringify({
          is_active: false,
          reason: 'Kondisi Aman / Dibatalkan oleh Warga',
        }),
      });
      setStatusMsg({
        text: 'Kondisi aman dinyatakan. Sirine dan peringatan darurat telah dinonaktifkan.',
        type: 'info',
      });
      setTimeout(() => {
        onClose();
        setStatusMsg(null);
      }, 1200);
    } catch (err: any) {
      console.warn('Error turning off siren:', err);
      // Tetap tutup modal agar user tidak terjebak
      onClose();
    } finally {
      setCanceling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-4 border-red-500 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full transition"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
            <ShieldAlert className="w-10 h-10" />
          </div>

          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            TOMBOL PANIK DARURAT
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Gunakan HANYA pada kondisi darurat (Pencurian, Kebakaran, Medis Kritis, atau Bencana Lingkungan).
          </p>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Lokasi Titik Kejadian:
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none"
            placeholder="Contoh: Rumah Blok A No. 12"
          />
        </div>

        {statusMsg && (
          <div
            className={`mt-4 p-3 border text-xs font-bold rounded-xl text-center flex items-center justify-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-red-50 border-red-200 text-red-700'
                : statusMsg.type === 'info'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}
          >
            {statusMsg.type === 'info' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : null}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={triggerPanic}
            disabled={loading || canceling}
            className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold rounded-2xl shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 transition active:scale-95 text-sm disabled:opacity-50"
          >
            <Volume2 className="w-5 h-5 animate-bounce" />
            {loading ? 'MENGIRIM SINYAL...' : 'BUNYIKAN SIRINE & BROADCAST DARURAT'}
          </button>

          <button
            type="button"
            onClick={handleCancelSafe}
            disabled={loading || canceling}
            className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center justify-center gap-1.5 transition hover:bg-slate-50 rounded-xl"
          >
            {canceling ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Memproses Pembatalan...</span>
              </>
            ) : (
              <span>Batalkan (Kondisi Aman)</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
