import React, { useState } from 'react';
import { FullDistrict, Place, PlaceCategory } from '@/lib/types';
import { placeCategories } from '@/lib/districts-data';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { PlusCircle, Trash2, Edit2, Sparkles, MapPin, Calendar, Check, X } from 'lucide-react';
import { formatDate, getCategoryBadge } from '@/lib/utils';

interface AdminPlaceManagerProps {
  district: FullDistrict | null;
  isOpen: boolean;
  onClose: () => void;
  onPlaceAdded: (districtId: string, place: Omit<Place, 'id'>) => Promise<void>;
  onPlaceUpdated: (districtId: string, placeId: string, data: Partial<Place>) => Promise<void>;
  onPlaceDeleted: (districtId: string, placeId: string) => Promise<void>;
  onNotesUpdated: (districtId: string, notes: string) => Promise<void>;
}

export const AdminPlaceManager: React.FC<AdminPlaceManagerProps> = ({
  district,
  isOpen,
  onClose,
  onPlaceAdded,
  onPlaceUpdated,
  onPlaceDeleted,
  onNotesUpdated
}) => {
  if (!isOpen || !district) return null;

  const [isAdding, setIsAdding] = useState(false);
  const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PlaceCategory>('Mall');
  const [visitedDate, setVisitedDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [generalNotes, setGeneralNotes] = useState(district.generalNotes || '');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName('');
    setCategory('Mall');
    setVisitedDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setIsAdding(false);
    setEditingPlaceId(null);
  };

  const handleStartEdit = (p: Place) => {
    setEditingPlaceId(p.id);
    setName(p.name);
    setCategory(p.category);
    setVisitedDate(p.visitedDate || new Date().toISOString().split('T')[0]);
    setNotes(p.notes || '');
    setIsAdding(true);
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
          notes: notes.trim()
        });
      } else {
        await onPlaceAdded(district.id, {
          name: name.trim(),
          category,
          visitedDate,
          notes: notes.trim()
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Manage District: ${district.nameEn} (${district.nameTh})`}
      description={`Add, edit or remove visited spots and notes for ${district.nameEn}`}
      maxWidth="lg"
    >
      <div className="space-y-5 pt-2 max-h-[75vh] overflow-y-auto pr-1">
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

        {/* Add / Edit Form */}
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
              return (
                <div
                  key={place.id}
                  className="bg-[#060913]/90 rounded-2xl p-3.5 border border-white/[0.08] shadow-sm flex items-start justify-between gap-3 hover:border-white/[0.15] transition-all"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-white">
                        {place.name}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${cat.color}`}>
                        {cat.label}
                      </span>
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
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};

