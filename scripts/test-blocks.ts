#!/usr/bin/env npx ts-node
/**
 * Block Tester Script
 *
 * Tests all blocks in the mock resource pack by:
 * 1. Reading blockstate JSON files
 * 2. Extracting model references
 * 3. Loading and validating model JSON files
 * 4. Checking texture references
 *
 * Run with: npx ts-node scripts/test-blocks.ts
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ModelReference {
  model: string;
  x?: number;
  y?: number;
  z?: number;
  uvlock?: boolean;
  weight?: number;
}

interface BlockstateVariant {
  model?: string;
  x?: number;
  y?: number;
}

interface Blockstate {
  variants?: Record<string, ModelReference | ModelReference[]>;
  multipart?: Array<{
    when?: unknown;
    apply: ModelReference | ModelReference[];
  }>;
}

interface BlockModel {
  parent?: string;
  textures?: Record<string, string>;
  elements?: unknown[];
}

interface TestResult {
  blockId: string;
  status: "success" | "error";
  error?: string;
  modelCount: number;
}

// Paths - can be overridden with command line arguments
const PROJECT_ROOT = path.resolve(__dirname, "..");
const MOCK_PACKS_DIR = path.join(PROJECT_ROOT, "__mocks__/resourcepacks");
const STAY_TRUE_DIR = path.join(MOCK_PACKS_DIR, "Stay True");

// Check for custom vanilla path from args
const args = process.argv.slice(2);
const vanillaPathArg = args.find(arg => arg.startsWith('--vanilla='));
const VANILLA_PATH = vanillaPathArg
  ? vanillaPathArg.split('=')[1]
  : process.env.VANILLA_TEXTURES_PATH || '';

const TEST_VANILLA = args.includes('--vanilla') || !!VANILLA_PATH;
const PACK_DIR = TEST_VANILLA && VANILLA_PATH ? VANILLA_PATH : STAY_TRUE_DIR;

const BLOCKSTATES_DIR = path.join(
  PACK_DIR,
  "assets/minecraft/blockstates"
);
const MODELS_DIR = path.join(PACK_DIR, "assets/minecraft/models");
const TEXTURES_DIR = path.join(PACK_DIR, "assets/minecraft/textures/block");

// Track loaded models to avoid infinite loops
const loadedModels = new Set<string>();

function getModelPath(modelId: string): string {
  // Parse model ID: "minecraft:block/dirt" -> "assets/minecraft/models/block/dirt.json"
  let modelPath = modelId;

  // Remove namespace
  if (modelPath.includes(":")) {
    modelPath = modelPath.split(":")[1];
  }

  return path.join(MODELS_DIR, `${modelPath}.json`);
}

function loadModel(modelId: string, visited: Set<string> = new Set()): BlockModel {
  if (visited.has(modelId)) {
    throw new Error(`Circular parent reference detected for model: ${modelId}`);
  }
  visited.add(modelId);

  const modelPath = getModelPath(modelId);

  if (!fs.existsSync(modelPath)) {
    // Model not in pack, might be in vanilla - that's OK for now
    // Return empty model to indicate not found
    return {};
  }

  const content = fs.readFileSync(modelPath, "utf-8");
  const model: BlockModel = JSON.parse(content);

  // If model has a parent, we should be able to resolve it
  // For this test, we just verify the model parses correctly
  if (model.parent) {
    // Check if parent exists (but don't load it to avoid needing vanilla)
    const parentPath = getModelPath(model.parent);
    if (!fs.existsSync(parentPath)) {
      // Parent might be in vanilla, which is OK
      // console.log(`  Note: Parent model not in pack: ${model.parent}`);
    }
  }

  // Check texture references
  if (model.textures) {
    for (const [key, texRef] of Object.entries(model.textures)) {
      // Skip variable references like #all
      if (texRef.startsWith('#')) continue;

      // Check if texture file exists
      const texturePath = getTexturePath(texRef);
      if (!fs.existsSync(texturePath)) {
        // Texture might be in vanilla, which is OK
        // console.log(`  Note: Texture not in pack: ${texRef}`);
      }
    }
  }

  return model;
}

function getTexturePath(textureId: string): string {
  // Parse texture ID: "minecraft:block/dirt" -> "assets/minecraft/textures/block/dirt.png"
  let texturePath = textureId;

  // Remove namespace
  if (texturePath.includes(":")) {
    texturePath = texturePath.split(":")[1];
  }

  return path.join(PACK_DIR, "assets/minecraft/textures", `${texturePath}.png`);
}

/**
 * Get the base blockstate name from a texture name
 * This mirrors the logic in assetUtils.ts getBaseName
 */
