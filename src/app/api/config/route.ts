import { NextRequest, NextResponse } from 'next/server';
import { getEventConfig, updateEventConfig } from '@/lib/db';
import { fetchLiveEuroRate } from '@/app/api/rates/route';

export async function GET() {
  try {
    const config = await getEventConfig();
    const liveRate = await fetchLiveEuroRate();
    if (liveRate && liveRate > 0) {
      config.currentRateBs = liveRate;
    }
    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('Error fetching config:', error);
    return NextResponse.json({ success: false, error: 'Error al obtener configuración' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const updated = await updateEventConfig(body);
    return NextResponse.json({ success: true, config: updated });
  } catch (error) {
    console.error('Error updating config:', error);
    return NextResponse.json({ success: false, error: 'Error al actualizar configuración' }, { status: 500 });
  }
}
