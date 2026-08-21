import { NextResponse } from 'next/server';

const BOT_URL = 'http://127.0.0.1:3001';

export async function GET() {
  try {
    const res = await fetch(`${BOT_URL}/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    });

    if (!res.ok) {
      return NextResponse.json({
        success: false,
        isConnected: false,
        state: 'offline',
        error: 'El servicio de WhatsApp Bot no está respondiendo en el puerto 3001'
      });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({
      success: false,
      isConnected: false,
      state: 'offline',
      error: 'Servicio de WhatsApp Bot apagado o no iniciado'
    });
  }
}
