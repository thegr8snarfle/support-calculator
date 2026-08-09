# CLAUDE.md — apps/web

Code-level guidance for Claude Code when working inside the `@support-calculator/web`
workspace (`apps/web/`): component patterns, styling rules, TypeScript conventions, directory
structure, testing conventions, and the design system. This file governs `src/`, `config/`,
`e2e/`, `vite.config.ts`, and `eslint.config.js`.

For the monorepo overview, commands, git/safety rules, domain/business rules, and the feature
roadmap, see the **root `CLAUDE.md`** (`../../CLAUDE.md`) — those apply repo-wide and are not
duplicated here.

## Component patterns

- **Always use functional components.** No class components.
- Declare them as named function declarations: `export function Name() { … }` (not
  `const Name = () => …`).
- Use hooks for state and effects; prefer small, composable components.
- Prefer React 19 primitives for interactivity: `useActionState` for form submission/logic
  and `useOptimistic` for immediate UI feedback.

## Styling

- **Use TailwindCSS with declarative utility classes directly in templates.** Do not write
  one-off custom stylesheets.
- **Mobile-first:** author the base (unprefixed) styles for small screens and layer
  breakpoints upward. Use `@container` container queries for component-level responsiveness.
- **If a stylesheet is genuinely unavoidable, use CSS Modules** (`*.module.css`). Rolldown
  can inline CSS Modules more easily than global stylesheets.
- **Avoid `@apply`** in CSS — reserve it for genuinely unavoidable third-party overrides.
- Avoid inline `style={{...}}` objects except for truly dynamic, computed values.
- **Shared layout primitives** (e.g. the two-party worksheet grid in
  `src/components/ui/grid.ts`) should use fluid tracks (`minmax(0, …)`) rather than bare
  fixed-`px` columns, so they don't force horizontal overflow on narrow viewports.

## TypeScript / React

- **Always** Prefer explicit types on component props and function signatures, including arrow functions.
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

## Layered architecture (calculation flow)

The support calculation is split into four layers with a **strict one-way dependency rule**.
Keep it that way — it is what makes the engine testable and the statute swappable.

```
components/           presentational; props + store selectors
      ↓
hooks/ + store/       React glue: Zustand state, async orchestration, memoized derivation
      ↓
src/domain/support/   PURE. No React, no services, no I/O. (input, ruleSet) => estimate
      ↑ (data only)
src/services/rules/   API layer: repository port + swappable adapters
```

- **`src/domain/support/`** — the calculation engine. It must never import React, the
  services layer, or perform I/O, and it must contain **no statutory constants**: every
  threshold, rate, and table arrives as data on the `SupportRuleSet`. It is *total* —
  incomplete input returns a flagged estimate rather than throwing, so the UI can show a
  partial figure while the user types.
- **`src/services/rules/`** — the data layer. Consumers depend on the `RulesRepository`
  **port** and the `createRulesRepository` factory, never on a concrete adapter. The port is
  **async by design** even though today's adapter reads bundled JSON, so pointing the app at
  a remote MCP/RAG statute source later changes no call sites. Every payload — bundled or
  remote — goes through `parseRuleSet` (Zod), the app's trust boundary.
- **`useSupportEstimate`** is the single seam where state meets the engine. Don't call
  `calculateChildSupport` anywhere else, and don't cache derived totals in the store.

> **Deviation from the directory strategy below:** `services/` normally lives *inside* a
> feature, but the rules repository is app-level because it is not worksheet-specific —
> spousal maintenance and other jurisdictions will consume the same port. `src/domain/` is
> likewise app-level and framework-free.

### Add-on credits

A shared cost (`WorksheetInput.addOns`) carries **who pays it** alongside the amount, as one
`AddOnEntry` rather than a parallel `addOnPaidBy` map — two maps keyed by the same line id
desync. `paidBy` absent means shared.

- **Pooled obligation, full credit.** An attributed line stays in the pool and both parents
  still owe their income share of it; the parent who carries the bill is credited the **full**
  monthly amount off their transfer (`C.R.S. §14-10-115(9)–(10)`). $2,000 on a 60/40 split with
  a $250 premium carried by the payer → a $950 transfer, so their total outlay is still $1,200.
  A pro-rata credit would be wrong and is the easy mistake to make here.
- **Unattributed means "carried by the recipient"** — the assumption the engine always made
  implicitly, now named. Direction is decided from `basicNet` *before* add-ons enter, which is
  what keeps "the recipient" non-circular and means attribution can never flip who pays whom.
