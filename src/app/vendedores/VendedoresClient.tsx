'use client';

import { useAutoLoad } from '@/lib/useAutoLoad';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from 'react';
import { CheckCircle2, CloudOff, Download, ScanLine, Trash2 } from 'lucide-react';
import { Button, Choice, Field, Notice, Spinner, StatusPill, TextInput } from '@/components/ui';
import type { PagoInfo } from '@/components/pago/PaymentDetails';
import {
  borrarVenta,
  cargarVentas,
  guardarLocal,
  leerGuardado,
  prepararSinInternet,
  sincronizar,
  useEnLinea,
  useErrorDeSubida,
  useOfflineListo,
  useSubiendo,
  useVentasLocales,
  type VendedorLocal,
  type VentaLocal,
} from '@/lib/vender/cola';
import type { EventConfig } from '@/types';
import { formatNumber } from '@/lib/site';
import { cn } from '@/lib/utils';
import NuevaVenta, { type LoteItem } from './NuevaVenta';

type Seller = VendedorLocal;

const STORAGE_KEY = 'parrandon-vendedor';
const LISTA_KEY = 'parrandon-lista-vendedores';
const PAGO_KEY = 'parrandon-pago';
const loteKey = (s: Seller) => `parrandon-lote:${s.type}:${s.id}`;

// El vendedor elegido se recuerda en este teléfono.
const listeners = new Set<() => void>();
let memory: string | null = null;

function readSeller(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return memory;
  }
}

function writeSeller(s: Seller | null) {
  memory = s ? JSON.stringify(s) : null;
  try {
    if (memory) localStorage.setItem(STORAGE_KEY, memory);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // sin almacenamiento local: queda en memoria
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener('storage', cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', cb);
  };
}

export default function VendedoresClient() {
  // En el servidor no hay vendedor guardado: se muestra la carga hasta hidratar.
  const raw = useSyncExternalStore(subscribe, readSeller, () => undefined);

  // Ventas guardadas, subida automática y app lista para abrir sin internet.
  useEffect(() => {
    void cargarVentas().then(() => sincronizar());
    void prepararSinInternet();
    const subir = () => void sincronizar();
    const alVolver = () => document.visibilityState === 'visible' && subir();
    window.addEventListener('online', subir);
    document.addEventListener('visibilitychange', alVolver);
    const cada = setInterval(subir, 60_000);
    return () => {
      window.removeEventListener('online', subir);
      document.removeEventListener('visibilitychange', alVolver);
      clearInterval(cada);
    };
  }, []);

  if (raw === undefined) return <Spinner />;
  let seller: Seller | null = null;
  try {
    seller = raw ? (JSON.parse(raw) as Seller) : null;
  } catch {
    seller = null;
  }
  if (!seller) return <QuienEres onChoose={writeSeller} />;
  // Quien entró antes de que se pidiera el nombre (lote del Padre Jorge o de una parroquia).
  if (seller.type !== 'seminarista' && !seller.vendedor) return <TuNombre seller={seller} onExit={() => writeSeller(null)} />;
  return <Panel seller={seller} onExit={() => writeSeller(null)} />;
}

// ---------- identificación ----------

interface Lista {
  seminaristas: { id: string; name: string; stage: string }[];
  parroquias: { id: string; name: string }[];
}

// Seminaristas y parroquias: de internet, o lo último guardado en el teléfono.
function useLista() {
  const [lista, setLista] = useState<Lista | null>(() => leerGuardado<Lista>(LISTA_KEY));
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetch('/api/vendedores/lista', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) throw new Error(d.error);
        setLista(d);
        guardarLocal(LISTA_KEY, { seminaristas: d.seminaristas, parroquias: d.parroquias });
      })
      .catch(() => {
        if (!leerGuardado(LISTA_KEY)) setError('No se pudo cargar la lista. La primera vez hace falta internet.');
      });
  }, []);
  return { lista, error };
}

const SELECT = 'h-12 w-full rounded-xl border-2 border-line bg-card px-3 text-base focus:border-ink focus:outline-none';
const OTRA_PERSONA = '__otra';

