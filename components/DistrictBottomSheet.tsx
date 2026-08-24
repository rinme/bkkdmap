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
  Sparkles,
  Waves
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
        className="fixed inset-0 bg-[#060913]/80 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-full sm:max-w-lg max-h-[88vh] sm:max-h-[82vh] bg-[#0c1322]/95 backdrop-blur-2xl rounded-t-[32px] sm:rounded-3xl shadow-2xl border-t sm:border border-white/[0.1] flex flex-col overflow-hidden animate-slide-up z-10">
        {/* Mobile Pull Handle Indicator */}
        <div className="pt-3 pb-1 flex justify-center sm:hidden">
          <div className="w-12 h-1.5 rounded-full bg-slate-700/80" />
        </div>

        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-white/[0.07] flex items-start justify-between bg-white/[0.02]">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  district.isVisited
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 border border-white/[0.08]'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {district.isVisited ? 'Visited / เคยไปแล้ว' : 'Unvisited / ยังไม่เคยไป'}
              </span>
              <Badge variant="default" className="text-[11px]">
                {district.zoneTh} ({district.zone})
              </Badge>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight leading-tight">
              {district.nameEn}
            </h2>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              เขต{district.nameTh} • รหัส {district.code} • พื้นที่ <span className="tabular-nums">{district.areaKm2}</span> ตร.กม.
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close district drawer"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Summary / Counter Card */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#060913]/80 rounded-2xl p-4 border border-white/[0.07]">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Logged Spots</span>
              <p className="text-2xl font-black text-emerald-400 mt-0.5 tabular-nums">
                {district.placeCount} <span className="text-xs text-slate-400 font-semibold">{district.placeCount === 1 ? 'Spot' : 'Spots'}</span>
              </p>
            </div>
            <div className="bg-[#060913]/80 rounded-2xl p-4 border border-white/[0.07]">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">River Status</span>
              <p className="text-base font-bold text-white mt-1 flex items-center gap-1.5">
                {district.isRiver ? (
                  <span className="text-sky-400 flex items-center gap-1">
                    <Waves className="w-4 h-4" /> Chao Phraya
                  </span>
                ) : (
                  <span>🏙️ Inland</span>
                )}
              </p>
            </div>
          </div>

          {/* District General Notes (if any) */}
          {district.generalNotes && (
            <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 text-xs text-amber-200 flex gap-2.5 items-start">
              <FileText className="w-4 h-4 mt-0.5 text-amber-400 flex-shrink-0" />
              <p className="leading-relaxed">{district.generalNotes}</p>
            </div>
          )}

          {/* Visited Places List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-emerald-400" />
                Visited Spots ({district.visitedPlaces.length})
              </h3>
              {isAdmin && onOpenAdminPlaceModal && (
                <button
                  onClick={() => onOpenAdminPlaceModal(district)}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Add Spot
                </button>
              )}
            </div>

            {district.visitedPlaces.length === 0 ? (
              <div className="bg-[#060913]/60 rounded-2xl p-6 text-center border border-dashed border-white/[0.1]">
                <MapPin className="w-8 h-8 mx-auto text-slate-500 mb-2 stroke-1" />
                <p className="text-xs sm:text-sm font-semibold text-slate-300">
                  No spots logged yet in {district.nameEn}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {isAdmin
                    ? 'Tap below to add your first landmark or spot!'
                    : 'Check out the popular district highlights below for travel ideas.'}
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
                      className="bg-[#060913]/80 rounded-2xl p-3.5 border border-white/[0.07] shadow-sm transition-all hover:border-white/[0.14]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-white">
                              {place.name}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${cat.color}`}
                            >
                              {cat.label}
                            </span>
                          </div>

                          {place.notes && (
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {place.notes}
                            </p>
                          )}
                        </div>

                        {place.visitedDate && (
                          <div className="flex items-center text-[11px] text-slate-400 gap-1 flex-shrink-0 tabular-nums font-medium">
                            <Calendar className="w-3 h-3 text-slate-500" />
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
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Popular Highlights & Landmarks
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {district.popularLandmarks.map((lm, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center text-xs bg-[#060913] text-slate-300 px-3 py-1 rounded-xl border border-white/[0.08]"
                  >
                    📍 {lm}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Action Footer */}
        <div className="px-6 py-3.5 bg-[#080d1a] border-t border-white/[0.07] flex items-center gap-2.5 pb-[max(14px,env(safe-area-inset-bottom))]">
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
            className="inline-flex items-center justify-center px-4 py-2 text-xs sm:text-sm font-semibold rounded-2xl border border-slate-700/80 hover:border-slate-500 hover:bg-white/[0.06] text-white transition-all flex-1"
          >
            <ExternalLink className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            Google Maps
          </a>

          <Button
            variant="secondary"
            size="md"
            className="px-3.5"
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

