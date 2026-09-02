'use client';

import React from 'react';
import { Product } from '@/types/jewelry';
import { Eye, Palette, CheckCircle2, ShieldAlert } from 'lucide-react';

interface SelectedNecklaceHeroProps {
  necklace: Product | null;
}

export const SelectedNecklaceHero: React.FC<SelectedNecklaceHeroProps> = ({ necklace }) => {
  if (!necklace) {
    return (
      <div className="w-full h-96 rounded-2xl border border-dashed border-atelier-800 bg-atelier-900/30 flex flex-col items-center justify-center p-8 text-center">
        <Eye className="w-10 h-10 text-atelier-600 mb-3" />
        <p className="text-atelier-400 text-sm font-medium">No necklace selected yet</p>
        <p className="text-atelier-500 text-xs mt-1">Select a necklace from the catalog above to view recommendations.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-atelier-900/70 border border-gold-400/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
          <span className="text-xs uppercase tracking-widest text-gold-400 font-medium">
            Active Query Piece
          </span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-gold-400/10 text-gold-300 text-xs font-mono border border-gold-400/30">
          ID: {necklace.id}
        </span>
      </div>

      {/* Large Featured Image */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-atelier-950 border border-gold-400/20 shadow-inner group">
        <img
          src={necklace.image_url}
          alt={`Selected Necklace ${necklace.id}`}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-atelier-950/80 via-transparent to-transparent opacity-60" />
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-atelier-200">
          <span className="font-serif text-gold-200 text-sm">Traditional Indian Choker / Set</span>
          <span className="text-atelier-400 font-mono text-[11px]">{necklace.image_file}</span>
        </div>
      </div>

      {/* Extracted Color Fingerprint */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs mb-2.5">
          <div className="flex items-center gap-1.5 text-atelier-200 font-medium">
            <Palette className="w-3.5 h-3.5 text-gold-400" />
            <span>Extracted Color Fingerprint (LAB Space)</span>
          </div>
          <span className="text-[11px] text-atelier-400 font-mono">De-weighted background</span>
        </div>

        {/* Color Clusters List */}
        <div className="grid grid-cols-5 gap-2">
          {necklace.color_palette?.map((c, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center p-2 rounded-lg bg-atelier-950/70 border border-atelier-800/80 hover:border-gold-400/30 transition-colors"
            >
              <span
                className="w-7 h-7 rounded-full border border-atelier-700 shadow-md mb-1.5"
                style={{ backgroundColor: c.hex }}
              />
              <span className="text-[10px] font-mono text-atelier-300 font-medium">{c.hex}</span>
              <span className="text-[9px] font-mono text-gold-400/80 mt-0.5">
                {(c.weight * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
