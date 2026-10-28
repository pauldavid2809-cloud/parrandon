import { route, ok, fail, readJson, clientIp } from '@/lib/api';
import {
  adminPassword,
  clearAttempts,
  grantRole,
  recordFailedAttempt,
  safeEqual,
  tooManyAttempts,
} from '@/lib/auth';
import { store } from '@/lib/entradas/store';
import type { SessionRole, StaffRole } from '@/lib/entradas/types';

const STAFF: StaffRole[] = ['puerta', 'cocina', 'taquilla'];

export const POST = route(async (req) => {
  const { role, secret } = await readJson(req);
  // El freno cuenta por IP y por área: en el evento todos comparten el mismo WiFi,
  // y un PIN mal escrito en la puerta no debe bloquear a administración.
  const ip = `${clientIp(req)}:${String(role)}`;
  if (tooManyAttempts(ip)) return fail('Demasiados intentos. Espera unos minutos.', 429);

  const value = String(secret ?? '').trim();
  let valid = false;

  if (role === 'admin') {
    valid = value.length > 0 && safeEqual(value, adminPassword());
  } else if (STAFF.includes(role as StaffRole)) {
    const pin = await store().getPin(role as StaffRole);
    if (!pin) return fail('Este PIN todavía no está configurado. Pídelo a administración.', 409, { reason: 'pin_no_configurado' });
    valid = safeEqual(value, pin);
  } else {
    return fail('Área desconocida.');
  }

  if (!valid) {
    recordFailedAttempt(ip);
    await new Promise((r) => setTimeout(r, 400));
    return fail(role === 'admin' ? 'Contraseña incorrecta.' : 'PIN incorrecto.', 401);
  }
  clearAttempts(ip);
  const roles = await grantRole(role as SessionRole);
  return ok({ roles });
});
