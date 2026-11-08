import 'server-only';
import { randomBytes } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { PROOF_TYPES } from '@/lib/proof';
import { store } from '@/lib/entradas/store';

// Los capture que llegan como imagen embebida (la app de vendedores los guarda así para
// funcionar sin internet) pesan cientos de KB. Guardados dentro de las filas, cada lista de
// ventas o entradas los volvía a leer completos. Se suben al bucket de comprobantes y en la
// base queda solo el enlace.

const BUCKET = 'comprobantes';
const EMBEBIDA = /^data:(image\/[a-z]+);base64,([a-z0-9+/=]+)$/i;

// Sube la imagen y dice el enlace, o por qué no se pudo (sin datos de la imagen).
async function subirCapture(url: string, nombre: string): Promise<{ url: string } | { error: string }> {
  if (!supabaseAdmin) return { error: 'Sin clave de servicio de Supabase.' };
  const m = url.match(EMBEBIDA);
  const tipo = m?.[1].toLowerCase() ?? '';
  const ext = PROOF_TYPES[tipo];
  if (!m || !ext) return { error: `Formato no reconocido: ${url.slice(0, 24)}` };
  const limpio = nombre.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 60) || 'capture';
  const ruta = `proofs/${limpio}_${randomBytes(4).toString('hex')}.${ext}`;
  const datos = Buffer.from(m[2], 'base64');
  const subir = () => supabaseAdmin!.storage.from(BUCKET).upload(ruta, datos, { contentType: tipo, upsert: false });
  let { error } = await subir();
  // El bucket se crea con supabase/schema.sql; si ese paso no se corrió, se crea aquí igual (público).
  if (error && /bucket not found/i.test(error.message)) {
    const creado = await supabaseAdmin.storage.createBucket(BUCKET, { public: true });
    if (creado.error && !/already exists/i.test(creado.error.message)) return { error: `Creando el bucket: ${creado.error.message}` };
    ({ error } = await subir());
  }
  if (error) return { error: error.message };
  return { url: supabaseAdmin.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl };
}

// Devuelve el enlace público, o la misma imagen si no se pudo subir (el capture no se pierde).
export async function guardarCapture(url: string | null, nombre: string): Promise<string | null> {
  if (!url || !url.startsWith('data:') || !supabaseAdmin) return url;
  const r = await subirCapture(url, nombre);
  if ('error' in r) {
    console.error('No se pudo subir el capture:', r.error);
    return url;
  }
  return r.url;
}

// Mueve al almacenamiento los capture que siguen embebidos (de antes de este cambio, o de
// cuando el bucket falló). Pocos por vez: corre cada día y no se come el ancho de banda.
export async function moverCapturas(max = 20) {
  const resultado = { ventas: 0, entradas: 0, fallidas: 0, errores: [] as string[] };
  const intentar = async (tipo: 'venta' | 'entrada', clave: string, url: string) => {
    const r = await subirCapture(url, `${tipo}-${clave}`);
    if ('error' in r) {
      resultado.fallidas++;
      if (!resultado.errores.includes(r.error) && resultado.errores.length < 3) resultado.errores.push(r.error);
      return;
    }
    await store().reemplazarCaptura(tipo, clave, r.url);
    if (tipo === 'venta') resultado.ventas++;
    else resultado.entradas++;
  };
  if (!supabaseAdmin) return resultado;
  // Primero las ventas: al moverlas se actualizan también sus entradas, que tenían la misma foto.
  for (const v of await store().capturasEmbebidas('venta', max)) await intentar('venta', v.clave, v.url);
  for (const e of await store().capturasEmbebidas('entrada', max)) await intentar('entrada', e.clave, e.url);
  return resultado;
}
