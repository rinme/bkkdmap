'use client';

import React, { useState, useEffect } from 'react';
import { FullDistrict, TrackerStats, ViewMode } from '@/lib/types';
import { Header } from '@/components/Header';
import { BangkokMap } from '@/components/map/BangkokMap';
import { DistrictListView } from '@/components/district-list/DistrictListView';
import { DistrictBottomSheet } from '@/components/DistrictBottomSheet';
import { ShareModal } from '@/components/ShareModal';
import { StatsModal } from '@/components/StatsModal';
import { Compass, Sparkles, MapPin, CheckCircle2, TrendingUp, Trophy } from 'lucide-react';
import { placeCategories } from '@/lib/districts-data';

export default function HomePage() {
  const [districts, setDistricts] = useState<FullDistrict[]>([]);
  const [stats, setStats] = useState<TrackerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View States
  const [currentView, setCurrentView] = useState<ViewMode>('map');
  const [selectedDistrict, setSelectedDistrict] = useState<FullDistrict | null>(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  // Fetch district data on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch('/api/districts', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load district data');
        const data = await res.json();
        setDistricts(data.districts);
        setStats(data.stats);
      } catch (err: any) {
        setError(err.message || 'Error loading districts');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSelectDistrict = (d: FullDistrict) => {
    setSelectedDistrict(d);
    setIsBottomSheetOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 animate-pulse">
          <Compass className="w-8 h-8 animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        <h2 className="text-lg font-bold text-white tracking-tight">Loading Bangkok 50 Districts...</h2>
        <p className="text-xs text-slate-500 mt-1">Fetching map boundaries and logged places</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-rose-400">Failed to load data</h2>
        <p className="text-sm text-slate-400 mt-2 mb-4">{error || 'Unknown error occurred'}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-500 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 pb-12">
      {/* Sticky Progress Header */}
      <Header
        stats={stats}
        currentView={currentView}
        onViewChange={setCurrentView}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenStatsModal={() => setIsStatsModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-4 pb-12 space-y-6">
        {/* Dynamic View: Map vs List vs Analytics */}
        {currentView === 'map' && (
          <div className="space-y-4">
            <BangkokMap
              districts={districts}
              selectedDistrict={selectedDistrict}
              onSelectDistrict={handleSelectDistrict}
            />

            {/* Quick Helper Banner */}
            <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <p className="font-bold text-slate-200">
                    Interactive Bangkok Map — Single tap to inspect any of the 50 districts
                  </p>
                  <p className="text-slate-400 mt-0.5">
                    Green = Visited ({stats.visitedDistricts}) • Slate = Unvisited ({50 - stats.visitedDistricts}) • Touch to pan and pinch to zoom
                  </p>
                </div>
              </div>

              <button
                onClick={() => setCurrentView('list')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors whitespace-nowrap"
              >
                View as List →
              </button>
            </div>
          </div>
        )}

        {currentView === 'list' && (
          <DistrictListView
            districts={districts}
            onSelectDistrict={handleSelectDistrict}
          />
        )}

        {currentView === 'stats' && (
          <div className="space-y-6">
            {/* Explorer Level Hero */}
            <div className="bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-900 rounded-3xl p-6 sm:p-8 border border-emerald-800/50 shadow-2xl flex flex-col sm:flex-row items-center gap-6">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-4xl shadow-xl flex-shrink-0">
                {stats.explorerRank.badge}
              </div>

              <div className="text-center sm:text-left space-y-1.5 flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  <Trophy className="w-3.5 h-3.5" />
                  Level {stats.explorerRank.level} Explorer
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  {stats.explorerRank.titleEn} ({stats.explorerRank.titleTh})
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
                  {stats.explorerRank.description}
                </p>
              </div>

              <button
                onClick={() => setIsShareModalOpen(true)}
                className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
              >
                <span>Export Passport</span>
              </button>
            </div>

            {/* Zone Statistics Grid */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-400" />
                Exploration by Bangkok Zones
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.values(stats.zoneStats).map((z) => (
                  <div
                    key={z.id}
                    className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white">{z.nameEn}</h4>
                        <p className="text-xs text-slate-500">{z.nameTh}</p>
                      </div>
                      <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-slate-800 text-slate-200">
                        {z.visited} / {z.total}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                        <span>Progress</span>
                        <span style={{ color: z.color }}>{z.percentage}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${z.percentage}%`,
                            backgroundColor: z.color
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Places by Category */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Places Logged by Category ({stats.totalPlaces} Total)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {placeCategories.map((cat) => {
                  const count = stats.categoryCounts[cat.id] || 0;
                  return (
                    <div
                      key={cat.id}
                      className={`p-4 rounded-2xl border flex items-center justify-between ${cat.color}`}
                    >
                      <span className="text-xs font-bold">{cat.label}</span>
                      <span className="text-sm font-black px-2 py-0.5 rounded-lg bg-black/20">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Slide-Up District Bottom Sheet */}
      <DistrictBottomSheet
        district={selectedDistrict}
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
      />

      {/* Snapshot / Share Card Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        stats={stats}
        districts={districts}
      />

      {/* Detailed Analytics Modal */}
      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        stats={stats}
        districts={districts}
      />
    </div>
  );
}
