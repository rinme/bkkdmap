'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Database, Check, Clock } from 'lucide-react';

interface LiveSyncBadgeProps {
  /** SWR mutate / refetch function */
  onSync: () => Promise<any>;
  /** Auto-refresh interval in seconds (default: 30) */
  intervalSeconds?: number;
  /** Cooldown duration in seconds after manual press (default: 10) */
  cooldownSeconds?: number;
  /** Whether SWR is currently validating/fetching */
  isValidating?: boolean;
  /** Optional custom position class (defaults to bottom-4 right-4) */
  className?: string;
}

export function LiveSyncBadge({
  onSync,
  intervalSeconds = 30,
  cooldownSeconds = 10,
  isValidating = false,
  className = '',
}: LiveSyncBadgeProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(intervalSeconds);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const autoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-refresh countdown timer (30s cycle)
  useEffect(() => {
    setSecondsRemaining(intervalSeconds);

    if (autoTimerRef.current) clearInterval(autoTimerRef.current);

    autoTimerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          return intervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    };
  }, [intervalSeconds]);

  // Cooldown countdown timer (10s after manual click)
  useEffect(() => {
    if (cooldownRemaining > 0) {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);

      cooldownTimerRef.current = setInterval(() => {
        setCooldownRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(cooldownTimerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, [cooldownRemaining]);

  // When validation completes, reset seconds and show "Synced"
  useEffect(() => {
    if (!isValidating && !isManualSyncing) {
      setJustSynced(true);
      const t = setTimeout(() => setJustSynced(false), 2000);
      return () => clearTimeout(t);
    }
  }, [isValidating, isManualSyncing]);

  const handleManualSync = async () => {
    if (isManualSyncing || isValidating || cooldownRemaining > 0) return;

    setIsManualSyncing(true);
    setCooldownRemaining(cooldownSeconds); // Start 10s cooldown immediately

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
  const isCooldownActive = cooldownRemaining > 0;
  const isDisabled = isBusy || isCooldownActive;

  return (
    <div
      className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 select-none animate-fade-in ${className}`}
    >
      <button
        onClick={handleManualSync}
        disabled={isDisabled}
        title={
          isCooldownActive
            ? `Manual refetch cooldown (${cooldownRemaining}s remaining)`
            : 'Live database auto-sync • Click to refresh now'
        }
        className={`group relative flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300 ${
          isCooldownActive
            ? 'bg-[#0c1322]/90 border-white/[0.06] text-slate-400 cursor-not-allowed opacity-90'
            : justSynced
            ? 'bg-[#091b1d]/90 border-emerald-500/40 text-emerald-300 shadow-emerald-500/10 cursor-pointer active:scale-95'
            : isBusy
            ? 'bg-[#10192e]/90 border-cyan-500/40 text-cyan-300 shadow-cyan-500/10 cursor-wait'
            : 'bg-[#0c1322]/85 hover:bg-[#111a2e]/90 border-white/[0.09] hover:border-emerald-500/30 text-slate-300 hover:text-white shadow-black/60 cursor-pointer active:scale-95'
        }`}
      >
        {/* Pulsing Status Dot / Database Icon */}
        <div className="relative flex items-center justify-center">
          {justSynced ? (
            <Check className="w-3.5 h-3.5 text-emerald-400 animate-in zoom-in-75 duration-200" />
          ) : isBusy ? (
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
          ) : isCooldownActive ? (
            <Clock className="w-3.5 h-3.5 text-amber-400/80 animate-pulse" />
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="absolute w-2 h-2 rounded-full bg-emerald-400/50 animate-ping" />
            </>
          )}
        </div>

        {/* Status Text & Countdowns */}
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
          ) : isCooldownActive ? (
            <span className="tabular-nums flex items-center gap-1">
              <span className="text-amber-400/90 font-bold font-sans">Cooldown</span>
              <span className="text-amber-300 font-bold">({cooldownRemaining}s)</span>
            </span>
          ) : (
            <span className="tabular-nums">
              <span className="text-slate-400">refetch in </span>
              <span className="text-emerald-400 font-bold">{secondsRemaining}s</span>
            </span>
          )}
        </div>

        {/* Micro Refresh Action Indicator / Cooldown Icon */}
        <span
          className={`transition-colors ml-0.5 ${
            isCooldownActive
              ? 'text-amber-400/60'
              : isBusy
              ? 'opacity-0'
              : 'text-slate-500 group-hover:text-emerald-400 opacity-70 group-hover:opacity-100'
          }`}
        >
          {isCooldownActive ? (
            <span className="text-[10px] font-bold text-amber-400/70 font-mono">10s</span>
          ) : (
            <RefreshCw className="w-2.5 h-2.5 group-hover:rotate-180 transition-transform duration-500" />
          )}
        </span>
      </button>
    </div>
  );
}
