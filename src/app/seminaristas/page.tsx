'use client';

import { useState, useEffect, useRef } from 'react';
import { Order, Ticket, SeatSelection } from '@/types';
import { formatCurrency, formatDate, cleanPhoneForWhatsApp } from '@/lib/utils';
import { 
  Church, 
  UserCheck, 
  Ticket as TicketIcon, 
  Sparkles, 
  Share2, 
  CheckCircle2, 
  Phone, 
  DollarSign, 
  PlusCircle, 
  Loader2, 
  ArrowLeft, 
  Copy, 
  Check, 
  QrCode,
  Users,
  MapPin,
  Camera,
  Upload,
  Image as ImageIcon,
  X,
  Eye,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

const SEMINARISTAS_LIST = [
  'Hno. Daniel Colmenares',
  'Hno. Juan Carlos Pérez',
  'Hno. Andrés Morales',
  'Hno. Gabriel Rivas',
  'Hno. José Luis Duque',
  'Hno. Miguel Ángel Parra',
  'Hno. Ricardo Becerra',
  'Hno. Sebastián Gómez',
  'Padre Formador / Encargado'
];

const PARISHES_LIST = [
  'Basílica de Nuestra Señora de Chiquinquirá (La Chinita)',
  'Catedral Metropolitana de Maracaibo (San Pedro y San Pablo)',
  'Parroquia Santa Bárbara (Casco Central)',
  'Parroquia Nuestra Señora de la Consolación (Bella Vista)',
  'Parroquia Santísimo Sacramento (Las Lomas)',
  'Parroquia San Juan Bautista (San Francisco)',
  'Parroquia La Sagrada Familia (Maracaibo)',
  'Parroquia Padre Claret (Maracaibo)',
  'Parroquia Nuestra Señora del Perpetuo Socorro',
  'Parroquia San Ramón Nonato (Maracaibo)',
  'Parroquia San Alfonso María de Ligorio',
  'Parroquia Santísima Trinidad',
  'Otra Parroquia de Maracaibo / Zulia'
];

export default function SeminaristasPage() {
  // Seminarista Session State
  const [selectedSeminarista, setSelectedSeminarista] = useState<string>('');
  const [selectedParish, setSelectedParish] = useState<string>('');
  const [customSeminarista, setCustomSeminarista] = useState('');
  const [customParish, setCustomParish] = useState('');
  const [isSessionActive, setIsSessionActive] = useState(false);

  // Sale form state
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerDocId, setBuyerDocId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pago_movil' | 'zelle' | 'binance' | 'transferencia'>('cash');
  const [paymentRef, setPaymentRef] = useState('');
  
  // Photo & Capture upload state
  const [paymentProofUrl, setPaymentProofUrl] = useState<string>('');
  const [proofFileName, setProofFileName] = useState<string>('');
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [rateBs, setRateBs] = useState<number>(897.82);
  const [ticketPrice, setTicketPrice] = useState<number>(20);

  // Stats for the active session
  const [mySales, setMySales] = useState<Order[]>([]);

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/config');
        const data = await res.json();
        if (data.success && data.config) {
          if (data.config.currentRateBs) setRateBs(data.config.currentRateBs);
          if (data.config.ticketPriceUsd) setTicketPrice(data.config.ticketPriceUsd);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadConfig();
  }, []);

  const seminaristName = selectedSeminarista === 'Otro' ? customSeminarista : selectedSeminarista;
  const parishName = selectedParish === 'Otra Parroquia / Comunidad' ? customParish : selectedParish;

  const handleStartSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!seminaristName.trim() || !parishName.trim()) {
      alert("Por favor selecciona tu nombre y la parroquia donde estás vendiendo.");
      return;
    }
    setIsSessionActive(true);
  };

  const handleCaptureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert("La foto no debe superar 8MB.");
      return;
    }

    setProofFileName(file.name);
    setUploadingProof(true);

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = () => {
      setProofPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('orderId', `SEMINARISTA_${buyerPhone.replace(/\D/g, '') || Date.now()}`);

      const res = await fetch('/api/upload-proof', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (data.success && data.url) {
        setPaymentProofUrl(data.url);
      } else {
        // Fallback to data url if api fails
        if (proofPreview) setPaymentProofUrl(proofPreview);
      }
    } catch (err) {
      console.error("Error subiendo comprobante:", err);
      if (proofPreview) setPaymentProofUrl(proofPreview);
    } finally {
      setUploadingProof(false);
    }
  };

  const handleRemoveProof = () => {
    setPaymentProofUrl('');
    setProofPreview(null);
    setProofFileName('');
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleProcessParishSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName.trim() || !buyerPhone.trim()) {
      alert("Por favor ingresa el nombre y WhatsApp del feligrés.");
      return;
    }

    setSubmitting(true);
    setLastOrder(null);

    const totalUsd = quantity * ticketPrice;
    const totalBs = totalUsd * rateBs;

    try {
      const payload = {
        buyerName,
        buyerPhone,
        buyerDocId,
        quantity,
        paymentMethod,
        paymentReference: paymentRef || (paymentMethod === 'cash' ? `EFECTIVO-${parishName.slice(0, 10)}` : 'PARROQUIA-CAPTURE'),
        paymentProofUrl: paymentMethod !== 'cash' ? (paymentProofUrl || proofPreview || '') : '',
        amountPaid: paymentMethod === 'pago_movil' ? totalBs : totalUsd,
        currency: paymentMethod === 'pago_movil' ? 'VES' : 'USD',
        convertedUsd: totalUsd,
        rateApplied: paymentMethod === 'pago_movil' ? rateBs : undefined,
        salesChannel: 'seminarista_parroquia',
        sellerName: seminaristName,
        parishName: parishName,
        status: 'approved', // Seminarista in-person sales are approved immediately
        notes: `Venta presencial en ${parishName} por ${seminaristName}`
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.order) {
        setLastOrder(data.order);
        setMySales(prev => [data.order, ...prev]);

        // Reset inputs
        setBuyerName('');
        setBuyerPhone('');
        setBuyerDocId('');
        setPaymentRef('');
        setPaymentProofUrl('');
        setProofPreview(null);
        setProofFileName('');
        setQuantity(1);
        if (cameraInputRef.current) cameraInputRef.current.value = '';
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        alert(data.error || "Error al procesar la venta.");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión al registrar la venta.");
    } finally {
      setSubmitting(false);
    }
  };

  const totalTicketsSoldByMe = mySales.reduce((acc, o) => acc + o.quantity, 0);
  const totalCashCollected = mySales
    .filter(o => o.paymentMethod === 'cash')
    .reduce((acc, o) => acc + o.convertedUsd, 0);

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 bg-slate-950 text-slate-100">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Portada del Evento</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/20 text-emerald-400 px-3 py-1 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5">
              <Church className="h-3.5 w-3.5" />
              <span>Portal de Seminaristas en Parroquias</span>
            </span>
          </div>
        </div>

        {/* Live Exchange Rate Reference Banner for Seminaristas */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-3xl bg-slate-900/90 border border-amber-500/30 shadow-xl text-xs">
          <div className="flex items-center gap-2.5 text-amber-300">
            <span className="text-lg">💶</span>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Tasa Oficial del Día (BCV):</span>
              <strong className="text-sm text-white font-mono">Bs. {rateBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })} / $</strong>
            </div>
          </div>
          <div className="bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800 text-center sm:text-right">
            <span className="text-[10px] text-slate-400 block uppercase">1 Entrada ($20 USD) equivale a:</span>
            <strong className="text-sm font-black text-emerald-400">
              Bs. {(20 * rateBs).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </strong>
          </div>
        </div>

        {/* STEP 1: SEMINARISTA & PARISH SELECTION (If session not active) */}
        {!isSessionActive ? (
          <div className="rounded-3xl border border-amber-500/40 bg-slate-900/90 p-6 sm:p-8 shadow-2xl space-y-6 animate-fadeIn">
            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
                <Church className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-black text-white">
                Identificación de Venta en Parroquia
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Selecciona tu nombre y la parroquia donde estás vendiendo las entradas del Parrandón para asignar tu conteo.
              </p>
            </div>

            <form onSubmit={handleStartSession} className="space-y-4 max-w-md mx-auto text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">
                  ¿Quién eres? (Nombre del Seminarista) <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={selectedSeminarista}
                  onChange={(e) => setSelectedSeminarista(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="">-- Selecciona tu nombre --</option>
                  {SEMINARISTAS_LIST.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  <option value="Otro">Otro (Escribir nombre)...</option>
                </select>
              </div>

              {selectedSeminarista === 'Otro' && (
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Escribe tu nombre completo:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Hno. Carlos Ramírez"
                    value={customSeminarista}
                    onChange={(e) => setCustomSeminarista(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-xs text-white"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-300 mb-1.5">
                  Parroquia o Iglesia donde estás vendiendo <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={selectedParish}
                  onChange={(e) => setSelectedParish(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="">-- Selecciona la parroquia --</option>
                  {PARISHES_LIST.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {selectedParish === 'Otra Parroquia / Comunidad' && (
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Nombre de la Parroquia / Capilla:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Parroquia Ntra. Sra. del Rosario"
                    value={customParish}
                    onChange={(e) => setCustomParish(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-xs text-white"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-2xl bg-amber-500 hover:bg-amber-400 py-3.5 text-sm font-bold text-slate-950 transition-all shadow-xl shadow-amber-500/25 mt-4"
              >
                Comenzar Jornada de Venta
              </button>
            </form>
          </div>
        ) : (
          /* ACTIVE SELLING INTERFACE */
          <div className="space-y-6 animate-fadeIn">
            
            {/* Active Session Badge & Stats */}
            <div className="rounded-3xl border border-emerald-500/40 bg-slate-900/80 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <strong className="text-white text-base">{seminaristName}</strong>
                </div>
                <p className="text-xs text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3" />
                  {parishName}
                </p>
              </div>

              {/* Counters */}
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-slate-950 px-4 py-2 text-center border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Mis Ventas</span>
                  <span className="text-base font-black text-amber-400">{totalTicketsSoldByMe} Entradas</span>
                </div>
                <div className="rounded-2xl bg-slate-950 px-4 py-2 text-center border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Efectivo en Mano</span>
                  <span className="text-base font-black text-emerald-400">${totalCashCollected} USD</span>
                </div>
                <button
                  onClick={() => setIsSessionActive(false)}
                  className="text-xs text-slate-400 hover:text-white underline ml-1"
                >
                  Cambiar
                </button>
              </div>
            </div>

            {/* POPUP / VOUCHER IF SALE JUST COMPLETED */}
            {lastOrder && (
              <div className="rounded-3xl border-2 border-emerald-500 bg-gradient-to-br from-emerald-950/90 via-slate-900 to-slate-950 p-6 shadow-2xl animate-fadeIn space-y-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 bg-emerald-500 text-slate-950 text-xs font-black uppercase px-3 py-1 rounded-full">
                    <CheckCircle2 className="h-4 w-4" />
                    ¡Venta Registrada Exitosamente!
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    {lastOrder.id}
                  </span>
                </div>

                <div className="rounded-2xl bg-slate-950/80 p-4 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Comprador:</span>
                    <strong className="text-white text-sm">{lastOrder.buyerName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">WhatsApp:</span>
                    <strong className="text-emerald-400">{lastOrder.buyerPhone}</strong>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-800">
                    <span className="text-slate-400">Ubicación Asignada:</span>
                    <span className="text-amber-300 font-bold">
                      {lastOrder.tickets.map(t => `Mesa ${t.tableId} (Silla ${t.seatNumber})`).join(', ')}
                    </span>
                  </div>
                  {lastOrder.paymentProofUrl && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px] text-sky-300">
                      <span>Capture de Pago:</span>
                      <span className="font-bold">📸 Guardado en el Sistema</span>
                    </div>
                  )}
                </div>

                {/* 1-Click WhatsApp Buttons */}
                {lastOrder.tickets && lastOrder.tickets.length > 0 && (
                  <div className="space-y-3">
                    
                    {/* Send Master Order Link if more than 1 ticket */}
                    {lastOrder.tickets.length > 1 && (
                      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 p-4 rounded-2xl border-2 border-emerald-500/60 text-center space-y-2">
                        <div className="text-xs font-bold text-emerald-300">
                          📦 Paquete Familiar ({lastOrder.tickets.length} Entradas)
                        </div>
                        {(() => {
                          const orderUrl = typeof window !== 'undefined'
                            ? `${window.location.origin}/orden/${lastOrder.id}`
                            : `https://parrandon.seminariosta.org/orden/${lastOrder.id}`;

                          const masterMsg = `🎄 *Parrandón Navideño 2026 - Seminario Santo Tomás de Aquino (Maracaibo)*\n\n¡Muchas gracias por colaborar con nuestra formación sacerdotal, *${lastOrder.buyerName}*!\n\n📦 *Tu Paquete Familiar:* ${lastOrder.quantity} Entradas\n🪑 *Mesas y Sillas Asignadas:*\n${lastOrder.tickets.map(t => `• Mesa ${t.tableId} Silla #${t.seatNumber} (${t.attendeeName})`).join('\n')}\n\n🍽️ *Incluye:* ${lastOrder.quantity} Platos Navideños Tradicionales Completos\n📅 *Fecha:* Sábado 12 de Diciembre de 2026 • 6:00 PM\n📍 *Lugar:* Bulevar del Seminario Santo Tomás de Aquino (Maracaibo, Estado Zulia)\n\n👉 *Abre tus ${lastOrder.quantity} entradas con QR aquí:* ${orderUrl}\n\n_Presenta este enlace en tu celular al llegar a la puerta._`;

                          const masterWaUrl = `https://wa.me/${cleanPhoneForWhatsApp(lastOrder.buyerPhone)}?text=${encodeURIComponent(masterMsg)}`;

                          return (
                            <a
                              href={masterWaUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-3 text-xs font-black text-slate-950 shadow-xl transition-transform hover:scale-[1.02]"
                            >
                              <Share2 className="h-4 w-4" />
                              <span>📲 Enviar las {lastOrder.quantity} Entradas Juntas al Comprador</span>
                            </a>
                          );
                        })()}
                      </div>
                    )}

                    {/* Individual Ticket Buttons */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 block uppercase">
                        {lastOrder.tickets.length > 1 ? 'O enviar entradas por separado:' : 'Enviar entrada al comprador:'}
                      </span>
                      {lastOrder.tickets.map((ticket, idx) => {
                        const ticketUrl = typeof window !== 'undefined'
                          ? `${window.location.origin}/ticket/${ticket.ticketCode}`
                          : `https://parrandon.seminariosta.org/ticket/${ticket.ticketCode}`;

                        const waMsg = `🎄 *Parrandón Navideño 2026 - Seminario Santo Tomás de Aquino (Maracaibo)*\n\n¡Muchas gracias por colaborar con nuestra formación sacerdotal, *${ticket.attendeeName}*!\n\n🎟️ *Tu Entrada Digital:* #${ticket.ticketNumber}\n🪑 *Tu Ubicación:* Mesa ${ticket.tableId} • Silla #${ticket.seatNumber} (Sector ${ticket.sector})\n🍽️ *Incluye:* 1 Plato Navideño Tradicional Completo\n📅 *Fecha:* Sábado 12 de Diciembre de 2026 • 6:00 PM\n📍 *Lugar:* Bulevar del Seminario Santo Tomás de Aquino (Maracaibo, Estado Zulia)\n\n👉 *Abre tu código QR aquí:* ${ticketUrl}\n\n_Presenta este enlace o captura en tu celular el día del evento._`;

                        const waUrl = `https://wa.me/${cleanPhoneForWhatsApp(lastOrder.buyerPhone)}?text=${encodeURIComponent(waMsg)}`;

                        return (
                          <div key={ticket.id} className="flex flex-col sm:flex-row gap-2 items-center justify-between bg-slate-900 p-3 rounded-2xl border border-slate-800">
                            <div className="text-xs text-left">
                              <span className="font-bold text-white block">Entrada #{idx + 1}: {ticket.attendeeName}</span>
                              <span className="text-amber-400 font-mono text-[11px]">Mesa {ticket.tableId} • Silla #{ticket.seatNumber} ({ticket.ticketCode})</span>
                            </div>
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-emerald-700 hover:text-white px-3.5 py-2 text-xs font-bold text-emerald-300 border border-emerald-500/30 transition-colors"
                            >
                              <Share2 className="h-3.5 w-3.5" />
                              <span>Enviar Entrada #{idx + 1}</span>
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setLastOrder(null)}
                  className="w-full text-center text-xs text-slate-400 hover:text-white pt-2"
                >
                  Continuar con siguiente venta ↓
                </button>
              </div>
            )}

            {/* FAST PARISH SALES FORM */}
            <form onSubmit={handleProcessParishSale} className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <PlusCircle className="h-5 w-5 text-amber-400" />
                  Nueva Venta en Puerta de Iglesia
                </h3>
                <p className="text-xs text-slate-400">
                  El sistema asignará automáticamente las mejores mesas y sillas disponibles contiguas.
                </p>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-bold uppercase text-amber-400 mb-2">
                  ¿Cuántas entradas desea el feligrés?
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 10].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setQuantity(n)}
                      className={`py-3 rounded-2xl font-black text-sm transition-all ${
                        quantity === n
                          ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 scale-105'
                          : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-700'
                      }`}
                    >
                      {n} {n === 1 ? 'silla' : 'sillas'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Buyer info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Nombre del Feligrés / Comprador <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Familia Morales / Sra. Rosa"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Teléfono WhatsApp <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej: 0414-1234567 o 0412 1234567"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Cédula / DNI (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: V-12345678"
                    value={buyerDocId}
                    onChange={(e) => setBuyerDocId(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-xs text-white uppercase focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Forma de Cobro
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="cash">💵 Efectivo en mano ($ o Bs)</option>
                    <option value="pago_movil">📱 Pago Móvil (Banesco / BCV)</option>
                    <option value="zelle">💵 Zelle al Seminario</option>
                    <option value="binance">🪙 Binance Pay (USDT)</option>
                    <option value="transferencia">🏦 Transferencia Bancaria</option>
                  </select>
                </div>
              </div>

              {/* PHOTO / SCREENSHOT CAPTURE FOR NON-CASH METHODS */}
              {paymentMethod !== 'cash' && (
                <div className="rounded-2xl bg-slate-950 p-4 border-2 border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Camera className="h-4 w-4 text-amber-400" />
                      <span>Capture / Foto del Comprobante de Pago</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">Recomendado para arqueo</span>
                  </div>

                  {/* Hidden file inputs */}
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleCaptureUpload}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCaptureUpload}
                  />

                  {/* Photo Action Buttons or Preview */}
                  {!proofPreview && !paymentProofUrl ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        disabled={uploadingProof}
                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white text-xs font-bold border border-blue-400/40 shadow-lg active:scale-95 transition-all"
                      >
                        <Camera className="h-4 w-4 text-amber-300" />
                        <span>📸 Tomar Foto con Cámara</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingProof}
                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700 active:scale-95 transition-all"
                      >
                        <Upload className="h-4 w-4 text-emerald-400" />
                        <span>🖼️ Subir Capture de Galería</span>
                      </button>
                    </div>
                  ) : (
                    /* Photo Uploaded Preview Card */
                    <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-emerald-500/40 animate-fadeIn">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-emerald-400/50 bg-black shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={proofPreview || paymentProofUrl}
                            alt="Capture de pago"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Capture guardado con éxito</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono truncate max-w-[180px] block">
                            {proofFileName || 'comprobante_pago.jpg'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-[11px] font-semibold border border-slate-700"
                        >
                          Cambiar
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveProof}
                          className="p-1.5 rounded-lg bg-rose-950/60 text-rose-400 hover:bg-rose-900 border border-rose-800"
                          title="Eliminar capture"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {uploadingProof && (
                    <div className="flex items-center gap-2 text-xs text-amber-300 animate-pulse pt-1">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Subiendo capture de pago...</span>
                    </div>
                  )}

                  {/* Reference Number input */}
                  <div className="pt-2">
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Número de Referencia Bancaria (o últimos 4 dígitos)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 098234"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2 text-xs text-white uppercase font-mono focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Total Card */}
              <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block">Total a Recibir:</span>
                  <span className="text-xs text-emerald-400 font-semibold">{quantity} Entrada(s) con Plato Incluido</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-amber-400">${quantity * ticketPrice}.00 USD</span>
                  <span className="block text-[11px] text-slate-300 font-mono mt-0.5">
                    o <strong>Bs. {(quantity * ticketPrice * rateBs).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</strong>
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || uploadingProof}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 py-4 text-sm font-black text-slate-950 transition-all shadow-xl shadow-amber-500/25 disabled:opacity-50 active:scale-[0.98]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Emitiendo Códigos QR...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    <span>Cobrar y Emitir {quantity} Entrada(s) con QR</span>
                  </>
                )}
              </button>
            </form>

            {/* List of my sales in this session */}
            {mySales.length > 0 && (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Ventas registradas en esta jornada ({mySales.length}):
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {mySales.map((s) => (
                    <div key={s.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-white block">{s.buyerName}</strong>
                        <span className="text-[10px] text-slate-400">
                          {s.quantity} {s.quantity === 1 ? 'entrada' : 'entradas'} • {s.seats.map(st => `Mesa ${st.tableId}-S${st.seatNumber}`).join(', ')}
                        </span>
                        {s.paymentProofUrl && (
                          <span className="text-[9px] text-emerald-400 block font-semibold mt-0.5">
                            📸 Capture adjunto
                          </span>
                        )}
                      </div>
                      <span className="text-emerald-400 font-bold font-mono">
                        ${s.convertedUsd} USD
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
