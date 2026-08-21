import { NextRequest, NextResponse } from 'next/server';
import { scanTicket } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticketCode, scannedBy } = body;

    if (!ticketCode) {
      return NextResponse.json(
        { success: false, error: 'Código de ticket requerido' },
        { status: 400 }
      );
    }

    const result = await scanTicket(ticketCode, scannedBy || 'Personal de Puerta');

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error scanning ticket:', error);
    return NextResponse.json(
      {
        success: false,
        status: 'not_found',
        message: 'Error al procesar el escaneo del código.'
      },
      { status: 500 }
    );
  }
}
