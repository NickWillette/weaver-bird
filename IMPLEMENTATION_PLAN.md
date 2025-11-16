# Block Rendering V2 - Implementation Plan

## Status: Ready for Implementation

This document provides a step-by-step implementation plan for the full block renderer based on BLOCK_RENDERING_FLOW_V2.md.

---

## Current State Assessment

### ✅ Already Implemented
1. **Blockstate data structures** (`src-tauri/src/util/blockstates.rs`)
   - `Blockstate` with `variants` and `multipart`
   - `BlockstateVariant` (Single/Multiple)
   - `ModelReference` with x, y rotations, uvlock, weight
   - `MultipartCase` with `when` and `apply`
   - `read_blockstate()` function
   - `get_default_model()` function

2. **Block model structures** (`src-tauri/src/util/block_models.rs`)
   - `BlockModel` with parent, textures, elements
   - `ModelElement` with faces, rotation
   - `ElementFace` with texture, uv, tintindex
   - `read_block_model()` function
   - `resolve_block_model()` with parent inheritance
   - `resolve_textures()` function

3. **Frontend rendering** 
   - `Preview3D` component
   - `BlockModel` component with texture loading
   - `textureLoader` with variant suffix support
   - `blockModelToThreeJs` converter

### ❌ Missing Components

1. **Backend:**
   - `z` rotation support (partially added, needs full integration)
   - Structured `when` clause parsing (currently `serde_json::Value`)
   - `BlockStateSchema` type for UI
   - `ResolvedModel` type for frontend
   - `BlockStateResolver` with variant/multipart logic
   - Weighted random selection
   - Property-based variant key building
   - `get_block_state_schema` Tauri command
   - Extended `read_block_model` with state props & seed

2. **Frontend:**
   - `BlockStatePanel` component
   - State management for `blockProps` and `seed`
   - Integration with `Preview3D`
   - Rotation application in Three.js
   - uvlock texture rotation
   - Multiple model rendering (multipart)

---

## Implementation Phases

### Phase 1: Backend Foundation (Priority: Critical)

#### Task 1.1: Add Missing Data Structures

**File:** `src-tauri/src/util/blockstates.rs`

Add at the end of the file (before tests):

```rust
use std::collections::{BTreeMap, HashSet};
use rand::{Rng, SeedableRng};
use rand_chacha::ChaCha8Rng;

/// Schema for a block property (for UI generation)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockPropertySchema {
    pub name: String,
    #[serde(rename = "type")]
    pub property_type: String, // "enum" | "boolean" | "int"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub values: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub min: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max: Option<i32>,
    pub default: String,
}

/// Complete schema for a block's state (for UI)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockStateSchema {
    pub block_id: String,
    pub properties: Vec<BlockPropertySchema>,
    pub default_state: HashMap<String, String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub variants_map: Option<HashMap<String, usize>>, // variant key -> model count
}

/// A resolved model with all transformations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResolvedModel {
    pub model_id: String,
    #[serde(rename = "rotX")]
    pub rot_x: i32,
    #[serde(rename = "rotY")]
    pub rot_y: i32,
    #[serde(rename = "rotZ")]
    pub rot_z: i32,
    pub uvlock: bool,
}

/// Result of blockstate resolution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResolutionResult {
    pub block_id: String,
    pub state_props: HashMap<String, String>,
    pub models: Vec<ResolvedModel>,
}

/// Structured when-clause for multipart conditions
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum WhenClause {
    Simple(HashMap<String, ValueOrArray>),
    Or { #[serde(rename = "OR")] or: Vec<HashMap<String, ValueOrArray>> },
}

/// Value can be single string or array of strings (OR condition)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum ValueOrArray {
    Single(String),
    Multiple(Vec<String>),
}
```

**Status:** ✅ Structure added (z-rotation), ⏳ Need to add schema/resolution types

---

#### Task 1.2: Implement BlockStateSchema Builder

**File:** `src-tauri/src/util/blockstates.rs`

Add function:

