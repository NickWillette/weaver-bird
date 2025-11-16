# 3D Preview Implementation Status

## Overview
The 3D preview feature allows users to visualize Minecraft blocks in real-time as they select different textures from resource packs. This document tracks the implementation progress.

## Technology Stack
- **React Three Fiber** (v9.4.0) - Declarative 3D rendering in React
- **Three.js** (v0.181.1) - Underlying 3D graphics engine
- **@react-three/drei** (v10.7.7) - Helper components (OrbitControls, Camera, Environment)
- **@xmcl/model** (v2.0.5) - Minecraft JSON model parser (to be integrated)

## Completed ✅

### Phase 1: Foundation & Infrastructure (✅ Complete)
- **Dependency Management**
  - Upgraded React to v19.2.0 for R3F compatibility
  - Installed React Three Fiber and Three.js ecosystem
  - Added @xmcl/model for Minecraft model parsing
  - Resolved all peer dependency conflicts

- **Basic 3D Scene Setup**
  - Created `Preview3D` component with full R3F Canvas
  - Implemented camera system (PerspectiveCamera at [2,2,2] with 50° FOV)
  - Added OrbitControls (rotate only, zoom range 1.5-5 units)
  - Configured lighting (ambient + 2 directional lights)
  - Added environment preset for realistic reflections
  - Included ground plane for spatial reference

- **Error Handling & Debugging**
  - Comprehensive console logging at all lifecycle stages
  - LoadingFallback and ErrorFallback components
  - Try-catch blocks in model creation
  - Canvas error handlers (`onCreated`, `onError`)

- **Placeholder Implementation**
  - `BlockModel` component renders brown cube (0x8B4513)
  - Connected to Zustand state (useSelectWinner, useSelectPack)
  - Gentle rotation animation for visual feedback
  - Position offset to sit on ground plane (y = 0.5)

### Phase 2: Model Loading (✅ Complete)
**Goal**: Replace placeholder cube with actual Minecraft block models

- **Tauri Backend Integration**
  - Created `read_block_model` Rust command in `src-tauri/src/commands/packs.rs`
  - Reads model JSON from resource pack filesystem
  - Falls back to vanilla Minecraft models if not found
  - Returns fully resolved BlockModel with parent inheritance applied
  - New module: `src-tauri/src/util/block_models.rs`

