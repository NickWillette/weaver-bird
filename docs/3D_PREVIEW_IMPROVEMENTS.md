# 3D Preview System - Major Improvements

## Issues Fixed

### 1. Canvas Context Loss
**Problem**: Canvas was being unmounted/remounted when switching assets, causing WebGL context loss errors.

**Solution**: 
- Canvas now stays mounted permanently
- Uses CSS `display: none` instead of conditional rendering
- Placeholder overlay shown when no asset is selected
- File: `src/components/Preview3D/index.tsx`

### 2. Incorrect Model Resolution
**Problem**: System was trying to load models directly from texture IDs (e.g., "minecraft:block/dirt"), but Minecraft requires blockstate resolution first.

**Solution**:
- Created complete blockstate parsing system
- Proper resolution chain: **Texture ID → Blockstate → Model**
- Supports both "variants" and "multipart" blockstate formats
- Falls back to vanilla blockstates when resource pack doesn't override
- New file: `src-tauri/src/util/blockstates.rs`

### 3. Poor Debugging Capabilities
**Problem**: When models didn't load, there was no visibility into what was failing.

**Solution**:
- Added comprehensive logging to every layer:
  - Backend model loading
  - Texture resolution
  - Three.js conversion
  - Texture loading
- Color-coded placeholders:
  - **Magenta (0xff00ff)**: Missing textures on model faces
  - **Orange (0xff6b00)**: Missing model elements entirely
- Files updated: `src/lib/three/modelConverter.ts`, `src/lib/three/textureLoader.ts`

## Architecture Improvements

### Blockstate Resolution System

Minecraft's rendering pipeline:
```
Block in game → Blockstate JSON → Model JSON → Textures
```

Our implementation now follows this correctly:

1. **Input**: Texture ID like `"minecraft:block/oak_planks"`
2. **Extract Block ID**: `"oak_planks"`
3. **Load Blockstate**: `assets/minecraft/blockstates/oak_planks.json`
4. **Get Default Model**: From `""` or `"normal"` variant
5. **Resolve Model**: `assets/minecraft/models/block/oak_planks.json`
6. **Load Textures**: Referenced in model file

### Blockstate Types Supported

#### Variants (Most Common)
```json
{
  "variants": {
    "": { "model": "minecraft:block/dirt" },
    "snowy=true": { "model": "minecraft:block/grass_block_snow" }
  }
}
```

#### Multipart (Complex Blocks)
```json
{
  "multipart": [
    { "apply": { "model": "minecraft:block/fence_post" } },
    { "when": { "north": "true" }, "apply": { "model": "minecraft:block/fence_side" } }
  ]
}
```

## Logging Strategy

### Console Output Structure

**[Component] Action: Details**

Examples:
- `[BlockModel] Loading model for: minecraft:block/dirt`
- `[modelConverter] Converting model: {elements: 1}`
- `[textureLoader] Loading pack texture: minecraft:block/dirt`
- `[textureLoader] Backend returned path: /path/to/texture.png`

### Color Indicators

Visual debugging through placeholder colors:
- **Brown (0x8B4513)**: Original placeholder (Phase 1)
- **Orange (0xff6b00)**: Model has no elements (current)
- **Magenta (0xff00ff)**: Specific face has missing texture (current)
- **Gray (0x808080)**: Reserved for future use

## Block Model Type Support

