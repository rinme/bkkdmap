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
      title={`Manage Places: ${district.nameEn} (${district.nameTh})`}
      description={`Add, edit or remove visited spots for ${district.nameEn} district`}
      maxWidth="lg"
    >
      <div className="space-y-5 pt-2 max-h-[75vh] overflow-y-auto pr-1">
        {/* District Notes Bar */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            District General Notes
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="e.g. Accessible via BTS Siam, great street food..."
              className="flex-1 px-3.5 py-2 text-xs rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
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
            className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800/80 rounded-3xl p-5 space-y-4 animate-fade-in"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                {editingPlaceId ? 'Edit Visited Spot' : 'Add New Visited Spot'}
              </h4>
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-slate-400 hover:text-slate-600"
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as PlaceCategory)}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  >
                    {placeCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Visited Date
                  </label>
                  <input
                    type="date"
                    value={visitedDate}
                    onChange={(e) => setVisitedDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Notes / Review (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Highlights, favorite food, best time to visit..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400"
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
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              1-Click Suggestion Landmarks
            </span>
            <div className="flex flex-wrap gap-1.5">
              {district.popularLandmarks.map((lm, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickAddLandmark(lm)}
                  className="text-xs bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-600 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1"
                >
                  <PlusCircle className="w-3 h-3 text-emerald-500" />
                  {lm}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Existing Places List */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Currently Logged Spots ({district.visitedPlaces.length})
          </h4>

          {district.visitedPlaces.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              No places logged yet for this district.
            </div>
          ) : (
            district.visitedPlaces.map((place) => {
              const cat = getCategoryBadge(place.category);
              return (
                <div
                  key={place.id}
                  className="bg-white dark:bg-slate-850 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-700/80 shadow-sm flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {place.name}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${cat.color}`}>
                        {cat.label}
                      </span>
                    </div>
                    {place.notes && (
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {place.notes}
                      </p>
                    )}
                    {place.visitedDate && (
                      <p className="text-[11px] text-slate-400">
                        Visited on {formatDate(place.visitedDate)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleStartEdit(place)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title="Edit Place"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onPlaceDeleted(district.id, place.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
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
