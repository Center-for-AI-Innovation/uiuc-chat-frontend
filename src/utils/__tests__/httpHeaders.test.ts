import { describe, expect, it, vi } from 'vitest'
import posthog from 'posthog-js'
import { createHeaders } from '../httpHeaders'

describe('createHeaders', () => {
  it('includes x-user-email when provided', () => {
    expect(createHeaders('user@example.com')).toEqual({
      'Content-Type': 'application/json',
      'x-user-email': 'user@example.com',
    })
  })

  it('falls back to x-posthog-id when available', () => {
    const headers = createHeaders()
    expect(headers).toEqual({
      'Content-Type': 'application/json',
      'x-posthog-id': 'test-posthog-id',
    })
  })

  it('returns only Content-Type when no email and no posthog id', () => {
    vi.spyOn(posthog as any, 'get_distinct_id').mockReturnValue('')
    expect(createHeaders()).toEqual({
      'Content-Type': 'application/json',
    })
  })

  it('ignores errors when PostHog distinct id lookup throws', () => {
    vi.spyOn(posthog as any, 'get_distinct_id').mockImplementation(() => {
      throw new Error('boom')
    })
    expect(createHeaders()).toEqual({
      'Content-Type': 'application/json',
    })
  })
})