- **Credits apply after the caps.** The caps limit the *obligation*; the credit is money
  already paid against it. Reversing the order lets the cap swallow the credit and charges the
  payer twice.
- **Floored at $0, with the excess named in a warning.** The direction of payment never
  reverses. The discarded overage is exactly what gets litigated, so `Math.max(0, net)` alone
  would hide it.
- **Attribution raises an advisory warning, not a `ValidationError`.** It needs documentation
  and agreement, which is not something the user can fix by editing a field — gating
  progression on it would be a dead end. Only "a payer named on a $0 line" blocks.

### Validation

Worksheet input is validated by `src/domain/support/validate.ts` — pure, framework-free, and
sitting beside the engine as its gate.

- **Surfaced, never silently corrected.** Do not clamp a user's entry to a legal value. A
  clamped field and the estimate disagree with nothing on screen saying so; that was the
  original overnights bug. The store keeps exactly what was typed and validation reports it.
- **Bounds come from the rule set**, never from constants — `rules.yearNights`,
  `rules.schedule.maxChildren`. Same discipline as the engine.
- **Errors block; warnings don't.** `ValidationError` has no severity field: everything it
  returns stops the flow (`canAdvance` requires status `'complete'`). Informative but still
  calculable conditions belong on `SupportEstimate.warnings` instead, so each concept has one
  home and no consumer filters by severity.
- **`validateWorksheet` is called in exactly one place** — `ValidationProvider` — and read
  everywhere else via `useValidation()`. It runs on every keystroke with many readers, so one
  provider means one computation per input change. Don't add a second call site.
- **Invalid input never reaches the engine.** `useSupportEstimate` returns the *last valid*
  estimate with `stale: true` instead of recalculating, and the UI must mark a stale figure
  visibly. The engine is total — it returns a number for almost anything — so calling it on
  nonsense input is exactly how 365/365 produced a confident $0.

State ownership, which is where the original bug actually lived:

| Tier | Holds |
| --- | --- |
| `worksheetStore` | raw input + rule set; **no derived figures** |
| Derived in render | `errors` / `fieldErrors` (context), `estimate`, `stale` |
| Component state | `useNumericField`'s draft string, and nothing else |

A field can be invalid two ways at once (unparseable draft *and* a validation error); the
**parse error wins**, since you cannot range-check what you cannot parse.

### Preferences & persistence

User preferences persist between sessions via `src/services/preferences/` (port + adapters,
mirroring `services/rules`) and `src/features/preferences/` (store, `ThemeProvider`,
`useTheme`). The theme is the only tenant today.

- **Preferences are UI choices, not user data.** Worksheet input — income, overnights,
  children — is deliberately **not** persisted. A shared laptop should not silently retain
  someone's finances. Persisting it is a product decision needing a visible "clear my data"
  affordance, not a field added to `Preferences`.
- **Storage is a trust boundary.** `localStorage` is user-editable, so every read goes
  through `parsePreferences` (Zod) and falls back to defaults — same discipline as
  `parseRuleSet`. A `version` literal means a future shape is *rejected*, not misread.
- **Storage must never break the app.** Touching `localStorage` throws when site data is
  blocked; `setItem` throws on quota (Safari private mode does both). Every access is
  wrapped, and `createPreferencesRepository()` falls back to in-memory, so callers never
  branch on availability. Storage is injected as a parameter — inject a fake in tests, don't
  mock the module.
- **`preferencesStore` is separate from `worksheetStore`** so `reset()` cannot clear the
  user's theme along with their input.
- **Two owners of `data-theme`.** `public/theme-init.js` sets it before first paint;
  `ThemeProvider` owns it from the first render on. The boot script must stay a **classic,
  non-deferred, external** script: `type="module"` or `defer` runs it after first paint and
  silently reintroduces the flash, and an inline script is blocked by the Tauri CSP
  (`default-src 'self'`, no `script-src`). It cannot import from the bundle, so it duplicates
  the storage key and resolution rule — `preferencesContract.test.ts` pins them together.
- **`'system'` is a live deferral, not a stored color.** It resolves against `matchMedia` and
  keeps following the OS while selected. Only `'light' | 'dark'` are ever written to
  `data-theme`.

Under Tauri this needs no plugin, no Rust, and no CSP change. Two behaviours to expect
rather than fix: dev (`http://localhost:3000`) and production (`tauri://localhost`) are
different origins with separate storage, and the WKWebView store is keyed to the bundle
`identifier`, so changing it resets preferences.

