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
    <div className="absolute top-3.5 right-3.5 z-20 flex flex-col gap-2 pointer-events-auto">
      {/* Zoom / Navigation Group */}
      <div className="flex flex-col bg-[#0d1424]/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/[0.08] p-1 gap-1">
        <button
          onClick={onZoomIn}
          aria-label="Zoom in"
          className="p-2 rounded-xl hover:bg-white/[0.08] text-slate-300 hover:text-white transition-all active:scale-95 flex items-center justify-center cursor-pointer"
          title="Zoom In (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={onZoomOut}
          aria-label="Zoom out"
          className="p-2 rounded-xl hover:bg-white/[0.08] text-slate-300 hover:text-white transition-all active:scale-95 flex items-center justify-center cursor-pointer"
          title="Zoom Out (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-full h-px bg-white/[0.06] my-0.5" />
        <button
          onClick={onReset}
          aria-label="Reset map position and zoom"
          className="p-2 rounded-xl hover:bg-white/[0.08] text-slate-300 hover:text-white transition-all active:scale-95 flex items-center justify-center cursor-pointer"
          title="Reset Map View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Label Toggle */}
      <div className="bg-[#0d1424]/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/[0.08] p-1">
        <button
          onClick={onToggleLabels}
          aria-label="Toggle district labels"
          className={`p-2 w-full rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer ${
            showLabels
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'hover:bg-white/[0.08] text-slate-400 hover:text-white'
          }`}
          title={showLabels ? 'Hide Labels' : 'Show Labels'}
        >
          <MapPin className="w-4 h-4" />
        </button>
      </div>

      {/* Visited Filter Toggle */}
      <div className="bg-[#0d1424]/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/[0.08] p-1 flex flex-col gap-1">
        <button
          onClick={() => {
            const nextMap: Record<FilterVisited, FilterVisited> = {
              all: 'visited',
              visited: 'unvisited',
              unvisited: 'all'
            };
            onFilterVisitedChange(nextMap[filterVisited]);
          }}
          className={`p-2 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer ${
            filterVisited === 'visited'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25 font-bold'
              : filterVisited === 'unvisited'
              ? 'bg-slate-700 text-white'
              : 'hover:bg-white/[0.08] text-slate-400 hover:text-white'
          }`}
          title={`Filter: ${filterVisited.toUpperCase()}`}
        >
          <CheckCircle2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

