import React, { useState, useMemo } from 'react';
import { FullDistrict, BangkokZone, FilterVisited } from '@/lib/types';
import { DistrictCard } from './DistrictCard';
import { Search, SlidersHorizontal, CheckCircle2, ArrowUpDown, X, MapPin, Camera, Filter } from 'lucide-react';
import { bangkokZones, placeCategories } from '@/lib/districts-data';
import { ImageLightbox, LightboxImageItem } from '../ui/ImageLightbox';

interface DistrictListViewProps {
  districts: FullDistrict[];
  onSelectDistrict: (district: FullDistrict) => void;
  isAdmin?: boolean;
  onToggleVisited?: (district: FullDistrict) => void;
  onQuickAddPlace?: (district: FullDistrict) => void;
}

type SortOption = 'nameAsc' | 'placesDesc' | 'recentlyVisited' | 'areaDesc';

export const DistrictListView: React.FC<DistrictListViewProps> = ({
  districts,
  onSelectDistrict,
  isAdmin = false,
  onToggleVisited,
  onQuickAddPlace
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterVisited, setFilterVisited] = useState<FilterVisited>('all');
  const [filterHasPhotos, setFilterHasPhotos] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('nameAsc');

  // Lightbox state for photo thumbnails
  const [lightboxImages, setLightboxImages] = useState<LightboxImageItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);

  // Helper to extract most recent visit timestamp for sorting
  const getLatestVisitedTimestamp = (d: FullDistrict): number => {
    let maxTime = 0;
    for (const p of d.visitedPlaces) {
      if (p.visitedDate) {
        const time = new Date(p.visitedDate).getTime();
        if (!isNaN(time) && time > maxTime) {
          maxTime = time;
        }
      }
    }
    return maxTime;
  };

  const filteredDistricts = useMemo(() => {
    return districts
      .filter((d) => {
        // Search query matching English, Thai name, code, place name or notes
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName =
            d.nameEn.toLowerCase().includes(q) ||
            d.nameTh.includes(q) ||
            d.code.includes(q);
          const matchPlace = d.visitedPlaces.some(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              (p.notes && p.notes.toLowerCase().includes(q))
          );
          if (!matchName && !matchPlace) return false;
        }

        // Visited status filter
        if (filterVisited === 'visited' && !d.isVisited) return false;
        if (filterVisited === 'unvisited' && d.isVisited) return false;

        // Has Photos filter
        if (filterHasPhotos) {
          const totalPhotos =
            (d.photos?.length || 0) +
            d.visitedPlaces.reduce((acc, p) => acc + (p.photos?.length || 0), 0);
          if (totalPhotos === 0) return false;
        }

        // Category filter
        if (selectedCategory) {
          const hasCat = d.visitedPlaces.some((p) => p.category === selectedCategory);
          if (!hasCat) return false;
        }

        // Bangkok Zone filter
        if (selectedZone && d.zone !== selectedZone) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'placesDesc') {
          return b.placeCount - a.placeCount || a.nameEn.localeCompare(b.nameEn);
        }
        if (sortBy === 'recentlyVisited') {
          const timeA = getLatestVisitedTimestamp(a);
          const timeB = getLatestVisitedTimestamp(b);
          if (timeA !== timeB) return timeB - timeA;
          return a.nameEn.localeCompare(b.nameEn);
        }
        if (sortBy === 'areaDesc') {
          return b.areaKm2 - a.areaKm2;
        }
        return a.nameEn.localeCompare(b.nameEn);
      });
  }, [districts, searchQuery, filterVisited, filterHasPhotos, selectedCategory, selectedZone, sortBy]);

  const visitedCount = districts.filter((d) => d.isVisited).length;
  const unvisitedCount = districts.length - visitedCount;
  const hasPhotosCount = districts.filter(
    (d) => (d.photos?.length || 0) + d.visitedPlaces.reduce((acc, p) => acc + (p.photos?.length || 0), 0) > 0
  ).length;

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    filterVisited !== 'all' ||
    filterHasPhotos ||
    selectedCategory !== null ||
    selectedZone !== null;

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterVisited('all');
    setFilterHasPhotos(false);
    setSelectedCategory(null);
    setSelectedZone(null);
  };

  const handleCardPhotoClick = (
    e: React.MouseEvent,
    photoUrl: string,
    allPhotos: string[],
    district: FullDistrict
  ) => {
    e.stopPropagation();
    const items: LightboxImageItem[] = [];

    // District level photos
    if (district.photos && district.photos.length > 0) {
      district.photos.forEach((url, i) => {
        items.push({
          url,
          title: `${district.nameEn} Album`,
          subtitle: `เขต${district.nameTh} • District Photo ${i + 1}`
        });
      });
    }

    // Visited place photos
    district.visitedPlaces.forEach((place) => {
      if (place.photos && place.photos.length > 0) {
        place.photos.forEach((url) => {
          items.push({
            url,
            title: place.name,
            subtitle: `${district.nameEn} (เขต${district.nameTh})`,
            category: place.category,
            date: place.visitedDate
          });
        });
      }
    });

    const foundIndex = items.findIndex((it) => it.url === photoUrl);
    setLightboxImages(items.length > 0 ? items : allPhotos.map((url) => ({ url, title: district.nameEn })));
    setLightboxIndex(foundIndex >= 0 ? foundIndex : 0);
    setIsLightboxOpen(true);
  };

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

        {/* Filter Tabs, Category, Photos & Sort Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5">
          <div className="flex flex-wrap items-center gap-2">
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

            {/* Has Photos Toggle Chip */}
            <button
              type="button"
              onClick={() => setFilterHasPhotos((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer border ${
                filterHasPhotos
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/25'
                  : 'bg-[#060913]/90 text-slate-400 border-white/[0.06] hover:text-white hover:border-white/[0.12]'
              }`}
              title="Filter districts with photos"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Has Photos</span>
              <span className="text-[10px] opacity-80 tabular-nums">({hasPhotosCount})</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter Dropdown */}
            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="bg-[#060913] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
              >
                <option value="">All Categories</option>
                {placeCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
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
                <option value="recentlyVisited">Recently Visited</option>
                <option value="areaDesc">Largest Area</option>
              </select>
            </div>
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
        {hasActiveFilters && (
          <button
            onClick={handleResetFilters}
            className="text-emerald-400 font-semibold hover:underline cursor-pointer"
          >
            Reset Filters
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
            Try adjusting your search keywords or switching category/zone/visited filters.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-4 px-4 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-emerald-400 transition-colors cursor-pointer"
          >
            Reset All Filters
          </button>
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
              onPhotoClick={(e, photoUrl, allPhotos) =>
                handleCardPhotoClick(e, photoUrl, allPhotos, district)
              }
            />
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
      />
    </div>
  );
};

