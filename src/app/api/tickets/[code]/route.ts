import { NextRequest, NextResponse } from 'next/server';
import { getOrderByTicketCode } from '@/lib/db';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;
    const result = await getOrderByTicketCode(code);

    if (!result) {
      return NextResponse.json({ success: false, error: 'Entrada no encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      ticket: result.ticket,
      order: {
        id: result.order.id,
        buyerName: result.order.buyerName,
        buyerPhone: result.order.buyerPhone,
        status: result.order.status
      }
    });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}
