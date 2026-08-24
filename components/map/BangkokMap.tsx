import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FullDistrict, BangkokZone, FilterVisited } from '@/lib/types';
import { mapDataset } from '@/lib/districts-data';
import { MapControls } from './MapControls';
import { CheckCircle2, Sparkles, Navigation2, MapPin, Eye } from 'lucide-react';

interface BangkokMapProps {
  districts: FullDistrict[];
  selectedDistrict: FullDistrict | null;
  onSelectDistrict: (district: FullDistrict) => void;
  searchQuery?: string;
  filterVisited?: FilterVisited;
  selectedZone?: string | null;
}

export const BangkokMap: React.FC<BangkokMapProps> = ({
  districts,
  selectedDistrict,
  onSelectDistrict,
  searchQuery = '',
  filterVisited = 'all',
  selectedZone = null
}) => {
  // Transform State for Pan & Zoom
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredDistrict, setHoveredDistrict] = useState<FullDistrict | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [currentFilterVisited, setCurrentFilterVisited] = useState<FilterVisited>(filterVisited);
  const [currentZone, setCurrentZone] = useState<string | null>(selectedZone);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartDistRef = useRef<number | null>(null);

  // Sync props to internal state
  useEffect(() => {
    setCurrentFilterVisited(filterVisited);
  }, [filterVisited]);

  useEffect(() => {
    setCurrentZone(selectedZone);
  }, [selectedZone]);

  // Center on selected district if provided
  useEffect(() => {
    if (selectedDistrict) {
      const targetX = selectedDistrict.centerSvg.x;
      const targetY = selectedDistrict.centerSvg.y;
      // Smoothly pan towards center
      const svgWidth = 1000;
      const svgHeight = 800;
      const newScale = Math.max(scale, 1.6);
      setScale(newScale);
      setPosition({
        x: (svgWidth / 2 - targetX) * newScale,
        y: (svgHeight / 2 - targetY) * newScale
      });
    }
  }, [selectedDistrict?.id]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev * 1.35, 5.0));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev / 1.35, 0.75));
  }, []);

  const handleReset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.88;
    setScale((prev) => Math.min(Math.max(prev * zoomFactor, 0.75), 5.0));
  };

  // Mouse Drag / Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only pan on primary button
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
    // Update tooltip position
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile pan and pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    } else if (e.touches.length === 2) {
      // Pinch gesture
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    } else if (e.touches.length === 2 && touchStartDistRef.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchStartDistRef.current;
      setScale((prev) => Math.min(Math.max(prev * factor, 0.75), 5.0));
      touchStartDistRef.current = dist;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartDistRef.current = null;
  };

  // Filter districts based on query & filter states
  const isDistrictMatchingSearch = (d: FullDistrict) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      d.nameEn.toLowerCase().includes(q) ||
      d.nameTh.includes(q) ||
      d.code.includes(q) ||
      d.visitedPlaces.some((p) => p.name.toLowerCase().includes(q))
    );
  };

  const isDistrictVisible = (d: FullDistrict) => {
    // 1. Visited filter
    if (currentFilterVisited === 'visited' && !d.isVisited) return false;
    if (currentFilterVisited === 'unvisited' && d.isVisited) return false;

    // 2. Zone filter
    if (currentZone && d.zone !== currentZone) return false;

    return true;
  };

  const visitedCount = districts.filter((d) => d.isVisited).length;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[65vh] min-h-[480px] max-h-[740px] bg-gradient-to-b from-[#0a0f1d] via-[#090d18] to-[#060913] rounded-3xl overflow-hidden shadow-2xl border border-white/[0.08] touch-none select-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Ambient Central Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Subtle Coordinate Grid Pattern */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.18) 1px, transparent 0)',
          backgroundSize: '28px 28px'
        }}
      />

      {/* Floating Map Controls */}
      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
        zones={mapDataset.zones}
        selectedZone={currentZone}
        onSelectZone={setCurrentZone}
        filterVisited={currentFilterVisited}
        onFilterVisitedChange={setCurrentFilterVisited}
        showLabels={showLabels}
        onToggleLabels={() => setShowLabels(!showLabels)}
      />

      {/* Zone Quick Filter Pill Bar */}
      <div className="absolute top-3.5 left-3.5 z-20 flex flex-wrap items-center gap-1.5 max-w-[calc(100%-90px)] pointer-events-auto">
        <button
          onClick={() => setCurrentZone(null)}
          className={`px-3 py-1 text-xs rounded-full font-bold transition-all duration-200 backdrop-blur-md cursor-pointer ${
            currentZone === null
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
              : 'bg-[#0f172a]/80 hover:bg-[#1e293b]/80 text-slate-300 border border-white/[0.08]'
          }`}
        >
          All 50 Districts
        </button>
        {mapDataset.zones.map((zone) => (
          <button
            key={zone.id}
            onClick={() => setCurrentZone(currentZone === zone.id ? null : zone.id)}
            className={`px-2.5 py-0.5 text-xs rounded-full font-semibold transition-all duration-200 backdrop-blur-md border cursor-pointer ${
              currentZone === zone.id
                ? 'bg-white text-slate-950 font-bold shadow-md border-white'
                : 'bg-[#0f172a]/70 hover:bg-[#1e293b]/70 text-slate-300 border-white/[0.06]'
            }`}
          >
            <span
              className="inline-block w-2 h-2 rounded-full mr-1.5"
              style={{ backgroundColor: zone.color }}
            />
            {zone.nameTh}
          </button>
        ))}
      </div>

      {/* Interactive SVG Viewport */}
      <svg
        viewBox="0 0 1000 800"
        className="w-full h-full cursor-grab active:cursor-grabbing transition-transform duration-75"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: '500px 400px'
        }}
      >
        <defs>
          {/* Selected District Glow */}
          <filter id="selectedGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Chao Phraya River Gradient */}
          <linearGradient id="riverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#0284c7" stopOpacity="1" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.9" />
          </linearGradient>

          {/* Visited District Vibrant Emerald Gradient */}
          <linearGradient id="visitedDistrictGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="60%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          {/* Visited District Hover Gradient */}
          <linearGradient id="visitedHoverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>

          {/* Active Highlight Gradient */}
          <linearGradient id="activeDistrictGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>

        {/* 1. Districts Background Layer */}
        <g id="districts-layer">
          {districts.map((district) => {
            const isSelected = selectedDistrict?.id === district.id;
            const isHovered = hoveredDistrict?.id === district.id;
            const isMatch = isDistrictMatchingSearch(district);
            const isVisible = isDistrictVisible(district);

            let fill = district.isVisited ? 'url(#visitedDistrictGradient)' : '#141c2e';
            let stroke = district.isVisited ? '#6ee7b7' : '#2d3b55';
            let strokeWidth = 1.2;
            let opacity = 1;

            if (!isVisible || !isMatch) {
              opacity = 0.2;
            }

            if (isSelected) {
              fill = 'url(#activeDistrictGradient)';
              stroke = '#93c5fd';
              strokeWidth = 3;
              opacity = 1;
            } else if (isHovered) {
              if (district.isVisited) {
                fill = 'url(#visitedHoverGradient)';
              } else {
                fill = '#1f2b45';
              }
              stroke = '#ffffff';
              strokeWidth = 2.4;
              opacity = 1;
            }

            return (
              <path
                key={district.id}
                d={district.svgPath}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeLinejoin="round"
                opacity={opacity}
                className="transition-all duration-150 cursor-pointer"
                filter={isSelected ? 'url(#selectedGlow)' : undefined}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectDistrict(district);
                }}
                onMouseEnter={() => setHoveredDistrict(district)}
                onMouseLeave={() => setHoveredDistrict(null)}
              />
            );
          })}
        </g>

        {/* 2. Chao Phraya River Overlay */}
        <path
          d={mapDataset.chaoPhrayaRiverSvgPath}
          fill="none"
          stroke="url(#riverGradient)"
          strokeWidth="15"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none opacity-85"
        />

        {/* 3. Visited Landmark Markers & Centroid Pins */}
        <g id="markers-layer" className="pointer-events-none">
          {districts.map((district) => {
            const isVisible = isDistrictVisible(district);
            if (!isVisible) return null;

            const isSelected = selectedDistrict?.id === district.id;
            const { x, y } = district.centerSvg;

            return (
              <g key={`marker-${district.id}`} transform={`translate(${x}, ${y})`}>
                {/* Visited District Pulse Animation */}
                {district.isVisited && (
                  <circle
                    r="8"
                    fill="#10b981"
                    opacity="0.35"
                    className="animate-ping"
                  />
                )}

                {/* Pin Core */}
                <circle
                  r={isSelected ? 6.5 : district.isVisited ? 4.5 : 2.5}
                  fill={isSelected ? '#60a5fa' : district.isVisited ? '#10b981' : '#64748b'}
                  stroke="#ffffff"
                  strokeWidth={isSelected ? 2 : 1}
                />

                {/* Spot Count Badge for Multiple Places */}
                {district.placeCount > 0 && scale >= 1.2 && (
                  <g transform="translate(6, -6)">
                    <circle r="6" fill="#060913" stroke="#10b981" strokeWidth="1.2" />
                    <text
                      textAnchor="middle"
                      dy="2.5"
                      fill="#34d399"
                      fontSize="7.5"
                      fontWeight="bold"
                    >
                      {district.placeCount}
                    </text>
                  </g>
                )}

                {/* Text Label */}
                {showLabels && scale >= 1.1 && (
                  <text
                    y={district.isVisited ? 12 : 9}
                    textAnchor="middle"
                    fill={district.isVisited ? '#a7f3d0' : '#94a3b8'}
                    fontSize={Math.max(7.5, 10 / Math.sqrt(scale))}
                    fontWeight={district.isVisited || isSelected ? '700' : '500'}
                    className="drop-shadow-md select-none font-sans"
                  >
                    {district.nameTh}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Floating Hover Tooltip */}
      {hoveredDistrict && !isDragging && (
        <div
          className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full -mt-3 glass-panel text-white text-xs rounded-2xl p-3.5 shadow-2xl border border-white/[0.12] backdrop-blur-xl w-60 animate-fade-in"
          style={{
            left: Math.max(130, Math.min(tooltipPos.x, (containerRef.current?.clientWidth || 300) - 130)),
            top: Math.max(65, tooltipPos.y)
          }}
        >
          <div className="flex items-center justify-between gap-1.5 mb-1">
            <span className="font-extrabold text-sm text-white tracking-tight">
              {hoveredDistrict.nameEn}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                hoveredDistrict.isVisited
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {hoveredDistrict.isVisited ? '✓ Visited' : 'Unvisited'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mb-2 flex items-center justify-between">
            <span className="font-medium">เขต{hoveredDistrict.nameTh}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-300">{hoveredDistrict.zoneTh}</span>
          </div>

          <div className="border-t border-white/[0.08] pt-2 flex items-center justify-between text-[11px]">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span>📍</span>
              <span className="tabular-nums">{hoveredDistrict.placeCount} spot{hoveredDistrict.placeCount !== 1 ? 's' : ''}</span> logged
            </span>
            <span className="text-slate-400 text-[10px] font-medium">
              Tap to inspect →
            </span>
          </div>
        </div>
      )}

      {/* Map Legend (Bottom-Left) */}
      <div className="absolute bottom-3.5 left-3.5 z-20 flex items-center gap-3 bg-[#0d1424]/90 backdrop-blur-md rounded-2xl px-3.5 py-2 border border-white/[0.08] text-xs text-slate-300 shadow-xl pointer-events-auto">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-glow-emerald inline-block" />
          <span className="font-bold text-emerald-400 tabular-nums">Visited ({visitedCount})</span>
        </div>
        <div className="w-px h-3.5 bg-slate-700" />
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-600 border border-slate-500 inline-block" />
          <span className="text-slate-400 tabular-nums">Unvisited ({districts.length - visitedCount})</span>
        </div>
        <div className="w-px h-3.5 bg-slate-700 hidden sm:block" />
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-sky-400 font-medium">
          <span className="w-3.5 h-1.5 rounded-full bg-sky-400 inline-block" />
          <span>Chao Phraya River</span>
        </div>
      </div>
    </div>
  );
};

