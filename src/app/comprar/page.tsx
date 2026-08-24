'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EventConfig, PaymentMethod, SeatSelection } from '@/types';
import { formatCurrency } from '@/lib/utils';
import SeatingMap2D from '@/components/SeatingMap2D';
import { 
  Sparkles, 
  Ticket, 
  User, 
  Phone, 
  Mail, 
  CreditCard, 
  Upload, 
  Check, 
  Copy, 
  AlertCircle, 
  Loader2, 
  Utensils, 
  Calendar, 
  ChevronRight, 
  ChevronLeft,
  QrCode,
  MapPin,
  Camera,
  CheckCircle2,
  X
} from 'lucide-react';

export default function ComprarPage() {
  const router = useRouter();

  const [config, setConfig] = useState<EventConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Form State
  const [step, setStep] = useState(1);
  const [selectedSeats, setSelectedSeats] = useState<SeatSelection[]>([]);
  const [quantity, setQuantity] = useState(1);
  
  const [buyerName, setBuyerName] = useState('');
  const [buyerDocId, setBuyerDocId] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [attendees, setAttendees] = useState<Array<{ name: string; docId?: string; tableId?: string; seatNumber?: number }>>([{ name: '' }]);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pago_movil');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState<string>('');
  const [proofFileName, setProofFileName] = useState<string>('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/config');
        const data = await res.json();
        if (data.success && data.config) {
          setConfig(data.config);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingConfig(false);
      }
    }
    loadConfig();
  }, []);

  // Smooth scroll to top whenever the wizard step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const ticketCount = selectedSeats.length > 0 ? selectedSeats.length : quantity;
  const ticketPrice = config?.ticketPriceUsd || 20;
  const rateBs = config?.currentRateBs || 48.50;
  const totalUsd = paymentMethod === 'paypal' ? ticketCount * 21.50 : ticketCount * ticketPrice;
  const totalBs = (ticketCount * ticketPrice) * rateBs;
  const totalUsdt = ticketCount * ticketPrice;

  const [loadingPayPalSdk, setLoadingPayPalSdk] = useState(false);

  const processVerifiedOrder = async (verifiedRef: string) => {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const payload = {
        buyerName,
        buyerEmail,
        buyerPhone,
        buyerDocId,
        quantity: ticketCount,
        seats: selectedSeats,
        attendees: attendees.map((att, i) => ({
          name: att.name.trim() || `${buyerName} (Asistente ${i + 1})`,
          docId: att.docId || '',
          tableId: selectedSeats[i]?.tableId,
          seatNumber: selectedSeats[i]?.seatNumber
        })),
        paymentMethod: 'paypal',
        paymentReference: verifiedRef,
        amountPaid: totalUsd,
        currency: 'USD',
        convertedUsd: totalUsd,
        salesChannel: 'online',
        notes: `Pago verificado y capturado exitosamente por PayPal (${verifiedRef})`
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.order) {
        router.push(`/orden/${data.order.id}`);
      } else {
        setErrorMessage(data.error || "Ocurrió un error al registrar la orden.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Error de conexión al procesar la orden.");
    } finally {
      setSubmitting(false);
    }
  };

  // Dynamically load PayPal SDK and render Smart Buttons
  useEffect(() => {
    if (paymentMethod === 'paypal' && step === 3) {
      const scriptId = 'paypal-smart-sdk';
      const clientId = config?.paymentDetails.paypal?.clientId || 'BAAycXcLnxs_Yony3FAFx25j6r-6tmdRUKdvVQgyPb-6VTIgWmsgSBjWzNZtdy9TzJn5pnKaGEIUtfCVyg';

      const renderSmartButtons = () => {
        const win = window as any;
        const container = document.getElementById('paypal-smart-button-container');
        if (win.paypal && win.paypal.Buttons && container) {
          container.innerHTML = '';
          setLoadingPayPalSdk(false);
          try {
            win.paypal.Buttons({
              style: {
                layout: 'vertical',
                color: 'gold',
                shape: 'rect',
                label: 'paypal',
                height: 48
              },
              createOrder: (_data: any, actions: any) => {
                return actions.order.create({
                  purchase_units: [{
                    description: `Parrandón Navideño 2026 - ${ticketCount} Entrada(s) Bulevar`,
                    amount: {
                      currency_code: 'USD',
                      value: (ticketCount * 21.50).toFixed(2)
                    }
                  }]
                });
              },
              onApprove: async (data: any, actions: any) => {
                setSubmitting(true);
                try {
                  const capture = await actions.order.capture();
                  if (capture.status === 'COMPLETED' || data.orderID) {
                    await processVerifiedOrder(capture.id || data.orderID);
                  } else {
                    alert('El pago no fue completado en PayPal.');
                    setSubmitting(false);
                  }
                } catch (err) {
                  console.error('Error al capturar orden PayPal:', err);
                  alert('Ocurrió un error al verificar el pago con PayPal.');
                  setSubmitting(false);
                }
              },
              onError: (err: any) => {
                console.error('Error PayPal SDK:', err);
                setErrorMessage('Error al conectar con la pasarela de PayPal.');
              }
            }).render('#paypal-smart-button-container');
          } catch (e) {
            console.error('Error rendering PayPal Buttons:', e);
          }
        }
      };

      setLoadingPayPalSdk(true);
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&disable-funding=venmo`;
        script.crossOrigin = 'anonymous';
        script.async = true;
        script.onload = () => {
          setTimeout(renderSmartButtons, 300);
        };
        document.body.appendChild(script);
      } else {
        setTimeout(renderSmartButtons, 300);
      }
    }
  }, [paymentMethod, step, config, ticketCount, buyerName, buyerPhone, buyerEmail, buyerDocId, selectedSeats, attendees]);

  // Update attendees when seats change
  const handleSeatsChange = (seats: SeatSelection[]) => {
    setSelectedSeats(seats);
    setQuantity(seats.length || 1);

    setAttendees(prev => {
      return seats.map((seat, idx) => ({
        name: prev[idx]?.name || (idx === 0 ? buyerName : ''),
        docId: prev[idx]?.docId || '',
        tableId: seat.tableId,
        seatNumber: seat.seatNumber
      }));
    });
  };

  const handleBuyerNameChange = (val: string) => {
    setBuyerName(val);
    setAttendees(prev => {
      const next = [...prev];
      if (next.length > 0 && (!next[0].name || next[0].name === buyerName)) {
        next[0].name = val;
      }
      return next;
    });
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("El archivo no debe superar 5MB.");
      return;
    }

    setProofFileName(file.name);

    // Intentar subida a Supabase Storage mediante /api/upload-proof
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('orderId', `ONLINE_${buyerPhone.replace(/\D/g, '') || Date.now()}`);

      const res = await fetch('/api/upload-proof', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success && data.url) {
        setPaymentProofUrl(data.url);
        return;
      }
    } catch (err) {
      console.warn('Error subiendo comprobante a Storage, usando fallback base64:', err);
    }

    // Fallback local a base64
    const reader = new FileReader();
    reader.onload = () => {
      setPaymentProofUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!buyerName.trim() || !buyerPhone.trim()) {
      setErrorMessage("Por favor completa tu nombre y número de WhatsApp.");
      return;
    }

    const refToUse = paymentMethod === 'paypal'
      ? (paymentReference.trim() || `PAYPAL-${buyerPhone.replace(/\D/g, '').slice(-8) || Date.now().toString().slice(-6)}`)
      : (paymentReference.trim() || `${paymentMethod.toUpperCase()}-CAPTURE-${buyerPhone.replace(/\D/g, '').slice(-4) || Date.now().toString().slice(-4)}`);

    if (paymentMethod !== 'paypal' && !paymentProofUrl) {
      setErrorMessage("⚠️ Es OBLIGATORIO adjuntar el capture o foto del comprobante de pago para procesar tu orden.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        buyerName,
        buyerEmail,
        buyerPhone,
        buyerDocId,
        quantity: ticketCount,
        seats: selectedSeats,
        attendees: attendees.map((att, i) => ({
          name: att.name.trim() || `${buyerName} (Asistente ${i + 1})`,
          docId: att.docId || '',
          tableId: selectedSeats[i]?.tableId,
          seatNumber: selectedSeats[i]?.seatNumber
        })),
        paymentMethod,
        paymentReference: refToUse,
        paymentProofUrl,
        amountPaid: paymentMethod === 'pago_movil' ? totalBs : totalUsd,
        currency: paymentMethod === 'pago_movil' ? 'VES' : paymentMethod === 'binance' ? 'USDT' : 'USD',
        convertedUsd: totalUsd,
        rateApplied: paymentMethod === 'pago_movil' ? rateBs : undefined,
        salesChannel: 'online',
        notes
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.order) {
        router.push(`/orden/${data.order.id}`);
      } else {
        setErrorMessage(data.error || "Ocurrió un error al registrar la orden.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Error de conexión al procesar la orden.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingConfig) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-center">
        <Loader2 className="h-8 w-8 text-amber-400 animate-spin mb-2" />
        <span className="text-sm text-slate-400 block ml-2">Cargando Bulevar y pasarela...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-8 pb-44 px-4 sm:px-6 bg-slate-950">
      <div className="max-w-5xl mx-auto">
        
        {/* Step Indicator */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between max-w-md mx-auto relative px-2">
            <div className="absolute left-4 right-4 top-4.5 sm:top-5 h-0.5 bg-slate-800 -z-0" />
            <div
              className="absolute left-4 top-4.5 sm:top-5 h-0.5 bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300 -z-0"
              style={{ width: `${((step - 1) / 2) * 88}%` }}
            />

            {[
              { num: 1, shortTitle: 'Sillas', title: 'Mesas & Sillas' },
              { num: 2, shortTitle: 'Datos', title: 'Datos Asistentes' },
              { num: 3, shortTitle: 'Pago', title: 'Pago Seguro' }
            ].map((s) => (
              <button
                key={s.num}
                type="button"
                onClick={() => s.num < step && setStep(s.num)}
                className={`relative z-10 flex flex-col items-center group cursor-pointer ${
                  s.num <= step ? 'text-amber-400' : 'text-slate-500'
                }`}
              >
                <div
                  className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    s.num === step
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/40 ring-4 ring-amber-500/20'
                      : s.num < step
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {s.num < step ? <Check className="h-4 w-4" /> : s.num}
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold mt-1">
                  <span className="inline sm:hidden">{s.shortTitle}</span>
                  <span className="hidden sm:inline">{s.title}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* STEP 1: 2D SEATING MAP SELECTION */}
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center mb-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300 mb-1">
                <Sparkles className="h-3.5 w-3.5" />
                Paso 1 de 3
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Selecciona tus Mesas y Sillas en el Bulevar
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-xl mx-auto">
                Elige tu ubicación favorita en el croquis 2D. Cada silla reservada incluye un plato navideño completo.
              </p>
            </div>

            {/* Interactive 2D Map */}
            <SeatingMap2D
              selectedSeats={selectedSeats}
              onSeatsChange={handleSeatsChange}
              maxSelectable={10}
            />

            {/* Bottom Static Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <span className="text-xs text-slate-400 text-center sm:text-left">
                {selectedSeats.length === 0
                  ? 'Por favor selecciona al menos 1 silla en el mapa.'
                  : `Has seleccionado ${selectedSeats.length} asiento(s).`}
              </span>

              <button
                type="button"
                disabled={selectedSeats.length === 0}
                onClick={() => setStep(2)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-400 px-6 sm:px-8 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-slate-950 transition-all shadow-xl shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Continuar con Datos ({selectedSeats.length} Asientos)</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* FLOATING ACTION BAR FOR STEP 1 */}
        {step === 1 && selectedSeats.length > 0 && (
          <div className="fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 border-t-2 border-amber-500/80 p-3 sm:p-4 shadow-2xl backdrop-blur-lg animate-fadeIn">
            <div className="max-w-4xl mx-auto flex flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs sm:text-sm shrink-0 border border-amber-500/40">
                  {selectedSeats.length}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-black text-white block truncate">
                    {selectedSeats.length === 1 ? '1 Asiento' : `${selectedSeats.length} Asientos`}
                  </span>
                  <div className="text-[10px] sm:text-[11px] text-amber-300 font-mono truncate max-w-[120px] xs:max-w-[180px] sm:max-w-md">
                    {selectedSeats.map(s => `M${s.tableId}-S${s.seatNumber}`).join(', ')}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-[9px] sm:text-[10px] text-slate-400 block uppercase font-bold">Total:</span>
                  <span className="text-base sm:text-xl font-black text-emerald-400">${selectedSeats.length * ticketPrice}.00 USD</span>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-4 sm:px-8 py-2.5 sm:py-3.5 text-xs sm:text-sm font-black text-slate-950 transition-all shadow-xl shadow-amber-500/30 hover:scale-105"
                >
                  <span>Continuar</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: BUYER & ATTENDEE DATA */}
        {step === 2 && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 shadow-2xl space-y-6 animate-fadeIn">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Paso 2 de 3 • Datos del Comprador
              </span>
              <h2 className="text-2xl font-bold text-white mt-1">
                Información de Contacto y Asistentes
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nombre Completo <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Ej: Anabella Gómez"
                    value={buyerName}
                    onChange={(e) => handleBuyerNameChange(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Teléfono WhatsApp <span className="text-rose-400">*</span>
                  <span className="text-[10px] text-slate-400 block font-normal">(Para enviarte las entradas con QR)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 h-4 w-4 text-emerald-400" />
                  <input
                    type="tel"
                    required
                    placeholder="Ej: 0414-1234567 (sin código +58)"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Correo Electrónico (Opcional)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    placeholder="ejemplo@correo.com"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>

            {/* Asignación de Nombres por Asiento Seleccionado */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h3 className="text-xs font-bold text-slate-300">
                Nombres en cada entrada según tu selección de sillas:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedSeats.map((seat, index) => (
                  <div key={`${seat.tableId}-${seat.seatNumber}`} className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-300 mb-1">
                      <span>Asiento #{index + 1}:</span>
                      <span className="text-emerald-400">Mesa {seat.tableId} • Silla {seat.seatNumber}</span>
                    </div>
                    <input
                      type="text"
                      placeholder={`Nombre del Asistente #${index + 1}`}
                      value={attendees[index]?.name || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAttendees(prev => {
                          const next = [...prev];
                          next[index] = { ...next[index], name: val };
                          return next;
                        });
                      }}
                      className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Modificar Sillas</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!buyerName.trim() || !buyerPhone.trim()) {
                    alert("Por favor completa tu nombre y WhatsApp antes de continuar.");
                    return;
                  }
                  setStep(3);
                }}
                className="flex items-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-400 px-8 py-3.5 text-sm font-bold text-slate-950 transition-all shadow-lg shadow-amber-500/20"
              >
                <span>Continuar a Pago</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PAYMENT & PROOF */}
        {step === 3 && (
          <form onSubmit={handleSubmitOrder} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 shadow-2xl space-y-6 animate-fadeIn">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Paso 3 de 3 • Pasarela de Pago
              </span>
              <h2 className="text-2xl font-bold text-white mt-1">
                Realiza tu Pago y Adjunta el Comprobante
              </h2>
            </div>

            {/* Selected Seats summary */}
            <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block">Ubicación Reservada:</span>
                <strong className="text-amber-300">
                  {selectedSeats.map(s => `Mesa ${s.tableId}-S${s.seatNumber}`).join(', ')}
                </strong>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block">Total a Pagar:</span>
                <strong className="text-emerald-400 text-base font-black">
                  ${totalUsd.toFixed(2)} USD
                </strong>
              </div>
            </div>

            {/* Payment Method Selector (Sin Taquilla en Online) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {[
                { id: 'pago_movil', label: 'Pago Móvil', icon: '📱', sub: `Bs. ${totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}` },
                { id: 'paypal', label: 'PayPal / Tarjetas', icon: '💳', sub: `$${(ticketCount * 21.50).toFixed(2)} USD` },
                { id: 'zelle', label: 'Zelle', icon: '💵', sub: `$${(ticketCount * ticketPrice).toFixed(2)} USD` },
                { id: 'binance', label: 'Binance Pay', icon: '🪙', sub: `${ticketCount * ticketPrice} USDT` }
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                  className={`p-2.5 sm:p-3.5 rounded-2xl border text-center transition-all ${
                    paymentMethod === m.id
                      ? 'border-amber-500 bg-amber-500/15 text-white ring-2 ring-amber-500/40 shadow-lg'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span className="text-xl sm:text-2xl block mb-0.5 sm:mb-1">{m.icon}</span>
                  <span className="text-[11px] sm:text-xs font-bold block">{m.label}</span>
                  <span className="text-[9px] sm:text-[10px] text-amber-300/80 font-mono mt-0.5 block truncate">{m.sub}</span>
                </button>
              ))}
            </div>

            {/* Bank details card */}
            <div className="rounded-2xl border border-amber-500/30 bg-slate-950 p-3.5 sm:p-5 space-y-3">
              {paymentMethod === 'pago_movil' && config?.paymentDetails.pagoMovil && (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400">📱 Datos de Pago Móvil:</span>
                    <span className="text-[11px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                      Tasa: Bs. {rateBs}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 pt-1">
                    <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl">
                      <span><strong>Banco:</strong> {config.paymentDetails.pagoMovil.bank}</span>
                      <button type="button" onClick={() => handleCopy(config.paymentDetails.pagoMovil.bank, 'bank')} className="text-slate-400 hover:text-white">
                        {copiedKey === 'bank' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl">
                      <span><strong>Teléfono:</strong> {config.paymentDetails.pagoMovil.phone}</span>
                      <button type="button" onClick={() => handleCopy(config.paymentDetails.pagoMovil.phone, 'phone')} className="text-slate-400 hover:text-white">
                        {copiedKey === 'phone' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl">
                      <span><strong>RIF / C.I.:</strong> {config.paymentDetails.pagoMovil.docId}</span>
                      <button type="button" onClick={() => handleCopy(config.paymentDetails.pagoMovil.docId, 'docId')} className="text-slate-400 hover:text-white">
                        {copiedKey === 'docId' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl">
                      <span><strong>Monto Exacto:</strong> Bs. {totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                      <button type="button" onClick={() => handleCopy(totalBs.toFixed(2), 'monto')} className="text-slate-400 hover:text-white">
                        {copiedKey === 'monto' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'paypal' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-400 flex items-center gap-1.5">
                      💳 Pagar con PayPal o Tarjeta ($21.50 c/u):
                    </span>
                    <span className="text-[11px] bg-sky-950 text-sky-300 border border-sky-500/30 px-2.5 py-0.5 rounded-full font-bold">
                      Total: ${totalUsd.toFixed(2)} USD
                    </span>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-4">
                    <p className="text-slate-300 text-xs">
                      Paga de forma 100% segura con tu saldo de PayPal o directamente con cualquier tarjeta de débito/crédito internacional (Visa, Mastercard, Amex):
                    </p>

                    {/* PayPal Smart Buttons Interactive Container */}
                    <div className="flex flex-col items-center justify-center p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                      {loadingPayPalSdk && (
                        <div className="flex items-center gap-2 text-slate-400 text-xs py-4">
                          <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
                          <span>Cargando pasarela segura de PayPal...</span>
                        </div>
                      )}
                      <div id="paypal-smart-button-container" className="w-full max-w-sm"></div>

                      <span className="text-[10px] text-slate-400 text-center block pt-1">
                        🔒 Los fondos se verifican y capturan en tiempo real con PayPal. Tus entradas se emitirán inmediatamente al completar el pago.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'zelle' && config?.paymentDetails.zelle && (
                <div className="space-y-2 text-xs">
                  <span className="font-bold text-amber-400 block">💵 Datos para Zelle ($20 c/u):</span>
                  <div className="bg-slate-900 p-3 rounded-xl flex items-center justify-between">
                    <span><strong>Correo:</strong> {config.paymentDetails.zelle.email}</span>
                    <button type="button" onClick={() => handleCopy(config.paymentDetails.zelle.email, 'z_email')}>
                      {copiedKey === 'z_email' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                    </button>
                  </div>
                </div>
              )}

              {paymentMethod === 'binance' && config?.paymentDetails.binance && (
                <div className="space-y-2 text-xs">
                  <span className="font-bold text-amber-400 block">🪙 Datos para Binance Pay ($20 c/u):</span>
                  <div className="bg-slate-900 p-3 rounded-xl flex items-center justify-between">
                    <span><strong>Binance Pay ID:</strong> {config.paymentDetails.binance.payId}</span>
                    <button type="button" onClick={() => handleCopy(config.paymentDetails.binance.payId, 'b_id')}>
                      {copiedKey === 'b_id' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* MANDATORY PAYMENT PROOF / CAPTURE */}
            {paymentMethod !== 'paypal' && (
              <div className="rounded-2xl bg-slate-950 p-4 border-2 border-amber-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Camera className="h-4 w-4 text-amber-400" />
                    <span>Capture del Comprobante de Pago</span>
                    <span className="text-rose-400 font-extrabold">* OBLIGATORIO</span>
                  </label>
                </div>

                {!paymentProofUrl ? (
                  <div className="space-y-2">
                    <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-700 hover:border-amber-400 rounded-2xl cursor-pointer bg-slate-900/60 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Upload className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-bold text-white block">Toca aquí para subir o tomar foto del capture</span>
                          <span className="text-[10px] text-slate-400">PNG, JPG, JPEG o captura de pantalla (hasta 5MB)</span>
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        required
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-slate-900 p-3.5 rounded-xl border border-emerald-500/50 animate-fadeIn">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-emerald-400 bg-black shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={paymentProofUrl}
                          alt="Capture subido"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Capture adjunto correctamente</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono truncate max-w-[200px] block">
                          {proofFileName || 'comprobante_adjunto.jpg'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setPaymentProofUrl('');
                        setProofFileName('');
                      }}
                      className="p-1.5 rounded-lg bg-rose-950/60 text-rose-400 hover:bg-rose-900 border border-rose-800"
                      title="Cambiar capture"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {errorMessage && (
              <div className="rounded-xl bg-rose-950/60 border border-rose-500/40 p-3 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Atrás</span>
              </button>

              {paymentMethod === 'paypal' ? (
                <div className="text-right">
                  <span className="text-[11px] text-amber-300 font-bold flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    Completa el pago arriba con PayPal o Tarjeta
                  </span>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-8 py-3.5 text-sm font-black text-slate-950 transition-all shadow-xl shadow-amber-500/25 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Registrando Orden...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Finalizar y Registrar Pago</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
