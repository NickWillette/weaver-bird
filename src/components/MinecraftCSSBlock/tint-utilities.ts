import { getFoliageColorForBiome } from "@lib/biomeColors";
import { tintTexture, type TintColor } from "@lib/textureColorization";
import type { RenderedElement } from "./types";

/**
 * Checks if a block needs grass tinting based on its asset ID
 */
export function checkNeedsGrassTint(assetId: string): boolean {
    return (
        assetId.includes("grass") ||
        assetId.includes("fern") ||
        assetId.includes("tall_grass") ||
        assetId.includes("sugar_cane")
    );
}

/**
 * Checks if a block needs foliage tinting based on its asset ID
 */
export function checkNeedsFoliageTint(assetId: string): boolean {
    return assetId.includes("leaves") || assetId.includes("vine");
}

/**
 * Resolves the grass color to use
 */
export function resolveGrassColor(
    selectedGrassColor: TintColor | undefined,
): TintColor {
    if (selectedGrassColor) {
        return selectedGrassColor;
    }
    // Default grass color if none selected
    return { r: 127, g: 204, b: 25 };
}

/**
 * Resolves the foliage color to use
 */
export function resolveFoliageColor(
    selectedFoliageColor: TintColor | undefined,
    selectedBiomeId: string | undefined,
): TintColor {
    if (selectedFoliageColor) {
        return selectedFoliageColor;
    }
    if (selectedBiomeId) {
        return getFoliageColorForBiome(selectedBiomeId);
    }
    // Default foliage color
    return getFoliageColorForBiome("plains");
}

/**
 * Processes rendered elements to apply tinting to textures
 * Returns a map of original texture URL -> tinted texture URL
 */
export async function getTintedTextures(
    renderedElements: RenderedElement[],
    grassColor: TintColor | null,
    foliageColor: TintColor | null,
): Promise<Map<string, string>> {
    const newTintedTextures = new Map<string, string>();

    // Collect all unique texture URLs that need tinting, grouped by type
    const grassTextures = new Set<string>();
    const foliageTextures = new Set<string>();

    for (const element of renderedElements) {
        for (const face of element.faces) {
            if (face.tintType === "grass" && face.textureUrl) {
                grassTextures.add(face.textureUrl);
            } else if (face.tintType === "foliage" && face.textureUrl) {
                foliageTextures.add(face.textureUrl);
            }
        }
    }

    if (grassTextures.size === 0 && foliageTextures.size === 0) {
        return newTintedTextures;
    }

    console.log(
        "[MinecraftCSSBlock] Tinting",
        grassTextures.size,
        "grass textures with color",
        grassColor,
        "and",
        foliageTextures.size,
        "foliage textures with color",
        foliageColor,
    );

    // Tint grass textures
    if (grassColor) {
        for (const textureUrl of grassTextures) {
            try {
                const tintedUrl = await tintTexture(textureUrl, grassColor);
                newTintedTextures.set(textureUrl, tintedUrl);
            } catch (error) {
                console.error(
                    "[MinecraftCSSBlock] Failed to tint grass texture:",
                    error,
                );
                newTintedTextures.set(textureUrl, textureUrl);
            }
        }
    }

    // Tint foliage textures
    if (foliageColor) {
        for (const textureUrl of foliageTextures) {
            try {
                const tintedUrl = await tintTexture(textureUrl, foliageColor);
                newTintedTextures.set(textureUrl, tintedUrl);
            } catch (error) {
                console.error(
                    "[MinecraftCSSBlock] Failed to tint foliage texture:",
                    error,
                );
                newTintedTextures.set(textureUrl, textureUrl);
            }
        }
    }

    return newTintedTextures;
}
