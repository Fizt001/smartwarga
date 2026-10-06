'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import DeviceFrame from '@/components/DeviceFrame';
import PanicModal from '@/components/PanicModal';
import TopupModal from '@/components/TopupModal';

// Views
import AuthView from '@/components/views/AuthView';
import DashboardView from '@/components/views/DashboardView';
import IplView from '@/components/views/IplView';
import LayananView from '@/components/views/LayananView';
import PengaduanView from '@/components/views/PengaduanView';
import IoTView from '@/components/views/IoTView';
import PengurusView from '@/components/views/PengurusView';

export default function HomePage() {
  const { user, loading, refreshUser, viewMode, isPengurus } = useAuth();

  const getInitialSubTab = (role?: string): 'sensus' | 'ipl' | 'kegiatan' | 'surat' | 'approval' | 'topup' => {
    if (role === 'bendahara') return 'ipl';
    if (role === 'sekretaris') return 'kegiatan';
    return 'sensus';
  };

  const [activeTab, setActiveTabState] = useState<string>('dashboard');
  const [layananSubTab, setLayananSubTab] = useState<'surat' | 'umkm' | 'koperasi' | 'aset' | 'rukam' | 'posyandu'>('surat');
  const [pengurusSubTab, setPengurusSubTab] = useState<'sensus' | 'ipl' | 'kegiatan' | 'surat' | 'approval' | 'topup' | 'aset' | 'koperasi' | 'posyandu' | 'rukam'>('sensus');
  const [showPanicModal, setShowPanicModal] = useState(false);
  const [showTopupModal, setShowTopupModal] = useState(false);

  // Helper: construct URL path
  const buildPath = (tab: string, sub?: string) => {
    if (tab === 'layanan' && sub) return `/layanan/${sub}`;
    if (tab === 'pengurus' && sub) return `/pengurus/${sub}`;
    return `/${tab}`;
  };

  // Navigate function that pushes history state and updates URL in address bar
  const handleNavigate = useCallback((tab: string, subTab?: string, push = true) => {
    setActiveTabState(tab);
    if (tab === 'layanan' && subTab) {
      setLayananSubTab(subTab as any);
    } else if (tab === 'pengurus' && subTab) {
      setPengurusSubTab(subTab as any);
    }

    if (push && typeof window !== 'undefined') {
      const targetPath = buildPath(tab, subTab);
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ tab, subTab }, '', targetPath);
      }
    }
  }, []);

  // Sync from URL path (initial load and browser back/forward popstate)
  const syncFromPath = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
    if (!path) return false;

    const parts = path.split('/');
    const mainTab = parts[0]?.toLowerCase();
    const subTab = parts[1]?.toLowerCase();

    const validTabs = ['dashboard', 'ipl', 'layanan', 'pengaduan', 'iot', 'pengurus'];
    if (validTabs.includes(mainTab)) {
      setActiveTabState(mainTab);
      if (mainTab === 'layanan' && subTab) {
        setLayananSubTab(subTab as any);
      } else if (mainTab === 'pengurus' && subTab) {
        setPengurusSubTab(subTab as any);
      }
      return true;
    }
    return false;
  }, []);

  // Listen for browser popstate (back/forward navigation)
  useEffect(() => {
    syncFromPath();

    const handlePopState = () => {
      syncFromPath();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [syncFromPath]);

  // Sync tab with user role immediately when user data is ready if at root
  useEffect(() => {
    if (user) {
      const hasSpecificPath = syncFromPath();

      if (!hasSpecificPath) {
        if (isPengurus) {
          const initialSub = getInitialSubTab(user.role);
          handleNavigate('pengurus', initialSub, true);
        } else {
          handleNavigate('dashboard', undefined, true);
        }
      } else {
        // Enforce pengurus / resident role routing constraints if needed
        if (isPengurus && (activeTab === 'dashboard' || activeTab === 'ipl')) {
          const initialSub = getInitialSubTab(user.role);
          handleNavigate('pengurus', initialSub, true);
        } else if (!isPengurus && activeTab === 'pengurus') {
          handleNavigate('dashboard', undefined, true);
        }
      }
    }
  }, [user?.id, user?.role, isPengurus]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-sm font-bold tracking-tight">Memuat SMART-WARGA Digital Platform...</div>
      </div>
    );
  }

  // Active View Renderer
  const renderCurrentView = () => {
    // If user is Pengurus (Bendahara, Sekretaris, RT, RW, Super Admin), they should never see resident payment interfaces
    if (isPengurus) {
      if (activeTab === 'pengurus' || activeTab === 'ipl' || activeTab === 'dashboard') {
        return (
          <PengurusView
            currentSubTab={pengurusSubTab}
            onSubTabChange={(sub) => handleNavigate('pengurus', sub, true)}
          />
        );
      }
      if (activeTab === 'iot') {
        return <IoTView />;
      }
    }

    // Warga (KK Utama) Views
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigateTab={handleNavigate}
            onOpenPanic={() => setShowPanicModal(true)}
            onOpenTopup={() => setShowTopupModal(true)}
          />
        );
      case 'ipl':
        return (
          <IplView
            onOpenTopup={() => setShowTopupModal(true)}
            onSwitchToPengurus={(subTab) => {
              handleNavigate('pengurus', subTab, true);
            }}
          />
        );
      case 'layanan':
        return (
          <LayananView
            currentSubTab={layananSubTab}
            onSubTabChange={(sub) => handleNavigate('layanan', sub, true)}
          />
        );
      case 'pengaduan':
        return <PengaduanView />;
      case 'iot':
        return <IoTView />;
      case 'pengurus':
        return (
          <PengurusView
            currentSubTab={pengurusSubTab}
            onSubTabChange={(sub) => handleNavigate('pengurus', sub, true)}
          />
        );
      default:
        return (
          <DashboardView
            onNavigateTab={handleNavigate}
            onOpenPanic={() => setShowPanicModal(true)}
            onOpenTopup={() => setShowTopupModal(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70">
      <Navbar onOpenPanic={() => setShowPanicModal(true)} />

      {/* When not logged in */}
      {!user ? (
        <main className="flex-1 flex items-center justify-center p-4">
          <AuthView />
        </main>
      ) : (
        /* When logged in */
        <>
          {viewMode === 'desktop' ? (
            /* DESKTOP MODE: Full-Width Left Sidebar + Right Fluid Content */
            <div className="flex-1 flex w-full">
              <Sidebar
                activeTab={activeTab}
                setActiveTab={(tab) => handleNavigate(tab, undefined, true)}
                pengurusSubTab={pengurusSubTab}
                onNavigateTab={(tab, sub) => handleNavigate(tab, sub, true)}
                onOpenPanic={() => setShowPanicModal(true)}
                onOpenTopup={() => setShowTopupModal(true)}
              />
              <main className="flex-1 min-w-0 p-6 lg:p-8 pb-16">
                {renderCurrentView()}
              </main>
            </div>
          ) : (
            /* MOBILE MODE: Phone Mockup Frame + Bottom Navigation */
            <main className="flex-1 pb-16">
              <DeviceFrame>
                {renderCurrentView()}
              </DeviceFrame>
            </main>
          )}

          {/* Bottom Nav on Mobile Mode */}
          <BottomNav 
            activeTab={activeTab} 
            setActiveTab={(tab) => handleNavigate(tab, undefined, true)} 
            pengurusSubTab={pengurusSubTab}
            onNavigateTab={(tab, sub) => handleNavigate(tab, sub, true)}
          />
        </>
      )}

      {/* Global Modals */}
      <PanicModal
        isOpen={showPanicModal}
        onClose={() => setShowPanicModal(false)}
        defaultLocation={user?.house?.full_address || 'Wilayah RT ' + (user?.rt_number || '01')}
      />

      <TopupModal
        isOpen={showTopupModal}
        onClose={() => setShowTopupModal(false)}
        onSuccess={() => refreshUser()}
      />
    </div>
  );
}
