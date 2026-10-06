'use client';

import React, { useState, useEffect } from 'react';
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

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [pengurusSubTab, setPengurusSubTab] = useState<'sensus' | 'ipl' | 'kegiatan' | 'surat' | 'approval' | 'topup' | 'aset' | 'koperasi' | 'posyandu' | 'rukam'>('sensus');
  const [showPanicModal, setShowPanicModal] = useState(false);
  const [showTopupModal, setShowTopupModal] = useState(false);

  // Sync tab with user role immediately when user data is ready
  useEffect(() => {
    if (user) {
      if (isPengurus) {
        if (activeTab === 'dashboard' || activeTab === 'ipl' || activeTab === 'layanan' || activeTab === 'pengaduan') {
          setActiveTab('pengurus');
        }
        setPengurusSubTab(getInitialSubTab(user.role));
      } else {
        if (activeTab === 'pengurus') {
          setActiveTab('dashboard');
        }
      }
    }
  }, [user?.id, user?.role, isPengurus]);

  const handleNavigate = (tab: string, subTab?: string) => {
    setActiveTab(tab);
    if (subTab) {
      setPengurusSubTab(subTab as any);
    }
  };

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
            onSubTabChange={(tab) => setPengurusSubTab(tab)}
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
              setActiveTab('pengurus');
              setPengurusSubTab(subTab as any);
            }}
          />
        );
      case 'layanan':
        return <LayananView />;
      case 'pengaduan':
        return <PengaduanView />;
      case 'iot':
        return <IoTView />;
      case 'pengurus':
        return (
          <PengurusView
            currentSubTab={pengurusSubTab}
            onSubTabChange={(tab) => setPengurusSubTab(tab)}
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
                setActiveTab={setActiveTab}
                pengurusSubTab={pengurusSubTab}
                onNavigateTab={handleNavigate}
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
            setActiveTab={setActiveTab} 
            pengurusSubTab={pengurusSubTab}
            onNavigateTab={handleNavigate}
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
