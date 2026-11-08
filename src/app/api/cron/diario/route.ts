import { route, ok, fail } from '@/lib/api';
import { store } from '@/lib/entradas/store';
import { moverCapturas } from '@/lib/capturas';

// Vercel la llama una vez al día (vercel.json). Con eso Supabase ve actividad y no pausa el
// proyecto en el plan gratis aunque nadie entre entre semana, y de paso se mueven al
// almacenamiento los capture que hayan quedado embebidos en la base.
// Si en Vercel está CRON_SECRET, solo responde a esa llamada.
export const GET = route(async (req) => {
  const secreto = process.env.CRON_SECRET;
  if (secreto && req.headers.get('authorization') !== `Bearer ${secreto}`) return fail('No autorizado.', 401);
  const entradas = await store().countEntradas();
  const movidas = await moverCapturas();
  return ok({ entradas, movidas });
});
