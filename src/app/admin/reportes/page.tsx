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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-amber-400" />
            Reportes, Cierre y Base de 500 Códigos QR
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Descarga informes auditables en Excel y PDF para rendir cuentas del Parrandón 2026 (500 cupos en Bulevar).
          </p>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-300 hover:text-white"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          <span>Actualizar Datos</span>
        </button>
      </div>

      {/* Export Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Base de 500 QRs */}
        <div className="rounded-3xl border border-amber-500/40 bg-gradient-to-br from-amber-950/40 via-slate-900/80 to-slate-950 p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <QrCode className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Base de 500 Códigos QR</h3>
                <span className="text-[11px] text-amber-300 font-semibold">50 Mesas x 10 Sillas</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Exporta la lista completa de los 500 asientos del Bulevar con su código QR único, número de mesa, silla, sector y estado de venta para impresión física o verificación.
            </p>
          </div>

          <button
            disabled={downloading500}
            onClick={handleDownload500Seats}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-400 px-4 py-3.5 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>{downloading500 ? 'Generando Excel...' : 'Descargar 500 QRs en Excel'}</span>
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
                <h3 className="text-base font-bold text-white">Libro de Ventas y Pagos</h3>
                <span className="text-[11px] text-emerald-400 font-semibold">Online y Parroquias</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Detalle de cada orden con comprobante, canal de venta (Web vs Seminarista en Parroquia), referencia bancaria, monto en Bs/$ y asistencia.
            </p>
          </div>

          <button
            onClick={handleDownloadExcel}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-4 py-3.5 text-xs font-bold text-white shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.02]"
          >
            <Download className="h-4 w-4" />
            <span>Descargar Ventas en Excel</span>
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
    </div>
  );
}
