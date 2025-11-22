/**
 * Global Transition Queue Manager
 *
 * Prevents browser freezes by coordinating DOM-heavy transitions across multiple components.
 * Instead of allowing many components to transition simultaneously (causing layout thrashing),
 * this queue processes transitions in small batches spread across multiple animation frames.
 *
 * PROBLEM IT SOLVES:
 * When switching pages in Weaverbird, 12-50+ MinecraftCSSBlock components would all transition
 * from 2D to 3D within a ~2 second window. Even with staggering, this caused Safari to freeze
 * because:
 * 1. Each transition triggers expensive layout recalculation (CSS 3D transforms)
 * 2. GPU layer allocation happens synchronously on the main thread
 * 3. Multiple simultaneous transitions compound the problem exponentially
 *
 * SOLUTION:
 * This queue ensures only 1-2 transitions happen per animation frame (~16ms), spreading
 * the work smoothly across frames and keeping the UI responsive.
 *
 * USAGE:
 * ```typescript
 * import { transitionQueue } from '@lib/transitionQueue';
 *
 * // In a component that needs to transition:
 * useEffect(() => {
 *   transitionQueue.enqueue(() => {
 *     setUse3DModel(true); // Expensive DOM update
 *   });
 * }, [dependency]);
 * ```
 */

type TransitionCallback = () => void;

class TransitionQueue {
  private queue: TransitionCallback[] = [];
  private processing = false;
  private transitionsPerFrame = 2; // Base: process 2 transitions per frame for smooth performance

  /**
   * Enqueues a transition callback to be executed during the next available frame.
   * If the queue is not currently processing, starts processing immediately.
   *
   * @param callback - Function to execute when it's this transition's turn
   */
  enqueue(callback: TransitionCallback): void {
    this.queue.push(callback);

    // Start processing if not already running
    if (!this.processing) {
      this.process();
    }
  }

  /**
   * Processes the queue by executing transitions in small batches per animation frame.
   * Uses requestAnimationFrame to ensure smooth, non-blocking execution.
   *
   * PERFORMANCE OPTIMIZATION: Dynamically adjusts batch size based on queue length.
   * - Large queues (20+): Process 4-6 per frame to clear faster
   * - Medium queues (10-20): Process 3 per frame
   * - Small queues (<10): Process 2 per frame for smoothness
   *
   * This creates a "drip-feed" effect where transitions happen progressively
   * instead of all at once, preventing browser freezes while still being responsive.
   */
  private process(): void {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;

    // Schedule next batch for the next animation frame
    requestAnimationFrame(() => {
      // PERFORMANCE FIX: Dynamically adjust batch size based on queue length
      // This prevents long delays on initial page loads with many blocks
      let batchSize: number;
      if (this.queue.length > 30) {
        batchSize = 4; // Very large queue: process more aggressively
      } else if (this.queue.length > 15) {
        batchSize = 3; // Medium queue: moderate speed
      } else {
        batchSize = this.transitionsPerFrame; // Small queue: smooth transition
      }

      // Execute a batch of transitions
      const batch = this.queue.splice(0, batchSize);

      try {
        batch.forEach((callback) => callback());
      } catch (error) {
        console.error("[TransitionQueue] Error executing transition:", error);
      }

      // Continue processing remaining queue
      this.process();
    });
  }

  /**
   * Clears all pending transitions from the queue.
   * Useful for cleanup when navigating away from a page.
   */
  clear(): void {
    this.queue = [];
    this.processing = false;
  }

  /**
   * Returns the current queue length (for debugging/monitoring)
   */
  get length(): number {
    return this.queue.length;
  }
}

// Export singleton instance for global coordination
export const transitionQueue = new TransitionQueue();
