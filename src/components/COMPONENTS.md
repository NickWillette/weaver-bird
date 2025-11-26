# Component Documentation

## AssetResults

**Purpose**: Displays paginated asset cards with lazy loading

**useEffects**:

- Progressive rendering batching: triggers on `renderCount`, `assets.length` changes
- Reset render count: triggers on `assets` change
- Asset grouping worker: triggers on `assets`, `getWinningPackForAsset` changes

**Utilities** (from `utilities.ts`):

- `getWinningPack`: determines winning pack for asset
- `generateDisplayName`: formats names for special assets  
- `needsGrassTint`: checks if asset needs grass tinting
- `needsFoliageTint`: checks if asset needs foliage tinting

**Usage Count**: 1 usage in `src/routes/main.tsx`

**Child Components**:

- `AssetCard`: renders individual asset card with 3D preview

---

## BiomeColorCard

**Purpose**: Interactive colormap selector for biome tinting

**useEffects**:

- Load colormap texture: triggers on `selectedSource`, `packs` changes
- Draw canvas & extract imageData: triggers on `colormapSrc` change

**Utilities** (from `utilities.ts`):

- `sampleColor`: samples RGB color from coordinates
- `groupHotspotsByCoordinate`: deduplicates biome hotspots
- `buildSourceOptions`: creates available colormap sources list
- `selectActiveSource`: determines active colormap source

**Usage Count**: 3 usages (`src/routes/main.tsx` x2, `src/components/Settings/ColormapSettings.tsx` x1)

**Child Components**:

- `ColorSourceDropdown`: pack/variant selector dropdown
- `BiomeHotspot`: individual biome coordinate marker
