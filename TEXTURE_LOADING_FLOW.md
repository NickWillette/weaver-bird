# Texture Loading Flow Diagram

This document describes the data flow between Preview3D, BlockModel, and textureLoader components.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Main Route                              │
│  - Manages selectedAssetId state                               │
│  - Renders TextureVariantSelector                              │
│  - Renders Preview3D component                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Preview3D                                │
│  State:                                                         │
│  - showPot: boolean (default: true)                            │
│  - isPlantPotted: boolean (computed from assetId)              │
│                                                                 │
│  Props:                                                         │
│  - assetId: string                                             │
│  - biomeColor: {r, g, b} | null                                │
│  - onTintDetected: (hasTint: boolean) => void                  │
│                                                                 │
│  Renders:                                                       │
│  - "Show Pot" checkbox (if isPlantPotted)                      │
│  - R3F Canvas with BlockModel                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BlockModel                               │
│  Props:                                                         │
│  - assetId: string (original, e.g., "mc:block/allium3")        │
│  - biomeColor: {r, g, b} | null                                │
│  - onTintDetected: (hasTint: boolean) => void                  │
│  - showPot: boolean                                            │
│  - isPotted: boolean                                           │
│                                                                 │
│  State Lookups:                                                 │
│  - winnerPackId = useSelectWinner(assetId)                     │
│  - winnerPack = useSelectPack(winnerPackId)                    │
│  - packsDir = useSelectPacksDir()                              │
│                                                                 │
│  Computed:                                                      │
│  - normalizedAssetId (removes trailing _ and _digits)          │
│  - biomeColorKey (stable string: "r,g,b")                      │
│  - variantNumber (extracted from assetId, e.g., "3")           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    textureLoader Module                         │
│                                                                 │
│  createTextureLoader(packPath, isZip, variantNumber?)          │
│  Returns: (textureId: string) => Promise<Texture | null>       │
│                                                                 │
│  Flow:                                                          │
│  1. Apply variant suffix if provided                           │
│  2. Try loading from pack (loadPackTexture)                    │
│  3. Fallback to vanilla (loadVanillaTexture)                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Detailed Flow: Asset Selection to Rendering

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: User Clicks Asset Card                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    User selects "Allium (3)"
                    assetId = "minecraft:block/allium3"
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Preview3D Receives Props                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ▼                                           ▼
  isPottedPlant(assetId)                    showPot state
  = false (not potted)                      = true (default)
        │                                           │
        └─────────────────────┬─────────────────────┘
                              ▼
              Renders Canvas with BlockModel
              - assetId: "minecraft:block/allium3"
              - showPot: true
              - isPotted: false
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: BlockModel useEffect Triggers                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ▼                                           ▼
  normalizeAssetId(assetId)              State Lookups:
  = "minecraft:block/allium3"            - winnerPackId (from Zustand)
  (no changes needed)                    - winnerPack object
                                         - packsDir path
        │                                           │
        └─────────────────────┬─────────────────────┘
                              ▼
              Check Dependencies Changed?
              [normalizedAssetId, winnerPackId, 
               packsDir, biomeColorKey, showPot, isPotted]
                              │
                              ▼
                    If changed: Run loadModel()
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Determine Which Model to Load                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              Is isPotted && !showPot?
                    /           \
                  YES            NO
                   │              │
                   ▼              ▼
      getPlantNameFromPotted()   Use normalizedAssetId
      modelAssetId = plant       modelAssetId = original
                   │              │
                   └──────┬───────┘
                          ▼
              modelAssetId = "minecraft:block/allium3"
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Load Block Model from Backend                          │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
      readBlockModel(packId, modelAssetId, packsDirPath)
                          │
      ┌─────────────────────────────────────────┐
      │ Backend (Rust):                         │
      │ 1. Find blockstate file                 │
      │ 2. Resolve model with parent chain      │
      │ 3. Return resolved model JSON           │
      └─────────────────────────────────────────┘
                          │
                          ▼
              model = {
                parent: "minecraft:block/cross",
                textures: { "cross": "block/allium" },
                elements: [ ... ]
              }
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: Extract Variant Number                                 │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
        getVariantNumber("minecraft:block/allium3")
                          │
        ┌─────────────────┴─────────────────┐
        │ Regex: /(\d+)$/                   │
        │ Match: "3"                        │
        │ Return: "3"                       │
        └───────────────────────────────────┘
                          │
                          ▼
              variantNumber = "3"
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 7: Create Texture Loader                                  │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
      createTextureLoader(
        winnerPack.path,
        winnerPack.is_zip,
        variantNumber: "3"
      )
                          │
                          ▼
      Returns closure: (textureId) => Promise<Texture>
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 8: Convert Model to Three.js                              │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
      blockModelToThreeJs(model, textureLoader, biomeColor)
                          │
      ┌─────────────────────────────────────────┐
      │ For each texture reference in model:    │
      │ 1. Resolve texture path                 │
      │    "cross" -> "block/allium"            │
      │                                         │
      │ 2. Call textureLoader("block/allium")   │
      │    ↓                                    │
      │    textureLoader receives "block/allium"│
      │    ↓                                    │
      │    Applies variant: "block/allium" + "3"│
      │    = "block/allium3"                    │
      │    ↓                                    │
      │    Try loadPackTexture(                 │
      │      packPath,                          │
      │      "block/allium3",                   │
      │      isZip                              │
      │    )                                    │
      │    ↓                                    │
      │    Success! Returns THREE.Texture       │
      │                                         │
      │ 3. Create geometry with texture         │
      │ 4. Apply biome color if tintindex set   │
      └─────────────────────────────────────────┘
                          │
                          ▼
              group = THREE.Group with meshes
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 9: Position and Set Block Group                           │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
              group.position.y = 0.5
                          │
                          ▼
              setBlockGroup(group)
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 10: Render in Canvas                                      │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
      <primitive object={blockGroup} />
                          │
                          ▼
              User sees Allium variant 3!
