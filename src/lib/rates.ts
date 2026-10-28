import 'server-only';
import { getEventConfig, updateEventConfig } from '@/lib/db';

// Tasa Binance del día: lo que cuesta comprar un dólar (USDT) con bolívares en Binance P2P.
// Caché de 15 minutos. Si Binance no responde (puede bloquear la región del servidor), se prueban
// CriptoYa y DolarApi, que publican ese mismo mercado; si todo falla, se usa la última tasa guardada.
export const FUENTE_TASA = 'Tasa Binance del día (USDT/VES)';

let cachedRate: number | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 15 * 60 * 1000;
const TIMEOUT_MS = 2500;

const valida = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0;

function mediana(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

async function json(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: { Accept: 'application/json', ...(init?.headers || {}) },
    cache: 'no-store',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  return res.ok ? res.json() : null;
}

// Mediana de los 10 mejores anuncios para comprar USDT que aceptan un pago del tamaño de
// una entrada (~20.000 Bs): sin ese filtro entran anuncios con mínimos de millones.
async function binance(): Promise<number | null> {
  const data = await json('https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      asset: 'USDT',
      fiat: 'VES',
      tradeType: 'BUY',
      page: 1,
      rows: 10,
      payTypes: [],
      publisherType: null,
      transAmount: '20000',
    }),
  });
  const precios = ((data?.data ?? []) as { adv?: { price?: string } }[]).map((a) => Number(a.adv?.price)).filter(valida);
  return precios.length >= 3 ? mediana(precios) : null;
}

async function criptoya(): Promise<number | null> {
  const data = await json('https://criptoya.com/api/binancep2p/USDT/VES/20');
  return valida(data?.ask) ? data.ask : null;
}

async function dolarapiParalelo(): Promise<number | null> {
  const data = await json('https://ve.dolarapi.com/v1/dolares/paralelo');
  return valida(data?.promedio) ? data.promedio : null;
}

async function fromSources(): Promise<number | null> {
  for (const fuente of [binance, criptoya, dolarapiParalelo]) {
    try {
      const tasa = await fuente();
      if (tasa) return Number(tasa.toFixed(2));
    } catch {
      // probamos la siguiente fuente
    }
  }
  return null;
}

export async function fetchLiveRate(): Promise<number> {
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
  return cachedRate || 1000;
}
