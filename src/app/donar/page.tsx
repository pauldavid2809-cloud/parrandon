import type { Metadata } from 'next';
import DonarForm from './DonarForm';

export const metadata: Metadata = { title: 'Donar · Parrandón Navideño 2026' };

export default function DonarPage() {
  return (
    <div className="paper-grain flex-1">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-4 py-10 sm:px-6 md:grid-cols-[1fr_28rem] md:py-16">
        <div>
          <h1 className="font-display text-4xl leading-tight sm:text-5xl">Ayuda a formar a los futuros sacerdotes</h1>
          <p className="mt-4 max-w-[52ch] text-lg text-ink-2">
            Si no puedes ir al Parrandón, o quieres dar un poco más, tu donación va directo a la formación de los
            seminaristas del Seminario Mayor Santo Tomás de Aquino.
          </p>
          <p className="mt-4 max-w-[52ch] text-lg text-ink-2">
            Una donación no incluye entrada ni puesto en una mesa. Para asistir, consigue tu entrada de papel con un
            seminarista o en tu parroquia.
          </p>
        </div>
        <DonarForm />
      </div>
    </div>
  );
}