```rust
/// Build a BlockStateSchema from a blockstate file for UI generation
pub fn build_block_state_schema(
    blockstate: &Blockstate,
    block_id: &str,
) -> BlockStateSchema {
    let mut property_values: HashMap<String, HashSet<String>> = HashMap::new();
    let mut variants_map: HashMap<String, usize> = HashMap::new();

    // Scan variants to extract properties
    if let Some(variants) = &blockstate.variants {
        for (key, variant) in variants {
            // Count models for this variant
            let model_count = match variant {
                BlockstateVariant::Single(_) => 1,
                BlockstateVariant::Multiple(models) => models.len(),
            };
            variants_map.insert(key.clone(), model_count);

            // Parse variant key: "facing=north,half=bottom" -> properties
            if !key.is_empty() && key != "normal" {
                for prop_pair in key.split(',') {
                    if let Some((prop_name, prop_value)) = prop_pair.split_once('=') {
                        property_values
                            .entry(prop_name.to_string())
                            .or_insert_with(HashSet::new)
                            .insert(prop_value.to_string());
                    }
                }
            }
        }
    }

    // Scan multipart to extract properties from when clauses
    if let Some(multipart) = &blockstate.multipart {
        for case in multipart {
            if let Some(when_value) = &case.when {
                extract_properties_from_when(when_value, &mut property_values);
            }
        }
    }

    // Build property schemas
    let mut properties: Vec<BlockPropertySchema> = property_values
        .iter()
        .map(|(name, values)| {
            let mut sorted_values: Vec<String> = values.iter().cloned().collect();
            sorted_values.sort();

            // Detect type
            let property_type = if sorted_values.len() == 2
                && sorted_values.contains(&"true".to_string())
                && sorted_values.contains(&"false".to_string())
            {
                "boolean"
            } else if sorted_values.iter().all(|v| v.parse::<i32>().is_ok()) {
                "int"
            } else {
                "enum"
            };

            let (min, max) = if property_type == "int" {
                let nums: Vec<i32> = sorted_values
                    .iter()
                    .filter_map(|v| v.parse().ok())
                    .collect();
                (nums.iter().min().copied(), nums.iter().max().copied())
            } else {
                (None, None)
            };

            BlockPropertySchema {
                name: name.clone(),
                property_type: property_type.to_string(),
                values: if property_type == "enum" || property_type == "boolean" {
                    Some(sorted_values.clone())
                } else {
                    None
                },
                min,
                max,
                default: sorted_values.first().cloned().unwrap_or_default(),
            }
        })
        .collect();

    // Sort properties by name for consistency
    properties.sort_by(|a, b| a.name.cmp(&b.name));

    // Build default state
    let default_state: HashMap<String, String> = properties
        .iter()
        .map(|p| (p.name.clone(), p.default.clone()))
        .collect();

    BlockStateSchema {
        block_id: block_id.to_string(),
        properties,
        default_state,
        variants_map: if variants_map.is_empty() {
            None
        } else {
            Some(variants_map)
        },
    }
}

/// Helper to extract properties from a when clause (recursively handles OR)
fn extract_properties_from_when(
    when_value: &serde_json::Value,
    property_values: &mut HashMap<String, HashSet<String>>,
) {
    if let Some(obj) = when_value.as_object() {
        for (key, value) in obj {
            if key == "OR" {
                // Handle OR array
                if let Some(arr) = value.as_array() {
                    for item in arr {
                        extract_properties_from_when(item, property_values);
                    }
                }
            } else {
                // Regular property
                let values_set = property_values
                    .entry(key.clone())
                    .or_insert_with(HashSet::new);

                if let Some(s) = value.as_str() {
                    // Single value or pipe-separated values
                    for val in s.split('|') {
                        values_set.insert(val.to_string());
                    }
                } else if let Some(arr) = value.as_array() {
                    for item in arr {
                        if let Some(s) = item.as_str() {
                            values_set.insert(s.to_string());
                        }
                    }
                }
            }
        }
    }
}
```

---

#### Task 1.3: Implement BlockStateResolver

**File:** `src-tauri/src/util/blockstates.rs`

Add function:

