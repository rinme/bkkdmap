import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { zipSync, strToU8 } from 'fflate';
import { getTrackerState } from '@/lib/storage';

export const dynamic = 'force-dynamic';

async function collectFilesRecursively(
  dir: string,
  baseDir: string = dir
): Promise<Array<{ relativePath: string; absolutePath: string }>> {
  const results: Array<{ relativePath: string; absolutePath: string }> = [];
  if (!fs.existsSync(dir)) return results;

  try {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const nested = await collectFilesRecursively(fullPath, baseDir);
        results.push(...nested);
      } else if (entry.isFile()) {
        const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
        results.push({ relativePath, absolutePath: fullPath });
      }
    }
  } catch (err) {
    console.warn('Error reading directory during export:', err);
  }

  return results;
}

export async function GET(req: NextRequest) {
  try {
    const state = await getTrackerState();
    const dateStr = new Date().toISOString().split('T')[0];
    const format = req.nextUrl.searchParams.get('format');

    // ZIP export handling (state JSON + public/uploads/ image files)
    if (format === 'zip') {
      const zipEntries: Record<string, Uint8Array> = {};

      // Add database state JSON
      zipEntries['bangkok-tracker-state.json'] = strToU8(JSON.stringify(state, null, 2));

      // Add uploaded images recursively
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      const uploadedFiles = await collectFilesRecursively(uploadsDir);

      for (const item of uploadedFiles) {
        try {
          const fileBuffer = await fs.promises.readFile(item.absolutePath);
          zipEntries[`uploads/${item.relativePath}`] = new Uint8Array(fileBuffer);
        } catch (readErr) {
          console.warn(`Could not read file for zip export: ${item.absolutePath}`, readErr);
        }
      }

      const zipped = zipSync(zipEntries, { level: 6 });
      const filename = `bangkok-district-tracker-backup-${dateStr}.zip`;

      return new NextResponse(Buffer.from(zipped), {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': zipped.byteLength.toString(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    // Default JSON export handling
    const filename = `bangkok-district-tracker-backup-${dateStr}.json`;

    return new NextResponse(JSON.stringify(state, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (err: any) {
    console.error('Export failed:', err);
    return NextResponse.json(
      { success: false, error: 'Export failed', details: err.message },
      { status: 500 }
    );
  }
}
