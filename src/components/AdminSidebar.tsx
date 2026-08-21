'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ReceiptText, 
  Users, 
  UtensilsCrossed, 
  PlusCircle, 
  FileSpreadsheet, 
  Settings, 
  QrCode, 
  ChefHat,
  LogOut,
  ArrowLeft
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface AdminSidebarProps {
  onLogout?: () => void;
}

export default function AdminSidebar({ onLogout }: AdminSidebarProps) {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        if (data.success && data.stats) {
          setPendingCount(data.stats.pendingOrdersCount || 0);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    {
      name: 'Resumen General',
      href: '/admin',
      icon: LayoutDashboard,
      badge: null
    },
    {
      name: 'Comprobantes por Verificar',
      href: '/admin/comprobantes',
      icon: ReceiptText,
      badge: pendingCount > 0 ? pendingCount : null,
      badgeColor: 'bg-rose-500 text-white'
    },
    {
      name: 'Lista de Asistentes',
      href: '/admin/asistentes',
      icon: Users,
      badge: null
    },
    {
      name: 'Estación de Cocina (Platos)',
      href: '/cocina',
      icon: ChefHat,
      badge: 'Cocina',
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
    },
    {
      name: 'Control de Platos en Vivo',
      href: '/admin/asistencia',
      icon: UtensilsCrossed,
      badge: 'En vivo',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
    },
    {
      name: 'Nueva Venta Manual',
      href: '/admin/nueva-venta',
      icon: PlusCircle,
      badge: null
    },
    {
      name: 'Reportes y Cierre (Excel/PDF)',
      href: '/admin/reportes',
      icon: FileSpreadsheet,
      badge: null
    },
    {
      name: 'Configuración & Tasas',
      href: '/admin/configuracion',
      icon: Settings,
      badge: null
    }
  ];

  return (
    <aside className="w-full lg:w-64 bg-slate-900/95 border-r border-slate-800 p-4 shrink-0 flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 px-3 py-2 mb-6 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <div className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-amber-300">Panel de Anabella</span>
            <span className="text-[10px] text-slate-400">Admin Parrandón 2026</span>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-slate-950 text-amber-400' : item.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer shortcuts & Logout */}
      <div className="mt-8 pt-4 border-t border-slate-800 space-y-2">
        <Link
          href="/administracion-interna"
          className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Administración Interna</span>
        </Link>

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-rose-950/40 border border-rose-800/60 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-900/60 hover:text-white transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        )}
      </div>
    </aside>
  );
}
