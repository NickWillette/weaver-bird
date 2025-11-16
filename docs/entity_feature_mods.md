# ETF & EMF Integration Notes

## Why These Mods Matter
Resource packs frequently rely on **Entity Texture Features (ETF)** and **Entity Model Features (EMF)** to deliver custom variants, emissive layers, and conditional geometry swaps. Even though these mods target Minecraft’s rendering engine, our Three.js viewer must honor their rules to faithfully reproduce what players see in-game. This document summarizes the features exposed by the mods, the implications for Weaverbird’s block/entity renderer, and a strategy for translating the JVM-side logic into TypeScript/React Three Fiber.

## Entity Texture Features (ETF)
ETF extends OptiFine-style properties files for textures. Core features we need to emulate:

| Feature | Technical Notes | Renderer Impact |
| --- | --- | --- |
| **Random & weighted textures** | `textures=<list>` + `weights=<list>` or `random=<bool>`; selection locked per entity UUID, biome seed, or manual index overrides ([RandomPropertyRule.java](https://github.com/Traben-0/Entity_Texture_Features/blob/ETF-Main/src/main/java/traben/entity_texture_features/features/property_reading/RandomPropertyRule.java)). | Deterministic pseudo-RNG per asset; viewer must seed RNG using stored preview context (block hash, entity id) to pull the same texture predicted by ETF. |
| **Conditional matching** | Properties such as `biomes=`, `heights=`, `weather=`, `nbt.<path>=`, `equipment=` come from the OptiFine-style property classes ([optifine_properties](https://github.com/Traben-0/Entity_Texture_Features/tree/ETF-Main/src/main/java/traben/entity_texture_features/features/property_reading/properties/optifine_properties)). | Preview UI needs a control surface to set context (biome, weather, NBT) and propagate it to the renderer before selecting textures. |
| **Layered/emissive textures** | `layers=` defines stacked texture slots; `_e`/`emissive=true` toggles glow maps handled by [ETFTexture.java](https://github.com/Traben-0/Entity_Texture_Features/blob/ETF-Main/src/main/java/traben/entity_texture_features/features/texture_handlers/ETFTexture.java) and rendered inside [ETFPlayerFeatureRenderer.java](https://github.com/Traben-0/Entity_Texture_Features/blob/ETF-Main/src/main/java/traben/entity_texture_features/features/player/ETFPlayerFeatureRenderer.java). | Requires multi-material meshes: base `MeshStandardMaterial` for diffuse + normal, plus additive emissive material or custom shader chunk for glowing texels. |
| **Armor & model part masking** | Per-part texture overrides come from the armor handler ([ETFArmorHandler.java](https://github.com/Traben-0/Entity_Texture_Features/blob/ETF-Main/src/main/java/traben/entity_texture_features/features/texture_handlers/ETFArmorHandler.java)) and player-specific logic ([ETFPlayerTexture.java](https://github.com/Traben-0/Entity_Texture_Features/blob/ETF-Main/src/main/java/traben/entity_texture_features/features/player/ETFPlayerTexture.java)). | Loader must maintain per-part texture assignments and split meshes if a single geometry uses multiple texture atlases. |
| **Animation bridges** | ETF respects vanilla `.mcmeta` frame data plus blink/enchant timings defined in [ETFTexture.setupBlinking/setupEnchants](https://github.com/Traben-0/Entity_Texture_Features/blob/ETF-Main/src/main/java/traben/entity_texture_features/features/texture_handlers/ETFTexture.java#L74-L206). | Use Three.js `TextureLoader` + animation loop to update frame offsets; keep GPU texture arrays in sync with `.mcmeta` timings. |

ETF reference code:
- Parsing + RNG: `features/property_reading` and `RandomPropertyRule` plus property implementations under [`properties/optifine_properties`](https://github.com/Traben-0/Entity_Texture_Features/tree/ETF-Main/src/main/java/traben/entity_texture_features/features/property_reading/properties/optifine_properties).
- Texture lifecycle: [`ETFTexture.java`](https://github.com/Traben-0/Entity_Texture_Features/blob/ETF-Main/src/main/java/traben/entity_texture_features/features/texture_handlers/ETFTexture.java) & [`ETFTextureVariator.java`](https://github.com/Traben-0/Entity_Texture_Features/blob/ETF-Main/src/main/java/traben/entity_texture_features/features/texture_handlers/ETFTextureVariator.java).
- Rendering: [`ETFPlayerFeatureRenderer.java`](https://github.com/Traben-0/Entity_Texture_Features/blob/ETF-Main/src/main/java/traben/entity_texture_features/features/player/ETFPlayerFeatureRenderer.java) showing how emissive layers are queued, and [`ETFPlayerTexture.java`](https://github.com/Traben-0/Entity_Texture_Features/blob/ETF-Main/src/main/java/traben/entity_texture_features/features/player/ETFPlayerTexture.java) handling per-part resolution.

ETF parsing strategy:
1. Scan resource packs for `optifine/random/entity` or `assets/*/etf/` rule files (`.properties`) inside the backend scanner (`src-tauri/src/util/asset_indexer.rs`).
2. Build a JSON intermediary describing selectors (conditions), texture stacks, and metadata, and serialize it through the scan response (`src-tauri/src/commands/packs.rs`).
3. Store intermediary data in the frontend store (`src/state/store.ts`) so components such as `src/components/Preview3D/BlockModel.tsx` can resolve textures before rendering.

## Entity Model Features (EMF)
EMF introduces custom entity geometry beyond vanilla/CEM:

| Feature | Technical Notes | Renderer Impact |
| --- | --- | --- |
| **Model overrides** | `.jem/.emf` JSON are parsed by [EMFManager.java](https://github.com/Traben-0/Entity_Model_Features/blob/master/src/main/java/traben/entity_model_features/EMFManager.java) into `EMFPartData` and `EMFBoxData` structures ([jem_objects](https://github.com/Traben-0/Entity_Model_Features/tree/master/src/main/java/traben/entity_model_features/models/jem_objects)). | Convert EMF geometry into Three.js buffers (positions, normals, UVs) during pack ingestion; store transforms per bone to let React Three Fiber animate or toggle them. |
| **Conditional parts** | Model rule evaluation hooks through `propeties` such as [ModelRuleIndexProperty.java](https://github.com/Traben-0/Entity_Model_Features/blob/master/src/main/java/traben/entity_model_features/propeties/ModelRuleIndexProperty.java) and [ModelSuffixProperty.java](https://github.com/Traben-0/Entity_Model_Features/blob/master/src/main/java/traben/entity_model_features/propeties/ModelSuffixProperty.java). | Renderer must evaluate conditions per preview state and prune meshes accordingly (show/hide nodes in the scene graph). |
| **Procedural variants** | Variation handling and pack-priority merging live in [EMFManager#buildModels](https://github.com/Traben-0/Entity_Model_Features/blob/master/src/main/java/traben/entity_model_features/EMFManager.java#L520-L720). | Share RNG seed with ETF textures so textures and geometry variants stay in sync. |
| **Attachment points** | Attachments are parsed in [EMFPartData.java](https://github.com/Traben-0/Entity_Model_Features/blob/master/src/main/java/traben/entity_model_features/models/jem_objects/EMFPartData.java#L39-L123) and consumed by [EMFModelPartCustom.java](https://github.com/Traben-0/Entity_Model_Features/blob/master/src/main/java/traben/entity_model_features/models/parts/EMFModelPartCustom.java#L30-L160). | Expose anchors via R3F refs so UI components (e.g., gizmos) can mount additional meshes consistently with EMF positions. |
| **Pose/animation hints** | Animation definitions live under [`models/animation`](https://github.com/Traben-0/Entity_Model_Features/tree/master/src/main/java/traben/entity_model_features/models/animation), including curve math (`math`) and attachment enumerations ([EMFAttachments.java](https://github.com/Traben-0/Entity_Model_Features/blob/master/src/main/java/traben/entity_model_features/models/animation/EMFAttachments.java)). | Map to React Three Fiber’s `useFrame` loop to lerp transforms; consider exporting baked keyframes for playback in previews. |

EMF reference code:
- Geometry builders: [`EMFModelPartCustom.java`](https://github.com/Traben-0/Entity_Model_Features/blob/master/src/main/java/traben/entity_model_features/models/parts/EMFModelPartCustom.java) and `jem_objects`.
- Condition evaluation: [`propeties/`](https://github.com/Traben-0/Entity_Model_Features/tree/master/src/main/java/traben/entity_model_features/propeties) package.
- Attachments & held items: [`models/animation/EMFAttachments.java`](https://github.com/Traben-0/Entity_Model_Features/blob/master/src/main/java/traben/entity_model_features/models/animation/EMFAttachments.java) plus mixins such as [`MixinHeldItemFeatureRenderer`](https://github.com/Traben-0/Entity_Model_Features/blob/master/src/main/java/traben/entity_model_features/mixin/mixins/rendering/feature/MixinHeldItemFeatureRenderer.java).

EMF integration pipeline:
1. Parse EMF JSON into a normalized schema within the backend (add a module under `src-tauri/src/util/emf_parser.rs`) so it can piggyback on the existing pack scan.
2. Convert quads or cubes into indexed buffer geometry and emit consumable structs in the scan response; frontend helpers inside `src/lib/three/` can turn these into `THREE.BufferGeometry`.
3. Persist geometry references (possibly as GLTF blobs stored in `dist/` or memory) so React Three Fiber loaders (`src/components/Preview3D/BlockModel.tsx`) can lazily fetch them.

## Impact on the Block/Entity Renderer
1. **Deterministic Context** – Introduce a `RenderContext` object (entity UUID, biome id, time-of-day, weather, user-selected NBT) stored in Zustand (`src/state/store.ts`). Both ETF and EMF resolvers (implemented in `src/lib/three/variantResolver.ts`) read from it before choosing variants, guaranteeing parity with Minecraft’s rules.
2. **Material System** – Extend the existing Three.js materials to support multiple texture slots (base, overlay, emissive). Use `ShaderMaterial` or `onBeforeCompile` hooks to inject emissive sampling for ETF glow layers.
3. **Mesh Partitioning** – Blocks/entities that mix materials per face/part must be split into sub-meshes so we can bind different materials (e.g., base stone vs. moss overlay). Precompute part assignments when loading EMF models.
4. **Texture Animation** – Reuse `.mcmeta` frame data plus ETF overrides to animate textures inside the viewer. Store per-texture frame duration arrays and update offsets in `useFrame`.
5. **Tooling & Preview UX** – Provide developer toggles for context variables (biome dropdown, weather toggle, random seed). This allows QA to verify ETF/EMF behavior directly inside Weaverbird.

## React Three Fiber Integration Plan
1. **Data Layer** – Expand the backend scan result (`scanPacksFolder`) to include serialized ETF/EMF descriptors. Update `state/store.ts` with selectors like `useSelectEntityTextureVariant(entityId, context)` to fetch resolved assets.
2. **Loader Hooks** – Create hooks such as `useEntityTextures(entityId, context)` and `useEntityModel(entityId, context)` under `src/hooks/` or `src/components/Preview3D/hooks/` that:
   - Retrieve descriptors from state.
   - Evaluate conditions (biome/nbt/weather) client-side.
   - Seed deterministic RNG (e.g., `mulberry32(hash(entityId + context.seed))`).
   - Return `THREE.Texture` objects and `BufferGeometry`.
3. **Material Factory** – Build a `createEmissiveMaterial({ baseMap, emissiveMap, overlayMaps })` helper that generates the appropriate Three.js `Material` stack. For multi-layer setups, leverage `THREE.MeshBasicMaterial` for additive passes parented to the same geometry.
4. **Scene Graph** – Represent EMF bones as nested `<group>` elements in R3F. Attach meshes to bones so conditional enabling/disabling is just toggling `visible`.
5. **Animation Loop** – Use `useFrame` to update animated textures and optional EMF pose data. Keep animation data in refs to avoid reallocations.
6. **Testing Strategy** – Add Vitest suites in `src/lib/three/__tests__/` to validate ETF/EMF evaluators against recorded fixtures. For rendering parity, add Storybook stories under `src/components/Preview3D/__stories__/` or screenshot tests via Playwright capturing the 3D canvas.

## Open Questions & Next Steps
1. **Spec Coverage** – Verify whether ETF/EMF expose extra rules (e.g., height-based LOD, mob-specific tags) beyond OptiFine; gather real packs to build fixtures.
2. **Performance** – Decide between on-the-fly EMF-to-GLTF conversion vs. pre-baking GLTF in the backend.
3. **Shader Customization** – Evaluate if `three-custom-shader-material` or node-based materials would simplify emissive/overlay support.
4. **Authoring UX** – Potentially surface warnings for unsupported ETF/EMF clauses so creators know why a variant failed.

## Lessons from Blockbench’s Three.js Implementation
Blockbench is open source and relies on a custom Three.js pipeline to preview Java Edition models. Several design choices map directly to our ETF/EMF ambitions (reference their GitHub: [blockbench/js](https://github.com/JannisX11/blockbench/tree/master/js)):

- **Geometry Abstraction:** [`js/modeling/cube.js`](https://github.com/JannisX11/blockbench/blob/master/js/modeling/cube.js) and related modeling modules build cubes/UV data before converting them to buffers. Mimic this by converting EMF cubes into an intermediate representation so we can reuse UV locking, mirroring, and rotation logic when emitting `BufferGeometry`.
- **Multi-Material Meshes:** [`js/preview/preview.js`](https://github.com/JannisX11/blockbench/blob/master/js/preview/preview.js) and [`js/preview/canvas.js`](https://github.com/JannisX11/blockbench/blob/master/js/preview/canvas.js) attach multiple materials to a single mesh and organize per-face groups. This is ideal for ETF layers—precompute groups for overlay/emissive faces instead of splitting geometry.
- **Animation System:** Blockbench’s animator stack (`js/animations/` such as [`js/animations/controller.js`](https://github.com/JannisX11/blockbench/blob/master/js/animations/controller.js)) drives transforms through keyframe tracks stored on bones. Serialize EMF bone transforms similarly and reuse React Three Fiber’s `useFrame` to evaluate them.
- **Context Panels:** UI state piping lives in [`js/interface/interface.js`](https://github.com/JannisX11/blockbench/blob/master/js/interface/interface.js) alongside preview modules, showing how display toggles feed directly into shader/material state. Our preview should expose comparable controls (biome, weather, RNG seed) and push the state into ETF/EMF selectors prior to rendering.
- **Shader Hooks:** [`js/preview/preview.js`](https://github.com/JannisX11/blockbench/blob/master/js/preview/preview.js) wires shader uniforms, while custom shader snippets reside in [`js/shaders/shader.ts`](https://github.com/JannisX11/blockbench/blob/master/js/shaders/shader.ts) and GLSL files. Studying these helpers can inspire how we toggle emissive ETF layers via `onBeforeCompile`.

Action Items:
1. Review Blockbench’s renderer code (`js/modeling/`, `js/preview/`, `js/shaders/`) to understand how they partition geometry and manage materials.
2. Extract reusable patterns (grouped geometry, multi-material meshes, animator architecture) and codify them in `src/lib/three/` helpers plus accompanying hooks under `src/components/Preview3D/`.
3. Align our ETF/EMF data model with Blockbench’s cube/bone abstractions so importing Blockbench projects or referencing their exporters becomes easier.

Implementing the above will let Weaverbird’s viewer honor mod-driven variants, matching the in-game experience while remaining in a TypeScript/Three.js stack.
