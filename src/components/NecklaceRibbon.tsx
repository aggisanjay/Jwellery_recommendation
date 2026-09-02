'use client';

import React from 'react';
import { Product } from '@/types/jewelry';

interface NecklaceRibbonProps {
  necklaces: Product[];
  selectedId: string | null;
  onSelect: (necklace: Product) => void;
  isLoading: boolean;
}

export const NecklaceRibbon: React.FC<NecklaceRibbonProps> = ({
  necklaces,
  selectedId,
  onSelect,
  isLoading,
}) => {
  return (
    <section className="w-full bg-atelier-900/40 border-b border-gold-400/10 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-xs uppercase tracking-widest text-gold-400 font-medium">
              Step 1: Select Inventory Necklace
            </h2>
            <p className="text-sm text-atelier-300">
              Pick a traditional necklace to compute visual & color-aligned earring pairings
            </p>
          </div>
          <span className="text-xs text-atelier-400 font-mono">
            {necklaces.length} Necklaces in Catalog
          </span>
        </div>

        {/* Scrollable Ribbon */}
        <div className="flex gap-4 overflow-x-auto pb-3 pt-1 custom-scrollbar">
          {isLoading
            ? Array.from({ length: 5 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex-shrink-0 w-36 sm:w-44 h-48 rounded-xl bg-atelier-900/80 border border-atelier-800 animate-pulse"
                />
              ))
            : necklaces.map((item) => {
                const isSelected = item.id === selectedId;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelect(item)}
                    className={`flex-shrink-0 group relative text-left rounded-xl p-2.5 transition-all duration-300 border ${
                      isSelected
                        ? 'bg-atelier-850 border-gold-400 shadow-lg shadow-gold-500/10 ring-1 ring-gold-400/40 scale-[1.02]'
                        : 'bg-atelier-900/70 border-atelier-800/80 hover:border-gold-400/40 hover:bg-atelier-850'
                    }`}
                  >
                    {/* Thumbnail Image */}
                    <div className="w-32 sm:w-40 h-32 sm:h-36 rounded-lg overflow-hidden relative bg-atelier-950/80 border border-gold-400/10">
                      <img
                        src={item.image_url}
                        alt={item.id}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-atelier-950/85 backdrop-blur-sm text-[11px] font-mono font-medium text-gold-300 border border-gold-400/20">
                        {item.id}
                      </span>
                    </div>

                    {/* Meta info & Color Swatches */}
                    <div className="mt-2.5 flex items-center justify-between">
                      <span
                        className={`text-xs font-serif font-semibold tracking-wide ${
                          isSelected ? 'text-gold-200' : 'text-atelier-200 group-hover:text-gold-300'
                        }`}
                      >
                        Necklace {item.id}
                      </span>

                      {/* Small Swatch Preview */}
                      <div className="flex -space-x-1 items-center">
                        {item.color_palette?.slice(0, 3).map((swatch, sIdx) => (
                          <span
                            key={sIdx}
                            className="w-3.5 h-3.5 rounded-full border border-atelier-950 shadow-sm inline-block"
                            style={{ backgroundColor: swatch.hex }}
                            title={`Weight: ${(swatch.weight * 100).toFixed(0)}%`}
                          />
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
        </div>
      </div>
    </section>
  );
};
