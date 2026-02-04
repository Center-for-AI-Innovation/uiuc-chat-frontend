import { describe, expect, it, vi } from 'vitest'
import { handleExport } from '../handleExport'

describe('handleExport', () => {
  it('returns server error message for non-ok responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'nope' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }),
    )

    await expect(handleExport('CS101')).resolves.toEqual({ message: 'nope' })
  })

  it('returns s3 path for JSON responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'ok', s3_path: 's3://x' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    await expect(handleExport('CS101')).resolves.toEqual({
      message: 'ok',
      s3_path: 's3://x',
    })
  })

  it('downloads a zip when content-type is application/zip', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('zip-bytes', {
        status: 200,
        headers: { 'content-type': 'application/zip' },
      }),
    )

    const originalCreateElement = document.createElement.bind(document)
    const link = originalCreateElement('a')
    const clickSpy = vi.spyOn(link, 'click').mockImplementation(() => {})
    const createElSpy = vi
      .spyOn(document, 'createElement')
      .mockReturnValue(link)

    await expect(handleExport('CS101')).resolves.toEqual({
      message: 'Downloading now, check your downloads.',
    })
    expect(fetchSpy).toHaveBeenCalled()
    expect(createElSpy).toHaveBeenCalledWith('a')
    expect(clickSpy).toHaveBeenCalled()
  })

  it('returns Unexpected response format for unknown content-type', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('ok', {
        status: 200,
        headers: { 'content-type': 'text/plain' },
      }),
    )

    await expect(handleExport('CS101')).resolves.toEqual({
      message: 'Unexpected response format.',
    })
  })

  it('returns generic error when fetch throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('boom'))

    await expect(handleExport('CS101')).resolves.toEqual({
      message: 'Error exporting documents.',
    })
  })
})
