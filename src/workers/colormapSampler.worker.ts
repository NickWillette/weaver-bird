/**
 * Web Worker for Colormap Sampling (Batch)
 *
 * Handles CPU-intensive colormap sampling operations.
 * Loads colormap images and samples multiple coordinates in batches.
 * Runs off the main thread to keep UI responsive.
 */

export interface ColormapColor {
  r: number;
  g: number;
  b: number;
}

export interface SampleRequest {
  x: number;
  y: number;
}

export interface SampleResult {
  grassColor: ColormapColor | null;
  foliageColor: ColormapColor | null;
}

export interface WorkerRequest {
  id: string;
  grassColormapUrl: string | null;
  foliageColormapUrl: string | null;
  coordinates: SampleRequest[];
}

export interface WorkerResponse {
  id: string;
  results: SampleResult[];
}

/**
 * Cache for loaded colormap image data in the worker
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
        // Workers have access to OffscreenCanvas (modern browsers)
        // Fallback to regular Canvas for older browsers
        const canvas = typeof OffscreenCanvas !== 'undefined'
          ? new OffscreenCanvas(img.width, img.height)
          : document.createElement('canvas');

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
 * Sample colors from both colormaps at given coordinates
 */
async function sampleBatch(
  grassColormapUrl: string | null,
  foliageColormapUrl: string | null,
  coordinates: SampleRequest[],
): Promise<SampleResult[]> {
  // Load both colormaps once
  const grassImageData = grassColormapUrl
    ? await loadColormapImageData(grassColormapUrl).catch((error) => {
        console.error('[ColormapWorker] Failed to load grass colormap:', error);
        return null;
      })
    : null;

  const foliageImageData = foliageColormapUrl
    ? await loadColormapImageData(foliageColormapUrl).catch((error) => {
        console.error('[ColormapWorker] Failed to load foliage colormap:', error);
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
 * Worker message handler
 */
self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { id, grassColormapUrl, foliageColormapUrl, coordinates } = event.data;

  try {
    const results = await sampleBatch(
      grassColormapUrl,
      foliageColormapUrl,
      coordinates,
    );

    const response: WorkerResponse = { id, results };
    self.postMessage(response);
  } catch (error) {
    console.error('[ColormapWorker] Error:', error);
    // Send empty results on error
    const response: WorkerResponse = {
      id,
      results: coordinates.map(() => ({
        grassColor: null,
        foliageColor: null,
      })),
    };
    self.postMessage(response);
  }
};
