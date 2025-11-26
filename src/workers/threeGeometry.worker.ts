/**
 * Web Worker for Three.js Geometry Pre-computation
 *
 * This worker handles CPU-intensive geometry calculations for Minecraft block models.
 * Instead of creating Three.js objects (which require WebGL context), it pre-computes
 * the raw vertex data that can be quickly converted to BufferGeometry on the main thread.
 *
 * RESPONSIBILITIES:
 * - Calculate vertex positions for all elements
 * - Compute UV coordinates with rotation support
 * - Generate normals for lighting
 * - Build face indices
 * - Return lightweight typed arrays for zero-copy transfer
 */

import type {
  BlockModel,
  ResolvedModel,
} from "@lib/tauri/blockModels";
import {
  processModel,
  type GeometryData,
  type MaterialGroup,
  type ElementGeometryData,
} from "@/lib/utils/geometry";

// Types for worker communication
export interface WorkerRequest {
  id: string;
  model: BlockModel;
  resolvedTextures: Record<string, string>;
  biomeColor?: { r: number; g: number; b: number } | null;
  resolvedModel?: ResolvedModel;
}

export type { GeometryData, MaterialGroup, ElementGeometryData };

export interface WorkerResponse {
  id: string;
  elements: ElementGeometryData[];
  blockstateRotation?: {
    rotX: number;
    rotY: number;
    rotZ: number;
    uvlock: boolean;
  };
}

// Worker message handler
self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { id, model, resolvedTextures, resolvedModel } = event.data;

  try {
    // Process the model
    const elements = processModel(model, resolvedTextures, resolvedModel);

    // Build response
    const response: WorkerResponse = {
      id,
      elements,
    };

    // Include blockstate rotation if provided
    if (resolvedModel) {
      response.blockstateRotation = {
        rotX: resolvedModel.rotX,
        rotY: resolvedModel.rotY,
        rotZ: resolvedModel.rotZ,
        uvlock: resolvedModel.uvlock,
      };
    }

    // Send result back to main thread
    // Transfer typed arrays for zero-copy performance
    const transferables: Transferable[] = [];
    for (const element of elements) {
      transferables.push(element.geometry.positions.buffer);
      transferables.push(element.geometry.normals.buffer);
      transferables.push(element.geometry.uvs.buffer);
      transferables.push(element.geometry.indices.buffer);
    }

    self.postMessage(response, { transfer: transferables });
  } catch (error) {
    console.error("[ThreeGeometryWorker] Error processing model:", error);
    // Send empty result on error
    self.postMessage({
      id,
      elements: [],
    });
  }
};
