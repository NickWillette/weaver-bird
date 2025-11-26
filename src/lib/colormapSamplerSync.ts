/**
 * Synchronous fallback for Colormap Sampling
 *
 * Used when Web Worker fails to initialize.
 * Contains identical logic to the worker.
 */

import {
  loadColormapImageData,
  sampleColorFromImageData,
  clearColormapCache,
  type SampleRequest,
  type SampleResult,
  type ColormapColor,
} from "./utils/colormap";

export type { SampleRequest, SampleResult, ColormapColor };

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
      console.error("[ColormapSamplerSync] Failed to load grass colormap:", error);
      return null;
    })
    : null;

  const foliageImageData = foliageColormapUrl
    ? await loadColormapImageData(foliageColormapUrl).catch((error) => {
      console.error("[ColormapSamplerSync] Failed to load foliage colormap:", error);
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
  clearColormapCache();
}
