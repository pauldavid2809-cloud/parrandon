import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { Order, EventStats } from '@/types';
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
