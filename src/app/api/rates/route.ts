import { NextResponse } from 'next/server';
import { fetchLiveEuroRate } from '@/lib/rates';

export async function GET() {
  try {
    const rate = await fetchLiveEuroRate();
    return NextResponse.json({
      success: true,
      rate,
      currency: 'VES',
      source: 'Tasa Oficial del Día (Euro BCV)',
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Error al consultar la tasa oficial' }, { status: 500 });
  }
}
