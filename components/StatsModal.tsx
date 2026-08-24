import React from 'react';
import { TrackerStats, FullDistrict } from '@/lib/types';
import { Modal } from './ui/Modal';
import { Trophy, Compass, MapPin, CheckCircle2, PieChart, Sparkles } from 'lucide-react';
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bangkok Exploration Analytics"
      description="Deep breakdown across zones, categories, and milestone achievements"
      maxWidth="lg"
    >
      <div className="space-y-6 pt-2 max-h-[70vh] overflow-y-auto pr-1">
        {/* Explorer Rank Card */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent rounded-3xl p-5 border border-emerald-500/20 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-md flex items-center justify-center text-3xl flex-shrink-0">
            {stats.explorerRank.badge}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Level {stats.explorerRank.level}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500">{stats.explorerRank.titleTh}</span>
            </div>
            <h4 className="text-lg font-black text-slate-900 dark:text-white">
              {stats.explorerRank.titleEn}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              {stats.explorerRank.description}
            </p>
          </div>
        </div>

        {/* Zone Progress Breakdown */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-emerald-500" />
            Zone Completion (6 Zones of Bangkok)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {zoneEntries.map((z) => (
              <div
                key={z.id}
                className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: z.color }}
                    />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {z.nameTh}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {z.visited}/{z.total} ({z.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
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
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
            <PieChart className="w-4 h-4 text-emerald-500" />
            Explored Place Categories
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {placeCategories.map((cat) => {
              const count = stats.categoryCounts[cat.id] || 0;
              return (
                <div
                  key={cat.id}
                  className={`rounded-2xl p-3 border flex items-center justify-between ${cat.color}`}
                >
                  <span className="text-xs font-semibold">{cat.label}</span>
                  <span className="text-xs font-black px-2 py-0.5 rounded-full bg-white/60 dark:bg-black/30">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Milestone Badges */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Exploration Badges Unlocked
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className={`p-3 rounded-2xl border flex items-center gap-3 ${
              stats.visitedDistricts >= 1
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-50'
            }`}>
              <span className="text-2xl">🌱</span>
              <div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-white">First Step in Bangkok</h5>
                <p className="text-[11px] text-slate-500">Visit at least 1 district</p>
              </div>
            </div>

            <div className={`p-3 rounded-2xl border flex items-center gap-3 ${
              stats.totalPlaces >= 10
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-50'
            }`}>
              <span className="text-2xl">📍</span>
              <div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-white">Landmark Collector</h5>
                <p className="text-[11px] text-slate-500">Log 10+ distinct spots</p>
              </div>
            </div>

            <div className={`p-3 rounded-2xl border flex items-center gap-3 ${
              districts.filter(d => d.isRiver && d.isVisited).length >= 5
                ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-50'
            }`}>
              <span className="text-2xl">🌊</span>
              <div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-white">Riverbank Wanderer</h5>
                <p className="text-[11px] text-slate-500">Visit 5+ Chao Phraya river districts</p>
              </div>
            </div>

            <div className={`p-3 rounded-2xl border flex items-center gap-3 ${
              stats.visitedDistricts >= 25
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-50'
            }`}>
              <span className="text-2xl">⚡</span>
              <div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-white">Half-Century Club</h5>
                <p className="text-[11px] text-slate-500">Conquer 25 of 50 districts</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
