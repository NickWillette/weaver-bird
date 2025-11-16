import { invoke } from "@tauri-apps/api/core";

/**
 * Minecraft block model JSON structure
 */
export interface BlockModel {
  parent?: string;
  textures?: Record<string, string>;
  elements?: ModelElement[];
  ambientocclusion?: boolean;
}

/**
 * A cuboid element in a Minecraft model
 */
export interface ModelElement {
  from: [number, number, number];
  to: [number, number, number];
  rotation?: ElementRotation;
  faces: Record<string, ElementFace>;
  shade?: boolean;
}

/**
 * Rotation information for a model element
 */
export interface ElementRotation {
  origin: [number, number, number];
  axis: "x" | "y" | "z";
  angle: number;
  rescale?: boolean;
}

/**
 * A face of a model element
 */
export interface ElementFace {
  texture: string;
  uv?: [number, number, number, number];
  rotation?: number;
  cullface?: string;
  tintindex?: number;
}

/**
 * Read a Minecraft block model JSON file from a resource pack
 *
 * @param packId - ID of the resource pack to read from
 * @param modelId - Model ID (e.g., "minecraft:block/dirt" or "block/dirt")
 * @param packsDir - Directory containing resource packs
 * @returns Fully resolved BlockModel with parent inheritance applied
 */
export async function readBlockModel(
  packId: string,
  modelId: string,
  packsDir: string
): Promise<BlockModel> {
  return invoke<BlockModel>("read_block_model", {
    packId,
    modelId,
    packsDir,
  });
}
