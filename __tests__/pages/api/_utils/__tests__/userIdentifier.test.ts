import { describe, expect, it } from 'vitest'
import { getUserIdentifier } from '~/pages/api/_utils/userIdentifier'

describe('getUserIdentifier', () => {
  it('prefers req.user.email when present', () => {
    const req = { user: { email: 'user@example.com' }, headers: {} } as any
    expect(getUserIdentifier(req)).toBe('user@example.com')
  })

  it('falls back to x-user-email header', () => {
    const req = {
      user: {},
      headers: { 'x-user-email': 'header@example.com' },
    } as any
    expect(getUserIdentifier(req)).toBe('header@example.com')
  })

  it('falls back to x-posthog-id header', () => {
    const req = { user: {}, headers: { 'x-posthog-id': 'ph_123' } } as any
    expect(getUserIdentifier(req)).toBe('ph_123')
  })

  it('returns null when no identifier is present', () => {
    const req = { user: {}, headers: {} } as any
    expect(getUserIdentifier(req)).toBeNull()
  })
})
