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
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Clock,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { SEMINARISTAS_DIRECTORY, SEMINARY_STAGES } from '@/lib/seminaristas';

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
  const [activeTab, setActiveTab] = useState<'sell' | 'history'>('sell');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('ALL');
  const [viewProofModal, setViewProofModal] = useState<string | null>(null);

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

  // Stats & sales for the active seminarista
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

  const loadSeminaristaHistory = async (name: string) => {
    if (!name.trim()) return;
    try {
      setLoadingHistory(true);
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success && data.orders) {
        const myHistoricalSales = data.orders.filter((o: Order) => 
          (o.sellerName && o.sellerName.toLowerCase().includes(name.toLowerCase())) ||
          (o.notes && o.notes.toLowerCase().includes(name.toLowerCase()))
        );
        setMySales(myHistoricalSales);
      }
    } catch (err) {
      console.error("Error cargando historial de ventas:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleStartSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!seminaristName.trim() || !parishName.trim()) {
      alert("Por favor selecciona tu nombre y la parroquia donde estás vendiendo.");
      return;
    }
    setIsSessionActive(true);
    loadSeminaristaHistory(seminaristName);
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

    if (paymentMethod !== 'cash' && !paymentProofUrl && !proofPreview) {
      alert("⚠️ Es OBLIGATORIO tomar la foto o adjuntar el capture del comprobante de pago para métodos que no sean efectivo.");
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
                  <option value="">-- Selecciona tu nombre en la lista --</option>
                  {SEMINARY_STAGES.map(stage => {
                    const group = SEMINARISTAS_DIRECTORY.filter(s => s.stage === stage);
                    if (group.length === 0) return null;
                    return (
                      <optgroup key={stage} label={`── ${stage.toUpperCase()} (${group.length}) ──`} className="bg-slate-900 text-amber-300 font-bold">
                        {group.map(s => (
                          <option key={s.id} value={s.name} className="bg-slate-950 text-white font-normal">
                            {s.name} ({s.diocese})
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                  <optgroup label="── OTRAS OPCIONES ──" className="bg-slate-900 text-slate-400 font-bold">
                    <option value="Padre Formador / Encargado" className="bg-slate-950 text-white font-normal">Padre Formador / Encargado</option>
                    <option value="Otro" className="bg-slate-950 text-white font-normal">Otro (Escribir nombre)...</option>
                  </optgroup>
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

              {/* Counters & Tab Navigation */}
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <div className="rounded-2xl bg-slate-950 px-3.5 py-2 text-center border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Total Entradas</span>
                  <span className="text-sm sm:text-base font-black text-amber-400">{totalTicketsSoldByMe}</span>
                </div>
                <div className="rounded-2xl bg-slate-950 px-3.5 py-2 text-center border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Efectivo a Entregar</span>
                  <span className="text-sm sm:text-base font-black text-emerald-400">${totalCashCollected} USD</span>
                </div>
                <button
                  onClick={() => setIsSessionActive(false)}
                  className="text-xs text-slate-400 hover:text-white underline ml-1"
                >
                  Cambiar
                </button>
              </div>
            </div>

            {/* TAB SELECTOR: REGISTRAR VENTA VS HISTORIAL POR DÍA */}
            <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 select-none">
              <button
                type="button"
                onClick={() => setActiveTab('sell')}
                className={`py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'sell'
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 scale-[1.01]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <PlusCircle className="h-4 w-4" />
                <span>Registrar Nueva Venta</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('history');
                  loadSeminaristaHistory(seminaristName);
                }}
                className={`py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'history'
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 scale-[1.01]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span>Mi Historial por Día ({mySales.length})</span>
              </button>
            </div>

            {/* TAB 1: FORMULARIO DE REGISTRO DE VENTA */}
            {activeTab === 'sell' && (
              <div className="space-y-6">
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
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-slate-300 block">
                          Enviar Entradas Digitales con Código QR por WhatsApp:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {lastOrder.tickets.map((t, idx) => {
                            const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhoneForWhatsApp(lastOrder.buyerPhone)}&text=${encodeURIComponent(
                              `🎄 *GRAN PARRANDÓN NAVIDEÑO 2026*\n🏛️ *Seminario Mayor Santo Tomás de Aquino*\n\n¡Paz y bien, estimado(a) *${t.attendeeName || lastOrder.buyerName}*!\n\nAquí tienes tu Pase Digital Oficial para el evento:\n🎟️ *Entrada #${idx + 1} de ${lastOrder.tickets.length}*\n🪑 *Mesa:* ${t.tableId} (Silla #${t.seatNumber})\n🍽️ *Incluye:* 1 Plato Navideño Completo\n\n👉 *Abre tu Pase y Código QR aquí:*\nhttps://parrandon.vercel.app/ticket/${t.ticketCode}\n\n¡Te esperamos el Sábado 12 de Diciembre a las 6:00 PM en el bulevar del Seminario!`
                            )}`;

                            return (
                              <div key={t.id} className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2">
                                <div className="text-xs">
                                  <span className="font-bold text-amber-300 block">Mesa {t.tableId} • Silla #{t.seatNumber}</span>
                                  <span className="text-[10px] text-slate-400 font-mono">{t.ticketCode}</span>
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
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {[1, 2, 3, 4, 5, 10].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setQuantity(n)}
                          className={`py-3 rounded-2xl font-black text-xs sm:text-sm transition-all active:scale-95 whitespace-nowrap min-h-[44px] flex items-center justify-center ${
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
                        placeholder="Ej: 0414-1234567"
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(e.target.value)}
                        className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-300 mb-2">
                      Forma de Pago del Feligrés <span className="text-rose-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'cash', label: '💵 Efectivo (USD)', desc: 'Billetes en mano' },
                        { id: 'pago_movil', label: '📲 Pago Móvil', desc: 'Bs al BCV' },
                        { id: 'zelle', label: '💳 Zelle', desc: 'Dólares directo' },
                        { id: 'binance', label: '🪙 Binance Pay', desc: 'USDT Pay' }
                      ].map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id as any)}
                          className={`p-3 rounded-2xl text-left border transition-all ${
                            paymentMethod === m.id
                              ? 'border-amber-400 bg-amber-500/15 text-white shadow-md shadow-amber-500/10'
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <span className="block text-xs font-bold text-white">{m.label}</span>
                          <span className="text-[10px] text-slate-400">{m.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* CAPTURE PHOTO UPLOAD SECTION FOR NON-CASH METHODS */}
                  {paymentMethod !== 'cash' && (
                    <div className="rounded-2xl border-2 border-amber-500/50 bg-amber-500/5 p-4 space-y-3 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Camera className="h-4 w-4 text-amber-400" />
                          <span className="text-xs font-bold text-amber-300">
                            Capture / Foto del Comprobante <span className="text-rose-400">* OBLIGATORIO</span>
                          </span>
                        </div>
                        {paymentProofUrl && (
                          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                            <Check className="h-3 w-3" /> Foto Cargada
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-300">
                        Toma una foto al teléfono del feligrés o sube el comprobante de pago para validación instantánea:
                      </p>

                      {/* Hidden File Inputs */}
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleCaptureUpload}
                        className="hidden"
                      />
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleCaptureUpload}
                        className="hidden"
                      />

                      {/* Buttons for Camera and Gallery */}
                      {!proofPreview && (
                        <div className="grid grid-cols-2 gap-2.5 pt-1">
                          <button
                            type="button"
                            onClick={() => cameraInputRef.current?.click()}
                            disabled={uploadingProof}
                            className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95 disabled:opacity-50"
                          >
                            <Camera className="h-4 w-4" />
                            <span>Tomar Foto con Cámara</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingProof}
                            className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all active:scale-95 disabled:opacity-50"
                          >
                            <Upload className="h-4 w-4 text-amber-400" />
                            <span>Subir de Galería</span>
                          </button>
                        </div>
                      )}

                      {/* Preview Card */}
                      {proofPreview && (
                        <div className="relative rounded-2xl bg-slate-950 p-2.5 border border-amber-500/40 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0">
                              <img
                                src={proofPreview}
                                alt="Capture de pago"
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 text-left">
                              <span className="text-xs font-bold text-white block truncate">
                                Foto del Comprobante
                              </span>
                              <span className="text-[10px] text-slate-400 block truncate">
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
              </div>
            )}

            {/* TAB 2: HISTORIAL POR DÍA POR SEMINARISTA */}
            {activeTab === 'history' && (
              <div className="space-y-6 animate-fadeIn">
                
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-3xl border border-slate-800">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-amber-400" />
                      Historial Diario de Ventas • {seminaristName}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Consulta organizada por fecha para cuadre de caja y rendición de cuentas.
                    </p>
                  </div>
                  <button
                    onClick={() => loadSeminaristaHistory(seminaristName)}
                    disabled={loadingHistory}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 w-fit"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loadingHistory ? 'animate-spin text-amber-400' : ''}`} />
                    <span>Actualizar</span>
                  </button>
                </div>

                {loadingHistory ? (
                  <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                    <Loader2 className="h-6 w-6 animate-spin text-amber-400 mx-auto" />
                    <span>Cargando tu historial diario de ventas...</span>
                  </div>
                ) : mySales.length === 0 ? (
                  <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 text-center text-xs text-slate-400 space-y-2">
                    <Calendar className="h-8 w-8 text-slate-600 mx-auto" />
                    <strong className="text-white text-sm block">Aún no tienes ventas registradas</strong>
                    <p>Las ventas que registres en las iglesias aparecerán aquí agrupadas automáticamente por día.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {(() => {
                      // Group sales by day
                      const daysMap: Record<string, { dateKey: string; formattedDate: string; orders: Order[]; totalTickets: number; cashTotal: number; digitalTotal: number; totalUsd: number }> = {};

                      mySales.forEach(order => {
                        const dateKey = order.createdAt ? order.createdAt.split('T')[0] : 'Hoy';
                        const d = order.createdAt ? new Date(order.createdAt) : new Date();
                        const formatted = d.toLocaleDateString('es-VE', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        });
                        const formattedCapitalized = formatted.charAt(0).toUpperCase() + formatted.slice(1);

                        if (!daysMap[dateKey]) {
                          daysMap[dateKey] = {
                            dateKey,
                            formattedDate: formattedCapitalized,
                            orders: [],
                            totalTickets: 0,
                            cashTotal: 0,
                            digitalTotal: 0,
                            totalUsd: 0
                          };
                        }

                        const tCount = order.quantity || (order.seats?.length ?? 0) || 1;
                        const usdVal = order.convertedUsd || order.amountPaid || (tCount * ticketPrice);

                        daysMap[dateKey].orders.push(order);
                        daysMap[dateKey].totalTickets += tCount;
                        if (order.paymentMethod === 'cash') {
                          daysMap[dateKey].cashTotal += usdVal;
                        } else {
                          daysMap[dateKey].digitalTotal += usdVal;
                        }
                        daysMap[dateKey].totalUsd += usdVal;
                      });

                      const sortedDays = Object.values(daysMap).sort((a, b) => b.dateKey.localeCompare(a.dateKey));

                      return sortedDays.map((dayGroup) => (
                        <div key={dayGroup.dateKey} className="rounded-3xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
                          {/* DAY HEADER BANNER */}
                          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                                <Calendar className="h-4 w-4" />
                              </div>
                              <div>
                                <h4 className="text-sm font-black text-white">
                                  {dayGroup.formattedDate}
                                </h4>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {dayGroup.orders.length} {dayGroup.orders.length === 1 ? 'operación' : 'operaciones'}
                                </span>
                              </div>
                            </div>

                            {/* Day Summary Badges */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs">
                                🎟️ {dayGroup.totalTickets} Entradas
                              </span>
                              <span className="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-xs">
                                💵 Efectivo: ${dayGroup.cashTotal}
                              </span>
                              {dayGroup.digitalTotal > 0 && (
                                <span className="px-3 py-1 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300 font-bold text-xs">
                                  📲 Digital: ${dayGroup.digitalTotal}
                                </span>
                              )}
                              <span className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-700 text-white font-black text-xs font-mono">
                                Total: ${dayGroup.totalUsd} USD
                              </span>
                            </div>
                          </div>

                          {/* LIST OF SALES IN THIS DAY */}
                          <div className="divide-y divide-slate-800/60 p-2 sm:p-4 space-y-2">
                            {dayGroup.orders.map((order) => (
                              <div key={order.id} className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors">
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <strong className="text-white text-xs sm:text-sm font-bold truncate">
                                      {order.buyerName}
                                    </strong>
                                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                                      {order.id}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                                      order.paymentMethod === 'cash'
                                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                                        : 'bg-sky-950/80 text-sky-300 border border-sky-800'
                                    }`}>
                                      {order.paymentMethod === 'cash' ? '💵 Efectivo' : `📲 ${order.paymentMethod}`}
                                    </span>
                                  </div>

                                  <div className="text-[11px] text-slate-300 flex items-center gap-2 flex-wrap">
                                    <span className="text-amber-300 font-semibold">
                                      {order.quantity || order.seats?.length} Entrada(s):
                                    </span>
                                    <span>
                                      {order.seats && order.seats.length > 0 
                                        ? order.seats.map(s => `M${s.tableId}-S${s.seatNumber}`).join(', ')
                                        : 'Mesa asignada'}
                                    </span>
                                    <span className="text-slate-500">•</span>
                                    <span className="text-emerald-400 font-mono font-bold">
                                      ${order.convertedUsd || order.amountPaid} USD
                                    </span>
                                  </div>

                                  {/* Payment proof thumbnail if digital */}
                                  {order.paymentProofUrl && (
                                    <div className="pt-1 flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setViewProofModal(order.paymentProofUrl!)}
                                        className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-300 bg-sky-950/60 hover:bg-sky-900 border border-sky-800 px-2 py-1 rounded-lg transition-colors"
                                      >
                                        <ImageIcon className="h-3 w-3" />
                                        <span>Ver Capture de Pago</span>
                                      </button>
                                      {order.paymentReference && (
                                        <span className="text-[10px] font-mono text-slate-400">
                                          Ref: {order.paymentReference}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Re-send WhatsApp Link Buttons */}
                                <div className="shrink-0 flex items-center gap-1.5 w-full sm:w-auto">
                                  {order.tickets && order.tickets.length > 0 ? (
                                    <a
                                      href={`https://api.whatsapp.com/send?phone=${cleanPhoneForWhatsApp(order.buyerPhone)}&text=${encodeURIComponent(
                                        `🎄 *GRAN PARRANDÓN NAVIDEÑO 2026*\n🏛️ *Seminario Mayor Santo Tomás de Aquino*\n\n¡Paz y bien, estimado(a) *${order.buyerName}*!\n\nAquí tienes el enlace a tu orden y entradas con Código QR:\n👉 https://parrandon.vercel.app/orden/${order.id}\n\n¡Nos vemos el Sábado 12 de Diciembre!`
                                      )}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-emerald-700 hover:text-white text-emerald-300 font-bold text-[11px] border border-emerald-500/30 transition-all"
                                    >
                                      <Share2 className="h-3.5 w-3.5" />
                                      <span>Reenviar WhatsApp</span>
                                    </a>
                                  ) : (
                                    <Link
                                      href={`/orden/${order.id}`}
                                      target="_blank"
                                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] border border-slate-700 transition-all"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5 text-amber-400" />
                                      <span>Ver Orden</span>
                                    </Link>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* FULLSCREEN PAYMENT PROOF PREVIEW MODAL */}
            {viewProofModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-fadeIn">
                <div className="relative max-w-lg w-full bg-slate-900 rounded-3xl border border-slate-700 p-4 text-center space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-amber-400" />
                      Comprobante / Capture de Pago
                    </span>
                    <button
                      onClick={() => setViewProofModal(null)}
                      className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="relative max-h-[70vh] overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 flex items-center justify-center">
                    <img
                      src={viewProofModal}
                      alt="Capture de pago ampliado"
                      className="max-h-[70vh] w-auto object-contain rounded-xl"
                    />
                  </div>
                  <button
                    onClick={() => setViewProofModal(null)}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
                  >
                    Cerrar Visor
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
