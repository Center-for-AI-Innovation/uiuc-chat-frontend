import { describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

import { useIsMobile } from '../use-mobile'

describe('useIsMobile', () => {
  it('tracks window width and matchMedia changes', () => {
    const listeners = new Set<() => void>()
    const matchMedia = vi.fn(() => ({
      matches: false,
      media: '',
      onchange: null,
      addEventListener: (_evt: string, cb: any) => listeners.add(cb),
      removeEventListener: (_evt: string, cb: any) => listeners.delete(cb),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
    Object.defineProperty(window, 'matchMedia', {
      value: matchMedia,
      writable: true,
    })

    Object.defineProperty(window, 'innerWidth', { value: 500, writable: true })
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)

    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        value: 1200,
        writable: true,
      })
      for (const cb of listeners) cb()
    })
    expect(result.current).toBe(false)
  })
})
