/**
 * View Transitions API Utility
 *
 * Provides progressive enhancement for the View Transitions API with proper
 * fallback support for browsers that don't support it yet.
 *
 * BROWSER SUPPORT (as of 2025):
 * - Chrome 111+ ✅
 * - Edge 111+ ✅
 * - Safari 18+ ✅
 * - Firefox 144+ ✅
 *
 * SOURCES:
 * - https://developer.chrome.com/docs/web-platform/view-transitions
 * - https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition
 * - https://developer.chrome.com/blog/view-transitions-in-2025
 */

/**
 * Options for view transition helper
 */
export interface ViewTransitionOptions {
  /**
   * The DOM update function to wrap in a view transition
   */
  update: () => void | Promise<void>;

  /**
   * Skip the transition even if supported (for testing or user preference)
   */
  skipTransition?: boolean;

  /**
   * Callback when transition is ready (after old snapshot)
   */
  onReady?: () => void;

  /**
   * Callback when transition finishes
   */
  onFinished?: () => void;

  /**
   * Callback on transition error/abort
   */
  onError?: (error: Error) => void;
}

/**
 * Result of a view transition (matches Web API ViewTransition interface)
 */
export interface ViewTransitionResult {
  /**
   * Promise that resolves when the transition pseudo-elements are created
   */
  ready: Promise<void>;

  /**
   * Promise that resolves when the update callback completes
   */
  updateCallbackDone: Promise<void>;

  /**
   * Promise that resolves when the transition animation completes
   */
  finished: Promise<void>;

  /**
   * Skip the animation and jump to final state
   */
  skipTransition: () => void;
}

/**
 * Helper function to run View Transitions with proper fallback support.
 *
 * This function uses progressive enhancement - if the browser supports
 * View Transitions, it uses them. Otherwise, it runs the update immediately.
 *
 * @example
 * ```typescript
 * import { viewTransition } from '@lib/viewTransitions';
 *
 * const handleContentSwap = () => {
 *   viewTransition({
 *     update: () => {
 *       setActiveTab('newTab');
 *     },
 *     onFinished: () => {
 *       console.log('Transition complete!');
 *     }
 *   });
 * };
 * ```
 */
export function viewTransition(
  options: ViewTransitionOptions,
): ViewTransitionResult {
  const { update, skipTransition = false, onReady, onFinished, onError } =
    options;

  /**
   * Fallback for unsupported browsers
   * Returns a ViewTransition-like object with rejected promises
   */
  const runWithoutTransition = (reason: string): ViewTransitionResult => {
    console.debug(`[ViewTransitions] ${reason}, running update without transition`);

    // Run the update synchronously
    const updateCallbackDone = Promise.resolve(update()).then(() => {});

    // Create rejected ready/finished promises to match API
    const rejected = Promise.reject(new Error(reason));

    // Prevent unhandled rejection warnings
    rejected.catch(() => {});

    // Call onFinished immediately since there's no animation
    updateCallbackDone.then(() => {
      onFinished?.();
    }).catch((err) => {
      onError?.(err);
    });

    return {
      ready: rejected,
      updateCallbackDone,
      finished: updateCallbackDone,
      skipTransition: () => {}, // No-op since there's no transition
    };
  };

  // Check if user explicitly wants to skip
  if (skipTransition) {
    return runWithoutTransition('skipTransition flag was set to true');
  }

  // Feature detection: Check if View Transitions are supported
  if (!document.startViewTransition) {
    return runWithoutTransition(
      'View Transitions API not supported in this browser',
    );
  }

  // Browser supports View Transitions - use the native API!
  try {
    const transition = document.startViewTransition(update);

    // Attach callbacks if provided
    if (onReady) {
      transition.ready.then(onReady).catch(() => {
        // Transition was skipped - that's okay
      });
    }

    if (onFinished) {
      transition.finished.then(onFinished).catch(() => {
        // Transition was skipped or errored - that's okay
      });
    }

    if (onError) {
      transition.finished.catch(onError);
    }

    return transition;
  } catch (error) {
    // Unexpected error - fall back to immediate update
    console.error('[ViewTransitions] Unexpected error:', error);
    return runWithoutTransition('Unexpected error during view transition');
  }
}

/**
 * Check if View Transitions are supported in the current browser
 *
 * @returns true if the browser supports document.startViewTransition
 *
 * @example
 * ```typescript
 * if (isViewTransitionsSupported()) {
 *   // Browser supports View Transitions
 *   console.log('View Transitions available!');
 * }
 * ```
 */
export function isViewTransitionsSupported(): boolean {
  return typeof document !== 'undefined' && 'startViewTransition' in document;
}

/**
 * React hook to check View Transitions support
 * Returns true if supported, false otherwise
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const supportsTransitions = useViewTransitionsSupport();
 *
 *   return (
 *     <div>
 *       {supportsTransitions ? '✨ Smooth transitions!' : '⚡ Instant updates'}
 *     </div>
 *   );
 * }
 * ```
 */
export function useViewTransitionsSupport(): boolean {
  return isViewTransitionsSupported();
}
