'use client';

import { useSyncExternalStore } from 'react';
import type { MetodoPago } from '@/lib/entradas/types';

// Ventas guardadas en el teléfono del vendedor. Se hacen aunque no haya internet y se suben
// solas cuando vuelve la señal (al abrir la app, al volver la conexión y cada minuto).

export interface VendedorLocal {
  type: 'seminarista' | 'padre_jorge' | 'parroquia';
  id: string;
  name: string; // dueño del lote
  vendedor?: string; // quien vende, si no es el dueño del lote
  vendedorId?: string; // si quien vende es un seminarista del directorio
}

export interface RespuestaVenta {
  id: string;
  estado: 'por_verificar' | 'verificada' | 'rechazada';
  entradas: number[];
  problemas: { number: number | null; motivo: string }[];
  rejectionReason: string | null;
}

export interface VentaLocal {
  id: string;
  seller: VendedorLocal;
  entradas: { code: string; number: number }[];
  method: MetodoPago;
  reference: string;
  proofUrl: string | null; // imagen embebida; se borra del teléfono al subir
  // Hecha con la app que ya pide el capture en Zelle y Pago Móvil. Las guardadas antes no lo
  // traen y se suben igual, para no perder ventas que ya se entregaron.
  capturaObligatoria?: boolean;
  buyerName: string;
  soldAt: string;
  priceUsd: number;
  rateBs: number | null;
  // por_subir: espera señal · subida: llegó · no_se_pudo: el servidor la rechazó (hay que revisarla)
  estado: 'por_subir' | 'subida' | 'no_se_pudo';
  servidor?: RespuestaVenta;
  error?: string;
}

// ---------- IndexedDB (las fotos del capture no caben en localStorage) ----------

const DB = 'parrandon-vendedores';
const STORE = 'ventas';
let dbPromise: Promise<IDBDatabase> | null = null;

function abrir(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function tx<T>(modo: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await abrir();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, modo);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(req.result);
    t.onerror = () => reject(t.error);
  });
}

// ---------- estado compartido con React ----------

const VACIO: VentaLocal[] = [];
let ventas: VentaLocal[] = VACIO;
let cargada = false;
let sinAlmacen = false;
const oyentes = new Set<() => void>();

function avisar() {
  oyentes.forEach((o) => o());
}

function suscribir(cb: () => void) {
  oyentes.add(cb);
  return () => oyentes.delete(cb);
}

function ordenar(lista: VentaLocal[]) {
  return [...lista].sort((a, b) => b.soldAt.localeCompare(a.soldAt));
}

export async function cargarVentas() {
  if (cargada) return;
  cargada = true;
  try {
    ventas = ordenar(await tx<VentaLocal[]>('readonly', (s) => s.getAll() as IDBRequest<VentaLocal[]>));
  } catch {
    // Navegador sin IndexedDB (muy raro): las ventas viven mientras la app esté abierta.
    sinAlmacen = true;
  }
  avisar();
}

async function escribir(v: VentaLocal) {
  ventas = ordenar([...ventas.filter((x) => x.id !== v.id), v]);
  avisar();
  if (!sinAlmacen) await tx('readwrite', (s) => s.put(v));
}

export async function guardarVenta(v: VentaLocal) {
  await escribir(v);
  void sincronizar();
}

export async function borrarVenta(id: string) {
  ventas = ventas.filter((x) => x.id !== id);
  avisar();
  if (!sinAlmacen) await tx('readwrite', (s) => s.delete(id));
}

export function useVentasLocales() {
  return useSyncExternalStore(suscribir, () => ventas, () => VACIO);
}

export function almacenDisponible() {
  return !sinAlmacen;
}

// ---------- subir ----------

let subiendo: Promise<void> | null = null;
let ultimoError: string | null = null;

export function useSubiendo() {
  return useSyncExternalStore(suscribir, () => subiendo !== null, () => false);
}

export function useErrorDeSubida() {
  return useSyncExternalStore(suscribir, () => ultimoError, () => null);
}

