'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { HeartHandshake } from 'lucide-react';
import { Button, Choice, Field, Notice, Spinner, TextInput } from '@/components/ui';
import PaymentDetails, { formatBs, type PagoInfo } from '@/components/pago/PaymentDetails';
import ProofUpload from '@/components/pago/ProofUpload';

const MONTOS = [10, 20, 50, 100];

export default function DonarForm() {
  const [pago, setPago] = useState<PagoInfo | null>(null);
  const [amount, setAmount] = useState<number | null>(20);
  const [other, setOther] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [method, setMethod] = useState<'pago_movil' | 'zelle' | null>(null);
  const [reference, setReference] = useState('');
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [intention, setIntention] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/config', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        setPago({
          priceUsd: 20,
          rateBs: d.config.currentRateBs,
          pagoMovil: d.config.paymentDetails.pagoMovil,
          zelle: d.config.paymentDetails.zelle,
        });
      })
      .catch(() => setError('No se pudieron cargar los datos de pago.'));
  }, []);

  const usd = amount ?? (Number(other.replace(',', '.')) || 0);
  const bs = pago ? Math.round(usd * pago.rateBs * 100) / 100 : 0;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (usd < 1) return setError('Escribe el monto de tu donación.');
    if (name.trim().length < 3) return setError('Escribe tu nombre.');
    if (phone.replace(/\D/g, '').length < 10) return setError('Escribe un teléfono válido.');
    if (!method) return setError('Elige cómo vas a donar.');
    if (reference.trim().length < 4) return setError('Escribe la referencia del pago.');
    if (!proofUrl) return setError('Sube el capture del pago.');
    setSending(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isDonation: true,
          buyerName: name,
          buyerPhone: phone,
          paymentMethod: method,
          paymentReference: reference,
          paymentProofUrl: proofUrl,
          amountPaid: method === 'pago_movil' ? bs : usd,
          currency: method === 'pago_movil' ? 'VES' : 'USD',
          convertedUsd: usd,
          rateApplied: pago?.rateBs,
          notes: intention ? `Intención: ${intention}` : undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setOrderId(json.order.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la donación.');
    } finally {
      setSending(false);
    }
  };

  if (orderId) {
    return (
      <div className="rounded-2xl bg-verde p-6 text-paper sm:p-8">
        <HeartHandshake className="h-10 w-10 text-oro" aria-hidden />
        <p className="mt-3 font-display text-3xl">¡Gracias por tu donación!</p>
        <p className="mt-2 text-paper/85">
          La registramos con el número {orderId}. Cuando verifiquemos el pago quedará confirmada. Que Dios te bendiga.
        </p>
        <Link href={`/orden/${orderId}`} className="mt-6 inline-flex h-12 items-center rounded-xl bg-paper px-5 font-bold text-verde hover:bg-card">
          Ver mi donación
        </Link>
      </div>
    );
  }

  if (!pago) return error ? <Notice tone="error">{error}</Notice> : <Spinner />;

  return (
    <form onSubmit={submit} noValidate className="space-y-6 rounded-2xl bg-card p-5 shadow-[var(--shadow-soft)] sm:p-7">
      <Field label="¿Cuánto quieres donar?">
        <div className="grid grid-cols-4 gap-2">
          {MONTOS.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={amount === m}
              onClick={() => setAmount(m)}
              className={
                amount === m
                  ? 'h-12 rounded-xl bg-ink font-bold text-paper'
                  : 'h-12 rounded-xl border-2 border-line font-bold hover:border-ink-3'
              }
            >
              ${m}
            </button>
          ))}
        </div>
        <TextInput
          aria-label="Otro monto en dólares"
          inputMode="decimal"
          placeholder="Otro monto en $"
          value={other}
          onChange={(e) => {
            setOther(e.target.value);
            setAmount(null);
          }}
          className="mt-2"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tu nombre" htmlFor="d-nombre">
          <TextInput id="d-nombre" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </Field>
        <Field label="Teléfono" htmlFor="d-tel">
          <TextInput id="d-tel" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
        </Field>
      </div>
      <Field label="¿Cómo vas a donar?">
        <Choice
          name="Método"
          value={method}
          onChange={setMethod}
          className="grid-cols-2"
          options={[
            { value: 'pago_movil', label: 'Pago Móvil', detail: formatBs(bs) },
            { value: 'zelle', label: 'Zelle', detail: `$${usd.toFixed(2)}` },
          ]}
        />
      </Field>
      {method && <PaymentDetails method={method} pago={{ ...pago, priceUsd: usd }} />}
      <Field label="Número de referencia" htmlFor="d-ref">
        <TextInput id="d-ref" value={reference} onChange={(e) => setReference(e.target.value)} />
      </Field>
      <div>
        <p className="mb-1.5 text-[0.95rem] font-bold">Capture del pago</p>
        <ProofUpload value={proofUrl} onChange={setProofUrl} tag="donacion" />
      </div>
      <Field label="Intención (opcional)" htmlFor="d-int" hint="Si quieres que recemos por algo en particular.">
        <TextInput id="d-int" value={intention} onChange={(e) => setIntention(e.target.value)} />
      </Field>
      {error && <Notice tone="error">{error}</Notice>}
      <Button type="submit" size="lg" loading={sending} className="w-full">
        Registrar mi donación
      </Button>
    </form>
  );
}
