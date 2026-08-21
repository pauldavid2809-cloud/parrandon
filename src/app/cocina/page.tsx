'use client';

import { useState, useEffect } from 'react';
import { 
  ChefHat, 
  Utensils, 
  CheckCircle2, 
  Clock, 
  Search, 
  RefreshCw, 
  ArrowLeft, 
  Sparkles, 
  Users, 
  QrCode, 
  AlertTriangle,
  RotateCcw,
  Check
} from 'lucide-react';
import Link from 'next/link';

interface TableMealData {
  tableId: string;
  sector: 'A' | 'B' | 'C' | 'D' | 'E';
  number: number;
  totalSeats: number;
  occupiedSeats: number;
  servedPlatesCount: number;
  isMealServed: boolean;
  mealServedAt?: string;
  tickets: Array<{
    seatNumber: number;
    attendeeName: string;
    ticketCode: string;
    isUsed: boolean;
    mealServed: boolean;
    mealServedAt?: string;
  }>;
}

export default function CocinaPage() {
  const [tables, setTables] = useState<TableMealData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'SERVED' | 'A' | 'B' | 'C' | 'D' | 'E'>('ALL');
  const [stats, setStats] = useState({
    totalTables: 50,
    servedTablesCount: 0,
    pendingTablesCount: 50,
    totalPlatesServed: 0,
    totalPlatesConfirmed: 500
  });

  const [togglingTableId, setTogglingTableId] = useState<string | null>(null);
  const [recentMessage, setRecentMessage] = useState<string | null>(null);

  const fetchTablesMeal = async () => {
    try {
      const res = await fetch('/api/tables/meal');
      const data = await res.json();
      if (data.success && data.tables) {
        setTables(data.tables);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTablesMeal();
    const interval = setInterval(fetchTablesMeal, 8000); // Live sync every 8 seconds
    return () => clearInterval(interval);
  }, []);

  const handleToggleTableMeal = async (tableId: string, currentServed: boolean) => {
    setTogglingTableId(tableId);
    setRecentMessage(null);

    try {
      const res = await fetch('/api/tables/meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId,
          served: !currentServed
        })
      });

      const data = await res.json();
      if (data.success) {
        setRecentMessage(data.message);
        // Optimistic update
        setTables(prev => prev.map(t => {
          if (t.tableId === tableId) {
            return {
              ...t,
              isMealServed: !currentServed,
              mealServedAt: !currentServed ? new Date().toISOString() : undefined,
              servedPlatesCount: !currentServed ? t.occupiedSeats : 0
            };
          }
          return t;
        }));

        // Refresh stats
        fetchTablesMeal();
      }
    } catch (err) {
      console.error(err);
      alert('Error al actualizar el estado de la mesa.');
    } finally {
      setTogglingTableId(null);
    }
  };

  const sectorNames: Record<string, string> = {
    A: 'Sector A • Frente a Tarima',
    B: 'Sector B • Zona Central',
    C: 'Sector C • Zona Central',
    D: 'Sector D • Zona Bazar',
    E: 'Sector E • Zona Lateral'
  };

  const filteredTables = tables.filter(t => {
    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toUpperCase();
      const matchId = t.tableId.toUpperCase().includes(q);
      const matchDiner = t.tickets.some(tk => tk.attendeeName.toUpperCase().includes(q));
      if (!matchId && !matchDiner) return false;
    }

    // Filter tabs
    if (activeFilter === 'PENDING') return !t.isMealServed;
    if (activeFilter === 'SERVED') return t.isMealServed;
    if (['A', 'B', 'C', 'D', 'E'].includes(activeFilter)) return t.sector === activeFilter;
    return true;
  });

  const percentServed = Math.round((stats.servedTablesCount / 50) * 100) || 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <Link
              href="/administracion-interna"
              className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Volver a Administración Interna"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
                <ChefHat className="h-8 w-8 text-amber-400" />
                Estación de Cocina • Despacho por Mesas
              </h1>
              <p className="text-xs text-sky-300 mt-0.5">
                Control y marcado de platos navideños servidos mesa por mesa (50 Mesas • 500 Comensales).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchTablesMeal}
              className="flex items-center gap-1.5 rounded-2xl bg-slate-900 border border-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
              <span>Sincronizar en Vivo</span>
            </button>
          </div>
        </div>

        {/* Live Notification Popup */}
        {recentMessage && (
          <div className="rounded-2xl bg-emerald-950/90 border-2 border-emerald-500 p-3.5 text-xs text-emerald-200 font-bold flex items-center justify-between shadow-xl animate-fadeIn">
            <span>{recentMessage}</span>
            <button onClick={() => setRecentMessage(null)} className="text-slate-400 hover:text-white ml-2">✕</button>
          </div>
        )}

        {/* BIG KPI CARDS FOR KITCHEN */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Card 1: Mesas Servidas */}
          <div className="rounded-3xl border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 p-6 shadow-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                Mesas Servidas / Despachadas
              </span>
              <div className="text-4xl font-black text-white">
                {stats.servedTablesCount} <span className="text-lg text-emerald-400/80 font-bold">/ 50 Mesas</span>
              </div>
              <span className="text-xs text-slate-400 mt-1 block">
                {stats.totalPlatesServed} platos entregados ({percentServed}%)
              </span>
            </div>
            <div className="h-16 w-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="h-8 w-8" />
            </div>
          </div>

          {/* Card 2: Mesas Pendientes */}
          <div className="rounded-3xl border-2 border-amber-500/50 bg-gradient-to-br from-amber-950/50 via-slate-900 to-slate-950 p-6 shadow-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-1">
                Mesas Pendientes por Servir
              </span>
              <div className="text-4xl font-black text-amber-300">
                {stats.pendingTablesCount} <span className="text-lg text-slate-400 font-bold">Mesas</span>
              </div>
              <span className="text-xs text-slate-400 mt-1 block">
                {500 - stats.totalPlatesServed} platos en espera
              </span>
            </div>
            <div className="h-16 w-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Clock className="h-8 w-8" />
            </div>
          </div>

          {/* Card 3: Progreso General */}
          <div className="rounded-3xl border-2 border-blue-500/40 bg-gradient-to-br from-blue-950/50 via-slate-900 to-slate-950 p-6 shadow-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400 block mb-1">
                Capacidad del Bulevar
              </span>
              <div className="text-4xl font-black text-white">
                500 <span className="text-lg text-sky-400 font-bold">Comensales</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 mt-2 border border-slate-700">
                <div className="bg-gradient-to-r from-emerald-500 to-amber-400 h-2.5 rounded-full transition-all duration-500" style={{ width: `${percentServed}%` }} />
              </div>
            </div>
            <div className="h-16 w-16 rounded-2xl bg-blue-500/20 text-sky-400 flex items-center justify-center border border-blue-500/30">
              <Users className="h-8 w-8" />
            </div>
          </div>

        </div>

        {/* SEARCH AND FILTER BAR */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por Mesa (ej: A1, C5, E10) o nombre de comensal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl bg-slate-950 border border-slate-700 pl-11 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-xs text-slate-400 hover:text-white px-3 py-2"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeFilter === 'ALL'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Todas las Mesas (50)
            </button>
            <button
              onClick={() => setActiveFilter('PENDING')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeFilter === 'PENDING'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              ⏳ Pendientes ({stats.pendingTablesCount})
            </button>
            <button
              onClick={() => setActiveFilter('SERVED')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeFilter === 'SERVED'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              ✅ Servidas ({stats.servedTablesCount})
            </button>
            {['A', 'B', 'C', 'D', 'E'].map(sec => (
              <button
                key={sec}
                onClick={() => setActiveFilter(sec as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeFilter === sec
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Sector {sec} (10 Mesas)
              </button>
            ))}
          </div>
        </div>

        {/* 50 TABLES BANQUET GRID (1-TOUCH MEAL DISPATCH) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Mostrando <strong>{filteredTables.length}</strong> mesas:</span>
            <span>Toca el botón de cada mesa para despachar sus 10 platos de una vez.</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTables.map((table) => {
              const isServed = table.isMealServed;
              const isToggling = togglingTableId === table.tableId;

              return (
                <div
                  key={table.tableId}
                  className={`rounded-3xl border-2 p-5 flex flex-col justify-between transition-all shadow-xl ${
                    isServed
                      ? 'border-emerald-500/60 bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-950'
                      : 'border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 hover:border-amber-500/50'
                  }`}
                >
                  <div>
                    {/* Header with Sector and ID */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 bg-sky-950/60 px-2.5 py-0.5 rounded-full border border-sky-500/30">
                        Sector {table.sector}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                          isServed
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                        }`}
                      >
                        {isServed ? '✓ Servida' : '⏳ Pendiente'}
                      </span>
                    </div>

                    {/* Table Title and Capacity */}
                    <div className="flex items-baseline justify-between mb-2">
                      <h3 className="text-2xl font-black text-white">
                        Mesa {table.tableId}
                      </h3>
                      <span className="text-xs font-semibold text-slate-400">
                        10 Platos
                      </span>
                    </div>

                    {/* Delivery Time if served */}
                    {isServed && table.mealServedAt && (
                      <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mb-3">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Despachada a las {new Date(table.mealServedAt).toLocaleTimeString('es-VE')}</span>
                      </div>
                    )}

                    {/* Attendees Snippet */}
                    <div className="rounded-2xl bg-slate-950/80 p-3 border border-slate-800/80 text-xs space-y-1 mb-4">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Comensales registrados:</span>
                      {table.tickets.length > 0 ? (
                        <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                          {table.tickets.map(t => (
                            <div key={t.ticketCode} className="flex items-center justify-between text-[11px] text-slate-300">
                              <span className="truncate">Silla #{t.seatNumber}: {t.attendeeName}</span>
                              <span className="font-mono text-[9px] text-amber-300/80 shrink-0 ml-1">{t.ticketCode.slice(-4)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic block">10 comensales asignados</span>
                      )}
                    </div>
                  </div>

                  {/* 1-TOUCH BIG ACTION BUTTON */}
                  <div>
                    {isServed ? (
                      <button
                        type="button"
                        disabled={isToggling}
                        onClick={() => handleToggleTableMeal(table.tableId, true)}
                        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-900 border border-slate-700 hover:bg-rose-950/60 hover:border-rose-700 px-4 py-3 text-xs font-bold text-slate-300 hover:text-rose-300 transition-all"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>{isToggling ? 'Actualizando...' : 'Deshacer (Marcar Pendiente)'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isToggling}
                        onClick={() => handleToggleTableMeal(table.tableId, false)}
                        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 px-4 py-3.5 text-xs font-black text-white transition-all shadow-lg shadow-emerald-950/50 hover:scale-[1.02]"
                      >
                        <Utensils className="h-4 w-4" />
                        <span>{isToggling ? 'Despachando...' : `Despachar Mesa ${table.tableId} (10 Platos)`}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
