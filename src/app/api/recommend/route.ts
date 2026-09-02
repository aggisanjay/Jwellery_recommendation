import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { getLocalCatalog } from '@/lib/catalog';
import { computeColorSimilarity, computeFinalScore, cosineSimilarity } from '@/lib/scoring';
import { RecommendationCandidate, RecommendationResponse } from '@/types/jewelry';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const necklaceId = searchParams.get('necklaceId');
    const topNParam = searchParams.get('topN');
    const clipWeightParam = searchParams.get('clipWeight');
    const colorWeightParam = searchParams.get('colorWeight');

    if (!necklaceId) {
      return NextResponse.json(
        { error: 'Missing required query parameter "necklaceId" (e.g. N01)' },
        { status: 400 }
      );
    }

    const clipWeight = clipWeightParam !== null ? parseFloat(clipWeightParam) : (parseFloat(process.env.WEIGHT_CLIP || '0.6'));
    const colorWeight = colorWeightParam !== null ? parseFloat(colorWeightParam) : (parseFloat(process.env.WEIGHT_COLOR || '0.4'));
    const topN = topNParam ? parseInt(topNParam, 10) : (parseInt(process.env.DEFAULT_TOP_N || '5', 10));

    // =========================================================================
    // PATH A: Supabase Postgres + pgvector RPC
    // =========================================================================
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        // 1. Fetch necklace embedding and palette
        const { data: necklaceData, error: necklaceErr } = await supabase
          .from('products')
          .select('id, product_type, image_file, image_url, color_palette, embedding')
          .eq('id', necklaceId)
          .single();

        if (!necklaceErr && necklaceData?.embedding) {
          // 2. Call match_earrings RPC for vector cosine distance filtering
          const { data: candidateEarrings, error: rpcErr } = await supabase.rpc('match_earrings', {
            query_embedding: necklaceData.embedding,
            match_threshold: 0.0,
            match_count: 15,
          });

          if (!rpcErr && candidateEarrings && candidateEarrings.length > 0) {
            // 3. Score color similarity & combine with CLIP similarity
            const ranked: RecommendationCandidate[] = candidateEarrings.map((item: any) => {
              const clip_score = Number(item.clip_score.toFixed(4));
              const color_score = computeColorSimilarity(necklaceData.color_palette, item.color_palette);
              const final_score = computeFinalScore(clip_score, color_score, clipWeight, colorWeight);

              return {
                id: item.id,
                product_type: item.product_type,
                image_file: item.image_file,
                image_url: item.image_url,
                color_palette: item.color_palette,
                clip_score,
                color_score,
                final_score,
              };
            });

            ranked.sort((a, b) => b.final_score - a.final_score);
            const topResults = ranked.slice(0, topN).map((item, idx) => ({
              ...item,
              rank: idx + 1,
            }));

            const response: RecommendationResponse = {
              necklace: {
                id: necklaceData.id,
                product_type: necklaceData.product_type,
                image_file: necklaceData.image_file,
                image_url: necklaceData.image_url,
                color_palette: necklaceData.color_palette,
              },
              recommendations: topResults,
              scoring_weights: { clip: clipWeight, color: colorWeight },
              total_candidates: candidateEarrings.length,
              source: 'supabase_pgvector',
            };

            return NextResponse.json(response);
          }
        }
      }
    }

    // =========================================================================
    // PATH B: Local Cached Index Fallback (Robust verification & local dev)
    // =========================================================================
    const catalog = getLocalCatalog();
    const necklace = catalog.find((p) => p.id.toLowerCase() === necklaceId.toLowerCase());

    if (!necklace) {
      return NextResponse.json(
        { error: `Necklace with ID "${necklaceId}" not found in catalog.` },
        { status: 404 }
      );
    }

    const earrings = catalog.filter((p) => p.product_type === 'Earrings');
    if (earrings.length === 0) {
      return NextResponse.json(
        { error: 'No earrings available in the catalog index.' },
        { status: 500 }
      );
    }

    const scored: RecommendationCandidate[] = earrings.map((earring) => {
      // 1. CLIP cosine similarity
      const clip_score = (necklace.embedding && earring.embedding)
        ? cosineSimilarity(necklace.embedding, earring.embedding)
        : 0.5;

      // 2. Jewelry-specific LAB color similarity
      const color_score = computeColorSimilarity(necklace.color_palette, earring.color_palette);

      // 3. Hybrid combined score
      const final_score = computeFinalScore(clip_score, color_score, clipWeight, colorWeight);

      return {
        id: earring.id,
        product_type: earring.product_type,
        image_file: earring.image_file,
        image_url: earring.image_url,
        color_palette: earring.color_palette,
        clip_score,
        color_score,
        final_score,
      };
    });

    scored.sort((a, b) => b.final_score - a.final_score);
    const topResults = scored.slice(0, topN).map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));

    const response: RecommendationResponse = {
      necklace: {
        id: necklace.id,
        product_type: necklace.product_type,
        image_file: necklace.image_file,
        image_url: necklace.image_url,
        color_palette: necklace.color_palette,
      },
      recommendations: topResults,
      scoring_weights: { clip: clipWeight, color: colorWeight },
      total_candidates: earrings.length,
      source: 'local_cached_index',
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error in /api/recommend:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error while computing recommendations' },
      { status: 500 }
    );
  }
}
