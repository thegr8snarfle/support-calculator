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

## Project structure

```
src/
  components/
    ui/          Reusable design-system primitives (Card, Button, inputs, field rows…)
  features/
    worksheet/   Worksheet feature — components/ (AppHeader, WorksheetPage, ResultsRail,
                 ParentingTimeBar) and index.ts (public API)
  types/         Shared/domain types, split by domain (e.g. common.ts)
  lib/           Small helpers (e.g. cn classname joiner)
  index.css      Tailwind import + Columbine tokens (:root / [data-theme="dark"])
  main.tsx       Font imports + app bootstrap
mockups/         "Columbine" design system: theme.css (token source of truth),
                 STYLEGUIDE.md, and reference PNGs rendered from mockups/src/*.html
design_inspiration/  Reference material (legacy forms, official CO worksheet PDF)
public/          Static assets (favicon)
```

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
| Review step | ⬜ | ⬜ | ⬜ |
| Detailed results / printable summary | ⬜ | ⬜ | ⬜ |
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
