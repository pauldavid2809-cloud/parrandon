import 'server-only';
import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { serverSecretMaterial } from '@/lib/supabase-admin';
import type { SessionRole } from '@/lib/entradas/types';

// Sesión firmada en una cookie HttpOnly. Guarda qué áreas abrió este dispositivo.
const COOKIE = 'prn_session';
const MAX_AGE_SECONDS = 60 * 60 * 18; // una jornada larga de trabajo

interface SessionPayload {
  roles: SessionRole[];
  exp: number;
}

export const DEFAULT_ADMIN_PASSWORD = '#Seminario31';

export function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
}

export function usingDefaultAdminPassword(): boolean {
  return !process.env.ADMIN_PASSWORD;
}

function sign(value: string): string {
  return createHmac('sha256', `prn-session:${serverSecretMaterial()}`).update(value).digest('base64url');
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function encode(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${sign(body)}`;
}

function decode(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [body, mac] = token.split('.');
  if (!body || !mac || !safeEqual(sign(body), mac)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as SessionPayload;
    if (!Array.isArray(payload.roles) || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getRoles(): Promise<SessionRole[]> {
  const jar = await cookies();
  return decode(jar.get(COOKIE)?.value)?.roles || [];
}

// El administrador entra a todas las áreas.
export async function hasRole(...allowed: SessionRole[]): Promise<boolean> {
  const roles = await getRoles();
  return roles.includes('admin') || allowed.some((r) => roles.includes(r));
}

export async function grantRole(role: SessionRole): Promise<SessionRole[]> {
  const roles = Array.from(new Set([...(await getRoles()), role]));
  const jar = await cookies();
  jar.set(COOKIE, encode({ roles, exp: Date.now() + MAX_AGE_SECONDS * 1000 }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
  return roles;
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export function unauthorized(message = 'Necesitas iniciar sesión para esta área.') {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}

// Freno simple a intentos repetidos de PIN/contraseña desde una misma IP.
const attempts = new Map<string, { count: number; until: number }>();

export function tooManyAttempts(ip: string): boolean {
  const entry = attempts.get(ip);
  return Boolean(entry && entry.count >= 8 && entry.until > Date.now());
}

export function recordFailedAttempt(ip: string) {
  const entry = attempts.get(ip);
  const now = Date.now();
  if (!entry || entry.until < now) attempts.set(ip, { count: 1, until: now + 10 * 60 * 1000 });
  else entry.count++;
}

export function clearAttempts(ip: string) {
  attempts.delete(ip);
}
