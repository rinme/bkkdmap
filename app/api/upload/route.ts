import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { verifyAdminToken } from '@/lib/auth';
import { getAppSettings, saveUploadedImage, deleteUploadedImage } from '@/lib/storage';

export const dynamic = 'force-dynamic';

function getFileExtension(file: File): string {
  const mimeMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/avif': 'avif',
    'image/gif': 'gif',
  };

  if (mimeMap[file.type]) {
    return mimeMap[file.type];
  }

  if (file.name) {
    const ext = path.extname(file.name).replace('.', '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (ext) return ext;
  }

  return 'webp';
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

    const formData = await req.formData();
    const rawDistrictId = formData.get('districtId');

    if (!rawDistrictId || typeof rawDistrictId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'districtId is required' },
        { status: 400 }
      );
    }

    // Sanitize districtId to strict alphanumeric and hyphen to prevent directory traversal
    const sanitizedDistrictId = rawDistrictId.toLowerCase().replace(/[^a-z0-9-]/g, '').trim();
    if (!sanitizedDistrictId) {
      return NextResponse.json(
        { success: false, error: 'Invalid districtId' },
        { status: 400 }
      );
    }

    // Collect all uploaded files (supports 'file' and 'files' fields)
    const files: File[] = [];
    const singleFile = formData.get('file');
    if (singleFile && singleFile instanceof File) {
      files.push(singleFile);
    }
    const multipleFiles = formData.getAll('files');
    for (const f of multipleFiles) {
      if (f instanceof File && !files.includes(f)) {
        files.push(f);
      }
    }
    const allFileEntries = formData.getAll('file');
    for (const f of allFileEntries) {
      if (f instanceof File && !files.includes(f)) {
        files.push(f);
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided for upload' },
        { status: 400 }
      );
    }

    const settings = await getAppSettings();
    const allowedMimeTypes = settings.allowedMimeTypes && settings.allowedMimeTypes.length > 0
      ? settings.allowedMimeTypes
      : ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

    // Allow generous limit on server side (at least 10MB or 2x setting limit) to avoid dropping pre-compressed images
    const maxServerSizeBytes = Math.max((settings.maxImageSizeKb || 1024) * 1024 * 2, 10 * 1024 * 1024);

    const uploadsBaseDir = path.resolve(process.cwd(), 'public', 'uploads');
    const targetDir = path.resolve(uploadsBaseDir, sanitizedDistrictId);

    // Verify sanitized target directory stays within public/uploads
    if (!targetDir.startsWith(uploadsBaseDir)) {
      return NextResponse.json(
        { success: false, error: 'Invalid destination directory' },
        { status: 400 }
      );
    }

    const uploadedResults: Array<{ url: string; filename: string; size: number }> = [];

    for (const file of files) {
      // Validate MIME type
      if (file.type && !allowedMimeTypes.includes(file.type)) {
        return NextResponse.json(
          {
            success: false,
            error: `MIME type '${file.type}' is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`
          },
          { status: 400 }
        );
      }

      // Validate File Size
      if (file.size > maxServerSizeBytes) {
        return NextResponse.json(
          {
            success: false,
            error: `File '${file.name}' exceeds maximum allowed size of ${Math.round(maxServerSizeBytes / 1024)} KB`
          },
          { status: 400 }
        );
      }

      const ext = getFileExtension(file);
      const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const filename = `${sanitizedDistrictId}-${uniqueSuffix}.${ext}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Persist to Postgres database & memory & disk
      await saveUploadedImage({
        districtId: sanitizedDistrictId,
        filename,
        mimeType: file.type || 'image/webp',
        buffer,
      });

      const url = `/uploads/${sanitizedDistrictId}/${filename}`;
      uploadedResults.push({
        url,
        filename,
        size: file.size
      });
    }

    // Return primary file info + full list if multiple
    const first = uploadedResults[0];
    return NextResponse.json({
      success: true,
      url: first.url,
      filename: first.filename,
      size: first.size,
      files: uploadedResults
    });
  } catch (err: any) {
    console.error('Upload handler error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to process upload', details: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const isAdmin = await verifyAdminToken(req);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin password required.' },
        { status: 401 }
      );
    }

    let targetUrl = req.nextUrl.searchParams.get('url');

    if (!targetUrl) {
      try {
        const body = await req.json();
        if (body && typeof body.url === 'string') {
          targetUrl = body.url;
        }
      } catch {}
    }

    if (!targetUrl || typeof targetUrl !== 'string') {
      return NextResponse.json(
        { success: false, error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    // Strict URL validation: must start with /uploads/ and contain no ..
    if (!targetUrl.startsWith('/uploads/') || targetUrl.includes('..')) {
      return NextResponse.json(
        { success: false, error: 'Invalid file URL' },
        { status: 400 }
      );
    }

    const filename = path.basename(targetUrl);
    await deleteUploadedImage(filename);

    const publicDir = path.resolve(process.cwd(), 'public');
    const uploadsDir = path.resolve(publicDir, 'uploads');
    const relativePath = targetUrl.replace(/^\/+/, '');
    const absolutePath = path.resolve(publicDir, relativePath);

    if (absolutePath.startsWith(uploadsDir)) {
      try {
        if (fs.existsSync(absolutePath)) {
          await fs.promises.unlink(absolutePath);
        }
      } catch (unlinkErr: any) {
        // Safe to ignore on serverless
      }
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (err: any) {
    console.error('Delete handler error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to delete file', details: err.message },
      { status: 500 }
    );
  }
}
