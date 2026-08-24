import { NextResponse } from 'next/server';
import { getTrackerState } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const state = await getTrackerState();
    const filename = `bangkok-district-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;

    return new NextResponse(JSON.stringify(state, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Export failed', details: err.message }, { status: 500 });
  }
}
