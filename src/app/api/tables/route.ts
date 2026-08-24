import { NextResponse } from 'next/server';
import { getTablesState } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const tables = await getTablesState();
    return NextResponse.json(
      { success: true, tables },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error) {
    console.error('Error fetching tables:', error);
    return NextResponse.json({ success: false, error: 'Error al consultar mapa de mesas' }, { status: 500 });
  }
}
