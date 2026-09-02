'use client';

import React from 'react';
import { Sliders, RotateCcw, X, Info } from 'lucide-react';

interface ScoringControlsDrawerProps {
  clipWeight: number;
  colorWeight: number;
  topN: number;
  onClipChange: (val: number) => void;
  onTopNChange: (val: number) => void;
  onReset: () => void;
  onClose: () => void;
}

export const ScoringControlsDrawer: React.FC<ScoringControlsDrawerProps> = ({
  clipWeight,
  colorWeight,
  topN,
  onClipChange,
  onTopNChange,
  onReset,
  onClose,
}) => {
  return (
    <div className="bg-atelier-900/95 border border-gold-400/25 rounded-2xl p-5 mb-8 backdrop-blur-md shadow-2xl relative">
      <div className="flex items-center justify-between pb-3 border-b border-atelier-800">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-gold-400" />
          <h3 className="font-serif text-sm font-semibold text-gold-200">
            Hybrid Scoring Algorithm Controls
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs text-atelier-400 hover:text-gold-300 transition-colors px-2 py-1 rounded hover:bg-atelier-800"
            title="Reset to 60/40 defaults"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset (60/40)</span>
          </button>
          <button
            onClick={onClose}
            className="text-atelier-400 hover:text-gold-200 p-1 rounded hover:bg-atelier-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {/* Weight Balance Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-atelier-200 font-medium">Embedding vs Color Weight Ratio</span>
            <span className="font-mono text-gold-300">
              {Math.round(clipWeight * 100)}% Style / {Math.round(colorWeight * 100)}% Color
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={clipWeight}
            onChange={(e) => onClipChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-atelier-800 rounded-lg appearance-none cursor-pointer accent-gold-400"
          />

          <div className="flex justify-between text-[11px] text-atelier-400 font-mono">
            <span>0% CLIP (Pure Color)</span>
            <span>Default: 60 / 40</span>
            <span>100% CLIP (Pure Style)</span>
          </div>
        </div>

        {/* Top N Candidate Selector */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-atelier-200 font-medium">Top-N Recommendations</span>
            <span className="font-mono text-gold-300">{topN} Pieces</span>
          </div>

          <div className="flex items-center gap-2">
            {[3, 4, 5, 6, 8].map((n) => (
              <button
                key={n}
                onClick={() => onTopNChange(n)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                  topN === n
                    ? 'bg-gold-500 text-atelier-950 font-bold shadow-md'
                    : 'bg-atelier-800/80 text-atelier-300 hover:bg-atelier-700 hover:text-gold-200'
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          <div className="flex items-start gap-1.5 text-[11px] text-atelier-400">
            <Info className="w-3.5 h-3.5 flex-shrink-0 text-gold-400/80 mt-0.5" />
            <span>
              Dynamic re-ranking executes seamlessly against the candidate pool.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
