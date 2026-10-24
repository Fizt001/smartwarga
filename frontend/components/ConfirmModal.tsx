'use client';

import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, X, Loader2 } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  loading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  variant = 'danger',
  loading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      iconBg: 'bg-rose-100 text-rose-600 border-rose-200',
      icon: <AlertTriangle className="w-6 h-6 text-rose-600" />,
      btnBg: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20',
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    warning: {
      iconBg: 'bg-amber-100 text-amber-600 border-amber-200',
      icon: <AlertCircle className="w-6 h-6 text-amber-600" />,
      btnBg: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    info: {
      iconBg: 'bg-blue-100 text-blue-600 border-blue-200',
      icon: <Info className="w-6 h-6 text-blue-600" />,
      btnBg: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20',
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    success: {
      iconBg: 'bg-emerald-100 text-emerald-600 border-emerald-200',
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
      btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
  }[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative overflow-hidden transition-all transform scale-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Subtle decorative top bar */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${
          variant === 'danger' ? 'bg-gradient-to-r from-rose-500 to-red-600' :
          variant === 'warning' ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
          variant === 'success' ? 'bg-gradient-to-r from-emerald-400 to-teal-500' :
          'bg-gradient-to-r from-blue-500 to-indigo-600'
        }`} />

        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4 mt-1">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${variantStyles.iconBg}`}>
            {variantStyles.icon}
          </div>

          <div className="space-y-1.5 flex-1 pr-6">
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              {title}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2.5 rounded-xl text-xs font-black shadow-lg transition active:scale-95 flex items-center gap-2 ${variantStyles.btnBg} disabled:opacity-50`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
