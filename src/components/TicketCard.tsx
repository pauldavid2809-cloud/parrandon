'use client';

import { useState } from 'react';
import { Ticket } from '@/types';
import { generateTicketPdf } from '@/lib/export';
import { Utensils, Calendar, MapPin, Share2, Download, Printer, CheckCircle2, AlertTriangle, Sparkles, Armchair, FileDown } from 'lucide-react';

interface TicketCardProps {
  ticket: Ticket;
  buyerName?: string;
  buyerPhone?: string;
}

export default function TicketCard({ ticket, buyerName, buyerPhone }: TicketCardProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const ticketUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/ticket/${ticket.ticketCode}` 
    : `https://parrandon.seminariosta.org/ticket/${ticket.ticketCode}`;

  const shareText = `🎄 *Parrandón Navideño 2026 - Seminario Mayor Santo Tomás de Aquino (Maracaibo)*\n\n¡Hola ${ticket.attendeeName}! Aquí tienes tu entrada digital con código QR:\n\n🎟️ *Entrada N°:* #${ticket.ticketNumber}\n🪑 *Tu Ubicación:* Mesa ${ticket.tableId} • Silla #${ticket.seatNumber} (Sector ${ticket.sector || 'A'})\n🔑 *Código QR:* ${ticket.ticketCode}\n🍽️ *Incluye:* 1 Plato Navideño Completo\n📅 *Fecha:* Sábado 12 de Diciembre de 2026 • 6:00 PM\n📍 *Lugar:* Bulevar del Seminario Santo Tomás de Aquino (Maracaibo, Estado Zulia)\n\n👉 *Ver entrada con QR:* ${ticketUrl}\n\n_Presenta este enlace en tu teléfono al llegar a la puerta._`;

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    setDownloading(true);
    try {
      generateTicketPdf(ticket, buyerName, buyerPhone);
    } catch (e) {
      console.error(e);
      window.print();
    } finally {
      setTimeout(() => setDownloading(false), 1000);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(ticketUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full max-w-md mx-auto overflow-hidden rounded-3xl border border-amber-500/40 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 shadow-2xl transition-all hover:border-amber-400/70">
      {/* Header Banner en Azul Marino con Escudo Oficial */}
      <div className="relative bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 border-b border-amber-500/40 p-5 text-white flex items-center gap-3.5">
        <div className="relative h-12 w-10 shrink-0 filter drop-shadow-[0_2px_6px_rgba(245,158,11,0.3)]">
          <img
            src="/images/seminario-logo.png"
            alt="Escudo Seminario Santo Tomás de Aquino"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-300">
              Seminario Santo Tomás de Aquino
            </p>
            <span className="rounded-full bg-slate-950/80 px-2 py-0.2 text-[9px] font-bold uppercase tracking-wider text-amber-300 border border-amber-500/30">
              2026
            </span>
          </div>
          <h3 className="text-xl font-black tracking-tight text-white mt-0.5">
            Parrandón Navideño
          </h3>
          <p className="text-xs text-sky-200 mt-0.5 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-amber-300" />
            <span>Sábado 12 Dic 2026 • 6:00 PM</span>
          </p>
        </div>
      </div>

      {/* Ticket Body */}
      <div className="p-4 sm:p-6 text-center">
        
        {/* Table & Seat VIP Badge */}
        <div className="rounded-2xl bg-gradient-to-r from-amber-500/20 via-slate-800 to-emerald-500/20 border-2 border-amber-500/40 p-3 sm:p-4 mb-3 sm:mb-4 text-center shadow-lg">
          <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-amber-400 block mb-1">
            Ubicación Asignada en el Bulevar
          </span>
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <div className="text-center">
              <span className="text-[10px] sm:text-xs text-slate-400 block font-medium">MESA</span>
              <strong className="text-xl sm:text-2xl font-black text-white">{ticket.tableId || 'A1'}</strong>
            </div>
            <div className="h-7 sm:h-8 w-0.5 bg-amber-500/40" />
            <div className="text-center">
              <span className="text-[10px] sm:text-xs text-slate-400 block font-medium">SILLA</span>
              <strong className="text-xl sm:text-2xl font-black text-amber-300">#{ticket.seatNumber || 1}</strong>
            </div>
            <div className="h-7 sm:h-8 w-0.5 bg-amber-500/40" />
            <div className="text-center">
              <span className="text-[10px] sm:text-xs text-slate-400 block font-medium">SECTOR</span>
              <strong className="text-xl sm:text-2xl font-black text-emerald-400">{ticket.sector || 'A'}</strong>
            </div>
          </div>
        </div>

        {/* Attendee Name Badge */}
        <div className="rounded-xl bg-slate-800/80 border border-slate-700 p-3 mb-3 sm:mb-4 text-left">
          <div className="text-[9px] sm:text-[10px] font-semibold uppercase text-slate-400">Asistente Registrado</div>
          <div className="text-sm sm:text-base font-bold text-white capitalize truncate">{ticket.attendeeName}</div>
          <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-700/60 text-xs">
            <span className="text-slate-400 text-[11px] sm:text-xs">Pase N°: <strong className="text-amber-400">#{ticket.ticketNumber}</strong></span>
            <span className="text-slate-400 text-[11px] sm:text-xs">Ref: <code className="text-amber-300 font-mono text-[10px] sm:text-[11px]">{ticket.ticketCode}</code></span>
          </div>
        </div>

        {/* QR Code Container */}
        <div className="relative inline-block mx-auto rounded-2xl bg-white p-3 sm:p-4 shadow-inner border-4 border-amber-500/30">
          {ticket.qrCodeDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ticket.qrCodeDataUrl}
              alt={`QR Entrada ${ticket.ticketCode}`}
              className="w-44 h-44 sm:w-52 sm:h-52 object-contain mx-auto"
            />
          ) : (
            <div className="w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center text-slate-500 text-xs">
              Generando Código QR...
            </div>
          )}
          <div className="mt-1 text-[9px] sm:text-[10px] font-mono font-bold text-slate-900 tracking-wider">
            {ticket.ticketCode}
          </div>
        </div>

        {/* Meal Inclusion Badge */}
        <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 px-3 py-2 text-emerald-300 text-xs font-semibold">
          <Utensils className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Incluye 1 Plato Navideño Completo</span>
        </div>

        {/* Status Indicator */}
        <div className="mt-2 flex items-center justify-center gap-1.5 text-xs">
          {ticket.isUsed ? (
            <span className="flex items-center gap-1 text-rose-400 font-semibold">
              <AlertTriangle className="h-4 w-4" />
              Entrada ya escaneada ({ticket.scannedAt ? new Date(ticket.scannedAt).toLocaleTimeString('es-VE') : ''})
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Entrada activa y válida para el ingreso
            </span>
          )}
        </div>

        {/* Venue Info */}
        <div className="mt-3 text-[11px] text-slate-400 flex items-center justify-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <span>Bulevar del Seminario Santo Tomás, Maracaibo</span>
        </div>
      </div>

      {/* Action Buttons (no-print) */}
      <div className="p-4 bg-slate-950/80 border-t border-slate-800/80 grid grid-cols-2 gap-2 no-print">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/30"
        >
          <Share2 className="h-3.5 w-3.5" />
          <span>Enviar WhatsApp</span>
        </a>

        <button
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-3 py-2.5 text-xs font-bold text-slate-950 transition-colors shadow-lg shadow-amber-500/20"
        >
          <FileDown className="h-3.5 w-3.5" />
          <span>{downloading ? 'Descargando...' : 'Descargar PDF'}</span>
        </button>

        <button
          onClick={handleCopyLink}
          className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
        >
          {copied ? '✅ Enlace copiado al portapapeles' : '📋 Copiar Enlace Directo a la Entrada'}
        </button>
      </div>
    </div>
  );
}
