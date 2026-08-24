import React from 'react';
import { Download, Upload, RotateCcw, Check, RefreshCw, Database } from 'lucide-react';
import { Button } from '../ui/Button';

interface AdminSyncBarProps {
  isSaving: boolean;
  totalVisited: number;
  totalPlaces: number;
  onExport: () => void;
  onImport: () => void;
  onReset: () => void;
}

export const AdminSyncBar: React.FC<AdminSyncBarProps> = ({
  isSaving,
  totalVisited,
  totalPlaces,
  onExport,
  onImport,
  onReset
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0c1322]/95 backdrop-blur-xl border-t border-white/[0.08] shadow-2xl p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Sync Indicator */}
        <div className="flex items-center gap-2.5">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isSaving ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 shadow-glow-emerald'
            }`}
          />
          <div className="text-xs">
            <span className="font-bold text-white">
              {isSaving ? 'Syncing changes...' : 'Changes auto-saved'}
            </span>
            <span className="text-slate-400 ml-2 hidden sm:inline tabular-nums">
              ({totalVisited}/50 Districts, {totalPlaces} Spots)
            </span>
          </div>
        </div>

        {/* Action Controls: Export / Import / Reset */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-white/[0.1] bg-[#060913] hover:bg-white/[0.08] text-slate-200 hover:text-white transition-all cursor-pointer"
            title="Download JSON Backup"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={onImport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-white/[0.1] bg-[#060913] hover:bg-white/[0.08] text-slate-200 hover:text-white transition-all cursor-pointer"
            title="Import JSON State"
          >
            <Upload className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Import</span>
          </button>

          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
            title="Reset to Initial State"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};

