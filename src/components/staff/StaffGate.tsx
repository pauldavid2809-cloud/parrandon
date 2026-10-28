'use client';

import { useAutoLoad } from '@/lib/useAutoLoad';
import { useCallback, useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Button, Notice, Spinner } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { SessionRole } from '@/lib/entradas/types';

const TITLES: Record<SessionRole, string> = {
  admin: 'Administración',
  puerta: 'Puerta',
  cocina: 'Cocina',
  taquilla: 'Taquilla',
};

export async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.reload();
}

// Pide el PIN del área (o la contraseña de administración) antes de mostrar la pantalla.
export default function StaffGate({
  role,
  tone = 'paper',
  children,
}: {
  role: SessionRole;
  tone?: 'paper' | 'noche';
  children: ReactNode;
}) {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [secret, setSecret] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const check = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const data = await res.json();
      const roles: SessionRole[] = data.roles || [];
      setAllowed(roles.includes('admin') || roles.includes(role));
    } catch {
      setAllowed(false);
    }
  }, [role]);

  useAutoLoad(check);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, secret }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setAllowed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo entrar.');
      setSecret('');
    } finally {
      setBusy(false);
    }
  };

  const dark = tone === 'noche';
  if (allowed === null) {
    return (
      <div className={cn('flex min-h-screen items-center justify-center', dark ? 'bg-noche text-paper' : 'bg-paper')}>
        <Spinner label="Verificando acceso…" className={dark ? 'text-paper/80' : undefined} />
      </div>
    );
  }
  if (allowed) return <>{children}</>;

  const isAdmin = role === 'admin';
  return (
    <div className={cn('flex min-h-screen items-center justify-center px-4 py-10', dark ? 'bg-noche' : 'paper-grain')}>
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-[var(--shadow-ticket)]">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-rojo text-paper">
          <Lock className="h-6 w-6" aria-hidden />
        </span>
        <h1 className="mt-4 font-display text-3xl">{TITLES[role]}</h1>
        <p className="mt-1 text-ink-2">
          {isAdmin ? 'Escribe la contraseña de administración.' : `Escribe el PIN de ${TITLES[role].toLowerCase()}.`}
        </p>
        <label htmlFor="secreto" className="sr-only">
          {isAdmin ? 'Contraseña' : 'PIN'}
        </label>
        <input
          id="secreto"
          type="password"
          inputMode={isAdmin ? 'text' : 'numeric'}
          autoComplete={isAdmin ? 'current-password' : 'one-time-code'}
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          autoFocus
          className={cn(
            'mt-5 h-14 w-full rounded-xl border-2 border-line bg-paper px-4 text-ink focus:border-ink focus:outline-none',
            !isAdmin && 'tabular text-center text-2xl tracking-[0.5em]'
          )}
        />
        {error && (
          <Notice tone="error" className="mt-3">
            {error}
          </Notice>
        )}
        <Button type="submit" size="lg" loading={busy} disabled={!secret} className="mt-4 w-full">
          Entrar
        </Button>
        <Link href="/equipo" className="mt-4 block text-center text-sm font-bold text-ink-2 underline underline-offset-4">
          Otras áreas del equipo
        </Link>
      </form>
    </div>
  );
}
