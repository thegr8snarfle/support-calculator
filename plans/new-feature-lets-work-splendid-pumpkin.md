# Plan: Expand the Tauri harness to iOS (simulator now, App Store scaffolding ready)

## Context

The desktop harness (`apps/desktop`, Tauri v2) already packages the web app as a native
macOS app. The goal now is to **extend the same harness to iOS**. Two-part intent from the
user:

1. **Today:** get the app building and running in the **iOS Simulator** — no Apple account,
   no signing, minimal friction (mirrors the "local/unsigned" macOS approach).
2. **Plan-ahead:** lay in everything needed for an **App Store distributable** — the
   `bundle.iOS` build configuration, IPA output, and **fastlane hooks** — as dormant
   scaffolding that activates once a paid Apple Developer account + credentials exist. No
   actual App Store upload happens today.

The foundation is already mobile-ready (discovered during exploration):
- `apps/desktop/src-tauri/src/lib.rs` already has `#[cfg_attr(mobile, tauri::mobile_entry_point)]`
  on `run()`, and `main.rs` calls `cbmds_lib::run()` — the correct shared-entry pattern.
- `Cargo.toml` `[lib]` already declares `crate-type = ["staticlib", "cdylib", "rlib"]`
  (required for iOS). No change needed.
- iOS app icons are **already generated** at `src-tauri/icons/ios/` (full AppIcon set).
- `identifier` is `com.cbmds.support-calculator` — valid as the iOS bundle identifier.

What's missing: the Xcode project (`gen/apple/`), iOS bundle config, the dev-server host
wiring for mobile, `ios:*` scripts, fastlane hooks, and the prerequisites below.

**Machine prerequisite status (checked):** Xcode 26.6 ✅, Tauri CLI iOS commands ✅.
Missing: **CocoaPods** ❌ and the **iOS Rust targets** ❌ — both installed in Step 1.

**Decision (from user):** commit `src-tauri/gen/apple/` to git so the fastlane + signing
config persist. Tauri's `tauri ios init` writes a `.gitignore` inside `gen/apple/` that
excludes build artifacts (`build/`, `Pods/`, `Externals/`, etc.), so only the project +
our customizations are tracked.

## Reference facts (verified against Tauri v2 docs)

- Rust targets: `aarch64-apple-ios`, `aarch64-apple-ios-sim`, `x86_64-apple-ios`.
- CocoaPods: `brew install cocoapods`.
- Simulator run: `tauri ios dev` (optionally `tauri ios dev 'iPhone 16'` or `--open` for Xcode).
- App Store IPA: `tauri ios build --export-method app-store-connect` →
  `src-tauri/gen/apple/build/arm64/<AppName>.ipa`.
- Signing team: `tauri.conf.json > bundle > iOS > developmentTeam`, overridable by the
  `APPLE_DEVELOPMENT_TEAM` env var (env takes precedence — keeps the team ID out of git).
- iOS version key: `tauri.conf.json > bundle > iOS > bundleVersion` (+ `minimumSystemVersion`).
- Physical-device dev needs the dev server on `TAURI_DEV_HOST`; simulator uses `localhost`
  (unchanged). We wire the Vite host conditionally now so device dev works later for free.

## Changes

### Step 1 — Install prerequisites (one-time, local)
- `brew install cocoapods`
- `rustup target add aarch64-apple-ios aarch64-apple-ios-sim x86_64-apple-ios`

### Step 2 — Scaffold the iOS Xcode project
- From `apps/desktop/src-tauri` (with cargo env sourced): `npx tauri ios init`
- This generates `src-tauri/gen/apple/` (Xcode project, `Podfile`, `project.yml`,
  `ExportOptions.plist`, and a `.gitignore`). Commit the tracked portion.

### Step 3 — iOS config in `apps/desktop/src-tauri/tauri.conf.json`
Add a `bundle.iOS` block alongside the existing `bundle.macOS`:
```jsonc
"iOS": {
  "minimumSystemVersion": "14.0"
  // "developmentTeam": "XXXXXXXXXX"  // App Store: set here or via APPLE_DEVELOPMENT_TEAM env
  // "bundleVersion": "1"             // optional CFBundleVersion override for uploads
}
```
`developmentTeam`/`bundleVersion` stay commented until the paid account exists; the
`APPLE_DEVELOPMENT_TEAM` env var is the preferred way to supply the team ID (out of git).

