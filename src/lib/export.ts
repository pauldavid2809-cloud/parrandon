import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { Order, Ticket, EventStats } from '@/types';
import { formatDate } from './utils';

export function exportOrdersToExcel(orders: Order[], filename = 'Parrandon_Navideno_Ventas.xlsx') {
  // Sheet 1: Orders summary
  const ordersData = orders.map((order, idx) => ({
    'N°': idx + 1,
    'ID Orden': order.id,
    'Canal': order.salesChannel === 'seminarista_parroquia' ? 'SEMINARISTA / PARROQUIA' : order.salesChannel === 'taquilla' ? 'TAQUILLA' : 'ONLINE',
    'Vendedor / Seminarista': order.sellerName || 'Venta Web',
    'Parroquia': order.parishName || 'Web Seminario',
    'Fecha': formatDate(order.createdAt),
    'Comprador': order.buyerName,
    'Cédula/DNI': order.buyerDocId || 'N/A',
    'Teléfono WhatsApp': order.buyerPhone,
    'Cantidad Entradas': order.quantity,
    'Mesas y Sillas': (order.seats || []).map(s => `Mesa ${s.tableId}-S${s.seatNumber}`).join(', '),
    'Método de Pago': order.paymentMethod.toUpperCase(),
    'Referencia Bancaria': order.paymentReference || 'N/A',
    'Monto Pagado': order.amountPaid,
    'Moneda': order.currency,
    'Equivalente USD': order.convertedUsd,
    'Estatus': order.status === 'approved' ? 'APROBADO' : order.status === 'pending' ? 'PENDIENTE' : 'RECHAZADO',
    'Verificado Por': order.verifiedBy || 'N/A',
  }));

  // Sheet 2: Individual tickets / Attendance list
  const ticketsData: Array<{
    'ID Ticket': string;
    'ID Orden': string;
    'Código QR': string;
    'Sector': string;
    'Mesa': string;
    'Silla': number;
    'Nombre Asistente': string;
    'Comprador': string;
    'Teléfono': string;
    'Canal de Venta': string;
    'Vendedor': string;
    '¿Asistió al Evento?': string;
    'Hora Escaneo': string;
    '¿Plato Servido?': string;
  }> = [];

  orders.forEach((order) => {
    (order.tickets || []).forEach((ticket) => {
      ticketsData.push({
        'ID Ticket': ticket.id,
        'ID Orden': order.id,
        'Código QR': ticket.ticketCode,
        'Sector': ticket.sector || 'A',
        'Mesa': ticket.tableId || 'A1',
        'Silla': ticket.seatNumber || 1,
        'Nombre Asistente': ticket.attendeeName,
        'Comprador': order.buyerName,
        'Teléfono': order.buyerPhone,
        'Canal de Venta': order.salesChannel || 'online',
        'Vendedor': order.sellerName || 'Web',
        '¿Asistió al Evento?': ticket.isUsed ? 'SÍ (PRESENTE)' : 'NO (PENDIENTE)',
        'Hora Escaneo': ticket.scannedAt ? formatDate(ticket.scannedAt) : 'N/A',
        '¿Plato Servido?': ticket.mealServed ? 'SÍ (ENTREGADO)' : 'NO',
      });
    });
  });

  const wb = XLSX.utils.book_new();
  const wsOrders = XLSX.utils.json_to_sheet(ordersData);
  const wsTickets = XLSX.utils.json_to_sheet(ticketsData);

  XLSX.utils.book_append_sheet(wb, wsOrders, 'Ventas y Pagos');
  XLSX.utils.book_append_sheet(wb, wsTickets, 'Asistencia y Platos');

  XLSX.writeFile(wb, filename);
}

