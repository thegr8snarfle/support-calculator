/**
 * The Tauri desktop/iOS adapter.
 *
 * The webview has no download manager, so the `<a download>` click the browser adapter uses
 * is a silent no-op here — nothing happens, and nothing throws to say why. This instead:
 *
 * 1. Fetches the file as bytes (same-origin `fetch` works fine inside the webview).
 * 2. Asks the OS "Save As" dialog where to put them (`@tauri-apps/plugin-dialog`).
 * 3. Writes the bytes to that path (`@tauri-apps/plugin-fs`).
 *
 * Tauri grants fs scope for the dialog's *chosen path* at runtime the moment `save()`
 * resolves, so no broader filesystem scope is needed — see
 * `apps/desktop/src-tauri/capabilities/default.json` (`dialog:allow-save` +
 * `fs:allow-write-file`, the latter scope-free by permission definition, not by a wildcard
 * scope entry).
 */
import { save as tauriSave } from '@tauri-apps/plugin-dialog'
import { writeFile as tauriWriteFile } from '@tauri-apps/plugin-fs'
import type { DownloadableFile, DownloadOutcome, DownloadService } from './downloadService'

/**
 * The slice of the dialog/fs plugin APIs this adapter uses, narrowed so tests can inject
 * fakes instead of mocking `@tauri-apps/plugin-dialog` / `@tauri-apps/plugin-fs` — the same
 * convention `createLocalStoragePreferences` uses for `StorageLike`.
 */
export type TauriDownloadDeps = {
  save: typeof tauriSave
  writeFile: typeof tauriWriteFile
  fetch: typeof fetch
}

const defaultDeps: TauriDownloadDeps = {
  save: tauriSave,
  writeFile: tauriWriteFile,
  fetch: (input, init) => globalThis.fetch(input, init),
}

/** Lowercase extension (no leading dot) for the save dialog's file-type filter, e.g. `"pdf"`. */
function extensionOf(filename: string): string | undefined {
  const dot = filename.lastIndexOf('.')
  return dot === -1 ? undefined : filename.slice(dot + 1).toLowerCase()
}

export function createTauriDownloadService(deps: TauriDownloadDeps = defaultDeps): DownloadService {
  return {
    async downloadFile(file: DownloadableFile): Promise<DownloadOutcome> {
      try {
        const response = await deps.fetch(file.url)
        if (!response.ok) {
          return { status: 'error', message: `Could not fetch ${file.filename} (${response.status}).` }
        }
        const bytes = new Uint8Array(await response.arrayBuffer())

        const extension = extensionOf(file.filename)
        const destination = await deps.save({
          defaultPath: file.filename,
          filters: extension ? [{ name: file.filename, extensions: [extension] }] : undefined,
        })
        // `null` means the user dismissed the dialog — not an error.
        if (!destination) return { status: 'cancelled' }

        await deps.writeFile(destination, bytes)
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
