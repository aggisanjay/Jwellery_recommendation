import { ColorCluster } from '@/types/jewelry';

/**
 * Computes Euclidean distance in CIE L*a*b* color space (Delta-E CIE76).
 * In LAB, Euclidean distance closely approximates perceptual difference (JND ~ 2.3).
 */
export function deltaELab(
  lab1: [number, number, number],
  lab2: [number, number, number]
): number {
  const dL = lab1[0] - lab2[0];
  const da = lab1[1] - lab2[1];
  const db = lab1[2] - lab2[2];
  return Math.sqrt(dL * dL + da * da + db * db);
}

/**
 * Computes jewelry-specific color similarity between two palettes.
 * Uses a symmetric Chamfer-style minimum Delta-E distance:
 * - Each dominant color cluster in the necklace seeks its closest match in the earring palette.
 * - Each dominant earring color cluster seeks its counterpart in the necklace.
 * - Prominence weights prioritize dominant gemstones and metals (gold, emeralds, rubies, pearls).
 * 
 * Returns a score normalized in [0.0, 1.0].
 */
export function computeColorSimilarity(
  palette1: ColorCluster[],
  palette2: ColorCluster[]
): number {
  if (!palette1?.length || !palette2?.length) {
    return 0.0;
  }

  // Normalize weights
  const totalWeight1 = palette1.reduce((sum, c) => sum + (c.weight || 1), 0) || 1;
  const totalWeight2 = palette2.reduce((sum, c) => sum + (c.weight || 1), 0) || 1;

  // 1. From palette 1 to palette 2
  let weightedDist1 = 0;
  for (const c1 of palette1) {
    let minDist = Infinity;
    for (const c2 of palette2) {
      const dist = deltaELab(c1.lab, c2.lab);
      if (dist < minDist) {
        minDist = dist;
      }
    }
    const w = (c1.weight || 1) / totalWeight1;
    weightedDist1 += w * minDist;
  }

  // 2. From palette 2 to palette 1
  let weightedDist2 = 0;
  for (const c2 of palette2) {
    let minDist = Infinity;
    for (const c1 of palette1) {
      const dist = deltaELab(c2.lab, c1.lab);
      if (dist < minDist) {
        minDist = dist;
      }
    }
    const w = (c2.weight || 1) / totalWeight2;
    weightedDist2 += w * minDist;
  }

  const symmetricDist = 0.5 * (weightedDist1 + weightedDist2);

  // Exponential decay with calibrated scale parameter (sigma = 28.0)
  // Distance 0 => 1.0; Distance 15 => ~0.58; Distance 35 => ~0.28
  const similarity = Math.exp(-symmetricDist / 28.0);
  return Number(Math.max(0.0, Math.min(1.0, similarity)).toFixed(4));
}

/**
 * Computes cosine similarity between two 512-dim vectors.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA?.length || !vecB?.length || vecA.length !== vecB.length) {
    return 0.0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0.0;

  const sim = dot / denom;
  return Number(Math.max(0.0, Math.min(1.0, sim)).toFixed(4));
}

/**
 * Combines CLIP style score and LAB color score:
 * final_score = (clipWeight * clipScore) + (colorWeight * colorScore)
 */
export function computeFinalScore(
  clipScore: number,
  colorScore: number,
  clipWeight = 0.6,
  colorWeight = 0.4
): number {
  const combined = clipWeight * clipScore + colorWeight * colorScore;
  return Number(Math.max(0.0, Math.min(1.0, combined)).toFixed(4));
}
