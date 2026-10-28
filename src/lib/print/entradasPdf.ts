'use client';

import QRCode from 'qrcode';
import { formatNumber, ticketUrl, SITE_URL } from '@/lib/site';
import { formatCedula } from '@/lib/persona';
import { METODO_LABEL, STATUS_LABEL, type Entrada } from '@/lib/entradas/types';

// PDF para la imprenta: 4 entradas por hoja A4 (180 × 64 mm), con líneas de corte,
// talón troquelado y el QR que abre la página de activación de cada entrada.

export interface PrintTicket {
  number: number;
  code: string;
}

export interface PrintEvent {
  date: string; // "Viernes, 11 de Diciembre de 2026"
  time: string; // "06:00 PM - 01:00 AM"
  priceUsd: number;
}

const INK: [number, number, number] = [42, 26, 18];
const INK2: [number, number, number] = [94, 70, 54];
const INK3: [number, number, number] = [122, 97, 82];
const ROJO: [number, number, number] = [179, 18, 46];
const VERDE: [number, number, number] = [31, 90, 61];
const ORO: [number, number, number] = [201, 154, 46];
const LINE: [number, number, number] = [205, 190, 165];

const TW = 180;
const TH = 64;
const STUB = 50;
const GAP = 6;
const PER_PAGE = 4;

async function fontBase64(path: string) {
  const buf = await (await fetch(path)).arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

// Se descargan una sola vez aunque se armen muchos PDF seguidos (carpeta por lotes).
let fuentesCache: Promise<string[]> | null = null;
function fuentes() {
  fuentesCache ??= Promise.all([
    fontBase64('/fonts/YoungSerif-Regular.ttf'),
    fontBase64('/fonts/RedHatText-Regular.ttf'),
    fontBase64('/fonts/RedHatText-Bold.ttf'),
  ]).catch((err) => {
    fuentesCache = null;
    throw err;
  });
  return fuentesCache;
}

function shortDate(date: string) {
  // "Viernes, 11 de Diciembre de 2026" -> "Viernes 11 de diciembre"
  return date
    .replace(/,/g, '')
    .replace(/ de \d{4}$/, '')
    .replace(/ de ([A-ZÁÉÍÓÚ])/g, (_, c: string) => ` de ${c.toLowerCase()}`);
}

function shortTime(time: string) {
  const first = time.split('-')[0].trim(); // "06:00 PM"
  return first.replace(/^0/, '').replace(/\s*PM$/i, ' p. m.').replace(/\s*AM$/i, ' a. m.');
}

export async function buildEntradasPdf(tickets: PrintTicket[], event: PrintEvent, onProgress?: (n: number) => void) {
  const { jsPDF } = await import('jspdf');
  // compress: los QR son miles de rectángulos; comprimidos el PDF pesa una fracción.
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });

  const [serif, sans, sansBold] = await fuentes();
  doc.addFileToVFS('YoungSerif.ttf', serif);
  doc.addFont('YoungSerif.ttf', 'YoungSerif', 'normal');
  doc.addFileToVFS('RedHat.ttf', sans);
  doc.addFont('RedHat.ttf', 'RedHat', 'normal');
  doc.addFileToVFS('RedHatBold.ttf', sansBold);
  doc.addFont('RedHatBold.ttf', 'RedHat', 'bold');

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const x0 = (pageW - TW) / 2;
  const y0 = (pageH - (PER_PAGE * TH + (PER_PAGE - 1) * GAP)) / 2;
  const fecha = shortDate(event.date);
  const hora = shortTime(event.time);
  const host = SITE_URL.replace(/^https?:\/\//, '');

  for (let i = 0; i < tickets.length; i++) {
    const slot = i % PER_PAGE;
    if (i > 0 && slot === 0) doc.addPage();
    const t = tickets[i];
    const x = x0;
    const y = y0 + slot * (TH + GAP);

    // Línea de corte
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.2);
    doc.setLineDashPattern([1.2, 1.2], 0);
    doc.rect(x, y, TW, TH);
    doc.setLineDashPattern([], 0);

    // Perforación del talón
    const px = x + TW - STUB;
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.35);
    doc.setLineDashPattern([1, 1.4], 0);
    doc.line(px, y + 3, px, y + TH - 3);
    doc.setLineDashPattern([], 0);
    doc.setFillColor(255, 255, 255);
    doc.circle(px, y, 2.6, 'FD');
    doc.circle(px, y + TH, 2.6, 'FD');

    // Cuerpo
    const bx = x + 8;
    doc.setFont('YoungSerif', 'normal');
    doc.setTextColor(...ROJO);
    doc.setFontSize(23);
    doc.text('Parrandón Navideño', bx, y + 14);
    doc.setFont('RedHat', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...INK2);
    doc.text('Seminario Mayor Santo Tomás de Aquino · 2026', bx, y + 19.5);

    // Distintivo "Incluye plato", a la altura del subtítulo
    const pill = 'Incluye plato navideño';
    doc.setFontSize(7.5);
    const pw = doc.getTextWidth(pill) + 5;
    doc.setFillColor(...VERDE);
    doc.roundedRect(px - 7 - pw, y + 15.6, pw, 5.6, 1.4, 1.4, 'F');
    doc.setTextColor(255, 250, 240);
    doc.text(pill, px - 7 - pw + 2.5, y + 19.5);

    // Filete dorado
    doc.setDrawColor(...ORO);
    doc.setLineWidth(0.4);
    doc.line(bx, y + 23.5, px - 7, y + 23.5);

    // Datos
    const col = (label: string, value: string, cx: number, maxW: number) => {
      doc.setFont('RedHat', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...INK3);
      doc.text(label, cx, y + 29);
      doc.setFont('RedHat', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...INK);
      doc.text(doc.splitTextToSize(value, maxW), cx, y + 33.5);
    };
    col('Fecha', fecha, bx, 44);
    col('Hora', hora, bx + 48, 22);
    col('Lugar', 'Bulevar del Seminario, Maracaibo', bx + 72, 48);

    // Número
    doc.setFont('RedHat', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...INK3);
    doc.text('Entrada N.º', bx, y + 46);
    doc.setFont('YoungSerif', 'normal');
    doc.setFontSize(30);
    doc.setTextColor(...INK);
    doc.text(formatNumber(t.number), bx, y + 57);

    doc.setFont('RedHat', 'bold');
    doc.setFontSize(10);
    doc.text(`$${event.priceUsd} · precio único`, bx + 34, y + 51);
    doc.setFont('RedHat', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...INK2);
    doc.text(
      doc.splitTextToSize(`Escanea el QR para activarla y escoger tu mesa. ¿No abre? Entra a ${host}/activar`, 82),
      bx + 34,
      y + 55
    );

    // Talón con QR, dibujado como vector (nítido en imprenta y liviano)
    const qs = 33;
    const qx = px + (STUB - qs) / 2;
    drawQr(doc, ticketUrl(t.code), qx, y + 6, qs);
    doc.setFont('RedHat', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...INK2);
    doc.text('Escanéame para activar', px + STUB / 2, y + 45, { align: 'center' });
    doc.setFont('RedHat', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text(t.code, px + STUB / 2, y + 52, { align: 'center' });
    doc.setFont('YoungSerif', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(...ROJO);
    doc.text(`N.º ${formatNumber(t.number)}`, px + STUB / 2, y + 59.5, { align: 'center' });

    onProgress?.(i + 1);
  }

  return doc;
}

