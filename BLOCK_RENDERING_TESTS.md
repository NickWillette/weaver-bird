# Block Rendering System - Test Documentation

This document describes the test coverage for the block rendering system implemented according to `IMPLEMENTATION_PLAN.md`.

## Overview

The block rendering system consists of:
- **Backend (Rust)**: Blockstate resolution, model loading, parent inheritance
- **Frontend (TypeScript)**: Block state UI, model rendering with Three.js

## Backend Tests (Rust)

Location: `src-tauri/src/util/blockstates.rs` (bottom of file)

### Core Functionality Tests

#### 1. Texture ID to Block ID Conversion
- ✅ `test_texture_id_to_block_id`: Strips namespaces, texture suffixes, and variant numbers
- Tests: `minecraft:block/dirt` → `dirt`, `acacia_log_top` → `acacia_log`, etc.

#### 2. Variant Key Generation
- ✅ `test_make_variant_key`: Builds sorted property keys for variant lookup
- Tests empty props, single property, multiple properties (sorted alphabetically)

#### 3. When Clause Matching (Multipart)
- ✅ `test_matches_when_clause_simple`: Simple property matching
- ✅ `test_matches_when_clause_pipe_separated`: OR values like `"north|south|east|west"`
- ✅ `test_matches_when_clause_or`: OR clauses with multiple conditions

#### 4. Weighted Random Selection
- ✅ `test_pick_weighted_with_seed`: Deterministic weighted random selection
- Tests: Same seed produces same result, weights are respected

#### 5. Schema Building
- ✅ `test_build_block_state_schema_variants`: Extract properties from variants
- ✅ `test_integer_property_detection`: Detect int properties (age, level, etc.)

#### 6. Blockstate Resolution
- ✅ `test_resolve_blockstate_variants`: Simple variant resolution
- ✅ `test_resolve_blockstate_weighted`: Weighted variant selection
- ✅ `test_resolve_blockstate_multipart`: Multipart with conditional application

### Real Minecraft Block Tests

#### 7. Real Block Examples
- ✅ `test_real_furnace_blockstate`: Furnace with facing and lit properties
- ✅ `test_real_grass_block_weighted`: Grass with random rotations
- ✅ `test_real_oak_fence_multipart`: Fence with 4-way connections
- ✅ `test_real_stairs_blockstate`: Stairs with facing, half, shape
- ✅ `test_redstone_wire_complex_multipart`: Complex OR conditions

### Regression Tests (Bug Fixes)

#### 8. Default State Application (Bug: Empty Props)
- ✅ `test_default_state_application_when_props_empty`
- **Issue**: Blocks like acacia_leaves with required properties failed when props were empty
- **Fix**: Backend now applies default values from schema when props are empty
- **Test**: Verifies default state is generated and resolution succeeds

#### 9. Empty Variant Fallback
- ✅ `test_empty_props_fallback_to_empty_variant`
- **Issue**: Blocks with `""` empty variant should match when no props given
- **Fix**: Resolution tries exact match → `""` → `"normal"`
- **Test**: Verifies empty props match empty variant

#### 10. CamelCase Serialization (Bug: snake_case → camelCase)
- ✅ `test_camelcase_serialization`
- ✅ `test_resolution_result_camelcase`
- ✅ `test_blockstate_schema_camelcase`
- **Issue**: Rust structs used snake_case but TypeScript expected camelCase
- **Fix**: Added `#[serde(rename = "...")]` to all structs
- **Test**: Verifies JSON output uses camelCase field names

#### 11. Variant Key with Required Properties
- ✅ `test_variant_key_with_required_properties`
- **Issue**: Acacia log has `axis` property that must be set
- **Fix**: Default state provides initial value
- **Test**: Verifies all axis values (x, y, z) resolve correctly

#### 12. Multipart Unconditional Application
- ✅ `test_multipart_with_no_when_clause`
- **Issue**: Parts without `when` clause should always apply (fence posts, etc.)
- **Fix**: Multipart resolution checks for None `when` clause
- **Test**: Verifies unconditional parts always included

## Frontend Tests (TypeScript)

Location: `src/components/Preview3D/BlockModel.test.tsx`

