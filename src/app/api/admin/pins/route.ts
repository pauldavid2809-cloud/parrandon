import { route, ok, fail, readJson } from '@/lib/api';
import { store } from '@/lib/entradas/store';
import type { StaffRole } from '@/lib/entradas/types';

const ROLES: StaffRole[] = ['puerta', 'cocina', 'taquilla'];

export const GET = route(async () => {
  const pins: Record<string, string | null> = {};
  for (const role of ROLES) pins[role] = await store().getPin(role);
  return ok({ pins });
}, ['admin']);

export const POST = route(async (req) => {
  const { role, pin } = await readJson(req);
  if (!ROLES.includes(role as StaffRole)) return fail('Área desconocida.');
  const value = String(pin ?? '').trim();
  if (!/^\d{4,8}$/.test(value)) return fail('El PIN debe tener entre 4 y 8 números.');
  await store().setPin(role as StaffRole, value);
  return ok();
}, ['admin']);
