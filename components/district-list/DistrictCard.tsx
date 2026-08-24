import React from 'react';
import { FullDistrict } from '@/lib/types';
import { getCategoryBadge } from '@/lib/utils';
import { CheckCircle2, ChevronRight, MapPin, PlusCircle, Sparkles, Waves } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface DistrictCardProps {
  district: FullDistrict;
  onClick: () => void;
  isAdmin?: boolean;
  onToggleVisited?: (e: React.MouseEvent) => void;
  onQuickAddPlace?: (e: React.MouseEvent) => void;
}

export const DistrictCard: React.FC<DistrictCardProps> = ({
  district,
  onClick,
  isAdmin = false,
  onToggleVisited,
  onQuickAddPlace
}) => {
  return (
    <div
      onClick={onClick}
      className={`group relative rounded-3xl p-4 sm:p-5 border transition-all duration-200 cursor-pointer ${
        district.isVisited
          ? 'bg-gradient-to-br from-[#0c1824] via-[#0d1622] to-[#09141c] border-emerald-500/30 hover:border-emerald-400/60 shadow-lg shadow-emerald-950/20 hover:shadow-emerald-950/40 hover:-translate-y-0.5'
          : 'bg-[#0c1322]/80 hover:bg-[#111a2e] border-white/[0.07] hover:border-white/[0.14] shadow-sm hover:shadow-md hover:-translate-y-0.5'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Status Indicator Icon / Toggle */}
          <button
            type="button"
            onClick={(e) => {
              if (isAdmin && onToggleVisited) {
                e.stopPropagation();
                onToggleVisited(e);
              }
            }}
            disabled={!isAdmin}
            className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
              isAdmin ? 'hover:scale-110 active:scale-95 cursor-pointer' : 'cursor-default'
            } ${
              district.isVisited
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                : 'bg-slate-800/80 text-slate-500 border border-white/[0.08]'
            }`}
            title={isAdmin ? (district.isVisited ? 'Mark Unvisited' : 'Mark Visited') : undefined}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>

          {/* District Name and Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <h4 className="text-base font-black text-white tracking-tight leading-tight group-hover:text-emerald-300 transition-colors truncate">
                {district.nameEn}
              </h4>
              <span className="text-xs font-semibold text-slate-400">
                เขต{district.nameTh}
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap text-xs text-slate-400 font-medium">
              <Badge variant="default" className="text-[10px] px-2 py-0">
                {district.zoneTh}
              </Badge>
              <span>•</span>
              <span className="tabular-nums">{district.areaKm2} km²</span>
              {district.isRiver && (
                <>
                  <span>•</span>
                  <span className="text-sky-400 font-semibold flex items-center gap-0.5 text-[11px]">
                    <Waves className="w-3 h-3" /> River
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Spot Count Pill */}
        <div className="flex flex-col items-end flex-shrink-0">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tabular-nums ${
              district.placeCount > 0
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'bg-[#060913] text-slate-500 border border-white/[0.06]'
            }`}
          >
            {district.placeCount} {district.placeCount === 1 ? 'spot' : 'spots'}
          </span>
        </div>
      </div>

      {/* Visited Spot Tags Preview */}
      {district.visitedPlaces.length > 0 && (
        <div className="mt-3.5 pt-2.5 border-t border-white/[0.06] flex flex-wrap gap-1.5">
          {district.visitedPlaces.slice(0, 3).map((p) => {
            const cat = getCategoryBadge(p.category);
            return (
              <span
                key={p.id}
                className="inline-flex items-center text-[11px] font-medium bg-[#060913]/90 text-slate-200 px-2.5 py-1 rounded-xl border border-white/[0.08]"
              >
                📍 {p.name}
              </span>
            );
          })}
          {district.visitedPlaces.length > 3 && (
            <span className="text-[11px] font-bold text-emerald-400 px-1.5 py-1 tabular-nums">
              +{district.visitedPlaces.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Admin Quick Action Button */}
      {isAdmin && onQuickAddPlace && (
        <div className="mt-2.5 flex items-center justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickAddPlace(e);
            }}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Add Place
          </button>
        </div>
      )}
    </div>
  );
};

