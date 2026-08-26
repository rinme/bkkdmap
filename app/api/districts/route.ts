import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { bangkokDistrictsMeta, bangkokZones, mergeDistrictState, calculateTrackerStats } from '@/lib/districts-data';
import {
  getTrackerState,
  toggleDistrictVisited,
  addPlaceToDistrict,
  updatePlaceInDistrict,
  deletePlaceFromDistrict,
  updateDistrictNotes,
  updateDistrictPhotos
} from '@/lib/storage';
import { isAuthenticatedAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const state = await getTrackerState();
    const fullDistricts = mergeDistrictState(bangkokDistrictsMeta, state);
    const stats = calculateTrackerStats(fullDistricts);

    return NextResponse.json({
      districts: fullDistricts,
      stats,
      zones: bangkokZones,
      lastUpdated: state.lastUpdated
    });
  } catch (err: any) {
    console.error('Error fetching districts:', err);
    return NextResponse.json(
      { error: 'Failed to fetch districts', details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin password required.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { action, districtId } = body;

    if (!districtId) {
      return NextResponse.json({ error: 'districtId is required' }, { status: 400 });
    }

    let updatedState;

    switch (action) {
      case 'toggle_visited': {
        const { isVisited } = body;
        updatedState = await toggleDistrictVisited(districtId, isVisited);
        break;
      }

      case 'add_place': {
        const { place } = body;
        if (!place || !place.name) {
          return NextResponse.json({ error: 'Place name is required' }, { status: 400 });
        }
        const res = await addPlaceToDistrict(districtId, place);
        updatedState = res.state;
        break;
      }

      case 'update_place': {
        const { placeId, placeData } = body;
        if (!placeId || !placeData) {
          return NextResponse.json({ error: 'placeId and placeData are required' }, { status: 400 });
        }
        updatedState = await updatePlaceInDistrict(districtId, placeId, placeData);
        break;
      }

      case 'delete_place': {
        const { placeId } = body;
        if (!placeId) {
          return NextResponse.json({ error: 'placeId is required' }, { status: 400 });
        }
        updatedState = await deletePlaceFromDistrict(districtId, placeId);
        break;
      }

      case 'update_notes': {
        const { notes } = body;
        updatedState = await updateDistrictNotes(districtId, notes || '');
        break;
      }

      case 'update_district_photos': {
        const { photos } = body;
        if (!Array.isArray(photos)) {
          return NextResponse.json({ error: 'photos must be an array' }, { status: 400 });
        }
        updatedState = await updateDistrictPhotos(districtId, photos);
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    // Invalidate server cache tag instantly
    revalidateTag('districts-state');

    const fullDistricts = mergeDistrictState(bangkokDistrictsMeta, updatedState);
    const stats = calculateTrackerStats(fullDistricts);

    return NextResponse.json({
      success: true,
      districts: fullDistricts,
      stats,
      lastUpdated: updatedState.lastUpdated
    });
  } catch (err: any) {
    console.error('Error modifying district data:', err);
    return NextResponse.json(
      { error: 'Failed to update district data', details: err.message },
      { status: 500 }
    );
  }
}