### Currently Supported
✅ Simple cube models (single cuboid)
✅ Multi-element models (multiple cuboids)
✅ Parent model inheritance
✅ Texture variable resolution (#all, #texture0, etc.)
✅ Element rotations (with rescaling for 45° angles)

### Planned for Phase 5
⏳ Cross models (flowers, grass, saplings)
⏳ Multi-block structures (doors, beds)
⏳ Special rendering (cauldrons, complex BlockBench models)

## Testing Guide

### How to Test

1. **Build the Application**
   ```bash
   npm run build
   ```

2. **Launch and Load Resource Packs**
   - Start the app
   - Scan a directory containing resource packs
   - Vanilla textures should be initialized

3. **Select a Block Texture**
   - Click on any block texture in the asset list
   - 3D preview panel should activate

4. **Check Console Logs**
   - Open DevTools console (View → Toggle Developer Tools)
   - Look for log sequences:
     ```
     [BlockModel] Loading model for: minecraft:block/dirt
     [modelConverter] Converting model: {parent: "...", textures: {...}}
     [textureLoader] Loading pack texture: minecraft:block/dirt
     ```

5. **Identify Issues**
   - **Orange cube**: Model file not found or has no elements
   - **Magenta cube**: Model found but textures missing
   - **Brown cube**: Fallback placeholder (should not appear anymore)

### Expected Behavior

**Simple Blocks** (dirt, stone, planks):
- Should show a cube with the correct texture on all faces
- OR show a cube with texture on specific faces (if model defines per-face textures)

**Complex Blocks** (stairs, slabs):
- Should show multi-element geometry
- May have magenta faces if textures aren't loading

**Items** (sticks, tools):
- Will show orange cube (items use different rendering, not supported yet)

## Known Limitations

1. **ZIP Packs**: Not yet supported (directory packs only)
2. **Item Models**: Not supported (block models only)
3. **Cross Models**: Not supported (plants will show as cubes)
4. **Multipart Rendering**: Blockstates parse but only default variant renders
5. **UV Mapping**: Custom UVs not fully implemented
6. **Block Rotations**: Blockstate rotations (x, y, uvlock) not applied yet

## Debugging Checklist

If a block isn't rendering correctly:

- [ ] Check console for `[BlockModel]` errors
- [ ] Verify blockstate exists: `assets/minecraft/blockstates/{block}.json`
- [ ] Verify model exists: `assets/minecraft/models/block/{model}.json`
- [ ] Check texture paths in model JSON
- [ ] Verify textures exist: `assets/minecraft/textures/block/{texture}.png`
- [ ] Look for "Unresolved texture variable" warnings
- [ ] Check for "Blockstate not found" errors
- [ ] Verify vanilla textures are initialized

## Next Steps

### Immediate (Manual Testing Phase)
1. Test with various block types
2. Identify which blocks work vs. don't work
3. Fix texture loading issues if found
4. Document which model patterns work

### Short Term (Phase 5)
1. Implement cross model detection and rendering
2. Add support for multipart full rendering
3. Implement blockstate transformations (rotation, uvlock)
4. Custom UV coordinate mapping

### Medium Term (Phase 6-7)
1. Real-time pack switching
2. Texture cache management
3. Performance optimization
4. Visual polish (shadows, better ground plane)

## File Changes Summary

### New Files
- `src-tauri/src/util/blockstates.rs` - Blockstate parsing
- `docs/3D_PREVIEW_IMPROVEMENTS.md` - This document

### Modified Files
- `src/components/Preview3D/index.tsx` - Canvas persistence
- `src/components/Preview3D/BlockModel.tsx` - Simplified model ID handling
- `src/lib/three/modelConverter.ts` - Enhanced logging and color coding
- `src/lib/three/textureLoader.ts` - Enhanced logging
- `src-tauri/src/commands/packs.rs` - Blockstate resolution
- `src-tauri/src/util/mod.rs` - Export blockstates module
- `docs/3D_PREVIEW_STATUS.md` - Updated status tracking

## Code Quality

✅ TypeScript compiles without errors
✅ Rust compiles without warnings  
✅ Production build succeeds
✅ All dependencies resolved
✅ Comprehensive logging in place
✅ Clear error messages
✅ Proper resource cleanup

## References

- [Minecraft Model Format](https://minecraft.wiki/w/Model)
- [Minecraft Blockstates](https://minecraft.wiki/w/Tutorials/Models)
- [@xmcl/model Source](https://github.com/Voxelum/minecraft-launcher-core-node/blob/master/packages/model/block.ts)
- [Three.js BoxGeometry](https://threejs.org/docs/#api/en/geometries/BoxGeometry)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
