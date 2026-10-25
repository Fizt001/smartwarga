'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Cpu, 
  Radio, 
  Volume2, 
  VolumeX, 
  ShieldAlert, 
  Recycle, 
  Activity, 
  RotateCw, 
  CheckCircle2, 
  AlertTriangle, 
  DoorOpen, 
  IdCard, 
  Terminal, 
  ExternalLink, 
  Zap, 
  Wifi, 
  Power, 
  Trash2, 
  Copy, 
  Scale, 
  Siren, 
  ArrowRight,
  Info,
  Check,
  Sparkles
} from 'lucide-react';
import { fetchApi } from '@/lib/api';

// Sound Synthesizer via Web Audio API (zero external assets needed)
class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  beep(freq = 2400, duration = 0.08, type: OscillatorType = 'sine') {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {}
  }

  playSuccess() {
    this.beep(2000, 0.06);
    setTimeout(() => this.beep(2600, 0.1), 80);
  }

  playError() {
    this.beep(400, 0.15, 'sawtooth');
    setTimeout(() => this.beep(300, 0.25, 'sawtooth'), 160);
  }

  playClick() {
    this.beep(1200, 0.02, 'triangle');
  }

  playServo() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(180, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch {}
  }

  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private sirenTimer: any = null;

  startSiren() {
    if (!this.enabled || this.sirenOsc) return;
    this.init();
    if (!this.ctx) return;
    try {
      this.sirenOsc = this.ctx.createOscillator();
      this.sirenGain = this.ctx.createGain();
      this.sirenOsc.type = 'sawtooth';
      this.sirenGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      this.sirenOsc.connect(this.sirenGain);
      this.sirenGain.connect(this.ctx.destination);
      this.sirenOsc.start();

      let high = false;
      this.sirenTimer = setInterval(() => {
        if (!this.ctx || !this.sirenOsc) return;
        const targetFreq = high ? 650 : 1100;
        this.sirenOsc.frequency.linearRampToValueAtTime(targetFreq, this.ctx.currentTime + 0.4);
        high = !high;
      }, 450);
    } catch {}
  }

  stopSiren() {
    if (this.sirenTimer) {
      clearInterval(this.sirenTimer);
      this.sirenTimer = null;
    }
    if (this.sirenOsc) {
      try {
        this.sirenOsc.stop();
        this.sirenOsc.disconnect();
      } catch {}
      this.sirenOsc = null;
    }
  }
}

const synth = new SoundSynthesizer();

