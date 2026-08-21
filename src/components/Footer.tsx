import { Sparkles, MapPin, Calendar, Heart } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-800 bg-slate-950/90 text-slate-400 no-print">
      <div className="container mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Columna 1 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-base font-bold text-white">Parrandón Navideño</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Evento benéfico pro-fondos para la formación académica, espiritual y humana de los futuros sacerdotes del Seminario Mayor Diocesano Santo Tomás de Aquino.
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
              <Calendar className="h-3.5 w-3.5" />
              <span>Sábado, 12 de Diciembre de 2026</span>
            </div>
          </div>

          {/* Columna 2 */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Ubicación y Contacto</h4>
            <div className="space-y-2 text-xs text-slate-400">
              <p className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Instalaciones del Seminario Mayor Santo Tomás de Aquino, Av. Universidad, Paramillo, San Cristóbal, Edo. Táchira.</span>
              </p>
              <p className="pt-2">
                <strong className="text-slate-300">Administración:</strong> Anabella y Comité Organizador
              </p>
              <p>
                <strong className="text-slate-300">Atención WhatsApp:</strong> +58 414 700-1122
              </p>
            </div>
          </div>

          {/* Columna 3 */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Acceso Rápido</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/comprar" className="hover:text-amber-400 transition-colors">
                  🎟️ Adquirir Entradas Digitales
                </Link>
              </li>
              <li>
                <Link href="/escanear" className="hover:text-emerald-400 transition-colors">
                  📷 Escáner de Validación en Puerta
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-rose-400 transition-colors">
                  🔒 Panel de Control (Anabella)
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
          <p>© 2026 Seminario Mayor Santo Tomás de Aquino. Todos los derechos reservados.</p>
          <p className="flex items-center gap-1">
            Diseñado con <Heart className="h-3 w-3 text-rose-500 fill-rose-500" /> para nuestra comunidad.
          </p>
        </div>
      </div>
    </footer>
  );
}
