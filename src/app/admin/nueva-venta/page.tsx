'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  PlusCircle, 
  User, 
  Phone, 
  CreditCard, 
  Utensils, 
  CheckCircle, 
  Loader2, 
  Sparkles, 
  Ticket 
} from 'lucide-react';

export default function NuevaVentaPage() {
  const router = useRouter();

  const [buyerName, setBuyerName] = useState('');
  const [buyerDocId, setBuyerDocId] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [attendees, setAttendees] = useState<Array<{ name: string }>>([{ name: '' }]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pago_movil' | 'zelle' | 'binance'>('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [amountPaid, setAmountPaid] = useState<number>(10);
  const [notes, setNotes] = useState('Venta directa registrada en taquilla por Anabella.');
  const [submitting, setSubmitting] = useState(false);

  const handleQuantityChange = (num: number) => {
    setQuantity(num);
    setAmountPaid(num * 10);
    setAttendees(prev => {
      const next = [...prev];
      while (next.length < num) {
        next.push({ name: '' });
      }
      return next.slice(0, num);
    });
  };

  const handleNameChange = (val: string) => {
    setBuyerName(val);
    setAttendees(prev => {
      const next = [...prev];
      if (next.length > 0 && (!next[0].name || next[0].name === buyerName)) {
        next[0].name = val;
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName.trim() || !buyerPhone.trim()) {
      alert("Por favor completa el nombre y teléfono del comprador.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        buyerName,
        buyerDocId,
        buyerPhone,
        buyerEmail,
        quantity,
        attendees: attendees.map((att, i) => ({
          name: att.name.trim() || `${buyerName} (Asistente ${i + 1})`
        })),
        paymentMethod,
        paymentReference: paymentReference || (paymentMethod === 'cash' ? 'TAQUILLA-EFECTIVO' : 'MANUAL'),
        amountPaid: Number(amountPaid),
        currency: paymentMethod === 'pago_movil' ? 'VES' : paymentMethod === 'binance' ? 'USDT' : 'USD',
        convertedUsd: paymentMethod === 'pago_movil' ? amountPaid / 48.5 : amountPaid,
        notes
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.order) {
        // Auto-approve if created manually in admin
        await fetch(`/api/orders/${data.order.id}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'approved', verifiedBy: 'Anabella (Taquilla)' })
        });
        router.push(`/orden/${data.order.id}`);
      } else {
        alert(data.error || "Error al crear la orden.");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <PlusCircle className="h-6 w-6 text-amber-400" />
          Registrar Venta Manual / Taquilla
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Crea una entrada directamente para personas que pagan en efectivo, punto de venta o transferencia directa en la oficina del Seminario. Se emitirán sus códigos QR al instante.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 space-y-6 shadow-2xl">
        
        {/* Quantity */}
        <div>
          <label className="block text-xs font-bold uppercase text-amber-400 mb-2">
            Número de Entradas / Platos:
          </label>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => handleQuantityChange(n)}
                className={`py-2 rounded-xl font-bold text-xs transition-colors ${
                  quantity === n
                    ? 'bg-amber-500 text-slate-950 font-extrabold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Buyer info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Nombre Completo *</label>
            <input
              type="text"
              required
              placeholder="Ej: Carmen Villamizar"
              value={buyerName}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Teléfono WhatsApp *</label>
            <input
              type="tel"
              required
              placeholder="Ej: 0414-1234567 o 0412 1234567 (sin código +58)"
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Correo Electrónico (Opcional)</label>
            <input
              type="email"
              placeholder="ejemplo@correo.com"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Attendees List */}
        {quantity > 1 && (
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="block text-xs font-bold text-slate-300">Nombres en cada entrada QR:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {attendees.map((att, idx) => (
                <input
                  key={idx}
                  type="text"
                  placeholder={`Asistente #${idx + 1}`}
                  value={att.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAttendees(prev => {
                      const next = [...prev];
                      next[idx] = { name: val };
                      return next;
                    });
                  }}
                  className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              ))}
            </div>
          </div>
        )}

        {/* Payment info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-800">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Método de Cobro</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            >
              <option value="cash">Efectivo ($ o Bs en taquilla)</option>
              <option value="pago_movil">Pago Móvil (Bs)</option>
              <option value="zelle">Zelle ($)</option>
              <option value="binance">Binance Pay (USDT)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Referencia o Recibo</label>
            <input
              type="text"
              placeholder="Ej: RECIBO-001 o Nro Transferencia"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-300 mb-1">Monto Total Cobrado ($ USD o equivalente)</label>
            <input
              type="number"
              value={amountPaid}
              onChange={(e) => setAmountPaid(Number(e.target.value))}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-xs text-emerald-400 font-bold focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-400 py-3.5 text-sm font-bold text-slate-950 transition-all shadow-xl shadow-amber-500/25 disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Emitiendo Entradas con QR...</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              <span>Emitir {quantity} Entrada(s) y Generar QR Oficial</span>
            </>
          )}
        </button>

      </form>
    </div>
  );
}
