'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isStaffPath } from './Navbar';

export default function Footer() {
  const pathname = usePathname() || '/';
  if (isStaffPath(pathname)) return null;

  return (
    <footer className="no-print bg-verde text-paper" style={{ ['--perforation-bg' as string]: 'var(--color-paper)' }}>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-2xl">Parrandón Navideño 2026</p>
          <p className="mt-2 max-w-sm text-paper/85">
            Sábado 12 de diciembre, 6:00 p. m. Bulevar del Seminario Mayor Santo Tomás de Aquino, Maracaibo.
          </p>
          <p className="mt-4 text-sm text-paper/75">
            Todo lo recaudado apoya la formación de los seminaristas.
          </p>
        </div>
        <div>
          <p className="font-bold">Tu entrada</p>
          <ul className="mt-3 space-y-2 text-paper/85">
            <li>
              <Link className="hover:text-paper hover:underline" href="/activar">
                Activar mi entrada
              </Link>
            </li>
            <li>
              <Link className="hover:text-paper hover:underline" href="/mesas">
                Ver mesas disponibles
              </Link>
            </li>
            <li>
              <Link className="hover:text-paper hover:underline" href="/donar">
                Hacer una donación
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-bold">¿Dudas?</p>
          <ul className="mt-3 space-y-2 text-paper/85">
            <li>
              <a
                className="hover:text-paper hover:underline"
                href="https://wa.me/584120308674?text=Hola%2C%20tengo%20una%20consulta%20sobre%20el%20Parrand%C3%B3n%20Navide%C3%B1o%202026"
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp 0412-0308674
              </a>
            </li>
            <li>
              <Link className="hover:text-paper hover:underline" href="/vendedores">
                Soy vendedor
              </Link>
            </li>
            <li>
              <Link className="hover:text-paper hover:underline" href="/equipo">
                Equipo de la noche
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
