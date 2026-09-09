'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Heart, 
  X, 
  Sparkles, 
  Phone, 
  User, 
  Camera, 
  Upload, 
  Copy, 
  Check, 
  Loader2, 
  Share2, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { EventConfig, Order, PaymentMethod } from '@/types';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AMOUNTS = [10, 25, 50, 100, 200];

export default function DonationModal({ isOpen, onClose }: DonationModalProps) {
  const [config, setConfig] = useState<EventConfig | null>(null);
  const [rateBs, setRateBs] = useState<number>(897.82);

  // Form states
  const [selectedAmount, setSelectedAmount] = useState<number>(25);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [donorName, setDonorName] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [intentionMessage, setIntentionMessage] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pago_movil');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState<string>('');
  const [proofFileName, setProofFileName] = useState<string>('');
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/config');
        const data = await res.json();
        if (data.success && data.config) {
          setConfig(data.config);
          if (data.config.currentRateBs) setRateBs(data.config.currentRateBs);
        }
      } catch (err) {
        console.error(err);
      }
    }
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const effectiveUsd = customAmount ? Math.max(1, Number(customAmount) || 0) : selectedAmount;
  const effectiveBs = effectiveUsd * rateBs;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Por favor selecciona una imagen válida (JPG o PNG).");
      return;
    }

    setProofFileName(file.name);
    const localPreview = URL.createObjectURL(file);
    setProofPreview(localPreview);

    setUploadingProof(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('orderId', `DONACION_${donorPhone.replace(/\D/g, '') || Date.now()}`);

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
      console.warn("Error subiendo a Supabase Storage, usando fallback local:", err);
    } finally {
      setUploadingProof(false);
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPaymentProofUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveProof = () => {
    setPaymentProofUrl('');
    setProofFileName('');
    setProofPreview(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!donorName.trim() || !donorPhone.trim()) {
      setErrorMessage("Por favor ingresa tu nombre y teléfono WhatsApp.");
      return;
    }

    if (paymentMethod !== 'cash' && !paymentProofUrl && !proofPreview) {
      setErrorMessage("⚠️ Es OBLIGATORIO tomar la foto o adjuntar el capture del comprobante de pago.");
      return;
    }

    setSubmitting(true);

    try {
      const refToUse = paymentRef.trim() || `${paymentMethod.toUpperCase()}-OFRENDA-${Date.now().toString().slice(-4)}`;
      const notesContent = intentionMessage.trim() 
        ? `[DONACIÓN BENÉFICA WEB - FILA CERO] Intención de oración: "${intentionMessage.trim()}"`
        : `[DONACIÓN BENÉFICA WEB - FILA CERO] Ofrenda solidaria para el Seminario.`;

      const payload = {
        buyerName: donorName.trim(),
        buyerPhone: donorPhone.trim(),
        buyerEmail: donorEmail.trim() || '',
        quantity: 0,
        isDonation: true,
        donationAmount: effectiveUsd,
        seats: [],
        attendees: [],
        paymentMethod,
        paymentReference: refToUse,
        paymentProofUrl: paymentProofUrl || proofPreview || undefined,
        amountPaid: paymentMethod === 'pago_movil' ? effectiveBs : effectiveUsd,
        currency: paymentMethod === 'pago_movil' ? 'VES' : paymentMethod === 'binance' ? 'USDT' : 'USD',
        convertedUsd: effectiveUsd,
        rateApplied: rateBs,
        salesChannel: 'online',
        notes: notesContent
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.order) {
        setCompletedOrder(data.order);
      } else {
        setErrorMessage(data.error || "No se pudo registrar la donación. Por favor intenta nuevamente.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Ocurrió un error al procesar tu ofrenda. Verifica tu conexión a internet.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setCompletedOrder(null);
    setDonorName('');
    setDonorPhone('');
    setDonorEmail('');
    setIntentionMessage('');
    setPaymentRef('');
    handleRemoveProof();
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-3xl border border-rose-500/40 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 shadow-2xl my-6 overflow-hidden">
        
        {/* Decorative Top Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-36 bg-rose-500/15 blur-3xl pointer-events-none rounded-full" />

        {/* Modal Header */}
        <div className="relative p-5 sm:p-6 border-b border-white/[0.08] flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
              <Heart className="h-6 w-6 fill-rose-500/20 animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-[10px] font-bold text-rose-300 uppercase tracking-wider mb-1">
                <Sparkles className="h-3 w-3" />
                Fila Cero • Donación Benéfica
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                Ofrenda para el Seminario Mayor
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Santo Tomás de Aquino • Arquidiócesis de Maracaibo
              </p>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors shrink-0"
            title="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* COMPLETED SUCCESS STATE */}
        {completedOrder ? (
          <div className="p-6 sm:p-8 space-y-6 text-center animate-fadeIn">
            <div className="relative h-20 w-16 mx-auto filter drop-shadow-[0_4px_16px_rgba(244,63,94,0.3)]">
              <Image
                src="/images/seminario-logo.png"
                alt="Seminario Santo Tomás de Aquino"
                fill
                sizes="64px"
                className="object-contain"
              />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ¡Ofrenda Recibida con Éxito!
              </div>
              <h3 className="text-2xl font-black text-white">
                ¡Que Dios Bendiga Tu Generosidad!
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                Estimado(a) <strong>{completedOrder.buyerName}</strong>, tu aporte de <strong className="text-rose-400 font-mono text-base">${completedOrder.convertedUsd || completedOrder.amountPaid} USD</strong> ha sido registrado para la formación sacerdotal de nuestros seminaristas.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 max-w-sm mx-auto text-left text-xs space-y-2 font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Comprobante:</span>
                <strong className="text-amber-400">{completedOrder.id}</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Método:</span>
                <span className="text-white uppercase">{completedOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Modalidad:</span>
                <span className="text-rose-300">Fila Cero (Sin Asiento)</span>
              </div>
            </div>

            {/* Direct WhatsApp Action Button */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto pt-2">
              <a
                href={`https://api.whatsapp.com/send?phone=584120308674&text=${encodeURIComponent(
                  `❤️ *CONFIRMACIÓN DE DONACIÓN - PARRANDÓN 2026*\n🏛️ *Seminario Mayor Santo Tomás de Aquino*\n\n¡La paz del Señor! He realizado una ofrenda benéfica de *$${completedOrder.convertedUsd || completedOrder.amountPaid} USD*.\n\n👤 Donante: *${completedOrder.buyerName}*\n📋 N° de Orden: *#${completedOrder.id}*\n\n¡Que Dios bendiga la formación de los futuros sacerdotes! 🙏`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3.5 text-xs font-bold text-white shadow-xl shadow-emerald-950/50 transition-all hover:scale-105"
              >
                <Share2 className="h-4 w-4" />
                <span>Notificar por WhatsApp a Administración</span>
              </a>

              <Link
                href={`/orden/${completedOrder.id}`}
                target="_blank"
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-2xl bg-slate-800 hover:bg-slate-700 px-5 py-3.5 text-xs font-bold text-slate-200 transition-all border border-slate-700"
              >
                <ExternalLink className="h-4 w-4 text-amber-400" />
                <span>Ver Comprobante Web</span>
              </Link>
            </div>

            <button
              type="button"
              onClick={handleResetAndClose}
              className="text-xs text-slate-400 hover:text-white underline pt-2 block mx-auto"
            >
              Cerrar esta ventana
            </button>
          </div>
        ) : (
          /* DONATION FORM */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            
            {/* Friendly Note */}
            <div className="rounded-2xl border border-rose-500/20 bg-rose-950/30 p-3.5 text-xs text-rose-200/90 leading-relaxed">
              ❤️ <strong>Fila Cero:</strong> Esta modalidad es exclusivamente una donación caritativa para quienes no pueden asistir o desean apoyar las obras del Seminario. <em>No incluye plato navideño ni reserva de mesa en el Bulevar.</em>
            </div>

            {/* STEP 1: SELECT AMOUNT */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-white uppercase tracking-wider">
                1. Selecciona el Monto de tu Ofrenda (USD)
              </label>
              
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {PRESET_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setSelectedAmount(amt);
                      setCustomAmount('');
                    }}
                    className={`py-3 px-2 rounded-2xl border text-center font-bold text-sm transition-all ${
                      !customAmount && selectedAmount === amt
                        ? 'border-rose-400 bg-rose-500/20 text-white ring-2 ring-rose-500/40 shadow-lg shadow-rose-950/40 scale-105'
                        : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    ${amt} USD
                  </button>
                ))}
              </div>

              {/* Custom amount input */}
              <div className="pt-1">
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="O escribe otro monto en USD (Ej: 15, 30, 75...)"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-7 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-400"
                  />
                </div>
              </div>

              {/* Converted rate pill */}
              <div className="flex items-center justify-between text-xs px-2 pt-1 text-slate-400">
                <span>Equivalente en Bolívares:</span>
                <span className="text-rose-300 font-bold font-mono">
                  Bs. {effectiveBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-[10px] text-slate-500 ml-1">(Tasa: {rateBs})</span>
                </span>
              </div>
            </div>

            {/* STEP 2: DONOR INFO (NO CÉDULA) */}
            <div className="space-y-3 pt-3 border-t border-slate-800/80">
              <label className="block text-xs font-bold text-white uppercase tracking-wider">
                2. Datos del Donante
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Nombre Completo o Familia <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="Ej: Familia Morán González"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-rose-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Teléfono WhatsApp <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-emerald-400" />
                    <input
                      type="tel"
                      required
                      placeholder="Ej: 0414-1234567"
                      value={donorPhone}
                      onChange={(e) => setDonorPhone(e.target.value)}
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-rose-400"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Intención de Oración o Mensaje al Seminario (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Por la salud de mi familia / En acción de gracias..."
                  value={intentionMessage}
                  onChange={(e) => setIntentionMessage(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-400"
                />
              </div>
            </div>

            {/* STEP 3: PAYMENT METHOD */}
            <div className="space-y-3 pt-3 border-t border-slate-800/80">
              <label className="block text-xs font-bold text-white uppercase tracking-wider">
                3. Método de Pago
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'pago_movil', label: 'Pago Móvil', icon: '📱', sub: `Bs. ${effectiveBs.toLocaleString('es-VE', { maximumFractionDigits: 0 })}` },
                  { id: 'zelle', label: 'Zelle', icon: '💵', sub: `$${effectiveUsd} USD` },
                  { id: 'binance', label: 'Binance Pay', icon: '🪙', sub: `${effectiveUsd} USDT` },
                  { id: 'cash', label: 'Efectivo', icon: '🤝', sub: `$${effectiveUsd} USD` }
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                    className={`p-2.5 rounded-2xl border text-center transition-all ${
                      paymentMethod === m.id
                        ? 'border-rose-400 bg-rose-500/15 text-white ring-2 ring-rose-500/30 shadow-md'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xl block mb-0.5">{m.icon}</span>
                    <span className="text-xs font-bold block">{m.label}</span>
                    <span className="text-[9px] text-rose-300 font-mono">{m.sub}</span>
                  </button>
                ))}
              </div>

              {/* Bank Details Display Card */}
              <div className="rounded-2xl border border-rose-500/30 bg-slate-950 p-4 space-y-2.5 text-xs">
                {paymentMethod === 'pago_movil' && config?.paymentDetails.pagoMovil && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-rose-400 font-bold">
                      <span>📱 Datos de Pago Móvil:</span>
                      <span className="text-[10px] bg-rose-950 border border-rose-800 px-2 py-0.5 rounded-full text-rose-300 font-mono">
                        Banesco (0134)
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                      <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl">
                        <span><strong>Teléfono:</strong> {config.paymentDetails.pagoMovil.phone}</span>
                        <button type="button" onClick={() => handleCopy(config.paymentDetails.pagoMovil.phone, 'pm_phone')} className="text-slate-400 hover:text-white">
                          {copiedKey === 'pm_phone' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl">
                        <span><strong>RIF / C.I.:</strong> {config.paymentDetails.pagoMovil.docId}</span>
                        <button type="button" onClick={() => handleCopy(config.paymentDetails.pagoMovil.docId, 'pm_rif')} className="text-slate-400 hover:text-white">
                          {copiedKey === 'pm_rif' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl sm:col-span-2">
                        <span><strong>Monto Exacto:</strong> Bs. {effectiveBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                        <button type="button" onClick={() => handleCopy(effectiveBs.toFixed(2), 'pm_amount')} className="text-slate-400 hover:text-white">
                          {copiedKey === 'pm_amount' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'zelle' && config?.paymentDetails.zelle && (
                  <div className="space-y-2">
                    <span className="font-bold text-rose-400 block">💵 Datos para Zelle:</span>
                    <div className="bg-slate-900 p-2.5 rounded-xl flex items-center justify-between">
                      <span><strong>Correo:</strong> {config.paymentDetails.zelle.email}</span>
                      <button type="button" onClick={() => handleCopy(config.paymentDetails.zelle.email, 'z_email')} className="text-slate-400 hover:text-white">
                        {copiedKey === 'z_email' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {paymentMethod === 'binance' && config?.paymentDetails.binance && (
                  <div className="space-y-2">
                    <span className="font-bold text-rose-400 block">🪙 Datos para Binance Pay:</span>
                    <div className="bg-slate-900 p-2.5 rounded-xl flex items-center justify-between">
                      <span><strong>Binance Pay ID:</strong> {config.paymentDetails.binance.payId}</span>
                      <button type="button" onClick={() => handleCopy(config.paymentDetails.binance.payId, 'b_id')} className="text-slate-400 hover:text-white">
                        {copiedKey === 'b_id' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {paymentMethod === 'cash' && (
                  <div className="text-slate-300 space-y-1">
                    <span className="font-bold text-rose-400 block">🤝 Donación en Efectivo:</span>
                    <p className="text-[11px] text-slate-400">
                      Puedes hacer entrega de tu ofrenda directamente en la Rectoría del Seminario Mayor Santo Tomás de Aquino o coordinar con la administración por WhatsApp al <strong>0412-0308674</strong>.
                    </p>
                  </div>
                )}
              </div>

              {/* MANDATORY PROOF UPLOAD FOR DIGITAL PAYMENTS */}
              {paymentMethod !== 'cash' && (
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-white uppercase tracking-wider">
                      Comprobante / Capture de Pago <span className="text-rose-400 font-black">* (Obligatorio)</span>
                    </label>
                    <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Foto o Capture
                    </span>
                  </div>

                  <input
                    type="file"
                    ref={cameraInputRef}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {!proofPreview && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="flex items-center justify-center gap-1.5 p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors active:scale-95"
                      >
                        <Camera className="h-4 w-4 text-rose-400" />
                        <span>Tomar Foto</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center gap-1.5 p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors active:scale-95"
                      >
                        <Upload className="h-4 w-4 text-sky-400" />
                        <span>Subir de Galería</span>
                      </button>
                    </div>
                  )}

                  {proofPreview && (
                    <div className="relative rounded-2xl border border-rose-500/40 bg-slate-950 p-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <img
                          src={proofPreview}
                          alt="Capture preview"
                          className="h-12 w-12 object-cover rounded-xl border border-slate-700 shrink-0"
                        />
                        <div className="truncate">
                          <span className="text-xs font-bold text-white block truncate">{proofFileName || 'Comprobante adjunto'}</span>
                          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                            <Check className="h-3 w-3" /> Imagen lista
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveProof}
                        className="p-1.5 rounded-lg bg-rose-950/60 text-rose-400 hover:bg-rose-900 border border-rose-800"
                        title="Eliminar capture"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {uploadingProof && (
                    <div className="flex items-center gap-2 text-xs text-rose-300 animate-pulse">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Subiendo capture de pago...</span>
                    </div>
                  )}

                  {/* Reference number */}
                  <div className="pt-1">
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Número de Referencia Bancaria (o últimos dígitos)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 048291"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white uppercase font-mono focus:border-rose-400 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ERROR ALERT */}
            {errorMessage && (
              <div className="rounded-2xl bg-rose-950/80 border border-rose-800 p-3.5 text-xs text-rose-200 flex items-start gap-2 animate-shake">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={submitting || uploadingProof}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-500 hover:from-rose-400 hover:to-rose-500 py-4 text-sm font-black text-white shadow-xl shadow-rose-900/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Registrando Ofrenda...</span>
                </>
              ) : (
                <>
                  <Heart className="h-5 w-5 fill-white/20" />
                  <span>Confirmar Donación de ${effectiveUsd}.00 USD</span>
                </>
              )}
            </button>

            <p className="text-[10px] text-slate-500 text-center">
              🔒 Tu ofrenda es recibida directamente por la administración del Seminario Mayor Santo Tomás de Aquino. Dios bendiga tu generosidad.
            </p>
          </form>
        )}

      </div>
    </div>
  );
}
