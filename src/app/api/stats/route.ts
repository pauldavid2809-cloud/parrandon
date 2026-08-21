import { NextResponse } from 'next/server';
import { getEventStats } from '@/lib/db';

export async function GET() {
  try {
    const stats = await getEventStats();
    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ success: false, error: 'Error al obtener estadísticas' }, { status: 500 });
  }
}
