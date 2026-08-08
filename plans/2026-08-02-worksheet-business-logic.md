# Plan: Worksheet business logic — layered calculation architecture

## Status (2026-08-02) — Phases 1–7 landed, 8–9 partially

**Working end-to-end**: inputs drive a live estimate through all four layers; verified in
a real browser (typing $9,000 recomputed combined income, shares, obligation, credit and
the headline figure). `npm run build`, `npm run lint`, **44 unit tests** and **13 e2e
tests** all pass.

### Material deviation from the original plan — current law, not 2024 law

The plan targeted the 2024 statute (93-overnight cliff, 1.50 shared-care multiplier).
Both are **repealed**:

- The CRS 2024 PDF cited in CLAUDE.md **does not contain the schedule** — §14-10-115(7)(b)
  literally reads `Insert PDF file -- 2019 -- 2nd version effective July 1, 2020 -- Contact
  pub team for WP file`. Same on public.law. That "authoritative source" cannot supply it.
- **HB 25-1159, effective 2026-03-01**, replaced the framework: it eliminated the
  93-overnight cliff and the 1.50 multiplier in favour of a continuous parenting-time
  credit table, raised the income cap $30k → $40k, and redefined the self-support reserve.

Implementing the plan as written would have shipped a calculator that is wrong under
current Colorado law, so the engine implements **HB 25-1159**. The data-driven rule set
absorbed the change without an architectural change — which is the design working.

**Data provenance:** the signed act PDF is a pure scan (zero extractable text); the *Final
Act* version is text-based. Both tables were transcribed programmatically from it (never
hand-entered, never from memory) and the generator asserts invariants before emitting:

- Schedule: **800 rows**, $50–$40,000 in uniform $50 steps, 1–6 children; strictly
  increasing income, monotonic across both axes, no duplicates.
- Parenting-time credit: **367 entries**, 0–365 complete, strictly increasing 0 %→100 %,
  including the fractional **182.5 → 50.00 %** midpoint row.

### Engine correction found by a test

Because credit percentages sum to 100 % of the basic obligation and income shares sum to
100 %, the two parents' basic obligations always sum to **zero** — so the statute's legacy
"parent owing the greater amount owes the difference" wording double-counts, and the
sole-care cap then flattened the curve, hiding the credit below ~127 overnights. The
transfer is the **payer's own obligation**, which is the only reading satisfying all three
boundary cases (sole care = payer's income share; even split with equal incomes = 0; every
overnight reduces support). Fixed and covered by tests.

