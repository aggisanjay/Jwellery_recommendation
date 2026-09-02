export type ProductType = 'Necklace' | 'Earrings';

export interface ColorCluster {
  lab: [number, number, number];
  rgb: [number, number, number];
  hex: string;
  weight: number;
}

export interface Product {
  id: string;
  product_type: ProductType;
  image_file: string;
  image_url: string;
  color_palette: ColorCluster[];
  embedding?: number[];
}

export interface RecommendationCandidate extends Product {
  clip_score: number;
  color_score: number;
  final_score: number;
  rank?: number;
}

export interface RecommendationResponse {
  necklace: Product;
  recommendations: RecommendationCandidate[];
  scoring_weights: {
    clip: number;
    color: number;
  };
  total_candidates: number;
  source: 'supabase_pgvector' | 'local_cached_index';
}