export function export500SeatsToExcel(seats: any[], filename = 'Parrandon_500_Asientos_Bulevar.xlsx') {
  const data = seats.map((s, idx) => ({
    'N° Asiento': idx + 1,
    'Sector': s.sector,
    'Mesa': s.tableId,
    'Silla N°': s.seatNumber,
    'Código QR Único': s.ticketCode,
    'Estatus': s.status.toUpperCase(),
    'Comprador': s.buyerName || 'DISPONIBLE',
    'Teléfono WhatsApp': s.buyerPhone || '',
    'Canal / Vendedor': s.sellerName || '',
    'Parroquia': s.parishName || '',
    'ID Orden': s.orderId || ''
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, '500 Asientos Bulevar');
  XLSX.writeFile(wb, filename);
}

// Generate Individual Ticket PDF Pass
export function generateTicketPdf(ticket: Ticket, buyerName?: string, buyerPhone?: string) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [105, 148] // A6 card size format
  });

  // Background Card
  doc.setFillColor(15, 23, 42); // slate-950
  doc.rect(0, 0, 105, 148, 'F');

  // Top Navy Festive Header
  doc.setFillColor(23, 37, 84); // blue-950
  doc.rect(0, 0, 105, 30, 'F');

  doc.setTextColor(245, 158, 11); // amber-500
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('SEMINARIO MAYOR SANTO TOMÁS DE AQUINO', 52.5, 9, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.text('PARRANDÓN NAVIDEÑO 2026', 52.5, 17, { align: 'center' });

  doc.setTextColor(186, 230, 253); // sky-200
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Sábado 12 Dic 2026 • 6:00 PM • Bulevar del Seminario', 52.5, 24, { align: 'center' });

  // Gold accent bar
  doc.setFillColor(245, 158, 11);
  doc.rect(0, 29, 105, 1.5, 'F');

  // Seating Box
  doc.setFillColor(30, 41, 59); // slate-800
  doc.roundedRect(8, 35, 89, 18, 3, 3, 'F');

  doc.setTextColor(245, 158, 11);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('UBICACIÓN ASIGNADA EN EL BULEVAR', 52.5, 40, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text(`MESA: ${ticket.tableId}`, 22, 48, { align: 'center' });
  doc.setTextColor(245, 158, 11);
  doc.text(`SILLA: #${ticket.seatNumber}`, 52.5, 48, { align: 'center' });
  doc.setTextColor(52, 211, 153); // emerald-400
  doc.text(`SECTOR: ${ticket.sector || 'A'}`, 83, 48, { align: 'center' });

  // Attendee Info
  doc.setFillColor(2, 6, 23); // slate-950
  doc.roundedRect(8, 56, 89, 14, 2, 2, 'F');

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('ASISTENTE:', 12, 61);
  doc.text('PASE / REF:', 12, 66);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(ticket.attendeeName || 'Invitado', 30, 61);

  doc.setTextColor(245, 158, 11);
  doc.text(`#${ticket.ticketNumber} • ${ticket.ticketCode}`, 30, 66);

  // QR Code
  if (ticket.qrCodeDataUrl) {
    try {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(30, 73, 45, 45, 3, 3, 'F');
      doc.addImage(ticket.qrCodeDataUrl, 'PNG', 32.5, 75.5, 40, 40);
    } catch (e) {
      console.error('Error dibujando QR en PDF:', e);
    }
  }

  // Token code text under QR
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7);
  doc.setFont('courier', 'bold');
  doc.text(ticket.ticketCode, 52.5, 122, { align: 'center' });

  // Meal inclusion badge
  doc.setFillColor(6, 78, 59); // emerald-900
  doc.roundedRect(8, 126, 89, 8, 2, 2, 'F');
  doc.setTextColor(167, 243, 208); // emerald-200
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('🍽️ INCLUYE 1 PLATO NAVIDEÑO TRADICIONAL COMPLETO', 52.5, 131.5, { align: 'center' });

  // Footer text
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Presenta este pase digital o impreso al ingresar al evento • No transferible tras escaneo', 52.5, 142, { align: 'center' });

  doc.save(`Pase_Parrandon_${ticket.ticketCode}.pdf`);
}

