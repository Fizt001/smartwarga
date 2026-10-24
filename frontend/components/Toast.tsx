'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const styles = {
          success: {
            bg: 'bg-emerald-950/90 border-emerald-500/40 text-white',
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
            badge: 'text-emerald-300',
          },
          error: {
            bg: 'bg-rose-950/90 border-rose-500/40 text-white',
            icon: <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />,
            badge: 'text-rose-300',
          },
          warning: {
            bg: 'bg-amber-950/90 border-amber-500/40 text-white',
            icon: <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />,
            badge: 'text-amber-300',
          },
          info: {
            bg: 'bg-slate-900/90 border-indigo-500/40 text-white',
            icon: <Info className="w-5 h-5 text-indigo-400 shrink-0" />,
            badge: 'text-indigo-300',
          },
        }[toast.type];

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-2xl p-4 shadow-2xl backdrop-blur-md border flex items-start gap-3 transition-all duration-300 animate-in slide-in-from-top-4 ${styles.bg}`}
          >
            {styles.icon}
            <div className="flex-1 text-xs space-y-0.5 pr-2">
              {toast.title && <p className={`font-bold ${styles.badge}`}>{toast.title}</p>}
              <p className="text-slate-200 leading-relaxed">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
