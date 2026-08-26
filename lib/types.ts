export type PlaceCategory =
  | 'Mall'
  | 'Temple'
  | 'Cafe'
  | 'Park'
  | 'Food'
  | 'Culture'
  | 'Landmark'
  | 'Market'
  | 'Nightlife'
  | 'Transit'
  | 'Other';

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  visitedDate?: string; // YYYY-MM-DD
  notes?: string;
  photos?: string[];
}

export interface DistrictMeta {
  id: string;
  code: string;
  nameEn: string;
  nameTh: string;
  zone: string;
  zoneTh: string;
  centerGeo: [number, number]; // [lon, lat]
  centerSvg: { x: number; y: number };
  areaKm2: number;
  isRiver: boolean;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  svgPath: string;
  popularLandmarks: string[];
}

export interface DistrictUserData {
  isVisited: boolean;
  generalNotes?: string;
  photos?: string[];
  visitedPlaces: Place[];
}

export interface AppSettings {
  maxImageSizeKb: number;       // Default: 1024 (1 MB)
  maxImageDimension: number;   // Default: 1920 (px)
  imageQuality: number;        // Default: 80 (%)
  autoCompress: boolean;       // Default: true
  allowedMimeTypes: string[];  // Default: ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  maxImageSizeKb: 1024,
  maxImageDimension: 1920,
  imageQuality: 80,
  autoCompress: true,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
};

export interface FullDistrict extends DistrictMeta, DistrictUserData {
  placeCount: number;
}

export interface BangkokZone {
  id: string;
  nameEn: string;
  nameTh: string;
  color: string;
}

export interface MapDataset {
  scope: string;
  titleEn: string;
  titleTh: string;
  viewBox: string;
  totalDistricts: number;
  zones: BangkokZone[];
  chaoPhrayaRiverSvgPath: string;
  districts: DistrictMeta[];
}

export interface TrackerState {
  version: string;
  lastUpdated: string;
  districts: Record<string, DistrictUserData>;
}

export interface ZoneProgress {
  id: string;
  nameEn: string;
  nameTh: string;
  color: string;
  total: number;
  visited: number;
  percentage: number;
}

export interface ExplorerRank {
  titleEn: string;
  titleTh: string;
  badge: string;
  level: number;
  description: string;
}

export interface TrackerStats {
  totalDistricts: number;
  visitedDistricts: number;
  visitedPercentage: number;
  totalPlaces: number;
  categoryCounts: Record<string, number>;
  zoneStats: Record<string, ZoneProgress>;
  explorerRank: ExplorerRank;
}

export interface AuthSession {
  authenticated: boolean;
  role: 'admin' | 'guest';
  expiresAt?: number;
}

export type ViewMode = 'map' | 'list' | 'stats';
export type FilterVisited = 'all' | 'visited' | 'unvisited';
