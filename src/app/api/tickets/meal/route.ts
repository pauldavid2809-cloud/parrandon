import { NextRequest, NextResponse } from 'next/server';
import { getOrderByTicketCode } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { Order } from '@/types';

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'parrandon_db.json');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticketCode, served } = body;

    if (!ticketCode) {
      return NextResponse.json({ success: false, error: 'Código de ticket requerido' }, { status: 400 });
    }

    if (!fs.existsSync(DB_FILE)) {
      return NextResponse.json({ success: false, error: 'Base de datos no encontrada' }, { status: 500 });
    }

    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const db = JSON.parse(raw);
    const cleanCode = ticketCode.trim().toUpperCase();

    let foundTicket = null;
    let foundOrder = null;

    for (let orderIndex = 0; orderIndex < db.orders.length; orderIndex++) {
      const order = db.orders[orderIndex];
      const ticketIndex = order.tickets?.findIndex((t: any) => t.ticketCode.toUpperCase() === cleanCode);

      if (ticketIndex !== undefined && ticketIndex !== -1) {
        const ticket = order.tickets[ticketIndex];

        if (order.status !== 'approved') {
          return NextResponse.json({
            success: false,
            status: 'pending_payment',
            message: 'La orden aún no ha sido aprobada.',
            ticket
          });
        }

        if (served !== false && ticket.mealServed) {
          return NextResponse.json({
            success: false,
            status: 'already_served',
            message: `¡ATENCIÓN! Este plato ya fue retirado previamente a las ${ticket.mealServedAt ? new Date(ticket.mealServedAt).toLocaleTimeString('es-VE') : 'más temprano'}.`,
            ticket
          });
        }

        // Update meal status
        const isNowServed = served !== undefined ? served : true;
        ticket.mealServed = isNowServed;
        ticket.mealServedAt = isNowServed ? new Date().toISOString() : undefined;

        // Auto mark as attended if claiming meal
        if (isNowServed && !ticket.isUsed) {
          ticket.isUsed = true;
          ticket.scannedAt = new Date().toISOString();
          ticket.scannedBy = 'Estación de Cocina';
        }

        order.tickets[ticketIndex] = ticket;
        db.orders[orderIndex] = order;
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');

        foundTicket = ticket;
        foundOrder = order;
        break;
      }
    }

    if (!foundTicket) {
      return NextResponse.json({
        success: false,
        status: 'not_found',
        message: 'Código de entrada no encontrado en el sistema.'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      status: 'served',
      message: `¡PLATO DESPACHADO! 1 Plato Navideño para ${foundTicket.attendeeName}.`,
      ticket: foundTicket,
      order: {
        id: foundOrder.id,
        buyerName: foundOrder.buyerName
      }
    });

  } catch (error) {
    console.error('Error dispatching meal:', error);
    return NextResponse.json({ success: false, error: 'Error al registrar plato' }, { status: 500 });
  }
}
