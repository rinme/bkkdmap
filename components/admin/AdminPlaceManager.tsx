import React, { useState, useRef } from 'react';
import { FullDistrict, Place, PlaceCategory } from '@/lib/types';
import { placeCategories } from '@/lib/districts-data';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ImageLightbox, LightboxImageItem } from '../ui/ImageLightbox';
import { compressImage, formatBytes, revokePreviewUrl } from '@/lib/image-compressor';
import {
  PlusCircle,
  Trash2,
  Edit2,
  Sparkles,
  MapPin,
  Calendar,
  X,
  Upload,
  Image as ImageIcon,
  Camera,
  Loader2,
  Eye,
  ChevronDown,
  ChevronUp,
  Zap,
  Layers
} from 'lucide-react';
import { formatDate, getCategoryBadge, cn } from '@/lib/utils';

interface AdminPlaceManagerProps {
  district: FullDistrict | null;
  isOpen: boolean;
  onClose: () => void;
  onPlaceAdded: (districtId: string, place: Omit<Place, 'id'>) => Promise<void>;
  onPlaceUpdated: (districtId: string, placeId: string, data: Partial<Place>) => Promise<void>;
  onPlaceDeleted: (districtId: string, placeId: string) => Promise<void>;
  onNotesUpdated: (districtId: string, notes: string) => Promise<void>;
  onDistrictPhotosUpdated?: (districtId: string, photos: string[]) => Promise<void>;
}

