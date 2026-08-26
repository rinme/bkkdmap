import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getUploadedImage } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  try {
    const slug = params.slug || [];
    if (slug.length === 0) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const filename = slug[slug.length - 1];
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '');

    // 1. Try local disk first if file exists (local dev / persistent storage)
    const uploadsBase = path.resolve(process.cwd(), 'public', 'uploads');
    const diskPath = path.resolve(uploadsBase, ...slug);

    if (diskPath.startsWith(uploadsBase) && fs.existsSync(diskPath)) {
      try {
        const fileBuffer = await fs.promises.readFile(diskPath);
        const ext = path.extname(diskPath).toLowerCase();
        const mimeType =
          ext === '.webp'
            ? 'image/webp'
            : ext === '.png'
            ? 'image/png'
            : ext === '.gif'
            ? 'image/gif'
            : ext === '.avif'
            ? 'image/avif'
            : 'image/jpeg';

        return new NextResponse(new Uint8Array(fileBuffer), {
          status: 200,
          headers: {
            'Content-Type': mimeType,
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      } catch {}
    }

    // 2. Fetch from Postgres / Memory Cache (Serverless Production on Vercel)
    const image = await getUploadedImage(sanitizedFilename);
    if (!image) {
      return new NextResponse('Image Not Found', { status: 404 });
    }

    return new NextResponse(new Uint8Array(image.buffer), {
      status: 200,
      headers: {
        'Content-Type': image.mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err: any) {
    console.error('Error serving upload image:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
