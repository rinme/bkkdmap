import React from 'react';
import Link from 'next/link';
import { TrackerStats, ViewMode } from '@/lib/types';
import { ViewSwitcher } from './ViewSwitcher';
import { Share2, Lock, Unlock, BarChart2, Compass, ShieldCheck } from 'lucide-react';
import { Button } from './ui/Button';

interface HeaderProps {
  stats: TrackerStats;
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onOpenShareModal: () => void;
  onOpenStatsModal: () => void;
  isAdmin?: boolean;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  currentView,
  onViewChange,
  onOpenShareModal,
  onOpenStatsModal,
  isAdmin = false,
  onLogout
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-all pt-[env(safe-area-inset-top)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        {/* Top Row: Title, Switcher, and Actions */}
        <div className="flex items-center justify-between gap-3">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                  Bangkok 50
                </h1>
                <span className="text-xs px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-extrabold border border-emerald-300 dark:border-emerald-800">
                  {stats.explorerRank.badge} Lv.{stats.explorerRank.level}
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hidden sm:block">
                สำรวจ 50 เขตกรุงเทพมหานคร
              </p>
            </div>
          </Link>

          {/* Center View Switcher */}
          <div className="flex items-center">
            <ViewSwitcher currentView={currentView} onViewChange={onViewChange} />
          </div>

          {/* Right Actions: Share, Stats, Admin */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenShareModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {isAdmin ? (
              <div className="flex items-center gap-1">
                <Link
                  href="/admin"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-700 text-xs font-semibold"
                  title="Admin Dashboard Active"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Admin</span>
                </Link>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Logout"
                  >
                    <Unlock className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <Link
                href="/admin"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Admin Login"
              >
                <Lock className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Bottom Row: Sticky Progress Bar & Stats Pill */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white">
                Visited: <span className="text-emerald-600 dark:text-emerald-400">{stats.visitedDistricts}</span> / 50 Districts
              </span>
              <span className="text-slate-400">({stats.visitedPercentage}%)</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onOpenStatsModal}
                className="text-xs font-semibold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span><b>{stats.totalPlaces}</b> Places Logged</span>
              </button>
            </div>
          </div>

          {/* Smooth Progress Track */}
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700/60 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 rounded-full transition-all duration-700 ease-out shadow-sm"
              style={{ width: `${Math.max(stats.visitedPercentage, 2)}%` }}
            />
          </div>
        </div>
      </div>
    </header>
  );
};
