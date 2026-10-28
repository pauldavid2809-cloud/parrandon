import 'server-only';

// Tipos de imagen aceptados para los capture de pago. La extensión y el tipo con que
// se guarda el archivo salen de esta lista, nunca del nombre que manda el navegador.
export const PROOF_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

const STORAGE_PREFIX = `${(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hasqpsmrctovkebwyxwk.supabase.co').replace(/\/$/, '')}/storage/v1/object/public/comprobantes/`;

// Un capture válido es una imagen subida por /api/upload-proof: o está en el bucket
// de comprobantes o es una imagen embebida (cuando el bucket no estaba disponible).
export function isSafeProofUrl(url: string): boolean {
  if (url.startsWith(STORAGE_PREFIX)) return true;
  return /^data:image\/(png|jpeg|webp|gif|heic|heif);base64,[a-z0-9+/=]+$/i.test(url);
}
