/**
 * Block Geometry Worker Manager
 *
 * Provides a simple API for offloading block geometry processing to a Web Worker.
 * This keeps the main thread responsive during heavy 3D model computations.
 */

import type { ModelElement } from "@lib/tauri/blockModels";
import type { WorkerRequest, WorkerResponse } from "@/workers/blockGeometry.worker";

// Re-export types for components to use
export interface RenderedFace {
  type: "top" | "left" | "right";
  textureUrl: string;
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  uv: {
    u: number;
    v: number;
    width: number;
    height: number;
    flipX: 1 | -1;
    flipY: 1 | -1;
  };
  zIndex: number;
  brightness: number;
  tintType?: "grass" | "foliage";
}

export interface RenderedElement {
  faces: RenderedFace[];
}

class BlockGeometryWorkerManager {
  private worker: Worker | null = null;
  private pendingRequests = new Map<string, (result: RenderedElement[]) => void>();
  private requestCounter = 0;

  constructor() {
    this.initWorker();
  }

  private initWorker(): void {
    try {
      // Initialize the worker
      this.worker = new Worker(
        new URL("@/workers/blockGeometry.worker.ts", import.meta.url),
        { type: "module" }
      );

      this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { id, renderedElements } = event.data;
        const callback = this.pendingRequests.get(id);

        if (callback) {
          callback(renderedElements);
          this.pendingRequests.delete(id);
        }
      };

      this.worker.onerror = (error) => {
        console.error("[BlockGeometryWorker] Worker error:", error);
      };
    } catch (error) {
      console.error("[BlockGeometryWorker] Failed to initialize worker:", error);
      this.worker = null;
    }
  }

  /**
   * Process block elements into renderable faces using the Web Worker
   *
   * @param elements - Block model elements
   * @param textures - Texture variable mappings
   * @param textureUrls - Map of texture IDs to URLs
   * @param scale - Scale factor for rendering
   * @returns Promise that resolves with rendered elements
   */
  async processElements(
    elements: ModelElement[],
    textures: Record<string, string>,
    textureUrls: Map<string, string>,
    scale: number,
  ): Promise<RenderedElement[]> {
    // If worker failed to initialize, fall back to main thread processing
    if (!this.worker) {
      console.warn("[BlockGeometryWorker] Worker not available, processing on main thread");
      // Import the fallback processor
      const { processElementsSync } = await import("./blockGeometrySync");
      return processElementsSync(elements, textures, textureUrls, scale);
    }

    return new Promise((resolve) => {
      const id = `request_${++this.requestCounter}`;

      this.pendingRequests.set(id, resolve);

      // Convert Map to plain object for serialization
      const textureUrlsObj = Object.fromEntries(textureUrls);

      const request: WorkerRequest = {
        id,
        elements,
        textures,
        textureUrls: textureUrlsObj as any,
        scale,
      };

      this.worker!.postMessage(request);
    });
  }

  /**
   * Terminate the worker (cleanup)
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingRequests.clear();
  }
}

// Export singleton instance
export const blockGeometryWorker = new BlockGeometryWorkerManager();
