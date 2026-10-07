/**
 * Utility for in-browser client-side image compression and resizing via HTML5 Canvas.
 * Prevents oversized base64 payloads, speeds up uploads, and eliminates Vercel / Next.js
 * payload size limit issues (4.5 MB limit).
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0 (default: 0.8)
  mimeType?: 'image/jpeg' | 'image/webp' | 'image/png';
}

export interface CompressResult {
  dataUrl: string;
  file?: File;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
  compressionRatio: string;
}

/**
 * Resizes and compresses an image File or Blob in the browser using HTML5 Canvas.
 * Returns compressed base64 data URL and metadata.
 */
export async function compressImageToDataUrl(
  file: File | Blob,
  options: CompressOptions = {}
): Promise<CompressResult> {
  const {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.8,
    mimeType = 'image/jpeg',
  } = options;

  const originalSize = file.size;

  // If not an image (e.g. PDF), convert directly to standard base64 without canvas
  if ('type' in file && file.type && !file.type.startsWith('image/')) {
    const dataUrl = await readFileAsDataUrl(file);
    return {
      dataUrl,
      width: 0,
      height: 0,
      originalSize,
      compressedSize: dataUrl.length,
      compressionRatio: '100%',
    };
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let originWidth = img.naturalWidth || img.width;
      let originHeight = img.naturalHeight || img.height;

      if (originWidth === 0 || originHeight === 0) {
        // Fallback to basic file read
        readFileAsDataUrl(file).then((dataUrl) => {
          resolve({
            dataUrl,
            width: originWidth,
            height: originHeight,
            originalSize,
            compressedSize: dataUrl.length,
            compressionRatio: '100%',
          });
        });
        return;
      }

      // Calculate scaled dimensions keeping aspect ratio
      let targetWidth = originWidth;
      let targetHeight = originHeight;

      if (targetWidth > maxWidth || targetHeight > maxHeight) {
        const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
        targetWidth = Math.round(targetWidth * ratio);
        targetHeight = Math.round(targetHeight * ratio);
      }

      // Create in-memory canvas
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d', { alpha: mimeType === 'image/png' });
      if (!ctx) {
        reject(new Error('Canvas 2D context tidak tersedia'));
        return;
      }

      // Enable high-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Fill white background for JPEG to prevent black background on transparent PNGs
      if (mimeType === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }

      // Draw resized image
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Export compressed base64
      const targetMime = mimeType;
      const dataUrl = canvas.toDataURL(targetMime, quality);

      // Calculate approximate size in bytes from base64 string
      const base64Length = dataUrl.length - (dataUrl.indexOf(',') + 1);
      const compressedSize = Math.round((base64Length * 3) / 4);
      const ratio = originalSize > 0 
        ? `${Math.round((compressedSize / originalSize) * 100)}%` 
        : '100%';

      resolve({
        dataUrl,
        width: targetWidth,
        height: targetHeight,
        originalSize,
        compressedSize,
        compressionRatio: ratio,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      // Fallback if image decode fails
      readFileAsDataUrl(file).then((dataUrl) => {
        resolve({
          dataUrl,
          width: 0,
          height: 0,
          originalSize,
          compressedSize: dataUrl.length,
          compressionRatio: '100%',
        });
      }).catch(reject);
    };

    img.src = objectUrl;
  });
}

/**
 * Resizes and compresses an image File, returning a new lightweight File object.
 * Ready for FormData / Supabase Storage uploads.
 */
export async function compressImageToFile(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  // If not an image, return original file
  if (!file.type || !file.type.startsWith('image/')) {
    return file;
  }

  const { dataUrl } = await compressImageToDataUrl(file, options);
  const blob = dataUrlToBlob(dataUrl);

  const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  const newName = `${baseName}.jpg`;

  return new File([blob], newName, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
}

/**
 * Helper to convert Base64 Data URL to Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const byteString = atob(parts[1]);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }

  return new Blob([uint8Array], { type: mime });
}

/**
 * Helper to read non-image File as Base64 Data URL
 */
function readFileAsDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsDataURL(file);
  });
}
