import { NextResponse } from 'next/server';
import { getTablesState } from '@/lib/db';

export async function GET() {
  try {
    const tables = await getTablesState();
    return NextResponse.json({ success: true, tables });
  } catch (error) {
    console.error('Error fetching tables:', error);
    return NextResponse.json({ success: false, error: 'Error al consultar mapa de mesas' }, { status: 500 });
  }
}
