# Weaverbird - Minecraft Resource Pack Manager

## Project Overview

Desktop app built with **Tauri v2** + **React 19** + **TypeScript** that manages Minecraft resource packs with drag-and-drop priority ordering and asset-level override control.

**Tech Stack:**
- Frontend: React 19 + TypeScript + Zustand + Immer
- Backend: Rust (Tauri v2 commands)
- Build: Vite 7
- Styling: SCSS Modules + CSS Variables + modern CSS 2025 features (`@scope`, cascade layers, `:has()`, view transitions)

## Architecture

### Directory Structure
```
src/
├── components/          # Feature components
│   ├── PackList/       # Drag-drop pack ordering (needs browse button)
│   ├── SearchBar/      # Asset search
│   ├── AssetResults/   # Filtered assets
│   ├── VariantChooser/ # Pack selection per asset
│   ├── Preview3D/      # 3D texture preview (Three.js)
│   ├── OutputSettings/ # Output dir picker (HAS browse button)
│   └── SaveBar/        # Build & export
├── routes/main.tsx     # Main layout (orchestrates all components)
├── state/              # Zustand store + selectors
│   ├── store.ts        # State + actions (with Immer)
│   ├── selectors.ts    # Memoized selectors
│   └── types.ts        # Type definitions
└── lib/tauri.ts        # Tauri command wrappers

src-tauri/src/
├── commands/packs.rs   # Command implementations
├── validation.rs       # Centralized validation
├── error.rs           # Structured AppError type
└── util/
    ├── pack_scanner.rs
    ├── asset_indexer.rs
    ├── weaver_nest.rs
    └── mc_paths.rs
```

### State Management (Zustand)

**Location:** `src/state/store.ts`

**State Structure:**
```typescript
{
  packs: Record<PackId, PackMeta>
  packOrder: PackId[]
  assets: Record<AssetId, AssetRecord>
  providersByAsset: Record<AssetId, PackId[]>
  overrides: Record<AssetId, OverrideEntry>
  selectedAssetId?: AssetId
  searchQuery: string
  outputDir?: string
  packFormat: number
  progress?: { phase, completed, total, bytes }
}
```

**Key Actions:**
- `ingestPacks(packs)` - Load pack metadata
- `ingestAssets(assets)` - Load asset data
- `ingestProviders(assetId, providerIds)` - Map assets to packs
- `setPackOrder(order)` - Update priority
- `setOverride(assetId, packId)` - Asset-level override
- `setOutputDir(path)` - Set export directory

**Always use selectors** from `src/state/selectors.ts` (e.g., `useSelectSetOutputDir()`, `useSelectPacksInOrder()`) for performance.

### Tauri Commands

**Available Commands:** (`src/lib/tauri.ts`)
```typescript
scanPacksFolder(path: string): Promise<ScanResult>
buildWeaverNest(request: BuildRequest): Promise<string>
getDefaultPacksDir(): Promise<string>
openFolderDialog(defaultPath?: string): Promise<string | null>
```

**Backend:** (`src-tauri/src/commands/packs.rs`)
- Implementations use `AppError` for structured errors
- Validation centralized in `src-tauri/src/validation.rs`
- Returns JSON-serializable types

## Key Features & Implementation Status

### ✅ Completed
- Drag-and-drop pack reordering (@dnd-kit)
- Asset search and filtering
- 3D texture preview (Three.js)
- Asset-level pack selection (overrides)
- Output directory picker with browse button
- Build/export functionality
- Structured error handling (AppError)

### 🚧 Needs Implementation
**Resource Pack Loading (Primary Task):**
- Add browse button to `PackList` component
- Allow users to select custom packs directory
- Currently auto-loads from default Minecraft directory only

## Code Patterns

### Adding Browse Button to PackList

