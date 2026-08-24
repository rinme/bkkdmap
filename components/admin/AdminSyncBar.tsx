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
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-2xl p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Sync Indicator */}
        <div className="flex items-center gap-2.5">
          <div
            className={`w-3 h-3 rounded-full ${
              isSaving ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 shadow-sm'
            }`}
          />
          <div className="text-xs">
            <span className="font-bold text-slate-900 dark:text-white">
              {isSaving ? 'Syncing changes...' : 'Changes auto-saved'}
            </span>
            <span className="text-slate-400 ml-2 hidden sm:inline">
              ({totalVisited}/50 Districts, {totalPlaces} Spots)
            </span>
          </div>
        </div>

        {/* Action Controls: Export / Import / Reset */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all"
            title="Download JSON Backup"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={onImport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all"
            title="Import JSON State"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import</span>
          </button>

          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
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