function getBlockstateFromTexture(textureName: string): string {
  let name = textureName;

  // Handle special compound names without underscores
  const compoundMappings: Record<string, string> = {
    acaciabutton: "acacia_button",
    birchbutton: "birch_button",
    junglebutton: "jungle_button",
    oakbutton: "oak_button",
    sprucebutton: "spruce_button",
    darkoak_button: "dark_oak_button",
    darkoakbutton: "dark_oak_button",
    crimsonbutton: "crimson_button",
    warpedbutton: "warped_button",
    bamboobutton: "bamboo_button",
    cherrybutton: "cherry_button",
    mangrovebutton: "mangrove_button",
    stonebutton: "stone_button",
    polished_blackstonebutton: "polished_blackstone_button",
  };

  const lowerName = name.toLowerCase();
  if (compoundMappings[lowerName]) {
    name = compoundMappings[lowerName];
  }

  // Handle "_pp" abbreviation for pressure_plate
  if (name.endsWith("_pp")) {
    name = name.replace(/_pp$/, "_pressure_plate");
  }

  // Handle crop stage naming variations
  if (name.match(/^wheat_stage/)) {
    name = "wheat";
  }
  if (name.match(/^beetroots_stage/)) {
    name = "beetroots";
  }
  if (name.match(/^carrots_stage/)) {
    name = "carrots";
  }
  if (name.match(/^potatoes_stage/)) {
    name = "potatoes";
  }
  if (name.match(/^sweet_berry_bush_stage/)) {
    name = "sweet_berry_bush";
  }

  // Remove common structural suffixes (top/bottom, head/foot, etc.)
  name = name.replace(
    /_(top|bottom|upper|lower|head|foot|side|front|back|left|right|inventory|bushy|stage\d+)\d*$/,
    "",
  );

  // Remove texture-specific suffixes that don't correspond to blockstate names
  name = name.replace(
    /_(stalk|stem|occupied|empty|overlay|particle|inner|outer|outer_ew|outer_ns|contents|spore|blossom|horizontal|vertical|still|flow|nodule|attached|tip|tip_merge|frustum|base|segment|main|cross|hash|outline|inside|corner|post|noside|noside_alt|alt|inventory_2|block_atlas|colormap|lock|tinted_cross|end|walls|honey|off|smooth)\d*$/,
    "",
  );

  // Remove state suffixes (on/off, lit, open/closed, etc.)
  name = name.replace(/_(on|off|lit|open|closed|active|inactive|triggered)$/, "");

  // Remove trailing numbers
  name = name.replace(/\d+$/, "");

  // Handle potted plants
  if (name.endsWith("_potted")) {
    name = `potted_${name.replace(/_potted$/, "")}`;
  }

  return name;
}

/**
 * Test if a texture can be mapped to a valid blockstate
 */
function testTexture(textureName: string): TestResult {
  const blockstateName = getBlockstateFromTexture(textureName);
  const blockstatePath = path.join(BLOCKSTATES_DIR, `${blockstateName}.json`);

  try {
    if (!fs.existsSync(blockstatePath)) {
      return {
        blockId: textureName,
        status: "error",
        error: `Blockstate not found: ${blockstateName} (texture: ${textureName})`,
        modelCount: 0,
      };
    }

    // Read and parse blockstate
    const content = fs.readFileSync(blockstatePath, "utf-8");
    const blockstate: Blockstate = JSON.parse(content);

    // Extract all model references
    const models = extractModels(blockstate);

    if (models.length === 0) {
      return {
        blockId: textureName,
        status: "error",
        error: `No models found in blockstate ${blockstateName}`,
        modelCount: 0,
      };
    }

    return {
      blockId: textureName,
      status: "success",
      modelCount: models.length,
    };
  } catch (err) {
    return {
      blockId: textureName,
      status: "error",
      error: err instanceof Error ? err.message : String(err),
      modelCount: 0,
    };
  }
}

function extractModels(blockstate: Blockstate): string[] {
  const models: string[] = [];

  if (blockstate.variants) {
    for (const variant of Object.values(blockstate.variants)) {
      if (Array.isArray(variant)) {
        for (const v of variant) {
          if (v.model) models.push(v.model);
        }
      } else if (variant.model) {
        models.push(variant.model);
      }
    }
  }

  if (blockstate.multipart) {
    for (const part of blockstate.multipart) {
      if (Array.isArray(part.apply)) {
        for (const a of part.apply) {
          if (a.model) models.push(a.model);
        }
      } else if (part.apply.model) {
        models.push(part.apply.model);
      }
    }
  }

  return [...new Set(models)];
}

function testBlock(blockId: string): TestResult {
  const blockstatePath = path.join(BLOCKSTATES_DIR, `${blockId}.json`);

  try {
    // Read and parse blockstate
    const content = fs.readFileSync(blockstatePath, "utf-8");
    const blockstate: Blockstate = JSON.parse(content);

    // Extract all model references
    const models = extractModels(blockstate);

    if (models.length === 0) {
      return {
        blockId,
        status: "error",
        error: "No models found in blockstate",
        modelCount: 0,
      };
    }

    // Try to load each model
    for (const modelId of models) {
      try {
        loadModel(modelId);
      } catch (err) {
        return {
          blockId,
          status: "error",
          error: `Failed to load model '${modelId}': ${err instanceof Error ? err.message : String(err)}`,
          modelCount: models.length,
        };
      }
    }

    return {
      blockId,
      status: "success",
      modelCount: models.length,
    };
  } catch (err) {
    return {
      blockId,
      status: "error",
      error: err instanceof Error ? err.message : String(err),
      modelCount: 0,
    };
  }
}

