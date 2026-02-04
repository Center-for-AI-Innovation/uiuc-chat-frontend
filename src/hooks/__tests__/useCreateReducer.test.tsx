import { describe, expect, it } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCreateReducer } from '../useCreateReducer'

describe('useCreateReducer', () => {
  it('updates fields and supports reset', () => {
    const { result } = renderHook(() =>
      useCreateReducer({ initialState: { count: 0, name: 'x' } }),
    )

    act(() => {
      result.current.dispatch({ field: 'count', value: 1 } as any)
    })
    expect(result.current.state.count).toBe(1)

    act(() => {
      result.current.dispatch({ type: 'reset' })
    })
    expect(result.current.state).toEqual({ count: 0, name: 'x' })
  })
})