export function exportExecutiveReportPdf(stats: EventStats, orders: Order[]) {
  const doc = new jsPDF();

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 40, 'F');

  doc.setTextColor(245, 158, 11);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('SEMINARIO MAYOR SANTO TOMÁS DE AQUINO', 105, 16, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text('REPORTE Y CIERRE DE VENTAS - PARRANDÓN 2026 (500 CUPOS)', 105, 26, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generado el: ${new Date().toLocaleString('es-VE')}`, 105, 34, { align: 'center' });

  // Summary Metrics Table
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Resumen de Capacidad y Recaudación', 14, 50);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`• Capacidad Total del Bulevar: 500 personas (50 mesas de 10 personas)`, 16, 58);
  doc.text(`• Total Entradas Confirmadas: ${stats.confirmedTickets} de ${stats.totalQuota} cupos`, 16, 65);
  doc.text(`• Total Entradas Pendientes por Verificar: ${stats.pendingTickets}`, 16, 72);
  doc.text(`• Total Recaudado (Estimado en USD): $${stats.totalRevenueUsd.toFixed(2)}`, 16, 79);

  // Breakdown by channel
  doc.setFont('helvetica', 'bold');
  doc.text('2. Ventas por Canal de Distribución:', 14, 90);
  doc.setFont('helvetica', 'normal');
  doc.text(`  - Venta Online en Web: ${stats.salesByChannel?.online?.count || 0} entradas ($${stats.salesByChannel?.online?.revenueUsd?.toFixed(2) || 0})`, 16, 97);
  doc.text(`  - Venta de Seminaristas en Parroquias: ${stats.salesByChannel?.seminaristas?.count || 0} entradas ($${stats.salesByChannel?.seminaristas?.revenueUsd?.toFixed(2) || 0})`, 16, 104);
  doc.text(`  - Venta en Taquilla del Seminario: ${stats.salesByChannel?.taquilla?.count || 0} entradas ($${stats.salesByChannel?.taquilla?.revenueUsd?.toFixed(2) || 0})`, 16, 111);

  // Breakdown by method
  doc.setFont('helvetica', 'bold');
  doc.text('3. Desglose por Método de Pago:', 14, 122);
  doc.setFont('helvetica', 'normal');
  doc.text(`  - Pago Móvil: Bs. ${stats.revenueByMethod.pago_movil.totalVes.toLocaleString('es-VE')} ($${stats.revenueByMethod.pago_movil.totalUsd.toFixed(2)})`, 16, 129);
  doc.text(`  - Zelle: $${stats.revenueByMethod.zelle.totalUsd.toFixed(2)}`, 16, 136);
  doc.text(`  - Binance Pay (USDT): ${stats.revenueByMethod.binance.totalUsdt.toFixed(2)} USDT`, 16, 143);
  doc.text(`  - Efectivo ($): $${stats.revenueByMethod.cash.totalUsd.toFixed(2)}`, 16, 150);

  // Attendance and Meals
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('4. Asistencia y Control de Cocina', 14, 162);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`• Asistentes que ingresaron al bulevar: ${stats.attendance.scannedCount} personas`, 16, 170);
  doc.text(`• Platos Navideños Servidos por Cocina: ${stats.attendance.mealsServedCount} platos`, 16, 177);
  doc.text(`• Entradas / Platos Pendientes por Llegar: ${stats.attendance.pendingScanCount} platos`, 16, 184);

  // Signatures
  doc.line(20, 245, 80, 245);
  doc.text('Firma Administración', 32, 251);
  doc.text('Anabella (Admin Evento)', 28, 256);

  doc.line(130, 245, 190, 245);
  doc.text('Firma Seminario', 145, 251);
  doc.text('Rector / Ecónomo', 145, 256);

  doc.save('Reporte_Ejecutivo_Parrandon_500_Personas.pdf');
}
