'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Database, Check } from 'lucide-react';

interface LiveSyncBadgeProps {
  /** SWR mutate / refetch function */
  onSync: () => Promise<any>;
  /** Auto-refresh interval in seconds (default: 30) */
  intervalSeconds?: number;
  /** Whether SWR is currently validating/fetching */
  isValidating?: boolean;
  /** Optional custom position class (defaults to bottom-4 right-4) */
  className?: string;
}

export function LiveSyncBadge({
  onSync,
  intervalSeconds = 30,
  isValidating = false,
  className = '',
}: LiveSyncBadgeProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(intervalSeconds);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Countdown timer logic
  useEffect(() => {
    setSecondsRemaining(intervalSeconds);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          return intervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [intervalSeconds]);

  // When validation completes, reset seconds and show "Synced"
  useEffect(() => {
    if (!isValidating && !isManualSyncing) {
      setJustSynced(true);
      const t = setTimeout(() => setJustSynced(false), 2000);
      return () => clearTimeout(t);
    }
  }, [isValidating, isManualSyncing]);

  const handleManualSync = async () => {
    if (isManualSyncing || isValidating) return;
    setIsManualSyncing(true);
    try {
      await onSync();
      setSecondsRemaining(intervalSeconds);
      setJustSynced(true);
      setTimeout(() => setJustSynced(false), 2000);
    } catch (err) {
      console.error('Manual sync failed:', err);
    } finally {
      setIsManualSyncing(false);
    }
  };

  const isBusy = isValidating || isManualSyncing;

  return (
    <div
      className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 select-none animate-fade-in ${className}`}
    >
      <button
        onClick={handleManualSync}
        disabled={isBusy}
        title="Live database auto-sync • Click to refresh now"
        className={`group flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300 cursor-pointer active:scale-95 ${
          justSynced
            ? 'bg-[#091b1d]/90 border-emerald-500/40 text-emerald-300 shadow-emerald-500/10'
            : isBusy
            ? 'bg-[#10192e]/90 border-cyan-500/40 text-cyan-300 shadow-cyan-500/10'
            : 'bg-[#0c1322]/85 hover:bg-[#111a2e]/90 border-white/[0.09] hover:border-emerald-500/30 text-slate-300 hover:text-white shadow-black/60'
        }`}
      >
        {/* Pulsing Status Dot / Database Icon */}
        <div className="relative flex items-center justify-center">
          {justSynced ? (
            <Check className="w-3.5 h-3.5 text-emerald-400 animate-in zoom-in-75 duration-200" />
          ) : isBusy ? (
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="absolute w-2 h-2 rounded-full bg-emerald-400/50 animate-ping" />
            </>
          )}
        </div>

        {/* Status Text & Countdown */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono font-medium tracking-tight">
          <span className="text-slate-400 group-hover:text-slate-200 transition-colors flex items-center gap-1">
            <Database className="w-3 h-3 text-slate-500" />
            <span>DB</span>
          </span>

          <span className="text-slate-600">•</span>

          {justSynced ? (
            <span className="text-emerald-300 font-bold font-sans">Synced</span>
          ) : isBusy ? (
            <span className="text-cyan-300 font-bold font-sans">Syncing...</span>
          ) : (
            <span className="tabular-nums">
              <span className="text-slate-400">refetch in </span>
              <span className="text-emerald-400 font-bold">{secondsRemaining}s</span>
            </span>
          )}
        </div>

        {/* Micro Refresh Action Indicator */}
        <span
          className={`text-slate-500 group-hover:text-emerald-400 transition-colors ml-0.5 ${
            isBusy ? 'opacity-0' : 'opacity-70 group-hover:opacity-100'
          }`}
        >
          <RefreshCw className="w-2.5 h-2.5 group-hover:rotate-180 transition-transform duration-500" />
        </span>
      </button>
    </div>
  );
}
