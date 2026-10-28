import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { hasRole, unauthorized } from '@/lib/auth';
import { StoreNotConfiguredError } from '@/lib/supabase-admin';
import { EntradaError } from '@/lib/entradas/service';
import type { SessionRole } from '@/lib/entradas/types';

const NO_STORE = { 'Cache-Control': 'no-store' };

export function ok(data: Record<string, unknown> = {}) {
  return NextResponse.json({ success: true, ...data }, { headers: NO_STORE });
}

export function fail(message: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ success: false, error: message, ...extra }, { status, headers: NO_STORE });
}

// Envuelve un handler: traduce errores de negocio a respuestas claras y exige rol si se pide.
export function route<C = unknown>(
  handler: (req: NextRequest, ctx: C) => Promise<NextResponse>,
  roles: SessionRole[] = []
) {
  return async (req: NextRequest, ctx: C) => {
    try {
      if (roles.length && !(await hasRole(...roles))) return unauthorized();
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof EntradaError) return fail(err.message, err.status, err.reason ? { reason: err.reason } : {});
      if (err instanceof StoreNotConfiguredError) return fail(err.message, 503, { reason: 'store_not_configured' });
      console.error(err);
      return fail('Algo falló en el servidor. Intenta de nuevo en unos segundos.', 500);
    }
  };
}

export async function readJson(req: NextRequest): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
}
