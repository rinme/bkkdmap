import React, { useState, useMemo } from 'react';
import { FullDistrict, BangkokZone, FilterVisited } from '@/lib/types';
import { DistrictCard } from './DistrictCard';
import { Search, SlidersHorizontal, CheckCircle2, ArrowUpDown, X } from 'lucide-react';
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
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search district (e.g. Siam, Phra Nakhon, ปทุมวัน) or spot..."
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Tabs & Sort Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          {/* Visited Filter Segmented Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <button
              onClick={() => setFilterVisited('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterVisited === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({districts.length})
            </button>
            <button
              onClick={() => setFilterVisited('visited')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterVisited === 'visited'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'hover:text-emerald-600 dark:hover:text-emerald-400'
              }`}
            >
              Visited ({visitedCount})
            </button>
            <button
              onClick={() => setFilterVisited('unvisited')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterVisited === 'unvisited'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Unvisited ({unvisitedCount})
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
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
            className={`px-3 py-1 text-xs rounded-full font-medium whitespace-nowrap transition-all ${
              selectedZone === null
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            All Zones
          </button>
          {bangkokZones.map((z) => (
            <button
              key={z.id}
              onClick={() => setSelectedZone(selectedZone === z.id ? null : z.id)}
              className={`px-3 py-1 text-xs rounded-full font-medium whitespace-nowrap transition-all border ${
                selectedZone === z.id
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-400 font-bold shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
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
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>
          Showing <b>{filteredDistricts.length}</b> of {districts.length} districts
        </span>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
          >
            Clear Search
          </button>
        )}
      </div>

      {/* District Cards Grid */}
      {filteredDistricts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
          <Search className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No districts match your filter
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search keywords or switching filters.
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
