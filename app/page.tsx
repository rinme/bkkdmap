'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { FullDistrict, TrackerStats, ViewMode } from '@/lib/types';
import { Header } from '@/components/Header';
import { BangkokMap } from '@/components/map/BangkokMap';
import { DistrictListView } from '@/components/district-list/DistrictListView';
import { DistrictBottomSheet } from '@/components/DistrictBottomSheet';
import { ShareModal } from '@/components/ShareModal';
import { StatsModal } from '@/components/StatsModal';
import { Compass, Sparkles, MapPin, CheckCircle2, TrendingUp, Trophy, ArrowRight, Award, ShieldCheck, Waves } from 'lucide-react';
import { placeCategories } from '@/lib/districts-data';

interface DistrictsApiResponse {
  districts: FullDistrict[];
  stats: TrackerStats;
}

const fetcher = async (url: string): Promise<DistrictsApiResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to load district data');
  }
  return res.json();
};

export default function HomePage() {
  const { data, error, isLoading } = useSWR<DistrictsApiResponse>(
    '/api/districts',
    fetcher,
    { revalidateOnFocus: true, dedupingInterval: 5000 }
  );

  const districts = data?.districts ?? [];
  const stats = data?.stats ?? null;

  // View States
  const [currentView, setCurrentView] = useState<ViewMode>('map');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  const selectedDistrict = districts.find((d) => d.id === selectedDistrictId) || null;

  const handleSelectDistrict = (d: FullDistrict) => {
    setSelectedDistrictId(d.id);
    setIsBottomSheetOpen(true);
  };

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-[#060913] flex flex-col items-center justify-center p-4 text-center">
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-transparent border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-glow-emerald animate-pulse">
            <Compass className="w-9 h-9 animate-spin" style={{ animationDuration: '4s' }} />
          </div>
          <div className="absolute -inset-1 rounded-3xl bg-emerald-500/20 blur-xl -z-10 animate-pulse-glow" />
        </div>
        <h2 className="text-xl font-black text-white tracking-tight">Bangkok 50 Districts Tracker</h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">Loading vector boundaries & passport logs...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-[#060913] flex flex-col items-center justify-center p-6 text-center">
        <div className="glass-panel rounded-3xl p-8 max-w-md border border-rose-500/30">
          <h2 className="text-lg font-black text-rose-400">Failed to load district data</h2>
          <p className="text-xs text-slate-400 mt-2 mb-5 leading-relaxed">{error?.message || error || 'Unknown error occurred'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl text-xs font-bold shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-slate-100 pb-12">
      {/* Sticky Progress Header */}
      <Header
        stats={stats}
        currentView={currentView}
        onViewChange={setCurrentView}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenStatsModal={() => setIsStatsModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-3 sm:pt-5 pb-12 space-y-6">
        {/* Dynamic View: Map vs List vs Analytics */}
        {currentView === 'map' && (
          <div className="space-y-3.5">
            <BangkokMap
              districts={districts}
              selectedDistrict={selectedDistrict}
              onSelectDistrict={handleSelectDistrict}
            />

            {/* Quick Helper Banner */}
            <div className="glass-panel rounded-2xl p-4 border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-[#0c1322]/80">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex-shrink-0">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <p className="font-bold text-white text-xs sm:text-sm">
                    Interactive Map — Tap any district to view logged spots & landmarks
                  </p>
                  <p className="text-slate-400 mt-0.5 text-[11px]">
                    Emerald = Visited (<span className="text-emerald-300 font-bold tabular-nums">{stats.visitedDistricts}</span>) • Slate = Unvisited (<span className="text-slate-300 font-bold tabular-nums">{50 - stats.visitedDistricts}</span>) • Touch to pan and pinch to zoom
                  </p>
                </div>
              </div>

              <button
                onClick={() => setCurrentView('list')}
                className="px-4 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-white font-bold text-xs border border-white/[0.08] hover:border-white/[0.15] transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5"
              >
                <span>View as List</span>
                <ArrowRight className="w-3.5 h-3.5" />
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
          <div className="space-y-6 animate-fade-in">
            {/* Explorer Level Hero Passport Card */}
            <div className="relative glass-panel rounded-3xl p-6 sm:p-8 border border-emerald-500/30 shadow-2xl overflow-hidden bg-gradient-to-br from-[#0c1e28] via-[#0c1322] to-[#070b16]">
              {/* Background ambient lighting */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-emerald-400/20 to-teal-600/20 border border-emerald-400/40 flex items-center justify-center text-4xl sm:text-5xl shadow-xl flex-shrink-0">
                  {stats.explorerRank.badge}
                </div>

                <div className="text-center sm:text-left space-y-2 flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                    <Trophy className="w-3.5 h-3.5" />
                    Level {stats.explorerRank.level} Explorer
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {stats.explorerRank.titleEn}
                    <span className="text-lg sm:text-xl font-bold text-slate-400 ml-2 font-thai">
                      ({stats.explorerRank.titleTh})
                    </span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                    {stats.explorerRank.description}
                  </p>

                  {/* Level Progress Bar */}
                  <div className="pt-2 max-w-md">
                    <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1">
                      <span>Explorer Level Progress</span>
                      <span className="text-emerald-400 tabular-nums">{stats.visitedDistricts} / 50 Districts</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-white/[0.08] p-[1px]">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-700 shadow-glow-emerald"
                        style={{ width: `${Math.max(stats.visitedPercentage, 4)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Award className="w-4 h-4" />
                    <span>Export Passport</span>
                  </button>
                  <button
                    onClick={() => setIsStatsModalOpen(true)}
                    className="px-5 py-2.5 rounded-2xl bg-slate-850 hover:bg-slate-800 text-white font-semibold text-xs border border-white/[0.08] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Detailed Breakdown</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Zone Statistics Grid */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-400" />
                Exploration by Bangkok Zones (6 Zones)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.values(stats.zoneStats).map((z) => (
                  <div
                    key={z.id}
                    className="glass-panel rounded-3xl p-5 border border-white/[0.08] space-y-3 shadow-sm bg-[#0c1322]/80 hover:border-white/[0.14] transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block"
                            style={{ backgroundColor: z.color }}
                          />
                          {z.nameEn}
                        </h4>
                        <p className="text-xs text-slate-400 font-thai">{z.nameTh}</p>
                      </div>
                      <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-[#060913] text-white border border-white/[0.08] tabular-nums">
                        {z.visited} / {z.total}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-slate-400">
                        <span>Completion</span>
                        <span style={{ color: z.color }} className="tabular-nums">{z.percentage}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden p-[1px] border border-white/[0.06]">
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
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Places Logged by Category ({stats.totalPlaces} Total Spots)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {placeCategories.map((cat) => {
                  const count = stats.categoryCounts[cat.id] || 0;
                  return (
                    <div
                      key={cat.id}
                      className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${cat.color} backdrop-blur-md`}
                    >
                      <span className="text-xs font-bold">{cat.label}</span>
                      <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-black/30 tabular-nums">
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

