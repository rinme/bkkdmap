import React, { useState, useMemo } from 'react';
import { FullDistrict, BangkokZone, FilterVisited } from '@/lib/types';
import { DistrictCard } from './DistrictCard';
import { Search, SlidersHorizontal, CheckCircle2, ArrowUpDown, X, MapPin } from 'lucide-react';
import { bangkokZones } from '@/lib/districts-data';

interface DistrictListViewProps {
  districts: FullDistrict[];
  onSelectDistrict: (district: FullDistrict) => void;
  isAdmin?: boolean;
  onToggleVisited?: (district: FullDistrict) => void;
  onQuickAddPlace?: (district: FullDistrict) => void;
}

type SortOption = 'nameAsc' | 'placesDesc' | 'areaDesc';

export const DistrictListView: React.FC<DistrictListViewProps> = ({
  districts,
  onSelectDistrict,
  isAdmin = false,
  onToggleVisited,
  onQuickAddPlace
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterVisited, setFilterVisited] = useState<FilterVisited>('all');
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('nameAsc');

  const filteredDistricts = useMemo(() => {
    return districts
      .filter((d) => {
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName =
            d.nameEn.toLowerCase().includes(q) ||
            d.nameTh.includes(q) ||
            d.code.includes(q);
          const matchPlace = d.visitedPlaces.some((p) => p.name.toLowerCase().includes(q));
          if (!matchName && !matchPlace) return false;
        }

        // Visited
        if (filterVisited === 'visited' && !d.isVisited) return false;
        if (filterVisited === 'unvisited' && d.isVisited) return false;

        // Zone
        if (selectedZone && d.zone !== selectedZone) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'placesDesc') {
          return b.placeCount - a.placeCount || a.nameEn.localeCompare(b.nameEn);
        }
        if (sortBy === 'areaDesc') {
          return b.areaKm2 - a.areaKm2;
        }
        return a.nameEn.localeCompare(b.nameEn);
      });
  }, [districts, searchQuery, filterVisited, selectedZone, sortBy]);

  const visitedCount = districts.filter((d) => d.isVisited).length;
  const unvisitedCount = districts.length - visitedCount;

  return (
    <div className="w-full space-y-4">
      {/* Search and Filters Bar */}
      <div className="glass-panel rounded-3xl p-4 sm:p-5 border border-white/[0.08] shadow-xl space-y-3.5 bg-[#0c1322]/90">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 50 districts (e.g. Siam, Phra Nakhon, ปทุมวัน) or spot..."
            className="w-full pl-10 pr-9 py-2.5 bg-[#060913]/80 border border-white/[0.08] rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/80 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Tabs & Sort Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5">
          {/* Visited Filter Segmented Tabs */}
          <div className="flex items-center bg-[#060913]/90 rounded-2xl p-1 text-xs font-bold text-slate-400 border border-white/[0.06]">
            <button
              onClick={() => setFilterVisited('all')}
              className={`px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer ${
                filterVisited === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              All <span className="text-[10px] opacity-70 tabular-nums">({districts.length})</span>
            </button>
            <button
              onClick={() => setFilterVisited('visited')}
              className={`px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer ${
                filterVisited === 'visited'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25 font-bold'
                  : 'hover:text-emerald-300 hover:bg-white/[0.04]'
              }`}
            >
              Visited <span className="text-[10px] opacity-80 tabular-nums">({visitedCount})</span>
            </button>
            <button
              onClick={() => setFilterVisited('unvisited')}
              className={`px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer ${
                filterVisited === 'unvisited'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              Unvisited <span className="text-[10px] opacity-70 tabular-nums">({unvisitedCount})</span>
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-[#060913] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
            >
              <option value="nameAsc">Name (A → Z)</option>
              <option value="placesDesc">Most Spots Visited</option>
              <option value="areaDesc">Largest Area</option>
            </select>
          </div>
        </div>

        {/* Zone Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1">
          <button
            onClick={() => setSelectedZone(null)}
            className={`px-3 py-1 text-xs rounded-full font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
              selectedZone === null
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                : 'bg-[#060913] text-slate-400 border border-white/[0.06] hover:text-white hover:border-white/[0.12]'
            }`}
          >
            All Zones
          </button>
          {bangkokZones.map((z) => (
            <button
              key={z.id}
              onClick={() => setSelectedZone(selectedZone === z.id ? null : z.id)}
              className={`px-3 py-1 text-xs rounded-full font-medium whitespace-nowrap transition-all duration-200 border cursor-pointer ${
                selectedZone === z.id
                  ? 'bg-white text-slate-950 font-bold shadow-md border-white'
                  : 'bg-[#060913]/70 text-slate-400 border-white/[0.06] hover:border-white/[0.15] hover:text-white'
              }`}
            >
              <span
                className="inline-block w-2 h-2 rounded-full mr-1.5"
                style={{ backgroundColor: z.color }}
              />
              {z.nameTh} ({z.nameEn})
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Showing <b className="text-white tabular-nums">{filteredDistricts.length}</b> of {districts.length} districts
        </span>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-emerald-400 font-semibold hover:underline cursor-pointer"
          >
            Clear Search
          </button>
        )}
      </div>

      {/* District Cards Grid */}
      {filteredDistricts.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-white/[0.08] bg-[#0c1322]/80">
          <Search className="w-10 h-10 mx-auto text-slate-500 mb-3" />
          <h4 className="text-base font-bold text-white">
            No districts match your filter
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Try adjusting your search keywords or switching zone/visited filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredDistricts.map((district) => (
            <DistrictCard
              key={district.id}
              district={district}
              onClick={() => onSelectDistrict(district)}
              isAdmin={isAdmin}
              onToggleVisited={() => onToggleVisited && onToggleVisited(district)}
              onQuickAddPlace={() => onQuickAddPlace && onQuickAddPlace(district)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

