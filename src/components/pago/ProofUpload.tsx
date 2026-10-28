'use client';

import { useRef, useState } from 'react';
import { ImagePlus, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

// Achica la foto antes de subirla: los capture del teléfono pesan mucho con datos móviles.
async function shrink(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/') || file.size < 700_000) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.82));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

export default function ProofUpload({
  value,
  onChange,
  tag,
  error,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  tag: string;
  error?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setLocalError(null);
    if (file.size > 12 * 1024 * 1024) {
      setLocalError('La imagen es muy pesada. Toma un capture de pantalla en vez de una foto.');
      return;
    }
    setUploading(true);
    setPreview(URL.createObjectURL(file));
    try {
      const blob = await shrink(file);
      const form = new FormData();
      form.append('file', new File([blob], blob === file ? file.name : 'capture.jpg', { type: blob.type || file.type }));
      form.append('orderId', tag);
      const res = await fetch('/api/upload-proof', { method: 'POST', body: form });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      onChange(data.url);
    } catch (err) {
      onChange(null);
      setPreview(null);
      setLocalError(err instanceof Error && err.message ? err.message : 'No se pudo subir el capture. Intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const shown = preview || (value && !value.startsWith('data:') ? value : value);
  const message = localError || error;

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label="Capture del pago"
        onChange={(e) => pick(e.target.files?.[0])}
      />
      {shown ? (
        <div className="flex items-center gap-4 rounded-xl border-2 border-line bg-card p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shown} alt="Capture del pago" className="h-20 w-16 rounded-md object-cover" />
          <div className="min-w-0 flex-1">
            <p className="font-bold">{uploading ? 'Subiendo capture…' : value ? 'Capture listo' : 'Capture'}</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-ink-2 underline underline-offset-4"
            >
              <RefreshCw className="h-4 w-4" aria-hidden /> Cambiar imagen
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed bg-card px-4 py-6 text-center transition-colors hover:border-ink-3',
            message ? 'border-rojo' : 'border-line'
          )}
        >
          <ImagePlus className="h-8 w-8 text-rojo" aria-hidden />
          <span className="font-bold">Subir capture del pago</span>
          <span className="text-sm text-ink-3">Foto o captura de pantalla de la transferencia</span>
        </button>
      )}
      {message && (
        <p role="alert" className="mt-1.5 text-sm font-bold text-rojo">
          {message}
        </p>
      )}
    </div>
  );
}
