import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { saveTrackerState } from '@/lib/storage';
import { isAuthenticatedAdmin } from '@/lib/auth';
import { bangkokDistrictsMeta, mergeDistrictState, calculateTrackerStats } from '@/lib/districts-data';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Admin password required.' }, { status: 401 });
    }

    const importedState = await req.json();

    if (!importedState || typeof importedState !== 'object' || !importedState.districts) {
      return NextResponse.json({ error: 'Invalid state format. "districts" object is missing.' }, { status: 400 });
    }

    await saveTrackerState(importedState);
    revalidateTag('districts-state');

    const fullDistricts = mergeDistrictState(bangkokDistrictsMeta, importedState);
    const stats = calculateTrackerStats(fullDistricts);

    return NextResponse.json({
      success: true,
      message: 'State imported successfully',
      districts: fullDistricts,
      stats
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Import failed', details: err.message }, { status: 500 });
  }
}
