'use client';

import React from 'react';
import { 
  Home, 
  CreditCard, 
  FileText, 
  MessageSquareWarning, 
  Cpu, 
  ShieldCheck,
  Calendar,
  Wallet,
  Building2,
  FileCheck2,
  Users
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pengurusSubTab?: string;
  onNavigateTab?: (tab: string, subTab?: string) => void;
}

export default function BottomNav({ 
  activeTab, 
  setActiveTab,
  pengurusSubTab,
  onNavigateTab
}: BottomNavProps) {
  const { user, isPengurus, viewMode } = useAuth();

  if (viewMode === 'desktop') {
    return null;
  }

  const handleNav = (tabId: string, subTab?: string) => {
    if (onNavigateTab) {
      onNavigateTab(tabId, subTab);
    } else {
      setActiveTab(tabId);
    }
  };

  const isNavActive = (tabId: string, subTab?: string) => {
    if (tabId === 'pengurus') {
      if (activeTab !== 'pengurus') return false;
      if (subTab && pengurusSubTab) {
        return pengurusSubTab === subTab;
      }
      return true;
    }
    return activeTab === tabId;
  };

  // Role-based mobile nav items
  let navItems: any[] = [];

  if (user?.role === 'bendahara') {
    navItems = [
      { id: 'pengurus', subTab: 'ipl', label: 'Kas & Iuran', icon: CreditCard },
      { id: 'pengurus', subTab: 'kegiatan', label: 'Pencairan', icon: Calendar },
      { id: 'pengurus', subTab: 'topup', label: 'Top-Up', icon: Wallet },
      { id: 'pengurus', subTab: 'sensus', label: 'Sensus 300', icon: Building2 },
      { id: 'iot', label: 'IoT Live', icon: Cpu },
    ];
  } else if (user?.role === 'sekretaris') {
    navItems = [
      { id: 'pengurus', subTab: 'kegiatan', label: 'Agenda', icon: Calendar },
      { id: 'pengurus', subTab: 'surat', label: 'Surat', icon: FileCheck2 },
      { id: 'pengurus', subTab: 'sensus', label: 'Sensus 300', icon: Building2 },
      { id: 'iot', label: 'IoT Live', icon: Cpu },
    ];
  } else if (user?.role === 'rt' || user?.role === 'rw' || user?.role === 'super_admin') {
    navItems = [
      { id: 'pengurus', subTab: 'sensus', label: 'Sensus 300', icon: Building2 },
      { id: 'pengurus', subTab: 'approval', label: 'ACC Warga', icon: Users },
      { id: 'pengurus', subTab: 'ipl', label: 'Kas & Iuran', icon: CreditCard },
      { id: 'pengaduan', label: 'Aduan', icon: MessageSquareWarning },
      { id: 'iot', label: 'IoT Live', icon: Cpu },
    ];
  } else {
    // Warga (KK Utama)
    navItems = [
      { id: 'dashboard', label: 'Beranda', icon: Home },
      { id: 'ipl', label: 'IPL Saya', icon: CreditCard },
      { id: 'layanan', label: 'Layanan', icon: FileText },
      { id: 'pengaduan', label: 'Aduan', icon: MessageSquareWarning },
      { id: 'iot', label: 'IoT Live', icon: Cpu },
    ];
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-2 flex justify-around items-center shadow-lg md:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = isNavActive(item.id, item.subTab);
        return (
          <button
            key={`${item.id}-${item.subTab || 'main'}`}
            onClick={() => handleNav(item.id, item.subTab)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              isActive
                ? 'text-emerald-700 font-bold scale-105'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`p-1 rounded-lg ${isActive ? 'bg-emerald-100 text-emerald-800' : ''}`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[9px] mt-0.5 tracking-tight font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
