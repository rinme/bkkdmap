import { NextRequest, NextResponse } from 'next/server';
import { getAppSettings, saveAppSettings } from '@/lib/storage';
import { verifyAdminToken } from '@/lib/auth';
import { AppSettings } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getAppSettings();
    return NextResponse.json({
      success: true,
      settings
    });
  } catch (err: any) {
    console.error('Error fetching settings:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings', details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await verifyAdminToken(req);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin password required.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const updates: Partial<AppSettings> = {};

    if (typeof body.maxImageSizeKb === 'number' && body.maxImageSizeKb > 0) {
      updates.maxImageSizeKb = Math.min(Math.max(Math.round(body.maxImageSizeKb), 50), 51200); // 50KB - 50MB
    }

    if (typeof body.maxImageDimension === 'number' && body.maxImageDimension > 0) {
      updates.maxImageDimension = Math.min(Math.max(Math.round(body.maxImageDimension), 320), 7680); // 320px - 7680px
    }

    if (typeof body.imageQuality === 'number' && body.imageQuality > 0) {
      updates.imageQuality = Math.min(Math.max(Math.round(body.imageQuality), 10), 100); // 10% - 100%
    }

    if (typeof body.autoCompress === 'boolean') {
      updates.autoCompress = body.autoCompress;
    }

    if (Array.isArray(body.allowedMimeTypes)) {
      const validMimes = body.allowedMimeTypes.filter(
        (m: unknown): m is string => typeof m === 'string' && m.startsWith('image/')
      );
      if (validMimes.length > 0) {
        updates.allowedMimeTypes = validMimes;
      }
    }

    const updatedSettings = await saveAppSettings(updates);

    return NextResponse.json({
      success: true,
      settings: updatedSettings
    });
  } catch (err: any) {
    console.error('Error updating settings:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings', details: err.message },
      { status: 500 }
    );
  }
}
