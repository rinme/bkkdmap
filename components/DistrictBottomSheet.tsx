import React from 'react';
import { FullDistrict, Place } from '@/lib/types';
import { formatDate, getCategoryBadge } from '@/lib/utils';
import {
  MapPin,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Share2,
  PlusCircle,
  X,
  Compass,
  FileText,
  Sparkles
} from 'lucide-react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

interface DistrictBottomSheetProps {
  district: FullDistrict | null;
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  onOpenAdminPlaceModal?: (district: FullDistrict) => void;
  onToggleVisited?: (district: FullDistrict) => void;
}

export const DistrictBottomSheet: React.FC<DistrictBottomSheetProps> = ({
  district,
  isOpen,
  onClose,
  isAdmin = false,
  onOpenAdminPlaceModal,
  onToggleVisited
}) => {
  if (!isOpen || !district) return null;

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${district.nameEn} District Bangkok Thailand`
  )}`;

  const handleShareDistrict = () => {
    const text = `Explored ${district.nameEn} (${district.nameTh}) in Bangkok! ${
      district.isVisited
        ? `Logged ${district.placeCount} spot(s): ${district.visitedPlaces.map((p) => p.name).join(', ')}`
        : 'On my Bangkok wishlist!'
    } #Bangkok50Districts`;

    if (navigator.share) {
      navigator.share({
        title: `${district.nameEn} — Bangkok 50 Districts Tracker`,
        text,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      alert('District summary copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-full sm:max-w-lg max-h-[85vh] sm:max-h-[80vh] bg-white dark:bg-slate-900 rounded-t-[32px] sm:rounded-3xl shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-slide-up z-10">
        {/* Mobile Pull Handle Indicator */}
        <div className="pt-3 pb-1 flex justify-center sm:hidden">
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  district.isVisited
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {district.isVisited ? 'Visited / เคยไปแล้ว' : 'Unvisited / ยังไม่เคยไป'}
              </span>
              <Badge variant="default" className="text-[11px]">
                {district.zoneTh} ({district.zone})
              </Badge>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {district.nameEn}
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              เขต{district.nameTh} • รหัส {district.code} • พื้นที่ {district.areaKm2} ตร.กม.
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close district drawer"
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Summary / Counter Card */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Logged Places</span>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {district.placeCount} {district.placeCount === 1 ? 'Spot' : 'Spots'}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">River Boundary</span>
              <p className="text-base font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {district.isRiver ? '🌊 Chao Phraya' : '🏙️ Inland'}
              </p>
            </div>
          </div>

          {/* District General Notes (if any) */}
          {district.generalNotes && (
            <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/60 rounded-2xl p-3.5 text-xs text-amber-900 dark:text-amber-200 flex gap-2.5 items-start">
              <FileText className="w-4 h-4 mt-0.5 text-amber-600 flex-shrink-0" />
              <p className="leading-relaxed">{district.generalNotes}</p>
            </div>
          )}

          {/* Visited Places List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-emerald-500" />
                Visited Places ({district.visitedPlaces.length})
              </h3>
              {isAdmin && onOpenAdminPlaceModal && (
                <button
                  onClick={() => onOpenAdminPlaceModal(district)}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Add Place
                </button>
              )}
            </div>

            {district.visitedPlaces.length === 0 ? (
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-6 text-center border border-dashed border-slate-200 dark:border-slate-700">
                <MapPin className="w-8 h-8 mx-auto text-slate-400 mb-2 stroke-1" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  No specific spots logged yet in {district.nameEn}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {isAdmin
                    ? 'Tap below to add your first landmark or cafe!'
                    : 'Check out the popular district landmarks below for ideas.'}
                </p>
                {isAdmin && onOpenAdminPlaceModal && (
                  <Button
                    size="sm"
                    variant="primary"
                    className="mt-3.5"
                    onClick={() => onOpenAdminPlaceModal(district)}
                  >
                    <PlusCircle className="w-4 h-4 mr-1.5" />
                    Log First Place
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {district.visitedPlaces.map((place) => {
                  const cat = getCategoryBadge(place.category);
                  return (
                    <div
                      key={place.id}
                      className="bg-white dark:bg-slate-800/90 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-600"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                              {place.name}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${cat.color}`}
                            >
                              {cat.label}
                            </span>
                          </div>

                          {place.notes && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                              {place.notes}
                            </p>
                          )}
                        </div>

                        {place.visitedDate && (
                          <div className="flex items-center text-[11px] text-slate-400 gap-1 flex-shrink-0">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(place.visitedDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Popular Landmark Suggestions in this District */}
          {district.popularLandmarks && district.popularLandmarks.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Popular District Highlights & Landmarks
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {district.popularLandmarks.map((lm, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60"
                  >
                    📍 {lm}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Action Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2.5 pb-[max(14px,env(safe-area-inset-bottom))]">
          {isAdmin && onToggleVisited && (
            <Button
              variant={district.isVisited ? 'outline' : 'success'}
              size="md"
              className="flex-1 text-xs sm:text-sm"
              onClick={() => onToggleVisited(district)}
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              {district.isVisited ? 'Mark Unvisited' : 'Mark Visited'}
            </Button>
          )}

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-4 py-2 text-xs sm:text-sm font-medium rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all flex-1"
          >
            <ExternalLink className="w-4 h-4 mr-1.5" />
            Google Maps
          </a>

          <Button
            variant="secondary"
            size="md"
            className="px-3"
            onClick={handleShareDistrict}
            title="Share District"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
