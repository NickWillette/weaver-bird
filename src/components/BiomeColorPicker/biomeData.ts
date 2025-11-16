/**
 * Minecraft biome temperature and rainfall data
 *
 * Coordinates map to the 256x256 colormap where:
 * - X = temperature (0.0 to 1.0, left to right)
 * - Y = rainfall/downfall (0.0 to 1.0, bottom to top)
 *
 * In the colormap image:
 * - (0, 0) is bottom-left (hot and dry)
 * - (255, 255) is top-right (cold and wet)
 */

export interface BiomeData {
  id: string;
  name: string;
  temperature: number; // 0.0 to 2.0 (clamped to 1.0 for colormap)
  rainfall: number; // 0.0 to 1.0
}

// Calculate adjusted temperature for colormap lookup
// Downfall is multiplied by temperature to stay in lower-left triangle
function getColormapCoords(temperature: number, rainfall: number): { x: number; y: number } {
  // Clamp temperature to 0-1 range for colormap
  const clampedTemp = Math.max(0, Math.min(1, temperature));

  // Adjust rainfall by temperature (keeps values in lower-left triangle)
  const adjustedRainfall = rainfall * clampedTemp;

  // Convert to pixel coordinates (0-255)
  return {
    x: Math.round(clampedTemp * 255),
    y: Math.round(adjustedRainfall * 255)
  };
}

export const BIOMES: BiomeData[] = [
  { id: "ocean", name: "Ocean", temperature: 0.5, rainfall: 0.5 },
  { id: "plains", name: "Plains", temperature: 0.8, rainfall: 0.4 },
  { id: "desert", name: "Desert", temperature: 2.0, rainfall: 0.0 },
  { id: "mountains", name: "Mountains", temperature: 0.2, rainfall: 0.3 },
  { id: "forest", name: "Forest", temperature: 0.7, rainfall: 0.8 },
  { id: "taiga", name: "Taiga", temperature: 0.25, rainfall: 0.8 },
  { id: "swamp", name: "Swamp", temperature: 0.8, rainfall: 0.9 },
  { id: "river", name: "River", temperature: 0.5, rainfall: 0.5 },
  { id: "frozen_ocean", name: "Frozen Ocean", temperature: 0.0, rainfall: 0.5 },
  { id: "frozen_river", name: "Frozen River", temperature: 0.0, rainfall: 0.5 },
  { id: "snowy_tundra", name: "Snowy Tundra", temperature: 0.0, rainfall: 0.5 },
  { id: "snowy_mountains", name: "Snowy Mountains", temperature: 0.0, rainfall: 0.5 },
  { id: "mushroom_fields", name: "Mushroom Fields", temperature: 0.9, rainfall: 1.0 },
  { id: "beach", name: "Beach", temperature: 0.8, rainfall: 0.4 },
  { id: "jungle", name: "Jungle", temperature: 0.95, rainfall: 0.9 },
  { id: "jungle_hills", name: "Jungle Hills", temperature: 0.95, rainfall: 0.9 },
  { id: "jungle_edge", name: "Jungle Edge", temperature: 0.95, rainfall: 0.8 },
  { id: "birch_forest", name: "Birch Forest", temperature: 0.6, rainfall: 0.6 },
  { id: "birch_forest_hills", name: "Birch Forest Hills", temperature: 0.6, rainfall: 0.6 },
  { id: "dark_forest", name: "Dark Forest", temperature: 0.7, rainfall: 0.8 },
  { id: "snowy_taiga", name: "Snowy Taiga", temperature: -0.5, rainfall: 0.4 },
  { id: "giant_tree_taiga", name: "Giant Tree Taiga", temperature: 0.3, rainfall: 0.8 },
  { id: "savanna", name: "Savanna", temperature: 1.2, rainfall: 0.0 },
  { id: "savanna_plateau", name: "Savanna Plateau", temperature: 1.0, rainfall: 0.0 },
  { id: "badlands", name: "Badlands", temperature: 2.0, rainfall: 0.0 },
];

// Get pixel coordinates for a biome
export function getBiomeCoords(biome: BiomeData): { x: number; y: number } {
  return getColormapCoords(biome.temperature, biome.rainfall);
}

// Get all biomes with their pixel coordinates
export function getBiomesWithCoords(): Array<BiomeData & { x: number; y: number }> {
  return BIOMES.map(biome => ({
    ...biome,
    ...getBiomeCoords(biome)
  }));
}
