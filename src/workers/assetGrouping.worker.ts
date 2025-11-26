/**
 * Web Worker for Asset Variant Grouping
 *
 * Handles CPU-intensive asset grouping and name beautification processing.
 * Runs off the main thread to keep UI responsive during pagination and search.
 *
 * Expected performance gain: ~30-50ms saved per operation
 */

import {
  beautifyAssetName,
  getVariantGroupKey,
  isNumberedVariant,
} from "@/lib/assetUtils";

// Define message types for type safety
export interface WorkerRequest {
  id: string;
  assetIds: string[];
}

export interface AssetGroup {
  baseId: string; // The primary/base asset ID (without number suffix)
  variantIds: string[]; // All variants including the base
  displayName: string; // Pre-computed beautified name
}

export interface WorkerResponse {
  id: string;
  groups: AssetGroup[];
}

/**
 * Group assets by their variant group key
 * Returns an array of asset groups with pre-computed display names
 */
function groupAssetsByVariant(assetIds: string[]): AssetGroup[] {
  const groups = new Map<string, string[]>();

  // Group all assets by their variant group key
  for (const assetId of assetIds) {
    const groupKey = getVariantGroupKey(assetId);
    const existing = groups.get(groupKey) || [];
    existing.push(assetId);
    groups.set(groupKey, existing);
  }

  // Convert to array of AssetGroup objects
  const result: AssetGroup[] = [];
  for (const [baseId, variantIds] of groups.entries()) {
    // Sort variants: base first (no number), then by number
    const sorted = variantIds.sort((a, b) => {
      const structuralPriority = (id: string) => {
        if (/_bottom|_lower|_foot/.test(id)) return 0;
        if (/_top|_upper|_head/.test(id)) return 1;
        return 0;
      };

      const aStructural = structuralPriority(a);
      const bStructural = structuralPriority(b);
      if (aStructural !== bStructural) {
        return aStructural - bStructural;
      }

      const aIsNumbered = isNumberedVariant(a);
      const bIsNumbered = isNumberedVariant(b);

      if (!aIsNumbered && bIsNumbered) return -1;
      if (aIsNumbered && !bIsNumbered) return 1;

      // Both are numbered, sort numerically
      const aNum = parseInt(a.match(/(\d+)$/)?.[1] || "0");
      const bNum = parseInt(b.match(/(\d+)$/)?.[1] || "0");
      return aNum - bNum;
    });

    // Pre-compute the display name for the base ID
    const displayName = beautifyAssetName(baseId);

    result.push({ baseId, variantIds: sorted, displayName });
  }

  return result;
}

// Worker message handler
self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { id, assetIds } = event.data;

  try {
    // Do the heavy work - group assets and compute display names
    const groups = groupAssetsByVariant(assetIds);

    // Send result back to main thread
    const response: WorkerResponse = { id, groups };
    self.postMessage(response);
  } catch (error) {
    console.error("[AssetGroupingWorker] Error:", error);
    // Send empty result on error
    self.postMessage({ id, groups: [] });
  }
};
