// Dominio impreso dentro del QR de cada entrada.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://parrandon-seven.vercel.app').replace(/\/$/, '');

export function ticketUrl(code: string) {
  return `${SITE_URL}/e/${code}`;
}

export function formatNumber(n: number) {
  return String(n).padStart(3, '0');
}
