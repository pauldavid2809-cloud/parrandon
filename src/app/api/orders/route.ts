import { NextRequest, NextResponse } from 'next/server';
import { getAllOrders, createOrder, searchOrdersOrTickets } from '@/lib/db';
import { sendWhatsAppNotificationForOrder } from '@/lib/whatsapp';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');

    if (search && search.trim()) {
      const results = await searchOrdersOrTickets(search);
      return NextResponse.json({
        success: true,
        orders: results.orders,
        ticketMatch: results.ticketMatch
      });
    }

    const orders = await getAllOrders();
    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ success: false, error: 'Error al obtener órdenes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      buyerName,
      buyerEmail,
      buyerPhone,
      buyerDocId,
      quantity,
      seats,
      attendees,
      paymentMethod,
      paymentReference,
      paymentProofUrl,
      amountPaid,
      currency,
      convertedUsd,
      rateApplied,
      salesChannel,
      sellerName,
      parishName,
      status,
      notes
    } = body;

    if (!buyerName || !buyerPhone || !quantity || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios para registrar la compra.' },
        { status: 400 }
      );
    }

    const order = await createOrder({
      buyerName,
      buyerEmail: buyerEmail || '',
      buyerPhone,
      buyerDocId: buyerDocId || '',
      quantity: Number(quantity),
      seats: Array.isArray(seats) ? seats : [],
      attendees: Array.isArray(attendees) ? attendees : [],
      paymentMethod,
      paymentReference: paymentReference || '',
      paymentProofUrl,
      amountPaid: Number(amountPaid),
      currency: currency || 'USD',
      convertedUsd: Number(convertedUsd),
      rateApplied: rateApplied ? Number(rateApplied) : undefined,
      salesChannel: salesChannel || 'online',
      sellerName,
      parishName,
      status,
      notes
    });

    if (order.status === 'approved') {
      sendWhatsAppNotificationForOrder(order).catch(err => {
        console.error('Error enviando WhatsApp automático:', err);
      });
    }

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ success: false, error: 'Error al procesar la orden' }, { status: 500 });
  }
}
