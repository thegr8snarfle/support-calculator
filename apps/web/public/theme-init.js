/**
 * First-paint theme applier. Runs BEFORE the app bundle, before React, before first paint.
 *
 * ## Why this file exists at all
 *
 * The browser paints as soon as it has parsed the HTML and its blocking CSS. If `data-theme`
 * is not set by then, a dark-mode user gets a light flash and then a repaint. So the
 * attribute has to be set by something that blocks parsing — which is why `index.html` loads
 * this with **no `type="module"` and no `defer`**. Both would defer execution until after
 * parsing, i.e. after the paint we are trying to get ahead of, which is exactly why the
 * app's own `main.tsx` cannot do this job.
 *
 * ## Why it is a separate file rather than an inline <script>
 *
 * Inline is the usual pattern, but the Tauri CSP (`tauri.conf.json`) is
 * `default-src 'self'` with no `script-src`, so inline script is refused in the desktop and
 * iOS builds. A same-origin external file satisfies `'self'` and is still render-blocking —
 * same guarantee, no CSP change, no hash to keep in sync.
 *
 * ## Constraints
 *
 * - **No imports and no bundling.** It lives in `public/` and is copied verbatim, so it runs
 *   before any module exists. That is why the storage key and the resolution rules are
 *   duplicated from `src/` rather than imported; `preferencesContract.test.ts` asserts the
 *   two copies agree and fails loudly if one drifts.
 * - **Cannot be allowed to throw.** It is the first thing that runs; an exception here would
 *   be the last thing that runs. Hence the blanket try/catch.
 * - Plain ES5-era syntax, since it is served unbundled and untranspiled.
 */
;(function () {
  try {
    // Keep in sync with PREFERENCES_KEY in src/services/preferences/preferencesRepository.ts
    var KEY = 'support-calculator.preferences'

    var theme = 'system'

    // Storage access itself can throw (blocked site data), so it is inside the try.
    var raw = window.localStorage.getItem(KEY)
    if (raw) {
      var stored = JSON.parse(raw)
      // Validate defensively — this is untrusted, user-editable input, and the real Zod
      // parse does not exist yet at this point in the boot.
      if (stored && (stored.theme === 'light' || stored.theme === 'dark' || stored.theme === 'system')) {
        theme = stored.theme
      }
    }

    // Resolve the 'system' deferral against the OS. Mirrors resolveTheme() in
    // src/features/preferences/theme.ts.
    var resolved = theme
    if (theme === 'system') {
      var prefersDark =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      resolved = prefersDark ? 'dark' : 'light'
    }

    document.documentElement.setAttribute('data-theme', resolved)
  } catch (e) {
    // Unreadable storage, disabled JSON, anything else: fall through with no attribute set.
    // The CSS :root defaults to light and ThemeProvider corrects it once React mounts, so
    // the worst case is the flash this file normally prevents — never a broken boot.
  }
})()
