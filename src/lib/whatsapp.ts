import { Order, Ticket } from '@/types';

const BOT_URL = process.env.WHATSAPP_BOT_URL || 'https://parrandon-production.up.railway.app';

export async function sendWhatsAppNotificationForOrder(order: Order, baseUrl?: string) {
  if (!order || !order.buyerPhone || !order.tickets || order.tickets.length === 0) {
    return;
  }

  const domain = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://parrandon.vercel.app';
  const orderUrl = `${domain}/orden/${order.id}`;

  let message = '';

  if (order.tickets.length === 1) {
    const t = order.tickets[0];
    const ticketUrl = `${domain}/ticket/${t.ticketCode}`;
    message = `🎄 *Parrandón Navideño 2026 - Seminario Mayor Santo Tomás de Aquino (Maracaibo)*\n\n` +
      `¡Paz y Bien, *${t.attendeeName}*! Tu pago ha sido aprobado exitosamente.\n\n` +
      `🎟️ *Entrada N°:* #${t.ticketNumber}\n` +
      `🪑 *Tu Ubicación:* Mesa ${t.tableId} • Silla #${t.seatNumber} (Sector ${t.sector || 'A'})\n` +
      `🍽️ *Incluye:* 1 Plato Navideño Tradicional Completo\n` +
      `📅 *Fecha:* Sábado 12 de Diciembre de 2026 • 6:00 PM\n` +
      `📍 *Lugar:* Bulevar del Seminario Santo Tomás de Aquino (Maracaibo, Estado Zulia)\n\n` +
      `👉 *Abre tu código QR de acceso aquí:*\n${ticketUrl}\n\n` +
      `_Presenta este enlace en tu teléfono al momento de ingresar._`;
  } else {
    const ticketsSummary = order.tickets
      .map(t => `• Mesa ${t.tableId} Silla #${t.seatNumber} (${t.attendeeName})`)
      .join('\n');

    message = `🎄 *Parrandón Navideño 2026 - Seminario Mayor Santo Tomás de Aquino (Maracaibo)*\n\n` +
      `¡Paz y Bien, *${order.buyerName}*! Tu pago ha sido verificado y tus ${order.quantity} entradas están listas.\n\n` +
      `📦 *Paquete de Entradas:* ${order.quantity} Personas\n` +
      `🪑 *Ubicaciones Asignadas:*\n${ticketsSummary}\n\n` +
      `🍽️ *Incluye:* ${order.quantity} Platos Navideños Tradicionales Completos\n` +
      `📅 *Fecha:* Sábado 12 de Diciembre de 2026 • 6:00 PM\n` +
      `📍 *Lugar:* Bulevar del Seminario Santo Tomás de Aquino (Maracaibo, Estado Zulia)\n\n` +
      `👉 *Abre tus ${order.quantity} pases digitales con QR aquí:*\n${orderUrl}\n\n` +
      `_Presenta este enlace en tu teléfono al momento de ingresar._`;
  }

  try {
    const res = await fetch(`${BOT_URL}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: order.buyerPhone,
        message
      })
    });
    const data = await res.json();
    if (data.success) {
      console.log(`✅ WhatsApp automático enviado exitosamente a ${order.buyerPhone} para orden ${order.id}`);
    } else {
      console.log(`⚠️ WhatsApp no enviado (${data.error || 'bot no conectado'}). El usuario igual puede ver sus entradas por la web.`);
    }
  } catch (err: any) {
    console.log(`ℹ️ WhatsApp bot no disponible en este momento (${err.message}).`);
  }
}
