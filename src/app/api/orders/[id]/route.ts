import { NextRequest, NextResponse } from 'next/server';
import { getOrderById } from '@/lib/db';
import { hasRole } from '@/lib/auth';

// Comprobante público de una donación. Los números de orden son fáciles de adivinar,
// así que el público solo ve lo necesario; administración ve la orden completa.
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json({ success: false, error: 'Orden no encontrada' }, { status: 404 });
    }

    if (await hasRole('admin')) return NextResponse.json({ success: true, order });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        createdAt: order.createdAt,
        buyerName: order.buyerName.trim().split(/\s+/)[0] || '',
        isDonation: Boolean(order.isDonation),
        convertedUsd: order.convertedUsd,
        amountPaid: order.amountPaid,
        currency: order.currency,
        status: order.status,
        rejectionReason: order.rejectionReason,
      },
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}
