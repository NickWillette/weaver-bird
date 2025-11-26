/**
 * Worker Manager for Three.js Geometry Pre-computation
 *
 * Provides a clean API for using the Three.js geometry worker.
 * Handles worker initialization and request/response management.
 */

import type {
  WorkerRequest,
  WorkerResponse,
  ElementGeometryData,
} from "@/workers/threeGeometry.worker";
import type { BlockModel, ResolvedModel } from "@lib/tauri/blockModels";

export type { ElementGeometryData };

class ThreeGeometryWorkerManager {
  private worker: Worker | null = null;
  private pendingRequests = new Map<string, (result: WorkerResponse) => void>();
  private requestCounter = 0;

  constructor() {
    this.initWorker();
  }

  private initWorker(): void {
    try {
      // Vite-specific: Use new URL() pattern for worker imports
      this.worker = new Worker(
        new URL("@/workers/threeGeometry.worker.ts", import.meta.url),
        { type: "module" },
      );

      this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { id } = event.data;
        const callback = this.pendingRequests.get(id);

        if (callback) {
          callback(event.data);
          this.pendingRequests.delete(id);
        }
      };

      this.worker.onerror = (error) => {
        console.error("[ThreeGeometryWorker] Worker error:", error);
      };

      console.log("[ThreeGeometryWorker] Worker initialized successfully");
    } catch (error) {
      console.error(
        "[ThreeGeometryWorker] Failed to initialize worker:",
        error,
      );
      this.worker = null;
    }
  }

  /**
   * Compute geometry data for a block model using the Web Worker
   *
   * @param model - The block model to process
   * @param resolvedTextures - Already-resolved texture variables
   * @param biomeColor - Optional biome color for tinting
   * @param resolvedModel - Optional blockstate rotation data
   * @returns Promise resolving to array of element geometry data
   */
  async computeGeometry(
    model: BlockModel,
    resolvedTextures: Record<string, string>,
    biomeColor?: { r: number; g: number; b: number } | null,
    resolvedModel?: ResolvedModel,
  ): Promise<WorkerResponse> {
    if (!this.worker) {
      throw new Error(
        "[ThreeGeometryWorker] Worker failed to initialize - this is a critical error",
      );
    }

    const worker = this.worker;

    return new Promise((resolve) => {
      const id = `request_${++this.requestCounter}`;

      this.pendingRequests.set(id, resolve);

      const request: WorkerRequest = {
        id,
        model,
        resolvedTextures,
        biomeColor,
        resolvedModel,
      };

      worker.postMessage(request);
    });
  }

  /**
   * Cleanup - call this on app unmount
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      console.log("[ThreeGeometryWorker] Worker terminated");
    }
    this.pendingRequests.clear();
  }
}

// Export singleton instance
export const threeGeometryWorker = new ThreeGeometryWorkerManager();
