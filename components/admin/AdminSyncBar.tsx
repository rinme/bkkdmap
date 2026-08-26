import React, { useState, useRef, useEffect } from 'react';
import { Download, Upload, RotateCcw, ChevronDown, FileText, Archive } from 'lucide-react';

interface AdminSyncBarProps {
  isSaving: boolean;
  totalVisited: number;
  totalPlaces: number;
  onExport: () => void;
  onExportZip?: () => void;
  onImport: () => void;
  onReset: () => void;
}

export const AdminSyncBar: React.FC<AdminSyncBarProps> = ({
  isSaving,
  totalVisited,
  totalPlaces,
  onExport,
  onExportZip,
  onImport,
  onReset
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);

  const handleExportJson = () => {
    setShowExportMenu(false);
    onExport();
  };

  const handleExportZip = () => {
    setShowExportMenu(false);
    if (onExportZip) {
      onExportZip();
    } else {
      window.location.href = '/api/export?format=zip';
    }
  };

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
          {/* Export Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => setShowExportMenu((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-white/[0.1] bg-[#060913] hover:bg-white/[0.08] text-slate-200 hover:text-white transition-all cursor-pointer shadow-sm"
              title="Export backup options"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Export</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>

            {showExportMenu && (
              <div className="absolute bottom-full mb-2 right-0 sm:left-0 sm:right-auto w-56 bg-[#0c1322] border border-white/[0.12] rounded-2xl shadow-2xl p-1.5 z-50 animate-fade-in text-xs space-y-1">
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/[0.08] text-slate-200 hover:text-white transition-colors flex items-center gap-2.5 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="font-bold">JSON Backup</p>
                    <p className="text-[10px] text-slate-400">Database state only (.json)</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleExportZip}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/[0.08] text-slate-200 hover:text-white transition-colors flex items-center gap-2.5 cursor-pointer"
                >
                  <Archive className="w-4 h-4 text-sky-400 flex-shrink-0" />
                  <div>
                    <p className="font-bold">Full ZIP Backup</p>
                    <p className="text-[10px] text-slate-400">Data + all uploaded photos (.zip)</p>
                  </div>
                </button>
              </div>
            )}
          </div>

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

