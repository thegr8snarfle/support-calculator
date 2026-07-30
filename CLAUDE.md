# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project overview

`support-calculator` is a web UI for calculating **family support in the State of
Colorado** — child support and spousal maintenance (alimony). The audience spans both
self-represented (pro se) parties and family-law practitioners, so clarity and
trustworthiness of the calculation matter as much as the math itself.

The app is a single-page React application. The design system and a static child-support
worksheet are built; calculation logic and state wiring are not yet in place (see
**Current status** and the **Feature roadmap**).

### Installed now
- **React 19.2** (`react` / `react-dom`)
- **TypeScript ~6** (strict, project-references via `tsconfig.app.json` / `tsconfig.node.json`)
- **Vite 8** with `@vitejs/plugin-react` (Rolldown-based bundler)
- **Tailwind CSS v4** (`@tailwindcss/vite`, CSS-configured — no `tailwind.config.js`)
- **ESLint 10** (flat config in `eslint.config.js`) with `typescript-eslint`,
  `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
- Self-hosted variable fonts via `@fontsource-variable` (Bricolage Grotesque + Public Sans)
- **Playwright** (`@playwright/test`) — e2e smoke tests under `e2e/` (see **Testing**)

### Intended / target stack (not yet installed — add as features need it)
- **State:** Zustand (global UI state), TanStack Query (server state) — once the app talks
  to a backend or needs cross-view state.
- **Components:** shadcn/ui (Radix-based) may be introduced under `src/components/ui/`
  alongside the hand-built Columbine primitives; new shared atoms can follow the shadcn
  pattern. Existing Columbine primitives are custom, not shadcn.
- **Forms & validation:** Zod + React Hook Form — for the worksheet's input/validation layer.
- **Testing:** Vitest — for the calculation engine and component/unit tests (Playwright, for
  e2e, is already installed — see **Installed now**).

> Keep this list honest: when you install one of the "intended" tools, move it up to
> **Installed now** in the same change.

## Commands

- `npm run dev` — start the Vite dev server with HMR
- `npm run build` — type-check and build (`tsc -b && vite build`)
- `npm run lint` — run ESLint over the project
- `npm run preview` — preview the production build locally
- `npm run test:e2e` — run the Playwright e2e smoke suite (auto-starts the dev server)
- `npm run test` — run Vitest _(pending: Vitest not installed / no `test` script yet)_
- `rm -rf dist node_modules` — clean build output and dependencies

## Configuration

Build/deploy settings are **env-driven**, not hardcoded in `vite.config.ts`:

- **`.env`** (committed default) / **`.env.local`** (gitignored per-machine override, via the
  `*.local` rule) supply the vars; **`.env.template`** documents them.
- **`config/appConfig.ts`** is the typed config layer: it exports the `AppConfig` type and a
  pure `loadAppConfig(env)` that parses + validates env into config. This is Node/build-side
  (root `config/`, type-checked via `tsconfig.node.json`), **not** under `src/`.
- **`vite.config.ts`** calls `loadEnv(mode, cwd, '')` → `loadAppConfig(env)` and feeds it into
  Vite. Today the only setting is **`APP_PORT`** (default `3000`), driving the dev + preview
  server port. Add new settings to `AppConfig` + `loadAppConfig` and read them here.
- `APP_PORT` is non-`VITE_`-prefixed, so it stays build-side and is **never** exposed to the
  client bundle. (Client-visible vars would use the `VITE_` prefix.)

## Testing

- **e2e (Playwright):** `e2e/*.spec.ts`, config in `playwright.config.ts`. `npm run test:e2e`
  starts the dev server (port 5190) itself and drives the guided flow in a real browser.
  It uses the **installed Google Chrome** (`channel: 'chrome'`) to avoid downloading a
  Chromium binary; for a hermetic CI run, drop the channel and `npx playwright install chromium`.
  Keep e2e specs a thin smoke layer (view transitions, key affordances) — not exhaustive.
- **Unit (Vitest):** not installed yet; earmarked for the calculation engine and component
  tests. Add it when that logic lands, then update this section and the tech-stack list.

## Conventions

### Components
- **Always use functional components.** No class components.
- Declare them as named function declarations: `export function Name() { … }` (not
  `const Name = () => …`).
- Use hooks for state and effects; prefer small, composable components.
- Prefer React 19 primitives for interactivity: `useActionState` for form submission/logic
  and `useOptimistic` for immediate UI feedback.

### Styling
- **Use TailwindCSS with declarative utility classes directly in templates.** Do not write
  one-off custom stylesheets.
- **Mobile-first:** author the base (unprefixed) styles for small screens and layer
  breakpoints upward. Use `@container` container queries for component-level responsiveness.
- **If a stylesheet is genuinely unavoidable, use CSS Modules** (`*.module.css`). Rolldown
  can inline CSS Modules more easily than global stylesheets.
- **Avoid `@apply`** in CSS — reserve it for genuinely unavoidable third-party overrides.
- Avoid inline `style={{...}}` objects except for truly dynamic, computed values.

### TypeScript / React
- Prefer explicit types on component props and public function signatures.
- **Always prefer `type` aliases over `interface`s** (including for component props), unless
  declaration merging is genuinely required. _(This project-specific rule intentionally
  overrides the common "interface for props" convention — do not switch props to
  `interface`.)_
- **`strict: true`** is required in `tsconfig`. **No `any`** — use `unknown` + narrowing,
  generics, or a precise type instead.
- **Type organization:**
  - Shared/domain types live in a top-level `src/types/` directory, split into modules by
    domain or use — e.g. `src/types/common.ts`, and future modules like `src/types/support.ts`
    for calculation-domain types. Import shared types from there.
  - **Component-only types and view models** (a component's own prop type, local view state,
    presentational helpers) may stay in the `.tsx` module that contains the component — don't
    push single-component types into `src/types/`.
- Keep business logic (support calculations) separate from presentational components so it
  can be unit-tested independently.

### Directory strategy
As the app grows beyond the worksheet, organize by **feature**:

- `src/features/[feature-name]/`
  - `components/` — feature-specific UI
  - `hooks/` — feature business logic (colocated, not in a global hooks dir)
  - `services/` — API / TanStack Query logic
  - `index.ts` — the feature's clean public API (import features via their `index.ts`)
- `src/components/ui/` — shared atomic components (the Columbine primitives; shadcn atoms
  may join here).
- `src/types/` — shared/domain types (see **Type organization** above); this takes
  precedence over colocating shared domain types inside a feature.

> The worksheet feature lives at `src/features/worksheet/` — its UI under `components/`,
> its public API in `index.ts`. Add `hooks/` and `services/` there as real logic lands.

## Git & safety rules

- **Work on a new branch per task.** At the start of a new session or task, **ask** before
  creating one, then branch off the default branch. Name the branch from the task
  description in kebab-case, optionally with a type prefix — e.g. `feat/child-support-worksheet`,
  `design/columbine-theme`, `fix/overnights-validation`.
- **NEVER auto-commit and push branches.**
- **NEVER commit or push code to the remote unless explicitly told to.** This includes
  `git commit`, `git push`, and publishing/creating remote branches — all require explicit
  permission each time.
- Make and stage changes locally; wait for an explicit instruction before any `git commit`,
  `git push`, or branch publishing.

## Known constraints & gotchas

- **Images:** always set `loading="lazy"` and explicit `width`/`height` (or an aspect-ratio
  box) to avoid layout shift.
- **Tailwind `@apply`:** avoid it in CSS files unless absolutely necessary for third-party
  overrides — prefer utilities in the template.
- **Type safety:** `strict: true` and no `any` (see TypeScript conventions).
- **Accessibility & motion:** meet the quality floor — responsive to mobile, visible
  keyboard focus (use the `focus-ring` helper), and respect `prefers-reduced-motion`.

## Agent instructions (Claude-specific)

- **Planning:** for multi-file or architectural changes, start in **Plan Mode** and get the
  plan approved before editing.
- **Refactoring:** before editing a component, consider whether it should be broken out into
  `src/features/[feature-name]/` per the **Directory strategy**.
- **Session status:** at the end of a session, update the **Feature roadmap & status** table
  below (and the README snapshot) to reflect what landed — that table is the single source of
  progress; don't create a separate status file.
- **Honesty:** keep this doc accurate. If you change the stack, structure, or status, update
  the relevant section in the same change rather than leaving stale claims.

## Domain & business rules

The calculator implements Colorado family-support law. Authoritative sources for the
business rules:

- Colorado child support guide: https://divorce.law/guides/child-support-calculator/colorado/
- C.R.S. Title 14 (2024), Domestic Matters:
  https://content.leg.colorado.gov/sites/default/files/images/olls/crs2024-title-14.pdf

When implementing or changing calculation logic, cite the specific statute/guideline the
logic is based on so it can be verified.

## Design

- Target aesthetic: **modern, guided, "TaxCaster-like"** — clean, one-thing-at-a-time flow,
  generous whitespace, inline contextual help. Approachable for pro se users while remaining
  precise for practitioners.
- `mockups/` holds the established **"Columbine" design system**: `theme.css` is the token
  source of truth (CSS variables, light in `:root` + dark under `[data-theme="dark"]`),
  `STYLEGUIDE.md` documents the palette/type/components, and the PNGs are the reference
  mockups (worksheet flow) rendered from `mockups/src/*.html`. Build UI to match these; the
  tokens are designed to map 1:1 onto a future Tailwind `@theme` block.

## Current status

- **Tailwind v4 is installed** and CSS-configured (`@tailwindcss/vite`, no config files);
  Columbine tokens live in `src/index.css` and are exposed to utilities via `@theme inline`.
- The Vite starter has been **replaced**: `src/App.tsx` renders the app shell (`AppHeader`
  + `WorksheetPage`); the reusable UI primitives live in `src/components/ui/`.
- The **child-support worksheet is built as a pixel-faithful static mockup** —
  presentational components taking props, hardcoded example values, a UI-only light/dark
  theme toggle. **No Colorado support-calculation logic and no state wiring exist yet.**
- The **Review step is built as static UI** (`src/features/worksheet/components/ReviewPage.tsx`):
  a read-only, grouped recap of the worksheet — one card per section with an Edit link, a
  compact estimate echo, and Back / See-full-results buttons. No mockup existed for it, so
  it was designed in the Columbine language. It reuses the worksheet's `Card` / `FieldRow` /
  `PartyHeader` / `ParentingTimeBar`.
- The **Results step is built as static UI** (`src/features/worksheet/components/ResultsPage.tsx`):
  a standalone, printable summary — hero estimate, an expanded "how this was calculated"
  breakdown (reusing the results-rail vocabulary), and a read-only recap of every input. No
  mockup existed, so it was designed in the Columbine language. The Review and Results recaps
  share one `WorksheetRecap` component; the read-only `RecapCard` / `RecapValue` primitives
  live in `src/components/ui/`. The "Print / Export PDF" button is presentational for now.
- **Shared static data lives in `src/mocks/`** — a typed mock-fixture repository
  (`SAMPLE_WORKSHEET` / `SAMPLE_ESTIMATE`) that the worksheet, review, and results all read
  from, so their numbers can't drift. It's shaped as domain-ish objects of plain numbers
  (formatting via `src/lib/format.ts`) so the future calculation engine and its unit tests
  can consume the same fixtures.
- **Guided-flow navigation is wired** (`src/features/navigation/`): a custom, reducer-backed
  `useStepFlow()` hook (Context provider at the app root) drives Worksheet → Review → Results — the
  header stepper chips, the rail's "Review full worksheet" button, and Review's Back / Edit
  links all navigate; each Edit jumps back and scrolls to that worksheet section. Per-step
  `status` is modeled as a seam for future validation, but this is **view switching only —
  no calculation or input state yet.** All three chips are now live; Review's "See full
  results" advances to the Results step.
- Design foundation is done: the "Columbine" theme, worksheet mockups, and style guide live
  in `mockups/` (see the Design section).

## Feature roadmap & status

Track feature progress here and **update this table as work lands** (keep the README
snapshot in sync). Each feature has three stages: **Mockup** (design exists in `mockups/`),
**Static UI** (presentational React components, no logic), and **Logic** (state wiring +
calculation). Legend: ✅ done · 🎨 mockup only · ⬜ not started · — n/a.

| Feature | Mockup | Static UI | Logic |
| --- | :---: | :---: | :---: |
| Columbine design system & theme (tokens, dark mode) | ✅ | ✅ | — |
| Reusable UI component library (`src/components/ui/`) | ✅ | ✅ | — |
| App shell (`AppHeader`, guided-step nav, theme toggle) | ✅ | ✅ | ✅ |
| Child-support worksheet — children count | ✅ | ✅ | ⬜ |
| Child-support worksheet — monthly income (both parties) | ✅ | ✅ | ⬜ |
| Child-support worksheet — parenting time + balance bar | ✅ | ✅ | ⬜ |
| Child-support worksheet — monthly shared costs | ✅ | ✅ | ⬜ |
| Results rail (sticky estimate breakdown) | ✅ | ✅ | ⬜ |
| Review step (grouped recap, per-section Edit links) | ⬜ | ✅ | ⬜ |
| Detailed results / printable summary (Results step) | ⬜ | ✅ | ⬜ |
| Spousal maintenance (alimony) flow | ⬜ | ⬜ | ⬜ |
| Support-calculation engine (`C.R.S. §14-10-115`) | ⬜ | — | ⬜ |
| State wiring / live-updating estimate | ⬜ | ⬜ | ⬜ |

When you complete a stage, flip the cell to ✅ (or 🎨 when only a mockup is added), add a
row for any new feature, and cite the statute/guideline for anything under **Logic**.