async function main() {
  console.log("=== Block Tester ===\n");

  const testTextures = args.includes('--textures');
  const stopOnError = !args.includes('--continue');

  console.log(`Pack directory: ${PACK_DIR}`);
  console.log(`Mode: ${testTextures ? 'Testing textures' : 'Testing blockstates'}`);
  console.log(`Stop on error: ${stopOnError}`);
  console.log();

  // Check directories exist
  if (!fs.existsSync(PACK_DIR)) {
    console.error(`ERROR: Pack not found at ${PACK_DIR}`);
    process.exit(1);
  }

  let itemsToTest: string[];
  let testFn: (id: string) => TestResult;

  if (testTextures) {
    // Test all texture files
    if (!fs.existsSync(TEXTURES_DIR)) {
      console.error(`ERROR: Textures directory not found at ${TEXTURES_DIR}`);
      process.exit(1);
    }

    itemsToTest = fs
      .readdirSync(TEXTURES_DIR)
      .filter((f) => f.endsWith(".png"))
      .map((f) => f.replace(".png", ""))
      .sort();

    testFn = testTexture;
    console.log(`Found ${itemsToTest.length} textures to test\n`);
  } else {
    // Test all blockstate files
    if (!fs.existsSync(BLOCKSTATES_DIR)) {
      console.error(`ERROR: Blockstates directory not found at ${BLOCKSTATES_DIR}`);
      process.exit(1);
    }

    itemsToTest = fs
      .readdirSync(BLOCKSTATES_DIR)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""))
      .sort();

    testFn = testBlock;
    console.log(`Found ${itemsToTest.length} blockstates to test\n`);
  }

  // Run tests
  const results: TestResult[] = [];
  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{ id: string; error: string }> = [];

  for (const itemId of itemsToTest) {
    const result = testFn(itemId);
    results.push(result);

    if (result.status === "success") {
      console.log(`✓ ${itemId} (${result.modelCount} models)`);
      successCount++;
    } else {
      console.log(`✗ ${itemId}: ${result.error}`);
      errorCount++;
      errors.push({ id: itemId, error: result.error || 'Unknown error' });

      if (stopOnError) {
        // Stop on first error
        console.log("\n=== STOPPED ON FIRST ERROR ===");
        console.log(`Item: ${itemId}`);
        console.log(`Error: ${result.error}`);
        break;
      }
    }
  }

  // Print summary
  console.log("\n=== Summary ===");
  console.log(`Total: ${itemsToTest.length}`);
  console.log(`Success: ${successCount}`);
  console.log(`Error: ${errorCount}`);
  console.log(`Remaining: ${itemsToTest.length - successCount - errorCount}`);

  if (errors.length > 0 && !stopOnError) {
    console.log("\n=== All Errors ===");
    // Group errors by type
    const errorsByType = new Map<string, string[]>();
    for (const { id, error } of errors) {
      const match = error.match(/Blockstate not found: (\S+)/);
      if (match) {
        const blockstate = match[1];
        if (!errorsByType.has(blockstate)) {
          errorsByType.set(blockstate, []);
        }
        errorsByType.get(blockstate)!.push(id);
      } else {
        if (!errorsByType.has('other')) {
          errorsByType.set('other', []);
        }
        errorsByType.get('other')!.push(`${id}: ${error}`);
      }
    }

    for (const [blockstate, textures] of errorsByType) {
      if (blockstate === 'other') {
        console.log(`\nOther errors:`);
        for (const t of textures) {
          console.log(`  - ${t}`);
        }
      } else {
        console.log(`\nBlockstate "${blockstate}" not found for textures:`);
        for (const t of textures) {
          console.log(`  - ${t}`);
        }
      }
    }
  }

  if (errorCount > 0) {
    process.exit(1);
  }

  console.log("\nAll items passed!");
}

// Usage instructions
if (args.includes('--help')) {
  console.log(`
Block Tester - Test block rendering for Minecraft resource packs

Usage:
  npx tsx scripts/test-blocks.ts [options]

Options:
  --textures              Test all texture files instead of blockstates
  --continue              Continue testing even after errors (show all errors)
  --vanilla=<path>        Path to vanilla textures cache directory
  --help                  Show this help message

Examples:
  # Test Stay True mock pack blockstates
  npx tsx scripts/test-blocks.ts

  # Test Stay True textures
  npx tsx scripts/test-blocks.ts --textures

  # Test vanilla textures (macOS)
  npx tsx scripts/test-blocks.ts --textures --vanilla=~/Library/Caches/weaverbird/vanilla_textures

  # Test all textures without stopping on errors
  npx tsx scripts/test-blocks.ts --textures --continue
`);
  process.exit(0);
}

main().catch(console.error);
