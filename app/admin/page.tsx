'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FullDistrict, TrackerStats, ViewMode, Place } from '@/lib/types';
import { Header } from '@/components/Header';
import { BangkokMap } from '@/components/map/BangkokMap';
import { DistrictListView } from '@/components/district-list/DistrictListView';
import { DistrictBottomSheet } from '@/components/DistrictBottomSheet';
import { AdminPlaceManager } from '@/components/admin/AdminPlaceManager';
import { AdminSyncBar } from '@/components/admin/AdminSyncBar';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';
import { ShareModal } from '@/components/ShareModal';
import { StatsModal } from '@/components/StatsModal';
import { ShieldCheck, ArrowLeft, LogOut, PlusCircle, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [districts, setDistricts] = useState<FullDistrict[]>([]);
  const [stats, setStats] = useState<TrackerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Modals and Active District
  const [currentView, setCurrentView] = useState<ViewMode>('list');
  const [selectedDistrict, setSelectedDistrict] = useState<FullDistrict | null>(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isPlaceManagerOpen, setIsPlaceManagerOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  // Check auth and load data
  const checkAuthAndLoad = async () => {
    try {
      setLoading(true);
      const authRes = await fetch('/api/auth/me', { cache: 'no-store' });
      const authData = await authRes.json();
      setIsAuthenticated(authData.authenticated);

      if (authData.authenticated) {
        const res = await fetch('/api/districts', { cache: 'no-store' });
        const data = await res.json();
        setDistricts(data.districts);
        setStats(data.stats);
      }
    } catch (err) {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsAuthenticated(false);
  };

  // Mutating Actions
  const handleToggleVisited = async (district: FullDistrict) => {
    const newStatus = !district.isVisited;
    setIsSaving(true);
    try {
      const res = await fetch('/api/districts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_visited',
          districtId: district.id,
          isVisited: newStatus
        })
      });

      if (!res.ok) throw new Error('Failed to toggle visited');
      const data = await res.json();
      setDistricts(data.districts);
      setStats(data.stats);

      if (selectedDistrict?.id === district.id) {
        const updated = data.districts.find((d: FullDistrict) => d.id === district.id);
        if (updated) setSelectedDistrict(updated);
      }
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePlaceAdded = async (districtId: string, place: Omit<Place, 'id'>) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/districts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_place',
          districtId,
          place
        })
      });

      if (!res.ok) throw new Error('Failed to add place');
      const data = await res.json();
      setDistricts(data.districts);
      setStats(data.stats);

      const updated = data.districts.find((d: FullDistrict) => d.id === districtId);
      if (updated) setSelectedDistrict(updated);
    } catch (err: any) {
      alert(err.message || 'Error adding place');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePlaceUpdated = async (districtId: string, placeId: string, placeData: Partial<Place>) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/districts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_place',
          districtId,
          placeId,
          placeData
        })
      });

      if (!res.ok) throw new Error('Failed to update place');
      const data = await res.json();
      setDistricts(data.districts);
      setStats(data.stats);

      const updated = data.districts.find((d: FullDistrict) => d.id === districtId);
      if (updated) setSelectedDistrict(updated);
    } catch (err: any) {
      alert(err.message || 'Error updating place');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePlaceDeleted = async (districtId: string, placeId: string) => {
    if (!confirm('Are you sure you want to delete this place?')) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/districts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_place',
          districtId,
          placeId
        })
      });

      if (!res.ok) throw new Error('Failed to delete place');
      const data = await res.json();
      setDistricts(data.districts);
      setStats(data.stats);

      const updated = data.districts.find((d: FullDistrict) => d.id === districtId);
      if (updated) setSelectedDistrict(updated);
    } catch (err: any) {
      alert(err.message || 'Error deleting place');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotesUpdated = async (districtId: string, notes: string) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/districts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_notes',
          districtId,
          notes
        })
      });

      if (!res.ok) throw new Error('Failed to update notes');
      const data = await res.json();
      setDistricts(data.districts);
      setStats(data.stats);

      const updated = data.districts.find((d: FullDistrict) => d.id === districtId);
      if (updated) setSelectedDistrict(updated);
    } catch (err: any) {
      alert(err.message || 'Error updating notes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    window.location.href = '/api/export';
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const json = JSON.parse(text);
        setIsSaving(true);
        const res = await fetch('/api/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(json)
        });
        const data = await res.json();
        if (data.success) {
          setDistricts(data.districts);
          setStats(data.stats);
          alert('Backup state restored successfully!');
        } else {
          alert(data.error || 'Import failed');
        }
      } catch (err: any) {
        alert('Invalid JSON file format');
      } finally {
        setIsSaving(false);
      }
    };
    input.click();
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all data to initial defaults? This cannot be undone.')) {
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setDistricts(data.districts);
        setStats(data.stats);
        alert('Data reset to default.');
      }
    } catch (err: any) {
      alert(err.message || 'Reset failed');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold">Authenticating Admin Session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Public View
        </Link>
        <AdminLoginForm onSuccess={checkAuthAndLoad} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 pb-24">
      {/* Sticky Admin Header */}
      {stats && (
        <Header
          stats={stats}
          currentView={currentView}
          onViewChange={setCurrentView}
          onOpenShareModal={() => setIsShareModalOpen(true)}
          onOpenStatsModal={() => setIsStatsModalOpen(true)}
          isAdmin={true}
          onLogout={handleLogout}
        />
      )}

      {/* Admin Notice Bar */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Admin Mode Active — You can toggle visited status and edit spots directly.</span>
          </div>
          <Link
            href="/"
            className="font-bold underline hover:text-white transition-colors ml-4"
          >
            View Public Explorer →
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-4 pb-12 space-y-6">
        {currentView === 'map' && (
          <div className="space-y-4">
            <BangkokMap
              districts={districts}
              selectedDistrict={selectedDistrict}
              onSelectDistrict={(d) => {
                setSelectedDistrict(d);
                setIsPlaceManagerOpen(true);
              }}
            />
          </div>
        )}

        {currentView === 'list' && (
          <DistrictListView
            districts={districts}
            isAdmin={true}
            onSelectDistrict={(d) => {
              setSelectedDistrict(d);
              setIsPlaceManagerOpen(true);
            }}
            onToggleVisited={handleToggleVisited}
            onQuickAddPlace={(d) => {
              setSelectedDistrict(d);
              setIsPlaceManagerOpen(true);
            }}
          />
        )}
      </main>

      {/* Place Manager Modal */}
      <AdminPlaceManager
        district={selectedDistrict}
        isOpen={isPlaceManagerOpen}
        onClose={() => setIsPlaceManagerOpen(false)}
        onPlaceAdded={handlePlaceAdded}
        onPlaceUpdated={handlePlaceUpdated}
        onPlaceDeleted={handlePlaceDeleted}
        onNotesUpdated={handleNotesUpdated}
      />

      {/* Sticky Bottom Sync Status Bar */}
      {stats && (
        <AdminSyncBar
          isSaving={isSaving}
          totalVisited={stats.visitedDistricts}
          totalPlaces={stats.totalPlaces}
          onExport={handleExport}
          onImport={handleImport}
          onReset={handleReset}
        />
      )}

      {/* Share Modal */}
      {stats && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          stats={stats}
          districts={districts}
        />
      )}

      {/* Stats Modal */}
      {stats && (
        <StatsModal
          isOpen={isStatsModalOpen}
          onClose={() => setIsStatsModalOpen(false)}
          stats={stats}
          districts={districts}
        />
      )}
    </div>
  );
}
