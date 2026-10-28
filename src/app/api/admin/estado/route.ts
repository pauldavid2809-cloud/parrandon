import { route, ok } from '@/lib/api';
import { usingDefaultAdminPassword } from '@/lib/auth';
import { supabaseAdmin, useLocalStore } from '@/lib/supabase-admin';
import { store } from '@/lib/entradas/store';

// Lista de verificación de la puesta en marcha.
export const GET = route(async () => {
  const storeReady = useLocalStore || Boolean(supabaseAdmin);
  let generadas = 0;
  let storeError: string | null = null;
  let schemaAlDia = true;
  const pins = { puerta: false, cocina: false, taquilla: false };
  if (storeReady) {
    try {
      generadas = await store().countEntradas();
      schemaAlDia = await store().schemaAlDia();
      for (const role of ['puerta', 'cocina', 'taquilla'] as const) pins[role] = Boolean(await store().getPin(role));
    } catch (err) {
      storeError = err instanceof Error ? err.message : 'No se pudo leer la base de datos.';
    }
  }
  return ok({
    storeReady,
    storeError,
    schemaAlDia,
    localStore: useLocalStore,
    generadas,
    pins,
    defaultPassword: usingDefaultAdminPassword(),
    sessionSecret: Boolean(process.env.SESSION_SECRET),
  });
}, ['admin']);
