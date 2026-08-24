'use client';

import Link from 'next/link';
import { 
  ShieldCheck, 
  Church, 
  ChefHat, 
  QrCode, 
  FileSpreadsheet, 
  ArrowLeft, 
  Lock, 
  Sparkles, 
  Utensils, 
  Users, 
  ExternalLink,
  BookOpen
} from 'lucide-react';

export default function AdministracionInternaPage() {
  const internalTools = [
    {
      title: 'Panel Administrativo General',
      desc: 'Gestión de pagos, aprobación de comprobantes, métricas financieras, lista de asistentes y tasas.',
      href: '/admin',
      icon: ShieldCheck,
      badge: 'Protegido (#Seminario31)',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      gradient: 'from-amber-500/20 via-slate-900 to-slate-950',
      borderColor: 'border-amber-500/40 hover:border-amber-400'
    },
    {
      title: 'Portal de Seminaristas (Parroquias)',
      desc: 'Venta rápida de entradas en misas dominicales, asignación automática de asientos y envío directo a WhatsApp.',
      href: '/seminaristas',
      icon: Church,
      badge: 'Venta en Puerta de Iglesia',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      gradient: 'from-emerald-950/40 via-slate-900 to-slate-950',
      borderColor: 'border-emerald-500/40 hover:border-emerald-400'
    },
    {
      title: 'Estación de Cocina y Platos',
      desc: 'Pantalla de despacho para cocineros. Marcador gigante de platos servidos y pendientes en sala.',
      href: '/cocina',
      icon: ChefHat,
      badge: 'Control de Cocina',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      gradient: 'from-blue-950/40 via-slate-900 to-slate-950',
      borderColor: 'border-blue-500/40 hover:border-blue-400'
    },
    {
      title: 'Escáner de Puerta con Cámara',
      desc: 'Lector de códigos QR para el personal de recepción y control de acceso al bulevar.',
      href: '/escanear',
      icon: QrCode,
      badge: 'Acceso en Puerta',
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
      gradient: 'from-teal-950/40 via-slate-900 to-slate-950',
      borderColor: 'border-teal-500/40 hover:border-teal-400'
    },
    {
      title: 'Catálogo de las 500 Entradas con QR',
      desc: 'Visor completo de las 500 entradas del bulevar organizadas por sector (A a E) para descargar e imprimir.',
      href: '/entradas_500_qr/index.html',
      icon: FileSpreadsheet,
      badge: '50 Mesas x 10 Sillas',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      gradient: 'from-sky-950/40 via-slate-900 to-slate-950',
      borderColor: 'border-sky-500/40 hover:border-sky-400'
    }
  ];

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 bg-slate-950 text-slate-100">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-14 shrink-0 filter drop-shadow-[0_4px_12px_rgba(245,158,11,0.3)]">
              <img
                src="/images/seminario-logo.png"
                alt="Escudo Seminario Santo Tomás"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-1"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Volver a la Portada del Evento</span>
              </Link>
              <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
                <Lock className="h-6 w-6 text-amber-400" />
                Centro Operativo del Seminario
              </h1>
              <p className="text-xs text-sky-300 font-medium">
                Seminario Mayor Santo Tomás de Aquino • Sacerdos Lux
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 px-4 py-2.5 text-right shadow-md">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Parrandón Navideño</span>
            <span className="text-xs font-black text-amber-400">Edición 2026 • 50 Mesas</span>
          </div>
        </div>

        {/* Grid of Internal Portals */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {internalTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className={`group rounded-3xl border bg-gradient-to-b ${tool.gradient} p-6 flex flex-col justify-between shadow-xl transition-all hover:scale-[1.02] ${tool.borderColor}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${tool.badgeColor}`}>
                      {tool.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {tool.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-amber-400 group-hover:text-amber-300">
                  <span>Acceder al Módulo</span>
                  <ExternalLink className="h-4 w-4" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Security Notice */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 text-xs text-slate-400 flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-amber-400 shrink-0" />
          <span>
            Este enlace es de uso exclusivo para los seminaristas, personal de cocina, taquilla y el equipo administrativo del Seminario.
          </span>
        </div>

      </div>
    </div>
  );
}
