'use client';

import React, { useState } from 'react';
import { AlertOctagon, X, Volume2, ShieldAlert } from 'lucide-react';
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
  const [statusMsg, setStatusMsg] = useState('');

  if (!isOpen) return null;

  const triggerPanic = async () => {
    setLoading(true);
    setStatusMsg('');
    try {
      const res = await fetchApi('/iot/panic-button', {
        method: 'POST',
        body: JSON.stringify({
          location: location || 'Kediaman Warga',
          trigger_type: 'mobile_app_button',
        }),
      });

      if (res.success) {
        setStatusMsg('ALARM DARURAT BERHASIL DIAKTIFKAN! Petugas ronda & warga telah diberi tahu.');
        setTimeout(() => {
          onClose();
          setStatusMsg('');
        }, 3000);
      }
    } catch (err: any) {
      setStatusMsg(err.message || 'Gagal mengirim sinyal darurat.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-4 border-red-500 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full"
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
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl text-center">
            {statusMsg}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={triggerPanic}
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold rounded-2xl shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 transition active:scale-95 text-sm"
          >
            <Volume2 className="w-5 h-5 animate-bounce" />
            {loading ? 'MENGIRIM SINYAL...' : 'BUNYIKAN SIRINE & BROADCAST DARURAT'}
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-800 font-semibold"
          >
            Batalkan (Kondisi Aman)
          </button>
        </div>
      </div>
    </div>
  );
}
