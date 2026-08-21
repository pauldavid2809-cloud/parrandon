import { NextRequest, NextResponse } from 'next/server';
import { getTablesState, getAllOrders } from '@/lib/db';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'parrandon_db.json');

export async function GET() {
  try {
    const [tables, orders] = await Promise.all([
      getTablesState(),
      getAllOrders()
    ]);

    let totalPlatesServed = 0;
    let totalPlatesConfirmed = 0;
    let servedTablesCount = 0;

    const tablesMealData = tables.map(table => {
      // Find all tickets belonging to this table
      const tableTickets: Array<{
        seatNumber: number;
        attendeeName: string;
        ticketCode: string;
        isUsed: boolean;
        mealServed: boolean;
        mealServedAt?: string;
      }> = [];

      let tableServedCount = 0;
      let tableOccupiedCount = 0;
      let lastMealServedAt: string | undefined = undefined;

      table.seats.forEach(seat => {
        if (seat.isOccupied) {
          tableOccupiedCount++;
          totalPlatesConfirmed++;
        }

        // Find ticket
        for (const order of orders) {
          if (order.status === 'rejected') continue;
          const t = order.tickets?.find(ticket => ticket.tableId === table.id && ticket.seatNumber === seat.number);
          if (t) {
            if (t.mealServed) {
              tableServedCount++;
              totalPlatesServed++;
              if (t.mealServedAt) lastMealServedAt = t.mealServedAt;
            }
            tableTickets.push({
              seatNumber: seat.number,
              attendeeName: t.attendeeName,
              ticketCode: t.ticketCode,
              isUsed: t.isUsed,
              mealServed: t.mealServed,
              mealServedAt: t.mealServedAt
            });
            break;
          }
        }
      });

      // A table is considered "Served" if it was dispatched
      const isMealServed = tableOccupiedCount > 0 
        ? tableServedCount >= tableOccupiedCount 
        : tableServedCount > 0;

      if (isMealServed) {
        servedTablesCount++;
      }

      return {
        tableId: table.id,
        sector: table.sector,
        number: table.number,
        totalSeats: 10,
        occupiedSeats: tableOccupiedCount || 10, // default 10 capacity
        servedPlatesCount: tableServedCount,
        isMealServed,
        mealServedAt: lastMealServedAt,
        tickets: tableTickets
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalTables: 50,
        servedTablesCount,
        pendingTablesCount: 50 - servedTablesCount,
        totalPlatesServed,
        totalPlatesConfirmed: totalPlatesConfirmed || 500
      },
      tables: tablesMealData
    });
  } catch (error) {
    console.error('Error fetching tables meal data:', error);
    return NextResponse.json({ success: false, error: 'Error al consultar estado de mesas en cocina' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableId, served } = body;

    if (!tableId) {
      return NextResponse.json({ success: false, error: 'tableId es requerido (ej: A1)' }, { status: 400 });
    }

    if (!fs.existsSync(DB_FILE)) {
      return NextResponse.json({ success: false, error: 'Base de datos no encontrada' }, { status: 500 });
    }

    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const db = JSON.parse(raw);
    const cleanTableId = tableId.trim().toUpperCase();
    const isNowServed = served !== undefined ? served : true;
    const now = new Date().toISOString();

    let updatedTicketsCount = 0;

    for (let orderIndex = 0; orderIndex < db.orders.length; orderIndex++) {
      const order = db.orders[orderIndex];
      if (order.status === 'rejected') continue;

      if (order.tickets && Array.isArray(order.tickets)) {
        for (let tIndex = 0; tIndex < order.tickets.length; tIndex++) {
          const t = order.tickets[tIndex];
          if (t.tableId?.toUpperCase() === cleanTableId) {
            t.mealServed = isNowServed;
            t.mealServedAt = isNowServed ? now : undefined;
            if (isNowServed && !t.isUsed) {
              // Auto mark entry as attended when serving food
              t.isUsed = true;
              t.scannedAt = now;
              t.scannedBy = 'Estación de Cocina (Despacho de Mesa)';
            }
            updatedTicketsCount++;
          }
        }
      }
    }

    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      tableId: cleanTableId,
      isMealServed: isNowServed,
      updatedTicketsCount,
      mealServedAt: isNowServed ? now : undefined,
      message: isNowServed
        ? `✅ ¡Mesa ${cleanTableId} marcada como SERVIDA con éxito!`
        : `Mesa ${cleanTableId} marcada como PENDIENTE.`
    });
  } catch (error) {
    console.error('Error updating table meal status:', error);
    return NextResponse.json({ success: false, error: 'Error al actualizar platos de la mesa' }, { status: 500 });
  }
}
