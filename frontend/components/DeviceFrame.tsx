'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';

export default function DeviceFrame({ children }: { children: React.ReactNode }) {
  const { viewMode } = useAuth();

  if (viewMode === 'desktop') {
    return <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 sm:pb-12">{children}</div>;
  }

  // Mobile Device Mockup Frame
  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex justify-center items-start py-4 sm:py-8 bg-slate-200/60">
      <div className="w-full max-w-[430px] min-h-[820px] bg-slate-50 border-4 sm:border-8 border-slate-900 rounded-[32px] sm:rounded-[44px] shadow-2xl overflow-hidden relative flex flex-col">
        {/* Phone Notch/Island */}
        <div className="w-full bg-slate-900 h-5 sm:h-6 flex justify-center items-center relative z-30">
          <div className="w-24 sm:w-28 h-3.5 sm:h-4 bg-black rounded-b-xl flex items-center justify-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-slate-700 rounded-full"></div>
            <div className="w-2.5 h-2.5 bg-slate-800 rounded-full border border-slate-700"></div>
          </div>
        </div>

        {/* Inner Phone Screen Content */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 pb-20">
          {children}
        </div>
      </div>
    </div>
  );
}
