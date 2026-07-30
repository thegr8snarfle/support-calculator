# support-calculator

A web app for estimating **family support in the State of Colorado** — child support
and spousal maintenance (alimony) — for both self-represented (pro se) parties and
family-law practitioners.

The goal is a modern, guided, "TaxCaster-like" experience: one thing at a time, generous
whitespace, and inline contextual help, while staying precise enough for professionals to
trust the math.

> ⚠️ **Estimates only.** This tool implements Colorado's statutory guidelines but is not
> legal advice, does not file anything, and does not save your data. Courts may deviate
> from the guideline. See [Legal basis](#legal-basis).

## Status

Early development. The **Columbine design system** and the **child-support worksheet**
exist as a pixel-faithful, static UI (presentational components with hardcoded example
values). No calculation logic or state wiring is implemented yet — see the
[Roadmap](#roadmap).

## Tech stack

- **React 19.2** + **TypeScript ~6** (strict, project references)
- **Vite 8** (Rolldown) with `@vitejs/plugin-react`
- **Tailwind CSS v4** (CSS-configured via `@tailwindcss/vite`; tokens mapped with
  `@theme inline`)
- **ESLint 10** (flat config)
- **Playwright** for e2e smoke tests
- Self-hosted variable fonts via `@fontsource-variable` (Bricolage Grotesque + Public Sans)

## Getting started

```bash
npm install
npm run dev        # start the Vite dev server with HMR
```

Other scripts:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server with HMR |
| `npm run build` | Type-check and build (`tsc -b && vite build`) |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint over the project |
| `npm run test:e2e` | Run the Playwright e2e smoke suite (auto-starts the dev server) |

## Project structure

```
src/
  components/
    ui/          Reusable design-system primitives (Card, Button, inputs, field rows…)
  features/
    worksheet/   Worksheet feature — components/ (AppHeader, WorksheetPage, ReviewPage,
                 ResultsPage, ResultsRail, WorksheetRecap, ParentingTimeBar,
                 SupportCitation), sections.ts, and index.ts (public API)
    navigation/  Guided-flow state — reducer model (stepFlow.ts) + useStepFlow() hook /
                 StepFlowProvider driving Worksheet → Review → Results
  types/         Shared/domain types, split by domain (e.g. common.ts)
  mocks/         Mock-fixture repository (SAMPLE_WORKSHEET / SAMPLE_ESTIMATE) — the shared
                 static example data, and future unit-test fixtures
  lib/           Small helpers (e.g. cn classname joiner, format.ts currency helpers)
  index.css      Tailwind import + Columbine tokens (:root / [data-theme="dark"])
  main.tsx       Font imports + app bootstrap
config/          Build/deploy config — appConfig.ts (AppConfig type + loadAppConfig)
e2e/             Playwright smoke tests (flow.spec.ts)
mockups/         "Columbine" design system: theme.css (token source of truth),
                 STYLEGUIDE.md, and reference PNGs rendered from mockups/src/*.html
design_inspiration/  Reference material (legacy forms, official CO worksheet PDF)
public/          Static assets (favicon)
.env             Build config defaults (APP_PORT); .env.local overrides (gitignored)
```

## Configuration

Build settings are env-driven. `.env` (committed) supplies defaults — currently just
`APP_PORT` (the dev/preview server port, default `3000`); copy `.env.template` and override
per-machine in `.env.local` (gitignored). Values are parsed and typed by `config/appConfig.ts`
(`AppConfig` / `loadAppConfig`) and consumed in `vite.config.ts`.

## Testing

A small **Playwright** e2e suite (`e2e/`) smoke-tests the guided flow — that it loads on the
Worksheet, navigates Worksheet → Review → Results, that Edit links jump back to their section,
and that the stepper chips switch views. Run it with `npm run test:e2e`; Playwright
starts the dev server itself and uses your installed Google Chrome (`channel: 'chrome'`).
Unit tests (Vitest, for the calculation engine) are not set up yet.

## Design system — "Columbine"

The visual language is grounded in Colorado: columbine indigo/periwinkle primary,
sandstone/sunset accent, slate neutrals. Light and dark themes flip at runtime via
`data-theme` on `<html>`.

- **Token source of truth:** `mockups/theme.css`
- **Spec & component catalog:** `mockups/STYLEGUIDE.md`
- **Reference mockups:** `mockups/worksheet-{light,dark}.png`, `mockups/styleguide.png`

A **semantic party-color rule** runs through the whole UI: **Parent A is always primary
(indigo)** and **Parent B is always accent (sandstone)** — in income columns, the
parenting-time bar, and the income-share split.

## Roadmap

Feature status is tracked in **[CLAUDE.md](./CLAUDE.md#feature-roadmap--status)** and
updated as work lands. Snapshot:

| Feature | Mockup | Static UI | Logic |
| --- | :---: | :---: | :---: |
| Columbine design system & theme | ✅ | ✅ | — |
| Reusable UI component library | ✅ | ✅ | — |
| Child-support worksheet (income, parenting time, shared costs) | ✅ | ✅ | ⬜ |
| Results rail (estimate breakdown) | ✅ | ✅ | ⬜ |
| Review step (grouped recap, Edit links) | ⬜ | ✅ | ⬜ |
| Guided-flow navigation (Worksheet → Review → Results, `useStepFlow`) | — | ✅ | ✅ |
| Detailed results / printable summary (Results step) | ⬜ | ✅ | ⬜ |
| Spousal maintenance (alimony) flow | ⬜ | ⬜ | ⬜ |
| Support-calculation engine (C.R.S. §14-10-115) | ⬜ | — | ⬜ |
| State wiring / live-updating estimate | ⬜ | ⬜ | ⬜ |

✅ done · 🎨 mockup only · ⬜ not started · — n/a

## Legal basis

Calculation logic follows Colorado family-support law. When implementing or changing it,
the specific statute/guideline is cited so it can be verified.

- Colorado child support guide — https://divorce.law/guides/child-support-calculator/colorado/
- C.R.S. Title 14 (2024), Domestic Matters —
  https://content.leg.colorado.gov/sites/default/files/images/olls/crs2024-title-14.pdf

## Contributing

See [CLAUDE.md](./CLAUDE.md) for conventions (functional components, Tailwind utilities,
`type` over `interface`, type organization) and the git/safety workflow (branch per task;
never commit or push without explicit permission).
