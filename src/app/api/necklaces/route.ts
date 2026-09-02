import { NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { getLocalCatalog } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Try fetching from Supabase if configured
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase
          .from('products')
          .select('id, product_type, image_file, image_url, color_palette')
          .eq('product_type', 'Necklace')
          .order('id', { ascending: true });

        if (!error && data && data.length > 0) {
          return NextResponse.json({
            necklaces: data,
            source: 'supabase',
          });
        }
        console.warn('Supabase query returned empty or error, falling back to local:', error?.message);
      }
    }

    // 2. Local catalog fallback
    const allProducts = getLocalCatalog();
    const necklaces = allProducts
      .filter((p) => p.product_type === 'Necklace')
      .map((p) => ({
        id: p.id,
        product_type: p.product_type,
        image_file: p.image_file,
        image_url: p.image_url,
        color_palette: p.color_palette,
      }));

    return NextResponse.json({
      necklaces,
      source: 'local_cached_index',
    });
  } catch (error: any) {
    console.error('Error in /api/necklaces:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch necklaces' },
      { status: 500 }
    );
  }
}
