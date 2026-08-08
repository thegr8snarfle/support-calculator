# Stand up a basic Apple signing identity (iOS, local signing only)

## Context

The iOS App Store path for this Tauri app is **scaffolded but dormant** — it has been
waiting on "a paid Apple Developer account + a signing team" (see `CLAUDE.md` → *Run on
iOS* / status table, and `README.md` → *Distributing to the App Store (deferred)*). The
goal of this task is to **stand up the minimum viable Apple signing identity** so that
`npm run ios:build` produces a **signed IPA on this machine**. Scope stops **before** any
upload (no TestFlight, no App Store Connect API key yet) — that's a follow-up.

Key finding from exploration: the project uses **Xcode *automatic* signing driven by a
Team ID** — **not** fastlane `match`, and **not** manual certificates/profiles. That means
"standing up a signing identity" here is almost entirely **out-of-band Apple-account work**
plus injecting one env var; **there are no certs to hand-generate or store, and near-zero
code to change.** Once you're enrolled and signed into Xcode, the first build auto-creates
the distribution certificate and provisioning profile.

Current signing state (all confirmed):
- **Bundle ID:** `com.cbmds.support-calculator` — consistent across `tauri.conf.json`,
  `gen/apple/fastlane/Appfile`, `gen/apple/project.yml`, and the `.xcodeproj/project.pbxproj`.
- **The gap:** no `DEVELOPMENT_TEAM` anywhere in the Xcode project, and no
  `bundle.iOS.developmentTeam` in `tauri.conf.json`. The Team ID is meant to be injected via
  the **`APPLE_DEVELOPMENT_TEAM`** env var (Tauri reads it at build time). Only
  `CODE_SIGN_IDENTITY = "iPhone Developer"` is set; `CODE_SIGN_STYLE` is absent (→ Automatic).
- **Build script:** `apps/desktop/package.json` → `ios:build` runs
  `tauri ios build --export-method app-store-connect`, emitting an IPA at
  `apps/desktop/src-tauri/gen/apple/build/arm64/<AppName>.ipa` (the `build/` dir is
  gitignored). App name / product: *Crazy Baby Mama Defense System*.

## Decision you still need to make: enrollment type

Enrollment is a manual step on Apple's site; pick before starting Step 1.

| | **Individual** (recommended for "basic") | **Organization** |
| --- | --- | --- |
| Cost | $99/yr | $99/yr |
| Approval time | Hours–days | Days–weeks |
| Prerequisite | Just an Apple ID | A **D-U-N-S number** for the legal entity (free but slow to obtain) |
| Public "seller" on App Store | Your **personal legal name** | Company name (e.g. "CBMDS") |
| Team roles / multiple members | No | Yes |
| Team ID | Issued either way | Issued either way |

**Recommendation:** For a "basic" identity and local signing, enroll as **Individual** — it's
the fastest path to a Team ID and needs no D-U-N-S. You can migrate/transfer the app to an
Organization account later if CBMDS becomes a real entity before public launch. The bundle
ID and all repo scaffolding are identical either way; only the Team ID value differs.

## Steps

### 1. Enroll & get the Team ID (manual, on Apple's site)
- Enroll in the **Apple Developer Program** at <https://developer.apple.com/programs/> ($99/yr)
  using the chosen enrollment type.
- After approval, read the **Team ID** (10-char, e.g. `A1B2C3D4E5`) at
  <https://developer.apple.com/account> → **Membership details**.
- No manual App ID / certificate / provisioning-profile creation is required for automatic
  signing — Xcode registers `com.cbmds.support-calculator` and mints the cert + profile on
  the first signed build.

### 2. Sign the Apple ID into Xcode (enables automatic signing)
- **Xcode → Settings → Accounts → “+” → Apple ID**, sign in with the enrolled account.
  This is what lets automatic signing create the *Apple Distribution* certificate in your
  login keychain and generate an Xcode-managed provisioning profile. (Requires the full
  **Xcode** app, already a documented iOS prerequisite.)

### 3. Provide the Team ID to the build (env-driven — nothing committed)
Keep the Team ID **out of version control** to match the repo's env-driven philosophy
("nothing account-specific committed"). Two supported options — recommend (a):

- **(a) Shell env (recommended):** export it before building, e.g. add to `~/.zshrc` or a
  gitignored local file you source:
  ```sh
  export APPLE_DEVELOPMENT_TEAM=A1B2C3D4E5   # your real Team ID
  ```
  Tauri reads `APPLE_DEVELOPMENT_TEAM` and overrides `bundle > iOS > developmentTeam`.
  Matches the README's documented Step 1.
- **(b) Pin in config (only if you want zero-env convenience on a solo machine):** add
  `"developmentTeam": "A1B2C3D4E5"` under `bundle.iOS` in
  `apps/desktop/src-tauri/tauri.conf.json`. A Team ID is *semi-public* (it's embedded in any
  distributed app's profile, so not a hard secret), **but** committing it bakes a specific
  personal account into the shared repo config — **not recommended**; prefer (a).

### 4. Produce a signed IPA locally & verify
- From the repo root: `npm run ios:build`.
- On first run, Xcode automatic signing creates the distribution cert + provisioning profile
  (you may get a macOS keychain prompt to allow `codesign` access — allow/Always Allow).
- **Verify** the IPA is signed with your identity (this is the acceptance test):
  ```sh
  IPA=$(ls apps/desktop/src-tauri/gen/apple/build/arm64/*.ipa)
  cd "$(mktemp -d)" && unzip -q "$IPA" && \
    codesign -dvvv Payload/*.app 2>&1 | grep -E 'Authority|TeamIdentifier'
  # Expect: TeamIdentifier=<your Team ID>, Authority=Apple Distribution: <name> (<Team ID>)
  ```
  Optionally inspect the embedded profile:
  `security cms -D -i Payload/*.app/embedded.mobileprovision | plutil -p - | grep -E 'TeamName|Name'`.

## Repo changes

**Essentially none are required for local signing.** Everything needed is Apple-account +
env. Optional, low-value tidy-ups (do only if desired, and only with explicit go-ahead per
the repo's git rules — this task makes no commits by default):

- **Docs touch-up (optional):** flip the *iOS App Store distribution* row context or add a
  one-line note in `README.md` / `CLAUDE.md` that **local device-distribution signing is now
  live** (the App Store *upload* path — API key, TestFlight — remains the deferred follow-up).
  Leave the status table's App Store row as ⬜ until an actual upload lands.
- **Do NOT** hardcode the Team ID into `tauri.conf.json` (see Step 3b rationale).

## Out of scope (explicit — this is the follow-up task)
- App Store Connect **API key** (`APP_STORE_CONNECT_API_KEY_ID` / `_ISSUER_ID` /
  `_API_KEY` .p8) and `FASTLANE_APPLE_ID`.
- Registering the **app record** in App Store Connect.
- Running `fastlane beta` (TestFlight) or `fastlane release` (App Store).
- macOS Developer ID / notarization for the desktop `.dmg` (separate identity, separate task).

## Verification / acceptance
- `npm run ios:build` completes without a signing error.
- A `.ipa` exists at `apps/desktop/src-tauri/gen/apple/build/arm64/`.
- `codesign -dvvv` on the embedded `.app` reports `TeamIdentifier=<your Team ID>` and an
  `Apple Distribution` authority — proving the signing identity is live end-to-end, with no
  upload performed.