export const AdminPlaceManager: React.FC<AdminPlaceManagerProps> = ({
  district,
  isOpen,
  onClose,
  onPlaceAdded,
  onPlaceUpdated,
  onPlaceDeleted,
  onNotesUpdated,
  onDistrictPhotosUpdated
}) => {
  if (!isOpen || !district) return null;

  const [isAdding, setIsAdding] = useState(false);
  const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PlaceCategory>('Mall');
  const [visitedDate, setVisitedDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [placePhotos, setPlacePhotos] = useState<string[]>([]);
  const [generalNotes, setGeneralNotes] = useState(district.generalNotes || '');
  const [loading, setLoading] = useState(false);

  // Place Photos Upload & Compression State
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [compressionSavings, setCompressionSavings] = useState<{
    originalSize: number;
    compressedSize: number;
    savingsPercentage: number;
  } | null>(null);
  const [isDraggingPlacePhoto, setIsDraggingPlacePhoto] = useState(false);
  const placeFileInputRef = useRef<HTMLInputElement>(null);

  // District Gallery State
  const [isDistrictGalleryOpen, setIsDistrictGalleryOpen] = useState(true);
  const [isUploadingDistrictPhotos, setIsUploadingDistrictPhotos] = useState(false);
  const [districtUploadProgress, setDistrictUploadProgress] = useState<string | null>(null);
  const [districtCompressionSavings, setDistrictCompressionSavings] = useState<{
    originalSize: number;
    compressedSize: number;
    savingsPercentage: number;
  } | null>(null);
  const [isDraggingDistrictPhoto, setIsDraggingDistrictPhoto] = useState(false);
  const districtFileInputRef = useRef<HTMLInputElement>(null);

  // Fullscreen Lightbox State
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<LightboxImageItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxContext, setLightboxContext] = useState<
    { type: 'place-form' } | { type: 'district' } | { type: 'place-list'; placeId: string } | null
  >(null);

  const resetForm = () => {
    setName('');
    setCategory('Mall');
    setVisitedDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setPlacePhotos([]);
    setCompressionSavings(null);
    setUploadProgress(null);
    setIsAdding(false);
    setEditingPlaceId(null);
  };

  const handleStartEdit = (p: Place) => {
    setEditingPlaceId(p.id);
    setName(p.name);
    setCategory(p.category);
    setVisitedDate(p.visitedDate || new Date().toISOString().split('T')[0]);
    setNotes(p.notes || '');
    setPlacePhotos(p.photos || []);
    setCompressionSavings(null);
    setUploadProgress(null);
    setIsAdding(true);
  };

  // Helper to delete photo file from server storage
  const deletePhotoFileFromServer = async (url: string) => {
    try {
      await fetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
    } catch (err) {
      console.warn('Failed to delete file from disk:', err);
    }
  };

  // Upload handler for Place Form photos
  const handleUploadPlaceFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    setIsUploadingPhotos(true);
    setUploadProgress(`Compressing 1/${fileArray.length}...`);
    let totalOrig = 0;
    let totalComp = 0;
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setUploadProgress(`Compressing & Uploading ${i + 1}/${fileArray.length}...`);
        const compressed = await compressImage(file);
        revokePreviewUrl(compressed.previewUrl);
        totalOrig += compressed.originalSize;
        totalComp += compressed.compressedSize;

        const formData = new FormData();
        formData.append('districtId', district.id);
        formData.append('file', compressed.file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Upload failed');
        }

        const resData = await res.json();
        if (resData.url) {
          uploadedUrls.push(resData.url);
        }
      }

      setPlacePhotos((prev) => [...prev, ...uploadedUrls]);

      if (totalOrig > 0) {
        const savings = Math.max(0, Math.round(((totalOrig - totalComp) / totalOrig) * 100));
        setCompressionSavings({
          originalSize: totalOrig,
          compressedSize: totalComp,
          savingsPercentage: savings
        });
      }
    } catch (err: any) {
      alert(err.message || 'Error uploading photo');
    } finally {
      setIsUploadingPhotos(false);
      setUploadProgress(null);
      if (placeFileInputRef.current) placeFileInputRef.current.value = '';
    }
  };

  const handleRemovePlaceFormPhoto = async (urlToRemove: string) => {
    setPlacePhotos((prev) => prev.filter((u) => u !== urlToRemove));
    await deletePhotoFileFromServer(urlToRemove);
  };

  // Upload handler for District Album photos
  const handleUploadDistrictFiles = async (files: FileList | File[]) => {
    if (!onDistrictPhotosUpdated) return;
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    setIsUploadingDistrictPhotos(true);
    setDistrictUploadProgress(`Compressing 1/${fileArray.length}...`);
    let totalOrig = 0;
    let totalComp = 0;
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setDistrictUploadProgress(`Compressing & Uploading ${i + 1}/${fileArray.length}...`);
        const compressed = await compressImage(file);
        revokePreviewUrl(compressed.previewUrl);
        totalOrig += compressed.originalSize;
        totalComp += compressed.compressedSize;

        const formData = new FormData();
        formData.append('districtId', district.id);
        formData.append('file', compressed.file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Upload failed');
        }

        const resData = await res.json();
        if (resData.url) {
          uploadedUrls.push(resData.url);
        }
      }

      const updated = [...(district.photos || []), ...uploadedUrls];
      await onDistrictPhotosUpdated(district.id, updated);

      if (totalOrig > 0) {
        const savings = Math.max(0, Math.round(((totalOrig - totalComp) / totalOrig) * 100));
        setDistrictCompressionSavings({
          originalSize: totalOrig,
          compressedSize: totalComp,
          savingsPercentage: savings
        });
      }
    } catch (err: any) {
      alert(err.message || 'Error uploading district photo');
    } finally {
      setIsUploadingDistrictPhotos(false);
      setDistrictUploadProgress(null);
      if (districtFileInputRef.current) districtFileInputRef.current.value = '';
    }
  };

  const handleDeleteDistrictPhoto = async (urlToRemove: string) => {
    if (!onDistrictPhotosUpdated) return;
    const updated = (district.photos || []).filter((u) => u !== urlToRemove);
    await onDistrictPhotosUpdated(district.id, updated);
    await deletePhotoFileFromServer(urlToRemove);
  };

  const handleDeletePlaceListPhoto = async (placeId: string, urlToRemove: string) => {
    const targetPlace = district.visitedPlaces.find((p) => p.id === placeId);
    if (!targetPlace) return;
    const updatedPhotos = (targetPlace.photos || []).filter((u) => u !== urlToRemove);
    await onPlaceUpdated(district.id, placeId, {
      photos: updatedPhotos.length > 0 ? updatedPhotos : undefined
    });
    await deletePhotoFileFromServer(urlToRemove);
  };

  // Lightbox Openers
  const openPlaceFormLightbox = (index: number) => {
    setLightboxContext({ type: 'place-form' });
    setLightboxImages(
      placePhotos.map((url, i) => ({
        url,
        title: name || 'Spot Photo',
        subtitle: `Photo ${i + 1} of ${placePhotos.length}`,
        category,
        date: visitedDate
      }))
    );
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const openDistrictLightbox = (index: number) => {
    const photos = district.photos || [];
    setLightboxContext({ type: 'district' });
    setLightboxImages(
      photos.map((url, i) => ({
        url,
        title: `${district.nameEn} Album`,
        subtitle: `District Photo ${i + 1} of ${photos.length}`,
        date: district.visitedPlaces?.[0]?.visitedDate
      }))
    );
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const openPlaceListLightbox = (place: Place, index: number) => {
    const photos = place.photos || [];
    setLightboxContext({ type: 'place-list', placeId: place.id });
    setLightboxImages(
      photos.map((url, i) => ({
        url,
        title: place.name,
        subtitle: `${district.nameEn} • ${place.category}`,
        category: place.category,
        date: place.visitedDate
      }))
    );
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const handleLightboxDeletePhoto = async (photoUrl: string) => {
    if (!lightboxContext) return;
    if (lightboxContext.type === 'place-form') {
      await handleRemovePlaceFormPhoto(photoUrl);
      setLightboxImages((prev) => prev.filter((img) => img.url !== photoUrl));
    } else if (lightboxContext.type === 'district') {
      await handleDeleteDistrictPhoto(photoUrl);
      setLightboxImages((prev) => prev.filter((img) => img.url !== photoUrl));
    } else if (lightboxContext.type === 'place-list' && lightboxContext.placeId) {
      await handleDeletePlaceListPhoto(lightboxContext.placeId, photoUrl);
      setLightboxImages((prev) => prev.filter((img) => img.url !== photoUrl));
    }
  };

  const handleSavePlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      if (editingPlaceId) {
        await onPlaceUpdated(district.id, editingPlaceId, {
          name: name.trim(),
          category,
          visitedDate,
          notes: notes.trim(),
          photos: placePhotos.length > 0 ? placePhotos : undefined
        });
      } else {
        await onPlaceAdded(district.id, {
          name: name.trim(),
          category,
          visitedDate,
          notes: notes.trim(),
          photos: placePhotos.length > 0 ? placePhotos : undefined
        });
      }
      resetForm();
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    setLoading(true);
    try {
      await onNotesUpdated(district.id, generalNotes);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAddLandmark = (lmName: string) => {
    setName(lmName);
    setIsAdding(true);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Manage District: ${district.nameEn} (${district.nameTh})`}
        description={`Add, edit or remove visited spots, photos, and notes for ${district.nameEn}`}
        maxWidth="lg"
      >
        <div className="space-y-5 pt-2 max-h-[78vh] overflow-y-auto pr-1">
          {/* District Notes Bar */}
          <div className="bg-[#060913]/90 rounded-2xl p-4 border border-white/[0.08] space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
              District Travel Notes / Description
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                placeholder="e.g. Accessible via BTS Siam, famous street food..."
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border bg-[#060913] border-white/[0.1] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <Button
                size="sm"
                variant="secondary"
                loading={loading}
                onClick={handleSaveNotes}
              >
                Save Notes
              </Button>
            </div>
          </div>

          {/* District Photo Album Section */}
          <div className="bg-[#060913]/90 rounded-2xl border border-white/[0.08] overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setIsDistrictGalleryOpen(!isDistrictGalleryOpen)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.03] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  District Photo Album
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {district.photos?.length || 0} Photos
                </span>
              </div>
              <div className="text-slate-400">
                {isDistrictGalleryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {isDistrictGalleryOpen && (
              <div className="p-4 pt-1 border-t border-white/[0.06] space-y-3 animate-fade-in">
                {/* District Dropzone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingDistrictPhoto(true);
                  }}
                  onDragLeave={() => setIsDraggingDistrictPhoto(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingDistrictPhoto(false);
                    if (e.dataTransfer.files) {
                      handleUploadDistrictFiles(e.dataTransfer.files);
                    }
                  }}
                  onClick={() => districtFileInputRef.current?.click()}
                  className={cn(
                    'border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2',
                    isDraggingDistrictPhoto
                      ? 'border-emerald-400 bg-emerald-500/10'
                      : 'border-white/[0.12] hover:border-emerald-500/40 hover:bg-white/[0.02]'
                  )}
                >
                  <input
                    ref={districtFileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        handleUploadDistrictFiles(e.target.files);
                      }
                    }}
                  />

                  {isUploadingDistrictPhotos ? (
                    <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{districtUploadProgress || 'Processing photos...'}</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div className="text-xs text-slate-300">
                        <span className="font-bold text-emerald-400">Click to upload</span> or drag district photos here
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Auto-compressed with WebP optimization before upload
                      </p>
                    </>
                  )}
                </div>

                {/* District Compression Feedback Badge */}
                {districtCompressionSavings && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold animate-fade-in shadow-glow-emerald">
                    <Zap className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      ⚡ Saved {districtCompressionSavings.savingsPercentage}% (
                      {formatBytes(districtCompressionSavings.originalSize)} ➔{' '}
                      {formatBytes(districtCompressionSavings.compressedSize)})
                    </span>
                  </div>
                )}

                {/* District Photos Grid */}
                {district.photos && district.photos.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 pt-1">
                    {district.photos.map((url, idx) => (
                      <div
                        key={`${url}-${idx}`}
                        className="group relative aspect-square rounded-xl overflow-hidden border border-white/[0.1] bg-[#0c1322] shadow-sm"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`${district.nameEn} photo ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                          onClick={() => openDistrictLightbox(idx)}
                        />

                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDistrictLightbox(idx);
                            }}
                            className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-emerald-500 transition-colors pointer-events-auto cursor-pointer"
                            title="View Fullscreen"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDistrictPhoto(url);
                            }}
                            className="p-1.5 rounded-lg bg-red-600/80 text-white hover:bg-red-600 transition-colors pointer-events-auto cursor-pointer"
                            title="Delete Photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 text-center py-2">
                    No general district photos added yet.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Add / Edit Place Form */}
          {isAdding ? (
            <form
              onSubmit={handleSavePlace}
              className="bg-gradient-to-br from-emerald-950/40 via-[#0c1824] to-[#070b16] border border-emerald-500/30 rounded-3xl p-5 space-y-4 animate-fade-in"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  {editingPlaceId ? 'Edit Visited Spot' : 'Add New Visited Spot'}
                </h4>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="space-y-3">
                <Input
                  label="Place / Landmark Name"
                  placeholder="e.g. CentralWorld, Siam Paragon, Wat Pho..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as PlaceCategory)}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl border bg-[#060913] border-white/[0.1] text-white focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                    >
                      {placeCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Visited Date
                    </label>
                    <input
                      type="date"
                      value={visitedDate}
                      onChange={(e) => setVisitedDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border bg-[#060913] border-white/[0.1] text-white focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Notes / Tips (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Highlights, favorite food, best photography spot..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl border bg-[#060913] border-white/[0.1] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                {/* Spot Photo Upload Dropzone */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                      Spot Photos ({placePhotos.length})
                    </label>
                    {compressionSavings && (
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 animate-fade-in">
                        <Zap className="w-3 h-3 text-emerald-400" />
                        ⚡ Saved {compressionSavings.savingsPercentage}% (
                        {formatBytes(compressionSavings.originalSize)} ➔{' '}
                        {formatBytes(compressionSavings.compressedSize)})
                      </span>
                    )}
                  </div>

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingPlacePhoto(true);
                    }}
                    onDragLeave={() => setIsDraggingPlacePhoto(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingPlacePhoto(false);
                      if (e.dataTransfer.files) {
                        handleUploadPlaceFiles(e.dataTransfer.files);
                      }
                    }}
                    onClick={() => placeFileInputRef.current?.click()}
                    className={cn(
                      'border-2 border-dashed rounded-2xl p-3 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5',
                      isDraggingPlacePhoto
                        ? 'border-emerald-400 bg-emerald-500/10'
                        : 'border-white/[0.12] hover:border-emerald-500/40 hover:bg-white/[0.02]'
                    )}
                  >
                    <input
                      ref={placeFileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) {
                          handleUploadPlaceFiles(e.target.files);
                        }
                      }}
                    />

                    {isUploadingPhotos ? (
                      <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 py-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{uploadProgress || 'Compressing & uploading...'}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                          <Upload className="w-3.5 h-3.5 text-emerald-400" />
                          <span>
                            <strong className="text-emerald-400">Click to upload</strong> or drag spot photos
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Automatic client-side auto-compression & WebP optimization
                        </p>
                      </>
                    )}
                  </div>

                  {/* Spot Photos Preview Grid */}
                  {placePhotos.length > 0 && (
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 pt-1.5">
                      {placePhotos.map((url, idx) => (
                        <div
                          key={`${url}-${idx}`}
                          className="group relative aspect-square rounded-xl overflow-hidden border border-white/[0.12] bg-[#060913] shadow-sm"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`Spot photo ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                            onClick={() => openPlaceFormLightbox(idx)}
                          />

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePlaceFormPhoto(url);
                            }}
                            className="absolute top-1 right-1 p-1 rounded-md bg-black/70 hover:bg-red-600 text-white transition-colors cursor-pointer shadow-md"
                            title="Remove photo"
                          >
                            <X className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openPlaceFormLightbox(idx);
                            }}
                            className="absolute bottom-1 right-1 p-1 rounded-md bg-black/70 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-md opacity-0 group-hover:opacity-100"
                            title="Fullscreen"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" loading={loading}>
                  {editingPlaceId ? 'Update Place' : 'Save Place'}
                </Button>
              </div>
            </form>
          ) : (
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => setIsAdding(true)}
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Add New Visited Spot to {district.nameEn}
            </Button>
          )}

          {/* Quick Suggestion Landmarks */}
          {district.popularLandmarks && district.popularLandmarks.length > 0 && (
            <div className="bg-[#060913]/90 rounded-2xl p-4 border border-white/[0.08] space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                1-Click Suggestion Landmarks
              </span>
              <div className="flex flex-wrap gap-1.5">
                {district.popularLandmarks.map((lm, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickAddLandmark(lm)}
                    className="text-xs bg-[#0c1322] hover:bg-emerald-950/60 hover:text-emerald-300 text-slate-300 px-3 py-1 rounded-xl border border-white/[0.08] hover:border-emerald-500/30 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3 h-3 text-emerald-400" />
                    {lm}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Existing Places List */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Currently Logged Spots ({district.visitedPlaces.length})
            </h4>

            {district.visitedPlaces.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-[#060913]/60 rounded-2xl border border-dashed border-white/[0.08]">
                No places logged yet for this district.
              </div>
            ) : (
              district.visitedPlaces.map((place) => {
                const cat = getCategoryBadge(place.category);
                const hasPhotos = place.photos && place.photos.length > 0;

                return (
                  <div
                    key={place.id}
                    className="bg-[#060913]/90 rounded-2xl p-3.5 border border-white/[0.08] shadow-sm flex flex-col gap-2.5 hover:border-white/[0.15] transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-white">
                            {place.name}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${cat.color}`}>
                            {cat.label}
                          </span>
                          {hasPhotos && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <Camera className="w-3 h-3" />
                              {place.photos!.length}
                            </span>
                          )}
                        </div>
                        {place.notes && (
                          <p className="text-xs text-slate-300">
                            {place.notes}
                          </p>
                        )}
                        {place.visitedDate && (
                          <p className="text-[11px] text-slate-400 tabular-nums">
                            Visited on {formatDate(place.visitedDate)}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleStartEdit(place)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-xl transition-colors cursor-pointer"
                          title="Edit Place"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onPlaceDeleted(district.id, place.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                          title="Delete Place"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Spot Photo Thumbnails Strip */}
                    {hasPhotos && (
                      <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-0.5 no-scrollbar">
                        {place.photos!.map((url, pIdx) => (
                          <button
                            key={`${url}-${pIdx}`}
                            type="button"
                            onClick={() => openPlaceListLightbox(place, pIdx)}
                            className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/[0.1] hover:border-emerald-400 flex-shrink-0 cursor-pointer group shadow-sm transition-all"
                            title={`View photo ${pIdx + 1}`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt={`${place.name} thumbnail ${pIdx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Eye className="w-3.5 h-3.5 text-white" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Modal>

      {/* Lightbox Integration */}
      <ImageLightbox
        isOpen={isLightboxOpen}
        images={lightboxImages}
        initialIndex={lightboxIndex}
        onClose={() => {
          setIsLightboxOpen(false);
          setLightboxContext(null);
        }}
        onDeletePhoto={handleLightboxDeletePhoto}
        isAdmin={true}
      />
    </>
  );
};

