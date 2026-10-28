import type { Metadata } from 'next';
import Link from 'next/link';
import { ChefHat, DoorOpen, ScanLine, Settings, Ticket } from 'lucide-react';

export const metadata: Metadata = { title: 'Equipo · Parrandón 2026', robots: { index: false, follow: false } };

const AREAS = [
  {
    href: '/puerta',
    title: 'Puerta',
    text: 'Escanea las entradas, deja pasar y activa en el momento las que lleguen sin activar.',
    icon: DoorOpen,
    access: 'PIN de puerta',
  },
  {
    href: '/cocina',
    title: 'Cocina',
    text: 'Ve en vivo quién va llegando y despacha los platos mesa por mesa.',
    icon: ChefHat,
    access: 'PIN de cocina',
  },
  {
    href: '/taquilla',
    title: 'Taquilla',
    text: 'Vende las entradas del lote de taquilla esa noche y asigna la mesa.',
    icon: Ticket,
    access: 'PIN de taquilla',
  },
  {
    href: '/vendedores',
    title: 'Vendedores',
    text: 'Seminaristas, Padre Jorge y parroquias: registra tus ventas y mira tu lote.',
    icon: ScanLine,
    access: 'Sin clave',
  },
  {
    href: '/admin',
    title: 'Administración',
    text: 'Verifica pagos, asigna lotes, mueve mesas, genera e imprime las entradas.',
    icon: Settings,
    access: 'Contraseña',
  },
];

export default function EquipoPage() {
  return (
    <div className="paper-grain flex-1">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
        <h1 className="font-display text-4xl sm:text-5xl">Equipo del Parrandón</h1>
        <p className="mt-3 max-w-[56ch] text-lg text-ink-2">
          Cada área tiene su propio PIN. Pídelo a administración y entra desde el teléfono o la tableta que vas a usar esa
          noche.
        </p>
        <ul className="mt-10 divide-y divide-line overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-soft)]">
          {AREAS.map(({ href, title, text, icon: Icon, access }) => (
            <li key={href}>
              <Link href={href} className="flex items-center gap-4 px-5 py-5 transition-colors hover:bg-paper-2">
                <Icon className="h-7 w-7 shrink-0 text-rojo" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-2xl">{title}</p>
                  <p className="text-ink-2">{text}</p>
                </div>
                <span className="hidden shrink-0 text-sm font-bold text-ink-3 sm:block">{access}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
