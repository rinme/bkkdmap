import React from 'react';
import { TrackerStats, FullDistrict } from '@/lib/types';
import { Modal } from './ui/Modal';
import { Trophy, Compass, MapPin, CheckCircle2, PieChart, Sparkles, Award, Waves, Zap } from 'lucide-react';
import { placeCategories } from '@/lib/districts-data';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: TrackerStats;
  districts: FullDistrict[];
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
  districts
}) => {
  const zoneEntries = Object.values(stats.zoneStats);
  const riverVisitedCount = districts.filter(d => d.isRiver && d.isVisited).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bangkok Exploration Passport"
      description="Deep analytical breakdown across districts, zones, categories, and milestone achievements"
      maxWidth="lg"
    >
      <div className="space-y-6 pt-2 max-h-[72vh] overflow-y-auto pr-1">
        {/* Explorer Rank Card */}
        <div className="relative glass-panel rounded-3xl p-5 sm:p-6 border border-emerald-500/30 overflow-hidden bg-gradient-to-br from-[#0c1e28] via-[#0c1322] to-[#070b16]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-teal-600/20 border border-emerald-400/40 flex items-center justify-center text-3xl sm:text-4xl shadow-lg flex-shrink-0">
              {stats.explorerRank.badge}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Level {stats.explorerRank.level} Explorer
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-xs text-slate-300 font-thai">{stats.explorerRank.titleTh}</span>
              </div>
              <h4 className="text-lg sm:text-xl font-black text-white truncate">
                {stats.explorerRank.titleEn}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                {stats.explorerRank.description}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06]">
            <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1.5">
              <span>Passport Exploration Progress</span>
              <span className="text-emerald-400 tabular-nums">{stats.visitedDistricts} / 50 Districts ({stats.visitedPercentage}%)</span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden p-[1px] border border-white/[0.08]">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-700 shadow-glow-emerald"
                style={{ width: `${Math.max(stats.visitedPercentage, 4)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Zone Progress Breakdown */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-emerald-400" />
            Zone Completion (6 Bangkok Zones)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {zoneEntries.map((z) => (
              <div
                key={z.id}
                className="bg-[#060913]/90 rounded-2xl p-4 border border-white/[0.07] space-y-2.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                      style={{ backgroundColor: z.color }}
                    />
                    <span className="text-xs font-bold text-white">
                      {z.nameEn} <span className="text-slate-400 font-thai font-normal">({z.nameTh})</span>
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-300 tabular-nums">
                    {z.visited}/{z.total} <span className="text-slate-500 font-semibold">({z.percentage}%)</span>
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/[0.06] p-[1px]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${z.percentage}%`,
                      backgroundColor: z.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Distribution */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <PieChart className="w-4 h-4 text-emerald-400" />
            Explored Place Categories ({stats.totalPlaces} Total Spots)
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {placeCategories.map((cat) => {
              const count = stats.categoryCounts[cat.id] || 0;
              return (
                <div
                  key={cat.id}
                  className={`rounded-2xl p-3.5 border flex items-center justify-between transition-all ${cat.color} backdrop-blur-md`}
                >
                  <span className="text-xs font-semibold">{cat.label}</span>
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-xl bg-black/30 tabular-nums">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Milestone Badges */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Exploration Milestone Badges
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className={`p-3.5 rounded-2xl border flex items-center gap-3.5 transition-all ${
              stats.visitedDistricts >= 1
                ? 'bg-emerald-950/40 border-emerald-500/40 text-white shadow-sm'
                : 'bg-[#060913]/60 border-white/[0.06] opacity-40'
            }`}>
              <span className="text-3xl">🌱</span>
              <div>
                <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                  First Step in Bangkok
                  {stats.visitedDistricts >= 1 && <span className="text-[10px] text-emerald-400 font-bold">✓ Unlocked</span>}
                </h5>
                <p className="text-[11px] text-slate-400 mt-0.5">Visit at least 1 district ({stats.visitedDistricts}/1)</p>
              </div>
            </div>

            <div className={`p-3.5 rounded-2xl border flex items-center gap-3.5 transition-all ${
              stats.totalPlaces >= 10
                ? 'bg-emerald-950/40 border-emerald-500/40 text-white shadow-sm'
                : 'bg-[#060913]/60 border-white/[0.06] opacity-40'
            }`}>
              <span className="text-3xl">📍</span>
              <div>
                <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                  Landmark Collector
                  {stats.totalPlaces >= 10 && <span className="text-[10px] text-emerald-400 font-bold">✓ Unlocked</span>}
                </h5>
                <p className="text-[11px] text-slate-400 mt-0.5">Log 10+ distinct spots ({stats.totalPlaces}/10)</p>
              </div>
            </div>

            <div className={`p-3.5 rounded-2xl border flex items-center gap-3.5 transition-all ${
              riverVisitedCount >= 5
                ? 'bg-sky-950/40 border-sky-500/40 text-white shadow-sm'
                : 'bg-[#060913]/60 border-white/[0.06] opacity-40'
            }`}>
              <span className="text-3xl">🌊</span>
              <div>
                <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                  Riverbank Wanderer
                  {riverVisitedCount >= 5 && <span className="text-[10px] text-sky-400 font-bold">✓ Unlocked</span>}
                </h5>
                <p className="text-[11px] text-slate-400 mt-0.5">Visit 5+ Chao Phraya river districts ({riverVisitedCount}/5)</p>
              </div>
            </div>

            <div className={`p-3.5 rounded-2xl border flex items-center gap-3.5 transition-all ${
              stats.visitedDistricts >= 25
                ? 'bg-amber-950/40 border-amber-500/40 text-white shadow-sm'
                : 'bg-[#060913]/60 border-white/[0.06] opacity-40'
            }`}>
              <span className="text-3xl">⚡</span>
              <div>
                <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                  Half-Century Club
                  {stats.visitedDistricts >= 25 && <span className="text-[10px] text-amber-400 font-bold">✓ Unlocked</span>}
                </h5>
                <p className="text-[11px] text-slate-400 mt-0.5">Conquer 25 of 50 districts ({stats.visitedDistricts}/25)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

