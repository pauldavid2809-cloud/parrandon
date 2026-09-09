'use client';

import { useState, useEffect } from 'react';
import { EventStats, Order } from '@/types';
import { exportOrdersToExcel, exportExecutiveReportPdf, export500SeatsToExcel } from '@/lib/export';
import { 
  FileSpreadsheet, 
  FileText, 
  Download, 
  DollarSign, 
  Users, 
  Utensils, 
  CheckCircle2, 
  Sparkles,
  RefreshCw,
  Church,
  QrCode
} from 'lucide-react';

import { SEMINARISTAS_DIRECTORY } from '@/lib/seminaristas';

export default function ReportesPage() {
  const [stats, setStats] = useState<EventStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading500, setDownloading500] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, ordersRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/orders')
      ]);
      const statsData = await statsRes.json();
      const ordersData = await ordersRes.json();
      if (statsData.success) setStats(statsData.stats);
      if (ordersData.success) setOrders(ordersData.orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDownloadExcel = () => {
    exportOrdersToExcel(orders, `Parrandon_Ventas_Cierre_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleDownloadPdf = () => {
    if (!stats) return;
    exportExecutiveReportPdf(stats, orders);
  };

  const handleDownload500Seats = async () => {
    setDownloading500(true);
    try {
      const res = await fetch('/api/tickets/export-all');
      const data = await res.json();
      if (data.success && data.seats) {
        export500SeatsToExcel(data.seats, `Parrandon_Base_Completa_500_QRs_Bulevar.xlsx`);
      }
    } catch (err) {
      console.error(err);
      alert("Error al descargar la base de 500 asientos.");
    } finally {
      setDownloading500(false);
    }
  };

  // Compute stats per seminarista
  const seminaristaSales = SEMINARISTAS_DIRECTORY.map(sem => {
    const semOrders = orders.filter(o => 
      o.sellerName?.toLowerCase().includes(sem.name.toLowerCase()) || 
      o.notes?.toLowerCase().includes(sem.name.toLowerCase())
    );
    const approvedOrders = semOrders.filter(o => o.status === 'approved');
    const ticketsCount = approvedOrders.reduce((sum, o) => sum + (o.quantity || (o.seats?.length ?? 0) || 0), 0);
    const cashTotal = approvedOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + (o.convertedUsd || o.amountPaid || 0), 0);
    const digitalTotal = approvedOrders.filter(o => o.paymentMethod !== 'cash').reduce((sum, o) => sum + (o.convertedUsd || o.amountPaid || 0), 0);
    const totalRevenue = cashTotal + digitalTotal;

    return {
      ...sem,
      ordersCount: approvedOrders.length,
      ticketsCount,
      cashTotal,
      digitalTotal,
      totalRevenue
    };
  }).filter(s => s.ticketsCount > 0).sort((a, b) => b.ticketsCount - a.ticketsCount);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-amber-400" />
            Reportes, Cierre y Rendición de Cuentas
          </h1>
          <p className="text-xs text-slate-400">
            Descarga de bases de datos, resumen ejecutivo para el Rector y arqueo de caja por seminarista.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors w-fit"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar Datos</span>
        </button>
      </div>

      {/* Main Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card 1: 500 QR Master Base */}
        <div className="rounded-3xl border-2 border-amber-500/50 bg-gradient-to-br from-amber-950/40 via-slate-900/80 to-slate-950 p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <QrCode className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Base de 500 Códigos QR</h3>
                <span className="text-[11px] text-amber-300 font-semibold">Toda la boletería del Bulevar</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Descarga en Excel los <strong>500 puestos oficiales</strong> con sus códigos de entrada, mesa (1 a 50), silla (1 a 10), sector, enlace QR y estado de ocupación.
            </p>
          </div>

          <button
            onClick={handleDownload500Seats}
            disabled={downloading500}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-4 py-3.5 text-xs font-black text-slate-950 shadow-xl shadow-amber-500/20 transition-all hover:scale-[1.02]"
          >
            {downloading500 ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>{downloading500 ? 'Generando Excel...' : 'Descargar 500 Puestos (Excel)'}</span>
          </button>
        </div>

        {/* Card 2: Excel Orders */}
        <div className="rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-slate-900/80 to-slate-950 p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Cierre de Ventas Excel</h3>
                <span className="text-[11px] text-emerald-300 font-semibold">Todas las órdenes registradas</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Exporta la lista completa de compradores, teléfonos WhatsApp, método de pago, vendedor, mesa asignada y total en USD/Bs.
            </p>
          </div>

          <button
            onClick={handleDownloadExcel}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-4 py-3.5 text-xs font-bold text-white shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.02]"
          >
            <Download className="h-4 w-4" />
            <span>Descargar Órdenes en Excel</span>
          </button>
        </div>

        {/* Card 3: PDF Executive */}
        <div className="rounded-3xl border border-rose-500/40 bg-gradient-to-br from-rose-950/40 via-slate-900/80 to-slate-950 p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Resumen Ejecutivo PDF</h3>
                <span className="text-[11px] text-rose-300 font-semibold">Membrete y Firmas</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Informe formal con membrete del Seminario Santo Tomás de Aquino, métricas de recaudación, desglose de platos servidos y espacio para firmas.
            </p>
          </div>

          <button
            onClick={handleDownloadPdf}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-rose-600 hover:bg-rose-500 px-4 py-3.5 text-xs font-bold text-white shadow-lg shadow-rose-950/40 transition-all hover:scale-[1.02]"
          >
            <Download className="h-4 w-4" />
            <span>Descargar Informe en PDF</span>
          </button>
        </div>

      </div>

      {/* Breakdown by Sales Channel */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Church className="h-4 w-4 text-amber-400" />
          Rendimiento por Canal de Distribución (Capacidad: 500 Asientos)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold">🌐 Venta Online en Página Web</span>
            <div className="text-xl font-black text-amber-400">
              {stats?.salesByChannel?.online?.count || 0} Entradas
            </div>
            <span className="text-emerald-400 font-bold block">
              ${stats?.salesByChannel?.online?.revenueUsd?.toFixed(2) || '0.00'} USD
            </span>
          </div>

          <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold">⛪ Venta de Seminaristas en Parroquias</span>
            <div className="text-xl font-black text-amber-400">
              {stats?.salesByChannel?.seminaristas?.count || 0} Entradas
            </div>
            <span className="text-emerald-400 font-bold block">
              ${stats?.salesByChannel?.seminaristas?.revenueUsd?.toFixed(2) || '0.00'} USD
            </span>
          </div>

          <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold">🏛️ Venta en Taquilla del Seminario</span>
            <div className="text-xl font-black text-amber-400">
              {stats?.salesByChannel?.taquilla?.count || 0} Entradas
            </div>
            <span className="text-emerald-400 font-bold block">
              ${stats?.salesByChannel?.taquilla?.revenueUsd?.toFixed(2) || '0.00'} USD
            </span>
          </div>
        </div>
      </div>

      {/* SEMINARISTAS SALES AUDIT TABLE */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-400" />
              Arqueo de Ventas por Seminarista (Directorio Oficial 2026–2027)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Control de efectivo recaudado para entrega de cuentas a la administración del Seminario.
            </p>
          </div>
          <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl w-fit">
            {seminaristaSales.length} Seminaristas con Ventas Activas
          </span>
        </div>

        {seminaristaSales.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            Aún no se han registrado ventas con nombre de seminarista. Las ventas presenciales en parroquias aparecerán aquí automáticamente.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 bg-slate-950/60">
                <tr>
                  <th className="py-3 px-4">Seminarista</th>
                  <th className="py-3 px-4">Etapa / Diócesis</th>
                  <th className="py-3 px-4 text-center">Entradas</th>
                  <th className="py-3 px-4 text-right">Efectivo ($)</th>
                  <th className="py-3 px-4 text-right">Digital ($)</th>
                  <th className="py-3 px-4 text-right font-bold text-amber-400">Total ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {seminaristaSales.map((sem, idx) => (
                  <tr key={sem.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center text-slate-400 font-mono">
                        {idx + 1}
                      </span>
                      <span>{sem.name}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <span className="inline-flex items-center gap-1 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-lg text-[10px]">
                        {sem.stage} • {sem.diocese}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-amber-400 font-mono">
                      {sem.ticketsCount}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-400">
                      ${sem.cashTotal.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-sky-300">
                      ${sem.digitalTotal.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-amber-300">
                      ${sem.totalRevenue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
