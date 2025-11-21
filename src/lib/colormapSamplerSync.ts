/**
 * Synchronous fallback for Colormap Sampling
 *
 * Used when Web Worker fails to initialize.
 * Contains identical logic to the worker.
 */

import type { SampleRequest, SampleResult, ColormapColor } from '@/workers/colormapSampler.worker';

/**
 * Cache for loaded colormap image data
 */
const colormapCache = new Map<string, ImageData>();

/**
 * Load a colormap image and extract its pixel data
 */
async function loadColormapImageData(url: string): Promise<ImageData> {
  // Check cache first
  const cached = colormapCache.get(url);
  if (cached) {
    return cached;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Cache the result
        colormapCache.set(url, imageData);
        resolve(imageData);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error(`Failed to load colormap: ${url}`));
    };

    img.src = url;
  });
}

/**
 * Sample a color from colormap image data at specific coordinates
 */
function sampleColorFromImageData(
  imageData: ImageData,
  x: number,
  y: number,
): ColormapColor {
  // Clamp coordinates to image bounds
  const clampedX = Math.max(0, Math.min(imageData.width - 1, Math.floor(x)));
  const clampedY = Math.max(0, Math.min(imageData.height - 1, Math.floor(y)));

  const index = (clampedY * imageData.width + clampedX) * 4;

  return {
    r: imageData.data[index],
    g: imageData.data[index + 1],
    b: imageData.data[index + 2],
  };
}

/**
 * Sample colors from both colormaps at given coordinates (synchronous version)
 */
export async function sampleBatchSync(
  grassColormapUrl: string | null,
  foliageColormapUrl: string | null,
  coordinates: SampleRequest[],
): Promise<SampleResult[]> {
  // Load both colormaps once
  const grassImageData = grassColormapUrl
    ? await loadColormapImageData(grassColormapUrl).catch((error) => {
        console.error('[ColormapSamplerSync] Failed to load grass colormap:', error);
        return null;
      })
    : null;

  const foliageImageData = foliageColormapUrl
    ? await loadColormapImageData(foliageColormapUrl).catch((error) => {
        console.error('[ColormapSamplerSync] Failed to load foliage colormap:', error);
        return null;
      })
    : null;

  // Sample all coordinates
  return coordinates.map(({ x, y }) => {
    const grassColor = grassImageData
      ? sampleColorFromImageData(grassImageData, x, y)
      : null;

    const foliageColor = foliageImageData
      ? sampleColorFromImageData(foliageImageData, x, y)
      : null;

    return { grassColor, foliageColor };
  });
}

/**
 * Clear the colormap cache
 */
export function clearColormapCacheSync(): void {
  colormapCache.clear();
}
