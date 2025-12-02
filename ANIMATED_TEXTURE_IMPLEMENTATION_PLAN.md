# Animated Texture Implementation Plan

## Problem Statement

Many Minecraft blocks use animated textures (seagrass, water, lava, fire, nether portal, etc.) where the texture file contains multiple animation frames stacked vertically. Currently, Weaverbird renders the entire animation strip in the space one frame should occupy, resulting in severely distorted visuals.

**Example Issue:**
- Seagrass texture: 16×288 pixels (18 frames of 16×16 each)
- Current behavior: All 18 frames displayed at once, stretched into a 16×16 space
- Expected behavior: Only the first frame (or current animation frame) displayed

## Research Findings

### Minecraft Animation Format

Based on research from the [Minecraft Wiki Resource Pack documentation](https://minecraft.wiki/w/Resource_pack) and [Custom Animations - OptiDocs](https://optifine.readthedocs.io/custom_animations.html):

**Texture Layout:**
- Animation frames are stacked vertically in a single PNG file
- Each frame is square (width × width)
- Total height = width × number of frames
- Examples:
  - `seagrass.png`: 16×288 (18 frames)
  - `water_still.png`: 16×512 (32 frames)
  - `lava_still.png`: 16×320 (20 frames)
  - `fire_0.png`: 16×512 (32 frames)
  - `nether_portal.png`: 16×512 (32 frames)

**Metadata Format (.mcmeta):**
- Companion file: `texture.png.mcmeta`
- JSON structure:
```json
{
  "animation": {
    "frametime": 1,        // Ticks per frame (default: 1)
    "interpolate": false,  // Smooth interpolation (default: false)
    "frames": [            // Optional frame order (default: sequential)
      {"index": 0, "time": 60},
      {"index": 1, "time": 2}
    ]
  }
}
```

**Default Behavior (no .mcmeta):**
- If texture height > width AND height is evenly divisible by width
- Automatically treated as animated
- Each frame lasts 1 tick
- Frames play sequentially: 0, 1, 2, ... N-1, 0, ...

## Current Texture Flow Analysis

### 1. **2D Rendering (MinecraftCSSBlock - Block2D component)**
   - **Path:** `src/components/MinecraftCSSBlock/components/Block2D/index.tsx`
   - **Current behavior:** Renders `<img>` with full texture URL
   - **Issue:** Entire animation strip displayed
   - **Solution needed:** Use CSS `object-fit` and `object-position` to crop to first frame

### 2. **3D CSS Rendering (MinecraftCSSBlock - Block3D component)**
   - **Path:** `src/components/MinecraftCSSBlock/components/Block3D/index.tsx`
   - **Current behavior:** Each face uses `<img>` with UV coordinates
   - **Issue:** UV coordinates don't account for animation frames
   - **Solution needed:** Adjust UV coordinates to reference only the first frame

### 3. **3D Three.js Rendering (Preview3D - BlockModel)**
   - **Path:** `src/components/Preview3D/BlockModel.tsx`
   - **Uses:** `textureLoader.ts` → `modelConverter.ts`
   - **Current behavior:** THREE.TextureLoader loads entire texture
   - **Issue:** Texture coordinates span entire image
   - **Solution needed:** Adjust Three.js texture `repeat` and `offset` properties

### 4. **3D Three.js Entity Rendering**
   - **Path:** `src/components/Preview3D/EntityModel.tsx`
   - **Uses:** `textureLoader.ts` → `jemLoader.ts` → `entityGeometry.ts`
   - **Current behavior:** Similar to BlockModel
   - **Solution needed:** Same as BlockModel approach

### 5. **Texture Loading Pipeline**
   - **Path:** `src/lib/three/textureLoader.ts`
   - **Functions:** `loadPackTexture()`, `loadVanillaTexture()`, `createTextureLoader()`
   - **Current behavior:** Loads textures as-is, applies filters, caches
   - **Opportunity:** **Best place to intercept and process animations**

## Proposed Solution Architecture

### Core Utility: `parseAnimationTexture()`

Create a new utility module: `src/lib/utils/animationTexture.ts`

```typescript
export interface AnimationMetadata {
  frametime: number;
  interpolate: boolean;
  frames?: Array<{ index: number; time?: number }>;
}

export interface ParsedAnimationTexture {
  isAnimated: boolean;
  frameCount: number;
  frameWidth: number;
  frameHeight: number;
  metadata: AnimationMetadata | null;
  
  // For CSS rendering (2D/3D CSS)
  firstFrameCSS: {
    width: string;
    height: string;
    objectFit: string;
    objectPosition: string;
  };
  
  // For Three.js rendering
  threeJsConfig: {
    repeat: [number, number];
    offset: [number, number];
  };
}

export async function parseAnimationTexture(
  textureUrl: string,
  mcmetaUrl?: string
): Promise<ParsedAnimationTexture>
```

**Implementation Details:**

1. **Load texture image** to get dimensions
2. **Check if animated:**
   - Height > Width AND Height % Width === 0
3. **Try to load .mcmeta** (optional):
   - URL: `${textureUrl}.mcmeta`
   - If exists, parse JSON
   - If not, use defaults
4. **Calculate frame count:**
   - `frameCount = height / width`
5. **Return configuration** for both CSS and Three.js

### Integration Points

#### 1. **Texture Loader (RECOMMENDED - Most DRY)**

**File:** `src/lib/three/textureLoader.ts`

**Strategy:** Process animations at the point of texture loading, before caching.

```typescript
export async function loadPackTexture(
  packPath: string,
  textureId: string,
  isZip: boolean,
): Promise<THREE.Texture | null> {
  // ... existing code to get texturePath ...
  
  const textureUrl = convertFileSrc(texturePath);
  
  // NEW: Parse animation metadata
  const animInfo = await parseAnimationTexture(textureUrl);
  
  const texture = await new Promise<THREE.Texture>((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.load(textureUrl, (tex) => {
      // Existing config
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      
      // NEW: Apply animation frame cropping
      if (animInfo.isAnimated) {
        tex.repeat.set(
          animInfo.threeJsConfig.repeat[0],
          animInfo.threeJsConfig.repeat[1]
        );
        tex.offset.set(
          animInfo.threeJsConfig.offset[0],
          animInfo.threeJsConfig.offset[1]
        );
      }
      
      resolve(tex);
    }, undefined, reject);
  });
  
  // Cache with animation info as metadata
  textureCache.set(cacheKey, texture);
  return texture;
}
```

**Advantages:**
- ✅ Single point of modification
- ✅ Works for ALL Three.js rendering (blocks, entities)
- ✅ DRY - no code duplication
- ✅ Cached textures already have animation applied

**Limitations:**
- ❌ Doesn't help CSS rendering (Block2D, Block3D)
- Need separate solution for CSS components

#### 2. **CSS Block Components**

**File:** `src/components/MinecraftCSSBlock/components/Block2D/index.tsx`

```typescript
export const Block2D = ({ textureUrl, alt, size, onError }: Block2DProps) => {
    const [animInfo, setAnimInfo] = useState<ParsedAnimationTexture | null>(null);
    
    useEffect(() => {
        parseAnimationTexture(textureUrl).then(setAnimInfo);
    }, [textureUrl]);
    
    const cssStyle = animInfo?.isAnimated 
        ? animInfo.firstFrameCSS 
        : {};
    
    return (
        <div className={s.blockContainer} style={{ width: size, height: size }}>
            <img
                src={textureUrl}
                alt={alt}
                className={s.fallbackTexture}
                style={cssStyle}  // Apply animation frame cropping
                onError={onError}
                draggable={false}
            />
        </div>
    );
};
```

**File:** `src/components/MinecraftCSSBlock/components/Block3D/index.tsx`

For 3D CSS blocks, we need to adjust UV calculations in the worker that generates faces. The UV coordinates need to be scaled to reference only the first frame of the animation.

**Approach:**
- Pass animation info through the rendering pipeline
- Adjust UV coordinates in `blockGeometryWorker` or when rendering faces
- Scale V coordinates by `1/frameCount` to show only first frame

### Implementation Phases

## Phase 1: Core Animation Parser ✅
**File:** `src/lib/utils/animationTexture.ts`

- Implement `parseAnimationTexture()` function
- Handle image dimension detection
- Parse .mcmeta files (with Tauri backend support if needed)
- Calculate CSS and Three.js configurations
- Add comprehensive tests

## Phase 2: Three.js Integration ✅
**Files:** `src/lib/three/textureLoader.ts`

- Integrate `parseAnimationTexture()` into `loadPackTexture()`
- Integrate into `loadVanillaTexture()`
- Update texture cache to include animation metadata
- Test with seagrass, water, lava, fire, portal

## Phase 3: CSS 2D Integration ✅
**File:** `src/components/MinecraftCSSBlock/components/Block2D/index.tsx`

- Add animation detection
- Apply CSS cropping for animated textures
- Test with entity icons and item textures

## Phase 4: CSS 3D Integration ✅
**Files:** 
- `src/components/MinecraftCSSBlock/components/Block3D/index.tsx`
- `src/workers/blockGeometry.worker.ts`

- Pass animation info through rendering pipeline
- Adjust UV coordinates for animated textures
- Ensure proper scaling of V coordinates
- Test complex blocks with animated textures

## Phase 5: Resource Pack Support ✅
**Testing:**

- Test with custom resource packs that add animations
- Test with packs that override vanilla animations
- Verify .mcmeta parsing for custom framerates/orders
- Handle edge cases (missing .mcmeta, malformed JSON)

## Technical Considerations

### Performance
- **Caching:** Parse animation info once, cache with texture
- **Lazy loading:** Only parse when texture is loaded
- **Worker-safe:** Ensure parsing can happen in web workers if needed

### Edge Cases
1. **Non-square textures:** Some textures might not be perfectly square
2. **Custom frame orders:** .mcmeta can specify non-sequential frames
3. **Variable frame times:** Different frames can have different durations
4. **Missing .mcmeta:** Must gracefully handle missing metadata files
5. **ZIP resource packs:** .mcmeta files inside ZIP archives

### Future Enhancements (Out of Scope for Initial Implementation)
1. **Actual animation:** Play animations instead of showing static first frame
2. **Frame interpolation:** Support `"interpolate": true` for smooth animations
3. **Custom frame selection:** UI to preview different animation frames
4. **Performance mode:** Option to disable animation processing for better performance

## File Structure

```
src/lib/utils/animationTexture.ts          # Core parser utility
src/lib/utils/animationTexture.test.ts     # Unit tests
src/lib/three/textureLoader.ts             # Modified (Three.js integration)
src/components/MinecraftCSSBlock/          # Modified (CSS integration)
  components/Block2D/index.tsx
  components/Block3D/index.tsx
src/workers/blockGeometry.worker.ts        # Modified (UV adjustment)
```

## Testing Strategy

### Unit Tests
- Parse standard animated textures (seagrass, water, lava)
- Parse textures with .mcmeta files
- Handle non-animated textures
- Handle malformed data

### Integration Tests
- Render seagrass in 2D view
- Render seagrass in 3D CSS view
- Render seagrass in 3D Three.js view
- Render water, lava, fire, portal in all views
- Test with custom resource packs

### Visual Regression
- Compare rendered outputs before/after implementation
- Ensure non-animated textures unchanged
- Verify animated textures show only first frame correctly

## Success Criteria

✅ Seagrass renders correctly in all three rendering modes  
✅ Water, lava, fire, nether portal render correctly  
✅ Custom resource pack animations are supported  
✅ .mcmeta files are properly parsed when present  
✅ No performance regression for non-animated textures  
✅ Code follows DRY principles (minimal duplication)  
✅ Comprehensive test coverage

## Sources

- [Minecraft Wiki - Resource pack](https://minecraft.wiki/w/Resource_pack)
- [Custom Animations - OptiDocs](https://optifine.readthedocs.io/custom_animations.html)
- [Tutorials/Creating a resource pack – Minecraft Wiki](https://minecraft.fandom.com/wiki/Tutorials/Creating_a_resource_pack)
- [MoreMcmeta - Animation Format](https://github.com/MoreMcmeta/core/wiki/User-Docs:-Animation-Format)