export default function SimulatorView() {
  // Operational Modes
  // Mode 1: Ronda & Palang
  // Mode 2: Timbangan Kaleng
  // Mode 3: Timbangan Plastik
  // Mode 4: Reg-KTP Mandiri
  const [mode, setMode] = useState<number>(1);

  // LCD 16x2 State (16 chars max per line)
  const [lcdLine1, setLcdLine1] = useState<string>('POS RONDA SIAGA ');
  const [lcdLine2, setLcdLine2] = useState<string>('TAP KARTU/E-KTP ');

  // ESP32 Status
  const [wifiConnected, setWifiConnected] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // RFID Selected Card
  const [selectedUid, setSelectedUid] = useState<string>('RFID_WARGA_01');
  const [customUid, setCustomUid] = useState<string>('');
  const [lastTappedUid, setLastTappedUid] = useState<string>('');

  // Servo Gate State (0 = closed, 90 = open)
  const [servoAngle, setServoAngle] = useState<number>(0);
  const [servoCountdown, setServoCountdown] = useState<number>(0);

  // Loadcell HX711 Weight State
  const [weightGrams, setWeightGrams] = useState<number>(2500);

  // Siren Alarm State
  const [sirenActive, setSirenActive] = useState<boolean>(false);
  const [sirenReason, setSirenReason] = useState<string>('');

  // Serial Monitor Logs
  const [serialLogs, setSerialLogs] = useState<string[]>([]);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Sync sound toggle
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    synth.enabled = next;
    if (!next) synth.stopSiren();
  };

  // Log Helper
  const addLog = useCallback((category: 'SYS' | 'WIFI' | 'HTTP' | 'RFID' | 'SERVO' | 'HX711' | 'PANIC' | 'LCD', msg: string) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
    setSerialLogs((prev) => [...prev.slice(-150), `[${timeStr}] [${category.padEnd(5)}] ${msg}`]);
  }, []);

  // Boot sequence
  const rebootBoard = useCallback(() => {
    synth.playClick();
    setIsProcessing(true);
    setSerialLogs([]);
    setLcdLine1('BOOTING ESP32...');
    setLcdLine2('SYSTEM RESET    ');
    addLog('SYS', 'ESP.restart() triggered by user.');
    addLog('SYS', 'Booting SMART-WARGA ESP32 AIO Firmware v2.2 (Chip: ESP32-D0WDQ6)...');
    
    setTimeout(() => {
      addLog('SYS', 'I2C Bus initialized: PCF8574 LCD 16x2 found at 0x27');
      addLog('SYS', 'SPI Bus initialized: MFRC522 RFID Reader on Pins SS=5, SCK=18, MOSI=23, MISO=19');
      addLog('SYS', 'HX711 ADC Tare Completed. Current Offset: 842100');
      addLog('SYS', 'SG90 Servo attached to GPIO 13. Calibration set to 0 deg.');
      setLcdLine1('CONNECTING WIFI ');
      setLcdLine2('SmartWarga-Net  ');
    }, 400);

    setTimeout(() => {
      addLog('WIFI', 'WiFi Connected! IP Address: 192.168.1.108 | RSSI: -48 dBm');
      addLog('HTTP', 'POST /api/iot/heartbeat -> 200 OK (Device: single_esp32_aio)');
      setMode(1);
      setLcdLine1('POS RONDA SIAGA ');
      setLcdLine2('TAP KARTU/E-KTP ');
      setIsProcessing(false);
      synth.playSuccess();
    }, 900);
  }, [addLog]);

  // Initial boot on load
  useEffect(() => {
    rebootBoard();
  }, []);

  // Auto scroll terminal
  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [serialLogs, autoScroll]);

  // Switch Mode handler
  const handleSwitchMode = () => {
    synth.playClick();
    const nextMode = mode >= 4 ? 1 : mode + 1;
    setMode(nextMode);

    if (nextMode === 1) {
      setLcdLine1('MD:RONDA-PALANG >');
      setLcdLine2('TAP KARTU/E-KTP ');
      addLog('SYS', 'Mode switched to 1: RONDA & PALANG (Pos RFID Gate Access)');
    } else if (nextMode === 2) {
      setLcdLine1('MD:BS-KALENG    >');
      setLcdLine2(`BERAT: ${(weightGrams / 1000).toFixed(2)} KG `);
      addLog('SYS', 'Mode switched to 2: TIMBANGAN BANK SAMPAH (Kaleng - Rp 5.000/kg)');
    } else if (nextMode === 3) {
      setLcdLine1('MD:BS-PLASTIK   >');
      setLcdLine2(`BERAT: ${(weightGrams / 1000).toFixed(2)} KG `);
      addLog('SYS', 'Mode switched to 3: TIMBANGAN BANK SAMPAH (Plastik - Rp 2.000/kg)');
    } else if (nextMode === 4) {
      setLcdLine1('MD:REG-KTP      >');
      setLcdLine2('TEMPELKAN KARTU ');
      addLog('SYS', 'Mode switched to 4: REG-KTP MANDIRI (Self-Service e-KTP Registration)');
    }
  };

  // RFID Tap Execution
  const activeUid = customUid.trim() || selectedUid;

  const handleTapRfid = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setLastTappedUid(activeUid);
    synth.beep(2400, 0.08);

    addLog('RFID', `Card detected! PICC UID: ${activeUid} (Type: MIFARE Classic / e-KTP)`);

    try {
      if (mode === 1) {
        // MODE 1: RONDA & PALANG GATE
        addLog('HTTP', `POST /api/iot/ronda/tap | Payload: {"rfid_uid":"${activeUid}","post_id":"POS_01"}`);
        setLcdLine1('MEMVALIDASI...  ');
        setLcdLine2(`UID: ${activeUid.slice(0, 11)}`);

        const res = await fetchApi('/iot/ronda/tap', {
          method: 'POST',
          body: JSON.stringify({ rfid_uid: activeUid, post_id: 'POS_01' }),
        });

        addLog('HTTP', `Response 200 OK: ${JSON.stringify(res.data || res.message)}`);
        setLcdLine1(res.data?.lcd_line1 || 'AKSES DITERIMA  ');
        setLcdLine2(res.data?.lcd_line2 || 'SILAKAN MASUK   ');

        if (res.data?.servo_angle === 90) {
          synth.playSuccess();
          synth.playServo();
          setServoAngle(90);
          addLog('SERVO', 'PWM pulse width set to 2.0ms -> Servo angle: 90 DEG (Palang Terbuka)');

          // Countdown 4 seconds
          const duration = (res.data?.open_duration_ms || 4000) / 1000;
          setServoCountdown(duration);
          let timeLeft = duration;
          const timer = setInterval(() => {
            timeLeft -= 1;
            setServoCountdown(timeLeft);
            if (timeLeft <= 0) {
              clearInterval(timer);
              setServoAngle(0);
              synth.playServo();
              addLog('SERVO', 'Countdown expired -> Servo angle: 0 DEG (Palang Menutup Kembali)');
              setLcdLine1('POS RONDA SIAGA ');
              setLcdLine2('TAP KARTU/E-KTP ');
            }
          }, 1000);
        }
      } else if (mode === 2 || mode === 3) {
        // MODE 2 & 3: BANK SAMPAH WEIGHING & AUTO-CREDIT
        const kategori = mode === 2 ? 'kaleng' : 'plastik';
        const ratePerKg = mode === 2 ? 5000 : 2000;
        const estRupiah = Math.round((weightGrams / 1000) * ratePerKg);

        addLog('HX711', `Measuring weight: ${weightGrams}g (${(weightGrams / 1000).toFixed(2)} kg) for category: ${kategori}`);
        addLog('HTTP', `POST /api/iot/bank-sampah/setor | Payload: {"rfid_uid":"${activeUid}","berat_gram":${weightGrams},"kategori":"${kategori}"}`);

        setLcdLine1('MENIMBANG...    ');
        setLcdLine2(`Rp ${estRupiah.toLocaleString('id-ID')}`);

        const res = await fetchApi('/iot/bank-sampah/setor', {
          method: 'POST',
          body: JSON.stringify({
            rfid_uid: activeUid,
            berat_gram: weightGrams,
            kategori,
          }),
        });

        addLog('HTTP', `Response 200 OK: ${JSON.stringify(res.data || res.message)}`);
        setLcdLine1(res.data?.lcd_line1 || 'SETOR BERHASIL  ');
        setLcdLine2(res.data?.lcd_line2 || `+RP ${res.data?.nominal?.toLocaleString('id-ID')}`);
        synth.playSuccess();

        setTimeout(() => {
          setLcdLine1(mode === 2 ? 'MD:BS-KALENG    >' : 'MD:BS-PLASTIK   >');
          setLcdLine2(`BERAT: ${(weightGrams / 1000).toFixed(2)} KG `);
        }, 3500);
      } else if (mode === 4) {
        // MODE 4: REG-KTP MANDIRI
        addLog('HTTP', `POST /api/iot/ktp/scan | Payload: {"rfid_uid":"${activeUid}","scanner_id":"KIOS_MODE_4"}`);
        setLcdLine1('MEMINDAI e-KTP..');
        setLcdLine2(`UID: ${activeUid.slice(0, 11)}`);

        const res = await fetchApi('/iot/ktp/scan', {
          method: 'POST',
          body: JSON.stringify({ rfid_uid: activeUid, scanner_id: 'KIOS_MODE_4' }),
        });

        addLog('HTTP', `Response 200 OK: ${JSON.stringify(res.data || res.message)}`);
        setLcdLine1(res.data?.lcd_line1 || 'KARTU TERDETEKSI');
        setLcdLine2(res.data?.lcd_line2 || 'BUKA WEB & TAUT ');
        synth.playSuccess();

        setTimeout(() => {
          setLcdLine1('MD:REG-KTP      >');
          setLcdLine2('TEMPELKAN KARTU ');
        }, 4000);
      }
    } catch (err: any) {
      synth.playError();
      addLog('HTTP', `ERROR: ${err.message}`);
      setLcdLine1('KARTU DITOLAK!  ');
      setLcdLine2('TIDAK TERDAFTAR ');
      setTimeout(() => {
        if (mode === 1) {
          setLcdLine1('POS RONDA SIAGA ');
          setLcdLine2('TAP KARTU/E-KTP ');
        } else if (mode === 2) {
          setLcdLine1('MD:BS-KALENG    >');
          setLcdLine2(`BERAT: ${(weightGrams / 1000).toFixed(2)} KG `);
        } else if (mode === 3) {
          setLcdLine1('MD:BS-PLASTIK   >');
          setLcdLine2(`BERAT: ${(weightGrams / 1000).toFixed(2)} KG `);
        } else {
          setLcdLine1('MD:REG-KTP      >');
          setLcdLine2('TEMPELKAN KARTU ');
        }
      }, 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  // Panic Button Handler
  const handleTriggerPanic = async () => {
    synth.playClick();
    addLog('PANIC', 'Hardware Panic Button (GPIO 27) pressed!');
    synth.startSiren();
    setSirenActive(true);
    setSirenReason('Tombol Panik Pos Ronda Ditekan!');
    setLcdLine1('!! PANIC ALARM !');
    setLcdLine2('POS RONDA SIAGA ');

    try {
      addLog('HTTP', 'POST /api/iot/panic-button | Payload: {"post_id":"POS_01","reason":"Panic button hardware simulator"}');
      const res = await fetchApi('/iot/panic-button', {
        method: 'POST',
        body: JSON.stringify({ post_id: 'POS_01', reason: 'Panic button hardware simulator' }),
      });
      addLog('HTTP', `Emergency Broadcast dispatched: ${res.message}`);
    } catch (err: any) {
      addLog('HTTP', `Panic error: ${err.message}`);
    }
  };

  const handleStopSiren = async () => {
    synth.stopSiren();
    setSirenActive(false);
    synth.playClick();
    addLog('PANIC', 'Siren deactivated manually by operator.');
    setLcdLine1('STATUS AMAN     ');
    setLcdLine2('POS RONDA SIAGA ');

    try {
      await fetchApi('/iot/sirine/toggle', {
        method: 'POST',
        body: JSON.stringify({ is_active: false, reason: 'Dinonaktifkan via simulator bench' }),
      });
    } catch {}

    setTimeout(() => {
      setLcdLine1('POS RONDA SIAGA ');
      setLcdLine2('TAP KARTU/E-KTP ');
    }, 2000);
  };

  // Sync weight changes with LCD in Mode 2 & 3
  const handleWeightChange = (newGrams: number) => {
    setWeightGrams(newGrams);
    if (mode === 2 || mode === 3) {
      setLcdLine2(`BERAT: ${(newGrams / 1000).toFixed(2)} KG `);
    }
  };

  // Copy logs helper
  const handleCopyLogs = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(serialLogs.join('\n'));
      synth.playClick();
      alert('Log Serial Monitor berhasil disalin ke clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Top Bar: Bench Status & Tools */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-tight text-white uppercase">
                ESP32 Hardware Bench Simulator
              </h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                AIO Firmware v2.2
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Virtual Twin Terkoneksi ke Real Database & Endpoint API SMART-WARGA
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* WiFi Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
            <Wifi className={`w-3.5 h-3.5 ${wifiConnected ? 'text-emerald-400 animate-pulse' : 'text-rose-400'}`} />
            <span className="font-mono text-[11px]">192.168.1.108</span>
          </div>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            className={`p-2 rounded-xl text-xs font-bold transition border ${
              soundEnabled 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20' 
                : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
            }`}
            title={soundEnabled ? 'Matikan Suara Buzzer/Audio' : 'Aktifkan Suara Buzzer/Audio'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Reboot Button */}
          <button
            type="button"
            onClick={rebootBoard}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition border border-slate-700 disabled:opacity-50"
            title="Reset ESP32 Microcontroller"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin text-amber-400' : ''}`} />
            <span>Reset ESP32</span>
          </button>

          {/* Open Main App in Split Tab */}
          <a
            href="/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-500/20 transition active:scale-95"
          >
            <span>Buka Dashboard Warga</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* Main Grid: Virtual Workbench (Left) + Serial Monitor (Right) */}
      <main className="flex-1 p-4 lg:p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 max-w-7xl mx-auto w-full">
        {/* Left Column (7 Cols): Virtual Hardware Workbench */}
        <div className="xl:col-span-7 space-y-6">
          
          {/* 1. LCD 16x2 Display with Retro Dot-Matrix Phosphor Glow */}
          <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  HD44780 16x2 I2C Display (0x27)
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                Contrast: 100% • I2C SDA:21 SCL:22
              </span>
            </div>

            {/* The LCD Screen Bezel */}
            <div className="bg-[#142318] p-4 rounded-2xl border-4 border-[#0b140d] shadow-inner font-mono tracking-widest select-none">
              <div className="bg-[#1e3d23] text-[#4af66d] p-4 rounded-xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] border border-[#2a5531]">
                <div className="text-xl sm:text-2xl font-bold tracking-[0.2em] font-mono h-8 flex items-center shadow-text">
                  {lcdLine1.padEnd(16, ' ').slice(0, 16)}
                </div>
                <div className="text-xl sm:text-2xl font-bold tracking-[0.2em] font-mono h-8 flex items-center shadow-text border-t border-[#2a5531]/40 mt-1 pt-1">
                  {lcdLine2.padEnd(16, ' ').slice(0, 16)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 text-[11px] text-slate-500 font-mono">
              <span>Backlight: GREEN LED ON</span>
              <span>Buffer: 32 Bytes • 4-bit PCF8574</span>
            </div>
          </div>

          {/* 2. ESP32 DevKit Board & Tactile Mode Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                  ESP32 DevKit & Saklar Mode (GPIO 4)
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Single ESP32 AIO Architecture
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              {/* Virtual ESP32 PCB Visual */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
                <div className="w-16 h-24 rounded-lg bg-emerald-950 border-2 border-emerald-700/60 p-2 flex flex-col justify-between relative shadow-lg">
                  {/* Metal Shield */}
                  <div className="w-full h-10 rounded bg-slate-400/80 border border-slate-300 flex items-center justify-center">
                    <span className="text-[7px] font-black text-slate-900 font-mono text-center leading-none">
                      ESP-WROOM-32
                    </span>
                  </div>
                  {/* LEDs */}
                  <div className="flex justify-between items-center px-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shadow-sm shadow-rose-500" title="Power LED (3.3V)"></span>
                    <span className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-blue-400 shadow-md shadow-blue-400 animate-ping' : 'bg-blue-500/40'}`} title="WiFi/Activity LED (GPIO 2)"></span>
                  </div>
                </div>

                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">ESP32 DevKit V1</span>
                    <span className="text-[9px] bg-blue-500/20 text-blue-400 font-mono px-1.5 py-0.5 rounded">240 MHz</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Mengontrol Servo, Loadcell HX711, RFID RC522, LCD 16x2, dan Tombol Panik dalam 1 Microcontroller.
                  </p>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 pt-1">
                    <span>TX/RX: Active</span>
                    <span>•</span>
                    <span>Free Heap: 184 KB</span>
                  </div>
                </div>
              </div>

              {/* Mode Selector Button */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">Mode Operasional Aktif:</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    mode === 1 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    mode === 2 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    mode === 3 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  }`}>
                    MODE {mode} OF 4
                  </span>
                </div>

                <div className="text-xs font-black text-white">
                  {mode === 1 && '🚪 Mode 1: Ronda & Palang Pintu Otomatis'}
                  {mode === 2 && '🥫 Mode 2: Timbangan Bank Sampah (Kaleng)'}
                  {mode === 3 && '🧴 Mode 3: Timbangan Bank Sampah (Plastik)'}
                  {mode === 4 && '🪪 Mode 4: Perekaman e-KTP Mandiri Warga'}
                </div>

                <button
                  type="button"
                  onClick={handleSwitchMode}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-700 shadow"
                >
                  <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tekan Saklar Mode (Ganti Mode)</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. RFID RC522 Card Tap Simulator Zone */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IdCard className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                  RC522 RFID Reader (SPI SS:5 SCK:18 MOSI:23 MISO:19)
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">13.56 MHz ISO 14443A</span>
            </div>

            {/* Quick Cards Selection */}
            <div>
              <p className="text-[11px] text-slate-400 mb-2">Pilih Kartu Fisik untuk Ditap ke Sensor:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { uid: 'RFID_WARGA_01', name: 'Budi (Warga RT 01)', role: 'Warga Terdaftar' },
                  { uid: 'RFID_WARGA_02', name: 'Siti (Warga RT 02)', role: 'Warga Terdaftar' },
                  { uid: 'RFID_WARGA_08', name: 'Halim Hafis (Warga RT 01)', role: 'Warga Terdaftar' },
                  { uid: 'RFID_SATPAM_01', name: 'Pak Joko (Satpam)', role: 'Jadwal Ronda' },
                  { uid: 'KTP_BARU_UNREGISTERED', name: 'e-KTP Belum Terdaftar', role: 'Kartu Baru' },
                ].map((card) => (
                  <button
                    key={card.uid}
                    type="button"
                    onClick={() => {
                      setSelectedUid(card.uid);
                      setCustomUid('');
                      synth.playClick();
                    }}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      selectedUid === card.uid && !customUid
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="text-xs font-bold text-white truncate">{card.name}</span>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1">
                      <span className="text-indigo-400">{card.uid.slice(0, 10)}...</span>
                      <span>{card.role}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom UID Input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={customUid}
                onChange={(e) => setCustomUid(e.target.value.toUpperCase())}
                placeholder="Atau ketik UID Kartu Sembarang (e.g. 04A1B2C3)..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleTapRfid}
                disabled={isProcessing}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-black shadow-lg shadow-indigo-500/20 transition active:scale-95 flex items-center gap-2 disabled:opacity-50"
              >
                <Radio className={`w-3.5 h-3.5 ${isProcessing ? 'animate-ping' : ''}`} />
                <span>TAP KARTU</span>
              </button>
            </div>
          </div>

          {/* 4. Actuators: Servo Barrier & HX711 Loadcell Scale */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* SG90 Servo Barrier Gate */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DoorOpen className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Palang Servo SG90 (GPIO 13)
                  </h3>
                </div>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  servoAngle === 90 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse' 
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {servoAngle === 90 ? `OPEN 90° (${servoCountdown}s)` : 'CLOSED 0°'}
                </span>
              </div>

              {/* Visual Barrier Graphic */}
              <div className="h-28 bg-slate-950 rounded-2xl border border-slate-800 p-4 relative flex items-end justify-center overflow-hidden">
                {/* Pos Satpam Pillar */}
                <div className="w-8 h-16 bg-slate-700 rounded-t-lg relative z-10 border border-slate-600">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-900 absolute top-2 left-2.5"></div>
                </div>

                {/* Rotating Boom Barrier Arm */}
                <div 
                  className="absolute bottom-10 left-1/2 w-40 h-3 bg-gradient-to-r from-red-600 via-white to-red-600 rounded-r-md border border-slate-900 origin-left transition-transform duration-700 ease-out z-20 shadow-lg"
                  style={{ transform: `rotate(${servoAngle === 90 ? -90 : 0}deg)` }}
                ></div>

                {/* Ground */}
                <div className="absolute bottom-0 left-0 right-0 h-4 bg-slate-800/60 border-t border-slate-700"></div>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Durasi Buka Otomatis: 4 Detik</span>
                <span className="font-mono">{servoAngle === 90 ? 'Pos Terbuka' : 'Palang Siaga'}</span>
              </div>
            </div>

            {/* HX711 Loadcell Digital Scale */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Loadcell HX711 (DT:32 SCK:33)
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {(weightGrams / 1000).toFixed(2)} KG
                </span>
              </div>

              {/* Weight Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Atur Beban Timbangan:</span>
                  <span className="font-mono font-bold text-white">{weightGrams} gram</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="15000"
                  step="100"
                  value={weightGrams}
                  onChange={(e) => handleWeightChange(Number(e.target.value))}
                  className="w-full accent-amber-500 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { label: '500g', g: 500 },
                  { label: '1.5kg', g: 1500 },
                  { label: '2.5kg (Kaleng)', g: 2500 },
                  { label: '5.0kg (Plastik)', g: 5000 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleWeightChange(preset.g)}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300 transition"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <p className="text-[10px] text-slate-500">
                Pilih Mode 2 (Kaleng Rp5rb/kg) atau Mode 3 (Plastik Rp2rb/kg) lalu klik <strong>TAP KARTU</strong> untuk auto-kredit dompet warga.
              </p>
            </div>
          </div>

          {/* 5. Big Red Panic Button & Siren Alarm Indicator */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
            {sirenActive && (
              <div className="absolute inset-0 bg-rose-600/10 animate-pulse pointer-events-none"></div>
            )}

            <div className="flex items-center gap-4">
              {/* Panic Button */}
              <button
                type="button"
                onClick={handleTriggerPanic}
                className="w-16 h-16 rounded-full bg-gradient-to-b from-rose-500 to-red-700 hover:from-rose-400 hover:to-red-600 active:scale-90 text-white font-black text-[11px] shadow-2xl shadow-rose-600/50 flex flex-col items-center justify-center border-4 border-rose-950 transition transform shrink-0"
                title="Tekan Tombol Panik Darurat Pos (GPIO 27)"
              >
                <ShieldAlert className="w-5 h-5 mb-0.5" />
                <span>PANIC</span>
              </button>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black uppercase text-white tracking-wider">
                    Tombol Panik & Sirine Balai Warga (GPIO 27 & Relay GPIO 2)
                  </h4>
                  {sirenActive && (
                    <span className="text-[10px] font-bold bg-rose-500 text-white px-2 py-0.5 rounded-full animate-bounce">
                      ALARM AKTIF
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                  {sirenActive 
                    ? sirenReason || 'Alarm darurat aktif di seluruh lingkungan warga!' 
                    : 'Tekan tombol panik merah di atas untuk memicu simulasi sinyal darurat pos satpam.'}
                </p>
              </div>
            </div>

            {sirenActive && (
              <button
                type="button"
                onClick={handleStopSiren}
                className="px-4 py-2 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-black shadow-lg transition active:scale-95 shrink-0"
              >
                Matikan Sirine
              </button>
            )}
          </div>
        </div>

        {/* Right Column (5 Cols): Live Serial Monitor 115200 Baud */}
        <div className="xl:col-span-5 flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden min-h-[580px]">
          {/* Terminal Header */}
          <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-slate-300">
                SERIAL MONITOR (115200 BAUD)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLogs}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs transition"
                title="Salin Seluruh Log"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setSerialLogs([])}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs transition"
                title="Bersihkan Log"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Terminal Output Body */}
          <div className="flex-1 bg-black/95 p-4 font-mono text-[11px] leading-relaxed text-emerald-400/90 overflow-y-auto max-h-[620px] space-y-1">
            {serialLogs.map((log, idx) => {
              const isError = log.includes('ERROR') || log.includes('DITOLAK');
              const isHttp = log.includes('[HTTP ]');
              const isRfid = log.includes('[RFID ]');
              const isSys = log.includes('[SYS  ]');

              return (
                <div 
                  key={idx} 
                  className={`break-all ${
                    isError ? 'text-rose-400 font-bold' :
                    isHttp ? 'text-cyan-300' :
                    isRfid ? 'text-indigo-300' :
                    isSys ? 'text-amber-300' :
                    'text-emerald-400'
                  }`}
                >
                  {log}
                </div>
              );
            })}
            <div ref={logEndRef} />
          </div>

          {/* Terminal Footer */}
          <div className="bg-slate-950 px-4 py-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded accent-emerald-500"
              />
              <span>Auto-scroll terminal</span>
            </label>
            <span>Lines: {serialLogs.length}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
