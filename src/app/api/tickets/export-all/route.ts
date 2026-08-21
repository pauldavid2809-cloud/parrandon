import { NextResponse } from 'next/server';
import { getTablesState, getAllOrders } from '@/lib/db';
import { generateTicketCodeWithSeat } from '@/lib/utils';
import { generateQrDataUrl } from '@/lib/qr';

export async function GET() {
  try {
    const [tables, orders] = await Promise.all([
      getTablesState(),
      getAllOrders()
    ]);

    const all500Seats: Array<{
      tableId: string;
      sector: string;
      tableNumber: number;
      seatNumber: number;
      ticketCode: string;
      status: 'disponible' | 'vendido_online' | 'vendido_parroquia' | 'vendido_taquilla' | 'pendiente';
      buyerName: string;
      buyerPhone: string;
      sellerName: string;
      parishName: string;
      orderId: string;
    }> = [];

    for (const table of tables) {
      for (const seat of table.seats) {
        let status: 'disponible' | 'vendido_online' | 'vendido_parroquia' | 'vendido_taquilla' | 'pendiente' = 'disponible';
        let buyerName = '';
        let buyerPhone = '';
        let sellerName = '';
        let parishName = '';
        let orderId = seat.orderId || '';
        let ticketCode = seat.ticketCode || generateTicketCodeWithSeat(table.id, seat.number);

        if (orderId) {
          const order = orders.find(o => o.id === orderId);
          if (order) {
            buyerName = order.buyerName;
            buyerPhone = order.buyerPhone;
            sellerName = order.sellerName || 'Venta Online';
            parishName = order.parishName || 'Web del Seminario';

            if (order.status === 'pending') {
              status = 'pendiente';
            } else if (order.salesChannel === 'seminarista_parroquia') {
              status = 'vendido_parroquia';
            } else if (order.salesChannel === 'taquilla') {
              status = 'vendido_taquilla';
            } else {
              status = 'vendido_online';
            }
          }
        }

        all500Seats.push({
          tableId: table.id,
          sector: table.sector,
          tableNumber: table.number,
          seatNumber: seat.number,
          ticketCode,
          status,
          buyerName,
          buyerPhone,
          sellerName,
          parishName,
          orderId
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalSeats: all500Seats.length,
      seats: all500Seats
    });
  } catch (error) {
    console.error('Error generating 500 seats export:', error);
    return NextResponse.json({ success: false, error: 'Error al exportar base de 500 asientos' }, { status: 500 });
  }
}
