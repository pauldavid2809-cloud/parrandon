import { hasRole, unauthorized } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { getAllOrders, createOrder, searchOrdersOrTickets } from '@/lib/db';
import { sendWhatsAppNotificationForOrder } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  if (!(await hasRole('admin'))) return unauthorized();
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');

    if (search && search.trim()) {
      const results = await searchOrdersOrTickets(search);
      return NextResponse.json({
        success: true,
        orders: results.orders,
        ticketMatch: results.ticketMatch
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        }
      });
    }

    const orders = await getAllOrders();
    return NextResponse.json({ success: true, orders }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
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
      isDonation,
      donationAmount,
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

    // Las entradas ahora son físicas: por aquí solo entran donaciones (salvo administración).
    const isAdmin = await hasRole('admin');
    if (!isAdmin && (!isDonation || !['zelle', 'pago_movil'].includes(paymentMethod))) {
      return NextResponse.json(
        { success: false, error: 'Las entradas se activan escaneando el QR de la entrada de papel.' },
        { status: 400 }
      );
    }

    if (!buyerName || !buyerPhone || (!quantity && !isDonation) || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios para registrar la operación.' },
        { status: 400 }
      );
    }

    const order = await createOrder({
      buyerName,
      buyerEmail: buyerEmail || '',
      buyerPhone,
      buyerDocId: buyerDocId || '',
      quantity: isDonation ? 0 : Number(quantity || 0),
      isDonation: Boolean(isDonation),
      donationAmount: isDonation ? Number(convertedUsd || amountPaid || 0) : undefined,
      seats: isDonation ? [] : (Array.isArray(seats) ? seats : []),
      attendees: isDonation ? [] : (Array.isArray(attendees) ? attendees : []),
      paymentMethod,
      paymentReference: paymentReference || '',
      paymentProofUrl,
      amountPaid: Number(amountPaid),
      currency: currency || 'USD',
      convertedUsd: Number(convertedUsd),
      rateApplied: rateApplied ? Number(rateApplied) : undefined,
      salesChannel: isAdmin ? salesChannel || 'online' : 'online',
      sellerName,
      parishName,
      status: isAdmin ? status : undefined,
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