export function sincronizar(): Promise<void> {
  if (subiendo) return subiendo;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return Promise.resolve();
  subiendo = (async () => {
    ultimoError = null;
    for (const v of ventas.filter((x) => x.estado === 'por_subir')) {
      let res: Response;
      try {
        res = await fetch('/api/vendedores/ordenes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: v.id,
            seller: { type: v.seller.type, id: v.seller.id, vendedor: v.seller.vendedor, vendedorId: v.seller.vendedorId },
            codes: v.entradas.map((e) => e.code),
            method: v.method,
            reference: v.reference,
            proofUrl: v.proofUrl,
            capturaObligatoria: v.capturaObligatoria === true,
            buyerName: v.buyerName,
            soldAt: v.soldAt,
            rateBs: v.rateBs,
          }),
        });
      } catch {
        ultimoError = 'Sin conexión. Las ventas siguen guardadas en el teléfono.';
        break; // sin red: se reintenta después
      }
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        await escribir({ ...v, estado: 'subida', servidor: json.venta, proofUrl: null, error: undefined });
      } else if (res.status >= 400 && res.status < 500) {
        await escribir({ ...v, estado: 'no_se_pudo', error: json?.error || 'El servidor no aceptó esta venta.' });
      } else {
        ultimoError = 'El servidor no respondió. Se intenta de nuevo en un minuto.';
        break;
      }
    }
    await refrescarEstados();
  })().finally(() => {
    subiendo = null;
    avisar();
  });
  avisar();
  return subiendo;
}

// Cómo van las ventas ya subidas (verificadas o rechazadas por administración).
async function refrescarEstados() {
  // Las rechazadas también: administración puede deshacer un rechazo hecho por error.
  const pendientes = ventas.filter((v) => v.estado === 'subida' && v.servidor?.estado !== 'verificada');
  if (pendientes.length === 0) return;
  try {
    const res = await fetch(`/api/vendedores/ordenes?ids=${pendientes.map((v) => v.id).join(',')}`, { cache: 'no-store' });
    const json = await res.json();
    if (!json?.success) return;
    for (const r of json.ventas as RespuestaVenta[]) {
      const v = ventas.find((x) => x.id === r.id);
      if (v) await escribir({ ...v, servidor: r });
    }
  } catch {
    // sin red: se ve el último estado conocido
  }
}

// ---------- conexión ----------

function suscribirRed(cb: () => void) {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
}

export function useEnLinea() {
  return useSyncExternalStore(suscribirRed, () => navigator.onLine, () => true);
}

// ---------- datos guardados para usar sin señal ----------

export function leerGuardado<T>(clave: string): T | null {
  try {
    const raw = localStorage.getItem(clave);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function guardarLocal(clave: string, valor: unknown) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // sin espacio: se usa lo que había
  }
}

export function nuevoId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

// ---------- la app abre sin internet ----------

type EstadoOffline = 'no_soportado' | 'preparando' | 'listo';
let offline: EstadoOffline = 'preparando';

export function useOfflineListo() {
  return useSyncExternalStore(suscribir, () => offline, () => 'preparando' as EstadoOffline);
}

// Registra el service worker y le pasa los archivos que la página ya cargó, incluido el lector
// de QR (se carga aparte y sin él no se podría escanear sin señal).
export async function prepararSinInternet() {
  if (!('serviceWorker' in navigator)) {
    offline = 'no_soportado';
    avisar();
    return;
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw-vendedores.js', { scope: '/vendedores' });
    if (navigator.onLine) await import('html5-qrcode').catch(() => null);
    const sw = reg.active || (await navigator.serviceWorker.ready).active;
    if (!sw) return;
    const urls = [
      location.pathname,
      ...performance.getEntriesByType('resource').map((r) => r.name),
      ...Array.from(document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>('script[src], link[rel="stylesheet"], link[rel="preload"]')).map(
        (el) => ('src' in el && el.src) || ('href' in el && el.href) || ''
      ),
    ].filter(Boolean);
    const guardado = new Promise<void>((resolve) => {
      const listo = (e: MessageEvent) => {
        if (e.data?.tipo !== 'guardado') return;
        navigator.serviceWorker.removeEventListener('message', listo);
        resolve();
      };
      navigator.serviceWorker.addEventListener('message', listo);
      setTimeout(resolve, 15000);
    });
    sw.postMessage({ tipo: 'guardar', urls: [...new Set(urls)] });
    await guardado;
    offline = 'listo';
  } catch {
    // Sin señal el registro puede fallar aunque la app ya esté guardada de una visita anterior.
    offline = navigator.serviceWorker.controller ? 'listo' : 'no_soportado';
  }
  avisar();
}
