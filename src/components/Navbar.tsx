'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const STAFF_PREFIXES = ['/admin', '/puerta', '/cocina', '/taquilla'];

export function isStaffPath(pathname: string) {
  return STAFF_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default function Navbar() {
  const pathname = usePathname() || '/';
  if (isStaffPath(pathname)) return null;
  const onRed = pathname === '/';

  const link = (href: string, label: string) => (
    <Link
      href={href}
      className={cn(
        'rounded-lg px-3 py-2 font-bold transition-colors',
        onRed ? 'text-paper/90 hover:bg-rojo-2 hover:text-paper' : 'text-ink-2 hover:bg-paper-2 hover:text-ink',
        pathname === href && (onRed ? 'text-paper' : 'text-ink')
      )}
    >
      {label}
    </Link>
  );

  return (
    <header className={cn('no-print relative z-20', onRed ? 'bg-rojo text-paper' : 'bg-paper text-ink border-b border-line')}>
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:h-[4.5rem] sm:px-6" aria-label="Principal">
        <Link href="/" className="mr-auto flex min-w-0 items-center gap-2.5">
          <span className={cn('grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full', onRed ? 'bg-paper' : 'bg-card ring-1 ring-line')}>
            <Image src="/images/seminario-logo.png" alt="" width={36} height={36} className="h-9 w-9 object-contain" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block whitespace-nowrap font-display text-lg">
              Parrandón<span className="hidden min-[400px]:inline"> 2026</span>
            </span>
            <span className={cn('hidden text-xs font-bold sm:block', onRed ? 'text-paper/80' : 'text-ink-3')}>
              Seminario Santo Tomás de Aquino
            </span>
          </span>
        </Link>
        <div className="hidden items-center sm:flex">
          {link('/mesas', 'Mesas')}
          {link('/#como-funciona', 'Cómo funciona')}
          {link('/donar', 'Donar')}
        </div>
        <Link
          href="/mesas"
          className={cn('rounded-lg px-3 py-2 font-bold sm:hidden', onRed ? 'text-paper' : 'text-ink-2')}
        >
          Mesas
        </Link>
        <Link
          href="/activar"
          className={cn(
            'inline-flex h-11 shrink-0 items-center whitespace-nowrap rounded-xl px-4 font-bold transition-colors',
            onRed ? 'bg-paper text-rojo hover:bg-card' : 'bg-rojo text-paper hover:bg-rojo-2'
          )}
        >
          Activar<span className="hidden min-[400px]:inline">&nbsp;entrada</span>
        </Link>
      </nav>
    </header>
  );
}