```rust
/// Resolve a blockstate with given properties to a list of models
pub fn resolve_blockstate(
    blockstate: &Blockstate,
    block_id: &str,
    state_props: Option<HashMap<String, String>>,
    seed: Option<u64>,
) -> AppResult<ResolutionResult> {
    let props = state_props.unwrap_or_default();
    let mut resolved_models = Vec::new();

    // Handle variants format
    if let Some(variants) = &blockstate.variants {
        let variant_key = make_variant_key(&props);
        
        // Try exact match, then empty string, then "normal"
        let variant = variants
            .get(&variant_key)
            .or_else(|| variants.get(""))
            .or_else(|| variants.get("normal"));

        if let Some(var) = variant {
            collect_models_from_variant(var, seed, &mut resolved_models)?;
        } else {
            return Err(AppError::validation(format!(
                "No variant found for key: '{}' in block '{}'",
                variant_key, block_id
            )));
        }
    }

    // Handle multipart format
    if let Some(multipart) = &blockstate.multipart {
        for (index, case) in multipart.iter().enumerate() {
            let matches = if let Some(when) = &case.when {
                matches_when_clause(&props, when)?
            } else {
                true // No condition = always applies
            };

            if matches {
                // Use different seed for each multipart case to get variety
                let case_seed = seed.map(|s| s.wrapping_add(index as u64));
                collect_models_from_variant(&case.apply, case_seed, &mut resolved_models)?;
            }
        }
    }

    if resolved_models.is_empty() {
        return Err(AppError::validation(format!(
            "No models resolved for block '{}'",
            block_id
        )));
    }

    Ok(ResolutionResult {
        block_id: block_id.to_string(),
        state_props: props,
        models: resolved_models,
    })
}

/// Build variant key from properties (sorted for consistency)
fn make_variant_key(props: &HashMap<String, String>) -> String {
    if props.is_empty() {
        return String::new();
    }

    let mut pairs: Vec<_> = props.iter().collect();
    pairs.sort_by_key(|(k, _)| *k);
    
    pairs
        .iter()
        .map(|(k, v)| format!("{}={}", k, v))
        .collect::<Vec<_>>()
        .join(",")
}

/// Collect models from a variant (handles weighted random selection)
fn collect_models_from_variant(
    variant: &BlockstateVariant,
    seed: Option<u64>,
    output: &mut Vec<ResolvedModel>,
) -> AppResult<()> {
    match variant {
        BlockstateVariant::Single(model_ref) => {
            output.push(to_resolved_model(model_ref));
        }
        BlockstateVariant::Multiple(models) => {
            if models.is_empty() {
                return Ok(());
            }

            // Pick one model based on weights
            let model_ref = if let Some(seed_val) = seed {
                pick_weighted_with_seed(models, seed_val)
            } else {
                // Default to first model if no seed
                &models[0]
            };

            output.push(to_resolved_model(model_ref));
        }
    }
    Ok(())
}

/// Pick a weighted random model using a seed
fn pick_weighted_with_seed(models: &[ModelReference], seed: u64) -> &ModelReference {
    let mut rng = ChaCha8Rng::seed_from_u64(seed);
    
    let total_weight: i32 = models
        .iter()
        .map(|m| m.weight.unwrap_or(1).max(1))
        .sum();

    if total_weight == 0 {
        return &models[0];
    }

    let mut roll = rng.gen_range(0..total_weight);
    
    for model in models {
        let weight = model.weight.unwrap_or(1).max(1);
        if roll < weight {
            return model;
        }
        roll -= weight;
    }

    &models[0] // Fallback
}

/// Convert ModelReference to ResolvedModel
fn to_resolved_model(model_ref: &ModelReference) -> ResolvedModel {
    ResolvedModel {
        model_id: model_ref.model.clone(),
        rot_x: model_ref.x.unwrap_or(0),
        rot_y: model_ref.y.unwrap_or(0),
        rot_z: model_ref.z.unwrap_or(0),
        uvlock: model_ref.uvlock.unwrap_or(false),
    }
}

/// Check if state properties match a when clause
fn matches_when_clause(
    props: &HashMap<String, String>,
    when: &serde_json::Value,
) -> AppResult<bool> {
    if let Some(obj) = when.as_object() {
        // Check for OR clause
        if let Some(or_value) = obj.get("OR") {
            if let Some(or_array) = or_value.as_array() {
                // OR: any child must match
                for child in or_array {
                    if matches_when_clause(props, child)? {
                        return Ok(true);
                    }
                }
                return Ok(false);
            }
        }

        // Simple AND matching (all properties must match)
        for (key, value) in obj {
            if key == "OR" {
                continue; // Already handled
            }

            let prop_value = props.get(key);
            
            if let Some(s) = value.as_str() {
                // Handle pipe-separated OR values: "up|side|none"
                let allowed: Vec<&str> = s.split('|').collect();
                let matches = prop_value
                    .map(|v| allowed.contains(&v.as_str()))
                    .unwrap_or(false);
                
                if !matches {
                    return Ok(false);
                }
            } else {
                return Ok(false);
            }
        }

        Ok(true)
    } else {
        Ok(false)
    }
}
```

