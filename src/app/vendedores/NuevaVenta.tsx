'use client';

import { useMemo, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ImagePlus, X } from 'lucide-react';
import { Button, Choice, Field, Notice, TextInput } from '@/components/ui';
import CameraScanner from '@/components/CameraScanner';
import PaymentDetails, { formatBs, type PagoInfo } from '@/components/pago/PaymentDetails';
import { shrink } from '@/components/pago/ProofUpload';
import { guardarVenta, nuevoId, useVentasLocales, type VendedorLocal, type VentaLocal } from '@/lib/vender/cola';
import { MAX_ENTRADAS_POR_VENTA, type EntradaStatus, type MetodoPago } from '@/lib/entradas/types';
import { formatNumber } from '@/lib/site';
import { cn } from '@/lib/utils';

const CODE_RE = /P\d{3,4}-[2-9A-HJ-NP-Z]{8}/i;

export interface LoteItem {
  number: number;
  status: EntradaStatus;
  tableId: string | null;
  buyer: string | null;
  checkedIn: boolean;
}

function hora(iso: string) {
  return new Date(iso).toLocaleTimeString('es-VE', { hour: 'numeric', minute: '2-digit' });
}

function leerImagen(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

// Una venta: se escanean una o varias entradas, se marca cómo pagaron y se guarda en el
// teléfono. Se sube sola cuando hay señal; cada persona completa sus datos con su QR.
export default function NuevaVenta({
  seller,
  pago,
  lote,
  onCancel,
  onSaved,
}: {
  seller: VendedorLocal;
  pago: PagoInfo | null;
  lote: LoteItem[] | null;
  onCancel: () => void;
  onSaved: (v: VentaLocal) => void;
}) {
  const locales = useVentasLocales();
  const [entradas, setEntradas] = useState<{ code: string; number: number }[]>([]);
  const [aviso, setAviso] = useState<{ tone: 'ok' | 'warn' | 'error'; text: string } | null>(null);
  const [manual, setManual] = useState('');
  const [method, setMethod] = useState<MetodoPago | null>(null);
  const [reference, setReference] = useState('');
  const [proof, setProof] = useState<string | null>(null);
  const [buyerName, setBuyerName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Entradas ya vendidas desde este teléfono (menos las que administración rechazó).
  const vendidasAqui = useMemo(() => {
    const m = new Map<string, VentaLocal>();
    for (const v of locales) {
      if (v.servidor?.estado === 'rechazada' || v.estado === 'no_se_pudo') continue;
      for (const e of v.entradas) m.set(e.code, v);
    }
    return m;
  }, [locales]);

  const agregar = (raw: string) => {
    const match = raw.toUpperCase().replace(/\s+/g, '').match(CODE_RE);
    if (!match) {
      setAviso({ tone: 'error', text: 'Ese no es el QR de una entrada del Parrandón.' });
      return;
    }
    const code = match[0];
    const number = Number(code.slice(1, code.indexOf('-')));
    if (entradas.some((e) => e.code === code)) {
      setAviso({ tone: 'warn', text: `La N.º ${formatNumber(number)} ya está en esta venta.` });
      return;
    }
    const otra = vendidasAqui.get(code);
    if (otra) {
      setAviso({ tone: 'error', text: `La N.º ${formatNumber(number)} ya la vendiste en otra venta (${hora(otra.soldAt)}).` });
      return;
    }
    if (entradas.length >= MAX_ENTRADAS_POR_VENTA) {
      setAviso({ tone: 'error', text: `Una venta puede tener hasta ${MAX_ENTRADAS_POR_VENTA} entradas. Guarda esta y haz otra.` });
      return;
    }
    const enLote = lote?.find((e) => e.number === number);
    setEntradas((prev) => [...prev, { code, number }]);
    setErrors((e) => ({ ...e, entradas: '' }));
    setAviso(
      enLote && enLote.status !== 'sin_vender'
        ? { tone: 'warn', text: `N.º ${formatNumber(number)} agregada, pero en tu lote aparece como vendida. Revisa que sea la correcta.` }
        : lote && !enLote
          ? { tone: 'warn', text: `N.º ${formatNumber(number)} agregada. No es de tu lote: queda anotado que la vendiste tú.` }
          : { tone: 'ok', text: `N.º ${formatNumber(number)} agregada.` }
    );
  };

  const n = entradas.length;
  const precio = pago?.priceUsd ?? 20;
  const totalUsd = n * precio;
  const totalBs = pago ? Math.round(totalUsd * pago.rateBs * 100) / 100 : null;

  const elegirFoto = async (file: File | undefined) => {
    if (!file) return;
    try {
      setProof(await leerImagen(await shrink(file)));
    } catch {
      setAviso({ tone: 'error', text: 'No se pudo leer la foto. Intenta de nuevo.' });
    }
  };

  const guardar = async (ev: FormEvent) => {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (n === 0) e.entradas = 'Escanea al menos una entrada.';
    if (!method) e.method = 'Elige cómo pagaron.';
    if (method && method !== 'efectivo_usd' && reference.trim().length < 4) e.reference = 'Escribe la referencia (al menos 4 dígitos).';
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    const venta: VentaLocal = {
      id: nuevoId(),
      seller,
      entradas,
      method: method!,
      reference: reference.trim(),
      proofUrl: method === 'efectivo_usd' ? null : proof,
      buyerName: buyerName.trim(),
      soldAt: new Date().toISOString(),
      priceUsd: precio,
      rateBs: method === 'pago_movil' && pago ? pago.rateBs : null,
      estado: 'por_subir',
    };
    try {
      await guardarVenta(venta);
      onSaved(venta);
    } catch {
      setAviso({ tone: 'error', text: 'No se pudo guardar en el teléfono. Intenta de nuevo.' });
      setSaving(false);
    }
  };

  return (
    <form onSubmit={guardar} noValidate className="space-y-7">
      <button type="button" onClick={onCancel} className="inline-flex items-center gap-1.5 font-bold text-ink-2">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Mis ventas
      </button>
      <h1 className="font-display text-3xl sm:text-4xl">Nueva venta</h1>

      <section aria-labelledby="nv-entradas" className="space-y-3">
        <h2 id="nv-entradas" className="text-lg font-bold">
          Escanea las entradas que entregas
        </h2>
        <div className="max-w-sm">
          <CameraScanner autoStart onResult={agregar} />
        </div>
        <div className="flex max-w-md gap-2">
          <TextInput
            aria-label="Código de la entrada"
            placeholder="O escribe el código: P123-ABCD2345"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            autoCapitalize="characters"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                agregar(manual);
                setManual('');
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              agregar(manual);
              setManual('');
            }}
          >
            Agregar
          </Button>
        </div>
        <p aria-live="polite" className="min-h-6">
          {aviso && (
            <span className={cn('font-bold', aviso.tone === 'ok' ? 'text-verde' : aviso.tone === 'warn' ? 'text-oro-ink' : 'text-rojo')}>
              {aviso.text}
            </span>
          )}
        </p>
        {n > 0 ? (
          <ul aria-label="Entradas en esta venta" className="flex flex-wrap gap-2">
            {entradas.map((e) => (
              <li key={e.code} className="tabular inline-flex items-center gap-1 rounded-full bg-card py-1 pl-4 pr-1 font-display text-xl shadow-[var(--shadow-soft)]">
                {formatNumber(e.number)}
                <button
                  type="button"
                  onClick={() => setEntradas((prev) => prev.filter((x) => x.code !== e.code))}
                  aria-label={`Quitar la entrada ${formatNumber(e.number)}`}
                  className="grid h-9 w-9 place-items-center rounded-full text-ink-2 hover:bg-paper-2"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          errors.entradas && <p className="text-sm font-bold text-rojo">{errors.entradas}</p>
        )}
      </section>

      <section aria-labelledby="nv-pago" className="space-y-4">
        <h2 id="nv-pago" className="text-lg font-bold">
          ¿Cómo pagaron?
        </h2>
        <div data-error={Boolean(errors.method)}>
          <Choice
            name="Método de pago"
            value={method}
            onChange={setMethod}
            className="grid-cols-1 sm:grid-cols-3"
            options={[
              { value: 'efectivo_usd', label: 'Efectivo $', detail: n ? `$${totalUsd.toFixed(2)}` : `$${precio.toFixed(2)} c/u` },
              { value: 'pago_movil', label: 'Pago Móvil', detail: totalBs != null && n ? formatBs(totalBs) : 'en bolívares' },
              { value: 'zelle', label: 'Zelle', detail: n ? `$${totalUsd.toFixed(2)}` : `$${precio.toFixed(2)} c/u` },
            ]}
          />
          {errors.method && <p className="mt-1.5 text-sm font-bold text-rojo">{errors.method}</p>}
        </div>
        {method && method !== 'efectivo_usd' && (
          <>
            {pago && n > 0 && <PaymentDetails method={method} pago={{ ...pago, priceUsd: totalUsd }} />}
            <Field label="Número de referencia" htmlFor="nv-ref" error={errors.reference}>
              <TextInput
                id="nv-ref"
                inputMode={method === 'pago_movil' ? 'numeric' : 'text'}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </Field>
            <div>
              <p className="mb-1.5 text-[0.95rem] font-bold">Capture (opcional)</p>
              {proof ? (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={proof} alt="Capture del pago" className="h-20 w-20 rounded-lg object-cover" />
                  <Button type="button" variant="quiet" size="sm" onClick={() => setProof(null)}>
                    Quitar
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                  <ImagePlus className="h-4 w-4" aria-hidden /> Agregar foto del capture
                </Button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                tabIndex={-1}
                aria-hidden
                onChange={(e) => elegirFoto(e.target.files?.[0])}
              />
            </div>
          </>
        )}
        {method === 'efectivo_usd' && n > 0 && (
          <Notice tone="info">Cobra ${totalUsd.toFixed(2)}. Ese efectivo lo entregas a administración.</Notice>
        )}
      </section>

      <Field label="¿A nombre de quién? (opcional)" htmlFor="nv-comprador" hint="Para reconocer la venta. Cada persona pone sus datos al escanear su entrada.">
        <TextInput id="nv-comprador" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} autoCapitalize="words" />
      </Field>

      <div className="sticky bottom-3 z-20">
        <Button type="submit" size="lg" loading={saving} className="w-full shadow-[var(--shadow-ticket)]">
          {n === 0 ? 'Guardar venta' : `Guardar venta · ${n} ${n === 1 ? 'entrada' : 'entradas'} · $${totalUsd.toFixed(2)}`}
        </Button>
      </div>
    </form>
  );
}
