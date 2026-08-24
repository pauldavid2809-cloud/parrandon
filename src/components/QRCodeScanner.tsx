'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, Sparkles, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Volume2, VolumeX, Keyboard, Play } from 'lucide-react';
import { ScanResult } from '@/types';

interface QRCodeScannerProps {
  onScanSuccess: (code: string) => Promise<ScanResult>;
  onStatsUpdate?: () => void;
}

export default function QRCodeScanner({ onScanSuccess, onStatsUpdate }: QRCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const qrRegionId = "qr-reader-region";

  const playBeep = (isSuccess: boolean) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (isSuccess) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.setValueAtTime(200, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      }
    } catch (e) {
      console.error("Audio error:", e);
    }
  };

  const resumeScanner = () => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }

    try {
      if (scannerRef.current && isScanning) {
        scannerRef.current.resume();
      }
    } catch (e) {
      console.warn("Could not resume scanner:", e);
    }

    setIsPaused(false);
    setProcessing(false);
  };

  const handleProcessCode = async (rawCode: string) => {
    const code = rawCode.trim().toUpperCase();
    if (!code || processing || isPaused) return;

    // Prevent immediate rapid duplicate triggers of the exact same code
    const now = Date.now();
    if (lastScannedRef.current.code === code && (now - lastScannedRef.current.time) < 8000) {
      return;
    }

    lastScannedRef.current = { code, time: now };
    setProcessing(true);

    // Pause camera stream immediately so it doesn't keep capturing frames
    try {
      if (scannerRef.current && isScanning) {
        scannerRef.current.pause(true);
        setIsPaused(true);
      }
    } catch (e) {
      console.warn("Could not pause scanner:", e);
    }

    try {
      const result = await onScanSuccess(code);
      setLastResult(result);
      playBeep(result.success);
      if (onStatsUpdate) onStatsUpdate();
    } catch (err) {
      console.error("Scan error:", err);
      setLastResult({
        success: false,
        status: 'not_found',
        message: 'Error al conectar con el servidor de validación.'
      });
      playBeep(false);
    } finally {
      setProcessing(false);

      // Auto-resume camera after 4 seconds
      resumeTimerRef.current = setTimeout(() => {
        resumeScanner();
      }, 4000);
    }
  };

  const startScanner = async () => {
    setCameraError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(qrRegionId);
      }

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleProcessCode(decodedText);
        },
        () => {
          // ignore scan frame errors
        }
      );
      setIsScanning(true);
      setIsPaused(false);
    } catch (err: unknown) {
      console.error("Failed to start camera:", err);
      setCameraError("No se pudo acceder a la cámara. Revisa los permisos o ingresa el código manualmente.");
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }

    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
        setIsPaused(false);
      } catch (err) {
        console.error("Failed to stop camera:", err);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleProcessCode(manualCode.trim());
    setManualCode('');
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center">
      {/* Sound & Manual entry controls */}
      <div className="w-full flex items-center justify-between gap-2 mb-3">
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white"
        >
          {soundEnabled ? <Volume2 className="h-4 w-4 text-emerald-400" /> : <VolumeX className="h-4 w-4 text-slate-500" />}
          <span>{soundEnabled ? 'Sonido Activado' : 'Silencio'}</span>
        </button>

        <button
          onClick={() => setShowManualInput(!showManualInput)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-amber-300 hover:text-amber-200"
        >
          <Keyboard className="h-4 w-4" />
          <span>{showManualInput ? 'Ocultar Teclado' : 'Ingreso Manual'}</span>
        </button>
      </div>

      {/* Manual Input Form */}
      {showManualInput && (
        <form onSubmit={handleManualSubmit} className="w-full mb-4 flex gap-2">
          <input
            type="text"
            placeholder="Ej: PARR-A1-S01-22Q8"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            className="flex-1 rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-xs text-white uppercase focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            disabled={processing || !manualCode.trim()}
            className="rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-xs font-bold text-slate-950 disabled:opacity-50"
          >
            Validar
          </button>
        </form>
      )}

      {/* Camera Viewport */}
      <div className="w-full relative rounded-3xl overflow-hidden border-2 border-emerald-500/40 bg-slate-950 shadow-2xl min-h-[300px] flex flex-col items-center justify-center">
        <div id={qrRegionId} className="w-full h-full" />

        {!isScanning && (
          <div className="p-8 text-center flex flex-col items-center">
            <div className="h-16 w-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <Camera className="h-8 w-8" />
            </div>
            <h4 className="text-base font-bold text-white mb-1">Escáner de Puerta Listo</h4>
            <p className="text-xs text-slate-400 mb-6 max-w-xs">
              Apunta la cámara al código QR de la entrada (impresa o en el teléfono del asistente).
            </p>
            <button
              onClick={startScanner}
              className="flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-950/50 transition-all hover:scale-105"
            >
              <Camera className="h-5 w-5" />
              <span>Activar Cámara y Escanear</span>
            </button>
          </div>
        )}

        {isScanning && (
          <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-2 z-10 px-4">
            {isPaused ? (
              <button
                onClick={resumeScanner}
                className="flex items-center gap-1.5 rounded-full bg-amber-500 hover:bg-amber-400 px-5 py-2 text-xs font-black text-slate-950 shadow-xl animate-bounce"
              >
                <Play className="h-3.5 w-3.5 fill-slate-950" />
                <span>Escanear Siguiente Entrada</span>
              </button>
            ) : (
              <button
                onClick={stopScanner}
                className="flex items-center gap-1.5 rounded-full bg-slate-950/80 border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-900 backdrop-blur-md"
              >
                <CameraOff className="h-3.5 w-3.5 text-rose-400" />
                <span>Pausar Cámara</span>
              </button>
            )}
          </div>
        )}

        {processing && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
            <RefreshCw className="h-8 w-8 text-amber-400 animate-spin mb-2" />
            <span className="text-xs font-bold text-white">Validando entrada en base de datos...</span>
          </div>
        )}
      </div>

      {cameraError && (
        <div className="mt-3 w-full rounded-xl bg-rose-950/50 border border-rose-500/30 p-3 text-xs text-rose-300">
          {cameraError}
        </div>
      )}

      {/* Result Card Popup / Feedback */}
      {lastResult && (
        <div
          className={`mt-4 w-full rounded-2xl p-5 border text-left shadow-2xl transition-all animate-fadeIn ${
            lastResult.status === 'valid'
              ? 'bg-emerald-950/95 border-emerald-500 text-emerald-100 ring-2 ring-emerald-500/50'
              : lastResult.status === 'already_used'
              ? 'bg-rose-950/95 border-rose-500 text-rose-100 ring-2 ring-rose-500/50'
              : 'bg-amber-950/95 border-amber-500 text-amber-100 ring-2 ring-amber-500/50'
          }`}
        >
          <div className="flex items-start gap-3">
            {lastResult.status === 'valid' ? (
              <CheckCircle2 className="h-7 w-7 text-emerald-400 shrink-0 mt-0.5" />
            ) : lastResult.status === 'already_used' ? (
              <XCircle className="h-7 w-7 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
            ) : (
              <AlertTriangle className="h-7 w-7 text-amber-400 shrink-0 mt-0.5" />
            )}

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-black tracking-wider">
                  {lastResult.status === 'valid'
                    ? '🟢 ACCESO AUTORIZADO'
                    : lastResult.status === 'already_used'
                    ? '🔴 ¡ALERTA! ENTRADA YA UTILIZADA'
                    : '⚠️ NO VÁLIDO'}
                </span>
                <span className="text-[10px] font-mono opacity-70">
                  {new Date().toLocaleTimeString('es-VE')}
                </span>
              </div>

              <p className="text-sm font-semibold mt-1 leading-snug">{lastResult.message}</p>

              {lastResult.ticket && (
                <div className="mt-3 pt-3 border-t border-white/20 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="opacity-70 text-[10px] block uppercase font-bold">Asistente:</span>
                    <strong className="text-white text-sm block truncate">{lastResult.ticket.attendeeName}</strong>
                  </div>
                  <div>
                    <span className="opacity-70 text-[10px] block uppercase font-bold">Ubicación / Pase:</span>
                    <strong className="text-amber-300 text-xs block">
                      Mesa {lastResult.ticket.tableId} • Silla #{lastResult.ticket.seatNumber}
                    </strong>
                    <span className="text-[10px] opacity-75 font-mono">{lastResult.ticket.ticketCode}</span>
                  </div>
                  
                  {lastResult.status === 'valid' && (
                    <div className="col-span-2 mt-1 bg-black/40 p-2.5 rounded-xl flex items-center justify-between border border-emerald-500/30">
                      <span>🍽️ <strong>1 Plato Navideño Completo</strong></span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md font-bold">
                        Habilitado para Cocina
                      </span>
                    </div>
                  )}

                  {lastResult.status === 'already_used' && (
                    <div className="col-span-2 mt-1 bg-rose-900/50 p-2.5 rounded-xl border border-rose-500/40 text-[11px] text-rose-200">
                      ⚠️ Esta persona ya ingresó anteriormente. Si salió temporalmente, verifica su identidad con el nombre registrado arriba.
                    </div>
                  )}
                </div>
              )}

              {/* Quick Resume Button in result */}
              {isScanning && (
                <div className="mt-4 pt-2 flex justify-end">
                  <button
                    onClick={resumeScanner}
                    className="flex items-center gap-1 text-xs font-bold text-white bg-slate-800/80 hover:bg-slate-700 px-3.5 py-1.5 rounded-xl transition-colors border border-slate-700"
                  >
                    <span>Listo, continuar escaneo →</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
