import React from 'react';
import Link from 'next/link';
import { TrackerStats, ViewMode } from '@/lib/types';
import { ViewSwitcher } from './ViewSwitcher';
import { Share2, Lock, Unlock, BarChart2, Compass, ShieldCheck, Sparkles, MapPin, Settings } from 'lucide-react';
import { Button } from './ui/Button';

interface HeaderProps {
  stats: TrackerStats;
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onOpenShareModal: () => void;
  onOpenStatsModal: () => void;
  isAdmin?: boolean;
  onLogout?: () => void;
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  currentView,
  onViewChange,
  onOpenShareModal,
  onOpenStatsModal,
  isAdmin = false,
  onLogout,
  onOpenSettings
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#060913]/85 backdrop-blur-xl border-b border-white/[0.07] shadow-xl transition-all pt-[env(safe-area-inset-top)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        {/* Top Row: Title, Switcher, and Actions */}
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/25 group-hover:scale-105 group-hover:shadow-emerald-500/40 transition-all duration-300 flex-shrink-0">
              <Compass className="w-5 h-5 transition-transform group-hover:rotate-45 duration-500" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-black text-white tracking-tight leading-none">
                  Bangkok 50
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-extrabold border border-emerald-500/30 shadow-sm flex items-center gap-1">
                  <span>{stats.explorerRank.badge}</span>
                  <span>Lv.{stats.explorerRank.level}</span>
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-400 hidden sm:block leading-tight mt-0.5">
                สำรวจ 50 เขตกรุงเทพฯ
              </p>
            </div>
          </Link>

          {/* Center View Switcher */}
          <div className="flex items-center">
            <ViewSwitcher currentView={currentView} onViewChange={onViewChange} />
          </div>

          {/* Right Actions: Share, Admin */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onOpenShareModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all active:scale-95 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {isAdmin ? (
              <div className="flex items-center gap-1">
                <Link
                  href="/admin"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold"
                  title="Admin Dashboard Active"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden md:inline">Admin</span>
                </Link>
                {onOpenSettings && (
                  <button
                    onClick={onOpenSettings}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                    title="Admin Settings & Upload Configuration"
                  >
                    <Settings className="w-4 h-4 text-slate-300" />
                  </button>
                )}
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Logout"
                  >
                    <Unlock className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <Link
                href="/admin"
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                title="Admin Login"
              >
                <Lock className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Bottom Row: Sticky Progress Bar & Stats Pill */}
        <div className="mt-2.5 pt-2 border-t border-white/[0.06]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-xs">
                Visited: <span className="text-emerald-400 font-black tabular-nums">{stats.visitedDistricts}</span> / 50 Districts
              </span>
              <span className="text-[11px] font-semibold text-slate-400 tabular-nums">({stats.visitedPercentage}%)</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onOpenStatsModal}
                className="text-xs font-semibold text-slate-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
                <span><b className="text-white tabular-nums">{stats.totalPlaces}</b> Spots Logged</span>
              </button>
            </div>
          </div>

          {/* Smooth Progress Track */}
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden p-[1px] border border-white/[0.08] shadow-inner relative">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full transition-all duration-700 ease-out shadow-glow-emerald"
              style={{ width: `${Math.max(stats.visitedPercentage, 2)}%` }}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

