import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const orderId = formData.get('orderId') as string || 'ORD';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No se recibió ningún archivo.' }, { status: 400 });
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'El archivo no debe exceder 5MB.' }, { status: 400 });
    }

    const fileExt = file.name.split('.').pop() || 'jpg';
    const cleanOrderId = orderId.replace(/[^a-zA-Z0-9_-]/g, '');
    const fileName = `${cleanOrderId}_${Date.now()}.${fileExt}`;
    const filePath = `proofs/${fileName}`;

    if (isSupabaseConfigured && supabase) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const { data, error } = await supabase.storage
        .from('comprobantes')
        .upload(filePath, buffer, {
          contentType: file.type || 'image/jpeg',
          upsert: true
        });

      if (error) {
        console.error('Error subiendo a Supabase Storage:', error);
        // Fallback to base64 if storage bucket has issue
        const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;
        return NextResponse.json({ success: true, url: base64, source: 'base64_fallback' });
      }

      const { data: publicUrlData } = supabase.storage
        .from('comprobantes')
        .getPublicUrl(filePath);

      return NextResponse.json({
        success: true,
        url: publicUrlData.publicUrl,
        filePath,
        source: 'supabase_storage'
      });
    } else {
      // Supabase not configured in local environment -> convert to data URL
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;
      return NextResponse.json({
        success: true,
        url: base64,
        source: 'local_base64'
      });
    }
  } catch (error: any) {
    console.error('Error en /api/upload-proof:', error);
    return NextResponse.json({ success: false, error: error.message || 'Error al procesar el archivo.' }, { status: 500 });
  }
}