**Dependencies to add to `Cargo.toml`:**
```toml
rand = "0.8"
rand_chacha = "0.3"
```

---

### Phase 2: Tauri Commands (Priority: Critical)

#### Task 2.1: Add Tauri Commands

**File:** `src-tauri/src/commands/mod.rs` (or create new file `src-tauri/src/commands/blockstates.rs`)

```rust
use crate::util::blockstates::{
    build_block_state_schema, read_blockstate, resolve_blockstate, BlockStateSchema,
    ResolutionResult,
};
use crate::AppResult;
use std::collections::HashMap;
use std::path::Path;

#[tauri::command]
pub fn get_block_state_schema(
    pack_id: String,
    block_id: String,
    packs_dir: String,
) -> AppResult<BlockStateSchema> {
    println!("[get_block_state_schema] Block ID: {}", block_id);
    println!("[get_block_state_schema] Pack ID: {}", pack_id);

    // TODO: Get pack from pack_id (you'll need your pack registry here)
    // For now, assuming pack_path is derived from pack_id
    let pack_path = Path::new(&packs_dir).join(&pack_id);
    let is_zip = pack_path.extension().and_then(|s| s.to_str()) == Some("zip");

    let blockstate = read_blockstate(&pack_path, &block_id, is_zip)?;
    let schema = build_block_state_schema(&blockstate, &block_id);

    Ok(schema)
}

#[tauri::command]
pub fn resolve_block_state(
    pack_id: String,
    block_id: String,
    packs_dir: String,
    state_props: Option<HashMap<String, String>>,
    seed: Option<u64>,
) -> AppResult<ResolutionResult> {
    println!("[resolve_block_state] Block ID: {}", block_id);
    println!("[resolve_block_state] State props: {:?}", state_props);
    println!("[resolve_block_state] Seed: {:?}", seed);

    let pack_path = Path::new(&packs_dir).join(&pack_id);
    let is_zip = pack_path.extension().and_then(|s| s.to_str()) == Some("zip");

    let blockstate = read_blockstate(&pack_path, &block_id, is_zip)?;
    let resolution = resolve_blockstate(&blockstate, &block_id, state_props, seed)?;

    Ok(resolution)
}
```

**File:** `src-tauri/src/lib.rs` (register commands)

Find the `tauri::Builder` and add:
```rust
.invoke_handler(tauri::generate_handler![
    // ... existing commands ...
    commands::blockstates::get_block_state_schema,
    commands::blockstates::resolve_block_state,
])
```

---

### Phase 3: Frontend Integration (Priority: High)

#### Task 3.1: Add Tauri Wrappers

**File:** `src/lib/tauri/blockModels.ts` (extend existing file)

```typescript
import { invoke } from '@tauri-apps/api/core';

export interface BlockPropertySchema {
  name: string;
  type: 'enum' | 'boolean' | 'int';
  values?: string[];
  min?: number;
  max?: number;
  default: string;
}

export interface BlockStateSchema {
  blockId: string;
  properties: BlockPropertySchema[];
  defaultState: Record<string, string>;
  variantsMap?: Record<string, number>;
}

export interface ResolvedModel {
  modelId: string;
  rotX: number;
  rotY: number;
  rotZ: number;
  uvlock: boolean;
}

export interface ResolutionResult {
  blockId: string;
  stateProps: Record<string, string>;
  models: ResolvedModel[];
}

export async function getBlockStateSchema(
  packId: string,
  blockId: string,
  packsDir: string
): Promise<BlockStateSchema> {
  return invoke('get_block_state_schema', { packId, blockId, packsDir });
}

export async function resolveBlockState(
  packId: string,
  blockId: string,
  packsDir: string,
  stateProps?: Record<string, string>,
  seed?: number
): Promise<ResolutionResult> {
  return invoke('resolve_block_state', {
    packId,
    blockId,
    packsDir,
    stateProps,
    seed,
  });
}
```

