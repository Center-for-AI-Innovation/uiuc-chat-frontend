import { describe, expect, it, vi } from 'vitest'

describe('redisClient', () => {
  it('connects only when not already open and logs errors once', async () => {
    const onHandlers: Record<string, (...args: unknown[]) => void> = {}
    const connect = vi.fn().mockResolvedValue(undefined)
    const fakeClient = {
      isOpen: false,
      connect,
      on: (event: string, cb: (...args: unknown[]) => void) => {
        onHandlers[event] = cb
      },
    } as any

    vi.doMock('redis', () => ({
      createClient: vi.fn(() => fakeClient),
    }))

    vi.resetModules()
    const { ensureRedisConnected } = await import('../redisClient')

    await ensureRedisConnected()
    expect(connect).toHaveBeenCalledTimes(1)

    fakeClient.isOpen = true
    await ensureRedisConnected()
    expect(connect).toHaveBeenCalledTimes(1)

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const errCb = onHandlers['error']
    expect(errCb).toBeTypeOf('function')
    ;(errCb as (e: Error) => void)(new Error('boom'))
    ;(errCb as (e: Error) => void)(new Error('boom again'))
    expect(errorSpy).toHaveBeenCalledTimes(1)
  })
})
