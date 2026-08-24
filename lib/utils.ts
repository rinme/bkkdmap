import { PlaceCategory, FullDistrict } from './types';
import { placeCategories, bangkokZones } from './districts-data';

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(dateStr?: string, locale: 'en' | 'th' = 'en'): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    if (locale === 'th') {
      const thaiMonths = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
      ];
      return `${d.getDate()} ${thaiMonths[d.getMonth()]} ${d.getFullYear() + 543}`;
    }
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export function getCategoryBadge(category: PlaceCategory) {
  const found = placeCategories.find((c) => c.id === category);
  return (
    found || {
      id: 'Other' as PlaceCategory,
      label: category || 'Other',
      icon: 'MapPin',
      color: 'bg-slate-500/10 text-slate-600 border-slate-200 dark:border-slate-800'
    }
  );
}

export function getZoneDetails(zoneId: string) {
  return bangkokZones.find((z) => z.id === zoneId) || {
    id: zoneId,
    nameEn: zoneId,
    nameTh: zoneId,
    color: '#64748b'
  };
}

export function getDistrictFillColor(
  district: FullDistrict,
  isDarkMode = false,
  isHovered = false,
  isSelected = false
): string {
  if (isSelected) {
    return '#3b82f6'; // Bright blue for selected
  }

  if (district.isVisited) {
    if (isHovered) return '#16a34a'; // Vibrant dark green
    return '#22c55e'; // Vibrant standard green
  }

  // Unvisited
  if (isDarkMode) {
    return isHovered ? '#475569' : '#334155';
  }
  return isHovered ? '#cbd5e1' : '#e2e8f0';
}
