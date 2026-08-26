import { AppSettings, DEFAULT_APP_SETTINGS } from './types';

export interface CompressedImageResult {
  file: File;
  blob: Blob;
  previewUrl: string;
  originalSize: number;
  compressedSize: number;
  savingsPercentage: number;
  width: number;
  height: number;
  format: string;
}

/**
 * Format bytes into human-readable string (e.g. 1.2 MB, 350 KB)
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B';
  if (!bytes || isNaN(bytes) || bytes < 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const safeI = Math.min(i, sizes.length - 1);

  return `${parseFloat((bytes / Math.pow(k, safeI)).toFixed(dm))} ${sizes[safeI]}`;
}

/**
 * Revoke object preview URLs to prevent browser memory leaks
 */
export function revokePreviewUrl(url?: string): void {
  if (!url || typeof window === 'undefined') return;
  if (url.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // Ignore cleanup error
    }
  }
}

/**
 * Checks if the browser canvas supports exporting to image/webp
 */
function isWebPSupported(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const testCanvas = document.createElement('canvas');
    testCanvas.width = 1;
    testCanvas.height = 1;
    const dataUrl = testCanvas.toDataURL('image/webp');
    return dataUrl.startsWith('data:image/webp');
  } catch {
    return false;
  }
}

/**
 * Loads an image file into an HTMLImageElement using an Object URL
 */
function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Image compression is only supported in browser environments.'));
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Failed to decode image file: ${file.name || 'unknown'}`));
    };

    img.src = objectUrl;
  });
}

/**
 * Asynchronously converts canvas element to Blob
 */
function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        mimeType,
        quality
      );
    } catch {
      resolve(null);
    }
  });
}

/**
 * Compresses an image file on the client using HTML5 Canvas API
 * Scales down dimensions if they exceed maxImageDimension
 * Iteratively decreases quality if file size exceeds maxImageSizeKb
 */
export async function compressImage(
  file: File,
  settings?: Partial<AppSettings>
): Promise<CompressedImageResult> {
  if (!file) {
    throw new Error('No file provided for compression.');
  }

  const config: AppSettings = {
    ...DEFAULT_APP_SETTINGS,
    ...settings,
  };

  const maxBytes = config.maxImageSizeKb * 1024;

  // Load image element to inspect dimensions
  const img = await loadImageElement(file);
  const origWidth = img.naturalWidth || img.width;
  const origHeight = img.naturalHeight || img.height;

  if (origWidth <= 0 || origHeight <= 0) {
    throw new Error('Image has invalid dimensions.');
  }

  // If autoCompress is disabled and image already satisfies size & dimension constraints
  if (
    !config.autoCompress &&
    file.size <= maxBytes &&
    origWidth <= config.maxImageDimension &&
    origHeight <= config.maxImageDimension
  ) {
    const previewUrl = URL.createObjectURL(file);
    return {
      file,
      blob: file,
      previewUrl,
      originalSize: file.size,
      compressedSize: file.size,
      savingsPercentage: 0,
      width: origWidth,
      height: origHeight,
      format: file.type || 'image/jpeg',
    };
  }

  // Calculate target dimensions preserving aspect ratio
  let targetWidth = origWidth;
  let targetHeight = origHeight;

  if (Math.max(origWidth, origHeight) > config.maxImageDimension) {
    if (origWidth >= origHeight) {
      targetWidth = config.maxImageDimension;
      targetHeight = Math.max(1, Math.round((origHeight * config.maxImageDimension) / origWidth));
    } else {
      targetHeight = config.maxImageDimension;
      targetWidth = Math.max(1, Math.round((origWidth * config.maxImageDimension) / origHeight));
    }
  }

  // Determine export MIME format (modern WebP preferred with JPEG fallback)
  let mimeType = isWebPSupported() ? 'image/webp' : 'image/jpeg';
  let currentQuality = Math.min(Math.max(config.imageQuality / 100, 0.1), 1.0);

  // Create working canvas and draw scaled image
  let workingCanvas = document.createElement('canvas');
  workingCanvas.width = targetWidth;
  workingCanvas.height = targetHeight;

  const ctx = workingCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to obtain 2D rendering context for image compression.');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  // Initial blob generation
  let blob = await canvasToBlob(workingCanvas, mimeType, currentQuality);

  // Fallback to JPEG if WebP blob generation failed
  if (!blob && mimeType !== 'image/jpeg') {
    mimeType = 'image/jpeg';
    blob = await canvasToBlob(workingCanvas, mimeType, currentQuality);
  }

  if (!blob) {
    throw new Error('Failed to encode canvas image to Blob.');
  }

  // Iterative quality reduction if file still exceeds max size target
  while (blob.size > maxBytes && currentQuality > 0.35) {
    currentQuality = Math.max(0.35, currentQuality - 0.1);
    const nextBlob = await canvasToBlob(workingCanvas, mimeType, currentQuality);
    if (nextBlob) {
      blob = nextBlob;
    } else {
      break;
    }
  }

  // Iterative dimensional downscaling if quality reduction alone was not enough
  let currentWidth = targetWidth;
  let currentHeight = targetHeight;
  let scaleAttempts = 0;

  while (blob.size > maxBytes && scaleAttempts < 3 && currentWidth > 400 && currentHeight > 400) {
    scaleAttempts++;
    currentWidth = Math.max(1, Math.round(currentWidth * 0.8));
    currentHeight = Math.max(1, Math.round(currentHeight * 0.8));

    const resizeCanvas = document.createElement('canvas');
    resizeCanvas.width = currentWidth;
    resizeCanvas.height = currentHeight;

    const rCtx = resizeCanvas.getContext('2d');
    if (rCtx) {
      rCtx.imageSmoothingEnabled = true;
      rCtx.imageSmoothingQuality = 'high';
      rCtx.drawImage(img, 0, 0, currentWidth, currentHeight);
      workingCanvas = resizeCanvas;

      const nextBlob = await canvasToBlob(workingCanvas, mimeType, currentQuality);
      if (nextBlob) {
        blob = nextBlob;
      }
    }
  }

  // If original file was already smaller and WebP format and within limits, keep original
  if (
    blob.size >= file.size &&
    file.type === mimeType &&
    origWidth <= config.maxImageDimension &&
    origHeight <= config.maxImageDimension
  ) {
    const previewUrl = URL.createObjectURL(file);
    return {
      file,
      blob: file,
      previewUrl,
      originalSize: file.size,
      compressedSize: file.size,
      savingsPercentage: 0,
      width: origWidth,
      height: origHeight,
      format: file.type,
    };
  }

  // Generate appropriate output filename with updated extension
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const extension = mimeType === 'image/webp' ? '.webp' : '.jpg';
  const finalFileName = `${baseName}${extension}`;

  const compressedFile = new File([blob], finalFileName, {
    type: mimeType,
    lastModified: Date.now(),
  });

  const previewUrl = URL.createObjectURL(blob);
  const originalSize = file.size;
  const compressedSize = blob.size;
  const savingsPercentage =
    originalSize > compressedSize
      ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
      : 0;

  return {
    file: compressedFile,
    blob,
    previewUrl,
    originalSize,
    compressedSize,
    savingsPercentage,
    width: currentWidth,
    height: currentHeight,
    format: mimeType,
  };
}
