import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { resetTrackerState } from '@/lib/storage';
import { isAuthenticatedAdmin } from '@/lib/auth';
import { bangkokDistrictsMeta, mergeDistrictState, calculateTrackerStats } from '@/lib/districts-data';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const isAdmin = await isAuthenticatedAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Admin password required.' }, { status: 401 });
    }

    const resetState = await resetTrackerState();
    revalidateTag('districts-state');
    const fullDistricts = mergeDistrictState(bangkokDistrictsMeta, resetState);
    const stats = calculateTrackerStats(fullDistricts);

    return NextResponse.json({
      success: true,
      message: 'Tracker reset to default successfully',
      districts: fullDistricts,
      stats
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Reset failed', details: err.message }, { status: 500 });
  }
}