function OpcionesSeminaristas({ lista }: { lista: Lista | null }) {
  const stages = lista ? Array.from(new Set(lista.seminaristas.map((s) => s.stage))) : [];
  return (
    <>
      {stages.map((stage) => (
        <optgroup key={stage} label={stage}>
          {lista!.seminaristas
            .filter((s) => s.stage === stage)
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
        </optgroup>
      ))}
    </>
  );
}

// Quién vende las entradas de una parroquia: un seminarista de la lista u otra persona.
interface QuienVendeValor {
  id: string; // id del seminarista, OTRA_PERSONA o ''
  nombre: string; // solo si es otra persona
}

function QuienVende({ lista, value, onChange }: { lista: Lista | null; value: QuienVendeValor; onChange: (v: QuienVendeValor) => void }) {
  return (
    <>
      <Field label="¿Qué seminarista vende?" htmlFor="vende-seminarista" hint="Quien vende y entrega el dinero a administración.">
        <select id="vende-seminarista" value={value.id} onChange={(e) => onChange({ ...value, id: e.target.value })} className={SELECT}>
          <option value="">Selecciona el seminarista</option>
          <OpcionesSeminaristas lista={lista} />
          <option value={OTRA_PERSONA}>Otra persona (no es seminarista)</option>
        </select>
      </Field>
      {value.id === OTRA_PERSONA && (
        <Field label="Nombre de quien vende" htmlFor="vendedor">
          <TextInput
            id="vendedor"
            value={value.nombre}
            onChange={(e) => onChange({ ...value, nombre: e.target.value })}
            autoComplete="name"
            autoCapitalize="words"
          />
        </Field>
      )}
    </>
  );
}

function vendedorDe(v: QuienVendeValor, lista: Lista | null): Pick<Seller, 'vendedor' | 'vendedorId'> | null {
  if (v.id === OTRA_PERSONA) return v.nombre.trim().length >= 3 ? { vendedor: v.nombre.trim() } : null;
  const sem = lista?.seminaristas.find((s) => s.id === v.id);
  return sem ? { vendedor: sem.name, vendedorId: sem.id } : null;
}

function QuienEres({ onChoose }: { onChoose: (s: Seller) => void }) {
  const { lista, error } = useLista();
  const [type, setType] = useState<Seller['type'] | null>(null);
  const [id, setId] = useState('');
  const [vendedor, setVendedor] = useState('');
  const [vende, setVende] = useState<QuienVendeValor>({ id: '', nombre: '' });

  const deParroquia = type === 'parroquia' ? vendedorDe(vende, lista) : null;
  const listo =
    type === 'seminarista'
      ? Boolean(id)
      : type === 'padre_jorge'
        ? vendedor.trim().length >= 3
        : type === 'parroquia'
          ? Boolean(id && deParroquia)
          : false;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!type || !listo) return;
    if (type === 'padre_jorge') return onChoose({ type, id: 'padre-jorge', name: 'Padre Jorge', vendedor: vendedor.trim() });
    const found =
      type === 'seminarista' ? lista?.seminaristas.find((s) => s.id === id) : lista?.parroquias.find((p) => p.id === id);
    if (found) onChoose({ type, id: found.id, name: found.name, ...(type === 'parroquia' ? deParroquia : {}) });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <h1 className="font-display text-4xl leading-tight sm:text-5xl">Vendedores</h1>
        <p className="mt-3 text-lg text-ink-2">
          Registra cada venta escaneando las entradas que entregas. Funciona sin internet: las ventas se guardan en el
          teléfono y se suben cuando hay señal.
        </p>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      <Field label="¿De quién son las entradas que vendes?">
        <Choice
          name="Tipo de vendedor"
          value={type}
          onChange={(v) => {
            setType(v);
            setId('');
          }}
          className="sm:grid-cols-3"
          options={[
            { value: 'seminarista', label: 'Mías (seminarista)' },
            { value: 'padre_jorge', label: 'Del Padre Jorge' },
            { value: 'parroquia', label: 'De una parroquia' },
          ]}
        />
      </Field>
      {type === 'seminarista' && (
        <Field label="Tu nombre" htmlFor="seminarista">
          <select id="seminarista" value={id} onChange={(e) => setId(e.target.value)} className={SELECT}>
            <option value="">Selecciona tu nombre</option>
            <OpcionesSeminaristas lista={lista} />
          </select>
        </Field>
      )}
      {type === 'parroquia' && (
        <>
          <Field label="Parroquia" htmlFor="parroquia">
            {lista && lista.parroquias.length === 0 ? (
              <Notice tone="warn">Todavía no hay parroquias con entradas asignadas. Pídele a administración que te registre.</Notice>
            ) : (
              <select id="parroquia" value={id} onChange={(e) => setId(e.target.value)} className={SELECT}>
                <option value="">Selecciona la parroquia</option>
                {lista?.parroquias.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <QuienVende lista={lista} value={vende} onChange={setVende} />
        </>
      )}
      {type === 'padre_jorge' && (
        <Field label="Tu nombre" htmlFor="vendedor" hint="Quien vende y entrega el dinero a administración.">
          <TextInput id="vendedor" value={vendedor} onChange={(e) => setVendedor(e.target.value)} autoComplete="name" autoCapitalize="words" />
        </Field>
      )}
      <Button type="submit" size="lg" disabled={!listo}>
        Entrar
      </Button>
    </form>
  );
}

// Para quien entró antes de que se pidiera quién vende.
function TuNombre({ seller, onExit }: { seller: Seller; onExit: () => void }) {
  const { lista } = useLista();
  const [vendedor, setVendedor] = useState('');
  const [vende, setVende] = useState<QuienVendeValor>({ id: '', nombre: '' });
  const elegido = seller.type === 'parroquia' ? vendedorDe(vende, lista) : vendedor.trim().length >= 3 ? { vendedor: vendedor.trim() } : null;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (elegido) writeSeller({ ...seller, ...elegido });
      }}
      className="space-y-6"
    >
      <h1 className="font-display text-3xl leading-tight sm:text-4xl">¿Quién vende las entradas de {seller.name}?</h1>
      <p className="text-lg text-ink-2">Así administración sabe a quién pedirle el efectivo de cada venta.</p>
      {seller.type === 'parroquia' ? (
        <QuienVende lista={lista} value={vende} onChange={setVende} />
      ) : (
        <Field label="Tu nombre" htmlFor="vendedor">
          <TextInput id="vendedor" value={vendedor} onChange={(e) => setVendedor(e.target.value)} autoComplete="name" autoCapitalize="words" />
        </Field>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" disabled={!elegido}>
          Seguir
        </Button>
        <button type="button" onClick={onExit} className="font-bold text-ink-2 underline underline-offset-4">
          No soy de este lote
        </button>
      </div>
    </form>
  );
}

// ---------- panel del vendedor ----------

function pagoDe(config: EventConfig): PagoInfo {
  return {
    priceUsd: config.ticketPriceUsd,
    rateBs: config.currentRateBs,
    pagoMovilActivo: config.paymentDetails.pagoMovil.activo === true,
    pagoMovil: config.paymentDetails.pagoMovil,
    zelle: config.paymentDetails.zelle,
  };
}

function Panel({ seller, onExit }: { seller: Seller; onExit: () => void }) {
  const [lote, setLote] = useState<LoteItem[] | null>(() => leerGuardado<LoteItem[]>(loteKey(seller)));
  const [pago, setPago] = useState<PagoInfo | null>(() => leerGuardado<PagoInfo>(PAGO_KEY));
  const [vista, setVista] = useState<'inicio' | 'vender' | VentaLocal>('inicio');
  const ventas = useVentasLocales().filter((v) => v.seller.type === seller.type && v.seller.id === seller.id);

  const load = useCallback(async () => {
    if (!navigator.onLine) return;
    try {
      const [l, c] = await Promise.all([
        fetch(`/api/vendedores/lote?type=${seller.type}&id=${encodeURIComponent(seller.id)}`, { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/config', { cache: 'no-store' }).then((r) => r.json()),
      ]);
      if (l.success) {
        setLote(l.lote);
        guardarLocal(loteKey(seller), l.lote);
      }
      if (c.success && c.config) {
        const p = pagoDe(c.config);
        setPago(p);
        guardarLocal(PAGO_KEY, p);
      }
    } catch {
      // sin señal: se usa lo guardado
    }
  }, [seller]);

  useAutoLoad(load, 60_000);

  // Al terminar de subir ventas, el lote se vuelve a pedir para que diga lo que ya sabe el servidor.
  const subiendo = useSubiendo();
  const subiendoAntes = useRef(subiendo);
  useEffect(() => {
    if (subiendoAntes.current && !subiendo) void load();
    subiendoAntes.current = subiendo;
  }, [subiendo, load]);

  if (vista === 'vender') {
    return (
      <NuevaVenta
        seller={seller}
        pago={pago}
        lote={lote}
        onCancel={() => setVista('inicio')}
        onSaved={(v) => {
          setVista(v);
          // Sin animación: la vista cambia de alto y el desplazamiento suave quedaría a medias.
          window.scrollTo({ top: 0, behavior: 'instant' });
        }}
      />
    );
  }
  if (typeof vista === 'object') {
    return (
      <VentaGuardada
        venta={ventas.find((v) => v.id === vista.id) ?? vista}
        onOtra={() => {
          setVista('vender');
          window.scrollTo({ top: 0, behavior: 'instant' });
        }}
        onListo={() => {
          setVista('inicio');
          void load();
        }}
      />
    );
  }

  // Lo vendido desde este teléfono se ve en el lote aunque el lote guardado sea de antes.
  const vendidasAqui = new Map<number, 'por_subir' | 'subida'>();
  for (const v of ventas) {
    if (v.estado === 'no_se_pudo' || v.servidor?.estado === 'rechazada') continue;
    const numeros = v.estado === 'por_subir' ? v.entradas.map((e) => e.number) : (v.servidor?.entradas ?? []);
    for (const n of numeros) vendidasAqui.set(n, v.estado === 'por_subir' ? 'por_subir' : 'subida');
  }
  const vendidas = lote?.filter((e) => e.status === 'activa' || e.status === 'por_verificar' || vendidasAqui.has(e.number)).length ?? 0;
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl leading-tight sm:text-4xl">{seller.vendedor || seller.name}</h1>
          <p className="mt-1 text-ink-2">
            {seller.type === 'seminarista' ? 'Seminarista' : seller.vendedor ? `Vende entradas de ${seller.name}` : seller.name}
          </p>
        </div>
        <button type="button" onClick={onExit} className="font-bold text-ink-2 underline underline-offset-4">
          No soy yo
        </button>
      </div>

      <EstadoConexion ventas={ventas} />

      <Button size="lg" onClick={() => setVista('vender')} className="w-full sm:w-auto">
        <ScanLine className="h-5 w-5" aria-hidden />
        Nueva venta
      </Button>

      <TusVentas ventas={ventas} />

      <section aria-labelledby="tus-entradas">
        <h2 id="tus-entradas" className="font-display text-2xl">
          Tus entradas
        </h2>
        {!lote ? (
          <p className="mt-2 text-ink-2">Se cargan cuando haya internet.</p>
        ) : lote.length === 0 ? (
          <Notice className="mt-3" tone="info">
            Todavía no tienes entradas asignadas. Administración te las asigna por número.
          </Notice>
        ) : (
          <>
            <p className="tabular mt-1 text-ink-2">
              {vendidas} de {lote.length} vendidas
            </p>
            <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-soft)]">
              {lote.map((e) => (
                <li key={e.number} className="flex items-center gap-4 px-4 py-3">
                  <span className="tabular w-14 font-display text-xl">{formatNumber(e.number)}</span>
                  <div className="min-w-0 flex-1">
                    {vendidasAqui.has(e.number) && e.status === 'sin_vender' ? (
                      <Chip tone="oro">{vendidasAqui.get(e.number) === 'por_subir' ? 'Vendida · por subir' : 'Vendida · por verificar'}</Chip>
                    ) : (
                      <StatusPill status={e.status} />
                    )}
                    {(e.buyer || e.tableId) && (
                      <p className="mt-0.5 truncate text-sm text-ink-2">
                        {e.buyer}
                        {e.buyer && e.tableId ? ' · ' : ''}
                        {e.tableId ? `Mesa ${e.tableId}` : ''}
                        {e.checkedIn ? ' · Ya entró' : ''}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

// ---------- conexión y subida ----------

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
}

function EstadoConexion({ ventas }: { ventas: VentaLocal[] }) {
  const enLinea = useEnLinea();
  const subiendo = useSubiendo();
  const error = useErrorDeSubida();
  const listo = useOfflineListo();
  const [instalar, setInstalar] = useState<InstallPrompt | null>(null);
  const pendientes = ventas.filter((v) => v.estado === 'por_subir').length;

  useEffect(() => {
    const guardar = (e: Event) => {
      e.preventDefault();
      setInstalar(e as InstallPrompt);
    };
    window.addEventListener('beforeinstallprompt', guardar);
    return () => window.removeEventListener('beforeinstallprompt', guardar);
  }, []);

  return (
    <div className="space-y-3">
      {!enLinea ? (
        <Notice tone="warn" title="Sin internet">
          Puedes seguir vendiendo. Las ventas se guardan en este teléfono y se suben solas cuando vuelva la señal.
          {pendientes > 0 && ` Por subir: ${pendientes}.`}
        </Notice>
      ) : pendientes > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-oro-soft px-4 py-3">
          <p className="font-bold">
            {pendientes === 1 ? '1 venta por subir' : `${pendientes} ventas por subir`}
            {error && <span className="block text-sm font-normal text-ink-2">{error}</span>}
          </p>
          <Button size="sm" variant="outline" loading={subiendo} onClick={() => void sincronizar()}>
            Subir ahora
          </Button>
        </div>
      ) : null}
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-2">
        {listo === 'listo' ? (
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-verde" aria-hidden /> Lista para vender sin internet en este teléfono
          </span>
        ) : listo === 'no_soportado' ? (
          <span className="inline-flex items-center gap-1.5">
            <CloudOff className="h-4 w-4" aria-hidden /> Este navegador no guarda la app: ábrela con señal
          </span>
        ) : (
          <span>Preparando la app para usarla sin internet…</span>
        )}
        {instalar && (
          <button
            type="button"
            onClick={() => {
              void instalar.prompt();
              setInstalar(null);
            }}
            className="inline-flex min-h-6 items-center gap-1.5 font-bold text-ink underline underline-offset-4"
          >
            <Download className="h-4 w-4" aria-hidden /> Instalar en el teléfono
          </button>
        )}
      </p>
    </div>
  );
}

function Chip({ tone, children }: { tone: 'oro' | 'verde' | 'rojo' | 'gris'; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-bold',
        tone === 'oro' && 'bg-oro-soft text-oro-ink',
        tone === 'verde' && 'bg-verde-soft text-verde-2',
        tone === 'rojo' && 'bg-rojo-soft text-rojo-2',
        tone === 'gris' && 'bg-paper-2 text-ink-2'
      )}
    >
      {children}
    </span>
  );
}

const METODO: Record<VentaLocal['method'], string> = { efectivo_usd: 'Efectivo', pago_movil: 'Pago Móvil', zelle: 'Zelle' };

function hora(iso: string) {
  const d = new Date(iso);
  const hoy = new Date().toDateString() === d.toDateString();
  return d.toLocaleString('es-VE', hoy ? { hour: 'numeric', minute: '2-digit' } : { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

function estadoDe(v: VentaLocal): { tone: 'oro' | 'verde' | 'rojo' | 'gris'; text: string } {
  if (v.estado === 'por_subir') return { tone: 'gris', text: 'Por subir' };
  if (v.estado === 'no_se_pudo') return { tone: 'rojo', text: 'No se pudo subir' };
  if (v.servidor?.estado === 'verificada') return { tone: 'verde', text: v.method === 'efectivo_usd' ? 'Efectivo entregado' : 'Pago verificado' };
  if (v.servidor?.estado === 'rechazada') return { tone: 'rojo', text: 'Rechazada' };
  return { tone: 'oro', text: v.method === 'efectivo_usd' ? 'Subida · efectivo por entregar' : 'Subida · pago por verificar' };
}

function TusVentas({ ventas }: { ventas: VentaLocal[] }) {
  if (ventas.length === 0) return null;
  const efectivo = ventas
    .filter((v) => v.method === 'efectivo_usd' && v.estado !== 'no_se_pudo' && v.servidor?.estado !== 'verificada' && v.servidor?.estado !== 'rechazada')
    .reduce((s, v) => s + (v.servidor ? v.servidor.entradas.length : v.entradas.length) * v.priceUsd, 0);
  return (
    <section aria-labelledby="tus-ventas">
      <h2 id="tus-ventas" className="font-display text-2xl">
        Tus ventas
      </h2>
      {efectivo > 0 && <p className="tabular mt-1 text-ink-2">Efectivo por entregar a administración: ${efectivo.toFixed(2)}</p>}
      <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-soft)]">
        {ventas.slice(0, 40).map((v) => {
          const st = estadoDe(v);
          const numeros = v.servidor?.estado === 'rechazada' ? v.entradas.map((e) => e.number) : v.servidor?.entradas ?? v.entradas.map((e) => e.number);
          return (
            <li key={v.id} className="space-y-1 px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="tabular font-display text-xl">{numeros.map((n) => formatNumber(n)).join(' · ') || '—'}</p>
                <Chip tone={st.tone}>{st.text}</Chip>
              </div>
              <p className="tabular text-sm text-ink-2">
                {METODO[v.method]} · ${(numeros.length * v.priceUsd).toFixed(2)}
                {v.reference ? ` · Ref. ${v.reference}` : ''} · {hora(v.soldAt)}
                {v.buyerName ? ` · ${v.buyerName}` : ''}
              </p>
              {v.servidor?.problemas.map((p, i) => (
                <p key={i} className="text-sm font-bold text-rojo-2">
                  {p.number ? `N.º ${formatNumber(p.number)}: ` : ''}
                  {p.motivo} Avísale a administración.
                </p>
              ))}
              {v.servidor?.estado === 'rechazada' && v.servidor.rejectionReason && (
                <p className="text-sm font-bold text-rojo-2">{v.servidor.rejectionReason}</p>
              )}
              {v.estado === 'no_se_pudo' && (
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm font-bold text-rojo-2">{v.error}</p>
                  <Button
                    size="sm"
                    variant="quiet"
                    onClick={() => {
                      if (confirm('¿Borrar esta venta del teléfono?')) void borrarVenta(v.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden /> Borrar
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function VentaGuardada({ venta, onOtra, onListo }: { venta: VentaLocal; onOtra: () => void; onListo: () => void }) {
  const enLinea = useEnLinea();
  const n = venta.entradas.length;
  const subida = venta.estado === 'subida';
  const problemas = venta.servidor?.problemas ?? [];
  return (
    <div className="space-y-6">
      <div className={cn('rounded-2xl p-6', problemas.length || venta.estado === 'no_se_pudo' ? 'bg-oro-soft' : 'bg-verde text-paper')}>
        <CheckCircle2 className={cn('h-9 w-9', problemas.length || venta.estado === 'no_se_pudo' ? 'text-oro-ink' : 'text-oro')} aria-hidden />
        <p className="mt-2 font-display text-3xl">Venta guardada</p>
        <p className={cn('tabular mt-1', problemas.length || venta.estado === 'no_se_pudo' ? 'text-ink-2' : 'text-paper/85')}>
          {venta.entradas.map((e) => formatNumber(e.number)).join(' · ')} · {METODO[venta.method]} · ${(n * venta.priceUsd).toFixed(2)}
        </p>
        <p className={cn('mt-3 font-bold', problemas.length || venta.estado === 'no_se_pudo' ? 'text-ink' : 'text-paper')} aria-live="polite">
          {venta.estado === 'no_se_pudo'
            ? `No se pudo subir: ${venta.error}`
            : subida
              ? problemas.length
                ? 'Subida, pero con problemas:'
                : 'Ya está subida.'
              : enLinea
                ? 'Subiendo…'
                : 'Guardada en el teléfono. Se sube sola cuando haya señal.'}
        </p>
        {problemas.map((p, i) => (
          <p key={i} className="font-bold text-rojo-2">
            {p.number ? `N.º ${formatNumber(p.number)}: ` : ''}
            {p.motivo}
          </p>
        ))}
      </div>
      <p className="text-lg text-ink-2">
        Dile a cada persona que escanee el QR de su entrada para poner su nombre y su cédula y escoger su mesa.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={onOtra}>
          <ScanLine className="h-5 w-5" aria-hidden /> Nueva venta
        </Button>
        <Button size="lg" variant="outline" onClick={onListo}>
          Listo
        </Button>
      </div>
    </div>
  );
}
