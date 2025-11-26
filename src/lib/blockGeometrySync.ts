/**
 * Synchronous Block Geometry Processing (Fallback)
 *
 * This is a fallback implementation that runs on the main thread
 * in case the Web Worker fails to initialize.
 */

import {
  processElementsSync,
  type RenderedElement,
  type RenderedFace,
} from "./utils/blockGeometry";

export type { RenderedElement, RenderedFace };

export { processElementsSync };
