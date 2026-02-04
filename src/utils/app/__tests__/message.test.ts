import { describe, expect, it, vi } from 'vitest'
import {
  deleteMessagesFromServer,
  upsertMessageToServer,
} from '@/hooks/__internal__/message'
import { makeMessage } from '~/test-utils/mocks/chat'

describe('upsertMessageToServer', () => {
  it('returns parsed JSON on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'm1' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    await expect(
      upsertMessageToServer(
        makeMessage(),
        'conv-1',
        'user@example.com',
        'TEST101',
      ),
    ).resolves.toEqual({ id: 'm1' })
  })

  it('throws a helpful error when the server responds with JSON error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Bad request' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      }),
    )

    await expect(
      upsertMessageToServer(
        makeMessage(),
        'conv-1',
        'user@example.com',
        'TEST101',
      ),
    ).rejects.toThrow(/Bad request/)
  })

  it('throws a helpful error when the server responds with non-JSON error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('nope', { status: 500, statusText: 'Server error' }),
    )

    await expect(
      upsertMessageToServer(
        makeMessage(),
        'conv-1',
        'user@example.com',
        'TEST101',
      ),
    ).rejects.toThrow(/Server error/)
  })

  it('retries on ECONNRESET and eventually succeeds', async () => {
    vi.useFakeTimers()

    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    fetchSpy
      .mockRejectedValueOnce(
        Object.assign(new Error('reset'), { code: 'ECONNRESET' }),
      )
      .mockRejectedValueOnce(
        Object.assign(new Error('reset'), { code: 'ECONNRESET' }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )

    const promise = upsertMessageToServer(
      makeMessage(),
      'conv-1',
      'user@example.com',
      'TEST101',
    )

    await vi.runAllTimersAsync()
    await expect(promise).resolves.toEqual({ ok: true })
    expect(fetchSpy).toHaveBeenCalledTimes(3)

    vi.useRealTimers()
  })

  it('does not retry non-ECONNRESET errors', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    fetchSpy.mockRejectedValueOnce(new Error('boom'))

    await expect(
      upsertMessageToServer(
        makeMessage(),
        'conv-1',
        'user@example.com',
        'TEST101',
      ),
    ).rejects.toThrow(/boom/)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })
})

describe('deleteMessagesFromServer (deprecated)', () => {
  it('resolves on success', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('', { status: 200 }),
    )

    await expect(
      deleteMessagesFromServer(['m1', 'm2'], 'TEST101', 'user@example.com'),
    ).resolves.toBeUndefined()
  })

  it('throws a helpful error when the server responds with JSON error', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Bad delete' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      }),
    )

    await expect(
      deleteMessagesFromServer(['m1'], 'TEST101', 'user@example.com'),
    ).rejects.toThrow(/Bad delete/)
  })

  it('retries on ECONNRESET and eventually succeeds', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.useFakeTimers()

    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    fetchSpy
      .mockRejectedValueOnce(
        Object.assign(new Error('reset'), { code: 'ECONNRESET' }),
      )
      .mockResolvedValueOnce(new Response('', { status: 200 }))

    const promise = deleteMessagesFromServer(
      ['m1'],
      'TEST101',
      'user@example.com',
    )

    await vi.runAllTimersAsync()
    await expect(promise).resolves.toBeUndefined()
    expect(fetchSpy).toHaveBeenCalledTimes(2)

    vi.useRealTimers()
  })

  it('does not retry non-ECONNRESET errors', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    fetchSpy.mockRejectedValueOnce(new Error('boom'))

    await expect(
      deleteMessagesFromServer(['m1'], 'TEST101', 'user@example.com'),
    ).rejects.toThrow(/boom/)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })
})
