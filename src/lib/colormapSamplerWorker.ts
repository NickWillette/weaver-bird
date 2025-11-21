/**
 * Worker Manager for Colormap Sampling
 *
 * Provides a clean API for batch colormap sampling using a Web Worker.
 * Automatically falls back to synchronous implementation if worker fails.
 */

import type {
  WorkerRequest,
  WorkerResponse,
  SampleRequest,
  SampleResult,
} from '@/workers/colormapSampler.worker';

class ColormapSamplerWorkerManager {
  private worker: Worker | null = null;
  private pendingRequests = new Map<string, (results: SampleResult[]) => void>();
  private requestCounter = 0;

  constructor() {
    this.initWorker();
  }

  private initWorker(): void {
    try {
      // Vite-specific: Use new URL() pattern for worker imports
      this.worker = new Worker(
        new URL('@/workers/colormapSampler.worker.ts', import.meta.url),
        { type: 'module' },
      );

      this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { id, results } = event.data;
        const callback = this.pendingRequests.get(id);

        if (callback) {
          callback(results);
          this.pendingRequests.delete(id);
        }
      };

      this.worker.onerror = (error) => {
        console.error('[ColormapSamplerWorker] Worker error:', error);
      };
    } catch (error) {
      console.error(
        '[ColormapSamplerWorker] Failed to initialize worker:',
        error,
      );
      this.worker = null;
    }
  }

  /**
   * Sample colors from colormaps at multiple coordinates using the Web Worker
   *
   * @param grassColormapUrl - URL of the grass colormap image
   * @param foliageColormapUrl - URL of the foliage colormap image
   * @param coordinates - Array of {x, y} coordinates to sample
   * @returns Promise that resolves to array of sampled colors
   */
  async sampleBatch(
    grassColormapUrl: string | null,
    foliageColormapUrl: string | null,
    coordinates: SampleRequest[],
  ): Promise<SampleResult[]> {
    // Fallback to sync processing if worker failed to load
    if (!this.worker) {
      console.warn(
        '[ColormapSamplerWorker] Worker not available, using fallback',
      );
      const { sampleBatchSync } = await import('./colormapSamplerSync');
      return sampleBatchSync(grassColormapUrl, foliageColormapUrl, coordinates);
    }

    return new Promise((resolve) => {
      const id = `request_${++this.requestCounter}`;

      this.pendingRequests.set(id, resolve);

      const request: WorkerRequest = {
        id,
        grassColormapUrl,
        foliageColormapUrl,
        coordinates,
      };
      this.worker!.postMessage(request);
    });
  }

  /**
   * Sample a single coordinate (convenience method)
   */
  async sampleSingle(
    grassColormapUrl: string | null,
    foliageColormapUrl: string | null,
    x: number,
    y: number,
  ): Promise<SampleResult> {
    const results = await this.sampleBatch(
      grassColormapUrl,
      foliageColormapUrl,
      [{ x, y }],
    );
    return results[0] ?? { grassColor: null, foliageColor: null };
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
export const colormapSamplerWorker = new ColormapSamplerWorkerManager();
