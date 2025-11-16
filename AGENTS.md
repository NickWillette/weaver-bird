# Repository Guidelines

## Project Structure & Module Organization
`src/` houses the React 19 + TypeScript UI: `components/` for features (PackList, Preview3D, SaveBar), `routes/main.tsx` orchestrates layout, `state/` stores Zustand logic, and `lib/tauri.ts` wraps desktop commands. Rust code, validation, and config sit in `src-tauri/src/` beside `tauri.conf.json`. Keep specs in `docs/` + `BLOCK_RENDERING_DESIGN.md`, sample packs in `__mocks__/resourcepacks`, and only commit build output under `dist/` when requested.

## Build, Test, and Development Commands
- `npm run dev` starts the full Tauri stack with auto-reload.
- `npm run vite-build` creates a browser bundle; `npm run build` produces the desktop app and compiles Rust in `src-tauri/`.
- `npm run preview` serves `dist/` locally.
- `npm run lint`, `npm run type-check`, and `npm run storybook` must pass before sharing work.
- `npm run test` runs Vitest suites (add `--runInBand` if needed).
- `./test-backend.sh` verifies the compiled Rust binary with the mock packs.

## Coding Style & Naming Conventions
Use the ESLint flat config (`eslint.config.js`). Default to 2-space indentation, `const`, destructuring, template strings, and arrow components. Keep TypeScript strict; prefer typed selectors/hooks in `state/` and colocate component-specific hooks with their owners. Components use `PascalCase.tsx`, utilities `camelCase.ts`, and SCSS modules `styles.module.scss`. Run `npm run lint` before pushing; no Prettier is wired, so avoid sweeping whitespace edits.

### UI Component Authoring
- Reference the anti-design docs in `src/ui`: start with `README.md` for tokens, then dig into `ANTI_DESIGN_GUIDE.md` for broader patterns, and `SHADCN_INTEGRATION_GUIDE.md` when adapting third-party primitives.
- Build styling with SCSS modules that `@use "@/ui/tokens"` and lean into CSS 2025 features (cascade layers, `@scope`, `:has()`, anchor positioning, view-transitions) to keep implementations modern yet concise.
- Keep component code + styles tight: colocate hooks, limit props to essentials, and document nuanced patterns in Storybook rather than inline comments.
- Every new UI component ships with a `.stories.tsx` file under `src/ui/components/**` so reviewers can verify design tokens + states quickly.

## Testing Guidelines
Place `*.test.ts`/`*.test.tsx` next to sources (see `src/lib/three/modelConverter.test.ts`). Use Vitest with React Testing Library for UI and `@react-three/test-renderer` for 3D scenes. Pull fixtures from `__mocks__/resourcepacks`, target new selectors, Zustand actions, and backend commands, and run `npm run test -- --coverage` for reports. When Rust code changes, rebuild (`npm run build`) then execute `./test-backend.sh` to scan the mock packs.

## Commit & Pull Request Guidelines
Because the provided snapshot lacks Git history, follow Conventional Commits (`feat: add pack browser`, `fix: guard texture loader`) with ≤72-character summaries and issue references (`Closes #123`). Each PR must explain the behavior change, list validation commands (`dev`, `lint`, `test`, backend script), link the issue/task, and attach UI media when visuals shift. Keep scope tight and tag both frontend and Rust reviewers for cross-layer work.

## Security & Configuration Tips
Use Node 24 from `.nvmrc` to match the Vite/Tauri toolchain. Route filesystem/dialog access through Tauri commands instead of the browser runtime. Update `tauri.conf.json` alongside Rust validation changes, and keep `src-tauri/target/` plus OS artifacts out of commits.
