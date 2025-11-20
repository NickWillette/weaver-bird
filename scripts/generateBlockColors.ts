#!/usr/bin/env tsx
/**
 * Script to generate static block colors constants from Fabric Yarn source.
 *
 * Usage:
 *   npm run generate:blockcolors
 *   or
 *   tsx scripts/generateBlockColors.ts [version]
 *
 * This fetches the BlockColors.java file from Fabric Yarn's GitHub repository,
 * parses it to extract which blocks support biome-based tinting, and generates
 * a TypeScript constants file.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const DEFAULT_VERSION = "1.21.4";
const YARN_TAG = "1.21.4+build.3"; // Update this for newer versions
const OUTPUT_FILE = path.join(
  __dirname,
  "../src/constants/vanillaBlockColors.ts",
);

interface TintEntry {
  blocks: string[];
  tint: "grass" | "foliage" | "water" | string;
}

/**
 * Fetch BlockColors.java from Fabric Yarn GitHub
 */
async function fetchBlockColorsSource(yarnTag: string): Promise<string> {
  // Try primary URL (newer Yarn versions)
  const primaryUrl = `https://raw.githubusercontent.com/FabricMC/yarn/${yarnTag}/mappings/net/minecraft/client/color/block/BlockColors.mapping`;

  console.log(`Fetching from: ${primaryUrl}`);

  let response = await fetch(primaryUrl);

  if (!response.ok) {
    // Try alternative URL (older Yarn versions)
    const altUrl = `https://raw.githubusercontent.com/FabricMC/yarn/${yarnTag}/net/minecraft/client/color/block/BlockColors.java`;
    console.log(`Trying alternative: ${altUrl}`);
    response = await fetch(altUrl);
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch BlockColors: ${response.status} ${response.statusText}`,
    );
  }

  return await response.text();
}

/**
 * Normalize block name from Java constant to Minecraft ID
 */
function normalizeBlockName(javaConstant: string): string {
  return `minecraft:${javaConstant.toLowerCase()}`;
}

/**
 * Determine tint type from Java code
 */
function getTintType(
  javaCode: string,
): "grass" | "foliage" | "water" | "special" {
  if (javaCode.includes("BiomeColors.getGrassColor")) return "grass";
  if (javaCode.includes("BiomeColors.getFoliageColor")) return "foliage";
  if (javaCode.includes("BiomeColors.getWaterColor")) return "water";
  return "special";
}

/**
 * Parse BlockColors.java source
 */
function parseBlockColorsSource(source: string): TintEntry[] {
  const entries: TintEntry[] = [];

  // Match all register() calls
  const registerRegex = /\.register\(([\s\S]*?)\);/g;
  let match;

  while ((match = registerRegex.exec(source)) !== null) {
    const registerCall = match[1];

    // Extract all Blocks.<NAME> references
    const blockRegex = /Blocks\.(\w+)/g;
    const blocks: string[] = [];
    let blockMatch;

    while ((blockMatch = blockRegex.exec(registerCall)) !== null) {
      blocks.push(normalizeBlockName(blockMatch[1]));
    }

    if (blocks.length === 0) continue;

    // Determine tint type
    const tint = getTintType(registerCall);

    entries.push({ blocks, tint });
  }

  return entries;
}

/**
 * Group blocks by tint type
 */
function groupByTintType(entries: TintEntry[]): Record<string, string[]> {
  const grouped: Record<string, Set<string>> = {
    grass: new Set(),
    foliage: new Set(),
    water: new Set(),
    special: new Set(),
  };

  for (const entry of entries) {
    for (const block of entry.blocks) {
      grouped[entry.tint]?.add(block);
    }
  }

  // Convert Sets to sorted arrays
  return {
    grass: Array.from(grouped.grass).sort(),
    foliage: Array.from(grouped.foliage).sort(),
    water: Array.from(grouped.water).sort(),
    special: Array.from(grouped.special).sort(),
  };
}

/**
 * Generate TypeScript constants file
 */
function generateTypeScriptFile(
  version: string,
  yarnTag: string,
  grouped: Record<string, string[]>,
): string {
  const timestamp = new Date().toISOString();

  return `/**
 * Vanilla Minecraft Block Colors
 *
 * This file contains all vanilla blocks that support biome-based color tinting.
 * It is automatically generated from Fabric Yarn's BlockColors.java source.
 *
 * Generation info:
 * - Minecraft version: ${version}
 * - Yarn tag: ${yarnTag}
 * - Generated: ${timestamp}
 * - Source: https://github.com/FabricMC/yarn
 *
 * To regenerate:
 *   npm run generate:blockcolors
 */

/**
 * Blocks that use the grass.png colormap
 * Includes: grass blocks, tall grass, ferns, sugar cane, lily pads, stems
 */
export const GRASS_TINTED_BLOCKS = [
${grouped.grass.map((b) => `  "${b}",`).join("\n")}
] as const;

/**
 * Blocks that use the foliage.png colormap
 * Includes: oak/jungle/acacia/dark oak/mangrove leaves, vines
 */
export const FOLIAGE_TINTED_BLOCKS = [
${grouped.foliage.map((b) => `  "${b}",`).join("\n")}
] as const;

/**
 * Blocks that use water colormap
 * Includes: water, flowing water, water cauldrons
 */
export const WATER_TINTED_BLOCKS = [
${grouped.water.map((b) => `  "${b}",`).join("\n")}
] as const;

/**
 * Blocks with special tinting logic
 * Includes: redstone wire, potions, etc.
 */
export const SPECIAL_TINTED_BLOCKS = [
${grouped.special.map((b) => `  "${b}",`).join("\n")}
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
 * Get the tint type for a block ID
 * Returns undefined if the block doesn't support tinting
 */
export function getBlockTintType(blockId: string): TintType | undefined {
  if (GRASS_TINTED_BLOCKS.includes(blockId as any)) return "grass";
  if (FOLIAGE_TINTED_BLOCKS.includes(blockId as any)) return "foliage";
  if (WATER_TINTED_BLOCKS.includes(blockId as any)) return "water";
  if (SPECIAL_TINTED_BLOCKS.includes(blockId as any)) return "special";
  return undefined;
}

/**
 * Check if a block supports tinting
 */
export function isBlockTinted(blockId: string): boolean {
  return getBlockTintType(blockId) !== undefined;
}

/**
 * Metadata about this generated file
 */
export const BLOCK_COLORS_METADATA = {
  minecraftVersion: "${version}",
  yarnTag: "${yarnTag}",
  generatedAt: "${timestamp}",
  totalBlocks: ${grouped.grass.length + grouped.foliage.length + grouped.water.length + grouped.special.length},
  grassBlocks: ${grouped.grass.length},
  foliageBlocks: ${grouped.foliage.length},
  waterBlocks: ${grouped.water.length},
  specialBlocks: ${grouped.special.length},
} as const;
`;
}

/**
 * Main function
 */
async function main() {
  const version = process.argv[2] || DEFAULT_VERSION;
  const yarnTag = YARN_TAG;

  console.log(
    `\n🔍 Generating block colors for Minecraft ${version} (Yarn ${yarnTag})\n`,
  );

  try {
    // Fetch source
    console.log("📥 Fetching BlockColors.java from Fabric Yarn...");
    const source = await fetchBlockColorsSource(yarnTag);
    console.log("✓ Source fetched successfully\n");

    // Parse source
    console.log("🔨 Parsing BlockColors registry...");
    const entries = parseBlockColorsSource(source);
    console.log(`✓ Found ${entries.length} tint entries\n`);

    // Group by tint type
    const grouped = groupByTintType(entries);
    console.log("📊 Block counts by type:");
    console.log(`  - Grass:   ${grouped.grass.length} blocks`);
    console.log(`  - Foliage: ${grouped.foliage.length} blocks`);
    console.log(`  - Water:   ${grouped.water.length} blocks`);
    console.log(`  - Special: ${grouped.special.length} blocks`);
    console.log(
      `  - Total:   ${grouped.grass.length + grouped.foliage.length + grouped.water.length + grouped.special.length} blocks\n`,
    );

    // Generate TypeScript file
    console.log("📝 Generating TypeScript constants file...");
    const tsContent = generateTypeScriptFile(version, yarnTag, grouped);

    // Ensure output directory exists
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write file
    fs.writeFileSync(OUTPUT_FILE, tsContent, "utf-8");
    console.log(
      `✓ File written to: ${path.relative(process.cwd(), OUTPUT_FILE)}\n`,
    );

    console.log("✅ Block colors generated successfully!\n");

    // Display sample blocks
    console.log("📋 Sample blocks:");
    console.log("  Grass:  ", grouped.grass.slice(0, 3).join(", "), "...");
    console.log("  Foliage:", grouped.foliage.slice(0, 3).join(", "), "...");
    console.log("  Water:  ", grouped.water.slice(0, 3).join(", "), "...");
    console.log();
  } catch (error) {
    console.error("❌ Error generating block colors:");
    console.error(error);
    process.exit(1);
  }
}

main();
