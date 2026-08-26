import React, { useState, useEffect, useRef, useCallback } from 'react';
import useSWR from 'swr';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { AppSettings, DEFAULT_APP_SETTINGS } from '@/lib/types';
import {
  compressImage,
  formatBytes,
  revokePreviewUrl,
  CompressedImageResult
} from '@/lib/image-compressor';
import {
  Sliders,
  Upload,
  RefreshCw,
  Check,
  RotateCcw,
  Sparkles,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  AlertCircle,
  CheckCircle2,
  FileText
} from 'lucide-react';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SettingsApiResponse {
  success: boolean;
  settings: AppSettings;
  error?: string;
}

const fetcher = async (url: string): Promise<SettingsApiResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to fetch settings');
  }
  return res.json();
};

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { data, mutate } = useSWR<SettingsApiResponse>(
    isOpen ? '/api/settings' : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  // Configuration Form State
  const [maxImageSizeKb, setMaxImageSizeKb] = useState<number>(DEFAULT_APP_SETTINGS.maxImageSizeKb);
  const [maxImageDimension, setMaxImageDimension] = useState<number>(DEFAULT_APP_SETTINGS.maxImageDimension);
  const [imageQuality, setImageQuality] = useState<number>(DEFAULT_APP_SETTINGS.imageQuality);
  const [autoCompress, setAutoCompress] = useState<boolean>(DEFAULT_APP_SETTINGS.autoCompress);

  // Action status state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live Playground State
  const [testFile, setTestFile] = useState<File | null>(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null);
  const [compressedResult, setCompressedResult] = useState<CompressedImageResult | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionError, setCompressionError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<'normal' | 'zoomed'>('normal');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when SWR data loads
  useEffect(() => {
    if (data?.settings) {
      setMaxImageSizeKb(data.settings.maxImageSizeKb ?? DEFAULT_APP_SETTINGS.maxImageSizeKb);
      setMaxImageDimension(data.settings.maxImageDimension ?? DEFAULT_APP_SETTINGS.maxImageDimension);
      setImageQuality(data.settings.imageQuality ?? DEFAULT_APP_SETTINGS.imageQuality);
      setAutoCompress(data.settings.autoCompress ?? DEFAULT_APP_SETTINGS.autoCompress);
    }
  }, [data]);

  // Clean up object URLs on unmount or file reset
  const cleanupPlayground = useCallback(() => {
    if (originalPreviewUrl) {
      revokePreviewUrl(originalPreviewUrl);
      setOriginalPreviewUrl(null);
    }
    if (compressedResult?.previewUrl) {
      revokePreviewUrl(compressedResult.previewUrl);
      setCompressedResult(null);
    }
    setOriginalDimensions(null);
    setTestFile(null);
    setCompressionError(null);
  }, [originalPreviewUrl, compressedResult]);

  useEffect(() => {
    if (!isOpen) {
      cleanupPlayground();
      setSaveSuccess(false);
      setErrorMessage(null);
    }
  }, [isOpen, cleanupPlayground]);

  // Live compression executor
  const runLiveCompression = useCallback(
    async (file: File, config: Partial<AppSettings>) => {
      setIsCompressing(true);
      setCompressionError(null);
      try {
        const result = await compressImage(file, config);
        setCompressedResult((prev) => {
          if (prev?.previewUrl) revokePreviewUrl(prev.previewUrl);
          return result;
        });
      } catch (err: any) {
        console.error('Live compression test error:', err);
        setCompressionError(err.message || 'Compression failed.');
      } finally {
        setIsCompressing(false);
      }
    },
    []
  );

  // Re-run compression when settings sliders change and test file exists
  useEffect(() => {
    if (!testFile) return;

    const timer = setTimeout(() => {
      runLiveCompression(testFile, {
        maxImageSizeKb,
        maxImageDimension,
        imageQuality,
        autoCompress
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [testFile, maxImageSizeKb, maxImageDimension, imageQuality, autoCompress, runLiveCompression]);

  // Handle file selection in playground
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setCompressionError('Please select a valid image file (JPEG, PNG, WebP, AVIF).');
      return;
    }

    if (originalPreviewUrl) revokePreviewUrl(originalPreviewUrl);
    if (compressedResult?.previewUrl) revokePreviewUrl(compressedResult.previewUrl);

    const origUrl = URL.createObjectURL(file);
    setTestFile(file);
    setOriginalPreviewUrl(origUrl);
    setCompressionError(null);

    // Read original image dimensions
    const img = new Image();
    img.onload = () => {
      setOriginalDimensions({
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height
      });
    };
    img.src = origUrl;

    runLiveCompression(file, {
      maxImageSizeKb,
      maxImageDimension,
      imageQuality,
      autoCompress
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Reset settings form to defaults
  const handleResetToDefaults = () => {
    setMaxImageSizeKb(DEFAULT_APP_SETTINGS.maxImageSizeKb);
    setMaxImageDimension(DEFAULT_APP_SETTINGS.maxImageDimension);
    setImageQuality(DEFAULT_APP_SETTINGS.imageQuality);
    setAutoCompress(DEFAULT_APP_SETTINGS.autoCompress);
  };

  // Save settings via API
  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    const payload: Partial<AppSettings> = {
      maxImageSizeKb,
      maxImageDimension,
      imageQuality,
      autoCompress
    };

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to save settings');
      }

      await mutate({ success: true, settings: resData.settings }, false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Admin System & Upload Settings"
      description="Configure client-side image compression rules and test them interactively in real-time."
      maxWidth="full"
    >
      <div className="space-y-6 pt-1 max-h-[78vh] overflow-y-auto pr-1">
        {/* Top Status / Alerts */}
        {saveSuccess && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Upload & compression settings saved successfully!</span>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 2-Column Grid: Settings Controls & Live Playground */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form Controls (6 cols on lg) */}
          <div className="lg:col-span-6 space-y-5">
            <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-300">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>Compression Parameters</span>
              </div>
              <button
                type="button"
                onClick={handleResetToDefaults}
                className="text-[11px] font-semibold text-slate-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
                title="Reset all fields to factory defaults"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Defaults</span>
              </button>
            </div>

            {/* Max Image Size */}
            <div className="bg-[#060913]/90 rounded-2xl p-4 border border-white/[0.08] space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-white block">
                    Max Image File Size
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Target maximum size after compression
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-[#0c1322] px-2.5 py-1 rounded-xl border border-white/[0.1]">
                  <span className="text-xs font-black text-emerald-400 tabular-nums">
                    {maxImageSizeKb}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">KB</span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    (~{(maxImageSizeKb / 1024).toFixed(1)} MB)
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <input
                  type="range"
                  min="200"
                  max="5120"
                  step="50"
                  value={maxImageSizeKb}
                  onChange={(e) => setMaxImageSizeKb(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
                <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                  <span>200 KB</span>
                  <span>1,024 KB (1 MB)</span>
                  <span>2,048 KB (2 MB)</span>
                  <span>5,120 KB (5 MB)</span>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex gap-1.5 pt-1">
                {[500, 1024, 2048, 4096].map((kb) => (
                  <button
                    key={kb}
                    type="button"
                    onClick={() => setMaxImageSizeKb(kb)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                      maxImageSizeKb === kb
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                        : 'bg-[#0c1322] text-slate-400 border-white/[0.06] hover:text-white hover:border-white/[0.15]'
                    }`}
                  >
                    {kb >= 1024 ? `${kb / 1024} MB` : `${kb} KB`}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Image Dimension */}
            <div className="bg-[#060913]/90 rounded-2xl p-4 border border-white/[0.08] space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-white block">
                    Max Image Dimension
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Longest edge (width or height) will be scaled down
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-[#0c1322] px-2.5 py-1 rounded-xl border border-white/[0.1]">
                  <span className="text-xs font-black text-cyan-400 tabular-nums">
                    {maxImageDimension}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">px</span>
                </div>
              </div>

              <div className="space-y-2">
                <input
                  type="range"
                  min="800"
                  max="3840"
                  step="40"
                  value={maxImageDimension}
                  onChange={(e) => setMaxImageDimension(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                  <span>800 px</span>
                  <span>1,920 px (FHD)</span>
                  <span>2,560 px (2K)</span>
                  <span>3,840 px (4K)</span>
                </div>
              </div>

              {/* Resolution Presets */}
              <div className="flex gap-1.5 pt-1">
                {[
                  { label: '720p', px: 1280 },
                  { label: '1080p (FHD)', px: 1920 },
                  { label: '1440p (2K)', px: 2560 },
                  { label: '4K (UHD)', px: 3840 }
                ].map((item) => (
                  <button
                    key={item.px}
                    type="button"
                    onClick={() => setMaxImageDimension(item.px)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                      maxImageDimension === item.px
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                        : 'bg-[#0c1322] text-slate-400 border-white/[0.06] hover:text-white hover:border-white/[0.15]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Image Quality Slider */}
            <div className="bg-[#060913]/90 rounded-2xl p-4 border border-white/[0.08] space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-white block">
                    Export Encoding Quality
                  </label>
                  <p className="text-[11px] text-slate-400">
                    WebP / JPEG compression quality level
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-[#0c1322] px-2.5 py-1 rounded-xl border border-white/[0.1]">
                  <span className="text-xs font-black text-amber-400 tabular-nums">
                    {imageQuality}%
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <input
                  type="range"
                  min="40"
                  max="100"
                  step="5"
                  value={imageQuality}
                  onChange={(e) => setImageQuality(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                  <span>40% (Compact)</span>
                  <span>75% (Recommended)</span>
                  <span>80% (Default)</span>
                  <span>100% (Lossless)</span>
                </div>
              </div>
            </div>

            {/* Auto Compress Switch & MIME Info */}
            <div className="bg-[#060913]/90 rounded-2xl p-4 border border-white/[0.08] flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs font-bold text-white block">
                  Automatic Client-Side Compression
                </span>
                <p className="text-[11px] text-slate-400">
                  Process images in the browser before network transmission
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={autoCompress}
                onClick={() => setAutoCompress(!autoCompress)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer ${
                  autoCompress ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoCompress ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Right Column: Live Compression Playground (6 cols on lg) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-300">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Live Compression Playground</span>
              </div>
              {testFile && (
                <button
                  type="button"
                  onClick={cleanupPlayground}
                  className="text-[11px] font-semibold text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Clear Image
                </button>
              )}
            </div>

            {/* Upload & Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`relative rounded-3xl border-2 border-dashed p-5 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-emerald-400 bg-emerald-500/15 shadow-glow-emerald'
                  : testFile
                  ? 'border-white/[0.12] bg-[#060913]/70 hover:border-emerald-500/40'
                  : 'border-white/[0.15] bg-[#060913]/90 hover:border-emerald-500/50 hover:bg-emerald-950/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              {!testFile ? (
                <div className="py-6 flex flex-col items-center justify-center space-y-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Upload className="w-6 h-6 animate-bounce" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">
                      Drop an image here or click to browse
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Supports high-res JPEG, PNG, WebP (up to 20MB)
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-slate-400">
                    Real-time canvas encoding preview
                  </Badge>
                </div>
              ) : (
                <div className="space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <ImageIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span className="text-xs font-bold text-white truncate">
                        {testFile.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 hover:text-white underline ml-2 flex-shrink-0">
                      Change File
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Compression Error Notice */}
            {compressionError && (
              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{compressionError}</span>
              </div>
            )}

            {/* Live Metrics Comparison Panel */}
            {testFile && (
              <div className="space-y-4 animate-fade-in">
                {/* Stats Scoreboard */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {/* Original Card */}
                  <div className="bg-[#060913]/90 rounded-2xl p-3 border border-white/[0.08] space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Original
                    </span>
                    <p className="text-sm font-black text-white tabular-nums">
                      {formatBytes(testFile.size)}
                    </p>
                    {originalDimensions && (
                      <p className="text-[10px] text-slate-400 tabular-nums">
                        {originalDimensions.width} × {originalDimensions.height} px
                      </p>
                    )}
                  </div>

                  {/* Compressed Card */}
                  <div className="bg-[#060913]/90 rounded-2xl p-3 border border-emerald-500/30 bg-emerald-950/20 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                      Compressed
                    </span>
                    <p className="text-sm font-black text-emerald-300 tabular-nums flex items-center gap-1">
                      {isCompressing ? (
                        <span className="text-xs text-slate-400 animate-pulse">Encoding...</span>
                      ) : compressedResult ? (
                        formatBytes(compressedResult.compressedSize)
                      ) : (
                        '—'
                      )}
                    </p>
                    {compressedResult && !isCompressing && (
                      <p className="text-[10px] text-slate-400 tabular-nums">
                        {compressedResult.width} × {compressedResult.height} px ({compressedResult.format.replace('image/', '')})
                      </p>
                    )}
                  </div>

                  {/* Savings Card */}
                  <div className="col-span-2 sm:col-span-1 bg-[#060913]/90 rounded-2xl p-3 border border-white/[0.08] flex flex-col justify-center space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Bandwidth Saved
                    </span>
                    {compressedResult && !isCompressing ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-amber-400 tabular-nums">
                          ⚡ {compressedResult.savingsPercentage}%
                        </span>
                        <span className="text-[10px] text-slate-400">less</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">—</span>
                    )}
                  </div>
                </div>

                {/* Side-by-Side Image Visual Comparison */}
                <div className="bg-[#060913]/90 rounded-2xl p-3.5 border border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      Visual Comparison
                    </span>

                    <button
                      type="button"
                      onClick={() => setZoomLevel(zoomLevel === 'normal' ? 'zoomed' : 'normal')}
                      className="text-[11px] font-semibold text-slate-400 hover:text-white flex items-center gap-1 bg-[#0c1322] px-2 py-1 rounded-lg border border-white/[0.06] transition-colors cursor-pointer"
                    >
                      {zoomLevel === 'normal' ? (
                        <>
                          <ZoomIn className="w-3 h-3 text-cyan-400" />
                          <span>Inspect Detail</span>
                        </>
                      ) : (
                        <>
                          <ZoomOut className="w-3 h-3 text-cyan-400" />
                          <span>Fit View</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Original Preview */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-400">Original Photo</span>
                      </div>
                      <div
                        className={`relative rounded-xl overflow-hidden bg-slate-950 border border-white/[0.08] flex items-center justify-center ${
                          zoomLevel === 'zoomed' ? 'h-52' : 'h-36'
                        }`}
                      >
                        {originalPreviewUrl && (
                          <img
                            src={originalPreviewUrl}
                            alt="Original preview"
                            className={`w-full h-full ${
                              zoomLevel === 'zoomed'
                                ? 'object-cover scale-150 transition-transform duration-300'
                                : 'object-contain'
                            }`}
                          />
                        )}
                      </div>
                    </div>

                    {/* Compressed Preview */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-emerald-400">Compressed Output</span>
                        {compressedResult && (
                          <span className="text-[10px] text-slate-400 uppercase font-bold">
                            {compressedResult.format.replace('image/', '')}
                          </span>
                        )}
                      </div>
                      <div
                        className={`relative rounded-xl overflow-hidden bg-slate-950 border border-emerald-500/30 flex items-center justify-center ${
                          zoomLevel === 'zoomed' ? 'h-52' : 'h-36'
                        }`}
                      >
                        {isCompressing ? (
                          <div className="flex flex-col items-center gap-2 text-slate-400 text-xs">
                            <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
                            <span>Compressing...</span>
                          </div>
                        ) : compressedResult?.previewUrl ? (
                          <img
                            src={compressedResult.previewUrl}
                            alt="Compressed preview"
                            className={`w-full h-full ${
                              zoomLevel === 'zoomed'
                                ? 'object-cover scale-150 transition-transform duration-300'
                                : 'object-contain'
                            }`}
                          />
                        ) : (
                          <span className="text-xs text-slate-500">Waiting for preview</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetToDefaults}
            className="text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Reset Defaults
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Close
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={isSaving}
              onClick={handleSaveSettings}
              className="text-xs font-bold"
            >
              <Check className="w-3.5 h-3.5 mr-1.5" />
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
