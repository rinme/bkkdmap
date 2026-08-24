import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FullDistrict, BangkokZone, FilterVisited } from '@/lib/types';
import { mapDataset } from '@/lib/districts-data';
import { MapControls } from './MapControls';
import { CheckCircle2, Sparkles, Navigation2 } from 'lucide-react';

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

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[68vh] min-h-[480px] max-h-[750px] bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 touch-none select-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Grid Pattern */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)',
          backgroundSize: '24px 24px'
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
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-1.5 max-w-[calc(100%-80px)] pointer-events-auto">
        <button
          onClick={() => setCurrentZone(null)}
          className={`px-2.5 py-1 text-xs rounded-full font-medium transition-all backdrop-blur-md ${
            currentZone === null
              ? 'bg-emerald-500 text-white shadow-md'
              : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700'
          }`}
        >
          All 50 Districts
        </button>
        {mapDataset.zones.map((zone) => (
          <button
            key={zone.id}
            onClick={() => setCurrentZone(currentZone === zone.id ? null : zone.id)}
            className={`px-2 py-0.5 text-xs rounded-full font-medium transition-all backdrop-blur-md border ${
              currentZone === zone.id
                ? 'bg-white text-slate-950 font-bold shadow-md border-white'
                : 'bg-slate-800/70 hover:bg-slate-700/70 text-slate-300 border-slate-700/60'
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
          {/* Subtle Glow Filter for Selected District */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Chao Phraya River Gradient */}
          <linearGradient id="riverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#0284c7" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.85" />
          </linearGradient>

          {/* Visited District Vibrant Green Gradient */}
          <linearGradient id="visitedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>

          {/* Active Highlight Gradient */}
          <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
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

            let fill = district.isVisited ? 'url(#visitedGradient)' : '#1e293b';
            let stroke = district.isVisited ? '#86efac' : '#334155';
            let strokeWidth = 1.2;
            let opacity = 1;

            if (!isVisible || !isMatch) {
              opacity = 0.2;
            }

            if (isSelected) {
              fill = 'url(#activeGradient)';
              stroke = '#93c5fd';
              strokeWidth = 2.8;
              opacity = 1;
            } else if (isHovered) {
              stroke = '#ffffff';
              strokeWidth = 2.2;
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
                filter={isSelected ? 'url(#glow)' : undefined}
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
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none opacity-80"
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
                    r="9"
                    fill="#22c55e"
                    opacity="0.3"
                    className="animate-ping"
                  />
                )}

                {/* Pin Core */}
                <circle
                  r={isSelected ? 6.5 : district.isVisited ? 4.5 : 2.5}
                  fill={isSelected ? '#60a5fa' : district.isVisited ? '#22c55e' : '#64748b'}
                  stroke="#ffffff"
                  strokeWidth={isSelected ? 2 : 1}
                />

                {/* Spot Count Badge for Multiple Places */}
                {district.placeCount > 0 && scale >= 1.2 && (
                  <g transform="translate(6, -6)">
                    <circle r="6" fill="#0f172a" stroke="#22c55e" strokeWidth="1" />
                    <text
                      textAnchor="middle"
                      dy="2.5"
                      fill="#22c55e"
                      fontSize="7"
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
                    fill={district.isVisited ? '#bbf7d0' : '#94a3b8'}
                    fontSize={Math.max(7.5, 10 / Math.sqrt(scale))}
                    fontWeight={district.isVisited || isSelected ? '700' : '500'}
                    className="drop-shadow-md select-none"
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
          className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full -mt-3 bg-slate-900/95 text-white text-xs rounded-2xl p-3 shadow-2xl border border-slate-700/80 backdrop-blur-md w-56 animate-fade-in"
          style={{
            left: Math.max(120, Math.min(tooltipPos.x, (containerRef.current?.clientWidth || 300) - 120)),
            top: Math.max(60, tooltipPos.y)
          }}
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="font-bold text-sm text-slate-100">
              {hoveredDistrict.nameEn}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                hoveredDistrict.isVisited
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {hoveredDistrict.isVisited ? 'Visited' : 'Unvisited'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mb-1.5 flex items-center justify-between">
            <span>{hoveredDistrict.nameTh}</span>
            <span className="text-[10px] text-slate-500">{hoveredDistrict.zoneTh}</span>
          </div>

          <div className="border-t border-slate-800/80 pt-1.5 flex items-center justify-between text-[11px]">
            <span className="text-emerald-400 font-medium">
              📍 {hoveredDistrict.placeCount} spot{hoveredDistrict.placeCount !== 1 ? 's' : ''} logged
            </span>
            <span className="text-slate-400 text-[10px]">
              Tap to view →
            </span>
          </div>
        </div>
      )}

      {/* Map Legend (Bottom-Left) */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-3 bg-slate-900/85 backdrop-blur-md rounded-2xl px-3.5 py-2 border border-slate-800/80 text-xs text-slate-300 shadow-lg pointer-events-auto">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm inline-block" />
          <span className="font-medium text-emerald-400">Visited ({districts.filter((d) => d.isVisited).length})</span>
        </div>
        <div className="w-px h-3.5 bg-slate-700" />
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-slate-700 border border-slate-600 inline-block" />
          <span className="text-slate-400">Unvisited ({districts.filter((d) => !d.isVisited).length})</span>
        </div>
        <div className="w-px h-3.5 bg-slate-700 hidden sm:block" />
        <div className="hidden sm:flex items-center gap-1 text-[11px] text-sky-400">
          <span className="w-4 h-1.5 rounded-full bg-sky-500 inline-block" />
          <span>Chao Phraya River</span>
        </div>
      </div>
    </div>
  );
};