### Done
- **Phase 1** — deps (zustand, zod, vitest, @testing-library/*, jsdom); Vitest wired in
  `vite.config.ts` (excludes `e2e/`) + `src/test/setup.ts`; `test`/`test:watch` scripts at
  both levels; **`strict: true` enabled** (it was missing despite both CLAUDE.md files
  claiming otherwise — zero pre-existing errors); `parseUsd`/`parseCount` in `lib/format.ts`.
- **Phase 2** — `types/rules.ts` (statute contract), `types/support.ts` (domain I/O);
  fixtures promoted to the real shapes.
- **Phase 3** — `services/rules/`: async port, Zod schema (trust boundary, with structural
  refinements that caught real extraction bugs), static adapter with vintage selection +
  caching, inert MCP adapter, `createRulesRepository` factory.
- **Phase 4** — `services/rules/data/co/2026.json` (173 KB), every statutory value carrying
  a citation, plus a `source` block recording provenance.
- **Phase 5** — `domain/support/`: `income`, `schedule` (interpolating), `parentingTime`,
  `lowIncome` (reserve as a minimum-wage formula), `rounding`, `calculateChildSupport`.
  Pure — imports no React, no services, no I/O; total (incomplete input → flagged estimate).
- **Phase 6** — Zustand `worksheetStore` with the repository **injected** into `loadRules`
  (fakes in tests, no module mocking); `useRules`, `useSupportEstimate` (the single seam
  where state meets the engine), `useNumericField` (draft-based, no effect).
- **Phase 7** — `WorksheetPage` now renders rows from `rules.incomeLines`/`addOnLines`
  instead of hardcoded literals; `WorksheetFields` bind to the store; `NumberStepper`
  wired + bounded + exposed as a spinbutton; `ParentingTimeBar` percentage bug fixed
  (now of the parenting year, showing a gap instead of silently normalising);
  Recap/Review/Results read from the store; rail is an `aria-live` region; inputs set
  `aria-invalid`.
- **Phase 9 (partial)** — 44 unit tests (engine incl. cliff/boundary/low-income/ceiling
  cases, schema rejection paths, store incl. failure + in-flight guard, format round-trips)
  and 13 e2e tests (live recalculation, no-cliff monotonicity, stepper bounds, cross-step
  agreement, invalid input) — all passing.

### Also done (Phases 8–9 completed)
- **Phase 8 — step gating.** `useWorksheetStatus` derives per-step `StepStatus` and
  dispatches the previously-unused `SET_STATUS`; `canAdvance` / `canGoTo` gates live in
  `stepFlowReducer` (where its comments reserved them); `AppHeader` chips disable for
  unreachable steps and show a completion dot. Warnings are **non-blocking** by design —
  surfaced inline rather than trapping the user.
- **Engine warnings surfaced** in the worksheet via the previously-unused `FieldError`.
- **Breakdown consolidated** into one `EstimateBreakdown`; the rail's props collapsed from
  nine pre-formatted strings to a single `estimate`, removing the drift risk.
- **Docs** — `apps/web/CLAUDE.md` (layered architecture + dependency rule, statute-data
  rules, Vitest conventions, updated directory strategy), root `CLAUDE.md` (stack, commands,
  Current status, roadmap, and a **rewritten Domain & business rules** section recording
  that the CRS PDF omits the schedule and that HB 25-1159 controls), README (scripts,
  testing, roadmap, Legal basis + an estimate-not-legal-advice note).
- **Accuracy cross-check passed.** Independently published 2026 Colorado guidance gives
  $10,000 combined AGI / two children → **$2,001** and a self-support reserve of
  **$1,831.83**; the shipped rule set reproduces both exactly, and the reserve *formula*
  (29 hrs × minimum wage × 50 weeks ÷ 12) matches the statutory definition. Pinned as a
  regression test.

### Second bug found during this phase
Wiring `setStepStatus` into an effect exposed an infinite render loop ("Maximum update depth
exceeded") — `StepFlowProvider` rebuilt its action callbacks every render. **All 13 e2e tests
still passed**; only the browser console showed it. Fixed with `useCallback` on the actions
and covered by `StepFlowProvider.test.tsx`, which asserts callback identity stability.

### Final verification
`npm run test` **54 unit tests**, `npm run test:e2e` **13 e2e tests**, `npm run lint` and
`npm run build` — all pass. Visually confirmed live recalculation, the Results page, and
**zero horizontal overflow at 390px**.

### Not done (deliberately out of scope)
- Spousal maintenance; real MCP/RAG calls; additional jurisdictions; Print/Export PDF
  (still presentational); persistence.

---

## Context

The worksheet, review, and results screens are **pixel-faithful but entirely static**: every
input value in `WorksheetPage.tsx` is a hardcoded literal, all three pages read
`SAMPLE_WORKSHEET`/`SAMPLE_ESTIMATE` at module scope, and there is **zero async, zero state
wiring, and no calculation** anywhere in `src/`. This lands the real business logic for the
main app flow — child support under **C.R.S. §14-10-115**.

The architecture must satisfy four standing constraints from the request:

1. **Separation of concerns** across component → hook → business layer → dedicated API layer.
2. **Futureproof the API layer** for a one-day remote call to an **MCP server for RAG** —
   so the data-access seam is async and adapter-based from day one, even though today's
   adapter reads bundled local data.
3. **The business layer sources statute information from a decoupled data store** — "how to
   calculate support" and any changing statutory values are **configurable data, not code**.
4. **Multi-state ready** — jurisdiction is a parameter of the data, not a branch in the engine.

Decisions taken: **full statutory schedule** (court-accurate, not a placeholder), **Zustand**
for worksheet state, **Zod** for validation, **child support only** (maintenance stays ⬜).

## Architecture

Four layers with a strict one-way dependency rule:

```
components/  (presentational, props + store selectors)
     ↓
hooks/ + store/  (React glue: Zustand state, async orchestration, memoized derivation)
     ↓
domain/support/  ← PURE. No React, no services, no I/O. (input, ruleSet) => estimate
     ↑ (data only)
services/rules/  (API layer: repository port + swappable adapters)
```

**The engine never imports the repository.** The repository yields a `SupportRuleSet` (plain
data); the hook feeds it to the pure engine. That single seam is what makes the engine
unit-testable, the statute swappable, and a remote MCP source a drop-in adapter.

> **Deviation from `apps/web/CLAUDE.md`:** its directory strategy puts `services/` *inside* a
> feature. The rules repository is deliberately **app-level** (`src/services/rules/`) because
> it is not worksheet-specific — spousal maintenance and other jurisdictions will consume the
> same port. `src/domain/` is likewise new and app-level. I'll update `apps/web/CLAUDE.md` to
> document both in the same change.

## Phase 1 — Foundations

- **Deps** (`apps/web`): `zustand`, `zod`; dev: `vitest`, `@vitest/coverage-v8`,
  `@testing-library/react`, `@testing-library/user-event`, `jsdom`.
- **`vite.config.ts`** — add a `test` block (`environment: 'jsdom'`, `globals: true`,
  `setupFiles`, and `exclude: ['e2e/**']` so Vitest never picks up Playwright specs).
- **Scripts** — `"test": "vitest run"`, `"test:watch": "vitest"` in `apps/web/package.json`,
  plus root passthroughs (`-w @support-calculator/web`) matching the existing convention.
- **`tsconfig.app.json`** — add **`"strict": true`**. It is currently **absent** despite both
  CLAUDE.md files claiming it's required; a money-calculating layer must not ship without
  `strictNullChecks`. Expect a small number of pre-existing errors to fix. Also add
  `"vitest/globals"` to `types`.
- **`src/lib/format.ts`** — add the missing parse half (the codebase has formatters but **no
  string→number parser**, while inputs already carry comma-bearing strings like `"4,800"`):
  - `parseUsd(raw: string): number | null` — strips `$`, commas, whitespace, the Unicode minus
    (U+2212) that `formatUsd` emits; returns `null` on non-numeric so the caller renders an error.
  - `parseCount(raw: string): number | null` — non-negative integers.
  - Keep `formatUsd`/`formatPercent` as-is; they remain the display boundary.

## Phase 2 — Domain types (`src/types/`)

Per the standing note in `src/mocks/supportFixtures.ts` ("when the real domain types land in
`src/types/support.ts`, move the shapes below there"), promote and sharpen the fixture types.

- **`src/types/support.ts`** — `WorksheetInput` (party names, `childrenCount`, income keyed by
  **stable line id**, `parentingTime`, add-ons keyed by id), plus `SupportEstimate` with a
  full `breakdown`. Today's rows are keyed only by `label`, which doubles as React key *and*
  identity — every line gains a stable `id`.
- **`src/types/rules.ts`** — the statute data contract: `SupportRuleSet`, `LineItemSpec`,
  `ObligationSchedule`, `SharedCareRule`, `LowIncomeRule`, `Citation`, `Jurisdiction`.
- Keep `src/types/common.ts` (`Party = 'a' | 'b'`) as-is and reuse it throughout.
- **No enums** — `erasableSyntaxOnly: true` forbids them. Use `as const` objects + union types
  (the existing `Step`/`StepStatus` idiom). All type imports must be `import type` under
  `verbatimModuleSyntax`.

## Phase 3 — The API layer (`src/services/rules/`)

This is the futureproofing seam. **Async from day one** so swapping in MCP/RAG later changes
no call sites.

- **`rulesRepository.ts`** — the **port**:
  ```ts
  export type RuleSetQuery = { jurisdiction: string; effectiveOn?: string }
  export type RulesRepository = { getRuleSet(q: RuleSetQuery): Promise<SupportRuleSet> }
  ```
- **`ruleSetSchema.ts`** — the **Zod** schema for `SupportRuleSet` + `parseRuleSet(raw: unknown)`.
  This is the trust boundary: bundled JSON is validated the same way a remote MCP payload
  would be, so the untrusted-source path is exercised from day one. Errors throw with the
  failing path, following the `config/appConfig.ts` idiom (descriptive, quotes the bad value).
- **`staticRulesRepository.ts`** — adapter over bundled JSON in `data/`. Async signature,
  validates via `parseRuleSet`, caches per jurisdiction.
- **`mcpRulesRepository.ts`** — a documented **stub adapter** implementing the same port,
  sketching the future RAG call and throwing a clear "not yet configured" error. It exists to
  prove the port is genuinely swappable and to hold the design notes.
- **`createRulesRepository.ts`** — factory selecting the adapter (static today; env/config
  later, mirroring `loadAppConfig`'s pure `(env) => typed` shape).
- **`data/co/2024.json`** — the Colorado rule set (Phase 4).

## Phase 4 — Statute data (`src/services/rules/data/co/2024.json`)

**All statutory values live here, none in TypeScript.** Shape:

```jsonc
{
  "schemaVersion": 1,
  "jurisdiction": { "code": "CO", "name": "Colorado" },
  "effective": { "from": "2024-01-01" },
  "citations": { "primary": "C.R.S. §14-10-115", "schedule": "C.R.S. §14-10-115(7)(b)" },
  "period": "monthly",
  "incomeLines": [ { "id": "gross", "label": "Gross monthly income", "hint": "…", "sign": "add" }, … ],
  "addOnLines": [ { "id": "childcare", "label": "Work-related childcare", "citation": "…" }, … ],
  "schedule": { "maxChildren": 6, "rows": [ { "combinedIncome": 1100, "obligations": [ … ] }, … ] },
  "sharedCare": { "overnightThreshold": 93, "multiplier": 1.5, "citation": "…" },
  "lowIncome": { … },
  "rounding": { "mode": "nearest", "unit": 1 }
}
```

Driving `incomeLines`/`addOnLines` from data (not JSX literals) solves the missing-ids problem
**and** the multi-state requirement in one move — another state's rule set declares different
line items and the form re-renders itself. Every statutory value carries a `citation`, which
satisfies CLAUDE.md's "cite the statute" rule and lets Results render real provenance.

> **Accuracy commitment.** The schedule is **transcribed from the authoritative source**, not
> invented: the CRS Title 14 (2024) PDF already linked in CLAUDE.md
> (`content.leg.colorado.gov/.../crs2024-title-14.pdf`), cross-checked against published
> Colorado worksheet examples. This is a tool real pro se parties may rely on — **if any part
> of the schedule cannot be transcribed with confidence, I will stop and flag it rather than
> approximate.** Provisional values, if any are unavoidable, get an explicit
> `"provisional": true` marker surfaced in the UI.

## Phase 5 — The engine (`src/domain/support/`) — pure, framework-free

`calculateChildSupport(input: WorksheetInput, rules: SupportRuleSet): SupportEstimate`,
composed of small tested units:

- **`income.ts`** — per-party adjusted gross income (applying each `incomeLine`'s `sign`),
  combined income, and income shares.
- **`basicObligation.ts`** — schedule lookup by combined income × children, with documented
  bracket handling (interpolation/step per the statute) and above-ceiling / below-floor rules.
- **`parentingTime.ts`** — classify **sole vs shared physical care** at the data-driven
  `overnightThreshold` (93 in CO), and compute the shared-care adjustment using the
  `multiplier` (1.5) and overnight shares.
- **`addOns.ts`** — apportion each add-on line by income share.
- **`lowIncome.ts`** — self-support reserve / minimum-order adjustment.
- **`rounding.ts`** — money rounding per `rules.rounding`.

The orchestrator returns a `breakdown` whose fields **match what the UI already renders**
(`combinedIncome`, `shareA`, `shareB`, `basicObligation`, `parentingAdjustment`, `addOns`,
`netTotal`, `payer`, `recipient`) so the rail/review/results need no shape churn — plus
per-step citations. The engine is **total**: it returns a typed result for incomplete input
rather than throwing, so the UI can show a partial estimate while the user types.

## Phase 6 — State + hooks

- **`src/features/worksheet/store/worksheetStore.ts`** — Zustand store: `input`, `ruleSet`,
  `status: 'idle'|'loading'|'ready'|'error'`, field actions (`setIncome(lineId, party, value)`,
  `setChildrenCount`, `setNights`, `setAddOn`, `setPartyName`, `reset`), and an async
  `loadRules(repo)`. **The repository is passed in** (defaulting to the app singleton) so tests
  inject a fake without module mocking. Seed defaults from `SAMPLE_WORKSHEET`.
- **`hooks/useSupportEstimate.ts`** — selects `input` + `ruleSet`, calls the pure engine inside
  `useMemo`. This is the *only* place the two meet.
- **`hooks/useWorksheetField.ts`** — binds a field: current string value, `onChange`, parse via
  `parseUsd`/`parseCount`, and per-field error state.
- Store lives in `src/features/worksheet/`; only its hooks are exported from the feature's
  `index.ts`, preserving the feature's clean public API.

## Phase 7 — Component wiring

- **`WorksheetPage.tsx`** — the biggest change: stop hardcoding literals; `.map()` over
  `ruleSet.incomeLines` / `addOnLines` and bind each input to the store. `CurrencyInput` and
  `NumberInput` already spread props, so they become controlled **with no component changes**.
- **`NumberStepper.tsx`** — currently inert (`value: ReactNode`, unpassed handlers). Wire
  `onIncrement`/`onDecrement` and add `min`/`max` so `childrenCount` can't go below 1 or past
  `schedule.maxChildren`.
- **`FieldRow.tsx`** — add label↔input association (`htmlFor`/`id` or `aria-labelledby`) and an
  error slot; today the label is a plain `<div>` with no association and there's nowhere to put
  the already-built-but-unused `FieldError`.
- **`WorksheetRecap` / `ReviewPage` / `ResultsPage`** — replace module-scope fixture reads with
  store/hook reads.
- **`ParentingTimeBar.tsx`** — fix the latent bug: it computes percentages of *nights entered*,
  not of 365, so they diverge the moment input doesn't sum to 365. Drive from the year length
  and surface a validation error when nights ≠ 365.
- **Consolidate the duplicated breakdown** — `ResultsRail`'s breakdown and `ResultsPage`'s "How
  this was calculated" are near-verbatim duplicates, each with its own identical local `Row`
  helper, and the rail takes pre-formatted strings while the page takes raw numbers. Extract
  one `EstimateBreakdown` component taking the estimate object; format at that boundary.

## Phase 8 — Validation + step gating

Use the **`SET_STATUS` seam that already exists and has zero callers**. Per-step validity
(derived from the store) dispatches `setStepStatus`, and `stepFlowReducer` gains the
`canAdvance` gate its own comments reserve for it ("future gates … belong here, not in the
components"). `AppHeader` currently lets you jump to any step ignoring `status` — respect it.

## Phase 9 — Tests

**Unit (Vitest)** — colocated `*.test.ts`:
- `domain/support/*.test.ts` — each unit, plus **golden end-to-end cases** for the orchestrator:
  sole care, shared care just under/over the 93-overnight threshold (boundary), equal incomes,
  zero income, above schedule ceiling, low-income adjustment, and 1→6 children. Golden expected
  values come from published Colorado worksheet examples, cited in the test.
- `services/rules/*.test.ts` — Zod schema accepts the real rule set, rejects malformed payloads
  (the untrusted-MCP-payload path), and the static adapter caches.
- `store/worksheetStore.test.ts` — actions produce expected state; `loadRules` with an injected
  fake repository covers ready/error paths.
- `hooks/*.test.ts` via `renderHook`; `lib/format.test.ts` for parse/format round-trips.

**e2e (Playwright)** — new `e2e/calculation.spec.ts`, keeping the existing **role/accessible-name
locator strategy (no test ids)** used by `e2e/flow.spec.ts`:
- Typing an income updates the rail estimate live.
- Crossing the 93-overnight boundary changes the estimate (shared-care formula engages).
- Changing children count changes the basic obligation.
- Worksheet → Review → Results show **consistent** figures for the same input.
- Invalid input surfaces a field error and blocks advancing.

## Verification

1. `npm run test` — all Vitest suites pass, including the cited golden cases.
2. `npm run build` — `tsc -b` passes **with `strict: true` newly enabled**.
3. `npm run lint` — clean.
4. `npm run test:e2e` — flow + calculation specs pass.
5. Manual: `npm run dev`, change income/overnights/children and confirm the rail updates live
   and Review/Results agree; verify at a 390px viewport that no horizontal overflow returns.
6. Spot-check the engine against a published Colorado worksheet example end-to-end in the UI.

## Out of scope
- **Spousal maintenance** — stays ⬜; the rule-set contract leaves room for it.
- **Real MCP/RAG calls** — the adapter is a documented stub; no network code ships.
- **Additional states** — only CO data ships; the contract is what makes others additive.
- **Persistence** (save/load worksheets), PDF export (the button stays presentational),
  and TanStack Query (unnecessary until a real remote source exists).

## Docs to update in the same change
- `apps/web/CLAUDE.md` — the new `src/domain/` + `src/services/` layers and the documented
  deviation from feature-scoped `services/`; move Vitest from "not installed" to installed.
- Root `CLAUDE.md` — move Zustand/Zod/Vitest into **Installed now**, add the `test` script,
  update **Current status** and flip the roadmap rows (calculation engine, state wiring).
- `README.md` — keep the roadmap snapshot in sync.
