/**
 * Synchronous fallback for Asset Variant Grouping
 *
 * Used when Web Worker fails to initialize.
 * Contains identical logic to the worker.
 */

import {
  groupAssetsByVariant,
  type AssetGroup,
} from "./utils/assetGrouping";

export type { AssetGroup };

/**
 * Group assets by their variant group key (synchronous version)
 * Returns an array of asset groups with pre-computed display names
 */
export function groupAssetsSync(assetIds: string[]): AssetGroup[] {
  return groupAssetsByVariant(assetIds);
}