```

---

## Potted Plant Special Case Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ User Selects: "minecraft:block/oxeye_daisy_potted"             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Preview3D Component                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        isPottedPlant("minecraft:block/oxeye_daisy_potted")
        = true (contains "potted")
                              │
                              ▼
        Shows "Show Pot" checkbox ✓ (checked by default)
                              │
                              ▼
        Passes to BlockModel:
        - assetId: "minecraft:block/oxeye_daisy_potted"
        - isPotted: true
        - showPot: true
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BlockModel Component                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        normalizedAssetId = "minecraft:block/oxeye_daisy_potted"
                              │
                              ▼
        Determine model to load:
        
        Is isPotted && !showPot?
                NO (showPot is true)
                              │
                              ▼
        modelAssetId = normalizedAssetId
        = "minecraft:block/oxeye_daisy_potted"
                              │
                              ▼
        Load full potted model:
        readBlockModel(packId, "minecraft:block/oxeye_daisy_potted", ...)
                              │
                              ▼
        Backend returns potted model which includes:
        - Flower pot geometry
        - Flower geometry positioned inside pot
        - Both textures already combined
                              │
                              ▼
        Render complete potted plant ✓
        
┌─────────────────────────────────────────────────────────────────┐
│ User Unchecks "Show Pot" Checkbox                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        setShowPot(false)
                              │
                              ▼
        BlockModel useEffect triggers (showPot changed)
                              │
                              ▼
        Is isPotted && !showPot?
                YES
                              │
                              ▼
        getPlantNameFromPotted("minecraft:block/oxeye_daisy_potted")
        Returns: "minecraft:block/oxeye_daisy"
                              │
                              ▼
        modelAssetId = "minecraft:block/oxeye_daisy"
                              │
                              ▼
        Load just the plant model:
        readBlockModel(packId, "minecraft:block/oxeye_daisy", ...)
                              │
                              ▼
        Backend returns plant model only (cross geometry)
                              │
                              ▼
        Render just the flower without pot ✓
```

---

## Texture Loading Details

```
┌─────────────────────────────────────────────────────────────────┐
│          createTextureLoader(packPath, isZip, variant?)         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
      Returns async function: (textureId) => Texture | null
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Texture Loader Closure Execution                   │
└─────────────────────────────────────────────────────────────────┘
                              │
        Input: textureId = "block/allium"
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │ Step 1: Apply Variant Suffix        │
        │                                     │
        │ if (variantNumber) {                │
        │   actualTextureId = textureId       │
        │     + variantNumber                 │
        │ }                                   │
        │                                     │
        │ "block/allium" + "3"                │
        │ = "block/allium3"                   │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │ Step 2: Try Pack Texture            │
        │                                     │
        │ loadPackTexture(                    │
        │   packPath,                         │
        │   "block/allium3",                  │
        │   isZip                             │
        │ )                                   │
        │                                     │
        │ Backend tries:                      │
        │ - assets/minecraft/textures/        │
        │   block/allium3.png                 │
        └─────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
    SUCCESS                  FAIL
        │                       │
        ▼                       ▼
   Return Texture    ┌─────────────────────────────────┐
                     │ Step 3: Try Vanilla Texture     │
                     │                                 │
                     │ loadVanillaTexture(             │
                     │   "block/allium3"               │
                     │ )                               │
                     │                                 │
                     │ Tries vanilla cache:            │
                     │ ~/Library/Caches/weaverbird/    │
                     │ vanilla_textures/assets/        │
                     │ minecraft/textures/             │
                     │ block/allium3.png               │
                     └─────────────────────────────────┘
                                 │
                     ┌───────────┴───────────┐
                     │                       │
                 SUCCESS                  FAIL
                     │                       │
                     ▼                       ▼
                Return Texture         Return null
                                       (missing texture)
```

