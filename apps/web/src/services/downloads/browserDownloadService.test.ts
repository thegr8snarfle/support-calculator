/**
 * `fetch` is injected rather than module-mocked, per the project's testing convention. The
 * blob-URL / anchor-click plumbing runs for real against jsdom.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { createBrowserDownloadService, type BrowserDownloadDeps } from './browserDownloadService'

const FILE = { url: '/statutes/co-title-14-2024.pdf', filename: 'CRS-Title-14-2024.pdf', mimeType: 'application/pdf' as const }

function fakeFetch(response: Partial<Response>): BrowserDownloadDeps['fetch'] {
  return vi.fn().mockResolvedValue(response) as unknown as BrowserDownloadDeps['fetch']
}

describe('createBrowserDownloadService', () => {
  let createObjectURL: ReturnType<typeof vi.fn>
  let revokeObjectURL: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // jsdom does not implement these — stand them up so the adapter's blob-URL flow runs.
    createObjectURL = vi.fn(() => 'blob:mock-url')
    revokeObjectURL = vi.fn()
    URL.createObjectURL = createObjectURL as typeof URL.createObjectURL
    URL.revokeObjectURL = revokeObjectURL as typeof URL.revokeObjectURL
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches the file and clicks a download anchor pointed at the resulting blob URL', async () => {
    const blob = new Blob(['pdf bytes'], { type: 'application/pdf' })
    const fetch = fakeFetch({ ok: true, status: 200, blob: () => Promise.resolve(blob) })
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    const service = createBrowserDownloadService({ fetch })
    const outcome = await service.downloadFile(FILE)

    expect(fetch).toHaveBeenCalledWith(FILE.url)
    expect(createObjectURL).toHaveBeenCalledWith(blob)
    expect(clickSpy).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
    expect(outcome).toEqual({ status: 'saved' })
  })

  it('reports an error outcome when the fetch response is not ok, without throwing', async () => {
    const fetch = fakeFetch({ ok: false, status: 404 })
    const service = createBrowserDownloadService({ fetch })

    const outcome = await service.downloadFile(FILE)

    expect(outcome).toEqual({ status: 'error', message: expect.stringContaining('404') })
  })

  it('reports an error outcome when fetch itself rejects', async () => {
    const fetch = vi.fn().mockRejectedValue(new Error('network down')) as unknown as BrowserDownloadDeps['fetch']
    const service = createBrowserDownloadService({ fetch })

    const outcome = await service.downloadFile(FILE)

    expect(outcome).toEqual({ status: 'error', message: 'network down' })
  })
})
