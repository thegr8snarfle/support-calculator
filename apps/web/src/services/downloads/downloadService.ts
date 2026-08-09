/**
 * The file-download port.
 *
 * Consumers depend on this type and `createDownloadService` (see `index.ts`), never on a
 * concrete adapter — the same discipline as `RulesRepository` and `PreferencesRepository`.
 * A browser and the Tauri desktop/iOS webview save a file two different ways: a browser can
 * drive an `<a download>` click well enough on its own, but Tauri's webview has no native
 * download manager — the same click is a silent no-op there. It needs the bytes fetched as a
 * blob and handed to the OS "Save As" dialog through the fs plugin instead. Picking the right
 * adapter is `createDownloadService`'s job, so call sites never branch on platform.
 */

/** A file to fetch and save, described by a same-origin URL and a suggested filename. */
export type DownloadableFile = {
  /** Same-origin URL to fetch the bytes from (e.g. a bundled `public/` asset path). */
  url: string
  /** Suggested filename for the save dialog / browser download prompt. */
  filename: string
  mimeType?: string
}

/**
 * How a download attempt ended. `cancelled` only ever comes from the Tauri adapter — a
 * browser's own save-file UI is outside this app's process and never reports back.
 */
export type DownloadOutcome =
  | { status: 'saved' }
  | { status: 'cancelled' }
  | { status: 'error'; message: string }

export type DownloadService = {
  downloadFile: (file: DownloadableFile) => Promise<DownloadOutcome>
}
