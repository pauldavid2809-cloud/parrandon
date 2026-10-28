'use client';

import { useEffect, useState } from 'react';
import { Button, Field, Notice, Spinner, TextInput } from '@/components/ui';
import { api, PageTitle } from '@/components/admin/api';
import type { EventConfig } from '@/types';

type Pins = Record<'puerta' | 'cocina' | 'taquilla', string | null>;

export default function ConfiguracionAdmin() {
  const [config, setConfig] = useState<EventConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ config: EventConfig }>('/api/config')
      .then((d) => setConfig(d.config))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="max-w-4xl space-y-12">
      <PageTitle title="Configuración" />
      {error && <Notice tone="error">{error}</Notice>}
      <PinsForm />
      {!config && !error && <Spinner />}
      {config && <EventoForm config={config} onSaved={setConfig} />}
    </div>
  );
}

function PinsForm() {
  const [pins, setPins] = useState<Pins | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    api<{ pins: Pins }>('/api/admin/pins')
      .then((d) => setPins(d.pins))
      .catch((err) => setMsg({ tone: 'error', text: err.message }));
  }, []);

  const save = async (role: keyof Pins) => {
    setBusy(role);
    setMsg(null);
    try {
      await api('/api/admin/pins', { method: 'POST', body: { role, pin: draft[role] } });
      setPins((p) => (p ? { ...p, [role]: draft[role] } : p));
      setDraft((d) => ({ ...d, [role]: '' }));
      setMsg({ tone: 'ok', text: `PIN de ${role} guardado.` });
    } catch (err) {
      setMsg({ tone: 'error', text: err instanceof Error ? err.message : 'No se pudo guardar.' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <section aria-labelledby="pins" className="rounded-2xl bg-card p-5 shadow-[var(--shadow-soft)] sm:p-6">
      <h2 id="pins" className="font-display text-2xl">
        PIN de cada área
      </h2>
      <p className="mt-1 max-w-[62ch] text-ink-2">
        El personal de puerta, cocina y taquilla entra con su PIN (de 4 a 8 números). Cámbialo si alguien que no debe lo
        conoce.
      </p>
      {!pins ? (
        <Spinner />
      ) : (
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          {(Object.keys(pins) as (keyof Pins)[]).map((role) => (
            <div key={role}>
              <Field
                label={role[0].toUpperCase() + role.slice(1)}
                htmlFor={`pin-${role}`}
                hint={pins[role] ? `Actual: ${pins[role]}` : 'Sin PIN: nadie puede entrar todavía'}
              >
                <TextInput
                  id={`pin-${role}`}
                  inputMode="numeric"
                  value={draft[role] || ''}
                  onChange={(e) => setDraft((d) => ({ ...d, [role]: e.target.value.replace(/\D/g, '').slice(0, 8) }))}
                  placeholder="Nuevo PIN"
                  className="tabular"
                />
              </Field>
              <Button size="sm" className="mt-2" onClick={() => save(role)} loading={busy === role} disabled={(draft[role] || '').length < 4}>
                Guardar PIN
              </Button>
            </div>
          ))}
        </div>
      )}
      {msg && <Notice tone={msg.tone} className="mt-4">{msg.text}</Notice>}
    </section>
  );
}

function EventoForm({ config, onSaved }: { config: EventConfig; onSaved: (c: EventConfig) => void }) {
  const [v, setV] = useState({
    eventName: config.eventName,
    date: config.date,
    eventDateIso: config.eventDateIso || '2026-12-12',
    time: config.time,
    venue: config.venue,
    ticketPriceUsd: String(config.ticketPriceUsd),
    pmBank: config.paymentDetails.pagoMovil.bank,
    pmPhone: config.paymentDetails.pagoMovil.phone,
    pmDoc: config.paymentDetails.pagoMovil.docId,
    pmHolder: config.paymentDetails.pagoMovil.holder,
    zEmail: config.paymentDetails.zelle.email,
    zHolder: config.paymentDetails.zelle.holder,
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value });

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const price = Number(v.ticketPriceUsd.replace(',', '.'));
      if (!(price > 0)) throw new Error('Revisa el precio de la entrada.');
      const { config: saved } = await api<{ config: EventConfig }>('/api/config', {
        method: 'POST',
        body: {
          eventName: v.eventName,
          date: v.date,
          eventDateIso: v.eventDateIso,
          time: v.time,
          venue: v.venue,
          ticketPriceUsd: price,
          paymentDetails: {
            pagoMovil: { bank: v.pmBank, phone: v.pmPhone, docId: v.pmDoc, holder: v.pmHolder },
            zelle: { email: v.zEmail, holder: v.zHolder },
          },
        },
      });
      onSaved(saved);
      setMsg({ tone: 'ok', text: 'Cambios guardados.' });
    } catch (err) {
      setMsg({ tone: 'error', text: err instanceof Error ? err.message : 'No se pudo guardar.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <section aria-labelledby="pago" className="space-y-5">
        <h2 id="pago" className="font-display text-2xl">
          Datos de pago
        </h2>
        <p className="-mt-3 text-ink-2">Es lo que ven los compradores al activar su entrada. Revísalo con cuidado.</p>
        <div className="grid gap-4 rounded-2xl bg-card p-5 shadow-[var(--shadow-soft)] sm:grid-cols-2 sm:p-6">
          <p className="font-bold sm:col-span-2">Pago Móvil</p>
          <Field label="Banco" htmlFor="pm-banco"><TextInput id="pm-banco" value={v.pmBank} onChange={set('pmBank')} /></Field>
          <Field label="Teléfono" htmlFor="pm-tel"><TextInput id="pm-tel" value={v.pmPhone} onChange={set('pmPhone')} /></Field>
          <Field label="RIF o cédula" htmlFor="pm-doc"><TextInput id="pm-doc" value={v.pmDoc} onChange={set('pmDoc')} /></Field>
          <Field label="Titular" htmlFor="pm-tit"><TextInput id="pm-tit" value={v.pmHolder} onChange={set('pmHolder')} /></Field>
          <p className="mt-2 font-bold sm:col-span-2">Zelle</p>
          <Field label="Correo" htmlFor="z-mail"><TextInput id="z-mail" value={v.zEmail} onChange={set('zEmail')} /></Field>
          <Field label="Titular" htmlFor="z-tit"><TextInput id="z-tit" value={v.zHolder} onChange={set('zHolder')} /></Field>
        </div>
      </section>

      <section aria-labelledby="evento" className="space-y-5">
        <h2 id="evento" className="font-display text-2xl">
          Evento
        </h2>
        <div className="grid gap-4 rounded-2xl bg-card p-5 shadow-[var(--shadow-soft)] sm:grid-cols-2 sm:p-6">
          <Field label="Nombre" htmlFor="ev-nombre"><TextInput id="ev-nombre" value={v.eventName} onChange={set('eventName')} /></Field>
          <Field label="Precio de la entrada ($)" htmlFor="ev-precio"><TextInput id="ev-precio" inputMode="decimal" value={v.ticketPriceUsd} onChange={set('ticketPriceUsd')} /></Field>
          <Field label="Fecha (como se muestra)" htmlFor="ev-fecha"><TextInput id="ev-fecha" value={v.date} onChange={set('date')} /></Field>
          <Field label="Día del evento" htmlFor="ev-iso" hint="Desde ese día ya no se puede cambiar de mesa desde el QR.">
            <TextInput id="ev-iso" type="date" value={v.eventDateIso} onChange={set('eventDateIso')} />
          </Field>
          <Field label="Hora" htmlFor="ev-hora"><TextInput id="ev-hora" value={v.time} onChange={set('time')} /></Field>
          <Field label="Lugar" htmlFor="ev-lugar"><TextInput id="ev-lugar" value={v.venue} onChange={set('venue')} /></Field>
        </div>
      </section>

      <div className="sticky bottom-4 flex items-center gap-3">
        <Button size="lg" onClick={save} loading={busy} className="shadow-[var(--shadow-ticket)]">
          Guardar cambios
        </Button>
        {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      </div>
    </>
  );
}