---

#### Task 3.2: Create BlockStatePanel Component

**File:** `src/components/BlockStatePanel/index.tsx`

```typescript
import { useEffect, useState } from 'react';
import { getBlockStateSchema } from '@lib/tauri/blockModels';
import type { BlockPropertySchema, BlockStateSchema } from '@lib/tauri/blockModels';
import s from './styles.module.scss';

interface Props {
  packId: string;
  blockId: string;
  packsDir: string;
  currentProps: Record<string, string>;
  onChangeProps: (props: Record<string, string>) => void;
  seed: number;
  onChangeSeed: (seed: number) => void;
}

export default function BlockStatePanel({
  packId,
  blockId,
  packsDir,
  currentProps,
  onChangeProps,
  seed,
  onChangeSeed,
}: Props) {
  const [schema, setSchema] = useState<BlockStateSchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSchema() {
      if (!blockId || !packId) return;

      setLoading(true);
      setError(null);

      try {
        const result = await getBlockStateSchema(packId, blockId, packsDir);
        if (!cancelled) {
          setSchema(result);
          // Initialize with default state if current props are empty
          if (Object.keys(currentProps).length === 0) {
            onChangeProps(result.defaultState);
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[BlockStatePanel] Failed to load schema:', err);
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSchema();

    return () => {
      cancelled = true;
    };
  }, [packId, blockId, packsDir]);

  const handlePropertyChange = (name: string, value: string) => {
    onChangeProps({
      ...currentProps,
      [name]: value,
    });
  };

  const handleRerollSeed = () => {
    onChangeSeed(seed + 1);
  };

  if (loading) {
    return <div className={s.root}>Loading block state...</div>;
  }

  if (error) {
    return <div className={s.root}>Error: {error}</div>;
  }

  if (!schema || schema.properties.length === 0) {
    return null; // No properties to show
  }

  return (
    <div className={s.root}>
      <h3 className={s.title}>Block State</h3>

      <div className={s.properties}>
        {schema.properties.map((prop) => (
          <PropertyControl
            key={prop.name}
            property={prop}
            value={currentProps[prop.name] || prop.default}
            onChange={(val) => handlePropertyChange(prop.name, val)}
          />
        ))}
      </div>

      <div className={s.seedControl}>
        <button onClick={handleRerollSeed} className={s.rerollButton}>
          🎲 Re-roll Variant
        </button>
        <span className={s.seedLabel}>Seed: {seed}</span>
      </div>
    </div>
  );
}

function PropertyControl({
  property,
  value,
  onChange,
}: {
  property: BlockPropertySchema;
  value: string;
  onChange: (value: string) => void;
}) {
  if (property.type === 'boolean') {
    return (
      <label className={s.propertyLabel}>
        <input
          type="checkbox"
          checked={value === 'true'}
          onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
        />
        {property.name}
      </label>
    );
  }

  if (property.type === 'enum' && property.values) {
    return (
      <label className={s.propertyLabel}>
        <span>{property.name}:</span>
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {property.values.map((val) => (
            <option key={val} value={val}>
              {val}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (property.type === 'int') {
    return (
      <label className={s.propertyLabel}>
        <span>{property.name}:</span>
        <input
          type="number"
          min={property.min}
          max={property.max}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    );
  }

  return null;
}
```

**File:** `src/components/BlockStatePanel/styles.module.scss`

```scss
.root {
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  max-height: 400px;
  overflow-y: auto;
}

.title {
  font-size: var(--font-size-md);
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
}

.properties {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.propertyLabel {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);

  span {
    min-width: 80px;
  }

  select,
  input[type='number'] {
    flex: 1;
    padding: 4px 8px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-bg);
    color: var(--color-text);
  }

  input[type='checkbox'] {
    width: 16px;
    height: 16px;
  }
}

.seedControl {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.rerollButton {
  padding: 6px 12px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);

  &:hover {
    opacity: 0.9;
  }
}

.seedLabel {
  font-size: var(--font-size-xs);
  color: var(--color-text-light);
}
```

---

This implementation plan provides all the code needed. Would you like me to:
1. Continue with the remaining phases (Preview3D integration, BlockModel updates, Three.js rotation)?
2. Start implementing these phases directly?
3. Focus on a specific phase first?
