# Web Worker Implementation Guide

**Tech Stack:** React + TypeScript + Vite + Tauri  
**Last Updated:** 2025-01-21

## Table of Contents

1. [What Are Web Workers?](#what-are-web-workers)
2. [When to Use Web Workers](#when-to-use-web-workers)
3. [Implementation Pattern](#implementation-pattern)
4. [Step-by-Step Guide](#step-by-step-guide)
5. [Vite Configuration](#vite-configuration)
6. [Best Practices](#best-practices)
7. [Common Pitfalls](#common-pitfalls)
8. [Performance Testing](#performance-testing)
9. [Case Study: Block Geometry Worker](#case-study-block-geometry-worker)

---

## What Are Web Workers?

Web Workers are a browser API that allows you to run JavaScript in **separate threads**, parallel to the main UI thread. This prevents CPU-intensive operations from blocking user interactions.

### Key Characteristics:

- ✅ **True Parallelism** - Runs on separate CPU cores
- ✅ **Non-Blocking** - Main thread stays responsive
- ❌ **No DOM Access** - Workers can't manipulate the DOM
- ❌ **No Window Access** - No access to `window`, `document`, etc.
- ✅ **Message Passing** - Communicate via `postMessage()`

### Mental Model:

```
Main Thread (UI)          Worker Thread
    │                          │
    ├─ Render DOM              ├─ Heavy computation
    ├─ Handle events           ├─ Data processing
    ├─ React updates           ├─ Complex algorithms
    │                          │
    │◄────postMessage()────────┤
    │─────postMessage()───────►│
```

---

## When to Use Web Workers

### ✅ **GOOD USE CASES:**

1. **CPU-Intensive Calculations**
   - Complex math (geometry, physics simulations)
   - Data transformations (parsing, sorting large datasets)
   - Image/video processing
   - Cryptography

2. **Signs You Need a Worker:**
   - Operations take > 16ms (blocks 60fps)
   - Users report UI freezing/janky scrolling
   - Chrome DevTools shows long tasks (yellow/red)
   - `requestAnimationFrame` drops frames

3. **Specific Scenarios:**
   - Processing large JSON files
   - Parsing complex data structures
   - Real-time data analysis
   - Heavy string manipulation

### ❌ **BAD USE CASES:**

1. **DOM Manipulation** - Workers can't access DOM
2. **Simple Operations** - Overhead not worth it (< 5ms tasks)
3. **Highly Interactive** - Lots of back-and-forth with UI
4. **Small Data** - Serialization overhead > processing time

### **Rule of Thumb:**

```typescript
// Measure first!
console.time('operation');
const result = heavyOperation(data);
console.timeEnd('operation');

// If > 16ms → Consider Web Worker
// If > 50ms → Definitely use Web Worker
```

---

## Implementation Pattern

We use a **three-file pattern** for Web Workers in this codebase:

```
src/
├── workers/
│   └── myFeature.worker.ts      # The worker thread code
├── lib/
│   ├── myFeatureWorker.ts       # Main thread manager/API
│   └── myFeatureSync.ts         # Fallback (same logic, no worker)
```

### Why Three Files?

1. **`worker.ts`** - Isolated worker code (no DOM dependencies)
2. **`workerManager.ts`** - Clean API for components to use
3. **`sync.ts`** - Fallback for environments where workers fail

---

## Step-by-Step Guide

### **Step 1: Identify the Heavy Function**

Find the function that's blocking the main thread:

```typescript
// BEFORE - Blocking main thread
function processElements(elements, textures, scale) {
  // 20-50ms of heavy computation
  const results = [];
  for (const element of elements) {
    // Complex calculations...
  }
  return results;
}
```

### **Step 2: Create the Worker File**

**File:** `src/workers/myFeature.worker.ts`

```typescript
/**
 * Web Worker for [Feature Name]
 * 
 * Handles CPU-intensive [what it does] processing.
 * Runs off the main thread to keep UI responsive.
 */

// Define message types for type safety
export interface WorkerRequest {
  id: string;
  data: YourDataType;
  config: ConfigType;
}

export interface WorkerResponse {
  id: string;
  result: ResultType;
}

// Copy/move the heavy functions here
function heavyComputation(data: YourDataType): ResultType {
  // Your CPU-intensive logic
  const result = /* complex processing */;
  return result;
}

// Worker message handler
self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { id, data, config } = event.data;

  try {
    // Do the heavy work
    const result = heavyComputation(data);

    // Send result back to main thread
    const response: WorkerResponse = { id, result };
    self.postMessage(response);
  } catch (error) {
    console.error('[MyFeatureWorker] Error:', error);
    // Send error or empty result
    self.postMessage({ id, result: null });
  }
};
```

**Key Points:**
- Export types for TypeScript
- Use `self.onmessage` to listen for messages
- Use `self.postMessage()` to send results back
- Handle errors gracefully

### **Step 3: Create the Worker Manager**

**File:** `src/lib/myFeatureWorker.ts`

```typescript
/**
 * Worker Manager for [Feature Name]
 * 
 * Provides a clean API for using the Web Worker.
 */

import type { WorkerRequest, WorkerResponse } from '@/workers/myFeature.worker';

class MyFeatureWorkerManager {
  private worker: Worker | null = null;
  private pendingRequests = new Map<string, (result: ResultType) => void>();
  private requestCounter = 0;

  constructor() {
    this.initWorker();
  }

  private initWorker(): void {
    try {
      // Vite-specific: Use new URL() pattern for worker imports
      this.worker = new Worker(
        new URL('@/workers/myFeature.worker.ts', import.meta.url),
        { type: 'module' }
      );

      this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { id, result } = event.data;
        const callback = this.pendingRequests.get(id);
        
        if (callback) {
          callback(result);
          this.pendingRequests.delete(id);
        }
      };

      this.worker.onerror = (error) => {
        console.error('[MyFeatureWorker] Worker error:', error);
      };
    } catch (error) {
      console.error('[MyFeatureWorker] Failed to initialize worker:', error);
      this.worker = null;
    }
  }

  /**
   * Process data using the Web Worker
   */
  async process(data: YourDataType, config: ConfigType): Promise<ResultType> {
    // Fallback to sync processing if worker failed to load
    if (!this.worker) {
      console.warn('[MyFeatureWorker] Worker not available, using fallback');
      const { processSync } = await import('./myFeatureSync');
      return processSync(data, config);
    }

    return new Promise((resolve) => {
      const id = `request_${++this.requestCounter}`;
      
      this.pendingRequests.set(id, resolve);

      const request: WorkerRequest = { id, data, config };
      this.worker!.postMessage(request);
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
export const myFeatureWorker = new MyFeatureWorkerManager();
```

**Key Points:**
- Singleton pattern for global worker instance
- Promise-based API for clean async/await usage
- Automatic fallback if worker fails
- Request ID tracking for multiple concurrent requests

### **Step 4: Create the Sync Fallback**

**File:** `src/lib/myFeatureSync.ts`

```typescript
/**
 * Synchronous fallback for [Feature Name]
 * 
 * Used when Web Worker fails to initialize.
 * Contains identical logic to the worker.
 */

export function processSync(data: YourDataType, config: ConfigType): ResultType {
  // Copy the EXACT same logic from the worker
  // This ensures behavior is identical
  const result = /* same computation */;
  return result;
}
```

**Key Points:**
- Identical logic to worker (consider sharing code if possible)
- Synchronous implementation (no async needed)
- Only used as fallback

### **Step 5: Use in Components**

```typescript
import { myFeatureWorker } from '@lib/myFeatureWorker';

function MyComponent() {
  const [result, setResult] = useState(null);

  useEffect(() => {
    const process = async () => {
      // This runs in the worker (non-blocking!)
      const data = await myFeatureWorker.process(inputData, config);
      setResult(data);
    };
    
    process();
  }, [inputData, config]);

  return <div>{/* render result */}</div>;
}
```

**Key Points:**
- Use async/await
- Worker runs in background
- Main thread stays responsive

---

## Vite Configuration

Vite automatically handles Web Workers with the correct import syntax. **No configuration needed!**

### **Correct Import Pattern:**

```typescript
// ✅ CORRECT - Vite will bundle this as a separate worker file
const worker = new Worker(
  new URL('./my.worker.ts', import.meta.url),
  { type: 'module' }
);
```

### **Incorrect Patterns:**

```typescript
// ❌ WRONG - Won't work with Vite
import MyWorker from './my.worker.ts?worker';

// ❌ WRONG - Not portable
const worker = new Worker('/workers/my.worker.js');
```

### **Build Output:**

When you run `npm run build`, you'll see:

```
dist/
├── index.html
├── assets/
│   ├── myFeature.worker-abc123.js    ← Worker bundled separately
│   ├── myFeatureSync-def456.js       ← Fallback code-split
│   └── index-xyz789.js               ← Main bundle
```

Vite automatically:
- Bundles workers as separate files
- Handles imports and dependencies
- Code-splits the fallback

---

## Best Practices

### **1. Data Transfer Optimization**

**✅ DO:**
```typescript
// Transfer plain objects/arrays (structured clone is fast)
worker.postMessage({
  elements: [...], // Array of plain objects
  config: { scale: 2 }
});
```

**❌ DON'T:**
```typescript
// Don't transfer DOM nodes, functions, or complex class instances
worker.postMessage({
  element: document.querySelector('#foo'), // ❌ Can't serialize
  callback: () => {},                       // ❌ Can't serialize
  instance: new MyClass()                   // ❌ Loses methods
});
```

### **2. Handle Serialization**

For Maps, Sets, and other non-plain structures:

```typescript
// Sending to worker
const textureUrlsObj = Object.fromEntries(textureUrlsMap);
worker.postMessage({ textureUrls: textureUrlsObj });

// In worker
const textureUrlsMap = new Map(Object.entries(data.textureUrls));
```

### **3. Error Handling**

Always handle errors in both directions:

```typescript
// In worker
self.onmessage = (event) => {
  try {
    const result = heavyWork(event.data);
    self.postMessage({ success: true, result });
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
};

// In manager
worker.onmessage = (event) => {
  if (event.data.success) {
    resolve(event.data.result);
  } else {
    reject(new Error(event.data.error));
  }
};
```

### **4. Memory Management**

```typescript
// Cleanup on unmount
useEffect(() => {
  return () => {
    myFeatureWorker.terminate();
  };
}, []);
```

### **5. Shared Code**

If worker and fallback share lots of code, create a shared module:

```
src/lib/
├── myFeatureCore.ts     # Shared pure functions
├── myFeature.worker.ts  # Worker wrapper (imports core)
└── myFeatureSync.ts     # Sync wrapper (imports core)
```

### **6. Testing**

Test both worker and fallback paths:

```typescript
describe('MyFeature', () => {
  it('should process with worker', async () => {
    const result = await myFeatureWorker.process(data);
    expect(result).toEqual(expected);
  });

  it('should process with sync fallback', async () => {
    const { processSync } = await import('./myFeatureSync');
    const result = processSync(data);
    expect(result).toEqual(expected);
  });
});
```

---

## Common Pitfalls

### **1. Trying to Access DOM**

```typescript
// ❌ This will crash the worker
self.onmessage = () => {
  const div = document.createElement('div'); // ReferenceError!
};
```

**Solution:** Do DOM operations in the main thread only.

### **2. Importing Components/React**

```typescript
// ❌ Workers can't use React
import { useState } from 'react'; // Error!
```

**Solution:** Workers should only import pure utility functions.

### **3. Shared State**

```typescript
// ❌ Workers don't share variables with main thread
let sharedCounter = 0; // Main thread
// Worker can't access sharedCounter
```

**Solution:** Pass all data via `postMessage()`.

### **4. Circular References**

```typescript
// ❌ Can't serialize circular references
const obj = { self: null };
obj.self = obj;
worker.postMessage(obj); // DataCloneError!
```

**Solution:** Clean your data before sending.

### **5. Too Much Data Transfer**

```typescript
// ❌ Sending 50MB of data to worker
worker.postMessage(hugeMegabytesOfData); // Slow!
```

**Solution:** 
- Use Transferable objects for large ArrayBuffers
- Process data in chunks
- Consider if worker is even needed

### **6. Forgetting TypeScript Types**

```typescript
// ❌ Losing type safety
worker.postMessage({ foo: 123 }); // Any type!
```

**Solution:** Define request/response interfaces.

---

## Performance Testing

### **Measure Before & After**

```typescript
// Before worker
console.time('processing');
const result = processElements(data);
console.timeEnd('processing');
// processing: 45ms

// After worker
console.time('processing-async');
const result = await myFeatureWorker.process(data);
console.timeEnd('processing-async');
// processing-async: 2ms (main thread)
// (Worker processes in 45ms in background)
```

### **Chrome DevTools**

1. **Performance Tab**
   - Record during the operation
   - Look for "Long Tasks" (yellow/red)
   - Before: Long tasks block rendering
   - After: Short tasks, smooth frames

2. **Main Thread Timeline**
   - Before: Solid yellow bar (blocked)
   - After: Gaps (main thread idle while worker works)

3. **Worker Timeline**
   - Check the "Workers" section
   - Verify work is happening in parallel

### **Metrics to Track**

```typescript
// Frame rate during processing
let frameCount = 0;
let rafId;

function countFrames() {
  frameCount++;
  rafId = requestAnimationFrame(countFrames);
}

countFrames();

// Start heavy processing
await myFeatureWorker.process(data);

// Stop counting
cancelAnimationFrame(rafId);
console.log(`Frames during processing: ${frameCount}`);
// Before: 5-10 frames (janky)
// After: 60+ frames (smooth)
```

---

## Case Study: Block Geometry Worker

### **The Problem**

In Weaverbird, when users switched pages:
- 12-50 `MinecraftCSSBlock` components mounted
- Each needed to process block models into 3D face geometry
- Processing took 20-50ms per block
- UI froze, scrolling was janky

### **The Solution**

Created a Web Worker to handle geometry processing:

```
src/
├── workers/
│   └── blockGeometry.worker.ts       # Geometry processing
├── lib/
│   ├── blockGeometryWorker.ts        # Worker manager
│   └── blockGeometrySync.ts          # Fallback
```

### **What Runs in the Worker**

```typescript
// CPU-intensive functions moved to worker:
- resolveTextureRef()      // String manipulation
- normalizeUV()            // Math calculations
- calculateFaceOffsets()   // Trigonometry
- getColormapType()        # String parsing
- processElements()        // Main processing loop
```

### **Results**

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Main thread block time | 45ms | 2ms | **95% reduction** |
| Scroll FPS during transitions | 15-30 fps | 60 fps | **2-4x faster** |
| Perceived smoothness | Janky ❌ | Smooth ✅ | **Night & day** |

### **Implementation Details**

**Worker sends:**
```typescript
{
  id: 'request_1',
  elements: ModelElement[],    // Block model data
  textures: Record<string, string>,
  textureUrls: Map<string, string>,
  scale: number
}
```

**Worker receives:**
```typescript
{
  id: 'request_1',
  renderedElements: RenderedElement[]  // Computed geometry
}
```

**Component usage:**
```typescript
// Before - blocked main thread
const rendered = processElements(elements, textures, urls, scale);

// After - runs in worker
const rendered = await blockGeometryWorker.processElements(
  elements, textures, urls, scale
);
```

### **Key Learnings**

1. **Identify the bottleneck first** - Used Chrome DevTools to find the 45ms blocking operation
2. **Measure impact** - Scroll FPS went from 15 → 60
3. **Keep API simple** - Components just call `await worker.process()`
4. **Always have fallback** - Sync implementation for when worker fails
5. **Type safety matters** - Strict types prevent runtime errors

---

## Checklist for Implementing Workers

- [ ] Profiled and confirmed operation takes > 16ms
- [ ] Verified operation doesn't need DOM access
- [ ] Created `worker.ts` file with pure functions
- [ ] Defined TypeScript interfaces for messages
- [ ] Created `workerManager.ts` with Promise-based API
- [ ] Created `sync.ts` fallback implementation
- [ ] Updated component to use `await worker.method()`
- [ ] Tested both worker and fallback paths
- [ ] Verified no memory leaks (terminate on unmount)
- [ ] Measured performance improvement
- [ ] Documented worker's purpose and usage

---

## Resources

### **Official Docs**
- [MDN: Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [Vite: Web Workers](https://vitejs.dev/guide/features.html#web-workers)

### **Performance Tools**
- Chrome DevTools Performance Tab
- React DevTools Profiler
- `console.time()` / `console.timeEnd()`

### **In This Codebase**
- Working example: `src/workers/blockGeometry.worker.ts`
- Manager pattern: `src/lib/blockGeometryWorker.ts`
- Fallback pattern: `src/lib/blockGeometrySync.ts`

---

## Quick Reference

### **When to Use Workers**

```
Operation time > 16ms? → Consider worker
Operation time > 50ms? → Definitely use worker
Blocks scrolling/input? → Use worker
Simple calculation?     → Don't use worker
Needs DOM access?       → Don't use worker
```

### **File Pattern**

```
workers/feature.worker.ts  → Heavy computation
lib/featureWorker.ts       → Manager (API)
lib/featureSync.ts         → Fallback
```

### **Import Pattern (Vite)**

```typescript
new Worker(
  new URL('./my.worker.ts', import.meta.url),
  { type: 'module' }
)
```

### **Message Pattern**

```typescript
// Main → Worker
worker.postMessage({ id, data });

// Worker → Main
self.postMessage({ id, result });
```

---

**Last Updated:** 2025-01-21  
**Maintainer:** Development Team  
**Questions?** Check existing workers in `src/workers/` for reference implementations.
