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

> **Monorepo (npm workspaces).** The repo is a two-package monorepo: the React web app
> lives in **`apps/web/`** and a **Tauri** desktop harness in **`apps/desktop/`**; `mockups/`
> and repo docs stay at the root. **Unless noted, every web-app path in this document
> (`src/…`, `config/…`, `vite.config.ts`, `eslint.config.js`, `e2e/…`) is relative to
> `apps/web/`.** See **Monorepo layout & desktop app** below.

### Installed now
- **React 19.2** (`react` / `react-dom`)
- **TypeScript ~6** (strict, project-references via `tsconfig.app.json` / `tsconfig.node.json`)
- **Vite 8** with `@vitejs/plugin-react` (Rolldown-based bundler)
- **Tailwind CSS v4** (`@tailwindcss/vite`, CSS-configured — no `tailwind.config.js`)
- **ESLint 10** (flat config in `eslint.config.js`) with `typescript-eslint`,
  `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
- Self-hosted variable fonts via `@fontsource-variable` (Bricolage Grotesque + Public Sans)
- **Playwright** (`@playwright/test`) — e2e smoke tests under `e2e/` (see **Testing**)
- **Vitest** — unit tests for the calculation engine, data layer, store and hooks
  (`npm run test`), with `@testing-library/react` + jsdom
- **Zustand** — worksheet input state (`src/features/worksheet/store/`)
- **Zod** — validates statute rule sets at the data-layer trust boundary
- **npm workspaces** — the repo root is a private workspace root (`workspaces: ["apps/*"]`)
  with one lockfile; `apps/web` = `@support-calculator/web`, `apps/desktop` =
  `@support-calculator/desktop`.
- **Tauri v2** (`@tauri-apps/cli`) — the `apps/desktop` harness that wraps the built web app
  as a native desktop app. Requires the **Rust toolchain** to build (see **Monorepo layout &
  desktop app**).

### Intended / target stack (not yet installed — add as features need it)
- **State:** TanStack Query (server state) — once the app actually talks to a backend.
  (Zustand is installed and in use; see **Installed now**.)
- **Components:** shadcn/ui (Radix-based) may be introduced under `src/components/ui/`
  alongside the hand-built Columbine primitives; new shared atoms can follow the shadcn
  pattern. Existing Columbine primitives are custom, not shadcn.
- **Forms:** React Hook Form — if the worksheet's input layer outgrows the current
  store-bound fields. (Zod is installed and used for rule-set validation.)

> Keep this list honest: when you install one of the "intended" tools, move it up to
> **Installed now** in the same change.

## Commands

Run these **from the repo root** — the root `package.json` delegates each to the
`@support-calculator/web` workspace via `npm run <script> -w @support-calculator/web`:

- `npm run dev` — start the Vite dev server with HMR
- `npm run build` — type-check and build (`tsc -b && vite build`)
- `npm run lint` — run ESLint over the project
- `npm run preview` — preview the production build locally
- `npm run test:e2e` — run the Playwright e2e smoke suite (auto-starts the dev server)
- `npm run test` — run the Vitest unit suite (`test:watch` for watch mode)

Desktop (Tauri) — delegate to `@support-calculator/desktop`:

- `npm run desktop:dev` — launch the app in a native window (starts the web dev server via
  Tauri's `beforeDevCommand`, then opens the webview with HMR)
- `npm run desktop:build` — build the web app and bundle a macOS `.app` + `.dmg` into
  `apps/desktop/src-tauri/target/release/bundle/` (`macos/*.app`, `dmg/*.dmg`). The `.dmg` is
  the shareable distributable, built for the **host CPU arch only**; since it's **unsigned /
  un-notarized**, a first launch on another Mac needs the Gatekeeper workaround (right-click →
  Open, or `xattr -dr com.apple.quarantine <app>`). See README → _Distributing the macOS
  build_.

iOS (Tauri) — same harness, delegate to `@support-calculator/desktop`:

- `npm run ios:dev` — compile the Rust lib, boot the **iOS Simulator**, and launch the app
  (starts the web dev server via Tauri; HMR). No Apple account/signing needed for the
  simulator. **Prerequisites:** full **Xcode** + an **iOS Simulator runtime** (install once
  with `xcodebuild -downloadPlatform iOS`), **CocoaPods** (`brew install cocoapods`), and the
  iOS Rust targets (`rustup target add aarch64-apple-ios aarch64-apple-ios-sim x86_64-apple-ios`).
- `npm run ios:build` — `tauri ios build --export-method app-store-connect` → a signed IPA at
  `apps/desktop/src-tauri/gen/apple/build/arm64/<AppName>.ipa`. **Requires** a paid Apple
  Developer account + a signing team (`APPLE_DEVELOPMENT_TEAM` env or `bundle > iOS >
  developmentTeam`). **App Store distribution is scaffolded but deferred** — fastlane lanes
  live in `apps/desktop/src-tauri/gen/apple/fastlane/` (`beta` = TestFlight, `release` = App
  Store), all credentials env-driven so nothing secret is committed. See README → _Run on
  iOS_.

Windows (Tauri) — same harness, delegate to `@support-calculator/desktop`, but **must be run
from an actual Windows machine** (Tauri cannot cross-compile a Windows installer from macOS):

- `npm run windows:dev` — plain `tauri dev`, opens a native window with HMR.
- `npm run windows:build` — plain `tauri build` → bundles `.msi` (WiX) and `.exe` (NSIS)
  installers under `apps/desktop/src-tauri/target/release/bundle/{msi,nsis}/`, using
  `bundle.targets: "all"` and `bundle.windows.webviewInstallMode` (already configured — see
  `tauri.conf.json`), both already in place. **Prerequisites:** the Rust toolchain via rustup
  (the Windows installer's default target, `x86_64-pc-windows-msvc`, is correct out of the
  box), **Microsoft C++ Build Tools** (the "Desktop development with C++" workload — needed for
  `link.exe`, the Rust linker on Windows), and a **WebView2 Runtime** on the dev machine itself
  (preinstalled on modern Windows 10/11 via Windows Update since ~2022; otherwise install
  Microsoft's Evergreen bootstrapper). Tauri auto-downloads the NSIS/WiX bundler tooling on
  first build — no separate installer-tool install step. **Unsigned build** — like the macOS
  `.dmg`, the `.msi`/`.exe` trigger a Windows **SmartScreen** warning on another machine (no
  code-signing certificate yet); see README → _Run on Windows_.

The `dev`/`build` `desktop` scripts are `. "$HOME/.cargo/env" 2>/dev/null; tauri dev|build`
(and `build` additionally sets `CI=true`). Why each piece:

- **`. "$HOME/.cargo/env"`** — puts `~/.cargo/bin` on PATH so `tauri` can find `cargo`, even
  when the invoking terminal never sourced the rustup profile (a shell opened before Rust was
  installed, a minimal `sh`, etc.). It's silenced + non-fatal (`2>/dev/null;` not `&&`), so if
  Rust lives elsewhere the script still falls back to the ambient PATH. Without this you get
  `failed to run 'cargo metadata' … No such file or directory (os error 2)`.
- **`CI=true`** (build only) — makes Tauri's `create-dmg` **skip the Finder/AppleScript
  window-styling step**, which otherwise fails in any non-GUI / automation-restricted context
  (background shells, SSH, CI). The DMG is produced without a custom window layout — fine
  since no DMG background is configured.

(Both are POSIX-shell syntax, which is why `windows:dev`/`windows:build` above are plain
`tauri dev`/`tauri build` with no shell prefix — rustup's Windows installer puts `cargo` on
`PATH` persistently via the registry, so the per-shell env-sourcing workaround doesn't apply
there.)

Housekeeping:

- `npm install` (at root) — installs all workspaces into the single root `node_modules`
- `rm -rf apps/web/dist node_modules apps/desktop/src-tauri/target` — clean build output +
  dependencies

## Monorepo layout & desktop app

The repo is an **npm-workspaces monorepo**:

```
support-calculator/          workspace root (private; workspaces: ["apps/*"]; one lockfile)
  apps/
    web/                     @support-calculator/web — the React app (all src/, config/, e2e/…)
    desktop/                 @support-calculator/desktop — Tauri v2 harness (desktop + iOS)
      src-tauri/             Cargo project: tauri.conf.json, src/{main,lib}.rs, capabilities/, icons/
        gen/apple/           Generated iOS Xcode project (tauri ios init) + fastlane/ (App Store lanes)
  mockups/                   shared Columbine design system / refs (root-level)
  CLAUDE.md  README.md       repo docs (root-level)
```

**Desktop app (Tauri v2).** `apps/desktop` wraps the built web app in the OS-native webview
(WKWebView / WebView2) — tiny installers, no bundled Chromium. It writes **near-zero Rust**:
`src/main.rs`/`lib.rs` are the default entry points; all wiring is in
`apps/desktop/src-tauri/tauri.conf.json`:

- `beforeDevCommand` / `beforeBuildCommand` = `cd ../web && npm run dev|build` (they run from
  `apps/desktop`), and `frontendDist` = `../../web/dist` (relative to `tauri.conf.json`).
- **`devUrl` (`http://localhost:3000`) must match `APP_PORT`.** Keep the default `3000`; if a
  machine overrides `APP_PORT` in `apps/web/.env.local`, update `devUrl` to match.
- A **strict CSP** is set (`default-src 'self'` + inline styles, `data:` images, self fonts) —
  the app self-hosts fonts and makes no network calls. Loosen only if a real asset is blocked.

**Prerequisite:** building the desktop app needs the **Rust toolchain** (`rustc`/`cargo` via
[rustup](https://rustup.rs)) and, on macOS, the Xcode Command Line Tools. Building/running the
**iOS** target additionally needs the full **Xcode** app, an **iOS Simulator runtime**
(`xcodebuild -downloadPlatform iOS`), **CocoaPods** (`brew install cocoapods`), and the iOS
Rust targets (`aarch64-apple-ios`, `aarch64-apple-ios-sim`, `x86_64-apple-ios`). Building the
**Windows** target additionally needs Microsoft C++ Build Tools and a WebView2 Runtime, and
must run on an actual Windows machine — Tauri cannot cross-compile a Windows installer from
macOS. The web workspace needs none of it. **Scope today: local macOS build + iOS Simulator +
local Windows build** — the iOS App Store path (signing, fastlane upload) is **scaffolded but
dormant** pending a paid Apple Developer account; **CI packaging** (any platform) and **code
signing / notarization** for macOS and Windows are deferred (unsigned local macOS builds
trigger a Gatekeeper warning off-machine, unsigned Windows builds trigger a SmartScreen
warning off-machine).

## Configuration

Build/deploy settings are **env-driven**, not hardcoded in `vite.config.ts`:

- **`.env`** (committed default) / **`.env.local`** (gitignored per-machine override, via the
  `*.local` rule) supply the vars; **`.env.template`** documents them.
- **`config/appConfig.ts`** is the typed config layer: it exports the `AppConfig` type and a
  pure `loadAppConfig(env)` that parses + validates env into config. This is Node/build-side
  (`apps/web/config/`, type-checked via `tsconfig.node.json`), **not** under `src/`.
- **`vite.config.ts`** calls `loadEnv(mode, cwd, '')` → `loadAppConfig(env)` and feeds it into
  Vite. Today the only setting is **`APP_PORT`** (default `3000`), driving the dev + preview
  server port. Add new settings to `AppConfig` + `loadAppConfig` and read them here.
- `APP_PORT` is non-`VITE_`-prefixed, so it stays build-side and is **never** exposed to the
  client bundle. (Client-visible vars would use the `VITE_` prefix.)

## Testing

Testing conventions (Playwright e2e, the pending Vitest setup) live in **`apps/web/CLAUDE.md`**.

## Conventions

Component patterns, styling rules, TypeScript conventions, and the feature-directory strategy
for the web app now live in **`apps/web/CLAUDE.md`** — see that file when writing or editing
`apps/web/src/**` code.

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

Web-app-specific gotchas (images/lazy-loading, `@apply`, mobile viewport width, a11y/motion)
now live in **`apps/web/CLAUDE.md`**.

## Agent instructions (Claude-specific)

- **Planning:** for multi-file or architectural changes, start in **Plan Mode** and get the
  plan approved before editing.
- **Plan audit trail:** Do not create plan artifacts unless being explicitly told to do so,
  instead just walk through the planning process in the console. (Plan Mode may auto-create a
  scratch file; when it does and no artifact was asked for, fold the content into the console
  discussion and delete the file.) However, when creating an artifact:
  every plan produced in Plan Mode is saved as its **own file** under
  `plans/`, named `plans/YYYY-MM-DD-<task-slug>.md` (date the plan was written + a kebab-case
  task description, e.g. `plans/2026-08-02-mobile-viewport-overflow-fix.md`). **Never overwrite
  or reuse a previous task's plan file** — `plans/` is an append-only record of what was planned
  and done. If Plan Mode auto-creates a generically named file, rename it to this convention
  before finishing. One plan per task; keep it even after the work lands.
- **Refactoring:** before editing a web component, consult the directory strategy in
  **`apps/web/CLAUDE.md`** for whether it should be broken out into a feature module.
- **Session status:** at the end of a session, update the **Feature roadmap & status** table
  below (and the README snapshot) to reflect what landed — that table is the single source of
  progress; don't create a separate status file.
- **Honesty:** keep this doc accurate. If you change the stack, structure, or status, update
  the relevant section in the same change rather than leaving stale claims.
- **Always** only include a succinct description of changes since the last commit if ever asked
  to commit changes to a branch.
- **Always** comment code paths as they progress, not just function and class level (which should always be typescript
  comments supporting parameter annotations as well). Comment code paths almost obnoxiously, as it helps developers understand
  the code, and also AI agents parase and learn the code.

## Domain & business rules

The calculator implements Colorado family-support law (`C.R.S. §14-10-115`).

**Controlling law: HB 25-1159, effective 2026-03-01.** It replaced the prior framework —
it **eliminated the 93-overnight "cliff"** and the 1.50 shared-care multiplier in favour of
a continuous parenting-time credit table (every overnight earns credit), raised the schedule
ceiling from $30,000 to $40,000 combined monthly AGI, and redefined the self-support reserve
as a formula keyed to the state minimum wage. **Anything describing the 93-night threshold or
the 1.50 multiplier is describing repealed law.**

Sources, with an important caveat:

- **HB 25-1159 Final Act** — https://leg.colorado.gov/bill_files/85404/download — the only
  machine-readable source that actually contains the tables. Use *this* one: the **Signed
  Act** PDF (`/bill_files/40922/download`) is a pure scan with zero extractable text.
- C.R.S. Title 14 (2024): https://content.leg.colorado.gov/sites/default/files/images/olls/crs2024-title-14.pdf
  — **does not contain the schedule.** At §14-10-115(7)(b) it reads literally
  `Insert PDF file -- 2019 -- 2nd version effective July 1, 2020 -- Contact pub team for WP
  file`. The same placeholder appears on public.law. It is still useful for the surrounding
  statutory text, but it cannot supply the numbers.
- Background/plain-English: https://divorce.law/guides/child-support-calculator/colorado/

When implementing or changing calculation logic, cite the specific statute subsection so it
can be verified — the rule-set JSON carries a `citation` per rule for exactly this reason.
**Never transcribe a statutory table by hand or from memory** (see `apps/web/CLAUDE.md` →
_Statute data_).

## Design

The target aesthetic and the "Columbine" design system (tokens, style guide, mockups) are
documented in **`apps/web/CLAUDE.md`**; `mockups/` itself stays at the repo root as shared
reference material.

## Current status

- **The repo is now an npm-workspaces monorepo:** the web app moved verbatim to `apps/web`
  (`@support-calculator/web`) and a **Tauri v2 desktop harness** was added at `apps/desktop`
  (`@support-calculator/desktop`). The desktop app wraps the built web app in the OS-native
  webview; `desktop:dev` / `desktop:build` are wired. **Local macOS build** — CI packaging and
  signing are deferred, and building requires the Rust toolchain. See **Monorepo layout &
  desktop app**.
- **The same harness now targets iOS.** `tauri ios init` generated the Xcode project at
  `apps/desktop/src-tauri/gen/apple/` (tracked in git, with build output gitignored); `ios:dev`
  / `ios:build` are wired, and `vite.config.ts` honors `TAURI_DEV_HOST` for physical-device
  dev. **iOS Simulator runs work today** (no Apple account). The **App Store path is
  scaffolded but dormant**: `bundle > iOS` config, `--export-method app-store-connect` IPA
  output, and env-driven **fastlane** lanes (`gen/apple/fastlane/`, `beta`/`release`) are in
  place, awaiting a paid Apple Developer account + credentials. See **Monorepo layout &
  desktop app** and README → _Run on iOS_.
- **The same harness now also targets Windows.** `tauri.conf.json` gained a
  `bundle.windows.webviewInstallMode` block (`downloadBootstrapper`, Tauri's own default,
  declared explicitly rather than left implicit); `windows:dev` / `windows:build` are wired as
  plain `tauri dev`/`tauri build` (no shell prefix needed — see **Commands**). The Windows
  target needed no new icon assets: `icons/icon.ico` and the full Windows tile/`StoreLogo` PNG
  set were already present from the original `tauri icon` scaffolding, just never activated.
  **Local Windows build only, on an actual Windows machine** — like macOS and iOS before it,
  Tauri cannot cross-compile a Windows installer from macOS, so this session could wire up the
  config/scripts/docs but not build or run the resulting `.msi`/`.exe` itself. No CI was added.
  The build is **unsigned**, same posture as the macOS `.dmg`: it triggers a Windows
  **SmartScreen** warning on another machine, worked around the same way Gatekeeper is (see
  README → _Run on Windows_). Alongside this, the product name was shortened from "Crazy Baby
  Mama Defense System" to **`cbmds`** in `tauri.conf.json`/`Cargo.toml`/`apps/desktop/package.json`
  (it now drives bundle/installer filenames), while the **visible window title** — what the
  title bar/taskbar actually shows — was set separately to "Intelligent Family Support
  Calculator".
- **Tailwind v4 is installed** and CSS-configured (`@tailwindcss/vite`, no config files);
  Columbine tokens live in `src/index.css` and are exposed to utilities via `@theme inline`.
- The Vite starter has been **replaced**: `src/App.tsx` renders the app shell (`AppHeader`
  + `WorksheetPage`); the reusable UI primitives live in `src/components/ui/`.
- **The calculation engine and state wiring are live.** The worksheet is fully interactive:
  every input is bound to a Zustand store and the estimate recalculates as you type, flowing
  through to Review and Results. The layered architecture is
  `components → hooks/store → src/domain/support (pure engine) ← src/services/rules (data)`
  — see `apps/web/CLAUDE.md` → _Layered architecture_.
- **Statute rules are data, not code** (`src/services/rules/data/co/2026.json`): the 800-row
  schedule, the 367-entry parenting-time credit table, low-income bands and the self-support
  reserve formula all live there with per-rule citations, validated by Zod on load. The
  repository port is **async**, so a future MCP/RAG statute source is an adapter swap
  (`mcpRulesRepository` is a documented, inert stub). Adding a state = adding a rule set.
- **The engine implements HB 25-1159 (effective 2026-03-01), not the older framework** — the
  93-overnight cliff and 1.50 multiplier are repealed. See **Domain & business rules**.
- The **Review step is built as static UI** (`src/features/worksheet/components/ReviewPage.tsx`):
  a read-only, grouped recap of the worksheet — one card per section with an Edit link, a
  compact estimate echo, and Back / See-full-results buttons. No mockup existed for it, so
  it was designed in the Columbine language. It reuses the worksheet's `Card` / `FieldRow` /
  `PartyHeader` / `ParentingTimeBar`, and now reads live figures from the store.
- The **Results step is built as static UI** (`src/features/worksheet/components/ResultsPage.tsx`):
  a standalone, printable summary — hero estimate, an expanded "how this was calculated"
  breakdown (reusing the results-rail vocabulary), and a read-only recap of every input. No
  mockup existed, so it was designed in the Columbine language. The Review and Results recaps
  share one `WorksheetRecap` component; the read-only `RecapCard` / `RecapValue` primitives
  live in `src/components/ui/`. The rail and the Results page also share one
  `EstimateBreakdown` component. The "Print / Export PDF" button is presentational for now.
- **`src/mocks/`** now seeds the store's default worksheet and gives the unit tests a shared
  realistic input; the domain types it once carried live in `src/types/support.ts`.
- **Shared costs can be attributed to one parent** (_add-on credits_,
  `C.R.S. §14-10-115(9)–(10)`). Section 4 gains a "Paid by" toggle per line: the cost stays
  pooled and both parents owe their income share, but the parent who carries the bill is
  credited the **full** monthly amount off their transfer. This also fixed a live bug — the
  engine previously added the payer's share of every add-on and never subtracted anything,
  silently assuming the *recipient* paid every bill and charging a payer who carried one
  twice. That assumption is now the explicit, tested meaning of an unattributed line, so
  existing worksheets calculate exactly as before. Credits apply after the statutory caps,
  floor at $0 (the direction of payment never reverses) and surface the excess as a warning.
  See `apps/web/CLAUDE.md` → _Add-on credits_.
- **Worksheet input is validated** (`src/domain/support/validate.ts` + a `ValidationProvider`
  context read via `useValidation()`): invalid entries are surfaced with a red border and an
  alert tooltip plus a summary block, never silently clamped; the estimate **freezes** at its
  last valid value and is visibly marked stale; and `canAdvance` blocks progression until the
  worksheet is clean. Bounds come from the rule set, so validation is jurisdiction-agnostic
  like the engine. See `apps/web/CLAUDE.md` → _Validation_.
- **User preferences persist between sessions** (`src/services/preferences/` port + adapters,
  `src/features/preferences/` store + `ThemeProvider`/`useTheme`). The theme was the first
  tenant: a three-state **Light / Dark / System** toggle defaulting to `system`, so a
  dark-mode machine gets a dark app on first run and can hand control back to the OS.
  `public/theme-init.js` — a **classic, non-deferred** script, because inline script is
  blocked by the Tauri CSP — applies the stored theme before first paint, so there is no
  flash. Storage is a Zod-validated trust boundary that falls back to defaults and never
  throws. **Worksheet input is deliberately not persisted** (shared-computer privacy); see
  `apps/web/CLAUDE.md` → _Preferences & persistence_. Needs no Tauri plugin, Rust, or CSP change.
- **Both parents' names can now be entered on the worksheet** (folded into the first
  "About this case" card, `WorksheetPage.tsx`) and are remembered as the second preferences
  tenant, `parentNames`. Names update the live worksheet on every keystroke and write through
  to `preferencesStore` in the same action, so a returning user isn't retyping them; a
  "Clear saved names" control (shown only once something is saved) wipes the persisted value
  without touching the in-progress worksheet. This is a deliberate, narrow exception to
  "preferences never identify a person" — first names only, never leaves the device — and
  ships with the "clear my data" affordance that exception was already documented as
  requiring. A blank name is now a blocking validation error, like every other worksheet
  field. See `apps/web/CLAUDE.md` → _Preferences & persistence_.
- **Guided-flow navigation is wired** (`src/features/navigation/`): a custom, reducer-backed
  `useStepFlow()` hook (Context provider at the app root) drives Worksheet → Review → Results — the
  header stepper chips, the rail's "Review full worksheet" button, and Review's Back / Edit
  links all navigate; each Edit jumps back and scrolls to that worksheet section. Per-step
  `status` is now driven by the calculation layer (`useWorksheetStatus` → `SET_STATUS`), and
  the reducer gates progression via `canAdvance` / `canGoTo` — steps ahead of an unfinished
  worksheet are unreachable, while warnings (e.g. overnights ≠ 365) are surfaced inline
  rather than blocking.
- **The statute source documents behind the 2026 calculation are now curated and browsable**
  (`src/services/statutes/`, `src/features/statutes/`): the HB 25-1159 Final Act and C.R.S.
  Title 14 (2024) PDFs are downloaded once and bundled at `apps/web/public/statutes/`, so the
  "Statute Library" page (opened from a new header entry point) works fully offline in the
  desktop/iOS build. It lists what each document is, which calculation citations it informs,
  and offers a same-origin download. A read-only `ActiveStatuteBadge` on the worksheet names
  the version currently applied — **not editable yet**. This adds ~2MB to the bundle (was
  ~0.5MB). Deliberately out of scope: switching which statute vintage the worksheet
  calculates with, and explaining what changed between two vintages — both need the
  calculation engine to support a second (pre-2026) methodology first, which it does not yet.
  See `apps/web/CLAUDE.md` → _Statute data_.
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
| Child-support worksheet — children count | ✅ | ✅ | ✅ |
| Child-support worksheet — monthly income (both parties) | ✅ | ✅ | ✅ |
| Child-support worksheet — parenting time + balance bar | ✅ | ✅ | ✅ |
| Child-support worksheet — monthly shared costs | ✅ | ✅ | ✅ |
| Add-on credits (shared cost paid in full by one parent) | ⬜ | ✅ | ✅ |
| Results rail (sticky estimate breakdown) | ✅ | ✅ | ✅ |
| Review step (grouped recap, per-section Edit links) | ⬜ | ✅ | ✅ |
| Detailed results / printable summary (Results step) | ⬜ | ✅ | ✅ |
| Spousal maintenance (alimony) flow | ⬜ | ⬜ | ⬜ |
| Support-calculation engine (`C.R.S. §14-10-115`, HB 25-1159) | ⬜ | — | ✅ |
| Statute data layer (rule sets, Zod validation, MCP-ready port) | — | — | ✅ |
| Statute document library (curated PDFs, download page, worksheet version indicator) | — | ✅ | ✅ |
| Statute version switching (change which vintage the worksheet calculates with) | — | ⬜ | ⬜ |
| Statute version diff (explain what changed between two vintages) | — | ⬜ | ⬜ |
| State wiring / live-updating estimate | ⬜ | ✅ | ✅ |
| Step gating from validation (`canAdvance`) | — | ✅ | ✅ |
| Worksheet input validation (field errors, frozen estimate) | ✅ | ✅ | ✅ |
| Persisted user preferences (storage port, Zod boundary) | — | — | ✅ |
| Theme preference — three-state Light/Dark/System, no flash | ✅ | ✅ | ✅ |
| Parent names (worksheet fields + persisted preference, "Clear saved names") | — | ✅ | ✅ |
| Unit tests (Vitest) — engine, data layer, store, navigation | — | — | ✅ |
| Print / Export PDF | ⬜ | ✅ | ⬜ |
| Multi-state support (additional jurisdictions) | — | — | ⬜ |
| Remote statute source (MCP / RAG adapter) | — | — | ⬜ |
| Desktop app (Tauri, `apps/desktop`) — macOS local build | — | — | ✅ |
| Mobile app (Tauri iOS, `apps/desktop`) — Simulator build | — | — | ✅ |
| iOS App Store distribution (fastlane lanes, signing) | — | — | ⬜ |
| Desktop app (Tauri, `apps/desktop`) — Windows local build | — | — | ✅ |

When you complete a stage, flip the cell to ✅ (or 🎨 when only a mockup is added), add a
row for any new feature, and cite the statute/guideline for anything under **Logic**.
