'use client';

import { useState, useEffect } from 'react';
import { EventConfig } from '@/types';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  DollarSign, 
  Users, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  QrCode,
  Smartphone,
  Send,
  LogOut,
  Sparkles,
  Check
} from 'lucide-react';

export default function ConfiguracionPage() {
  const [config, setConfig] = useState<EventConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // WhatsApp Bot State
  const [waStatus, setWaStatus] = useState<{
    isConnected: boolean;
    state: string;
    connectedPhone?: string;
    qrCodeDataUrl?: string;
  }>({ isConnected: false, state: 'close' });
  const [loadingWa, setLoadingWa] = useState(true);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('¡Hola! Este es un mensaje de prueba oficial del Seminario Santo Tomás de Aquino para el Parrandón 2026. 🎄');
  const [sendingTest, setSendingTest] = useState(false);
  const [testSuccess, setTestSuccess] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/config');
      const data = await res.json();
      if (data.success && data.config) {
        setConfig(data.config);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [syncingRate, setSyncingRate] = useState(false);
  const handleSyncRate = async () => {
    try {
      setSyncingRate(true);
      const res = await fetch('/api/rates');
      const data = await res.json();
      if (data.success && data.rate && config) {
        setConfig({
          ...config,
          currentRateBs: data.rate
        });
        alert(`✅ Tasa sincronizada con éxito desde la API Oficial: Bs. ${data.rate}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error al consultar la API de tasas.');
    } finally {
      setSyncingRate(false);
    }
  };

  const fetchWhatsAppStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/status');
      const data = await res.json();
      setWaStatus(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWa(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchWhatsAppStatus();
    const interval = setInterval(fetchWhatsAppStatus, 4000); // Polling for QR / connection status
    return () => clearInterval(interval);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
      alert("Error al guardar la configuración.");
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim()) return;

    setSendingTest(true);
    setTestSuccess(null);
    setTestError(null);

    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: testPhone,
          message: testMessage
        })
      });
      const data = await res.json();

      if (data.success) {
        setTestSuccess(`✅ Mensaje enviado con éxito al número ${testPhone}!`);
      } else {
        setTestError(`❌ Error: ${data.error || 'No se pudo enviar el mensaje.'}`);
      }
    } catch (err: any) {
      setTestError(`❌ Error de conexión: ${err.message}`);
    } finally {
      setSendingTest(false);
    }
  };

  const handleDisconnectWa = async () => {
    if (!confirm('¿Seguro que deseas desvincular este número de WhatsApp?')) return;
    try {
      await fetch('/api/whatsapp/disconnect', { method: 'POST' });
      fetchWhatsAppStatus();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !config) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <Loader2 className="h-8 w-8 text-amber-400 animate-spin mb-2" />
        <span className="text-xs text-slate-400">Cargando configuración...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="h-6 w-6 text-amber-400" />
          Configuración del Evento & Bot de WhatsApp
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Ajusta la tasa de cambio en bolívares, cupos, pasarelas de pago y vincula el WhatsApp oficial del Seminario.
        </p>
      </div>

      {/* WHATSAPP BOT OFFICIAL CONNECTOR MODULE */}
      <div className="rounded-3xl border-2 border-emerald-500/50 bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-950 p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>WhatsApp Oficial del Seminario</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40">
                  100% Gratis
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Envío automático e instantáneo de entradas digitales con QR a los feligreses.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              waStatus.isConnected
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
            }`}>
              <span className={`h-2 w-2 rounded-full ${waStatus.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-pulse'}`} />
              <span>{waStatus.isConnected ? `Conectado (+${waStatus.connectedPhone})` : 'Esperando Vinculación'}</span>
            </span>
          </div>
        </div>

        {/* If Connected */}
        {waStatus.isConnected ? (
          <div className="space-y-5">
            <div className="rounded-2xl bg-emerald-950/60 border border-emerald-500/40 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-white block">
                  🟢 Línea Oficial de WhatsApp Activa
                </span>
                <p className="text-xs text-slate-300">
                  Número vinculado: <strong className="text-emerald-400 font-mono">+{waStatus.connectedPhone}</strong>. Cada venta aprobada o registrada por seminaristas enviará el pase digital automáticamente desde este número.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDisconnectWa}
                className="flex items-center gap-1.5 rounded-xl bg-slate-900 border border-rose-800/60 px-3.5 py-2 text-xs font-bold text-rose-400 hover:bg-rose-950 transition-colors shrink-0"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Desvincular / Cambiar Teléfono</span>
              </button>
            </div>

            {/* Test Message Form */}
            <form onSubmit={handleSendTestMessage} className="rounded-2xl bg-slate-950/80 p-4 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                🧪 Probar Envío de Mensaje en Vivo
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Teléfono destino:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 04141234567"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] text-slate-400 block mb-1">Mensaje de prueba:</label>
                  <input
                    type="text"
                    required
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {testSuccess && (
                <div className="rounded-xl bg-emerald-950/80 border border-emerald-500/40 p-2.5 text-xs text-emerald-300">
                  {testSuccess}
                </div>
              )}
              {testError && (
                <div className="rounded-xl bg-rose-950/80 border border-rose-500/40 p-2.5 text-xs text-rose-300">
                  {testError}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={sendingTest}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white transition-colors"
                >
                  {sendingTest ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  <span>{sendingTest ? 'Enviando...' : 'Enviar Prueba por WhatsApp'}</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* If NOT Connected: Display Live QR Code */
          <div className="flex flex-col md:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="bg-white p-3 rounded-2xl border-4 border-emerald-500/40 shadow-2xl shrink-0">
              {waStatus.qrCodeDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={waStatus.qrCodeDataUrl}
                  alt="QR WhatsApp Web Seminario"
                  className="w-56 h-56 object-contain"
                />
              ) : (
                <div className="w-56 h-56 flex flex-col items-center justify-center text-slate-700 text-xs text-center p-4">
                  <Loader2 className="h-8 w-8 text-emerald-600 animate-spin mb-2" />
                  <span>Generando código QR seguro...</span>
                </div>
              )}
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <QrCode className="h-5 w-5 text-amber-400" />
                Pasos para Vincular en 10 Segundos:
              </h3>
              <ol className="space-y-2 list-decimal list-inside text-slate-300">
                <li>Abre <strong>WhatsApp</strong> en el teléfono oficial del Seminario.</li>
                <li>Toca los tres puntos <strong>(⋮)</strong> o <strong>Configuración</strong>.</li>
                <li>Selecciona <strong>Dispositivos vinculados</strong> y toca <strong>Vincular un dispositivo</strong>.</li>
                <li>Apunta la cámara del celular a este código QR.</li>
              </ol>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]">
                💡 <em>Una vez escaneado, el bot se conectará automáticamente y enviará todas las entradas y pases de forma inmediata.</em>
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Section 1: Precios, Tasas y Cupos */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            1. Precios, Tasas y Capacidad
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Precio Entrada General ($):</label>
              <input
                type="number"
                value={config.ticketPriceUsd}
                onChange={(e) => setConfig({ ...config, ticketPriceUsd: Number(e.target.value) })}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-300">Tasa Oficial (Bs / $):</label>
                <button
                  type="button"
                  onClick={handleSyncRate}
                  disabled={syncingRate}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold underline flex items-center gap-1"
                >
                  <RefreshCw className={`h-3 w-3 ${syncingRate ? 'animate-spin' : ''}`} />
                  <span>Sincronizar con API</span>
                </button>
              </div>
              <input
                type="number"
                step="0.01"
                value={config.currentRateBs}
                onChange={(e) => setConfig({ ...config, currentRateBs: Number(e.target.value) })}
                className="w-full rounded-xl bg-slate-950 border border-emerald-500/50 px-3 py-2 text-xs text-emerald-300 font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                ⚡ API Oficial BCV vinculada en tiempo real.
              </span>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Cupo Máximo de Entradas:</label>
              <input
                type="number"
                value={config.totalQuota}
                onChange={(e) => setConfig({ ...config, totalQuota: Number(e.target.value) })}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Pasarelas de Pago */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            2. Cuentas Receptoras de Pagos
          </h2>

          <div className="space-y-4 text-xs">
            
            {/* Pago Móvil */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="font-bold text-sky-400 block">📱 Pago Móvil (Bolívares)</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5">Banco:</label>
                  <input
                    type="text"
                    value={config.paymentDetails.pagoMovil.bank}
                    onChange={(e) => setConfig({
                      ...config,
                      paymentDetails: {
                        ...config.paymentDetails,
                        pagoMovil: { ...config.paymentDetails.pagoMovil, bank: e.target.value }
                      }
                    })}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5">Teléfono:</label>
                  <input
                    type="text"
                    value={config.paymentDetails.pagoMovil.phone}
                    onChange={(e) => setConfig({
                      ...config,
                      paymentDetails: {
                        ...config.paymentDetails,
                        pagoMovil: { ...config.paymentDetails.pagoMovil, phone: e.target.value }
                      }
                    })}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5">Cédula / RIF:</label>
                  <input
                    type="text"
                    value={config.paymentDetails.pagoMovil.docId}
                    onChange={(e) => setConfig({
                      ...config,
                      paymentDetails: {
                        ...config.paymentDetails,
                        pagoMovil: { ...config.paymentDetails.pagoMovil, docId: e.target.value }
                      }
                    })}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5">Titular:</label>
                  <input
                    type="text"
                    value={config.paymentDetails.pagoMovil.holder}
                    onChange={(e) => setConfig({
                      ...config,
                      paymentDetails: {
                        ...config.paymentDetails,
                        pagoMovil: { ...config.paymentDetails.pagoMovil, holder: e.target.value }
                      }
                    })}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* Zelle */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="font-bold text-amber-400 block">💵 Zelle (USD)</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5">Correo Electrónico Zelle:</label>
                  <input
                    type="email"
                    value={config.paymentDetails.zelle.email}
                    onChange={(e) => setConfig({
                      ...config,
                      paymentDetails: {
                        ...config.paymentDetails,
                        zelle: { ...config.paymentDetails.zelle, email: e.target.value }
                      }
                    })}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5">Titular de la cuenta:</label>
                  <input
                    type="text"
                    value={config.paymentDetails.zelle.holder}
                    onChange={(e) => setConfig({
                      ...config,
                      paymentDetails: {
                        ...config.paymentDetails,
                        zelle: { ...config.paymentDetails.zelle, holder: e.target.value }
                      }
                    })}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* Binance Pay */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="font-bold text-amber-300 block">🪙 Binance Pay (USDT)</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5">Binance Pay ID:</label>
                  <input
                    type="text"
                    value={config.paymentDetails.binance.payId}
                    onChange={(e) => setConfig({
                      ...config,
                      paymentDetails: {
                        ...config.paymentDetails,
                        binance: { ...config.paymentDetails.binance, payId: e.target.value }
                      }
                    })}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5">Red Cripto Recomendada:</label>
                  <input
                    type="text"
                    value={config.paymentDetails.binance.network}
                    onChange={(e) => setConfig({
                      ...config,
                      paymentDetails: {
                        ...config.paymentDetails,
                        binance: { ...config.paymentDetails.binance, network: e.target.value }
                      }
                    })}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* PayPal */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="font-bold text-sky-400 block">💳 PayPal Checkout & Tarjetas Internacionales</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5">PayPal Client ID:</label>
                  <input
                    type="text"
                    value={config.paymentDetails.paypal?.clientId || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      paymentDetails: {
                        ...config.paymentDetails,
                        paypal: { ...(config.paymentDetails.paypal || {}), clientId: e.target.value }
                      }
                    })}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5">Enlace de Pago Directo PayPal:</label>
                  <input
                    type="text"
                    value={config.paymentDetails.paypal?.paymentLink || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      paymentDetails: {
                        ...config.paymentDetails,
                        paypal: { ...(config.paymentDetails.paypal || {}), paymentLink: e.target.value }
                      }
                    })}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Feedback & Save Button */}
        {savedSuccess && (
          <div className="rounded-2xl bg-emerald-950/80 border border-emerald-500 p-4 text-xs font-bold text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <span>¡Configuración guardada exitosamente! Las tasas y cuentas están actualizadas en toda la plataforma.</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-400 px-8 py-3.5 text-xs font-bold text-slate-950 shadow-xl shadow-amber-500/25 transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Guardando Cambios...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Guardar Configuración General</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
