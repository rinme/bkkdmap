import React, { useRef, useState } from 'react';
import { TrackerStats, FullDistrict } from '@/lib/types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Download, Share2, Copy, Check, Sparkles, Trophy, MapPin } from 'lucide-react';

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

  const shareText = `🏛️ My Bangkok 50 Districts Tracker Progress:\n\n✨ Visited: ${stats.visitedDistricts}/50 Districts (${stats.visitedPercentage}%)\n📍 Total Places Logged: ${stats.totalPlaces} spots\n🏆 Rank: ${stats.explorerRank.badge} ${stats.explorerRank.titleEn} (${stats.explorerRank.titleTh})\n\nTrack your own Bangkok adventures! #Bangkok50Districts`;

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

  // High Quality HTML5 Canvas Card Generation
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
      bgGrad.addColorStop(0, '#090d16');
      bgGrad.addColorStop(0.5, '#0f172a');
      bgGrad.addColorStop(1, '#064e3b');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1200, 675);

      // Subtle grid dots
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      for (let x = 30; x < 1200; x += 40) {
        for (let y = 30; y < 675; y += 40) {
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 2. Header Title
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('BANGKOK 50 DISTRICTS EXPLORATION PASSPORT', 70, 80);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 52px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('บันทึกการเดินทาง 50 เขตกรุงเทพฯ', 70, 145);

      // 3. Stats Highlight Box
      ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(70, 185, 1060, 220, 24);
      ctx.fill();
      ctx.stroke();

      // Visited Stat
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 20px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('DISTRICTS VISITED', 110, 240);

      ctx.fillStyle = '#34d399';
      ctx.font = '900 64px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(`${stats.visitedDistricts} `, 110, 315);
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(`/ 50 (${stats.visitedPercentage}%)`, 210, 310);

      // Total Places Stat
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 20px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('SPOTS & LANDMARKS', 520, 240);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '900 64px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(`${stats.totalPlaces}`, 520, 315);
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('places logged', 620, 310);

      // Explorer Rank
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 20px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('EXPLORER STATUS', 840, 240);

      ctx.fillStyle = '#fbbf24';
      ctx.font = '900 32px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(`${stats.explorerRank.badge} Lv.${stats.explorerRank.level}`, 840, 290);
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 20px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(`${stats.explorerRank.titleEn}`, 840, 325);

      // Progress Bar on Canvas
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(110, 350, 980, 20, 10);
      ctx.fill();

      const fillGrad = ctx.createLinearGradient(110, 0, 1090, 0);
      fillGrad.addColorStop(0, '#10b981');
      fillGrad.addColorStop(1, '#06b6d4');
      ctx.fillStyle = fillGrad;
      ctx.beginPath();
      ctx.roundRect(110, 350, Math.max(20, (stats.visitedPercentage / 100) * 980), 20, 10);
      ctx.fill();

      // 4. Highlighted Spots Row
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('HIGHLIGHT EXPLORED SPOTS', 70, 450);

      let curX = 70;
      let curY = 480;
      topSpots.slice(0, 6).forEach((spot) => {
        const tagText = `📍 ${spot.name}`;
        ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, sans-serif';
        const tagWidth = ctx.measureText(tagText).width + 36;

        if (curX + tagWidth > 1130) {
          curX = 70;
          curY += 48;
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(curX, curY, tagWidth, 38, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#e2e8f0';
        ctx.fillText(tagText, curX + 18, curY + 25);

        curX += tagWidth + 14;
      });

      // 5. Footer Signature
      ctx.fillStyle = '#64748b';
      ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('Bangkok 50 Districts Interactive Tracker • Built with Bun & Next.js', 70, 630);
      ctx.fillText('Generated on ' + new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), 880, 630);

      // Download trigger
      const link = document.createElement('a');
      link.download = `bangkok-50-explorer-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error rendering card:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Exploration Snapshot"
      description="Showcase your journey and places explored across Bangkok's 50 districts"
      maxWidth="lg"
    >
      <div className="space-y-4 pt-2">
        {/* Visual Snapshot Card Preview */}
        <div
          ref={cardRef}
          className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 rounded-3xl p-6 text-white border border-emerald-900/60 shadow-2xl overflow-hidden"
        >
          {/* Background Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

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
            <div className="text-right">
              <span className="text-2xl">{stats.explorerRank.badge}</span>
              <p className="text-[11px] font-bold text-emerald-300">Lv.{stats.explorerRank.level}</p>
            </div>
          </div>

          {/* Progress Card Body */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 mb-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Visited</span>
              <p className="text-2xl font-black text-emerald-400 mt-0.5">
                {stats.visitedDistricts} <span className="text-xs text-slate-400 font-normal">/ 50</span>
              </p>
              <p className="text-[11px] text-emerald-300 font-medium">{stats.visitedPercentage}% Conquered</p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Spots Logged</span>
              <p className="text-2xl font-black text-sky-400 mt-0.5">
                {stats.totalPlaces} <span className="text-xs text-slate-400 font-normal">spots</span>
              </p>
              <p className="text-[11px] text-sky-300 font-medium">Across all zones</p>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Explorer Rank</span>
              <p className="text-sm font-bold text-amber-300 mt-1 truncate">
                {stats.explorerRank.titleEn}
              </p>
              <p className="text-[10px] text-slate-400 truncate">{stats.explorerRank.titleTh}</p>
            </div>
          </div>

          {/* Top Logged Spots */}
          {topSpots.length > 0 && (
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
                Recently Explored Landmarks
              </span>
              <div className="flex flex-wrap gap-1.5">
                {topSpots.map((spot) => (
                  <span
                    key={spot.id}
                    className="text-xs bg-white/10 text-slate-200 px-2.5 py-1 rounded-xl border border-white/10"
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
            Download Snapshot Image
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
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
