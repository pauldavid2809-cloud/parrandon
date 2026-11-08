import 'server-only';
import { randomBytes } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { PROOF_TYPES } from '@/lib/proof';
import { store } from '@/lib/entradas/store';

// Los capture que llegan como imagen embebida (la app de vendedores los guarda así para
// funcionar sin internet) pesan cientos de KB. Guardados dentro de las filas, cada lista de
// ventas o entradas los volvía a leer completos. Se suben al bucket de comprobantes y en la
// base queda solo el enlace.

const EMBEBIDA = /^data:(image\/[a-z]+);base64,([a-z0-9+/=]+)$/i;

// Devuelve el enlace público, o la misma imagen si no se pudo subir (el capture no se pierde).
export async function guardarCapture(url: string | null, nombre: string): Promise<string | null> {
  if (!url || !url.startsWith('data:') || !supabaseAdmin) return url;
  const m = url.match(EMBEBIDA);
  const tipo = m?.[1].toLowerCase() ?? '';
  const ext = PROOF_TYPES[tipo];
  if (!m || !ext) return url;
  const limpio = nombre.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 60) || 'capture';
  const ruta = `proofs/${limpio}_${randomBytes(4).toString('hex')}.${ext}`;
  const bucket = supabaseAdmin.storage.from('comprobantes');
  const { error } = await bucket.upload(ruta, Buffer.from(m[2], 'base64'), { contentType: tipo, upsert: false });
  if (error) {
    console.error('No se pudo subir el capture:', error.message);
    return url;
  }
  return bucket.getPublicUrl(ruta).data.publicUrl;
}

// Mueve al almacenamiento los capture que siguen embebidos (de antes de este cambio, o de
// cuando el bucket falló). Pocos por vez: corre cada día y no se come el ancho de banda.
export async function moverCapturas(max = 20) {
  const resultado = { ventas: 0, entradas: 0, fallidas: 0 };
  // Primero las ventas: al moverlas se actualizan también sus entradas, que tenían la misma foto.
  for (const v of await store().capturasEmbebidas('venta', max)) {
    const url = await guardarCapture(v.url, `venta-${v.clave}`);
    if (url && !url.startsWith('data:')) {
      await store().reemplazarCaptura('venta', v.clave, url);
      resultado.ventas++;
    } else resultado.fallidas++;
  }
  for (const e of await store().capturasEmbebidas('entrada', max)) {
    const url = await guardarCapture(e.url, `entrada-${e.clave}`);
    if (url && !url.startsWith('data:')) {
      await store().reemplazarCaptura('entrada', e.clave, url);
      resultado.entradas++;
    } else resultado.fallidas++;
  }
  return resultado;
}
