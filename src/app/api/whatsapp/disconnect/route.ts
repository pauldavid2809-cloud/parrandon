import { NextResponse } from 'next/server';

const BOT_URL = 'http://127.0.0.1:3001';

export async function POST() {
  try {
    const res = await fetch(`${BOT_URL}/disconnect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al desconectar WhatsApp' }, { status: 500 });
  }
}
