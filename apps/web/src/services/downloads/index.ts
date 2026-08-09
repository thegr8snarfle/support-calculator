/**
 * Public API of the file-download layer. See `downloadService.ts` for why this mirrors the
 * `services/rules` / `services/preferences` port-and-adapter shape.
 */
import { isTauri } from '@tauri-apps/api/core'
import { createBrowserDownloadService } from './browserDownloadService'
import { createTauriDownloadService } from './tauriDownloadService'
import type { DownloadService } from './downloadService'

export type { DownloadableFile, DownloadOutcome, DownloadService } from './downloadService'
export { createBrowserDownloadService, type BrowserDownloadDeps } from './browserDownloadService'
export { createTauriDownloadService, type TauriDownloadDeps } from './tauriDownloadService'

/** Build the adapter for this runtime — the Tauri webview vs. a plain browser. */
export function createDownloadService(): DownloadService {
  return isTauri() ? createTauriDownloadService() : createBrowserDownloadService()
}

/** The app-wide default service. Tests inject their own rather than using this. */
export const defaultDownloadService: DownloadService = createDownloadService()