type Doc = InstanceType<typeof import('jspdf').jsPDF>;

function drawQr(doc: Doc, text: string, x: number, y: number, size: number) {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const n = qr.modules.size;
  const cell = size / n;
  doc.setFillColor(...INK);
  // Une los módulos oscuros consecutivos de cada fila en un solo rectángulo.
  for (let r = 0; r < n; r++) {
    let c = 0;
    while (c < n) {
      if (!qr.modules.get(r, c)) {
        c++;
        continue;
      }
      const start = c;
      while (c < n && qr.modules.get(r, c)) c++;
      // Un pelo de solapamiento evita líneas blancas entre filas al imprimir.
      doc.rect(x + start * cell, y + r * cell, (c - start) * cell + 0.02, cell + 0.02, 'F');
    }
  }
}

export function entradasCsv(rows: { number: number; code: string; holderName: string | null; status: string }[]) {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = ['Numero,Codigo,EnlaceQR,Responsable,Estado'];
  for (const r of rows) {
    lines.push([formatNumber(r.number), r.code, ticketUrl(r.code), esc(r.holderName || ''), r.status].join(','));
  }
  return '﻿' + lines.join('\n');
}

// Lista de quienes van al evento, para abrir en Excel. Los nombres los escribe el público:
// un texto que empiece con = + - @ se antepone con ' para que Excel no lo ejecute como fórmula.
export function asistentesCsv(rows: Entrada[]) {
  const esc = (v: string | null | undefined) => {
    const t = String(v ?? '');
    return `"${(/^[=+\-@\t\r]/.test(t) ? `'${t}` : t).replace(/"/g, '""')}"`;
  };
  const lines = ['Numero,Nombre,Apellido,Cedula,Telefono,Mesa,Estado,Pago,Referencia,Lote,Ingreso'];
  for (const e of rows) {
    if (!e.attendeeName || e.status === 'anulada') continue;
    lines.push(
      [
        formatNumber(e.number),
        esc(e.attendeeFirstName ?? e.attendeeName),
        esc(e.attendeeLastName),
        esc(formatCedula(e.attendeeCedula)),
        esc(e.attendeePhone),
        e.tableId || '',
        STATUS_LABEL[e.status],
        e.paymentMethod ? METODO_LABEL[e.paymentMethod] : '',
        esc(e.paymentReference),
        esc(e.holderName),
        e.checkedInAt ? 'Sí' : '',
      ].join(',')
    );
  }
  return '\ufeff' + lines.join('\n');
}

export function download(name: string, data: Blob) {
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
