import { getBiome } from "@/components/BiomeColorCard/biomeData";
import { hexToRgb } from "@/constants/biomeCoordinates";

/**
 * Handles biome selection and updates global state accordingly.
 * Processes both coordinate-based biomes and noise biomes with hex colors.
 */
export function handleBiomeSelection(
    biomeId: string,
    setSelectedBiomeId: (id: string) => void,
    setColormapCoordinates: (coords: { x: number; y: number } | undefined) => void,
    setSelectedGrassColor: (color: { r: number; g: number; b: number } | undefined) => void,
    setSelectedFoliageColor: (color: { r: number; g: number; b: number } | undefined) => void,
): void {
    if (!biomeId) return; // Handle empty selection
    console.log("[BiomeSelector] Biome selected:", biomeId);

    const biome = getBiome(biomeId);
    if (!biome) {
        console.warn("[BiomeSelector] Biome not found:", biomeId);
        return;
    }

    // Store the user's exact biome selection
    setSelectedBiomeId(biomeId);

    // Handle coordinate-based biomes
    if (biome.coords) {
        setColormapCoordinates(biome.coords);
        setSelectedGrassColor(undefined);
        setSelectedFoliageColor(undefined);
        console.log("[BiomeSelector] Set coordinates:", biome.coords);
    }
    // Handle noise biomes with hex colors
    else if (biome.grassHexColor || biome.foliageHexColor) {
        setColormapCoordinates(undefined);

        if (biome.grassHexColor) {
            const grassRgb = hexToRgb(biome.grassHexColor);
            if (grassRgb) {
                setSelectedGrassColor(grassRgb);
                console.log("[BiomeSelector] Set grass color from hex:", grassRgb);
            }
        }

        if (biome.foliageHexColor) {
            const foliageRgb = hexToRgb(biome.foliageHexColor);
            if (foliageRgb) {
                setSelectedFoliageColor(foliageRgb);
                console.log(
                    "[BiomeSelector] Set foliage color from hex:",
                    foliageRgb,
                );
            }
        }

        console.log("[BiomeSelector] Using hex colors for noise biome:", biomeId);
    } else {
        console.warn(
            "[BiomeSelector] No coordinate or hex color data for biome:",
            biomeId,
        );
    }
}