### Step 4 — Wire the Vite dev-server host for mobile (`apps/web/vite.config.ts`)
Honor `TAURI_DEV_HOST` (undefined in the simulator path, so localhost is unchanged):
```ts
const host = process.env.TAURI_DEV_HOST
// server: { port: config.port, strictPort: true,
//   host: host || false,
//   hmr: host ? { protocol: 'ws', host, port: config.port + 1 } : undefined }
```
Keeps the existing `config.port` / `strictPort` structure from `config/appConfig.ts`.

### Step 5 — Scripts
- `apps/desktop/package.json` — add (same cargo-env prefix as `dev`/`build`):
  - `"ios:dev": ". \"$HOME/.cargo/env\" 2>/dev/null; tauri ios dev"`
  - `"ios:build": ". \"$HOME/.cargo/env\" 2>/dev/null; tauri ios build --export-method app-store-connect"`
- Root `package.json` — delegate:
  - `"ios:dev": "npm run ios:dev -w @support-calculator/desktop"`
  - `"ios:build": "npm run ios:build -w @support-calculator/desktop"`

### Step 6 — Fastlane hooks (App Store scaffolding, dormant)
Create under `apps/desktop/src-tauri/gen/apple/fastlane/`:
- **`Appfile`** — `app_identifier "com.cbmds.support-calculator"`, plus `apple_id`/`team_id`
  read from env (`ENV["FASTLANE_APPLE_ID"]`, `ENV["APPLE_DEVELOPMENT_TEAM"]`) so no secrets
  are committed.
- **`Fastfile`** — a `beta` lane (TestFlight) and a `release` lane (App Store) that:
  1. run the Tauri IPA build (`sh("cd ../../.. && npm run ios:build")`), then
  2. upload via `pilot`/`deliver` (or `xcrun altool`) using an **App Store Connect API key**
     supplied through env (`APP_STORE_CONNECT_API_KEY_ID`, `..._ISSUER_ID`, `..._KEY` path).
- The lanes are inert without those env vars — safe to commit and run only when credentials
  are present. Matches the repo's env-driven-config philosophy (`config/appConfig.ts`,
  `.env.template`).

### Step 7 — Docs
- **`README.md`** — under "Run as a desktop app", add a **"Run on iOS"** subsection:
  prerequisites (Xcode, `brew install cocoapods`, the 3 rustup targets), `npm run ios:dev`
  for the simulator, and a **"Distributing to the App Store"** note (paid Developer Program,
  `APPLE_DEVELOPMENT_TEAM`, `npm run ios:build` → IPA path, fastlane `beta`/`release` lanes,
  App Store Connect API key env vars). Mark App Store as **deferred / not yet active**.
- **`README.md` script table + Project structure** — add `ios:dev`/`ios:build` rows and the
  `gen/apple/` entry under `apps/desktop/src-tauri/`.
- **`CLAUDE.md`** — add `ios:dev`/`ios:build` to Commands; note iOS prerequisites and the
  App-Store-deferred scope under "Monorepo layout & desktop app"; flip/extend the roadmap
  row for the desktop/mobile app.
- **`CLAUDE.md` + `README.md` roadmap tables** — add a row:
  `Mobile app (Tauri iOS, apps/desktop) — simulator build` ✅, App Store distribution ⬜.

## Out of scope (today)
- Any **real App Store / TestFlight upload**, code signing, provisioning profiles, or the
  paid Apple Developer Program — scaffolded but dormant (no credentials).
- **Android** (`tauri android`) — icons exist but not requested here.
- **CI** for iOS builds — local only, consistent with the macOS decision.
- Universal/device release binaries beyond what the simulator + App-Store-export config need.

## Verification
1. `rustup target list --installed | grep ios` shows the 3 targets; `pod --version` succeeds.
2. `npm run ios:dev` (from repo root) compiles the Rust lib and **launches the app in the
   iOS Simulator**, rendering the worksheet; confirm the mobile-first layout looks right and
   the light/dark toggle works.
3. `git status` shows `gen/apple/` tracked with its generated `.gitignore` excluding
   `build/`/`Pods/`; the fastlane `Appfile`/`Fastfile` are present.
4. **Dry sanity for App Store path (no upload):** `npm run build` (web) still passes;
   `tauri.conf.json` remains valid JSON; `fastlane lanes` (if fastlane installed) lists the
   `beta`/`release` lanes without executing them. Actual `ios:build` signing is expected to
   fail without a team ID — that's the deferred boundary, not a regression.
5. `npm run desktop:build` / `desktop:dev` still work (no desktop regression from the shared
   `lib.rs`/config).
