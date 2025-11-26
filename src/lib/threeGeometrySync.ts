/**
 * Synchronous fallback for Three.js Geometry Pre-computation
 *
 * Used when Web Worker fails to initialize.
 * Contains identical logic to the worker - runs on main thread as fallback.
 */

import type { BlockModel, ResolvedModel } from "@lib/tauri/blockModels";
import type { WorkerResponse } from "@/workers/threeGeometry.worker";
import { processModel } from "./utils/geometry";

/**
 * Synchronous version of geometry computation
 */
export function computeGeometrySync(
  model: BlockModel,
  resolvedTextures: Record<string, string>,
  _biomeColor?: { r: number; g: number; b: number } | null,
  resolvedModel?: ResolvedModel,
): WorkerResponse {
  const elements = processModel(model, resolvedTextures, resolvedModel);

  const response: WorkerResponse = {
    id: "sync",
    elements,
  };

  if (resolvedModel) {
    response.blockstateRotation = {
      rotX: resolvedModel.rotX,
      rotY: resolvedModel.rotY,
      rotZ: resolvedModel.rotZ,
      uvlock: resolvedModel.uvlock,
    };
  }

  return response;
}
