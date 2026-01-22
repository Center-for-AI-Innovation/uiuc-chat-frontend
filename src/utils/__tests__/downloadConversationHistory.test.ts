import { describe, expect, it, vi } from 'vitest'
import { downloadConversationHistory } from '../downloadConversationHistory'

describe('downloadConversationHistory', () => {
  it('returns server error message for non-ok responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'nope' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }),
    )

    await expect(downloadConversationHistory('CS101')).resolves.toEqual({
      message: 'nope',
    })
  })

  it('returns message for JSON responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'ok' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    await expect(downloadConversationHistory('CS101')).resolves.toEqual({
      message: 'ok',
    })
  })

  it('downloads a zip when content-type is application/zip', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('zip-bytes', {
        status: 200,
        headers: { 'content-type': 'application/zip' },
      }),
    )

    const originalCreateElement = document.createElement.bind(document)
    const link = originalCreateElement('a')
    const clickSpy = vi.spyOn(link, 'click').mockImplementation(() => {})
    vi.spyOn(document, 'createElement').mockReturnValue(link)

    await expect(downloadConversationHistory('CS101')).resolves.toEqual({
      message: 'Downloading now, check your downloads.',
    })
    expect(clickSpy).toHaveBeenCalled()
  })

  it('returns Unexpected response format for unknown content-type', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('ok', {
        status: 200,
        headers: { 'content-type': 'text/plain' },
      }),
    )

    await expect(downloadConversationHistory('CS101')).resolves.toEqual({
      message: 'Unexpected response format.',
    })
  })

  it('returns generic error when fetch throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('boom'))

    await expect(downloadConversationHistory('CS101')).resolves.toEqual({
      message: 'Error downloading conversation history.',
    })
  })
})
