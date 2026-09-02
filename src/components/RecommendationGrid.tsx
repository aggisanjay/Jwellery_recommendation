'use client';

import React from 'react';
import { RecommendationCandidate } from '@/types/jewelry';
import { Sparkles, Award } from 'lucide-react';

interface RecommendationGridProps {
  recommendations: RecommendationCandidate[];
  isLoading: boolean;
  scoringWeights: { clip: number; color: number };
}

export const RecommendationGrid: React.FC<RecommendationGridProps> = ({
  recommendations,
  isLoading,
  scoringWeights,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-atelier-800">
          <div className="h-6 w-48 bg-atelier-800 rounded animate-pulse" />
          <div className="h-4 w-24 bg-atelier-800 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="h-80 rounded-xl bg-atelier-900/60 border border-atelier-800 p-4 animate-pulse flex flex-col justify-between"
            >
              <div className="aspect-square w-full bg-atelier-800/80 rounded-lg" />
              <div className="space-y-2 mt-3">
                <div className="h-4 w-3/4 bg-atelier-800 rounded" />
                <div className="h-3 w-1/2 bg-atelier-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="p-12 text-center border border-atelier-800 rounded-2xl bg-atelier-900/30">
        <p className="text-atelier-300">No earring recommendations computed yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gold-400/15">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gold-400" />
          <h3 className="font-serif text-lg font-semibold tracking-wide text-gold-100">
            Top Visually Matching Earrings
          </h3>
          <span className="text-xs px-2 py-0.5 rounded bg-gold-400/10 text-gold-300 font-mono">
            {recommendations.length} Ranked
          </span>
        </div>
        <div className="text-xs text-atelier-400 font-mono">
          Formula: ({scoringWeights.clip * 100}% Style + {scoringWeights.color * 100}% Color)
        </div>
      </div>

      {/* Grid of Recommended Earrings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {recommendations.map((item, idx) => {
          const finalPercent = Math.round(item.final_score * 100);
          const stylePercent = Math.round(item.clip_score * 100);
          const colorPercent = Math.round(item.color_score * 100);
          const isTopRank = idx === 0;

          return (
            <div
              key={item.id}
              className={`group relative rounded-2xl bg-atelier-900/80 border p-4 transition-all duration-300 hover:-translate-y-1 ${
                isTopRank
                  ? 'border-gold-400/60 shadow-xl shadow-gold-500/10 ring-1 ring-gold-400/30'
                  : 'border-atelier-800/80 hover:border-gold-400/40 hover:shadow-lg'
              }`}
            >
              {/* Rank & Match Score Badge */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-serif font-bold ${
                      isTopRank
                        ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-atelier-950 shadow-sm'
                        : 'bg-atelier-800 text-gold-300 border border-gold-400/20'
                    }`}
                  >
                    {isTopRank && <Award className="w-3 h-3 text-atelier-950" />}
                    #{item.rank || idx + 1} Match
                  </span>
                  <span className="text-[11px] font-mono text-atelier-400">ID: {item.id}</span>
                </div>

                {/* Overall Match Badge */}
                <div className="text-right">
                  <span className="font-mono text-sm font-bold text-gold-300">
                    {finalPercent}%
                  </span>
                  <span className="text-[10px] text-atelier-400 ml-1">Overall</span>
                </div>
              </div>

              {/* Product Image */}
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-atelier-950 border border-gold-400/10 mb-3.5 group-hover:border-gold-400/30 transition-colors">
                <img
                  src={item.image_url}
                  alt={`Earring ${item.id}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-atelier-950/70 via-transparent to-transparent opacity-40 group-hover:opacity-20 transition-opacity" />
              </div>

              {/* Sub-scores Progress Breakdown */}
              <div className="space-y-2 pt-1 border-t border-atelier-800/80">
                {/* CLIP Style Similarity */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-atelier-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                      Style match (CLIP)
                    </span>
                    <span className="font-mono text-atelier-200">{stylePercent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-atelier-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-indigo-400 rounded-full transition-all duration-700"
                      style={{ width: `${stylePercent}%` }}
                    />
                  </div>
                </div>

                {/* LAB Color Palette Similarity */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-atelier-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Color match (LAB)
                    </span>
                    <span className="font-mono text-atelier-200">{colorPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-atelier-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-gold-400 rounded-full transition-all duration-700"
                      style={{ width: `${colorPercent}%` }}
                    />
                  </div>
                </div>

                {/* Color Swatch Dots */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[10px] text-atelier-400 uppercase tracking-wider">Palette</span>
                  <div className="flex -space-x-1">
                    {item.color_palette?.slice(0, 4).map((swatch, sIdx) => (
                      <span
                        key={sIdx}
                        className="w-3.5 h-3.5 rounded-full border border-atelier-950 shadow-sm inline-block"
                        style={{ backgroundColor: swatch.hex }}
                        title={`${swatch.hex} (${(swatch.weight * 100).toFixed(0)}%)`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
