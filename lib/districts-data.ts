import rawData from '../data/bangkok-districts.json';
import {
  DistrictMeta,
  DistrictUserData,
  FullDistrict,
  MapDataset,
  PlaceCategory,
  TrackerState,
  TrackerStats,
  ZoneProgress,
  ExplorerRank
} from './types';

export const mapDataset = rawData as unknown as MapDataset;

export const bangkokDistrictsMeta: DistrictMeta[] = mapDataset.districts;

export const bangkokZones = mapDataset.zones;

export const placeCategories: { id: PlaceCategory; label: string; icon: string; color: string }[] = [
  { id: 'Mall', label: 'Mall & Shopping', icon: 'ShoppingBag', color: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800' },
  { id: 'Temple', label: 'Temple & Shrine', icon: 'Landmark', color: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800' },
  { id: 'Cafe', label: 'Cafe & Bakery', icon: 'Coffee', color: 'bg-amber-700/10 text-amber-800 border-amber-300 dark:border-amber-700' },
  { id: 'Food', label: 'Street Food & Dining', icon: 'Utensils', color: 'bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-800' },
  { id: 'Park', label: 'Park & Nature', icon: 'Trees', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800' },
  { id: 'Culture', label: 'Culture & Art', icon: 'Palette', color: 'bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800' },
  { id: 'Landmark', label: 'Sight & Landmark', icon: 'Camera', color: 'bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-800' },
  { id: 'Market', label: 'Market & Bazaar', icon: 'Store', color: 'bg-yellow-500/10 text-yellow-700 border-yellow-200 dark:border-yellow-800' },
  { id: 'Nightlife', label: 'Nightlife & Bar', icon: 'Moon', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200 dark:border-indigo-800' },
  { id: 'Transit', label: 'Transit & Pier', icon: 'Train', color: 'bg-cyan-500/10 text-cyan-600 border-cyan-200 dark:border-cyan-800' },
  { id: 'Other', label: 'Other', icon: 'MapPin', color: 'bg-slate-500/10 text-slate-600 border-slate-200 dark:border-slate-800' }
];

export function mergeDistrictState(
  metaList: DistrictMeta[],
  state: TrackerState
): FullDistrict[] {
  return metaList.map((meta) => {
    const userData: DistrictUserData = state.districts[meta.id] || {
      isVisited: false,
      visitedPlaces: []
    };

    const visitedPlaces = userData.visitedPlaces || [];
    // Auto-computed as visited if it has places, or if explicitly marked visited
    const isVisited = visitedPlaces.length > 0 || !!userData.isVisited;

    return {
      ...meta,
      ...userData,
      isVisited,
      visitedPlaces,
      placeCount: visitedPlaces.length
    };
  });
}

export function computeExplorerRank(visitedCount: number): ExplorerRank {
  if (visitedCount >= 50) {
    return {
      titleEn: 'Bangkok Master',
      titleTh: 'มหาเซียน 50 เขตกรุงเทพฯ',
      badge: '👑',
      level: 5,
      description: 'Conquered every single corner and district of Bangkok!'
    };
  }
  if (visitedCount >= 35) {
    return {
      titleEn: 'Bangkok Connoisseur',
      titleTh: 'ผู้ชำนาญการกรุงเทพฯ',
      badge: '💎',
      level: 4,
      description: 'Remarkable explorer with deep knowledge across town.'
    };
  }
  if (visitedCount >= 20) {
    return {
      titleEn: 'Urban Wanderer',
      titleTh: 'นักผจญภัยเมืองกรุง',
      badge: '🥇',
      level: 3,
      description: 'Well-traveled across both riverbanks and inner city.'
    };
  }
  if (visitedCount >= 10) {
    return {
      titleEn: 'City Explorer',
      titleTh: 'นักสำรวจพระนคร',
      badge: '🥈',
      level: 2,
      description: 'Getting familiar with Bangkok’s diverse neighborhoods.'
    };
  }
  return {
    titleEn: 'Bangkok Newcomer',
    titleTh: 'ผู้มาเยือนหน้าใหม่',
    badge: '🥉',
    level: 1,
    description: 'Starting the adventure through the 50 districts of Bangkok!'
  };
}

export function calculateTrackerStats(fullDistricts: FullDistrict[]): TrackerStats {
  const totalDistricts = fullDistricts.length;
  const visitedDistricts = fullDistricts.filter((d) => d.isVisited).length;
  const visitedPercentage = totalDistricts > 0 ? Math.round((visitedDistricts / totalDistricts) * 100) : 0;

  let totalPlaces = 0;
  const categoryCounts: Record<string, number> = {};

  // Initialize categories
  placeCategories.forEach((cat) => {
    categoryCounts[cat.id] = 0;
  });

  // Calculate zone stats
  const zoneStats: Record<string, ZoneProgress> = {};
  bangkokZones.forEach((z) => {
    zoneStats[z.id] = {
      id: z.id,
      nameEn: z.nameEn,
      nameTh: z.nameTh,
      color: z.color,
      total: 0,
      visited: 0,
      percentage: 0
    };
  });

  fullDistricts.forEach((d) => {
    // Zone
    if (zoneStats[d.zone]) {
      zoneStats[d.zone].total += 1;
      if (d.isVisited) {
        zoneStats[d.zone].visited += 1;
      }
    }

    // Places & Categories
    d.visitedPlaces.forEach((p) => {
      totalPlaces += 1;
      const cat = p.category || 'Other';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
  });

  // Compute percentages
  Object.keys(zoneStats).forEach((zKey) => {
    const z = zoneStats[zKey];
    z.percentage = z.total > 0 ? Math.round((z.visited / z.total) * 100) : 0;
  });

  const explorerRank = computeExplorerRank(visitedDistricts);

  return {
    totalDistricts,
    visitedDistricts,
    visitedPercentage,
    totalPlaces,
    categoryCounts,
    zoneStats,
    explorerRank
  };
}
