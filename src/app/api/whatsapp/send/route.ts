import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BOT_URL = process.env.WHATSAPP_BOT_URL || 'http://127.0.0.1:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, message } = body;

    if (!phone || !message) {
      return NextResponse.json({ success: false, error: 'phone y message son requeridos' }, { status: 400 });
    }

    const res = await fetch(`${BOT_URL}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message })
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Error proxying to WhatsApp bot:', error);
    return NextResponse.json({
      success: false,
      error: 'No se pudo conectar con el microservicio de WhatsApp Bot.'
    }, { status: 503 });
  }
}
