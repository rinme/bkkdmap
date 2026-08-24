'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { FullDistrict, TrackerStats, ViewMode, Place } from '@/lib/types';
import { calculateTrackerStats } from '@/lib/districts-data';
import { Header } from '@/components/Header';
import { BangkokMap } from '@/components/map/BangkokMap';
import { DistrictListView } from '@/components/district-list/DistrictListView';
import { AdminPlaceManager } from '@/components/admin/AdminPlaceManager';
import { AdminSyncBar } from '@/components/admin/AdminSyncBar';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';
import { ShareModal } from '@/components/ShareModal';
import { StatsModal } from '@/components/StatsModal';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

interface AuthResponse {
  authenticated: boolean;
  role: 'admin' | 'guest';
}

interface DistrictsApiResponse {
  districts: FullDistrict[];
  stats: TrackerStats;
  zones?: any;
  lastUpdated?: string;
  success?: boolean;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed request');
  }
  return res.json();
};

export default function AdminPage() {
  const [isSaving, setIsSaving] = useState(false);

  // Authentication State via SWR
  const {
    data: authData,
    isLoading: authLoading,
    mutate: mutateAuth
  } = useSWR<AuthResponse>('/api/auth/me', fetcher);

  const isAuthenticated = authData?.authenticated ?? false;

  // Districts Data via SWR (only fetched when authenticated)
  const {
    data,
    isLoading: dataLoading,
    mutate: mutateDistricts
  } = useSWR<DistrictsApiResponse>(
    isAuthenticated ? '/api/districts' : null,
    fetcher,
    { revalidateOnFocus: true }
  );

  const districts = data?.districts ?? [];
  const stats = data?.stats ?? null;

  // Modals and Active District
  const [currentView, setCurrentView] = useState<ViewMode>('list');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);
  const [isPlaceManagerOpen, setIsPlaceManagerOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  const selectedDistrict = districts.find((d) => d.id === selectedDistrictId) || null;

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    await mutateAuth({ authenticated: false, role: 'guest' }, { revalidate: false });
  };

  // Mutating Actions with 0ms Optimistic UI Updates & Clean Rollback on Error
  const handleToggleVisited = async (district: FullDistrict) => {
    if (!data) return;
    setIsSaving(true);

    const updatedDistricts = data.districts.map((d) => {
      if (d.id === district.id) {
        return {
          ...d,
          isVisited: !district.isVisited
        };
      }
      return d;
    });
    const updatedStats = calculateTrackerStats(updatedDistricts);
    const optimisticData: DistrictsApiResponse = {
      ...data,
      districts: updatedDistricts,
      stats: updatedStats
    };

    try {
      await mutateDistricts(
        async () => {
          const res = await fetch('/api/districts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'toggle_visited',
              districtId: district.id,
              isVisited: !district.isVisited
            })
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || 'Failed to toggle visited');
          }
          return await res.json();
        },
        {
          optimisticData,
          rollbackOnError: true,
          populateCache: true,
          revalidate: false
        }
      );
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePlaceAdded = async (districtId: string, place: Omit<Place, 'id'>) => {
    if (!data) return;
    setIsSaving(true);

    const tempPlace: Place = {
      ...place,
      id: `temp-${Date.now()}`
    };
    const updatedDistricts = data.districts.map((d) => {
      if (d.id === districtId) {
        const newPlaces = [...(d.visitedPlaces || []), tempPlace];
        return {
          ...d,
          isVisited: true,
          visitedPlaces: newPlaces,
          placeCount: newPlaces.length
        };
      }
      return d;
    });
    const updatedStats = calculateTrackerStats(updatedDistricts);
    const optimisticData: DistrictsApiResponse = {
      ...data,
      districts: updatedDistricts,
      stats: updatedStats
    };

    try {
      await mutateDistricts(
        async () => {
          const res = await fetch('/api/districts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'add_place',
              districtId,
              place
            })
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || 'Failed to add place');
          }
          return await res.json();
        },
        {
          optimisticData,
          rollbackOnError: true,
          populateCache: true,
          revalidate: false
        }
      );
    } catch (err: any) {
      alert(err.message || 'Error adding place');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePlaceUpdated = async (districtId: string, placeId: string, placeData: Partial<Place>) => {
    if (!data) return;
    setIsSaving(true);

    const updatedDistricts = data.districts.map((d) => {
      if (d.id === districtId) {
        const newPlaces = (d.visitedPlaces || []).map((p) =>
          p.id === placeId ? { ...p, ...placeData } : p
        );
        return {
          ...d,
          visitedPlaces: newPlaces,
          placeCount: newPlaces.length
        };
      }
      return d;
    });
    const updatedStats = calculateTrackerStats(updatedDistricts);
    const optimisticData: DistrictsApiResponse = {
      ...data,
      districts: updatedDistricts,
      stats: updatedStats
    };

    try {
      await mutateDistricts(
        async () => {
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
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || 'Failed to update place');
          }
          return await res.json();
        },
        {
          optimisticData,
          rollbackOnError: true,
          populateCache: true,
          revalidate: false
        }
      );
    } catch (err: any) {
      alert(err.message || 'Error updating place');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePlaceDeleted = async (districtId: string, placeId: string) => {
    if (!confirm('Are you sure you want to delete this place?')) return;
    if (!data) return;
    setIsSaving(true);

    const updatedDistricts = data.districts.map((d) => {
      if (d.id === districtId) {
        const newPlaces = (d.visitedPlaces || []).filter((p) => p.id !== placeId);
        return {
          ...d,
          isVisited: newPlaces.length > 0 ? true : d.isVisited,
          visitedPlaces: newPlaces,
          placeCount: newPlaces.length
        };
      }
      return d;
    });
    const updatedStats = calculateTrackerStats(updatedDistricts);
    const optimisticData: DistrictsApiResponse = {
      ...data,
      districts: updatedDistricts,
      stats: updatedStats
    };

    try {
      await mutateDistricts(
        async () => {
          const res = await fetch('/api/districts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'delete_place',
              districtId,
              placeId
            })
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || 'Failed to delete place');
          }
          return await res.json();
        },
        {
          optimisticData,
          rollbackOnError: true,
          populateCache: true,
          revalidate: false
        }
      );
    } catch (err: any) {
      alert(err.message || 'Error deleting place');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotesUpdated = async (districtId: string, notes: string) => {
    if (!data) return;
    setIsSaving(true);

    const updatedDistricts = data.districts.map((d) => {
      if (d.id === districtId) {
        return {
          ...d,
          generalNotes: notes
        };
      }
      return d;
    });
    const updatedStats = calculateTrackerStats(updatedDistricts);
    const optimisticData: DistrictsApiResponse = {
      ...data,
      districts: updatedDistricts,
      stats: updatedStats
    };

    try {
      await mutateDistricts(
        async () => {
          const res = await fetch('/api/districts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'update_notes',
              districtId,
              notes
            })
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || 'Failed to update notes');
          }
          return await res.json();
        },
        {
          optimisticData,
          rollbackOnError: true,
          populateCache: true,
          revalidate: false
        }
      );
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
        const resData = await res.json();
        if (res.ok && resData.success) {
          await mutateDistricts(resData, { revalidate: true });
          alert('Backup state restored successfully!');
        } else {
          alert(resData.error || 'Import failed');
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
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Reset failed');
      }
      const resData = await res.json();
      if (resData.success) {
        await mutateDistricts(resData, { revalidate: true });
        alert('Data reset to default.');
      }
    } catch (err: any) {
      alert(err.message || 'Reset failed');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#060913] flex flex-col items-center justify-center p-4 text-white text-center">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 animate-pulse shadow-glow-emerald">
          <ShieldCheck className="w-8 h-8 animate-spin" style={{ animationDuration: '4s' }} />
        </div>
        <p className="text-sm font-bold tracking-tight">Authenticating Admin Session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#060913] flex flex-col items-center justify-center p-4">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors bg-[#0c1322] px-4 py-2 rounded-2xl border border-white/[0.08]"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          Back to Public Tracker
        </Link>
        <AdminLoginForm onSuccess={() => mutateAuth()} />
      </div>
    );
  }

  if (dataLoading && !data) {
    return (
      <div className="min-h-screen bg-[#060913] flex flex-col items-center justify-center p-4 text-white text-center">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 animate-pulse shadow-glow-emerald">
          <ShieldCheck className="w-8 h-8 animate-spin" style={{ animationDuration: '4s' }} />
        </div>
        <p className="text-sm font-bold tracking-tight">Loading Bangkok District Data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-slate-100 pb-24">
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
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Admin Mode Active — Tap checkmark to toggle visit status, or tap district to edit places directly.</span>
          </div>
          <Link
            href="/"
            className="font-bold underline hover:text-white transition-colors ml-4 whitespace-nowrap"
          >
            Public View →
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-3 sm:pt-5 pb-12 space-y-6">
        {currentView === 'map' && (
          <div className="space-y-4">
            <BangkokMap
              districts={districts}
              selectedDistrict={selectedDistrict}
              onSelectDistrict={(d) => {
                setSelectedDistrictId(d.id);
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
              setSelectedDistrictId(d.id);
              setIsPlaceManagerOpen(true);
            }}
            onToggleVisited={handleToggleVisited}
            onQuickAddPlace={(d) => {
              setSelectedDistrictId(d.id);
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

