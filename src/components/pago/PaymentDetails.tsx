'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export interface PagoInfo {
  priceUsd: number;
  rateBs: number;
  pagoMovil: { bank: string; phone: string; docId: string; holder: string };
  zelle: { email: string; holder: string };
}

export function formatBs(n: number) {
  return `Bs. ${n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function montoBs(pago: PagoInfo) {
  return Math.round(pago.priceUsd * pago.rateBs * 100) / 100;
}

function Row({ label, value, copy }: { label: string; value: string; copy?: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <dt className="text-sm text-ink-3">{label}</dt>
        <dd className="tabular break-words font-bold">{value}</dd>
      </div>
      {copy && (
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(copy);
              setDone(true);
              setTimeout(() => setDone(false), 1500);
            } catch {
              // el navegador no permitió copiar
            }
          }}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-sm font-bold text-ink-2 hover:bg-paper-2"
          aria-label={`Copiar ${label}`}
        >
          {done ? <Check className="h-4 w-4 text-verde" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
          {done ? 'Copiado' : 'Copiar'}
        </button>
      )}
    </div>
  );
}

export default function PaymentDetails({ method, pago }: { method: 'pago_movil' | 'zelle'; pago: PagoInfo }) {
  if (method === 'pago_movil') {
    const bs = montoBs(pago);
    return (
      <dl className="divide-y divide-line rounded-xl bg-paper-2 px-4">
        <Row label="Monto a pagar" value={formatBs(bs)} copy={bs.toFixed(2).replace('.', ',')} />
        <Row label="Banco" value={pago.pagoMovil.bank} />
        <Row label="Teléfono" value={pago.pagoMovil.phone} copy={pago.pagoMovil.phone.replace(/\D/g, '')} />
        <Row label="RIF / Cédula" value={pago.pagoMovil.docId} copy={pago.pagoMovil.docId} />
        <Row label="Titular" value={pago.pagoMovil.holder} />
        <p className="py-2 text-sm text-ink-3">
          ${pago.priceUsd} a la tasa oficial del día ({formatBs(pago.rateBs)} por dólar).
        </p>
      </dl>
    );
  }
  return (
    <dl className="divide-y divide-line rounded-xl bg-paper-2 px-4">
      <Row label="Monto a pagar" value={`$${pago.priceUsd.toFixed(2)}`} />
      <Row label="Correo Zelle" value={pago.zelle.email} copy={pago.zelle.email} />
      <Row label="Titular" value={pago.zelle.holder} />
    </dl>
  );
}
