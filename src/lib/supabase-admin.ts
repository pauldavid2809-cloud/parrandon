import 'server-only';
import { randomBytes } from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Cliente con la clave de servicio. Solo existe en el servidor: las tablas de
// entradas no tienen acceso público, así que sin esta clave no se pueden leer.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hasqpsmrctovkebwyxwk.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const useLocalStore = process.env.PARRANDON_LOCAL_DB === '1';

export const supabaseAdmin: SupabaseClient | null =
  !useLocalStore && serviceKey
    ? createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;

export class StoreNotConfiguredError extends Error {
  constructor() {
    super(
      'Falta configurar SUPABASE_SERVICE_ROLE_KEY en Vercel y correr supabase/entradas.sql. Sin eso no se pueden leer las entradas.'
    );
    this.name = 'StoreNotConfiguredError';
  }
}

// Sin SESSION_SECRET ni clave de servicio, las sesiones usan un secreto aleatorio
// del proceso: nadie puede falsificarlas, aunque se cierran al reiniciar el servidor.
const processSecret = randomBytes(32).toString('hex');

export function serverSecretMaterial(): string {
  return process.env.SESSION_SECRET || serviceKey || processSecret;
}
