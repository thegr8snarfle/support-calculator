/**
 * The plain-browser adapter (also what runs the Playwright e2e smoke suite).
 *
 * Fetches the file as a `Blob` and clicks a throwaway `<a download>` pointed at a `blob:`
 * URL rather than `file.url` directly — that keeps this adapter's shape identical to the
 * Tauri one (fetch bytes, then hand them off) and works the same whether or not `file.url`
 * happens to be same-origin.
 */
import type { DownloadableFile, DownloadOutcome, DownloadService } from './downloadService'

/**
 * The slice of `fetch` this adapter uses, narrowed so tests can inject a fake instead of
 * mocking the module — the same convention `createLocalStoragePreferences` uses for
 * `StorageLike`. Defaults to the real global `fetch`, called through a wrapper: some
 * engines throw "Illegal invocation" if `fetch` is invoked detached from its `window`/`self`
 * receiver, which passing `deps.fetch = fetch` directly would do.
 */
export type BrowserDownloadDeps = {
  fetch: typeof fetch
}

const defaultDeps: BrowserDownloadDeps = {
  fetch: (input, init) => globalThis.fetch(input, init),
}

export function createBrowserDownloadService(deps: BrowserDownloadDeps = defaultDeps): DownloadService {
  return {
    async downloadFile(file: DownloadableFile): Promise<DownloadOutcome> {
      try {
        const response = await deps.fetch(file.url)
        if (!response.ok) {
          return { status: 'error', message: `Could not fetch ${file.filename} (${response.status}).` }
        }
        const blob = await response.blob()
        const objectUrl = URL.createObjectURL(blob)
        try {
          const link = document.createElement('a')
          link.href = objectUrl
          link.download = file.filename
          document.body.appendChild(link)
          link.click()
          link.remove()
        } finally {
          URL.revokeObjectURL(objectUrl)
        }
        return { status: 'saved' }
      } catch (error) {
        return {
          status: 'error',
          message: error instanceof Error ? error.message : `Could not download ${file.filename}.`,
        }
      }
    },
  }
}
