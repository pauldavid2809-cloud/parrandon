import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BOT_URL = process.env.WHATSAPP_BOT_URL || 'https://parrandon-production.up.railway.app';

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