---

## Dependency Flow & Re-render Prevention

```
┌─────────────────────────────────────────────────────────────────┐
│                   BlockModel Dependencies                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        useEffect dependencies: [
          normalizedAssetId,    ← String (primitive)
          winnerPackId,         ← String (primitive)
          packsDir,             ← String (primitive)
          biomeColorKey,        ← String (primitive, e.g., "255,0,0")
          showPot,              ← Boolean (primitive)
          isPotted              ← Boolean (primitive)
        ]
                              │
                              ▼
        ❌ EXCLUDED: winnerPack (object - causes excessive re-renders)
        ❌ EXCLUDED: biomeColor (object - replaced with biomeColorKey)
                              │
                              ▼
        When dependencies change:
        1. Cancel any in-flight model load (cancelled = true)
        2. Cleanup previous Three.js geometry/materials
        3. Start new loadModel() async operation
        4. Create new textureLoader with updated params
        5. Convert model to Three.js
        6. setBlockGroup(newGroup)
                              │
                              ▼
        React re-renders component with new blockGroup
                              │
                              ▼
        <primitive object={blockGroup} /> updates scene
```

---

## State Management Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Zustand Store                              │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
   ┌─────────┐         ┌──────────┐         ┌──────────┐
   │ assets  │         │ winners  │         │  packs   │
   │ Record  │         │  Map     │         │  Record  │
   └─────────┘         └──────────┘         └──────────┘
        │                     │                     │
        │                     │                     │
        ▼                     ▼                     ▼
useSelectAllAssets()  useSelectWinner()    useSelectPack()
        │             (assetId) → packId   (packId) → pack
        │                     │                     │
        ▼                     ▼                     ▼
TextureVariantSelector  BlockModel          BlockModel
(variant dropdown)      (state lookup)      (gets pack info)

                     useSelectPacksDir()
                              │
                              ▼
                        BlockModel
                     (gets packs directory)
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   Model Loading Errors                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        try {
          readBlockModel(...)
        } catch (err) {
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ▼                                           ▼
  Backend Error:                          Network Error:
  - Blockstate not found                  - Tauri IPC failed
  - Model not found                       - Permission denied
  - Invalid JSON                          - File system error
        │                                           │
        └─────────────────────┬─────────────────────┘
                              ▼
              setError(errorMessage)
              createPlaceholder()
                              │
                              ▼
        Brown cube placeholder shown to user
        Error logged to console
        Component doesn't crash ✓
        }
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Texture Loading Errors                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        textureLoader("block/missing")
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ▼                                           ▼
  loadPackTexture fails          loadVanillaTexture fails
        │                                           │
        └─────────────────────┬─────────────────────┘
                              ▼
                    Returns null
                              │
                              ▼
        blockModelToThreeJs handles null texture:
        - Uses magenta/black checkerboard
        - Or skips that face
        - Continues rendering other faces ✓
```

---

## Key Design Decisions

### 1. **Asset ID Normalization**
- Original asset IDs preserved for state lookups
- Normalized IDs used for file operations
- Handles malformed VanillaTweaks IDs (`_01`, trailing `_`)

### 2. **Variant Number Extraction**
- Extracted at BlockModel level
- Passed to textureLoader closure
- Applied as suffix to all texture paths
- Enables ETF-style variant preview

### 3. **Potted Plant Logic**
- Minecraft's blockstate system handles pot+plant combination
- We just switch between loading potted vs. non-potted models
- Avoids manual geometry positioning and combination

### 4. **Dependency Optimization**
- Only primitive values in useEffect dependencies
- Objects converted to stable string keys
- Prevents excessive re-renders from object reference changes

### 5. **Texture Loading Fallback Chain**
```
Pack Texture → Vanilla Texture → null (checkerboard/skip)
```

---

## Component Responsibilities

### **Preview3D**
- Manages "Show Pot" UI state
- Detects if asset is a potted plant
- Renders R3F Canvas and lighting
- Passes configuration to BlockModel

### **BlockModel**
- Orchestrates model loading pipeline
- Manages Three.js geometry lifecycle
- Handles dependency changes efficiently
- Creates texture loader with variant support
- Positions final model in scene

### **textureLoader**
- Pure function factory (createTextureLoader)
- Applies variant suffixes to texture paths
- Implements pack → vanilla fallback chain
- Returns THREE.Texture instances
- Handles missing textures gracefully

---

## Performance Considerations

1. **Memoization**: `biomeColorKey` prevents re-renders
2. **Cleanup**: Old geometry/materials disposed on asset change
3. **Cancellation**: In-flight loads cancelled when asset changes
4. **Lazy Loading**: Textures loaded on-demand during conversion
5. **Stable Dependencies**: Only primitives trigger useEffect
