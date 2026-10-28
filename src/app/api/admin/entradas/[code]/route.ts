import { route, ok, fail, readJson } from '@/lib/api';
import { apartarMesa, aprobar, EntradaError, eventRules, rechazar, reiniciarEntrada } from '@/lib/entradas/service';
import { store, type Condicion } from '@/lib/entradas/store';
import type { Entrada, MetodoPago } from '@/lib/entradas/types';

type Ctx = { params: Promise<{ code: string }> };

export const GET = route<Ctx>(async (_req, { params }) => {
  const entrada = await store().getEntrada((await params).code);
  if (!entrada) return fail('Entrada no encontrada.', 404);
  return ok({ entrada });
}, ['admin']);

const text = (v: unknown, max = 200) => (v == null ? null : String(v).trim().slice(0, max) || null);

export const PATCH = route<Ctx>(async (req, { params }) => {
  const code = (await params).code;
  const body = await readJson(req);
  const entrada = await store().getEntrada(code);
  if (!entrada) return fail('Entrada no encontrada.', 404);
  const by = 'Administración';
  const now = new Date().toISOString();
  let patch: Partial<Entrada> | null = null;
  let onlyIf: Condicion | null = null;

  switch (body.action) {
    case 'aprobar':
      await aprobar(code, by);
      break;
    case 'rechazar':
      await rechazar(code, String(body.reason ?? ''), by);
      break;
    case 'anular':
      if (entrada.checkedInAt) throw new EntradaError('Esta entrada ya ingresó; no se puede anular.');
      patch = { status: 'anulada', tableId: null, notes: text(body.reason) ?? entrada.notes };
      break;
    case 'restaurar':
      if (entrada.status !== 'anulada') throw new EntradaError('Solo se restauran entradas anuladas.');
      patch = { status: 'sin_vender' };
      break;
    case 'marcar_pagada': {
      if (entrada.status !== 'sin_vender') throw new EntradaError('Esta entrada ya tiene un pago reportado.');
      const method = body.method as MetodoPago;
      if (!['zelle', 'pago_movil', 'efectivo_usd'].includes(method)) throw new EntradaError('Elige el método de pago.');
      const name = text(body.attendeeName, 120);
      if (!name) throw new EntradaError('Escribe el nombre de quien usará la entrada.');
      const { config } = await eventRules();
      const ves = method === 'pago_movil';
      patch = {
        status: 'activa',
        attendeeName: name,
        attendeePhone: text(body.attendeePhone, 30),
        paymentMethod: method,
        paymentReference: text(body.reference, 60),
        amount: ves ? Math.round(config.ticketPriceUsd * config.currentRateBs * 100) / 100 : config.ticketPriceUsd,
        currency: ves ? 'VES' : 'USD',
        rateApplied: ves ? config.currentRateBs : null,
        reportedBy: 'admin',
        reportedAt: now,
        verifiedAt: now,
        verifiedBy: by,
        rejectionReason: null,
      };
      onlyIf = { status: 'sin_vender' };
      break;
    }
    case 'editar':
      patch = {
        attendeeName: text(body.attendeeName, 120) ?? entrada.attendeeName,
        attendeePhone: text(body.attendeePhone, 30) ?? entrada.attendeePhone,
        paymentReference: text(body.paymentReference, 60) ?? entrada.paymentReference,
        notes: text(body.notes, 500),
      };
      break;
    case 'mesa':
      if (typeof body.tableId !== 'string') throw new EntradaError('Elige la mesa.');
      await apartarMesa(code, body.tableId, Boolean(body.force));
      break;
    case 'quitar_mesa':
      if (entrada.checkedInAt) throw new EntradaError('Ya ingresó; mejor muévela a otra mesa.');
      patch = { tableId: null };
      break;
    case 'deshacer_ingreso':
      patch = { checkedInAt: null, checkedInBy: null, mealServedAt: null };
      break;
    case 'revisada_puerta':
      patch = { doorActivated: false };
      break;
    case 'reiniciar':
      await reiniciarEntrada(code, by);
      break;
    default:
      return fail('Acción desconocida.');
  }

  if (patch && onlyIf) {
    if (!(await store().updateEntradaIf(code, onlyIf, patch))) {
      throw new EntradaError('Esta entrada cambió mientras tanto. Recarga y vuelve a intentar.', 409);
    }
  } else if (patch) {
    await store().updateEntrada(code, patch);
  }
  return ok({ entrada: await store().getEntrada(code) });
}, ['admin']);