- **Model Parsing & Conversion**
  - Built custom TypeScript converter (no @xmcl/model dependency needed)
  - Converts Minecraft JSON cuboid elements to Three.js BoxGeometry
  - Handles model parent inheritance on backend (Rust)
  - Resolves texture variables (#all, #texture0, etc.)
  - Supports element rotations and custom positioning
  - New module: `src/lib/three/modelConverter.ts`

- **Texture Loading**
  - Loads PNG textures from resource pack filesystem
  - Uses Tauri `convertFileSrc` for secure file access
  - Maps textures to model faces per JSON specification
  - Implements texture caching to prevent redundant loads
  - Falls back to vanilla textures if pack texture missing
  - Nearest-neighbor filtering for pixelated Minecraft look
  - New module: `src/lib/three/textureLoader.ts`

- **Frontend Integration**
  - Updated `BlockModel.tsx` to load real models
  - Async model loading with loading states
  - Error handling with graceful fallback to placeholder
  - Proper cleanup of Three.js resources on unmount
  - TypeScript bindings: `src/lib/tauri/blockModels.ts`

### Phase 3: Robustness & Debugging (✅ Complete)
**Goal**: Fix critical issues and add comprehensive debugging

- **Canvas Persistence**
  - Canvas now stays mounted to prevent WebGL context loss
  - Uses CSS display:none instead of conditional rendering
  - Placeholder shown when no asset selected

- **Proper Blockstate Resolution**
  - Created blockstate parser module (`src-tauri/src/util/blockstates.rs`)
  - Resolves texture ID → blockstate → model (correct Minecraft flow)
  - Supports both "variants" and "multipart" blockstates
  - Falls back to vanilla blockstates when pack doesn't override

- **Enhanced Model Converter**
  - Comprehensive logging at every step
  - Magenta (0xff00ff) for missing textures (easy to spot)
  - Orange (0xff6b00) for missing model elements
  - Better texture variable resolution with cycle detection
  - Support for element rotations with rescaling

- **Enhanced Texture Loader**
  - Detailed logging for every texture load attempt
  - Progress tracking during load
  - Clear error messages for debugging
  - Proper cache key management

## In Progress 🚧

### Phase 4: Manual Testing
**Goal**: Test with real resource packs and fix discovered issues

## Remaining 🔜

### Phase 5: Advanced Block Types
**Goal**: Support all Minecraft block rendering types

- **Multi-block Models**
  - Doors (span 2 vertical blocks)
  - Beds (span 2 horizontal blocks)
  - Detect and render complete multi-block structures

- **Simple/Cross Models**
  - Flowers, grass, saplings (cross-pattern geometry)
  - Detect model type from JSON structure
  - Generate appropriate geometry (two intersecting planes)

- **Custom 3D Models**
  - Full BlockBench model support
  - Complex multi-element models
  - Custom rotations and positions

### Phase 6: Real-time Updates
**Goal**: Dynamic texture swapping without re-rendering

- **Pencil Selection Integration**
  - Watch for manual pack selection changes
  - Reload only affected textures (not entire model)
  - Animate texture transitions
  - Update pencil icon in block card

- **Performance Optimization**
  - Texture caching to avoid redundant loads
  - Geometry reuse for similar blocks
  - Dispose old resources properly

### Phase 7: Polish & UX
**Goal**: Production-ready preview experience

- **Visual Enhancements**
  - Shadows (cast and receive)
  - Better ground plane styling
  - Loading skeleton for async model loading
  - Smooth camera transitions when switching blocks

- **User Controls**
  - Reset camera button
  - Toggle auto-rotation
  - Adjustable lighting controls (optional)

## Architecture Decisions

### Why React Three Fiber over Vanilla Three.js?
- Declarative React integration (state updates automatically re-render)
- Component-based organization matches existing codebase
- Suspense support for async loading
- Perfect for single-block preview (not performance-critical)

### Why Custom Converter Instead of @xmcl/model?
- @xmcl/model is Node.js-focused, not browser-optimized
- Custom TypeScript converter gives full control over Three.js output
- Simpler to debug and modify for our specific use case
- No external dependencies beyond Three.js (already in use)
- Handles model inheritance on backend (Rust) for efficiency

### Model Loading Flow
```
User clicks texture
  ↓
Get winner pack ID from Zustand state
  ↓
Tauri command: read_block_model(packId, modelId, packsDir)
  ↓
Backend searches pack for model JSON (falls back to vanilla)
  ↓
Backend resolves parent model inheritance
  ↓
Frontend converts JSON to Three.js geometry
  ↓
Load textures from pack filesystem (with vanilla fallback)
  ↓
Render 3D model in canvas
```

## Known Issues
- None currently - Phases 1-3 complete and stable
- ✅ ZIP pack support now implemented!

## File Structure
```
src/components/Preview3D/
├── index.tsx                    # Main canvas & scene setup (keeps Canvas mounted)
├── BlockModel.tsx               # Individual block renderer (loads real models)
└── styles.module.scss           # Preview panel styles

src/lib/tauri/
└── blockModels.ts               # TypeScript bindings for Tauri commands

src/lib/three/
├── modelConverter.ts            # Converts Minecraft JSON to Three.js (with logging)
└── textureLoader.ts             # Loads textures from resource packs (with logging)

src-tauri/src/util/
├── block_models.rs              # Rust module for reading/resolving models
└── blockstates.rs               # Rust module for parsing blockstate files

src-tauri/src/commands/
└── packs.rs                     # Added read_block_model command (uses blockstates)
```

## Testing Checklist
- [x] App loads without errors
- [x] Dev server runs cleanly
- [x] TypeScript compiles without errors
- [x] Rust backend compiles without warnings
- [x] Production build succeeds
- [x] Placeholder cube renders on texture click
- [x] Camera controls work (drag to rotate, scroll to zoom)
- [x] Console logging shows proper lifecycle
- [x] Model loading system implemented
- [x] Texture loading system implemented
- [ ] **Manual testing needed**: Real block models load from resource packs
- [ ] **Manual testing needed**: Textures apply correctly to model faces
- [ ] Multi-block models render completely
- [ ] Pencil selection updates model in real-time

## Resources
- [React Three Fiber Docs](https://docs.pmnd.rs/react-three-fiber)
- [Three.js Manual](https://threejs.org/manual/)
- [Minecraft Model Format](https://minecraft.wiki/w/Model)
- [@xmcl/model GitHub](https://github.com/Voxelum/minecraft-launcher-core-node/tree/master/packages/model)
