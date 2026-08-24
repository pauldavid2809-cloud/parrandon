import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BOT_URL = process.env.WHATSAPP_BOT_URL || 'https://parrandon-production.up.railway.app';

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
        error: 'El microservicio de WhatsApp Bot no está respondiendo en la URL configurada'
      });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({
      success: false,
      isConnected: false,
      state: 'offline',
      error: 'Microservicio de WhatsApp Bot apagado o no alcanzable'
    });
  }
}
