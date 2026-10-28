import 'server-only';
import { getEventConfig, updateEventConfig } from '@/lib/db';

// Tasa oficial del día (Euro BCV), con caché de 15 minutos. Si las fuentes fallan,
// se usa la última tasa guardada en la configuración y no se reintenta hasta que venza la caché.
let cachedRate: number | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 15 * 60 * 1000;

async function fromSources(): Promise<number | null> {
  try {
    const res = await fetch('https://ve.dolarapi.com/v1/euros/oficial', {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      if (typeof data?.promedio === 'number' && data.promedio > 0) return Number(data.promedio.toFixed(2));
    }
  } catch {
    // probamos la siguiente fuente
  }
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/EUR', {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      if (typeof data?.rates?.VES === 'number' && data.rates.VES > 0) return Number(data.rates.VES.toFixed(2));
    }
  } catch {
    // sin conexión a las fuentes
  }
  return null;
}

export async function fetchLiveEuroRate(): Promise<number> {
  const now = Date.now();
  if (cachedRate && now - lastFetchTime < CACHE_TTL_MS) return cachedRate;

  const live = await fromSources();
  lastFetchTime = now;
  if (live) {
    cachedRate = live;
    try {
      await updateEventConfig({ currentRateBs: live });
    } catch {
      // la tasa en memoria sigue sirviendo
    }
    return live;
  }
  try {
    const config = await getEventConfig();
    if (config.currentRateBs) cachedRate = config.currentRateBs;
  } catch {
    // sin configuración disponible
  }
  return cachedRate || 897.82;
}
