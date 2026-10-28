import Image from 'next/image';
import Link from 'next/link';
import TicketStub from '@/components/TicketStub';
import ActivarForm from '@/components/landing/ActivarForm';
import LiveMesas, { LiveResumen } from '@/components/landing/LiveMesas';
import { SITE_URL } from '@/lib/site';

const PASOS = [
  {
    titulo: 'Consigue tu entrada de papel',
    texto:
      'Pídela a un seminarista, al Padre Jorge o en tu parroquia. Cuesta $20 e incluye el plato navideño. Cada entrada trae su número y su propio QR.',
  },
  {
    titulo: 'Escanéala y reporta tu pago',
    texto:
      'Abre la cámara del teléfono y apunta al QR. Escribe tu nombre, apellido y cédula, y reporta tu pago por Zelle o Pago Móvil con la referencia y el capture. La organización lo verifica.',
  },
  {
    titulo: 'Escoge tu mesa',
    texto:
      'Son 50 mesas de 10 puestos a lo largo del bulevar. Escoge la tuya en el croquis; si vienen en grupo, cada entrada escoge la misma mesa. Puedes cambiarla hasta el día antes.',
  },
  {
    titulo: 'Esa noche, muestra tu entrada',
    texto:
      'En la puerta escanean tu QR y te indican tu mesa. La cocina despacha los platos mesa por mesa a medida que van llegando.',
  },
];

