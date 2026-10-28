import { NextResponse } from 'next/server';
import { FUENTE_TASA, fetchLiveRate } from '@/lib/rates';

export async function GET() {
  try {
    const rate = await fetchLiveRate();
    return NextResponse.json({
      success: true,
      rate,
      currency: 'VES',
      source: FUENTE_TASA,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Error al consultar la tasa del día' }, { status: 500 });
  }
}
