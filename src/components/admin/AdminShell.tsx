'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardCheck, Gauge, HandCoins, LogOut, Settings, Table2, Ticket, Users } from 'lucide-react';
import { logout } from '@/components/staff/StaffGate';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/admin', label: 'Resumen', icon: Gauge },
  { href: '/admin/verificaciones', label: 'Verificar pagos', icon: ClipboardCheck },
  { href: '/admin/entradas', label: 'Entradas', icon: Ticket },
  { href: '/admin/mesas', label: 'Mesas', icon: Table2 },
  { href: '/admin/vendedores', label: 'Lotes y vendedores', icon: Users },
  { href: '/admin/donaciones', label: 'Donaciones', icon: HandCoins },
  { href: '/admin/configuracion', label: 'Configuración', icon: Settings },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/admin';
  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));

  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[15.5rem_1fr]">
      <aside className="bg-verde text-paper lg:sticky lg:top-0 lg:h-screen">
        <div className="flex items-center justify-between gap-3 px-4 py-4 lg:block lg:px-5 lg:py-6">
          <Link href="/" className="block">
            <span className="block font-display text-xl leading-none">Parrandón 2026</span>
            <span className="text-sm text-paper/75">Administración</span>
          </Link>
          <button
            type="button"
            onClick={logout}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-bold text-paper/80 hover:bg-verde-2 lg:hidden"
          >
            <LogOut className="h-4 w-4" aria-hidden /> Salir
          </button>
        </div>
        <nav aria-label="Administración" className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3 lg:pb-0">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? 'page' : undefined}
              className={cn(
                'flex h-11 shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 font-bold transition-colors',
                isActive(href) ? 'bg-paper text-verde-2' : 'text-paper/85 hover:bg-verde-2 hover:text-paper'
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          onClick={logout}
          className="absolute bottom-5 left-3 hidden h-11 items-center gap-2 rounded-xl px-3 font-bold text-paper/80 hover:bg-verde-2 lg:inline-flex"
        >
          <LogOut className="h-5 w-5" aria-hidden /> Cerrar sesión
        </button>
      </aside>
      <div className="min-w-0 px-4 py-6 sm:px-8 lg:py-10">{children}</div>
    </div>
  );
}
