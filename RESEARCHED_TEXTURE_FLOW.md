# RESEARCHED_TEXTURE_FLOW.md

## Research Summary: XMCL Model Viewer & Minecraft Model System

This document analyzes how XMCL (X Minecraft Launcher) handles block model loading and compares it with our current Weaverbird implementation to identify improvements needed for proper texture loading across all block states.

---

## Table of Contents

1. [Minecraft Blockstate System Overview](#minecraft-blockstate-system-overview)
2. [XMCL Architecture](#xmcl-architecture)
3. [Current Weaverbird Implementation](#current-weaverbird-implementation)
4. [Gaps and Missing Features](#gaps-and-missing-features)
5. [Recommended Changes](#recommended-changes)
6. [Implementation Roadmap](#implementation-roadmap)

---

## Minecraft Blockstate System Overview

### Blockstate Files

Blockstate files (`assets/<namespace>/blockstates/<block_name>.json`) link block variants to their corresponding models. There are **two formats**:

#### 1. **Variants Format**

Used for blocks with distinct states (orientation, powered state, etc.)

```json
{
  "variants": {
    "facing=north": {
      "model": "block/furnace",
      "y": 0
    },
    "facing=east": {
      "model": "block/furnace",
      "y": 90
    },
    "facing=south": {
      "model": "block/furnace",
      "y": 180
    },
    "facing=west": {
      "model": "block/furnace",
      "y": 270
    }
  }
}
```

**Key Properties:**
- `model`: Path to model file (resource location)
- `x`, `y`, `z`: Rotation in 90-degree increments
- `uvlock`: Boolean - locks texture rotation with model rotation
- `weight`: Integer for probability when multiple models exist

**Multiple Models per Variant:**
```json
{
  "variants": {
    "": [
      { "model": "block/grass", "weight": 1 },
      { "model": "block/grass_variant", "weight": 1 },
      { "model": "block/grass_alt", "weight": 2 }
    ]
  }
}
```
Probabilities: 25%, 25%, 50% (weights: 1/(1+1+2), 1/4, 2/4)

**Default Variant:**
- Blocks with one variant use `""` as the variant name
- This is the "normal" state when no properties apply

#### 2. **Multipart Format**

Used for complex blocks that combine multiple models based on conditions (fences, walls, etc.)

```json
{
  "multipart": [
    {
      "apply": { "model": "block/fence_post" }
    },
    {
      "when": { "north": "true" },
      "apply": { "model": "block/fence_side", "y": 0, "uvlock": true }
    },
    {
      "when": { "east": "true" },
      "apply": { "model": "block/fence_side", "y": 90, "uvlock": true }
    },
    {
      "when": { "south": "true" },
      "apply": { "model": "block/fence_side", "y": 180, "uvlock": true }
    },
    {
      "when": { "west": "true" },
      "apply": { "model": "block/fence_side", "y": 270, "uvlock": true }
    }
  ]
}
```

**Condition Types:**

1. **Direct Matching:**
   ```json
   "when": { "north": "true" }
   ```

2. **Multiple Values (OR):**
   ```json
   "when": { "facing": "north|east|south|west" }
   ```

3. **OR Logic (Array):**
   ```json
   "when": { "OR": [
     { "north": "true" },
     { "east": "true" }
   ]}
   ```

4. **AND Logic:**
   ```json
   "when": { "AND": [
     { "north": "true" },
     { "powered": "true" }
   ]}
   ```

5. **Unconditional:**
   ```json
   {
     "apply": { "model": "block/base" }
   }
   ```

---

### Model Files

Model files (`assets/<namespace>/models/block/<model_name>.json`) define geometry and textures.

#### Model Structure

```json
{
  "parent": "block/cube_all",
  "textures": {
    "particle": "#all",
    "all": "block/dirt"
  },
  "elements": [
    {
      "from": [0, 0, 0],
      "to": [16, 16, 16],
      "faces": {
        "down":  { "texture": "#all", "cullface": "down" },
        "up":    { "texture": "#all", "cullface": "up" },
        "north": { "texture": "#all", "cullface": "north" },
        "south": { "texture": "#all", "cullface": "south" },
        "west":  { "texture": "#all", "cullface": "west" },
        "east":  { "texture": "#all", "cullface": "east" }
      }
    }
  ]
}
```

#### Parent Model Inheritance

Models use the `parent` property to inherit from other models. **Key inheritance rules:**

1. **Parent Resolution Chain:**
   - Child loads parent model
   - Parent may have its own parent (recursive)
   - Resolution continues until a model with no parent is found
   
2. **Property Merging:**
   - Child properties **override** parent properties
   - Inherited: `elements`, `ambientocclusion`, `display`, `overrides`, `textures`
   - Textures are **merged** (child textures override parent textures with same key)

3. **Common Parent Models:**
   - `block/cube` - Basic cube with manual face definitions
   - `block/cube_all` - Cube with same texture on all faces
   - `block/cross` - X-shaped flat model (flowers, crops)
   - `block/orientable` - Directional blocks (furnaces)
   - `item/generated` - Flat 2D item texture

#### Texture Variables

Textures use variable indirection with `#` prefix:

```json
{
  "textures": {
    "particle": "#torch",
    "torch": "block/torch_on"
  }
}
```

**Resolution Process:**
1. Face references `"texture": "#torch"`
2. Looks up `textures.torch` → `"block/torch_on"`
3. If value starts with `#`, follow the chain
4. Final value is the actual texture path

**Special Variables:**
- `particle`: Defines texture for breaking particles and portal overlays
- Variables can reference other variables (indirect resolution)

#### Elements (Cuboids)

Each element defines a rectangular solid:

```json
{
  "from": [0, 0, 0],
  "to": [16, 16, 16],
  "rotation": {
    "origin": [8, 8, 8],
    "axis": "y",
    "angle": 45,
    "rescale": false
  },
  "shade": true,
  "faces": {
    "north": {
      "texture": "#front",
      "uv": [0, 0, 16, 16],
      "cullface": "north",
      "rotation": 90,
      "tintindex": 0
    }
  }
}
```

**Face Properties:**
- `texture`: Texture variable reference (`#variable`)
- `uv`: [x1, y1, x2, y2] texture coordinates (0-16 range)
- `cullface`: Direction - prevents rendering if adjacent block is solid
- `rotation`: 0, 90, 180, 270 - texture rotation
- `tintindex`: Integer for hardcoded color tinting (grass, leaves, etc.)

---

## XMCL Architecture

### Repository Structure

XMCL (X Minecraft Launcher) is a monorepo at `github.com/Voxelum/minecraft-launcher-core-node` with 27 packages:

**Key Packages:**
- `@xmcl/resourcepack` - Parse resource packs (Node/Browser)
- `@xmcl/model` - Display player/block models (Browser only)
- `@xmcl/core` - Launch Minecraft (Node)
- `@xmcl/installer` - Install Minecraft (Node)

### Core Classes

#### **ResourcePack**

Opens and reads resource pack files (zip or directory):

```typescript
import { ResourcePack, PackMeta } from "@xmcl/resourcepack";

// Read metadata
const pack: PackMeta.Pack = await ResourcePack.readPackMeta("path/to/pack.zip");
const icon: Uint8Array = await ResourcePack.readIcon("path/to/pack.zip");

// Open for reuse
const res = await ResourcePack.open("path/to/pack.zip");
const pack = await res.info();
const icon = await res.icon();
```

#### **ResourceLocation**

Identifies resources using domain and path notation:

```typescript
const location = ResourceLocation.ofTexturePath("block/dirt");
// Resolves to: minecraft:textures/block/dirt.png

const resource = await pack.get(location);
if (resource) {
  const binary: Uint8Array = await resource.read();
  const metadata: PackMeta = await resource.readMetadata();
}
```

#### **ResourceManager**

Manages multiple resource packs with priority ordering:

```typescript
import { ResourceManager } from "@xmcl/resourcepack";

const manager = new ResourceManager();
manager.addResourcePack(new ResourcePack(await openFileSystem("/path/to/pack1.zip")));
manager.addResourcePack(new ResourcePack(await openFileSystem("/path/to/pack2")));

// Resources are resolved from packs in order (last added = highest priority)
```

#### **ModelLoader**

Loads and resolves block models with textures:

```typescript
import { ModelLoader } from "@xmcl/resourcepack";

const loader = new ModelLoader(manager);
await loader.loadModel("block/grass");

const models: Record<string, BlockModel.Resolved> = loader.models;
const textures: Record<string, Resource> = loader.textures;
```

**ModelLoader Implementation Details:**

From analyzing `modelLoader.ts` source code:

1. **Model Loading Process:**
   ```typescript
   async loadModel(modelPath: string) {
     // 1. Convert path to ResourceLocation
     // 2. Check cache first
     // 3. Read JSON model from resource
     // 4. If has parent, recursively load parent
     // 5. Merge child with parent (child overrides parent)
     // 6. Resolve texture variables
     // 7. Load texture resources
     // 8. Cache resolved model
   }
   ```

2. **Parent Resolution:**
   - Recursive loading of parent models
   - Property merging with child priority
   - Parent reference removed from resolved model
   - Inherited properties: `elements`, `ambientocclusion`, `display`, `overrides`, `textures`

3. **Texture Resolution:**
   ```typescript
   findRealTexturePath(textures: Record<string, string>, variable: string): string | undefined {
     // Follow #variable chains until finding actual path
     // Handle circular references
     // Return undefined if broken chain
   }
   ```

4. **Caching:**
   - `models`: Map<string, BlockModel.Resolved>
   - `textures`: Map<string, Resource>
   - Prevents redundant loads

**Important Note:** XMCL's `ModelLoader` **does NOT handle blockstate files**. It only loads and resolves model JSON files. Blockstate resolution must be implemented separately.

#### **BlockModelFactory**

Creates THREE.js models from resolved block model data:

```typescript
import { BlockModelFactory } from "@xmcl/model";

const factory = new BlockModelFactory(textureRegistry);
const model: BlockModel.Resolved = /* resolved model from ModelLoader */;
const object3D: THREE.Object3D = factory.getObject(model);
```

---

### XMCL TypeScript Interfaces

```typescript
// BlockModel interface
interface BlockModel {
  parent?: string;  // Parent model path
  ambientocclusion?: boolean;
  display?: BlockModel.Display;
  textures?: {
    particle?: string;
    [variable: string]: string;
  };
  elements?: BlockModel.Element[];
  overrides?: Array<{
    predicate: Record<string, number>;
    model: string;
  }>;
}

// BlockModel.Element
interface Element {
  from: Vec3;  // [x, y, z] range: -16 to 32
  to: Vec3;
  rotation?: {
    origin: Vec3;
    axis: 'x' | 'y' | 'z';
    angle: number;  // 22.5° increments
    rescale?: boolean;
  };
  shade?: boolean;
  faces?: {
    up?: Face;
    down?: Face;
    north?: Face;
    south?: Face;
    east?: Face;
    west?: Face;
  };
}

// BlockModel.Face
interface Face {
  uv?: Vec4;  // [x1, y1, x2, y2]
  texture: string;  // Variable reference like "#all"
  cullface?: Direction;
  rotation?: 0 | 90 | 180 | 270;
  tintindex?: number;
}

// Resolved type (all inheritance flattened)
type Resolved = Omit<Required<BlockModel>, "parent" | "override" | "elements"> & {
  elements: Element[];
};

// Type aliases
type Vec3 = [number, number, number];
type Vec4 = [number, number, number, number];
type Direction = 'up' | 'down' | 'north' | 'south' | 'west' | 'east';
```

---

## Current Weaverbird Implementation

### Architecture Overview

```
User Clicks Asset
      ↓
Main Route (selectedAssetId state)
      ↓
Preview3D (showPot state, isPotted detection)
      ↓
BlockModel (loads model, creates textures)
      ↓
textureLoader (loads textures from pack/vanilla)
      ↓
THREE.js Rendering
```

### Key Components

#### **1. Backend (Rust/Tauri)**

`src-tauri/src/lib/blockstates.rs`:

```rust
pub async fn read_block_model(
    pack_id: String,
    asset_id: String,  // e.g., "minecraft:block/grass"
    packs_dir: String,
) -> Result<BlockModel, String> {
    // 1. Find blockstate file
    // 2. Parse blockstate JSON
    // 3. Get default model from variants
    // 4. Resolve model with parent chain
    // 5. Return resolved model
}
```

**What It Does:**
- Reads blockstate file from `assets/<namespace>/blockstates/<block>.json`
- Extracts default model from `variants[""]` or `variants["normal"]`
- Recursively resolves parent models
- Merges textures from parent → child
- Returns fully resolved model with elements and textures

**What It Doesn't Handle:**
- ❌ Variant selection based on block properties
- ❌ Multiple models per variant (weighted randomization)
- ❌ Multipart blockstates
- ❌ Conditional model application
- ❌ Rotation/uvlock from blockstate

#### **2. Frontend (TypeScript/React)**

**AssetResults Component:**
- Groups variants using `groupAssetsByVariant()`
- Shows variant count badge
- Normalizes asset IDs to handle malformed VanillaTweaks packs

**Preview3D Component:**
- Manages `showPot` checkbox state
- Detects potted plants with `isPottedPlant()`
- Passes props to BlockModel

**BlockModel Component:**
- Main orchestrator for model loading
- Gets winner pack from Zustand store
- Normalizes asset ID
- Extracts variant number for ETF-style variants
- Creates texture loader with variant suffix
- Converts model to THREE.js geometry
- Handles potted plants (showPot toggle)

**textureLoader Module:**
- Creates closure that loads textures
- Applies variant number suffix (`"block/allium"` + `"3"` = `"block/allium3"`)
- Tries pack texture first, falls back to vanilla
- Returns THREE.Texture or null

### Current Flow

```
1. User selects "minecraft:block/allium3"
2. BlockModel normalizes to "minecraft:block/allium3"
3. Backend reads blockstate for "allium"
4. Backend returns default model from variants[""]
5. Frontend extracts variant number "3"
6. Frontend creates textureLoader with variantNumber="3"
7. Model references texture "block/allium"
8. textureLoader appends "3" → "block/allium3"
9. Loads texture from pack
10. Renders model with variant texture
```

---

## Gaps and Missing Features

### 1. **No Variant Selection Support** ❌

**Current Behavior:**
- Always loads default variant (`""` or `"normal"`)
- Ignores all other variants in blockstate file

**Example of What's Missing:**

Blockstate for furnace:
```json
{
  "variants": {
    "facing=north": { "model": "block/furnace", "y": 0 },
    "facing=east": { "model": "block/furnace", "y": 90 },
    "facing=south": { "model": "block/furnace", "y": 180 },
    "facing=west": { "model": "block/furnace", "y": 270 }
  }
}
```

**Current:** We load nothing (no `""` variant exists)  
**Should:** Allow user to select `"facing=north"` variant

---

### 2. **No Multipart Blockstate Support** ❌

**Current Behavior:**
- Multipart blockstates fail to load
- No support for conditional model application

**Example of What's Missing:**

Fence blockstate (multipart):
```json
{
  "multipart": [
    { "apply": { "model": "block/fence_post" } },
    { "when": { "north": "true" }, "apply": { "model": "block/fence_side", "y": 0 } },
    { "when": { "east": "true" }, "apply": { "model": "block/fence_side", "y": 90 } }
  ]
}
```

**Current:** Fails to render  
**Should:** Combine multiple models based on conditions

---

### 3. **No Multiple Model Support (Weighted Random)** ❌

**Current Behavior:**
- Only loads first model if array exists
- Ignores weight property

**Example:**

Grass blockstate:
```json
{
  "variants": {
    "snowy=false": [
      { "model": "block/grass_block", "weight": 1 },
      { "model": "block/grass_block", "x": 90, "weight": 1 },
      { "model": "block/grass_block", "x": 180, "weight": 1 },
      { "model": "block/grass_block", "x": 270, "weight": 1 }
    ]
  }
}
```

**Current:** Only shows first model  
**Should:** Allow selecting any variant, show all 4 rotations

---

### 4. **No Rotation/Transform from Blockstate** ❌

**Current Behavior:**
- Model rotation (`x`, `y`, `z`) from blockstate is ignored
- `uvlock` property ignored

**Example:**

```json
{
  "facing=east": { "model": "block/furnace", "y": 90 }
}
```

**Current:** Furnace always faces same direction  
**Should:** Rotate 90° on Y-axis

---

### 5. **No Display Transform Support** ⚠️

**Current Behavior:**
- Display transforms exist in models but aren't used
- Always render as block in world

**Example:**

Model with display:
```json
{
  "display": {
    "gui": {
      "rotation": [30, 45, 0],
      "translation": [0, 0, 0],
      "scale": [0.625, 0.625, 0.625]
    },
    "ground": {
      "rotation": [0, 0, 0],
      "translation": [0, 2, 0],
      "scale": [0.5, 0.5, 0.5]
    }
  }
}
```

**Current:** Uses default view  
**Should:** Could add view mode selector (GUI, Ground, etc.)

---

### 6. **Limited Blockstate Resolution** ⚠️

**Current Behavior:**
- Backend only tries `variants[""]` or `variants["normal"]`
- Doesn't parse variant property combinations
- Doesn't build variant names from properties

**Example:**

Wall torch blockstate:
```json
{
  "variants": {
    "facing=east": { ... },
    "facing=west": { ... },
    "facing=north": { ... },
    "facing=south": { ... }
  }
}
```

**Current:** Fails (no `""` variant)  
**Should:** List all variants, allow selection

---

### 7. **No Item Model Override Support** ❌

**Current Behavior:**
- Item model predicates ignored
- No support for dynamic model switching

**Example:**

Bow item model:
```json
{
  "overrides": [
    { "predicate": { "pulling": 1 }, "model": "item/bow_pulling_0" },
    { "predicate": { "pulling": 1, "pull": 0.65 }, "model": "item/bow_pulling_1" },
    { "predicate": { "pulling": 1, "pull": 0.9 }, "model": "item/bow_pulling_2" }
  ]
}
```

**Current:** Only shows base model  
**Should:** Allow selecting predicate states (for viewer purposes)

---

### 8. **Potted Plant Handling** ✅ (Partially Implemented)

**Current Behavior:**
- ✅ Detects potted plants with `isPottedPlant()`
- ✅ "Show Pot" checkbox toggles between potted/non-potted
- ✅ Loads correct model based on state

**How It Works:**
```typescript
// If showPot = true:  Load "minecraft:block/oxeye_daisy_potted"
// If showPot = false: Load "minecraft:block/oxeye_daisy"
```

This works because Minecraft's potted blockstates already combine pot + plant models.

---

### 9. **ETF Variant Support** ✅ (Implemented)

**Current Behavior:**
- ✅ Extracts variant number from asset ID
- ✅ Appends variant suffix to texture paths
- ✅ Allows viewing numbered texture variants

**How It Works:**
```typescript
assetId = "minecraft:block/allium3"
variantNumber = "3"
textureId = "block/allium"
actualTextureId = "block/allium" + "3" = "block/allium3"
```

This enables **Entity Texture Features (ETF)** style variant preview where numbered textures exist (`allium1.png`, `allium2.png`, etc.)

---

## Recommended Changes

### Priority 1: Core Blockstate Support

#### 1.1 **Add Variant Listing & Selection**

**Backend Changes:**

```rust
// New function to list all variants
pub async fn list_block_variants(
    pack_id: String,
    asset_id: String,
    packs_dir: String,
) -> Result<Vec<String>, String> {
    // 1. Read blockstate file
    // 2. Extract all variant names from "variants" object
    // 3. Return array of variant names
}

// Update existing function to accept variant
pub async fn read_block_model(
    pack_id: String,
    asset_id: String,
    variant: Option<String>,  // NEW: Optional variant name
    packs_dir: String,
) -> Result<BlockModelWithTransform, String> {
    // 1. Read blockstate file
    // 2. If variant provided, use that variant
    // 3. Otherwise, use default ("" or "normal")
    // 4. Return model + rotation/transform from blockstate
}

// New struct to include transforms
pub struct BlockModelWithTransform {
    pub model: BlockModel,
    pub rotation: Option<(i32, i32, i32)>,  // x, y, z
    pub uvlock: Option<bool>,
}
```

**Frontend Changes:**

Add `BlockVariantSelector` component:

```typescript
interface Props {
  assetId: string;
  onSelectVariant: (variantName: string) => void;
}

function BlockVariantSelector({ assetId, onSelectVariant }: Props) {
  const [variants, setVariants] = useState<string[]>([]);
  
  useEffect(() => {
    listBlockVariants(packId, assetId, packsDir)
      .then(setVariants);
  }, [assetId]);
  
  return (
    <select onChange={(e) => onSelectVariant(e.target.value)}>
      {variants.map(variant => (
        <option key={variant} value={variant}>
          {beautifyVariantName(variant)}
        </option>
      ))}
    </select>
  );
}
```

Update `BlockModel` to handle transforms:

```typescript
// Apply rotation from blockstate
if (modelWithTransform.rotation) {
  const [x, y, z] = modelWithTransform.rotation;
  group.rotation.x = (x * Math.PI) / 180;
  group.rotation.y = (y * Math.PI) / 180;
  group.rotation.z = (z * Math.PI) / 180;
}
```

---

#### 1.2 **Add Multipart Blockstate Support**

**Backend Changes:**

```rust
// New struct for multipart conditions
pub struct MultipartCase {
    pub when: Option<MultipartCondition>,
    pub apply: BlockModelReference,
}

pub enum MultipartCondition {
    Simple(HashMap<String, String>),  // { "north": "true" }
    Or(Vec<HashMap<String, String>>),
    And(Vec<HashMap<String, String>>),
}

pub struct BlockModelReference {
    pub model: String,
    pub x: Option<i32>,
    pub y: Option<i32>,
    pub z: Option<i32>,
    pub uvlock: Option<bool>,
}

// New function for multipart
pub async fn read_multipart_blockstate(
    pack_id: String,
    asset_id: String,
    properties: HashMap<String, String>,  // User-selected properties
    packs_dir: String,
) -> Result<Vec<BlockModelWithTransform>, String> {
    // 1. Read blockstate file
    // 2. For each multipart case:
    //    - If no "when" condition, include model
    //    - If "when" condition matches properties, include model
    // 3. Load all matching models
    // 4. Return array of models with transforms
}
```

**Frontend Changes:**

Add property selector UI:

```typescript
interface MultipartProps {
  assetId: string;
  properties: Record<string, string>;
  onPropertiesChange: (props: Record<string, string>) => void;
}

function MultipartPropertySelector({ assetId, properties, onPropertiesChange }: MultipartProps) {
  // Get available properties for this block
  const [availableProps, setAvailableProps] = useState<Record<string, string[]>>({});
  
  // UI with checkboxes/toggles for each property
  return (
    <div>
      {Object.entries(availableProps).map(([key, values]) => (
        <label key={key}>
          {key}:
          <select
            value={properties[key] || values[0]}
            onChange={(e) => onPropertiesChange({
              ...properties,
              [key]: e.target.value
            })}
          >
            {values.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
      ))}
    </div>
  );
}
```

Update `BlockModel` to render multiple models:

```typescript
// Load all matching multipart models
const models = await readMultipartBlockstate(packId, assetId, properties, packsDir);

// Create group combining all models
const combinedGroup = new THREE.Group();
for (const modelData of models) {
  const modelGroup = await blockModelToThreeJs(modelData.model, textureLoader, biomeColor);
  
  // Apply transforms from blockstate
  if (modelData.rotation) {
    const [x, y, z] = modelData.rotation;
    modelGroup.rotation.set(
      (x * Math.PI) / 180,
      (y * Math.PI) / 180,
      (z * Math.PI) / 180
    );
  }
  
  combinedGroup.add(modelGroup);
}
```

---

### Priority 2: Enhanced Features

#### 2.1 **Add Multiple Model Support (Weighted Random)**

**Backend Changes:**

```rust
pub async fn list_variant_models(
    pack_id: String,
    asset_id: String,
    variant: String,
    packs_dir: String,
) -> Result<Vec<BlockModelReference>, String> {
    // 1. Read blockstate file
    // 2. Get variant
    // 3. If variant is array, return all models with weights
    // 4. If variant is object, return single model
}
```

**Frontend Changes:**

Add model index selector:

```typescript
function ModelVariantSelector({ models, onSelectModel }: Props) {
  return (
    <div>
      <label>Model Variant:</label>
      <select onChange={(e) => onSelectModel(parseInt(e.target.value))}>
        {models.map((model, index) => (
          <option key={index} value={index}>
            Model {index + 1} {model.weight && `(Weight: ${model.weight})`}
          </option>
        ))}
      </select>
    </div>
  );
}
```

---

#### 2.2 **Add Display Transform Modes**

Add view mode selector:

```typescript
type DisplayMode = 'gui' | 'ground' | 'fixed' | 'head' | 'thirdperson_righthand' | 'firstperson_righthand';

function DisplayModeSelector({ mode, onChangeMode }: Props) {
  return (
    <select value={mode} onChange={(e) => onChangeMode(e.target.value as DisplayMode)}>
      <option value="gui">GUI</option>
      <option value="ground">Ground</option>
      <option value="fixed">Item Frame</option>
      <option value="head">Head</option>
      <option value="thirdperson_righthand">Third Person</option>
      <option value="firstperson_righthand">First Person</option>
    </select>
  );
}
```

Apply display transforms in BlockModel:

```typescript
if (model.display && model.display[displayMode]) {
  const transform = model.display[displayMode];
  
  if (transform.rotation) {
    group.rotation.set(...transform.rotation.map(v => v * Math.PI / 180));
  }
  
  if (transform.translation) {
    group.position.set(...transform.translation);
  }
  
  if (transform.scale) {
    group.scale.set(...transform.scale);
  }
}
```

---

### Priority 3: Architecture Improvements

#### 3.1 **Separate Blockstate Resolution from Model Loading**

Create dedicated blockstate resolver:

```rust
// New module: blockstate_resolver.rs

pub enum BlockstateFormat {
    Variants(HashMap<String, VariantModel>),
    Multipart(Vec<MultipartCase>),
}

pub enum VariantModel {
    Single(BlockModelReference),
    Multiple(Vec<BlockModelReference>),
}

pub async fn parse_blockstate(
    pack_id: String,
    block_name: String,
    packs_dir: String,
) -> Result<BlockstateFormat, String> {
    // Parse blockstate file
    // Return structured format
}

pub fn resolve_variant(
    blockstate: &BlockstateFormat,
    variant: &str,
) -> Result<Vec<BlockModelReference>, String> {
    // For Variants format: return models for variant
    // For Multipart: error (use resolve_multipart instead)
}

pub fn resolve_multipart(
    blockstate: &BlockstateFormat,
    properties: &HashMap<String, String>,
) -> Result<Vec<BlockModelReference>, String> {
    // Evaluate conditions
    // Return matching models
}
```

---

#### 3.2 **Add Blockstate Caching**

```rust
use std::sync::Arc;
use tokio::sync::RwLock;

pub struct BlockstateCache {
    cache: Arc<RwLock<HashMap<String, BlockstateFormat>>>,
}

impl BlockstateCache {
    pub async fn get_or_load(&self, pack_id: &str, block_name: &str, packs_dir: &str) -> Result<BlockstateFormat, String> {
        let cache_key = format!("{}:{}", pack_id, block_name);
        
        // Check cache
        {
            let cache = self.cache.read().await;
            if let Some(blockstate) = cache.get(&cache_key) {
                return Ok(blockstate.clone());
            }
        }
        
        // Load from disk
        let blockstate = parse_blockstate(pack_id.to_string(), block_name.to_string(), packs_dir.to_string()).await?;
        
        // Cache it
        {
            let mut cache = self.cache.write().await;
            cache.insert(cache_key, blockstate.clone());
        }
        
        Ok(blockstate)
    }
}
```

---

#### 3.3 **Improve Frontend State Management**

Add blockstate-specific state:

```typescript
interface BlockstateState {
  format: 'variants' | 'multipart' | 'unknown';
  variants?: string[];  // List of variant names
  properties?: Record<string, string[]>;  // Available properties for multipart
  selectedVariant?: string;
  selectedProperties?: Record<string, string>;
  selectedModelIndex?: number;  // For weighted variants
  displayMode?: DisplayMode;
}

// Add to Preview3D state
const [blockstateState, setBlockstateState] = useState<BlockstateState>({ format: 'unknown' });
```

---

### Priority 4: User Experience

#### 4.1 **Add Blockstate Format Indicator**

Show badge indicating blockstate type:

```typescript
<div className={s.blockstateInfo}>
  {format === 'variants' && (
    <span className={s.badge}>Variants: {variants.length}</span>
  )}
  {format === 'multipart' && (
    <span className={s.badge}>Multipart</span>
  )}
</div>
```

---

#### 4.2 **Add Property-Based Variant Name Display**

Beautify variant names:

```typescript
function beautifyVariantName(variant: string): string {
  if (variant === '') return 'Default';
  
  // "facing=north,powered=true" → "Facing: North, Powered: True"
  return variant
    .split(',')
    .map(prop => {
      const [key, value] = prop.split('=');
      return `${titleCase(key)}: ${titleCase(value)}`;
    })
    .join(', ');
}
```

---

#### 4.3 **Add Visual Indicators for Multipart**

Show which models are currently applied:

```typescript
<div className={s.multipartStatus}>
  <h4>Active Models:</h4>
  <ul>
    {appliedModels.map((model, i) => (
      <li key={i}>
        ✓ {model.modelPath}
        {model.rotation && ` (Rotated ${model.rotation.y}°)`}
      </li>
    ))}
  </ul>
</div>
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Backend:**
1. ✅ Refactor blockstate parsing into separate module
2. ✅ Add `BlockstateFormat` enum and parsing
3. ✅ Implement `list_block_variants()` function
4. ✅ Update `read_block_model()` to accept variant parameter
5. ✅ Add rotation/transform to return type

**Frontend:**
1. ✅ Create `BlockVariantSelector` component
2. ✅ Update `BlockModel` to pass variant to backend
3. ✅ Apply rotation transforms from blockstate
4. ✅ Add blockstate format detection

**Testing:**
- Test with simple variant blocks (furnace, torch, stairs)
- Verify rotations apply correctly
- Test default variant fallback

---

### Phase 2: Multipart Support (Week 3-4)

**Backend:**
1. ✅ Implement multipart condition parsing
2. ✅ Add `resolve_multipart()` function
3. ✅ Support OR, AND, simple conditions
4. ✅ Return multiple models with transforms

**Frontend:**
1. ✅ Create `MultipartPropertySelector` component
2. ✅ Update `BlockModel` to render multiple models
3. ✅ Combine models in single THREE.Group
4. ✅ Show active models indicator

**Testing:**
- Test with fences, walls, redstone
- Verify conditional application
- Test unconditional models (always applied)

---

### Phase 3: Multiple Models & Randomization (Week 5)

**Backend:**
1. ✅ Handle array variants in blockstate
2. ✅ Return weight information
3. ✅ Add `list_variant_models()` function

**Frontend:**
1. ✅ Create model variant selector
2. ✅ Allow user to pick specific model from weighted list
3. ✅ Show weight percentages

**Testing:**
- Test with grass block (4 rotations)
- Test custom resource packs with randomized textures

---

### Phase 4: Display Transforms (Week 6)

**Frontend:**
1. ✅ Create `DisplayModeSelector` component
2. ✅ Parse display transforms from model
3. ✅ Apply rotation, translation, scale
4. ✅ Update camera for different views

**Testing:**
- Test GUI vs ground vs third-person modes
- Verify item models render correctly

---

### Phase 5: Caching & Performance (Week 7)

**Backend:**
1. ✅ Add blockstate caching layer
2. ✅ Add model caching (already exists?)
3. ✅ Optimize repeated loads

**Frontend:**
1. ✅ Memoize blockstate data
2. ✅ Optimize re-renders (already done with dependency optimization)
3. ✅ Add loading states

**Testing:**
- Performance benchmarks
- Memory usage testing
- Stress test with many variants

---

### Phase 6: Polish & UX (Week 8)

**Frontend:**
1. ✅ Beautify variant names
2. ✅ Add format indicators
3. ✅ Improve layout for complex blockstates
4. ✅ Add tooltips explaining features

**Documentation:**
1. ✅ Update user documentation
2. ✅ Add examples for each blockstate type
3. ✅ Create developer guide

**Testing:**
- User testing with non-technical users
- Accessibility testing
- Cross-browser testing

---

## Comparison: XMCL vs Weaverbird

| Feature | XMCL | Weaverbird (Current) | Weaverbird (Proposed) |
|---------|------|---------------------|---------------------|
| **Model Loading** | ✅ Full | ✅ Full | ✅ Full |
| **Parent Inheritance** | ✅ Full | ✅ Full | ✅ Full |
| **Texture Variables** | ✅ Full | ✅ Full | ✅ Full |
| **Blockstate Parsing** | ❌ None | ⚠️ Default only | ✅ Full |
| **Variant Selection** | ❌ None | ❌ None | ✅ Full |
| **Multipart** | ❌ None | ❌ None | ✅ Full |
| **Multiple Models** | ❌ None | ❌ None | ✅ Full |
| **Rotations** | ❌ None | ❌ None | ✅ Full |
| **Display Transforms** | ✅ Via Factory | ❌ None | ✅ Full |
| **ETF Variants** | ❌ None | ✅ Full | ✅ Full |
| **Potted Plants** | ❌ None | ✅ Custom | ✅ Custom |
| **Caching** | ✅ Full | ⚠️ Partial | ✅ Full |

---

## Key Architectural Differences

### XMCL Approach

```
ResourceManager (multiple packs)
      ↓
ModelLoader (loads model JSON only)
      ↓
BlockModelFactory (creates THREE.js from resolved model)
      ↓
THREE.Object3D
```

**Responsibilities:**
- **ResourceManager**: Pack priority, resource resolution
- **ModelLoader**: Model JSON loading, parent resolution, texture variable resolution
- **BlockModelFactory**: THREE.js geometry creation, texture application
- **❌ Missing**: Blockstate resolution (must be implemented separately)

---

### Weaverbird Approach

```
Zustand Store (pack winners, asset data)
      ↓
Backend (Rust) - Blockstate + Model resolution
      ↓
Frontend (React) - textureLoader + THREE.js conversion
      ↓
THREE.Object3D
```

**Responsibilities:**
- **Backend**: Blockstate parsing, variant resolution, model loading, parent resolution
- **Frontend**: Texture loading with variant suffix, THREE.js geometry, UI state
- **Advantage**: Blockstate logic in backend (faster, type-safe)
- **Disadvantage**: Currently incomplete variant/multipart support

---

## Critical Insights from XMCL Research

### 1. **Separation of Concerns**

XMCL wisely separates:
- **Resource loading** (ResourceManager)
- **Model resolution** (ModelLoader)
- **Rendering** (BlockModelFactory)

**Lesson for Weaverbird:** Keep blockstate resolution separate from model loading. Create dedicated blockstate resolver module.

---

### 2. **Caching is Critical**

XMCL caches:
- Loaded models
- Resolved textures
- Resource lookups

**Lesson for Weaverbird:** Add blockstate caching to avoid re-parsing JSON on every variant change.

---

### 3. **Blockstate Resolution is Application-Specific**

XMCL doesn't implement blockstate parsing because it's application-specific:
- Different apps need different variant selection logic
- Multipart conditions depend on game state
- Viewers have different requirements than launchers

**Lesson for Weaverbird:** We need custom blockstate logic optimized for resource pack preview use case.

---

### 4. **Texture Variable Resolution is Complex**

XMCL's `findRealTexturePath()` handles:
- Indirect references (`#all` → `#side` → `"block/dirt"`)
- Circular reference detection
- Undefined variable handling

**Lesson for Weaverbird:** Our texture resolution is currently handled by backend model resolution. Verify it handles all edge cases.

---

### 5. **Model Parent Chain Can Be Deep**

Common chains:
```
block/custom_block
  → block/cube_all
    → block/cube
      → block/block
```

**Lesson for Weaverbird:** Backend already handles this recursively. Ensure no infinite loop protection.

---

## Testing Plan

### Test Cases by Feature

#### **Variant Selection**

1. **Simple Variants** (torch, furnace)
   - ✅ List all variants
   - ✅ Load each variant
   - ✅ Apply rotation correctly

2. **Property Combinations** (stairs, slabs)
   - ✅ Parse `facing=north,half=top,shape=straight`
   - ✅ Handle all combinations
   - ✅ Apply correct model

3. **Default Fallback**
   - ✅ Handle blocks with `""` variant
   - ✅ Handle blocks with `"normal"` variant
   - ✅ Fallback when variant not found

---

#### **Multipart**

1. **Fences** (unconditional post + conditional sides)
   - ✅ Always show post
   - ✅ Show north side when `north=true`
   - ✅ Combine multiple sides

2. **Redstone** (complex conditions)
   - ✅ Handle `side=up|side|none`
   - ✅ Handle OR conditions
   - ✅ Handle AND conditions

3. **Walls** (tall variant, connection states)
   - ✅ Apply `up=true|false` models
   - ✅ Combine with connection models
   - ✅ Handle all 32+ combinations

---

#### **Multiple Models**

1. **Grass Block** (4 rotation variants)
   - ✅ Show all 4 models
   - ✅ Display weight percentages
   - ✅ Allow selection

2. **Custom Packs** (weighted random textures)
   - ✅ Handle custom weights
   - ✅ Calculate probabilities
   - ✅ Render correctly

---

#### **Rotations & Transforms**

1. **Blockstate Rotations**
   - ✅ Apply X rotation (90, 180, 270)
   - ✅ Apply Y rotation
   - ✅ Apply Z rotation
   - ✅ Handle uvlock

2. **Display Transforms**
   - ✅ GUI view (angled)
   - ✅ Ground view (flat)
   - ✅ First-person view
   - ✅ Third-person view

---

#### **Edge Cases**

1. **Malformed Blockstates**
   - ✅ Missing variants key
   - ✅ Empty variants object
   - ✅ Invalid JSON
   - ✅ Missing model reference

2. **Cross-Pack Resolution**
   - ✅ Blockstate from pack A, model from pack B
   - ✅ Model from pack A, texture from pack B
   - ✅ Parent model across packs

3. **Large Models**
   - ✅ Many elements (>100)
   - ✅ Many variants (>50)
   - ✅ Multipart with many conditions

---

## Performance Considerations

### Backend Optimizations

1. **Lazy Loading**
   - Don't load all variants upfront
   - Only load selected variant's models

2. **Parallel Model Loading**
   - Load multiple multipart models in parallel
   - Use async/await efficiently

3. **JSON Parsing Cache**
   - Cache parsed blockstate JSON
   - Reuse for different variant selections

---

### Frontend Optimizations

1. **Memoization**
   - Memoize variant lists
   - Memoize property options
   - Prevent re-renders

2. **Debouncing**
   - Debounce property changes
   - Avoid rapid model reloads

3. **Lazy Components**
   - Only render selectors when needed
   - Collapse advanced options by default

---

## Conclusion

### What We Learned from XMCL

1. **Architecture:** Clean separation between resource loading, model resolution, and rendering
2. **Caching:** Essential for performance with complex model hierarchies
3. **Texture Resolution:** Requires careful handling of variable indirection
4. **Blockstate Handling:** Application-specific, not provided by XMCL

### What Weaverbird Needs

1. **✅ Strengths:**
   - Strong backend with Rust (fast, safe)
   - Good model loading with parent resolution
   - ETF variant support unique to our use case
   - Potted plant handling (custom feature)

2. **❌ Missing:**
   - Variant selection UI and backend support
   - Multipart blockstate handling
   - Multiple model support (weighted random)
   - Rotation/transform application from blockstates

3. **🎯 Next Steps:**
   - Implement variant listing and selection (Phase 1)
   - Add multipart support (Phase 2)
   - Support multiple models per variant (Phase 3)
   - Add display transforms (Phase 4)
   - Optimize with caching (Phase 5)
   - Polish UX (Phase 6)

---

### Critical Missing Information

While researching XMCL, I couldn't find:
- ❓ **Blockstate parsing implementation** - XMCL doesn't provide this
- ❓ **Variant selection logic** - Application-specific
- ❓ **Multipart condition evaluation** - Not in XMCL core

**User Action Required:**
If you have access to:
- XMCL's actual blockstate handling code (if it exists in the launcher itself)
- Other Minecraft model viewers with variant support
- Minecraft's own Java source code for blockstate resolution

Please share so I can analyze their implementation strategies!

---

## References

- **XMCL Documentation**: https://docs.xmcl.app/en/core/
- **XMCL GitHub**: https://github.com/Voxelum/minecraft-launcher-core-node
- **Minecraft Wiki - Tutorials/Models**: https://minecraft.wiki/w/Tutorials/Models
- **Minecraft Wiki - Blockstates**: https://minecraft.wiki/w/Blockstates_definition
- **Forge Docs - Blockstates**: https://docs.minecraftforge.net/en/1.13.x/models/blockstates/introduction/

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-16  
**Author**: Claude (Sonnet 4.5) via Weaverbird Research