### Statute data

Statutory values live in `src/services/rules/data/<jurisdiction>/<year>.json`, not in code —
including *which* income and add-on lines the worksheet renders. Adding a state or reacting
to an amendment is a data change. Each rule set carries `effective.from`, per-rule
`citation`s, and a `source` block recording provenance.

**Never hand-enter or recall statutory tables from memory.** The Colorado schedule (800 rows)
and parenting-time credit table (367 entries) were transcribed programmatically from the
enrolled bill text, with invariants (monotonicity, completeness, uniform steps) asserted
before the JSON was emitted. Those same invariants are re-checked by the Zod schema at load.

## Directory strategy

As the app grows beyond the worksheet, organize by **feature**:

- `src/features/[feature-name]/`
  - `components/` — feature-specific UI
  - `hooks/` — feature business logic (colocated, not in a global hooks dir)
  - `store/` — feature state (Zustand)
  - `services/` — feature-specific API logic
  - `index.ts` — the feature's clean public API (import features via their `index.ts`)
- `src/components/ui/` — shared atomic components (the Columbine primitives; shadcn atoms
  may join here).
- `src/domain/` — pure, framework-free business logic (the calculation engine).
- `src/services/` — app-level data access shared across features (the rules repository).
- `src/types/` — shared/domain types (see **Type organization** above); this takes
  precedence over colocating shared domain types inside a feature.

> The worksheet feature lives at `src/features/worksheet/` — its UI under `components/`,
> its public API in `index.ts`. Add `hooks/` and `services/` there as real logic lands.

**Before editing a component**, consider whether it should be broken out into
`src/features/[feature-name]/` per this strategy.

## Testing conventions

- **e2e (Playwright):** `e2e/*.spec.ts`, config in `playwright.config.ts`. `npm run test:e2e`
  starts the dev server (port 5190) itself and drives the guided flow in a real browser.
  It uses the **installed Google Chrome** (`channel: 'chrome'`) to avoid downloading a
  Chromium binary; for a hermetic CI run, drop the channel and `npx playwright install chromium`.
  Keep e2e specs a thin smoke layer (view transitions, key affordances) — not exhaustive.
- **Unit (Vitest):** `npm run test` (`test:watch` for watch mode). Config lives in the `test`
  block of `vite.config.ts` (jsdom, globals, `src/test/setup.ts`, and an `e2e/**` exclude so
  Vitest never picks up Playwright specs). Specs are colocated as `*.test.ts(x)`.
  - **Engine tests run against the real shipped rule set**, not a toy fixture, so a bad
    statute transcription fails there. Cover boundaries explicitly: sole care, even split,
    child-count limits, low-income bands, and above the schedule ceiling.
  - The store's `loadRules` takes the repository as an argument, so inject a fake — **do not
    mock modules** to test the data layer.
  - When a bug is only visible in the browser console (e.g. a render loop that still lets
    every assertion pass), add a unit test that pins the invariant — see
    `StepFlowProvider.test.tsx`.

## Design system (Columbine)

- Target aesthetic: **modern, guided, "TaxCaster-like"** — clean, one-thing-at-a-time flow,
  generous whitespace, inline contextual help. Approachable for pro se users while remaining
  precise for practitioners.
- `mockups/` (repo root) holds the established **"Columbine" design system**: `theme.css` is
  the token source of truth (CSS variables, light in `:root` + dark under
  `[data-theme="dark"]`), `STYLEGUIDE.md` documents the palette/type/components, and the PNGs
  are the reference mockups (worksheet flow) rendered from `mockups/src/*.html`. Build UI to
  match these; the tokens map 1:1 onto the Tailwind `@theme inline` block in `src/index.css`.

## Known constraints & gotchas

- **Images:** always set `loading="lazy"` and explicit `width`/`height` (or an aspect-ratio
  box) to avoid layout shift.
- **Tailwind `@apply`:** avoid it in CSS files unless absolutely necessary for third-party
  overrides — prefer utilities in the template.
- **Type safety:** `strict: true` and no `any` (see TypeScript conventions above).
- **Accessibility & motion:** meet the quality floor — responsive to mobile, visible
  keyboard focus (use the `focus-ring` helper), and respect `prefers-reduced-motion`.
- **Mobile viewport width:** the shared party grid + card/main padding can stack up on narrow
  phones (~390px) if fixed-`px` tracks or non-responsive padding are reintroduced — verify any
  layout change at a 390px width with no horizontal scroll.
