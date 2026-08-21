import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'parrandon_db.json');

let cachedRate: number | null = null;
let lastFetchTime: number = 0;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export async function fetchLiveEuroRate(): Promise<number> {
  const now = Date.now();
  if (cachedRate && (now - lastFetchTime < CACHE_TTL_MS)) {
    return cachedRate;
  }

  // 1. Primary Source: DolarApi (BCV Euro Oficial)
  try {
    const res = await fetch('https://ve.dolarapi.com/v1/euros/oficial', {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.promedio === 'number' && data.promedio > 0) {
        cachedRate = Number(data.promedio.toFixed(2));
        lastFetchTime = now;
        updateDbRate(cachedRate);
        return cachedRate;
      }
    }
  } catch (err) {
    console.warn('Fallo consulta a DolarApi Euro, intentando fallback...', err);
  }

  // 2. Fallback Source: Open Exchange Rates
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/EUR', {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.rates?.VES && typeof data.rates.VES === 'number' && data.rates.VES > 0) {
        cachedRate = Number(data.rates.VES.toFixed(2));
        lastFetchTime = now;
        updateDbRate(cachedRate);
        return cachedRate;
      }
    }
  } catch (err) {
    console.error('Fallo consulta a fallback de tasas:', err);
  }

  // 3. Last Fallback from DB or default
  if (fs.existsSync(DB_FILE)) {
    try {
      const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      if (db.config?.currentRateBs) {
        return db.config.currentRateBs;
      }
    } catch (e) {}
  }

  return cachedRate || 897.82;
}

function updateDbRate(rate: number) {
  try {
    if (fs.existsSync(DB_FILE)) {
      const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      if (db.config) {
        db.config.currentRateBs = rate;
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
      }
    }
  } catch (e) {
    console.error('Error guardando tasa en db:', e);
  }
}

export async function GET() {
  try {
    const rate = await fetchLiveEuroRate();
    return NextResponse.json({
      success: true,
      rate,
      currency: 'VES',
      source: 'Tasa Oficial del Día (BCV)',
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al consultar la tasa oficial' }, { status: 500 });
  }
}
