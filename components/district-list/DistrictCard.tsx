import React from 'react';
import { FullDistrict } from '@/lib/types';
import { getCategoryBadge } from '@/lib/utils';
import { CheckCircle2, ChevronRight, MapPin, PlusCircle, Sparkles } from 'lucide-react';
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
      className={`group relative bg-white dark:bg-slate-850 rounded-2xl p-4 border transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md ${
        district.isVisited
          ? 'border-emerald-200/90 dark:border-emerald-900/60 hover:border-emerald-400 dark:hover:border-emerald-700 bg-emerald-50/20 dark:bg-emerald-950/10'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
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
            className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-transform ${
              isAdmin ? 'hover:scale-110 active:scale-95 cursor-pointer' : 'cursor-default'
            } ${
              district.isVisited
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 border border-slate-300 dark:border-slate-700'
            }`}
            title={isAdmin ? (district.isVisited ? 'Mark Unvisited' : 'Mark Visited') : undefined}
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>

          {/* District Name and Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">
                {district.nameEn}
              </h4>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                ({district.nameTh})
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-slate-500 dark:text-slate-400">
              <Badge variant="default" className="text-[10px] px-2 py-0">
                {district.zoneTh}
              </Badge>
              <span>•</span>
              <span>{district.areaKm2} km²</span>
              {district.isRiver && (
                <>
                  <span>•</span>
                  <span className="text-sky-500 dark:text-sky-400 font-medium">🌊 River</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Spot Count Pill */}
        <div className="flex flex-col items-end flex-shrink-0">
          <span
            className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
              district.placeCount > 0
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}
          >
            {district.placeCount} {district.placeCount === 1 ? 'spot' : 'spots'}
          </span>
        </div>
      </div>

      {/* Visited Spot Tags Preview */}
      {district.visitedPlaces.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-1.5">
          {district.visitedPlaces.slice(0, 3).map((p) => {
            const cat = getCategoryBadge(p.category);
            return (
              <span
                key={p.id}
                className="inline-flex items-center text-[11px] font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80"
              >
                📍 {p.name}
              </span>
            );
          })}
          {district.visitedPlaces.length > 3 && (
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 px-1 py-0.5">
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
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1 hover:underline"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Add Place
          </button>
        </div>
      )}
    </div>
  );
};
