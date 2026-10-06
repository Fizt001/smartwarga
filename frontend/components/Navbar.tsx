'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { 
  Building2, 
  Smartphone, 
  Monitor, 
  LogOut, 
  AlertTriangle, 
  Bell, 
  ShieldAlert,
  UserCheck,
  Clock
} from 'lucide-react';
import { fetchApi } from '@/lib/api';

export default function Navbar({ onOpenPanic }: { onOpenPanic?: () => void }) {
  const { user, logout, isPengurus, viewMode, toggleViewMode } = useAuth();
  const [sirenActive, setSirenActive] = useState(false);

  // Poll siren status every 5s for top alert badge
  useEffect(() => {
    const checkSiren = async () => {
      try {
        const res = await fetchApi('/iot/sirine/status');
        setSirenActive(Boolean(res.siren_active));
      } catch {
        // ignore
      }
    };
    checkSiren();
    const timer = setInterval(checkSiren, 5000);
    return () => clearInterval(timer);
  }, []);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'super_admin':
        return <span className="bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-full text-xs">Super Admin</span>;
      case 'rw':
        return <span className="bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full text-xs">Ketua RW</span>;
      case 'rt':
        return <span className="bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full text-xs">Ketua RT {user?.rt_number}</span>;
      case 'bendahara':
        return <span className="bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full text-xs">Bendahara</span>;
      case 'sekretaris':
        return <span className="bg-cyan-100 text-cyan-700 font-semibold px-2 py-0.5 rounded-full text-xs">Sekretaris</span>;
      default:
        return <span className="bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full text-xs">Warga RT {user?.rt_number}</span>;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top Emergency Bar if Siren Active */}
      {sirenActive && (
        <div className="bg-red-600 text-white px-4 py-2 text-center text-xs sm:text-sm font-bold flex items-center justify-center gap-2 animate-pulse">
          <AlertTriangle className="w-4 h-4 animate-bounce" />
          <span>PERINGATAN DARURAT: Sirine Wilayah RT Aktif! Hubungi Pos Satpam segera.</span>
        </div>
      )}

      <div className="w-full px-4 sm:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-base sm:text-lg leading-tight tracking-tight text-slate-800">
              SMART<span className="text-emerald-600">-WARGA</span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium">Digital RW 05 Platform</div>
          </div>
        </div>

        {/* Right Action Items */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Toggle View Mode Button */}
          <button
            onClick={toggleViewMode}
            title="Toggle Desktop vs Mobile Device View"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-medium transition"
          >
            {viewMode === 'mobile' ? (
              <>
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Mobile Frame</span>
              </>
            ) : (
              <>
                <Monitor className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Desktop Wide</span>
              </>
            )}
          </button>

          {/* Panic Button Trigger (Direct header shortcut) */}
          {user && onOpenPanic && (
            <button
              onClick={onOpenPanic}
              className="bg-red-500 hover:bg-red-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
              title="Tombol Panik Darurat"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PANIC</span>
            </button>
          )}

          {/* User Info & Logout */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-800 truncate max-w-[120px]">{user.name}</span>
                <div className="flex items-center gap-1">
                  {getRoleBadge(user.role)}
                  {user.status === 'pending' && (
                    <span className="bg-amber-100 text-amber-700 font-semibold px-1.5 py-0.5 rounded text-[10px] flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" /> Pending
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={logout}
                title="Keluar"
                className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
