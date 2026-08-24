import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, MapPin, Calendar, Heart, Lock, Ticket, HelpCircle, Phone, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/[0.08] bg-slate-950 text-slate-400 no-print relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-48 bg-gradient-to-t from-blue-900/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none" />

      <div className="container mx-auto max-w-7xl px-4 py-12 sm:py-16 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12 mb-12">
          
          {/* Columna 1: Branding e Institución */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-10 shrink-0 filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.25)]">
                <Image
                  src="/images/seminario-logo.png"
                  alt="Escudo Oficial Seminario Mayor Santo Tomás de Aquino"
                  fill
                  sizes="40px"
                  className="object-contain"
                />
              </div>
              <div>
                <span className="text-lg font-black text-white block leading-tight">
                  Parrandón Navideño <span className="text-amber-400">2026</span>
                </span>
                <span className="text-xs text-sky-300 font-medium">
                  Seminario Mayor Santo Tomás de Aquino • Sacerdos Lux
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              Evento benéfico pro-fondos para la formación académica, espiritual, pastoral y humana de los futuros sacerdotes de la Arquidiócesis de Maracaibo.
            </p>

            <div className="inline-flex items-center gap-2 text-xs text-amber-300 font-bold bg-slate-900/80 px-3.5 py-1.5 rounded-full border border-amber-500/20">
              <Calendar className="h-4 w-4 text-amber-400" />
              <span>Sábado, 12 de Diciembre de 2026 • 6:00 PM</span>
            </div>
          </div>

          {/* Columna 2: Ubicación & Contacto */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Lugar & Contacto</h4>
            <div className="space-y-2 text-xs text-slate-400">
              <p className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                <span>Bulevar del Seminario Santo Tomás de Aquino, Maracaibo, Zulia.</span>
              </p>
              <p className="flex items-center gap-2 pt-1">
                <Phone className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="text-slate-300 font-bold">+58 414 700-1122</span>
              </p>
            </div>
          </div>

          {/* Columna 3: Enlaces Rápidos */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Accesos Rápidos</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/comprar" className="hover:text-amber-400 transition-colors flex items-center gap-1.5 group">
                  <Ticket className="h-3.5 w-3.5 text-amber-400" />
                  <span>Comprar Entradas en el Bulevar</span>
                  <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link href="/#consultar" className="hover:text-amber-400 transition-colors flex items-center gap-1.5 group">
                  <Sparkles className="h-3.5 w-3.5 text-sky-400" />
                  <span>Consultar Estado de mi Compra</span>
                  <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <a
                  href="https://wa.me/584147001122?text=Hola,%20tengo%20una%20consulta%20sobre%20el%20Parrandón%20Navideño"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 text-emerald-400/90 font-medium"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>Atención Oficial por WhatsApp</span>
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright & discrete internal access */}
        <div className="border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 Seminario Mayor Santo Tomás de Aquino. Todos los derechos reservados.</p>
          
          <div className="flex items-center gap-4">
            <Link
              href="/administracion-interna"
              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-300 text-[11px] font-bold transition-colors"
              title="Acceso exclusivo para el personal operativo del Seminario"
            >
              <Lock className="h-3 w-3" />
              <span>Administración Interna</span>
            </Link>
            <span className="flex items-center gap-1 text-slate-400">
              Hecho con <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" /> para nuestra comunidad.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
