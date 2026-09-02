'use client';

import React from 'react';
import { Sparkles, Sliders, Database, Eye } from 'lucide-react';

interface HeaderProps {
  onToggleWeights: () => void;
  showWeights: boolean;
  dataSource?: 'supabase_pgvector' | 'local_cached_index';
}

export const Header: React.FC<HeaderProps> = ({
  onToggleWeights,
  showWeights,
  dataSource,
}) => {
  return (
    <header className="border-b border-gold-400/15 bg-atelier-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Atelier Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-gold-400/40 bg-gradient-to-br from-gold-500/20 to-atelier-900 flex items-center justify-center shadow-inner">
            <Sparkles className="w-5 h-5 text-gold-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-xl sm:text-2xl font-semibold tracking-wider gold-gradient-text">
                AURUM & ATELIER
              </h1>
              <span className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded-full bg-gold-400/10 text-gold-300 border border-gold-400/20">
                AI Matcher v1.0
              </span>
            </div>
            <p className="text-xs text-atelier-300/80 font-light hidden sm:block">
              Indian Ethnic Jewelry Visual Harmonizer • Necklace → Matching Earrings
            </p>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-3">
          {/* Data Source Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-atelier-900/90 border border-gold-400/20 text-xs text-atelier-200">
            <Database className="w-3.5 h-3.5 text-gold-400" />
            <span className="hidden md:inline text-atelier-400">Backend:</span>
            <span className="font-medium text-gold-200">
              {dataSource === 'supabase_pgvector' ? 'Supabase pgvector' : 'Offline Cache / pgvector Ready'}
            </span>
          </div>

          {/* Scoring Weights Toggle */}
          <button
            onClick={onToggleWeights}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
              showWeights
                ? 'bg-gold-500/20 text-gold-200 border-gold-400/50 shadow-sm'
                : 'bg-atelier-900/60 text-atelier-300 border-atelier-700 hover:border-gold-400/40 hover:text-gold-200'
            }`}
            title="Adjust CLIP vs Color Scoring Weights"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Scoring Weights</span>
          </button>
        </div>
      </div>
    </header>
  );
};
