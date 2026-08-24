import React, { useRef, useState } from 'react';
import { TrackerStats, FullDistrict } from '@/lib/types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Download, Share2, Copy, Check, Sparkles, Trophy, MapPin, Award } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: TrackerStats;
  districts: FullDistrict[];
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  stats,
  districts
}) => {
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const visitedDistricts = districts.filter((d) => d.isVisited);
  const topSpots = visitedDistricts
    .flatMap((d) => d.visitedPlaces)
    .slice(0, 8);

  const shareText = `🏛️ Bangkok 50 Districts Exploration Passport:\n\n✨ Conquered: ${stats.visitedDistricts}/50 Districts (${stats.visitedPercentage}%)\n📍 Total Places Logged: ${stats.totalPlaces} spots\n🏆 Status: ${stats.explorerRank.badge} ${stats.explorerRank.titleEn} (${stats.explorerRank.titleTh})\n\nTrack your own Bangkok adventures! #Bangkok50Districts`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Bangkok 50 Districts Explorer Snapshot',
          text: shareText,
          url: window.location.href
        });
      } catch (err) {
        // Ignored if cancelled
      }
    } else {
      handleCopy();
    }
  };

  // High Quality 1200x675 Canvas Card Generation
  const handleDownloadCard = () => {
    setIsGenerating(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 675;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        setIsGenerating(false);
        return;
      }

      // 1. Background Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 1200, 675);
      bgGrad.addColorStop(0, '#060913');
      bgGrad.addColorStop(0.5, '#0b1324');
      bgGrad.addColorStop(1, '#052e25');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1200, 675);

      // Subtle Coordinate Dots
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      for (let x = 30; x < 1200; x += 36) {
        for (let y = 30; y < 675; y += 36) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 2. Header Subtitle & Title
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('BANGKOK 50 DISTRICTS EXPLORER PASSPORT', 70, 75);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('บันทึกการเดินทาง 50 เขตกรุงเทพฯ', 70, 135);

      // 3. Stats Highlight Box
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(70, 175, 1060, 230, 24);
      ctx.fill();
      ctx.stroke();

      // Column 1: Visited Districts
      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 16px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('DISTRICTS CONQUERED', 110, 225);

      ctx.fillStyle = '#34d399';
      ctx.font = '900 68px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(`${stats.visitedDistricts}`, 110, 305);
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(`/ 50 (${stats.visitedPercentage}%)`, 210, 300);

      // Column 2: Logged Spots
      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 16px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('TOTAL PLACES LOGGED', 510, 225);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '900 68px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(`${stats.totalPlaces}`, 510, 305);
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('spots visited', 615, 300);

      // Column 3: Explorer Status
      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 16px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('EXPLORER STATUS', 830, 225);

      ctx.fillStyle = '#fbbf24';
      ctx.font = '900 28px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(`${stats.explorerRank.badge} Level ${stats.explorerRank.level}`, 830, 275);
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 20px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(`${stats.explorerRank.titleEn}`, 830, 310);

      // Progress Bar on Canvas
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(110, 350, 980, 22, 11);
      ctx.fill();

      const fillGrad = ctx.createLinearGradient(110, 0, 1090, 0);
      fillGrad.addColorStop(0, '#10b981');
      fillGrad.addColorStop(0.5, '#14b8a6');
      fillGrad.addColorStop(1, '#06b6d4');
      ctx.fillStyle = fillGrad;
      ctx.beginPath();
      ctx.roundRect(110, 350, Math.max(24, (stats.visitedPercentage / 100) * 980), 22, 11);
      ctx.fill();

      // 4. Highlighted Spots Row
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('HIGHLIGHT EXPLORED SPOTS', 70, 455);

      let curX = 70;
      let curY = 480;
      topSpots.slice(0, 7).forEach((spot) => {
        const tagText = `📍 ${spot.name}`;
        ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, sans-serif';
        const tagWidth = ctx.measureText(tagText).width + 36;

        if (curX + tagWidth > 1130) {
          curX = 70;
          curY += 46;
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(curX, curY, tagWidth, 36, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f1f5f9';
        ctx.fillText(tagText, curX + 18, curY + 24);

        curX += tagWidth + 12;
      });

      // 5. Footer Signature
      ctx.fillStyle = '#64748b';
      ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('Bangkok 50 Districts Interactive Tracker • Built with Bun & Next.js', 70, 630);
      ctx.fillText('Generated on ' + new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), 880, 630);

      // Download trigger
      const link = document.createElement('a');
      link.download = `bangkok-50-explorer-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error rendering passport card:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Exploration Passport"
      description="Showcase your journey, landmarks logged, and ranking across Bangkok's 50 districts"
      maxWidth="lg"
    >
      <div className="space-y-4 pt-2">
        {/* Visual Snapshot Card Preview */}
        <div
          ref={cardRef}
          className="relative bg-gradient-to-br from-[#0c1824] via-[#09121d] to-[#052820] rounded-3xl p-6 text-white border border-emerald-500/30 shadow-2xl overflow-hidden"
        >
          {/* Background Glow */}
          <div className="absolute -top-24 -right-24 w-52 h-52 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-52 h-52 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <span className="text-[10px] font-extrabold tracking-widest uppercase text-emerald-400">
                Bangkok 50 Districts Passport
              </span>
              <h3 className="text-xl font-black tracking-tight text-white mt-0.5">
                บันทึกการเดินทาง 50 เขตกรุงเทพฯ
              </h3>
            </div>
            <div className="text-right flex items-center gap-2">
              <span className="text-3xl">{stats.explorerRank.badge}</span>
              <div>
                <p className="text-xs font-bold text-white">Level {stats.explorerRank.level}</p>
                <p className="text-[10px] font-semibold text-emerald-300">Explorer</p>
              </div>
            </div>
          </div>

          {/* Progress Card Body */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#060913]/70 backdrop-blur-md rounded-2xl p-4 border border-white/[0.08] mb-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Visited</span>
              <p className="text-2xl font-black text-emerald-400 mt-0.5 tabular-nums">
                {stats.visitedDistricts} <span className="text-xs text-slate-400 font-normal">/ 50</span>
              </p>
              <p className="text-[11px] text-emerald-300 font-semibold tabular-nums">{stats.visitedPercentage}% Conquered</p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Spots Logged</span>
              <p className="text-2xl font-black text-sky-400 mt-0.5 tabular-nums">
                {stats.totalPlaces} <span className="text-xs text-slate-400 font-normal">spots</span>
              </p>
              <p className="text-[11px] text-sky-300 font-semibold">Across all zones</p>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Explorer Rank</span>
              <p className="text-sm font-bold text-amber-300 mt-1 truncate">
                {stats.explorerRank.titleEn}
              </p>
              <p className="text-[10px] text-slate-400 font-thai truncate">{stats.explorerRank.titleTh}</p>
            </div>
          </div>

          {/* Top Logged Spots */}
          {topSpots.length > 0 && (
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
                Explored Landmarks & Highlights
              </span>
              <div className="flex flex-wrap gap-1.5">
                {topSpots.map((spot) => (
                  <span
                    key={spot.id}
                    className="text-xs bg-[#060913]/90 text-slate-200 px-2.5 py-1 rounded-xl border border-white/[0.08]"
                  >
                    📍 {spot.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Button
            variant="primary"
            size="lg"
            loading={isGenerating}
            onClick={handleDownloadCard}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Passport Image
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="lg"
              onClick={handleNativeShare}
              className="flex-1"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>

            <Button
              variant="secondary"
              size="lg"
              onClick={handleCopy}
              className="px-4"
              title="Copy to Clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

