/**
 * Asset type detection utilities
 * Extracts common logic for determining asset types
 */

export function isPainting(assetId: string | undefined): boolean {
    if (!assetId) return false;
    const path = assetId.includes(":") ? assetId.split(":")[1] : assetId;
    return path.startsWith("painting/");
}

export function isPotteryShard(assetId: string | undefined): boolean {
    if (!assetId) return false;
    const path = assetId.includes(":") ? assetId.split(":")[1] : assetId;
    return path.startsWith("item/pottery_shard_");
}

export function isDecoratedPot(assetId: string | undefined): boolean {
    if (!assetId) return false;
    const path = assetId.includes(":") ? assetId.split(":")[1] : assetId;
    return path === "block/decorated_pot";
}

export function isEntityDecoratedPot(assetId: string | undefined): boolean {
    if (!assetId) return false;
    const path = assetId.includes(":") ? assetId.split(":")[1] : assetId;
    return path.startsWith("entity/decorated_pot/");
}

/**
 * Determines default tab based on asset characteristics
 */
export function getDefaultTab(flags: {
    shouldShowPotteryShardTab: boolean;
    shouldShowEntityDecoratedPotTab: boolean;
    shouldShowDecoratedPotTab: boolean;
    shouldShowPaintingTab: boolean;
    shouldShowItemTab: boolean;
    shouldShowBlockStateTab: boolean;
    shouldShowCompatibilityCheckbox: boolean;
}): string {
    if (flags.shouldShowPotteryShardTab) return "pottery-shard";
    if (flags.shouldShowEntityDecoratedPotTab) return "entity-pot";
    if (flags.shouldShowDecoratedPotTab) return "decorated-pot";
    if (flags.shouldShowPaintingTab) return "painting";
    if (flags.shouldShowItemTab) return "item";
    if (flags.shouldShowBlockStateTab) return "block-state";
    if (flags.shouldShowCompatibilityCheckbox) return "compatibility";
    return "advanced";
}
