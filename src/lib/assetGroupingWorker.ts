/**
 * Worker Manager for Asset Variant Grouping
 *
 * Provides a clean API for using the Asset Grouping Web Worker.
 */

import type {
  WorkerRequest,
  WorkerResponse,
  AssetGroup,
} from "@/workers/assetGrouping.worker";

class AssetGroupingWorkerManager {
  private worker: Worker | null = null;
  private pendingRequests = new Map<string, (result: AssetGroup[]) => void>();
  private requestCounter = 0;

  constructor() {
    this.initWorker();
  }

  private initWorker(): void {
    try {
      // Vite-specific: Use new URL() pattern for worker imports
      this.worker = new Worker(
        new URL("@/workers/assetGrouping.worker.ts", import.meta.url),
        { type: "module" },
      );

      this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { id, groups } = event.data;
        const callback = this.pendingRequests.get(id);

        if (callback) {
          callback(groups);
          this.pendingRequests.delete(id);
        }
      };

      this.worker.onerror = (error) => {
        console.error("[AssetGroupingWorker] Worker error:", error);
      };
    } catch (error) {
      console.error(
        "[AssetGroupingWorker] Failed to initialize worker:",
        error,
      );
      this.worker = null;
    }
  }

  /**
   * Group assets by variant using the Web Worker
   */
  async groupAssets(assetIds: string[]): Promise<AssetGroup[]> {
    if (!this.worker) {
      throw new Error(
        "[AssetGroupingWorker] Worker failed to initialize - this is a critical error",
      );
    }

    const {worker} = this;

    return new Promise((resolve) => {
      const id = `request_${++this.requestCounter}`;

      this.pendingRequests.set(id, resolve);

      const request: WorkerRequest = { id, assetIds };
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
    }
    this.pendingRequests.clear();
  }
}

// Export singleton instance
export const assetGroupingWorker = new AssetGroupingWorkerManager();
