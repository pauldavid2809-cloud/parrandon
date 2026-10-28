import type { Metadata } from 'next';
import LiveMesas from '@/components/landing/LiveMesas';

export const metadata: Metadata = { title: 'Mesas en vivo · Parrandón Navideño 2026' };

export default function MesasPage() {
  return (
    <div className="flex-1 bg-paper-2">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-16">
        <LiveMesas
          intro={
            <>
              <h1 className="font-display text-4xl leading-tight sm:text-5xl">Las mesas, en vivo</h1>
              <p className="mt-3 max-w-[52ch] text-lg text-ink-2">
                50 mesas de 10 puestos a lo largo del bulevar. Para escoger la tuya, activa tu entrada con el QR.
              </p>
            </>
          }
        />
      </div>
    </div>
  );
}
