import { NextRequest, NextResponse } from 'next/server';
import { updateOrderStatus } from '@/lib/db';
import { sendWhatsAppNotificationForOrder } from '@/lib/whatsapp';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { status, rejectionReason, verifiedBy, notes } = body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Estatus inválido. Debe ser approved, rejected o pending.' },
        { status: 400 }
      );
    }

    const updatedOrder = await updateOrderStatus(id, status, {
      rejectionReason,
      verifiedBy: verifiedBy || 'Anabella (Admin)',
      notes
    });

    if (!updatedOrder) {
      return NextResponse.json({ success: false, error: 'Orden no encontrada' }, { status: 404 });
    }

    // Auto-send WhatsApp notification if approved
    if (status === 'approved') {
      sendWhatsAppNotificationForOrder(updatedOrder).catch(err => {
        console.error('Error enviando WhatsApp automático:', err);
      });
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ success: false, error: 'Error al actualizar estatus de la orden' }, { status: 500 });
  }
}
