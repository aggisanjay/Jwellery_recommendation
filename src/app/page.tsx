'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Product, RecommendationCandidate, RecommendationResponse } from '@/types/jewelry';
import { Header } from '@/components/Header';
import { NecklaceRibbon } from '@/components/NecklaceRibbon';
import { SelectedNecklaceHero } from '@/components/SelectedNecklaceHero';
import { RecommendationGrid } from '@/components/RecommendationGrid';
import { ScoringControlsDrawer } from '@/components/ScoringControlsDrawer';
import { Sparkles, Info, RefreshCw } from 'lucide-react';

export default function Home() {
  const [necklaces, setNecklaces] = useState<Product[]>([]);
  const [selectedNecklace, setSelectedNecklace] = useState<Product | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationCandidate[]>([]);
  const [isLoadingNecklaces, setIsLoadingNecklaces] = useState(true);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [dataSource, setDataSource] = useState<'supabase_pgvector' | 'local_cached_index'>('local_cached_index');

  // Scoring controls state
  const [showWeightsDrawer, setShowWeightsDrawer] = useState(false);
  const [clipWeight, setClipWeight] = useState(0.6);
  const [colorWeight, setColorWeight] = useState(0.4);
  const [topN, setTopN] = useState(5);

  // Fetch necklaces catalog on initial mount
  useEffect(() => {
    async function loadNecklaces() {
      try {
        setIsLoadingNecklaces(true);
        const res = await fetch('/api/necklaces');
        const data = await res.json();
        if (data.necklaces && data.necklaces.length > 0) {
          setNecklaces(data.necklaces);
          // Default select the first necklace (N01)
          setSelectedNecklace(data.necklaces[0]);
        }
      } catch (err) {
        console.error('Failed to load necklaces:', err);
      } finally {
        setIsLoadingNecklaces(false);
      }
    }
    loadNecklaces();
  }, []);

  // Fetch recommendations whenever selected necklace or weights change
  const fetchRecommendations = useCallback(
    async (necklaceId: string, clipW: number, colorW: number, n: number) => {
      try {
        setIsLoadingRecommendations(true);
        const url = `/api/recommend?necklaceId=${necklaceId}&clipWeight=${clipW}&colorWeight=${colorW}&topN=${n}`;
        const res = await fetch(url);
        const data: RecommendationResponse = await res.json();

        if (data.recommendations) {
          setRecommendations(data.recommendations);
          if (data.source) {
            setDataSource(data.source);
          }
        }
      } catch (err) {
        console.error('Failed to fetch recommendations:', err);
      } finally {
        setIsLoadingRecommendations(false);
      }
    },
    []
  );

  useEffect(() => {
    if (selectedNecklace?.id) {
      fetchRecommendations(selectedNecklace.id, clipWeight, colorWeight, topN);
    }
  }, [selectedNecklace?.id, clipWeight, colorWeight, topN, fetchRecommendations]);

  const handleClipWeightChange = (val: number) => {
    setClipWeight(val);
    setColorWeight(Number((1 - val).toFixed(2)));
  };

  const handleResetWeights = () => {
    setClipWeight(0.6);
    setColorWeight(0.4);
    setTopN(5);
  };

  return (
    <div className="min-h-screen flex flex-col bg-atelier-950">
      {/* Top Atelier Navigation */}
      <Header
        onToggleWeights={() => setShowWeightsDrawer(!showWeightsDrawer)}
        showWeights={showWeightsDrawer}
        dataSource={dataSource}
      />

      {/* Necklace Picker Ribbon */}
      <NecklaceRibbon
        necklaces={necklaces}
        selectedId={selectedNecklace?.id || null}
        onSelect={(neck) => setSelectedNecklace(neck)}
        isLoading={isLoadingNecklaces}
      />

      {/* Main Experience Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Scoring Controls Drawer */}
        {showWeightsDrawer && (
          <ScoringControlsDrawer
            clipWeight={clipWeight}
            colorWeight={colorWeight}
            topN={topN}
            onClipChange={handleClipWeightChange}
            onTopNChange={setTopN}
            onReset={handleResetWeights}
            onClose={() => setShowWeightsDrawer(false)}
          />
        )}

        {/* 2-Column Responsive Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Active Query Necklace Showcase (5 cols) */}
          <div className="lg:col-span-4 lg:sticky lg:top-28">
            <SelectedNecklaceHero necklace={selectedNecklace} />

            {/* Architectural Notes Card */}
            <div className="mt-5 p-4 rounded-xl bg-atelier-900/40 border border-gold-400/10 text-xs text-atelier-300/90 space-y-2">
              <div className="flex items-center gap-1.5 text-gold-300 font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Jewelry Styling Logic</span>
              </div>
              <p className="leading-relaxed">
                Matches traditional Indian jewelry sets by marrying CLIP visual representation (kundan, polki, filigree, pearl tassels) with dominant stone color palettes (emerald green, ruby red, pearl white) in CIE L*a*b* space.
              </p>
            </div>
          </div>

          {/* Right Column: Ranked Earring Recommendations (8 cols) */}
          <div className="lg:col-span-8">
            <RecommendationGrid
              recommendations={recommendations}
              isLoading={isLoadingRecommendations}
              scoringWeights={{ clip: clipWeight, color: colorWeight }}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gold-400/10 bg-atelier-950 py-6 text-center text-xs text-atelier-500 font-mono">
        <p>AI Jewelry Visual-Matching Prototype • Next.js App Router + pgvector + CLIP ViT-B/32 + LAB K-Means</p>
      </footer>
    </div>
  );
}
