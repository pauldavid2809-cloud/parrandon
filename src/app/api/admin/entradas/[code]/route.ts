import { route, ok, fail, readJson } from '@/lib/api';
import {
  apartarMesa,
  aprobar,
  datosPersona,
  EntradaError,
  eventRules,
  rechazar,
  reiniciarEntrada,
  SIN_PERSONA,
} from '@/lib/entradas/service';
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
      // Administración puede activar sin cédula (pagos recibidos en persona); si la escribe, se valida.
      const persona = datosPersona(body, { cedula: false, phone: false });
      const { config } = await eventRules();
      const ves = method === 'pago_movil';
      patch = {
        status: 'activa',
        ...persona,
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
    case 'editar': {
      // Solo se tocan los campos que llegan; vaciar la persona solo se permite si la entrada no se ha vendido.
      const campos = ['firstName', 'lastName', 'cedula', 'phone'] as const;
      const vacia = campos.every((k) => !text(body[k])?.replace(/^[VEP]-?$/i, ''));
      patch = {};
      if (campos.some((k) => body[k] !== undefined)) {
        Object.assign(patch, vacia && entrada.status === 'sin_vender' ? SIN_PERSONA : datosPersona(body, { cedula: false, phone: false }));
      }
      if (body.paymentReference !== undefined) patch.paymentReference = text(body.paymentReference, 60);
      if (body.notes !== undefined) patch.notes = text(body.notes, 500);
      break;
    }
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
