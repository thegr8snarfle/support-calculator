# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project overview

`support-calculator` is a web UI for calculating **family support in the State of
Colorado** — child support and spousal maintenance (alimony). The audience spans both
self-represented (pro se) parties and family-law practitioners, so clarity and
trustworthiness of the calculation matter as much as the math itself.

The app is a single-page React application. It is currently the **default Vite starter**
(`src/App.tsx` is still the splash screen) and has not yet been built out.

## Tech stack

- **React 19.2** (`react` / `react-dom`)
- **TypeScript ~6** (strict, project-references via `tsconfig.app.json` / `tsconfig.node.json`)
- **Vite 8** with `@vitejs/plugin-react` (Rolldown-based bundler)
- **ESLint 10** (flat config in `eslint.config.js`) with `typescript-eslint`,
  `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`

## Commands

- `npm run dev` — start the Vite dev server with HMR
- `npm run build` — type-check and build (`tsc -b && vite build`)
- `npm run lint` — run ESLint over the project
- `npm run preview` — preview the production build locally

## Conventions

### Components
- **Always use functional components.** No class components.
- Use hooks for state and effects; prefer small, composable components.

### Styling
- **Use TailwindCSS with declarative utility classes directly in templates.** Do not write
  one-off custom stylesheets.
- **If a stylesheet is genuinely unavoidable, use CSS Modules** (`*.module.css`). Rolldown
  can inline CSS Modules more easily than global stylesheets.
- Avoid inline `style={{...}}` objects except for truly dynamic, computed values.

> Note: Tailwind is **not installed yet** — it is the intended standard for this project.
> Adding and configuring Tailwind (v4 + Vite plugin) is a separate, future task.

### TypeScript / React
- Prefer explicit types on component props and public function signatures.
- Keep business logic (support calculations) separate from presentational components so it
  can be unit-tested independently.

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
- `design_inspiration/` contains reference material: legacy Family Law Software forms
  (dense, functional CO child-support/maintenance data entry), the official CO Child Support
  Worksheet PDF, and modern web references. Use these to inform field coverage and layout.
- `mockups/` holds the established **"Columbine" design system**: `theme.css` is the token
  source of truth (CSS variables, light in `:root` + dark under `[data-theme="dark"]`),
  `STYLEGUIDE.md` documents the palette/type/components, and the PNGs are the reference
  mockups (worksheet flow) rendered from `mockups/src/*.html`. Build UI to match these; the
  tokens are designed to map 1:1 onto a future Tailwind `@theme` block.

## Current status

- App code is still the unmodified Vite + React + TypeScript starter (`src/App.tsx`).
- Tailwind is not yet installed.
- No support-calculation logic or domain UI exists yet.
- Design foundation is done: the "Columbine" theme, worksheet mockups, and style guide live
  in `mockups/` (see the Design section).
