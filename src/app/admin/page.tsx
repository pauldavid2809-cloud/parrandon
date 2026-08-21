'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { EventStats, Order } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import ProofModal from '@/components/ProofModal';
import { 
  Sparkles, 
  DollarSign, 
  Ticket, 
  ReceiptText, 
  Utensils, 
  TrendingUp, 
  Users, 
  ArrowUpRight, 
  CheckCircle, 
  Clock, 
  XCircle, 
  PlusCircle, 
  FileSpreadsheet, 
  QrCode, 
  RefreshCw,
  Eye
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<EventStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderForProof, setSelectedOrderForProof] = useState<Order | null>(null);

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
      console.error('Error loading admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApproveOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved', verifiedBy: 'Anabella (Admin)' })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectOrder = async (orderId: string, reason: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', rejectionReason: reason, verifiedBy: 'Anabella (Admin)' })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const totalSold = stats?.totalSoldTickets || 0;
  const totalQuota = stats?.totalQuota || 350;
  const percentFilled = Math.min(100, Math.round((totalSold / totalQuota) * 100));

  return (
    <div className="space-y-8">
      {/* Top Welcome & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white">Panel de Anabella</h1>
            <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/30">
              Admin Parrandón 2026
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Resumen financiero en tiempo real, validación de comprobantes y control de asistencia para el Seminario.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            <span>Actualizar</span>
          </button>
          <Link
            href="/admin/nueva-venta"
            className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Venta en Taquilla</span>
          </Link>
        </div>
      </div>

      {/* Alert if pending orders exist */}
      {stats && stats.pendingOrdersCount > 0 && (
        <div className="rounded-2xl border border-rose-500/40 bg-gradient-to-r from-rose-950/60 via-slate-900/60 to-slate-900/60 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <ReceiptText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                ¡Tienes {stats.pendingOrdersCount} comprobante(s) pendiente(s) por verificar!
              </h3>
              <p className="text-xs text-slate-300">
                Los compradores están esperando la aprobación de su pago para recibir sus entradas con código QR.
              </p>
            </div>
          </div>
          <Link
            href="/admin/comprobantes"
            className="rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-950/50 transition-colors text-center shrink-0"
          >
            Revisar Comprobantes Ahora →
          </Link>
        </div>
      )}

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Revenue */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Recaudado</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">
              ${stats?.totalRevenueUsd.toFixed(2) || '0.00'} USD
            </div>
            <span className="text-[11px] text-slate-400">
              En fondos confirmados y aprobados
            </span>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 space-y-0.5">
            <div>💵 Zelle: <strong>${stats?.revenueByMethod.zelle.totalUsd.toFixed(2) || 0}</strong></div>
            <div>📱 Pago Móvil: <strong>Bs. {stats?.revenueByMethod.pago_movil.totalVes.toLocaleString('es-VE') || 0}</strong></div>
            <div>🪙 Binance: <strong>{stats?.revenueByMethod.binance.totalUsdt.toFixed(2) || 0} USDT</strong></div>
          </div>
        </div>

        {/* Card 2: Tickets Quota */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Entradas Vendidas</span>
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Ticket className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {totalSold} <span className="text-sm font-normal text-slate-400">/ {totalQuota}</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${percentFilled}%` }}
              />
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800 flex justify-between text-[11px]">
            <span className="text-emerald-400 font-medium">✅ {stats?.confirmedTickets || 0} Confirmadas</span>
            <span className="text-amber-400 font-medium">⏳ {stats?.pendingTickets || 0} Pendientes</span>
          </div>
        </div>

        {/* Card 3: Attendance / Platos */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Platos Navideños</span>
            <div className="h-8 w-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <Utensils className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {stats?.attendance.mealsServedCount || 0}
            </div>
            <span className="text-[11px] text-slate-400">
              Platos servidos / entregados en puerta
            </span>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
            <span>Asistentes en sala: <strong className="text-white">{stats?.attendance.scannedCount || 0}</strong></span>
            <span>Por llegar: <strong className="text-amber-400">{stats?.attendance.pendingScanCount || 0}</strong></span>
          </div>
        </div>

        {/* Card 4: Quick Scanner Launch */}
        <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-900/80 to-slate-950 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Control de Puerta</span>
              <QrCode className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Usa cualquier teléfono para escanear y validar los códigos QR de los asistentes.
            </p>
          </div>
          <Link
            href="/escanear"
            className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-950/40 transition-colors"
          >
            <QrCode className="h-4 w-4" />
            <span>Abrir Escáner de Puerta</span>
          </Link>
        </div>

      </div>

      {/* Recent Orders Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ReceiptText className="h-4 w-4 text-amber-400" />
              Órdenes y Ventas Recientes
            </h2>
            <p className="text-xs text-slate-400">
              Visualiza y valida los comprobantes recibidos para el Parrandón 2026.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/comprobantes"
              className="text-xs text-amber-400 hover:underline font-semibold"
            >
              Ver Solo Pendientes ({stats?.pendingOrdersCount || 0}) →
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">ID Orden</th>
                <th className="px-4 py-3">Comprador</th>
                <th className="px-4 py-3">Entradas</th>
                <th className="px-4 py-3">Método / Ref</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Estatus</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {orders.slice(0, 10).map((order) => (
                <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3.5 font-mono font-bold text-amber-300">
                    {order.id}
                  </td>
                  <td className="px-4 py-3.5">
                    <strong className="text-white block">{order.buyerName}</strong>
                    <span className="text-[11px] text-slate-400">{order.buyerPhone}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-bold text-white">{order.quantity}</span>
                    <span className="text-[10px] text-slate-400 block">{order.quantity} platos</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="uppercase font-semibold text-slate-200 block text-[11px]">
                      {order.paymentMethod}
                    </span>
                    <code className="text-amber-300/90 font-mono text-[10px]">
                      {order.paymentReference}
                    </code>
                  </td>
                  <td className="px-4 py-3.5">
                    <strong className="text-emerald-400 block">
                      {formatCurrency(order.amountPaid, order.currency)}
                    </strong>
                    <span className="text-[10px] text-slate-400">
                      (${order.convertedUsd} USD)
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        order.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : order.status === 'rejected'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {order.status === 'approved' ? (
                        <>
                          <CheckCircle className="h-3 w-3" /> Aprobado
                        </>
                      ) : order.status === 'rejected' ? (
                        <>
                          <XCircle className="h-3 w-3" /> Rechazado
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 animate-pulse" /> Pendiente
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right space-x-1.5">
                    <button
                      onClick={() => setSelectedOrderForProof(order)}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 transition-colors"
                      title="Ver Comprobante y Detalles"
                    >
                      <Eye className="h-3.5 w-3.5 text-amber-400" />
                      <span>Comprobante</span>
                    </button>
                    {order.status === 'approved' && (
                      <Link
                        href={`/orden/${order.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-950 border border-emerald-500/40 hover:bg-emerald-900 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-300 transition-colors"
                        title="Ver Entradas QR"
                      >
                        <Ticket className="h-3.5 w-3.5" />
                        <span>QRs</span>
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Proof Modal */}
      <ProofModal
        order={selectedOrderForProof}
        isOpen={!!selectedOrderForProof}
        onClose={() => setSelectedOrderForProof(null)}
        onApprove={handleApproveOrder}
        onReject={handleRejectOrder}
      />
    </div>
  );
}