### Component Tests

#### 1. Model Loading Test
```typescript
test('resolves blockstate and loads model', async () => {
  // Mock Tauri commands
  mockIPC((cmd, args) => {
    if (cmd === 'resolve_block_state') {
      return {
        blockId: 'acacia_log',
        stateProps: { axis: 'x' },
        models: [{
          modelId: 'minecraft:block/acacia_log_horizontal',
          rotX: 90,
          rotY: 90,
          rotZ: 0,
          uvlock: false
        }]
      };
    }
    if (cmd === 'load_model_json') {
      return {
        textures: { end: 'acacia_log_top', side: 'acacia_log' },
        elements: [/* ... */]
      };
    }
  });
  
  const { findByText } = render(<BlockModel assetId="minecraft:block/acacia_log" />);
  // Assert model loaded
});
```

## Test Coverage Summary

### Covered Scenarios
- ✅ Simple blocks (dirt, stone)
- ✅ Blocks with properties (furnace, stairs, logs)
- ✅ Weighted random variants (grass, flowers)
- ✅ Multipart blocks (fences, walls, redstone)
- ✅ Complex conditions (OR, pipe-separated values)
- ✅ Default state application
- ✅ CamelCase serialization
- ✅ Parent model inheritance

### Known Limitations
- ⚠️ Optifine/ETF random textures not tested (not implemented yet)
- ⚠️ Connected textures (CTM) not tested (not implemented yet)
- ⚠️ Custom entity models not tested (not implemented yet)

## Running Tests

### Backend Tests
```bash
cd src-tauri
cargo test blockstates::
```

### All Backend Tests
```bash
cd src-tauri
cargo test
```

### Frontend Tests (when created)
```bash
npm test
```

## CI/CD Recommendations

Add to GitHub Actions workflow:

```yaml
- name: Run Rust Tests
  run: cd src-tauri && cargo test --all-features

- name: Run TypeScript Tests
  run: npm test -- --coverage
```

## Manual Testing Checklist

When making changes to the block rendering system, manually test these blocks:

### Simple Variants
- [ ] minecraft:furnace (facing + lit properties)
- [ ] minecraft:oak_stairs (facing + half + shape)
- [ ] minecraft:stone_slab (type property)

### Multipart Blocks
- [ ] minecraft:oak_fence (4-way connections)
- [ ] minecraft:cobblestone_wall (4-way connections + up)
- [ ] minecraft:redstone_wire (complex OR conditions)

### Blocks with Properties
- [ ] minecraft:acacia_log (axis property)
- [ ] minecraft:acacia_leaves (distance property)
- [ ] minecraft:wheat (age property, 0-7)

### Weighted Variants
- [ ] minecraft:grass_block (4 random rotations)
- [ ] minecraft:tall_grass (multiple variants)

### Edge Cases
- [ ] Block with only empty variant `""`
- [ ] Block with only `"normal"` variant
- [ ] Block with parent inheritance (log_horizontal → cube_column_horizontal)
- [ ] Block with deep parent chain

## Bug Fix History

### 2024 - Initial Implementation Issues

1. **Block ID Normalization**
   - Problem: `minecraft:block/acacia_leaves` not normalized to `acacia_leaves`
   - Fix: Strip prefixes in `resolve_block_state_impl`
   - Test: `test_variant_key_with_required_properties`

2. **Empty Props Default State**
   - Problem: Blocks with required properties failed with empty props
   - Fix: Apply default state from schema when props empty
   - Test: `test_default_state_application_when_props_empty`

3. **CamelCase Serialization**
   - Problem: `model_id` sent as snake_case but frontend expected `modelId`
   - Fix: Added `#[serde(rename)]` to all structs
   - Test: `test_camelcase_serialization`, etc.

4. **Model Parent Inheritance**
   - Problem: Models with parents had no elements
   - Fix: Use `resolve_block_model` instead of `read_block_model_with_fallback`
   - Test: Manual testing with acacia_log

5. **Direct Model Loading**
   - Problem: After blockstate resolution, trying to resolve blockstate again for model ID
   - Fix: Created `load_model_json` command for direct model loading
   - Test: Manual testing
