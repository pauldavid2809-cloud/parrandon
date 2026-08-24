'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Order, Ticket } from '@/types';
import { cleanPhoneForWhatsApp } from '@/lib/utils';
import { exportOrdersToExcel } from '@/lib/export';
import { 
  Users, 
  Search, 
  Share2, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  QrCode, 
  Utensils, 
  RefreshCw,
  Phone,
  Copy,
  Check,
  Download,
  FileSpreadsheet
} from 'lucide-react';

interface AttendeeRow {
  ticket: Ticket;
  order: Order;
}

export default function AsistentesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUsed, setFilterUsed] = useState<'all' | 'used' | 'unused'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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

  const attendeeRows: AttendeeRow[] = [];
  orders.forEach(order => {
    (order.tickets || []).forEach(ticket => {
      attendeeRows.push({ ticket, order });
    });
  });

  const filteredRows = attendeeRows.filter(({ ticket, order }) => {
    const matchesFilter = 
      filterUsed === 'all' ? true :
      filterUsed === 'used' ? ticket.isUsed :
      !ticket.isUsed;

    const matchesSearch = 
      ticket.attendeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticketCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.buyerPhone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleCopy = (code: string) => {
    const url = typeof window !== 'undefined' 
      ? `${window.location.origin}/ticket/${code}`
      : `https://parrandon.seminariosta.org/ticket/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleExportExcel = () => {
    exportOrdersToExcel(orders, `Asistentes_Parrandon_2026_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-amber-400" />
            Lista de Asistentes y Entradas Emitidas
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestiona cada entrada individual, reenvía códigos por WhatsApp y supervisa el ingreso.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white transition-colors shadow-md"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Exportar a Excel</span>
          </button>

          <button
            onClick={fetchOrders}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-300 hover:text-white"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-2xl border border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setFilterUsed('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold ${
              filterUsed === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos ({attendeeRows.length})
          </button>
          <button
            onClick={() => setFilterUsed('used')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold ${
              filterUsed === 'used' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            En Sala / Asistieron ({attendeeRows.filter(r => r.ticket.isUsed).length})
          </button>
          <button
            onClick={() => setFilterUsed('unused')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold ${
              filterUsed === 'unused' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Por Ingresar ({attendeeRows.filter(r => !r.ticket.isUsed).length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar asistente, código, orden o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl bg-slate-900 border border-slate-800 pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Código QR</th>
                <th className="px-4 py-3">Nombre del Asistente</th>
                <th className="px-4 py-3">Ubicación</th>
                <th className="px-4 py-3">Comprador</th>
                <th className="px-4 py-3">WhatsApp</th>
                <th className="px-4 py-3">Plato Navideño</th>
                <th className="px-4 py-3">Asistencia</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No se encontraron asistentes registrados con estos filtros.
                  </td>
                </tr>
              ) : (
                filteredRows.map(({ ticket, order }) => {
                  const shareText = `🎄 *Parrandón Navideño 2026 - Seminario Santo Tomás*\n¡Hola ${ticket.attendeeName}! Aquí tienes tu entrada con QR:\n👉 https://parrandon.seminariosta.org/ticket/${ticket.ticketCode}`;
                  const waLink = `https://wa.me/${cleanPhoneForWhatsApp(order.buyerPhone)}?text=${encodeURIComponent(shareText)}`;

                  return (
                    <tr key={ticket.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-amber-300">
                        {ticket.ticketCode}
                      </td>
                      <td className="px-4 py-3">
                        <strong className="text-white text-sm block">{ticket.attendeeName}</strong>
                        <span className="text-[10px] text-slate-400">Pase #{ticket.ticketNumber} • Orden {order.id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-amber-300 font-bold font-mono text-xs">
                          Mesa {ticket.tableId} • Silla #{ticket.seatNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 block">Sector {ticket.sector || 'A'}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {order.buyerName}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`https://wa.me/${cleanPhoneForWhatsApp(order.buyerPhone)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                        >
                          <Phone className="h-3 w-3" />
                          {order.buyerPhone}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          <Utensils className="h-3 w-3" />
                          {ticket.mealServed ? 'Servido' : '1 Plato Incluido'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {ticket.isUsed ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Ingresó ({ticket.scannedAt ? new Date(ticket.scannedAt).toLocaleTimeString('es-VE') : ''})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-400/80 font-medium text-[11px]">
                            <Clock className="h-3.5 w-3.5" />
                            Sin escanear
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right space-x-1.5">
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1.5 text-[11px] font-bold text-white transition-colors"
                          title="Enviar Entrada por WhatsApp"
                        >
                          <Share2 className="h-3 w-3" />
                          <span>WhatsApp</span>
                        </a>

                        <Link
                          href={`/ticket/${ticket.ticketCode}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 transition-colors"
                          title="Abrir Ticket Digital"
                        >
                          <ExternalLink className="h-3 w-3 text-amber-400" />
                          <span>Ver</span>
                        </Link>

                        <button
                          onClick={() => handleCopy(ticket.ticketCode)}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2 py-1.5 text-[11px] text-slate-300"
                          title="Copiar Link de Entrada"
                        >
                          {copiedCode === ticket.ticketCode ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3 text-slate-400" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
