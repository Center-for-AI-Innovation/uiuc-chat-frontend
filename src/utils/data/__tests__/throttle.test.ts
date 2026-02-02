import { describe, expect, it, vi } from 'vitest'
import { throttle } from '../throttle'

describe('throttle', () => {
  it('calls immediately and then at most once per interval', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(0))

    const fn = vi.fn()
    const throttled = throttle(fn, 1000)

    throttled('a')
    throttled('b')
    throttled('c')

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenLastCalledWith('a')

    await vi.advanceTimersByTimeAsync(999)
    expect(fn).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(2)

    vi.useRealTimers()
  })
})
