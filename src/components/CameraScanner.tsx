'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Camera, CameraOff } from 'lucide-react';
import { cn } from '@/lib/utils';

type ScannerState = 'idle' | 'starting' | 'running' | 'error';

// Lector de QR con la cámara trasera. Entrega el texto leído una sola vez por código
// (ignora el mismo QR durante unos segundos para no repetir).
export default function CameraScanner({
  onResult,
  autoStart = false,
  paused = false,
  tone = 'paper',
  className,
}: {
  onResult: (text: string) => void;
  autoStart?: boolean;
  paused?: boolean;
  tone?: 'paper' | 'noche';
  className?: string;
}) {
  const regionId = `qr-${useId().replace(/:/g, '')}`;
  const scannerRef = useRef<import('html5-qrcode').Html5Qrcode | null>(null);
  const lastRef = useRef<{ text: string; at: number }>({ text: '', at: 0 });
  const pausedRef = useRef(paused);
  const onResultRef = useRef(onResult);
  const [state, setState] = useState<ScannerState>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  const stop = useCallback(async () => {
    const s = scannerRef.current;
    scannerRef.current = null;
    if (s) {
      try {
        if (s.isScanning) await s.stop();
        s.clear();
      } catch {
        // la cámara ya estaba detenida
      }
    }
    setState('idle');
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setState('starting');
    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
      const scanner = new Html5Qrcode(regionId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 12,
          qrbox: (w, h) => {
            const size = Math.floor(Math.min(w, h) * 0.72);
            return { width: size, height: size };
          },
          aspectRatio: 1,
        },
        (text) => {
          if (pausedRef.current) return;
          const now = Date.now();
          if (text === lastRef.current.text && now - lastRef.current.at < 4000) return;
          lastRef.current = { text, at: now };
          if (navigator.vibrate) navigator.vibrate(60);
          onResultRef.current(text);
        },
        () => {}
      );
      setState('running');
    } catch (err) {
      scannerRef.current = null;
      const message = err instanceof Error ? err.message : String(err);
      setError(
        /permission|denied|notallowed/i.test(message)
          ? 'El teléfono no dio permiso para usar la cámara. Actívalo en los ajustes del navegador y vuelve a intentar.'
          : /notfound|no camera|requested device/i.test(message)
            ? 'No encontramos una cámara en este dispositivo.'
            : 'No se pudo encender la cámara. Intenta de nuevo o escribe el código a mano.'
      );
      setState('error');
    }
  }, [regionId]);

  useEffect(() => {
    const t = autoStart ? setTimeout(start, 0) : undefined;
    return () => {
      if (t) clearTimeout(t);
      stop();
    };
    // Solo al montar/desmontar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dark = tone === 'noche';
  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'relative aspect-square w-full overflow-hidden rounded-2xl',
          dark ? 'bg-noche-2' : 'bg-ink'
        )}
      >
        <div id={regionId} className="absolute inset-0 [&_video]:h-full! [&_video]:w-full! [&_video]:object-cover" />
        {state === 'running' && (
          <div aria-hidden className="pointer-events-none absolute inset-[14%]">
            <span className="absolute left-0 top-0 h-8 w-8 rounded-tl-xl border-l-4 border-t-4 border-oro" />
            <span className="absolute right-0 top-0 h-8 w-8 rounded-tr-xl border-r-4 border-t-4 border-oro" />
            <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-xl border-b-4 border-l-4 border-oro" />
            <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-xl border-b-4 border-r-4 border-oro" />
          </div>
        )}
        {state !== 'running' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center text-paper">
            {state === 'error' ? (
              <>
                <CameraOff className="h-10 w-10 text-oro" aria-hidden />
                <p className="max-w-xs">{error}</p>
              </>
            ) : (
              <Camera className="h-10 w-10 text-oro" aria-hidden />
            )}
            <button
              type="button"
              onClick={start}
              disabled={state === 'starting'}
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-paper px-5 font-bold text-ink hover:bg-card disabled:opacity-60"
            >
              {state === 'starting' ? 'Encendiendo cámara…' : state === 'error' ? 'Intentar de nuevo' : 'Encender cámara'}
            </button>
          </div>
        )}
      </div>
      {state === 'running' && (
        <button
          type="button"
          onClick={stop}
          className={cn('mt-2 text-sm font-bold underline underline-offset-4', dark ? 'text-paper/70' : 'text-ink-2')}
        >
          Apagar cámara
        </button>
      )}
    </div>
  );
}
