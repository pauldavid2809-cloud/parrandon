'use client';

import { useAutoLoad } from '@/lib/useAutoLoad';
import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Button, Notice, Spinner } from '@/components/ui';
import { api, PageTitle } from '@/components/admin/api';
import { formatBs } from '@/components/pago/PaymentDetails';
import { HOLDER_LABEL, type HolderType, type MesasResumen } from '@/lib/entradas/types';

interface Estado {
  storeReady: boolean;
  storeError: string | null;
  schemaAlDia: boolean;
  localStore: boolean;
  generadas: number;
  pins: { puerta: boolean; cocina: boolean; taquilla: boolean };
  defaultPassword: boolean;
  sessionSecret: boolean;
}
interface Resumen {
  generadas: number;
  sinVender: number;
  porVerificar: number;
  activas: number;
  anuladas: number;
  vendidas: number;
  sinMesa: number;
  activadasEnPuerta: number;
  ingresaron: number;
  platosServidos: number;
  mesas: MesasResumen;
  recaudado: { zelleUsd: number; pagoMovilVes: number; efectivoUsd: number };
  porResponsable: { type: HolderType; id: string | null; name: string; total: number; vendidas: number; activas: number }[];
}

export default function AdminResumen() {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    try {
      const e = await api<Estado>('/api/admin/estado');
      setEstado(e);
      if (e.storeReady && !e.storeError && e.generadas > 0) {
        const r = await api<{ resumen: Resumen }>('/api/admin/resumen');
        setResumen(r.resumen);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el resumen.');
    }
  }, []);

  useAutoLoad(load, 20000);

  const generar = async () => {
    if (!confirm('¿Generar las 500 entradas? Esto se hace una sola vez y reparte 6 a cada seminarista del directorio, en orden (#001–#006 al primero, #007–#012 al segundo…).')) return;
    setGenerating(true);
    try {
      await api('/api/admin/entradas/generar', { method: 'POST' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron generar.');
    } finally {
      setGenerating(false);
    }
  };

  if (!estado && !error) return <Spinner />;

  return (
    <div className="max-w-6xl">
      <PageTitle title="Resumen" />
      {error && <Notice tone="error" className="mb-6">{error}</Notice>}

      {estado && <Puesta estado={estado} onGenerar={generar} generating={generating} />}

      {resumen && (
        <div className="space-y-10">
          <section aria-labelledby="ventas">
            <h2 id="ventas" className="sr-only">
              Ventas
            </h2>
            <ul className="tabular grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-line shadow-[var(--shadow-soft)] sm:grid-cols-3 lg:grid-cols-6">
              <Stat label="Vendidas" value={`${resumen.vendidas}`} detail={`de ${resumen.generadas}`} />
              <Stat label="Por verificar" value={`${resumen.porVerificar}`} href="/admin/verificaciones" tone={resumen.porVerificar ? 'oro' : undefined} />
              <Stat label="Activas" value={`${resumen.activas}`} tone="verde" />
              <Stat label="Mesas llenas" value={`${resumen.mesas.mesasLlenas}`} detail={`${resumen.mesas.puestosLibres} puestos libres`} href="/admin/mesas" />
              <Stat label="Adentro" value={`${resumen.ingresaron}`} detail="escaneados en puerta" />
              <Stat label="Platos servidos" value={`${resumen.platosServidos}`} />
            </ul>
            {(resumen.sinMesa > 0 || resumen.activadasEnPuerta > 0) && (
              <div className="mt-4 flex flex-wrap gap-3">
                {resumen.sinMesa > 0 && (
                  <Notice tone="warn">
                    {resumen.sinMesa} {resumen.sinMesa === 1 ? 'entrada pagada no tiene' : 'entradas pagadas no tienen'} mesa todavía.
                  </Notice>
                )}
                {resumen.activadasEnPuerta > 0 && (
                  <Notice tone="warn">
                    <Link href="/admin/verificaciones?tab=puerta" className="underline underline-offset-4">
                      {resumen.activadasEnPuerta} activadas en la puerta por revisar
                    </Link>
                  </Notice>
                )}
              </div>
            )}
          </section>

          <section aria-labelledby="recaudado">
            <h2 id="recaudado" className="font-display text-2xl">
              Recaudado y verificado
            </h2>
            <dl className="tabular mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-card p-5 shadow-[var(--shadow-soft)]">
                <dt className="text-ink-3">Zelle</dt>
                <dd className="mt-1 font-display text-3xl">${resumen.recaudado.zelleUsd.toFixed(2)}</dd>
              </div>
              <div className="rounded-2xl bg-card p-5 shadow-[var(--shadow-soft)]">
                <dt className="text-ink-3">Pago Móvil</dt>
                <dd className="mt-1 font-display text-3xl">{formatBs(resumen.recaudado.pagoMovilVes)}</dd>
              </div>
              <div className="rounded-2xl bg-card p-5 shadow-[var(--shadow-soft)]">
                <dt className="text-ink-3">Efectivo (taquilla y puerta)</dt>
                <dd className="mt-1 font-display text-3xl">${resumen.recaudado.efectivoUsd.toFixed(2)}</dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="responsables">
            <h2 id="responsables" className="font-display text-2xl">
              Por responsable
            </h2>
            <div
              role="region"
              aria-label="Tabla por responsable"
              tabIndex={0}
              className="mt-4 overflow-x-auto rounded-2xl bg-card shadow-[var(--shadow-soft)]"
            >
              <table className="tabular w-full min-w-[34rem] text-left">
                <thead className="border-b border-line text-sm text-ink-3">
                  <tr>
                    <th className="px-4 py-3 font-bold">Responsable</th>
                    <th className="px-4 py-3 font-bold">Tipo</th>
                    <th className="px-4 py-3 text-right font-bold">Entradas</th>
                    <th className="px-4 py-3 text-right font-bold">Vendidas</th>
                    <th className="px-4 py-3 text-right font-bold">Activas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {resumen.porResponsable.map((h) => (
                    <tr key={`${h.type}-${h.id}`}>
                      <td className="px-4 py-2.5 font-bold">{h.name}</td>
                      <td className="px-4 py-2.5 text-ink-2">{HOLDER_LABEL[h.type]}</td>
                      <td className="px-4 py-2.5 text-right">{h.total}</td>
                      <td className="px-4 py-2.5 text-right">{h.vendidas}</td>
                      <td className="px-4 py-2.5 text-right">{h.activas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  detail,
  href,
  tone,
}: {
  label: string;
  value: string;
  detail?: string;
  href?: string;
  tone?: 'oro' | 'verde';
}) {
  const body = (
    <>
      <span className="block text-sm font-bold text-ink-3">{label}</span>
      <span
        className={
          tone === 'oro'
            ? 'block font-display text-4xl text-oro-ink'
            : tone === 'verde'
              ? 'block font-display text-4xl text-verde-2'
              : 'block font-display text-4xl'
        }
      >
        {value}
      </span>
      {detail && <span className="block text-sm text-ink-3">{detail}</span>}
    </>
  );
  return (
    <li className="bg-card">
      {href ? (
        <Link href={href} className="block h-full p-4 transition-colors hover:bg-paper-2">
          {body}
        </Link>
      ) : (
        <div className="p-4">{body}</div>
      )}
    </li>
  );
}

function Puesta({ estado, onGenerar, generating }: { estado: Estado; onGenerar: () => void; generating: boolean }) {
  const pinsFaltan = Object.entries(estado.pins).filter(([, v]) => !v).map(([k]) => k);
  if (!estado.storeReady) {
    return (
      <Notice tone="error" title="Falta conectar la base de datos de entradas" className="mb-8">
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>
            En Vercel → Settings → Environment Variables agrega <code>SUPABASE_SERVICE_ROLE_KEY</code> (Supabase →
            Project Settings → API → service_role) y vuelve a desplegar.
          </li>
          <li>En Supabase abre SQL Editor, pega el archivo <code>supabase/entradas.sql</code> y dale Run.</li>
        </ol>
      </Notice>
    );
  }
  return (
    <div className="mb-8 space-y-3">
      {estado.storeError && (
        <Notice tone="error" title="La base de datos respondió con un error">
          {estado.storeError} ¿Ya corriste <code>supabase/entradas.sql</code> en Supabase?
        </Notice>
      )}
      {!estado.storeError && !estado.schemaAlDia && (
        <Notice tone="error" title="Falta actualizar la base de datos">
          Esta versión guarda nombre, apellido y cédula por separado. En Supabase abre SQL Editor, pega otra vez el
          archivo <code>supabase/entradas.sql</code> y dale Run (no borra nada). Mientras tanto nadie puede registrar
          su pago.
        </Notice>
      )}
      {!estado.storeError && estado.generadas === 0 && (
        <div className="rounded-2xl bg-card p-6 shadow-[var(--shadow-soft)]">
          <p className="font-display text-2xl">Genera las 500 entradas</p>
          <p className="mt-1 max-w-[60ch] text-ink-2">
            Se crean los 500 códigos secretos (uno por entrada) y se asignan 6 a cada seminarista, en el orden del
            directorio (#001–#006 al primero, #007–#012 al segundo…). Después podrás descargar el PDF para la imprenta.
          </p>
          <Button className="mt-4" onClick={onGenerar} loading={generating}>
            Generar entradas
          </Button>
        </div>
      )}
      {estado.localStore && <Notice tone="warn">Modo de prueba: los datos se guardan en un archivo local, no en Supabase.</Notice>}
      {estado.defaultPassword && (
        <Notice tone="warn" title="La contraseña de administración es la de siempre">
          Cualquiera que vea el código del proyecto la conoce. Define <code>ADMIN_PASSWORD</code> en Vercel.
        </Notice>
      )}
      {pinsFaltan.length > 0 && (
        <Notice tone="warn">
          Falta definir el PIN de {pinsFaltan.join(', ')}.{' '}
          <Link href="/admin/configuracion" className="font-bold underline underline-offset-4">
            Definir PIN
          </Link>
        </Notice>
      )}
    </div>
  );
}
