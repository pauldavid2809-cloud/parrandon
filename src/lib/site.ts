// Dominio impreso dentro del QR de cada entrada.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://parrandon-seven.vercel.app').replace(/\/$/, '');

export function ticketUrl(code: string) {
  return `${SITE_URL}/e/${code}`;
}

export function formatNumber(n: number) {
  return String(n).padStart(3, '0');
}

// [1,2,3,10,11] → "#001-#003, #010-#011"
export function formatRangos(numbers: number[]) {
  const n = [...numbers].sort((a, b) => a - b);
  const partes: string[] = [];
  for (let i = 0; i < n.length; ) {
    let j = i;
    while (j + 1 < n.length && n[j + 1] === n[j] + 1) j++;
    partes.push(i === j ? `#${formatNumber(n[i])}` : `#${formatNumber(n[i])}-#${formatNumber(n[j])}`);
    i = j + 1;
  }
  return partes.join(', ');
}
