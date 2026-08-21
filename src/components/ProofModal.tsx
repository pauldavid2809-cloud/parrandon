'use client';

import { useState } from 'react';
import { Order } from '@/types';
import { formatCurrency, formatDate, cleanPhoneForWhatsApp } from '@/lib/utils';
import { X, CheckCircle, XCircle, ZoomIn, ZoomOut, RotateCw, ExternalLink, AlertCircle, Phone, Mail, User, CreditCard, Hash } from 'lucide-react';

interface ProofModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (orderId: string) => Promise<void>;
  onReject: (orderId: string, reason: string) => Promise<void>;
}

export default function ProofModal({ order, isOpen, onClose, onApprove, onReject }: ProofModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('Comprobante no coincide con los registros bancarios.');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !order) return null;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.3, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.3, 0.7));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await onApprove(order.id);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) return;
    setLoading(true);
    try {
      await onReject(order.id, rejectionReason);
      setIsRejecting(false);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const methodNames: Record<string, string> = {
    pago_movil: 'Pago Móvil (Bs)',
    zelle: 'Zelle (USD)',
    binance: 'Binance Pay (USDT)',
    cash: 'Efectivo / Taquilla'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-4 backdrop-blur-md animate-fadeIn">
      <div className="relative flex flex-col lg:flex-row max-h-[95vh] w-full max-w-5xl rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 rounded-full bg-slate-800/80 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Left: Receipt Capture Preview (Zoomable / Rotatable) */}
        <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center p-4 min-h-[340px] lg:min-h-[500px] relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-xl bg-slate-900/80 border border-slate-700/80 p-1.5 backdrop-blur-sm">
            <button
              onClick={handleZoomIn}
              title="Aumentar Zoom"
              className="p-1.5 text-slate-300 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={handleZoomOut}
              title="Reducir Zoom"
              className="p-1.5 text-slate-300 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={handleRotate}
              title="Rotar Imagen"
              className="p-1.5 text-slate-300 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <RotateCw className="h-4 w-4" />
            </button>
            {order.paymentProofUrl && (
              <a
                href={order.paymentProofUrl}
                target="_blank"
                rel="noreferrer"
                title="Abrir imagen completa"
                className="p-1.5 text-slate-300 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>

          <div className="w-full h-full flex items-center justify-center overflow-auto p-4 max-h-[450px]">
            {order.paymentProofUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={order.paymentProofUrl}
                alt="Comprobante de pago"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease-out'
                }}
                className="max-h-[400px] max-w-full object-contain rounded-lg shadow-lg"
              />
            ) : (
              <div className="text-center text-slate-500 p-8">
                <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No se adjuntó imagen de comprobante (Venta en taquilla o registro manual)</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Order details & Action controls */}
        <div className="w-full lg:w-96 p-6 flex flex-col justify-between overflow-y-auto max-h-[60vh] lg:max-h-full">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
                {order.id}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                order.status === 'approved' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : order.status === 'rejected'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {order.status === 'approved' ? '✅ Aprobado' : order.status === 'rejected' ? '❌ Rechazado' : '⏳ Pendiente'}
              </span>
            </div>

            <h3 className="text-xl font-bold text-white mb-1">{order.buyerName}</h3>
            <p className="text-xs text-slate-400 mb-4">{formatDate(order.createdAt)}</p>

            <div className="space-y-3 rounded-2xl bg-slate-950/60 p-4 border border-slate-800 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-amber-400" />
                  Método de Pago:
                </span>
                <strong className="text-white">{methodNames[order.paymentMethod] || order.paymentMethod}</strong>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-amber-400" />
                  Referencia Bancaria:
                </span>
                <code className="text-amber-300 font-mono font-bold text-sm bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {order.paymentReference || 'N/A'}
                </code>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                <span className="text-slate-400">Monto Reportado:</span>
                <span className="text-emerald-400 font-bold text-sm">
                  {formatCurrency(order.amountPaid, order.currency)}
                </span>
              </div>

              {order.currency !== 'USD' && (
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Equivalente en USD:</span>
                  <span className="text-slate-200 font-medium">${order.convertedUsd.toFixed(2)}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                <span className="text-slate-400">Entradas Solicitadas:</span>
                <span className="text-amber-300 font-bold text-sm">{order.quantity} {order.quantity === 1 ? 'entrada' : 'entradas'}</span>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <a href={`https://wa.me/${cleanPhoneForWhatsApp(order.buyerPhone)}`} target="_blank" rel="noreferrer" className="hover:underline text-emerald-300">
                    {order.buyerPhone}
                  </a>
                </div>
                {order.buyerEmail && (
                  <div className="flex items-center gap-2 text-slate-300 truncate">
                    <Mail className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>{order.buyerEmail}</span>
                  </div>
                )}
                {order.buyerDocId && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <User className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                    <span>{order.buyerDocId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Attendees list */}
            {order.attendees && order.attendees.length > 0 && (
              <div className="mt-3">
                <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-1.5">
                  Titulares de Entrada ({order.attendees.length}):
                </span>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {order.attendees.map((att, idx) => (
                    <div key={idx} className="text-xs bg-slate-800/60 px-2.5 py-1 rounded text-slate-200 flex items-center justify-between">
                      <span>#{idx + 1} {att.name}</span>
                      {att.docId && <span className="text-[10px] text-slate-400 font-mono">{att.docId}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-6 pt-4 border-t border-slate-800">
            {isRejecting ? (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-rose-300 block">
                  Motivo del rechazo (se informará al comprador):
                </label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full text-xs bg-slate-950 border border-rose-500/40 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-rose-400"
                >
                  <option value="Comprobante no coincide con los registros bancarios.">Comprobante no coincide con banco</option>
                  <option value="Capture borroso o ilegible. Por favor suba una foto nítida.">Capture borroso o ilegible</option>
                  <option value="El monto transferido es menor al costo de las entradas.">Monto transferido incompleto</option>
                  <option value="Número de referencia bancaria no encontrado.">Referencia no encontrada</option>
                  <option value="Pago duplicado o ya procesado anteriormente.">Pago duplicado</option>
                </select>
                <div className="flex items-center gap-2">
                  <button
                    disabled={loading}
                    onClick={handleConfirmReject}
                    className="flex-1 rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-500 transition-colors disabled:opacity-50"
                  >
                    Confirmar Rechazo
                  </button>
                  <button
                    onClick={() => setIsRejecting(false)}
                    className="rounded-xl bg-slate-800 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  disabled={loading || order.status === 'approved'}
                  onClick={handleApprove}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>{order.status === 'approved' ? 'Ya Aprobado' : 'Aprobar Pago y Emitir QR'}</span>
                </button>
                {order.status !== 'rejected' && (
                  <button
                    disabled={loading}
                    onClick={() => setIsRejecting(true)}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-950/40 hover:bg-rose-900/60 px-3 py-3 text-xs font-semibold text-rose-300 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Rechazar</span>
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