export default function Home() {
  return (
    <>
      {/* Campo rojo: el evento y la entrada de papel */}
      <section className="relative z-10 overflow-x-clip bg-rojo text-paper">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-12 pt-8 sm:px-6 md:grid-cols-[1.1fr_1fr] md:gap-12 md:pb-16 md:pt-14">
          <div className="flex flex-col">
            <h1 className="font-display text-[min(3.4rem,14vw)] leading-[0.95] tracking-[-0.02em] sm:text-[min(4.5rem,11vw)] lg:text-[min(5.6rem,7vw)]">
              Parrandón Navideño
            </h1>
            <p className="mt-5 text-lg font-bold sm:text-xl">
              Sábado 12 de diciembre · 6:00 p. m.
              <br />
              Bulevar del Seminario Mayor Santo Tomás de Aquino, Maracaibo
            </p>
            <p className="mt-4 max-w-md text-lg text-paper/90">
              Tu entrada es de papel y trae su propio QR. Escanéala, reporta tu pago y escoge tu mesa mientras haya
              puestos.
            </p>
            <ActivarForm className="mt-8 max-w-lg" />
            <LiveResumen className="mt-6 text-paper/90" />
          </div>
          <div className="relative flex items-center justify-center md:items-end md:justify-end">
            <div
              className="ticket-arrive relative z-20 w-full max-w-[26rem] md:-mb-36 md:max-w-none"
              style={{ ['--tilt' as string]: '-3deg' }}
            >
              <TicketStub
                number="000"
                qrValue={`${SITE_URL}/activar`}
                qrLabel="QR de muestra: abre la página para activar tu entrada"
                perforationBg="var(--color-card)"
                footer={<p className="text-right text-xs font-bold text-ink-3">Muestra</p>}
              />
            </div>
          </div>
        </div>
        <div aria-hidden className="scallop-edge absolute inset-x-0 top-full h-4 bg-rojo" />
      </section>

      {/* Paso a paso */}
      <section id="como-funciona" className="paper-grain scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6 md:pb-24 md:pt-28">
          <h2 className="max-w-2xl font-display text-4xl leading-tight sm:text-5xl">De tu mano a tu mesa</h2>
          <ol className="mt-12 grid gap-x-10 gap-y-12 md:grid-cols-2">
            {PASOS.map((paso, i) => (
              <li key={paso.titulo} className="grid grid-cols-[3.25rem_1fr] gap-4">
                <span
                  aria-hidden
                  className="grid h-13 w-13 place-items-center rounded-full border-2 border-rojo font-display text-2xl text-rojo"
                >
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-display text-2xl leading-snug">{paso.titulo}</h3>
                  <p className="mt-2 max-w-[60ch] text-ink-2">{paso.texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Croquis en vivo */}
      <section id="mesas" className="scroll-mt-20 bg-paper-2">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
          <LiveMesas
            intro={
              <>
                <h2 className="font-display text-4xl leading-tight sm:text-5xl">Las mesas, en vivo</h2>
                <p className="mt-3 max-w-[52ch] text-lg text-ink-2">
                  La tarima de gaitas queda al inicio del bulevar, frente al Sector A. El bazar está junto al Sector D
                  y el Sector E llega hasta el giro. Son 50 mesas de 10 puestos.
                </p>
              </>
            }
          />
        </div>
      </section>

      {/* La noche */}
      <section className="paper-grain">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
          <h2 className="max-w-2xl font-display text-4xl leading-tight sm:text-5xl">Una noche de gaitas en familia</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-[1.5fr_1fr] md:grid-rows-2">
            <figure className="relative min-h-72 overflow-hidden rounded-2xl md:row-span-2 md:min-h-[30rem]">
              <Image
                src="/images/gaitas-en-vivo.jpg"
                alt="Conjunto de gaitas tocando en tarima frente al público"
                fill
                sizes="(min-width: 768px) 60vw, 100vw"
                className="object-cover"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-noche/85 to-transparent p-5 pt-16 text-paper">
                <span className="font-display text-2xl">Gaitas en vivo</span>
                <span className="block text-paper/85">Villancicos y gaitas zulianas toda la noche desde la tarima.</span>
              </figcaption>
            </figure>
            <figure className="relative min-h-60 overflow-hidden rounded-2xl">
              <Image
                src="/images/plato-navideno.jpg"
                alt="Plato navideño con hallaca, pernil, pan de jamón y ensalada de gallina"
                fill
                sizes="(min-width: 768px) 40vw, 100vw"
                className="object-cover"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-noche/85 to-transparent p-5 pt-14 text-paper">
                <span className="font-display text-xl">Plato navideño completo</span>
                <span className="block text-paper/85">Incluido en tu entrada, servido en tu mesa.</span>
              </figcaption>
            </figure>
            <figure className="relative min-h-60 overflow-hidden rounded-2xl">
              <Image
                src="/images/bazar-navideno.jpg"
                alt="Puesto de bazar navideño con artesanía y dulces criollos"
                fill
                sizes="(min-width: 768px) 40vw, 100vw"
                className="object-cover"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-noche/85 to-transparent p-5 pt-14 text-paper">
                <span className="font-display text-xl">Bazar navideño y rifas</span>
                <span className="block text-paper/85">Junto al Sector D.</span>
              </figcaption>
            </figure>
          </div>
          <p className="mt-3 text-sm text-ink-3">Fotos de referencia.</p>
        </div>
      </section>

      {/* Dónde conseguirla */}
      <section className="bg-verde-soft">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1fr_1fr] md:py-20">
          <div>
            <h2 className="font-display text-4xl leading-tight sm:text-5xl">¿Todavía no tienes tu entrada?</h2>
            <p className="mt-4 max-w-md text-lg text-ink-2">
              Todas las entradas son de papel. No se venden por internet: así cada una tiene dueño y número.
            </p>
          </div>
          <ul className="space-y-5 text-lg">
            <li>
              <p className="font-bold">Con los seminaristas</p>
              <p className="text-ink-2">Cada seminarista tiene sus entradas. Pídele la tuya al que conozcas.</p>
            </li>
            <li>
              <p className="font-bold">Con el Padre Jorge y en las parroquias</p>
              <p className="text-ink-2">Algunas parroquias tienen su lote de entradas. Pregunta en la tuya.</p>
            </li>
            <li>
              <p className="font-bold">En la taquilla, esa misma noche</p>
              <p className="text-ink-2">Mientras queden entradas. Aceptan Pago Móvil, Zelle y dólares en efectivo.</p>
            </li>
            <li className="flex flex-wrap gap-3 pt-2">
              <a
                href="https://wa.me/584120308674?text=Hola%2C%20quiero%20una%20entrada%20para%20el%20Parrand%C3%B3n%20Navide%C3%B1o%202026"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center rounded-xl bg-verde px-5 font-bold text-paper hover:bg-verde-2"
              >
                Escribir por WhatsApp
              </a>
              <Link
                href="/donar"
                className="inline-flex h-12 items-center rounded-xl border-2 border-ink/80 px-5 font-bold text-ink hover:bg-ink hover:text-paper"
              >
                Prefiero donar
              </Link>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
