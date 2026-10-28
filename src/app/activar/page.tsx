import type { Metadata } from 'next';
import ActivarForm from '@/components/landing/ActivarForm';
import ActivarScanner from './ActivarScanner';

export const metadata: Metadata = { title: 'Activar mi entrada · Parrandón Navideño 2026' };

export default async function ActivarPage({ searchParams }: { searchParams: Promise<{ camara?: string }> }) {
  const { camara } = await searchParams;
  return (
    <div className="paper-grain flex-1">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-4 py-10 sm:px-6 md:grid-cols-[1fr_24rem] md:py-16">
        <div>
          <h1 className="font-display text-4xl leading-tight sm:text-5xl">Activa tu entrada</h1>
          <p className="mt-3 max-w-[52ch] text-lg text-ink-2">
            Lo más fácil: abre la cámara normal de tu teléfono y apunta al QR de tu entrada. Se abre sola tu página para
            reportar el pago y escoger la mesa.
          </p>
          <ol className="mt-8 space-y-4 text-lg">
            <li className="flex gap-3">
              <span className="font-display text-2xl text-rojo">1.</span>
              <span>Reporta tu pago por Zelle o Pago Móvil y sube el capture.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-display text-2xl text-rojo">2.</span>
              <span>Escoge tu mesa en el croquis. Queda apartada mientras se verifica el pago.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-display text-2xl text-rojo">3.</span>
              <span>Guarda tu entrada de papel: esa noche la escanean en la puerta.</span>
            </li>
          </ol>
          <div className="mt-10 rounded-2xl bg-paper-2 p-5">
            <p className="font-bold">¿No te abre con la cámara?</p>
            <p className="mt-1 text-ink-2">Escribe el código que aparece debajo del QR.</p>
            <ActivarForm tone="paper" showCameraLink={false} className="mt-4" />
          </div>
        </div>
        <div>
          <p className="mb-3 font-bold">O escanéalo aquí mismo</p>
          <ActivarScanner autoStart={camara === '1'} />
        </div>
      </div>
    </div>
  );
}
