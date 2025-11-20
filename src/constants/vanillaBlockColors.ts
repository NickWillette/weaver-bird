/**
 * Vanilla Minecraft Block Colors
 *
 * This file contains all vanilla blocks that support biome-based color tinting.
 * Based on Minecraft's BlockColors registry (hardcoded in Java).
 *
 * Sources:
 * - Minecraft Wiki: https://minecraft.wiki/w/Block_colors
 * - Manual verification with Minecraft 1.21.4
 * - Fabric Yarn mappings: https://github.com/FabricMC/yarn
 *
 * Last updated: 2025-01 for Minecraft 1.21.4
 */

/**
 * Blocks that use the grass.png colormap
 * These blocks change color based on biome grass color.
 */
export const GRASS_TINTED_BLOCKS = [
  "minecraft:grass_block",
  "minecraft:grass",
  "minecraft:short_grass",
  "minecraft:tall_grass",
  "minecraft:fern",
  "minecraft:large_fern",
  "minecraft:potted_fern",
  "minecraft:sugar_cane",
  "minecraft:pink_petals",
  // Stems (use grass colormap)
  "minecraft:attached_melon_stem",
  "minecraft:attached_pumpkin_stem",
  "minecraft:melon_stem",
  "minecraft:pumpkin_stem",
] as const;

/**
 * Blocks that use the foliage.png colormap
 * These blocks change color based on biome foliage color.
 *
 * Note: Birch and Spruce leaves are NOT included as they have fixed colors.
 * Cherry and Azalea leaves also have fixed colors.
 */
export const FOLIAGE_TINTED_BLOCKS = [
  // Leaves that use biome foliage color
  "minecraft:oak_leaves",
  "minecraft:jungle_leaves",
  "minecraft:acacia_leaves",
  "minecraft:dark_oak_leaves",
  "minecraft:mangrove_leaves",
  // Vines
  "minecraft:vine",
  // Lily pad uses grass colormap in water overlay but base uses special
  "minecraft:lily_pad",
] as const;

/**
 * Blocks that use water colormap
 * These blocks change color based on biome water color.
 */
export const WATER_TINTED_BLOCKS = [
  "minecraft:water",
  "minecraft:flowing_water",
  "minecraft:bubble_column",
  "minecraft:water_cauldron",
] as const;

/**
 * Blocks with special/custom tinting logic
 * These don't use colormaps directly but have hardcoded color logic.
 */
export const SPECIAL_TINTED_BLOCKS = [
  // Redstone wire (uses redstone power level for color)
  "minecraft:redstone_wire",
  // Bamboo (slight tint variation)
  "minecraft:bamboo",
  "minecraft:bamboo_sapling",
] as const;

/**
 * Blocks with fixed colors (NOT biome-dependent)
 * These blocks have tintindex but don't change with biome.
 * Included here for completeness but should NOT be tinted by colormaps.
 */
export const FIXED_COLOR_BLOCKS = [
  // Birch and spruce have fixed leaf colors
  "minecraft:birch_leaves",
  "minecraft:spruce_leaves",
  // Cherry and azalea have fixed colors
  "minecraft:cherry_leaves",
  "minecraft:azalea_leaves",
  "minecraft:flowering_azalea_leaves",
] as const;

/**
 * All blocks that support any form of tinting
 */
export const ALL_TINTED_BLOCKS = [
  ...GRASS_TINTED_BLOCKS,
  ...FOLIAGE_TINTED_BLOCKS,
  ...WATER_TINTED_BLOCKS,
  ...SPECIAL_TINTED_BLOCKS,
] as const;

/**
 * Type for tint categories
 */
export type TintType = "grass" | "foliage" | "water" | "special";

/**
 * Get the tint type for a block ID.
 * Returns undefined if the block doesn't support biome-based tinting.
 *
 * Note: This only returns tint types for blocks that should use colormaps.
 * Blocks with fixed colors (birch_leaves, cherry_leaves, etc.) return undefined.
 *
 * @param blockId - Minecraft block ID (e.g., "minecraft:oak_leaves")
 * @returns Tint type or undefined
 */
export function getBlockTintType(blockId: string): TintType | undefined {
  if (GRASS_TINTED_BLOCKS.includes(blockId as any)) return "grass";
  if (FOLIAGE_TINTED_BLOCKS.includes(blockId as any)) return "foliage";
  if (WATER_TINTED_BLOCKS.includes(blockId as any)) return "water";
  if (SPECIAL_TINTED_BLOCKS.includes(blockId as any)) return "special";
  return undefined;
}

/**
 * Check if a block supports biome-based tinting.
 *
 * @param blockId - Minecraft block ID
 * @returns True if the block uses a colormap for tinting
 */
export function isBlockTinted(blockId: string): boolean {
  return getBlockTintType(blockId) !== undefined;
}

/**
 * Check if a block has a fixed color (has tintindex but doesn't change with biome).
 *
 * @param blockId - Minecraft block ID
 * @returns True if the block has fixed color
 */
export function hasFixedColor(blockId: string): boolean {
  return FIXED_COLOR_BLOCKS.includes(blockId as any);
}

/**
 * Metadata about this file
 */
export const BLOCK_COLORS_METADATA = {
  minecraftVersion: "1.21.4",
  lastUpdated: "2025-01",
  totalBlocks: GRASS_TINTED_BLOCKS.length + FOLIAGE_TINTED_BLOCKS.length + WATER_TINTED_BLOCKS.length + SPECIAL_TINTED_BLOCKS.length,
  grassBlocks: GRASS_TINTED_BLOCKS.length,
  foliageBlocks: FOLIAGE_TINTED_BLOCKS.length,
  waterBlocks: WATER_TINTED_BLOCKS.length,
  specialBlocks: SPECIAL_TINTED_BLOCKS.length,
  fixedColorBlocks: FIXED_COLOR_BLOCKS.length,
} as const;