**1. Update Component** (`src/components/PackList/index.tsx`):
```typescript
interface Props {
  packs: PackItem[]
  onReorder: (order: string[]) => void
  onBrowsePacks?: () => void  // Add this
}

export default function PackList({ packs, onReorder, onBrowsePacks }: Props) {
  return (
    <div className={s.root}>
      <div className={s.headerWithButton}>
        <h2>Resource Packs</h2>
        {onBrowsePacks && <button onClick={onBrowsePacks}>Browse</button>}
      </div>
      {/* rest of component */}
    </div>
  )
}
```

**2. Implement Handler** (`src/routes/main.tsx`):
```typescript
const handleBrowsePacks = useCallback(async () => {
  const selected = await openFolderDialog()
  if (!selected) return

  try {
    const result = await scanPacksFolder(selected)
    ingestPacks(result.packs)
    ingestAssets(result.assets)
    
    // Ingest providers
    for (const [assetId, providerIds] of Object.entries(result.providers)) {
      ingestProviders(assetId, providerIds as string[])
    }
    
    setPackOrder(result.packs.map(p => p.id))
    setSuccessMessage('Packs loaded successfully!')
  } catch (error) {
    setErrorMessage(formatError(error))
  }
}, [ingestPacks, ingestAssets, ingestProviders, setPackOrder])

// Pass to component
<PackList packs={packListItems} onReorder={handleReorder} onBrowsePacks={handleBrowsePacks} />
```

### Error Handling Pattern

**Backend:**
```rust
// Use AppError with codes
AppError::validation("Pack ID is empty")?
AppError::scan("Failed to read pack")?.with_details(path)
```

**Frontend:**
```typescript
try {
  await scanPacksFolder(path)
} catch (error) {
  const msg = formatError(error)  // Handles AppError and generic errors
  displayError(msg)
}
```

### Stable Callbacks
```typescript
const handleClick = useCallback(() => {
  // action
}, [dependency1, dependency2])  // Only dependencies
```

## Styling System

**Global Variables:** `src/app.css`
```css
--color-primary, --color-success, --color-danger
--spacing-xs through --spacing-2xl
--font-size-sm through --font-size-2xl
```

**Component Styles:** SCSS Modules
```typescript
import s from './styles.module.scss'
<div className={s.root}>...</div>
```

## UI Component Guidelines

- Start with the anti-design docs in `src/ui`: `README.md` (tokens), `ANTI_DESIGN_GUIDE.md` (visual language + latest 2025 CSS patterns), and `SHADCN_INTEGRATION_GUIDE.md` (porting accessible primitives).
- Author concise React components under `src/ui/components/**`, keeping props minimal and colocating behavior-specific hooks.
- SCSS modules should `@use "@/ui/tokens"` and opt into CSS 2025 updates (anchor positioning, `:has()`, `@scope`, cascade layers, view transitions) where they keep the implementation expressive.
- Every component ships with a Storybook story (e.g., `ComponentName.stories.tsx`) so tokens, states, and accessibility affordances stay documented.

## Development

```bash
npm run dev          # Start with hot reload
npm run build        # Build desktop app
npm run type-check   # TypeScript validation
npm run lint         # ESLint
cargo check          # Rust validation (in src-tauri/)
```

## Key Files Reference

```
Frontend:
- src/routes/main.tsx              # Main orchestrator
- src/components/PackList/         # Needs browse button
- src/components/OutputSettings/   # Has browse button (reference)
- src/state/store.ts               # State management
- src/lib/tauri.ts                 # Tauri bridge

Backend:
- src-tauri/src/commands/packs.rs  # Command implementations
- src-tauri/src/validation.rs      # Input validation
- src-tauri/src/error.rs           # Error types
```

## Important Notes

- **No UI Framework:** Custom components with CSS variables
- **Performance:** Always use selectors from `src/state/selectors.ts`
- **Immutability:** Zustand store uses Immer middleware
- **Type Safety:** Structured `AppError` instead of strings
- **Validation:** Centralized in `validation.rs` module
- **Testing:** Commands are testable (plain functions in library)

## Current Task

Add browse button to `PackList` component to allow custom resource pack directory selection. Reference `OutputSettings` component for browse button pattern.
