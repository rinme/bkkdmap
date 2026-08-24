import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Filter, MapPin, Eye, CheckCircle2 } from 'lucide-react';
import { BangkokZone, FilterVisited } from '@/lib/types';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  zones: BangkokZone[];
  selectedZone: string | null;
  onSelectZone: (zoneId: string | null) => void;
  filterVisited: FilterVisited;
  onFilterVisitedChange: (filter: FilterVisited) => void;
  showLabels: boolean;
  onToggleLabels: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onReset,
  zones,
  selectedZone,
  onSelectZone,
  filterVisited,
  onFilterVisitedChange,
  showLabels,
  onToggleLabels
}) => {
  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 pointer-events-auto">
      {/* Zoom / Navigation Group */}
      <div className="flex flex-col bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/80 dark:border-slate-800/80 p-1.5 gap-1">
        <button
          onClick={onZoomIn}
          aria-label="Zoom in"
          className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all active:scale-95 flex items-center justify-center"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={onZoomOut}
          aria-label="Zoom out"
          className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all active:scale-95 flex items-center justify-center"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={onReset}
          aria-label="Reset map position and zoom"
          className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all active:scale-95 flex items-center justify-center"
          title="Center / Reset Map"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {/* Label Toggle */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/80 dark:border-slate-800/80 p-1.5">
        <button
          onClick={onToggleLabels}
          aria-label="Toggle district labels"
          className={`p-2.5 w-full rounded-xl transition-all active:scale-95 flex items-center justify-center ${
            showLabels
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
          }`}
          title={showLabels ? 'Hide Labels' : 'Show Labels'}
        >
          <MapPin className="w-5 h-5" />
        </button>
      </div>

      {/* Visited Filter Toggle */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/80 dark:border-slate-800/80 p-1.5 flex flex-col gap-1">
        <button
          onClick={() => {
            const nextMap: Record<FilterVisited, FilterVisited> = {
              all: 'visited',
              visited: 'unvisited',
              unvisited: 'all'
            };
            onFilterVisitedChange(nextMap[filterVisited]);
          }}
          className={`p-2.5 rounded-xl transition-all active:scale-95 flex items-center justify-center ${
            filterVisited === 'visited'
              ? 'bg-emerald-500 text-white shadow-sm'
              : filterVisited === 'unvisited'
              ? 'bg-slate-700 text-white'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
          }`}
          title={`Filter: ${filterVisited.toUpperCase()}`}
        >
          <CheckCircle2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
