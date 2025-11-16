# Block Rendering Architecture Design

## Problem Statement

Currently, we're trying to guess which block a texture belongs to based on filename patterns. This is fundamentally flawed because:

1. **Texture names don't always match block names** (e.g., `acacia_leaves_bushy` is just a texture, not a block)
2. **Custom resource packs** can name textures however they want
3. **We're missing the key information**: which blocks actually USE each texture

## How Minecraft Actually Works

```
Block ID (in game) → Blockstate JSON → Model JSON → Textures
```

But we're trying to go backwards:
```
Texture → ??? → Block ID (WRONG!)
```

## The Correct Solution

### Phase 1: Build a Texture → Block Mapping (During Asset Indexing)

For each pack, scan all blockstates and models to build a reverse index:

```rust
HashMap<String, Vec<String>>  // texture_path → [block_ids that use it]
```

**Algorithm:**
1. Enumerate all blockstate files (`assets/minecraft/blockstates/*.json`)
2. For each blockstate:
   - Parse JSON
   - Extract all model references
   - For each model:
     - Load model JSON
     - Resolve parent chain
     - Extract all texture references
     - Add mapping: `texture_path → block_id`

### Phase 2: Use the Mapping for Preview

When user clicks a texture:
1. Look up texture in the mapping → get list of blocks that use it
2. Pick the first/primary block (or let user choose if multiple)
3. Load that block's blockstate
4. Render the model

## Implementation Plan

### Step 1: Create Texture Index Builder

File: `src-tauri/src/util/texture_index.rs`

```rust
pub struct TextureIndex {
    /// Maps texture paths to block IDs that use them
    texture_to_blocks: HashMap<String, Vec<String>>,
}

impl TextureIndex {
    pub fn build(pack: &PackMeta) -> Result<Self>;
    pub fn get_blocks_for_texture(&self, texture_path: &str) -> Option<&[String]>;
}
```

### Step 2: Integrate with Asset Scanning

Modify `asset_indexer.rs` to also build the texture index and store it in the scan result.

### Step 3: Update Frontend State

Add texture → block mapping to Zustand store so UI knows which block to request for each texture.

### Step 4: Update 3D Preview

Instead of guessing, use the mapping to know exactly which block to load.

## Benefits

1. ✅ **Works with ALL resource packs** (even custom ones)
2. ✅ **Handles any naming convention** (no more pattern matching)
3. ✅ **Accurate** - uses actual Minecraft data structure
4. ✅ **Extensible** - can add more metadata (animations, CTM, etc.)
5. ✅ **Future-proof** - works with new Minecraft versions

## Example

Texture: `bushy_leaves/acacia_leaves_bushy.png` (custom resource pack)

**Current approach:**
- Tries to guess: `acacia_leaves_bushy` → FAILS (no such block)

**New approach:**
1. Scans blockstates during pack load
2. Finds: `acacia_leaves.json` references model `custom/bushy_acacia`
3. Model `custom/bushy_acacia` uses texture `bushy_leaves/acacia_leaves_bushy`
4. Builds mapping: `bushy_leaves/acacia_leaves_bushy` → `acacia_leaves`
5. When user clicks texture → looks up → gets `acacia_leaves` → SUCCESS!

## Migration Path

1. Keep current heuristic system as fallback
2. Build texture index during pack scan
3. Prefer index lookup over heuristics
4. Log when fallback is used to identify edge cases
5. Eventually remove heuristics once index is proven

## Special Cases to Handle

- **Multiple blocks using same texture**: Return all, pick primary, or let user choose
- **Texture variants**: Index all variants to their base block
- **Model inheritance**: Resolve parent chains to get all textures
- **Custom models**: Full support via proper parsing
- **Animated textures**: Track .mcmeta files
- **CTM/Connected Textures**: Parse Optifine/CTM format (future)

## Performance Considerations

- **Build index once** during pack scan
- **Cache to disk** for subsequent loads
- **Incremental updates** when packs change
- **Lazy loading** for ZIP packs (on-demand model parsing)
