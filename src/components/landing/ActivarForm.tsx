'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

const CODE_RE = /P\d{3,4}-[2-9A-HJ-NP-Z]{8}/i;

// Campo para escribir el código impreso debajo del QR.
export default function ActivarForm({
  tone = 'red',
  showCameraLink = true,
  className,
}: {
  tone?: 'red' | 'paper';
  showCameraLink?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const match = value.trim().toUpperCase().replace(/\s+/g, '').match(CODE_RE);
    if (!match) {
      setError('Escribe el código tal como aparece bajo el QR, por ejemplo P123-ABCD2345.');
      return;
    }
    router.push(`/e/${match[0]}`);
  };

  const onRed = tone === 'red';
  return (
    <form onSubmit={submit} className={cn('w-full', className)} noValidate>
      <label htmlFor="codigo-entrada" className={cn('block font-bold', onRed ? 'text-paper' : 'text-ink')}>
        Código de tu entrada
      </label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          id="codigo-entrada"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          placeholder="P123-ABCD2345"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'codigo-error' : undefined}
          className="tabular h-14 min-w-0 flex-1 rounded-xl border-2 border-transparent bg-card px-4 text-lg tracking-wide text-ink placeholder:text-ink-3 focus:border-oro focus:outline-none"
        />
        <button
          type="submit"
          className={cn(
            'h-14 shrink-0 rounded-xl px-6 text-lg font-bold transition-colors',
            onRed ? 'bg-ink text-paper hover:bg-noche' : 'bg-rojo text-paper hover:bg-rojo-2'
          )}
        >
          Activar
        </button>
      </div>
      {error && (
        <p id="codigo-error" role="alert" className={cn('mt-2 font-bold', onRed ? 'text-paper' : 'text-rojo')}>
          {error}
        </p>
      )}
      {showCameraLink && (
      <Link
        href="/activar?camara=1"
        className={cn(
          'mt-3 inline-flex items-center gap-2 font-bold underline decoration-2 underline-offset-4',
          onRed ? 'text-paper decoration-paper/50 hover:decoration-paper' : 'text-ink decoration-ink/30 hover:decoration-ink'
        )}
      >
        <Camera className="h-5 w-5" aria-hidden />
        Escanear el QR con la cámara
      </Link>
      )}
    </form>
  );
}
