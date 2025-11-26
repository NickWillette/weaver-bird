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
