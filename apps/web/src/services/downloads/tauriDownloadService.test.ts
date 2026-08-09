/**
 * `save` / `writeFile` / `fetch` are injected rather than the `@tauri-apps/plugin-dialog` /
 * `@tauri-apps/plugin-fs` modules being mocked, per the project's testing convention — these
 * tests run the same in a plain Vitest/jsdom environment with no Tauri runtime present.
 */
import { describe, expect, it, vi } from 'vitest'
import { createTauriDownloadService, type TauriDownloadDeps } from './tauriDownloadService'

const FILE = { url: '/statutes/co-title-14-2024.pdf', filename: 'CRS-Title-14-2024.pdf', mimeType: 'application/pdf' as const }

function fakeDeps(overrides: Partial<TauriDownloadDeps> = {}): TauriDownloadDeps {
  return {
    fetch: vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: () => Promise.resolve(new TextEncoder().encode('pdf bytes').buffer),
    }) as unknown as TauriDownloadDeps['fetch'],
    save: vi.fn().mockResolvedValue('/Users/pat/Downloads/CRS-Title-14-2024.pdf'),
    writeFile: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

describe('createTauriDownloadService', () => {
  it('fetches the file, opens a save dialog filtered to its extension, and writes the bytes to the chosen path', async () => {
    const deps = fakeDeps()
    const service = createTauriDownloadService(deps)

    const outcome = await service.downloadFile(FILE)

    expect(deps.fetch).toHaveBeenCalledWith(FILE.url)
    expect(deps.save).toHaveBeenCalledWith({
      defaultPath: FILE.filename,
      filters: [{ name: FILE.filename, extensions: ['pdf'] }],
    })
    expect(deps.writeFile).toHaveBeenCalledWith(
      '/Users/pat/Downloads/CRS-Title-14-2024.pdf',
      expect.any(Uint8Array),
    )
    expect(outcome).toEqual({ status: 'saved' })
  })

  it('reports cancelled, and never calls writeFile, when the user dismisses the save dialog', async () => {
    const deps = fakeDeps({ save: vi.fn().mockResolvedValue(null) })
    const service = createTauriDownloadService(deps)

    const outcome = await service.downloadFile(FILE)

    expect(deps.writeFile).not.toHaveBeenCalled()
    expect(outcome).toEqual({ status: 'cancelled' })
  })

  it('reports an error outcome when the fetch response is not ok', async () => {
    const deps = fakeDeps({
      fetch: vi.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as TauriDownloadDeps['fetch'],
    })
    const service = createTauriDownloadService(deps)

    const outcome = await service.downloadFile(FILE)

    expect(deps.save).not.toHaveBeenCalled()
    expect(outcome).toEqual({ status: 'error', message: expect.stringContaining('500') })
  })

  it('reports an error outcome when writeFile rejects, e.g. a permission or disk-full failure', async () => {
    const deps = fakeDeps({ writeFile: vi.fn().mockRejectedValue(new Error('permission denied')) })
    const service = createTauriDownloadService(deps)

    const outcome = await service.downloadFile(FILE)

    expect(outcome).toEqual({ status: 'error', message: 'permission denied' })
  })
})
