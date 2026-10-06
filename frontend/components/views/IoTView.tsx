'use client';

import React, { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { 
  Cpu, 
  Radio, 
  Volume2, 
  VolumeX, 
  ShieldAlert, 
  Recycle, 
  Activity, 
  Play, 
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DoorOpen
} from 'lucide-react';

export default function IoTView() {
  const [sirenActive, setSirenActive] = useState(false);
  const [sirenReason, setSirenReason] = useState('');
  const [devices, setDevices] = useState<any[]>([]);
  const [rondaLogs, setRondaLogs] = useState<any[]>([]);
  const [emergencyLogs, setEmergencyLogs] = useState<any[]>([]);
  const [wasteLogs, setWasteLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [simLoading, setSimLoading] = useState(false);
  const [simMsg, setSimMsg] = useState('');

  const loadIoTData = async () => {
    try {
      const [devRes, rondaRes, emerRes, wasteRes] = await Promise.all([
        fetchApi('/iot/devices'),
        fetchApi('/iot/ronda/logs'),
        fetchApi('/iot/emergency-logs'),
        fetchApi('/iot/waste-bank/logs'),
      ]);

      if (devRes.success) {
        setDevices(devRes.data?.devices || []);
        setSirenActive(Boolean(devRes.data?.siren_status?.is_active));
        setSirenReason(devRes.data?.siren_status?.reason || '');
      }
      if (rondaRes.success) setRondaLogs(rondaRes.data?.data || []);
      if (emerRes.success) setEmergencyLogs(emerRes.data?.data || []);
      if (wasteRes.success) setWasteLogs(wasteRes.data?.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIoTData();
    const interval = setInterval(loadIoTData, 4000); // Polling every 4s
    return () => clearInterval(interval);
  }, []);

  const handleToggleSiren = async (activate: boolean) => {
    setToggleLoading(true);
    try {
      const res = await fetchApi('/iot/sirine/toggle', {
        method: 'POST',
        body: JSON.stringify({
          is_active: activate,
          reason: activate ? 'Diaktifkan manual melalui Web Monitoring' : 'Dinonaktifkan via Web',
        }),
      });
      if (res.success) {
        setSirenActive(activate);
        setSirenReason(res.data?.reason || '');
        await loadIoTData();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setToggleLoading(false);
    }
  };

  // Simulation Triggers for Live Demonstration
  const simulateRondaTap = async () => {
    setSimLoading(true);
    setSimMsg('');
    try {
      const res = await fetchApi('/iot/ronda/tap', {
        method: 'POST',
        body: JSON.stringify({ rfid_uid: 'RFID_WARGA_01', post_id: 'POS_01' }),
      });
      setSimMsg(res.message);
      await loadIoTData();
    } catch (err: any) {
      setSimMsg(err.message);
    } finally {
      setSimLoading(false);
    }
  };

  const simulateWasteDeposit = async (category: 'kaleng' | 'plastik', grams: number) => {
    setSimLoading(true);
    setSimMsg('');
    try {
      const res = await fetchApi('/iot/bank-sampah/setor', {
        method: 'POST',
        body: JSON.stringify({
          rfid_uid: 'RFID_WARGA_01',
          kategori: category,
          berat_gram: grams,
        }),
      });
      setSimMsg(res.message);
      await loadIoTData();
    } catch (err: any) {
      setSimMsg(err.message);
    } finally {
      setSimLoading(false);
    }
  };

  const simulatePanicButton = async () => {
    setSimLoading(true);
    setSimMsg('');
    try {
      const res = await fetchApi('/iot/panic-button', {
        method: 'POST',
        body: JSON.stringify({
          location: 'Pos Gerbang Utama RT 01-03',
          trigger_type: 'hardware_button',
        }),
      });
      setSimMsg(res.message);
      await loadIoTData();
    } catch (err: any) {
      setSimMsg(err.message);
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Sirene Wilayah Master Control Card */}
      <div className={`p-5 rounded-3xl border-2 transition-all shadow-xl ${
        sirenActive 
          ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white border-red-700 animate-pulse'
          : 'bg-white text-slate-800 border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${
              sirenActive ? 'bg-white/20 text-white animate-bounce' : 'bg-slate-100 text-slate-600'
            }`}>
              {sirenActive ? <Volume2 className="w-8 h-8" /> : <VolumeX className="w-8 h-8" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold tracking-wider opacity-80">
                  Node 2: Sirine Wilayah RT
                </span>
                <span className={`w-2 h-2 rounded-full ${sirenActive ? 'bg-white animate-ping' : 'bg-emerald-500'}`}></span>
              </div>
              <h3 className="text-xl font-black mt-0.5 tracking-tight">
                {sirenActive ? 'ALARM SIRINE AKTIF!' : 'Sirine Wilayah Siaga (Aman)'}
              </h3>
              <p className={`text-xs mt-0.5 ${sirenActive ? 'text-red-100 font-semibold' : 'text-slate-500'}`}>
                {sirenReason || 'Tidak ada ancaman bahaya yang terdeteksi.'}
              </p>
            </div>
          </div>

          <div>
            {sirenActive ? (
              <button
                onClick={() => handleToggleSiren(false)}
                disabled={toggleLoading}
                className="px-4 py-2.5 bg-white text-red-700 hover:bg-red-50 font-black text-xs rounded-2xl shadow-lg transition active:scale-95"
              >
                {toggleLoading ? 'Mematikan...' : 'MATIKAN SIRINE'}
              </button>
            ) : (
              <button
                onClick={() => handleToggleSiren(true)}
                disabled={toggleLoading}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-2xl shadow-md shadow-red-500/30 transition active:scale-95 flex items-center gap-1.5"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>BUNYIKAN SIRINE</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Hardware Live Simulator Panel */}
      <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-300">
              Simulasi Hardware IoT (Live Demonstration Panel)
            </h4>
          </div>
          <span className="text-[10px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded font-mono">
            3 Nodes Active
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Uji coba payload perangkat fisik ESP32 secara instan: tap absensi ronda, timbangan sampah otomatis (kredit dompet), atau tombol panik hardware.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <button
            onClick={simulateRondaTap}
            disabled={simLoading}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border border-slate-700 active:scale-95 transition"
          >
            <DoorOpen className="w-4 h-4 text-blue-400" />
            <span>Tap Ronda & Palang</span>
          </button>

          <button
            onClick={() => simulateWasteDeposit('kaleng', 2500)}
            disabled={simLoading}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border border-slate-700 active:scale-95 transition"
          >
            <Recycle className="w-4 h-4 text-emerald-400" />
            <span>Timbang Kaleng 2.5kg</span>
          </button>

          <button
            onClick={() => simulateWasteDeposit('plastik', 5000)}
            disabled={simLoading}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border border-slate-700 active:scale-95 transition"
          >
            <Recycle className="w-4 h-4 text-teal-400" />
            <span>Timbang Plastik 5kg</span>
          </button>

          <button
            onClick={simulatePanicButton}
            disabled={simLoading}
            className="p-2.5 bg-red-900/60 hover:bg-red-800 text-white rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border border-red-700 active:scale-95 transition"
          >
            <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
            <span>Panic Button Pos</span>
          </button>
        </div>

        {simMsg && (
          <div className="p-2.5 bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl font-medium animate-fade-in flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{simMsg}</span>
          </div>
        )}
      </div>

      {/* 3. Node Devices Health Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-2.5">
        <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">
          Kesehatan Perangkat Hardware ESP32
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {devices.map((dev) => (
            <div key={dev.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
              <div>
                <div className="text-xs font-extrabold text-slate-800 capitalize">
                  {dev.device_type.replace('_', ' ')}
                </div>
                <div className="text-[10px] text-slate-500 truncate max-w-[140px]">{dev.location}</div>
                <div className="text-[9px] text-slate-400 mt-1 font-mono">{dev.device_key}</div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Online
                </span>
                <div className="text-[9px] text-slate-400 mt-1">
                  Ping: {dev.last_ping ? new Date(dev.last_ping).toLocaleTimeString('id-ID') : 'Baru saja'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Real-Time Logs Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Node 1 Ronda Logs */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
              <DoorOpen className="w-4 h-4 text-blue-600" />
              <span>Log Tap Ronda & Palang Pintu</span>
            </h5>
            <span className="text-[10px] text-slate-400 font-bold">Node 1</span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {rondaLogs.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-4">Belum ada aktivitas tap ronda.</div>
            ) : (
              rondaLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800">{log.user?.name}</div>
                    <div className="text-[10px] text-slate-500">{log.user?.house?.full_address}</div>
                  </div>
                  <div className="text-right">
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
                      Gerbang Terbuka
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(log.tapped_at).toLocaleTimeString('id-ID')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Node 3 Waste Bank Logs */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
              <Recycle className="w-4 h-4 text-emerald-600" />
              <span>Log Timbangan Bank Sampah</span>
            </h5>
            <span className="text-[10px] text-slate-400 font-bold">Node 3</span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {wasteLogs.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-4">Belum ada transaksi timbangan.</div>
            ) : (
              wasteLogs.slice(0, 5).map((wLog) => (
                <div key={wLog.id} className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800">{wLog.user?.name}</div>
                    <div className="text-[10px] text-slate-500 capitalize">
                      {wLog.category} ({wLog.weight_gram} gram)
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-emerald-700">
                      +Rp {Number(wLog.total_nominal).toLocaleString('id-ID')}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(wLog.created_at).toLocaleTimeString('id-ID')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
