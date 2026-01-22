/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest'
import { getBaseUrl } from '../apiUtils'

describe('getBaseUrl (node)', () => {
  it('returns uiuc.chat in production', () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('VERCEL_URL', '')
    vi.stubEnv('PORT', '')
    expect(getBaseUrl()).toBe('https://uiuc.chat')
  })

  it('returns vercel url when provided', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    vi.stubEnv('VERCEL_URL', 'example.vercel.app')
    expect(getBaseUrl()).toBe('https://example.vercel.app')
  })

  it('falls back to localhost with PORT', () => {
    vi.stubEnv('VERCEL_ENV', '')
    vi.stubEnv('VERCEL_URL', '')
    vi.stubEnv('PORT', '4321')
    expect(getBaseUrl()).toBe('http://localhost:4321')
  })
})

