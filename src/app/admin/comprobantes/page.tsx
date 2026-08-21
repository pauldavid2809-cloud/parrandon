'use client';

import { useState, useEffect } from 'react';
import { Order } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import ProofModal from '@/components/ProofModal';
import { 
  ReceiptText, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Search, 
  Clock, 
  AlertCircle, 
  RefreshCw,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function ComprobantesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrderForProof, setSelectedOrderForProof] = useState<Order | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleApprove = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved', verifiedBy: 'Anabella (Admin)' })
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (orderId: string, reason: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', rejectionReason: reason, verifiedBy: 'Anabella (Admin)' })
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'all' ? true : order.status === filter;
    const matchesSearch = 
      order.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.paymentReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.buyerPhone.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = orders.filter(o => o.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ReceiptText className="h-6 w-6 text-amber-400" />
            Verificación de Comprobantes de Pago
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Revisa los captures bancarios, confirma referencias y aprueba en 1 clic para enviar las entradas con QR.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="flex items-center gap-1.5 rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-300 hover:text-white"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          <span>Actualizar Lista</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-2xl border border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setFilter('pending')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              filter === 'pending'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Pendientes</span>
            {pendingCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${filter === 'pending' ? 'bg-slate-950 text-amber-300' : 'bg-rose-500 text-white'}`}>
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilter('approved')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              filter === 'approved'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Aprobados
          </button>

          <button
            onClick={() => setFilter('rejected')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              filter === 'rejected'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Rechazados
          </button>

          <button
            onClick={() => setFilter('all')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-slate-700 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos ({orders.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nombre, ref o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl bg-slate-900 border border-slate-800 pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Grid of Payment Receipts */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-12 text-center">
          <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto mb-2 opacity-60" />
          <h3 className="text-sm font-bold text-white">No hay comprobantes en esta categoría</h3>
          <p className="text-xs text-slate-400 mt-1">
            {filter === 'pending'
              ? '¡Excelente! No tienes pagos pendientes por revisar en este momento.'
              : 'No se encontraron órdenes que coincidan con la búsqueda.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className={`rounded-3xl border p-5 flex flex-col justify-between transition-all bg-slate-900/80 shadow-lg ${
                order.status === 'pending'
                  ? 'border-amber-500/50 hover:border-amber-400'
                  : order.status === 'approved'
                  ? 'border-emerald-500/30'
                  : 'border-rose-500/30'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-amber-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {order.id}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      order.status === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : order.status === 'rejected'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                    }`}
                  >
                    {order.status === 'approved' ? 'Aprobado' : order.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                  </span>
                </div>

                {/* Buyer & Amount */}
                <h3 className="text-base font-bold text-white truncate">{order.buyerName}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{order.buyerPhone}</p>

                <div className="mt-3 rounded-2xl bg-slate-950/80 p-3 border border-slate-800/80 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Método:</span>
                    <strong className="text-white uppercase text-[11px]">{order.paymentMethod}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Referencia:</span>
                    <code className="text-amber-300 font-mono font-bold">{order.paymentReference}</code>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                    <span className="text-slate-400">Monto:</span>
                    <strong className="text-emerald-400 text-sm">
                      {formatCurrency(order.amountPaid, order.currency)}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Entradas:</span>
                    <span className="font-semibold text-white">{order.quantity} ({order.quantity} platos)</span>
                  </div>
                </div>

                {/* Proof Image Preview */}
                {order.paymentProofUrl ? (
                  <div
                    onClick={() => setSelectedOrderForProof(order)}
                    className="mt-3 relative h-32 rounded-xl overflow-hidden border border-slate-800 cursor-pointer group bg-black"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={order.paymentProofUrl}
                      alt="Capture de pago"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1">
                      <Eye className="h-4 w-4" />
                      <span>Ver Comprobante</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl bg-slate-950 p-3 text-center text-slate-500 text-[11px] border border-slate-800">
                    Sin foto de comprobante (Venta en taquilla o directa)
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex gap-2">
                <button
                  onClick={() => setSelectedOrderForProof(order)}
                  className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-bold text-slate-200 transition-colors flex items-center justify-center gap-1"
                >
                  <Eye className="h-3.5 w-3.5 text-amber-400" />
                  <span>Revisar Detalle</span>
                </button>

                {order.status === 'pending' && (
                  <button
                    onClick={() => handleApprove(order.id)}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white transition-colors flex items-center justify-center gap-1 shadow-md shadow-emerald-950/40"
                    title="Aprobar inmediatamente"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Aprobar</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Proof Modal */}
      <ProofModal
        order={selectedOrderForProof}
        isOpen={!!selectedOrderForProof}
        onClose={() => setSelectedOrderForProof(null)}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}
