'use client';

import { useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ImagePlus } from 'lucide-react';
import { Button, Choice, Field, Notice, TextInput } from '@/components/ui';
import PaymentDetails, { formatBs, type PagoInfo } from '@/components/pago/PaymentDetails';
import { shrink } from '@/components/pago/ProofUpload';
import { guardarVenta, nuevoId, type VendedorLocal, type VentaLocal } from '@/lib/vender/cola';
import type { MetodoPago } from '@/lib/entradas/types';
import { cn } from '@/lib/utils';
import { leerImagen } from './NuevaVenta';

const MONTOS = [1, 5, 10, 20];

// Una donación que recibe el vendedor (sin entrada). Se guarda en el teléfono como las ventas y
// se sube sola cuando hay señal. El efectivo se entrega a administración junto con el de las entradas.
export default function NuevaDonacion({
  seller,
  pago,
  onCancel,
  onSaved,
}: {
  seller: VendedorLocal;
  pago: PagoInfo | null;
  onCancel: () => void;
  onSaved: (v: VentaLocal) => void;
}) {
  const [monto, setMonto] = useState<number | null>(null);
  const [otro, setOtro] = useState('');
  const [method, setMethod] = useState<MetodoPago | null>(null);
  const [reference, setReference] = useState('');
  const [proof, setProof] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [aviso, setAviso] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const usd = monto ?? (Math.round(Number(otro.replace(',', '.')) * 100) / 100 || 0);
  const bs = pago ? Math.round(usd * pago.rateBs * 100) / 100 : null;
  const electronico = method === 'zelle' || method === 'pago_movil';

  const elegirFoto = async (file: File | undefined) => {
    if (!file) return;
    try {
      setProof(await leerImagen(await shrink(file)));
      setErrors((e) => ({ ...e, proof: '' }));
    } catch {
      setAviso('No se pudo leer la foto. Intenta de nuevo.');
    }
  };

  const guardar = async (ev: FormEvent) => {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (usd < 1) e.monto = 'Escoge o escribe el monto (al menos $1).';
    else if (usd > 1000) e.monto = 'Una donación puede ser de hasta $1000. Si es más, avísale a administración.';
    if (!method) e.method = 'Elige cómo donaron.';
    if (electronico && reference.trim().length < 4) e.reference = 'Escribe la referencia (al menos 4 dígitos).';
    if (electronico && !proof) e.proof = 'Agrega la foto del capture del pago.';
    setErrors(e);
    if (Object.keys(e).length) {
      document.querySelector('[data-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSaving(true);
    const donacion: VentaLocal = {
      id: nuevoId(),
      seller,
      entradas: [],
      donacion: { montoUsd: usd },
      method: method!,
      reference: electronico ? reference.trim() : '',
      proofUrl: electronico ? proof : null,
      capturaObligatoria: true,
      buyerName: nombre.trim(),
      buyerPhone: telefono.trim(),
      soldAt: new Date().toISOString(),
      priceUsd: usd,
      rateBs: method === 'pago_movil' && pago ? pago.rateBs : null,
      estado: 'por_subir',
    };
    try {
      await guardarVenta(donacion);
      onSaved(donacion);
    } catch {
      setAviso('No se pudo guardar en el teléfono. Intenta de nuevo.');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={guardar} noValidate className="space-y-7">
      <button type="button" onClick={onCancel} className="inline-flex items-center gap-1.5 font-bold text-ink-2">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Mis ventas
      </button>
      <h1 className="font-display text-3xl sm:text-4xl">Registrar donación</h1>

      <section aria-labelledby="nd-monto" className="space-y-3" data-error={Boolean(errors.monto)}>
        <h2 id="nd-monto" className="text-lg font-bold">
          ¿Cuánto donan?
        </h2>
        <div className="grid max-w-md grid-cols-4 gap-2">
          {MONTOS.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={monto === m}
              onClick={() => {
                setMonto(m);
                setOtro('');
                setErrors((e) => ({ ...e, monto: '' }));
              }}
              className={cn(
                'tabular h-14 rounded-xl font-display text-xl transition-transform active:scale-[0.97]',
                monto === m ? 'bg-ink text-paper' : 'border-2 border-line bg-card hover:border-ink-3'
              )}
            >
              ${m}
            </button>
          ))}
        </div>
        <div className="max-w-md">
          <TextInput
            aria-label="Otro monto en dólares"
            inputMode="decimal"
            placeholder="Otro monto en $"
            value={otro}
            onChange={(e) => {
              setOtro(e.target.value);
              setMonto(null);
              setErrors((x) => ({ ...x, monto: '' }));
            }}
          />
        </div>
        {errors.monto && <p className="text-sm font-bold text-rojo">{errors.monto}</p>}
      </section>

      <section aria-labelledby="nd-pago" className="space-y-4">
        <h2 id="nd-pago" className="text-lg font-bold">
          ¿Cómo donaron?
        </h2>
        <div data-error={Boolean(errors.method)}>
          <Choice
            name="Método de la donación"
            value={method}
            onChange={(m) => {
              setMethod(m);
              setErrors((e) => ({ ...e, method: '' }));
            }}
            className={cn('grid-cols-1', pago?.pagoMovilActivo ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}
            options={[
              { value: 'efectivo_usd', label: 'Efectivo $', detail: usd >= 1 ? `$${usd.toFixed(2)}` : 'en dólares' },
              ...(pago?.pagoMovilActivo
                ? [{ value: 'pago_movil' as const, label: 'Pago Móvil', detail: bs != null && usd >= 1 ? formatBs(bs) : 'en bolívares' }]
                : []),
              { value: 'zelle', label: 'Zelle', detail: usd >= 1 ? `$${usd.toFixed(2)}` : 'en dólares' },
            ]}
          />
          {errors.method && <p className="mt-1.5 text-sm font-bold text-rojo">{errors.method}</p>}
        </div>
        {method === 'efectivo_usd' && usd >= 1 && (
          <Notice tone="info">Recibe ${usd.toFixed(2)}. Ese efectivo lo entregas a administración junto con el de las entradas.</Notice>
        )}
        {electronico && (
          <>
            {pago && usd >= 1 && <PaymentDetails method={method} pago={{ ...pago, priceUsd: usd }} />}
            <Field label="Número de referencia" htmlFor="nd-ref" error={errors.reference}>
              <TextInput
                id="nd-ref"
                inputMode={method === 'pago_movil' ? 'numeric' : 'text'}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                data-error={Boolean(errors.reference)}
              />
            </Field>
            <div data-error={Boolean(errors.proof)}>
              <p className="mb-1.5 text-[0.95rem] font-bold">Capture del pago</p>
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
              {errors.proof && <p className="mt-1.5 text-sm font-bold text-rojo">{errors.proof}</p>}
            </div>
          </>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="¿Quién dona? (opcional)" htmlFor="nd-nombre" hint="Si no lo quiere decir, queda como anónima.">
          <TextInput id="nd-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} autoCapitalize="words" />
        </Field>
        <Field label="Teléfono (opcional)" htmlFor="nd-tel">
          <TextInput id="nd-tel" type="tel" inputMode="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        </Field>
      </div>

      {aviso && <Notice tone="error">{aviso}</Notice>}
      <div className="sticky bottom-3 z-20">
        <Button type="submit" size="lg" loading={saving} className="w-full shadow-[var(--shadow-ticket)]">
          {usd >= 1 ? `Guardar donación · $${usd.toFixed(2)}` : 'Guardar donación'}
        </Button>
      </div>
    </form>
  );
}
