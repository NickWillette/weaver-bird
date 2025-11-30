import type { ModelElement } from "@lib/tauri/blockModels";

/**
 * Checks if a block should use its 2D item icon instead of 3D block model
 * (e.g., doors, beds use pre-rendered 2D icons in inventory)
 */
export function shouldUse2DItemIcon(assetId: string): boolean {
    const path = assetId.toLowerCase();

    // Doors should use item icons (except trapdoors which are fine as 3D)
    if (path.includes("door") && !path.includes("trapdoor")) {
        return true;
    }

    // Beds should use item icons
    if (path.includes("bed") && !path.includes("bedrock")) {
        return true;
    }

    return false;
}

/**
 * Converts a block asset ID to its corresponding item asset ID
 * Example: "minecraft:block/oak_door" -> "minecraft:item/oak_door"
 */
export function getItemAssetId(blockAssetId: string): string {
    // Extract namespace and block name
    const match = blockAssetId.match(/^([^:]*:)?block\/(.+)$/);
    if (!match) return blockAssetId;

    const namespace = match[1] || "minecraft:";
    let itemName = match[2];

    // Remove block-specific suffixes like _top, _bottom, etc.
    itemName = itemName.replace(/_(top|bottom|upper|lower|head|foot)$/, "");

    return `${namespace}item/${itemName}`;
}

/**
 * For leaves blocks, try to get the colored inventory variant texture ID
 * Example: "minecraft:block/acacia_leaves" -> "minecraft:block/acacia_leaves_inventory"
 */
export function getLeavesInventoryTextureId(textureId: string): string {
    if (textureId.includes("leaves") && !textureId.includes("_inventory")) {
        // Try to add _inventory suffix (or _bushy_inventory for bushy variants)
        if (textureId.includes("_bushy")) {
            return textureId.replace("_bushy", "_bushy_inventory");
        }
        return `${textureId}_inventory`;
    }
    return textureId;
}

/**
 * Checks if a block model is suitable for 3D isometric rendering.
 * Returns false for cross-shaped models (plants, flowers), which should use 2D.
 */
export function isSuitableFor3D(elements: ModelElement[]): boolean {
    if (elements.length === 0) return false;

    // Check if any element has the faces we need for isometric view
    let hasIsometricFaces = false;

    for (const element of elements) {
        const { faces } = element;
        // We need at least up OR (south AND east) for a reasonable 3D render
        if (faces.up || (faces.south && faces.east)) {
            hasIsometricFaces = true;
            break;
        }
    }

    if (!hasIsometricFaces) return false;

    // Check for cross-shaped models (typically have diagonal rotated elements)
    // Cross models usually have elements rotated 45 degrees
    for (const element of elements) {
        if (element.rotation && Math.abs(element.rotation.angle) === 45) {
            return false;
        }
    }

    return true;
}

/**
 * Creates a default full-block element for simple blocks without elements array
 */
export function createDefaultElement(
    textures: Record<string, string>,
): ModelElement[] {
    // Resolve default textures for each face
    const allTexture =
        textures.all || textures.particle || Object.values(textures)[0] || "";
    const topTexture = textures.up || textures.top || textures.end || allTexture;
    const southTexture =
        textures.south || textures.north || textures.side || allTexture;
    const eastTexture =
        textures.east || textures.west || textures.side || allTexture;

    return [
        {
            from: [0, 0, 0],
            to: [16, 16, 16],
            faces: {
                up: {
                    texture: topTexture.startsWith("#")
                        ? topTexture
                        : `#${Object.keys(textures).find((k) => textures[k] === topTexture) || "all"}`,
                },
                south: {
                    texture: southTexture.startsWith("#")
                        ? southTexture
                        : `#${Object.keys(textures).find((k) => textures[k] === southTexture) || "all"}`,
                },
                east: {
                    texture: eastTexture.startsWith("#")
                        ? eastTexture
                        : `#${Object.keys(textures).find((k) => textures[k] === eastTexture) || "all"}`,
                },
            },
        },
    ];
}
