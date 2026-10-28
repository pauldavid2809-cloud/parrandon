import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { PROOF_TYPES } from '@/lib/proof';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const orderId = (formData.get('orderId') as string) || 'ORD';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No se recibió ningún archivo.' }, { status: 400 });
    }

    // Solo imágenes: el bucket es público y no debe servir otro tipo de archivo.
    const ext = PROOF_TYPES[file.type];
    if (!ext) {
      return NextResponse.json({ success: false, error: 'Sube una imagen (foto o captura de pantalla).' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'La imagen no debe pasar de 5 MB.' }, { status: 400 });
    }

    const cleanOrderId = orderId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || 'ORD';
    const filePath = `proofs/${cleanOrderId}_${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const embedded = `data:${file.type};base64,${buffer.toString('base64')}`;

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.storage.from('comprobantes').upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

      if (error) {
        console.error('Error subiendo a Supabase Storage:', error);
        // Si el bucket falla, la imagen viaja embebida para no perder el capture.
        return NextResponse.json({ success: true, url: embedded, source: 'base64_fallback' });
      }

      const { data: publicUrlData } = supabase.storage.from('comprobantes').getPublicUrl(filePath);
      return NextResponse.json({ success: true, url: publicUrlData.publicUrl, filePath, source: 'supabase_storage' });
    }

    return NextResponse.json({ success: true, url: embedded, source: 'local_base64' });
  } catch (error) {
    console.error('Error en /api/upload-proof:', error);
    return NextResponse.json({ success: false, error: 'No se pudo procesar la imagen.' }, { status: 500 });
  }
}
