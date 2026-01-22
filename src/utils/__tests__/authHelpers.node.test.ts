/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest'
import { getKeycloakBaseUrl } from '../authHelpers'

describe('getKeycloakBaseUrl (node)', () => {
  it('returns empty string when no env override and window is undefined', () => {
    vi.stubEnv('NEXT_PUBLIC_KEYCLOAK_URL', '')
    expect(getKeycloakBaseUrl()).toBe('')
  })

  it('returns localhost base when window hostname is localhost', () => {
    vi.stubEnv('NEXT_PUBLIC_KEYCLOAK_URL', '')
    ;(globalThis as any).window = { location: { hostname: 'localhost', origin: 'http://localhost:3000' } }
    expect(getKeycloakBaseUrl()).toBe('http://localhost:8080/')
    delete (globalThis as any).window
  })

  it('returns uiuc.chat login base when window hostname is uiuc.chat', () => {
    vi.stubEnv('NEXT_PUBLIC_KEYCLOAK_URL', '')
    ;(globalThis as any).window = { location: { hostname: 'uiuc.chat', origin: 'https://uiuc.chat' } }
    expect(getKeycloakBaseUrl()).toBe('https://login.uiuc.chat/')
    delete (globalThis as any).window
  })

  it('uses /keycloak on same origin for other hosts', () => {
    vi.stubEnv('NEXT_PUBLIC_KEYCLOAK_URL', '')
    ;(globalThis as any).window = { location: { hostname: 'example.com', origin: 'https://example.com' } }
    expect(getKeycloakBaseUrl()).toBe('https://example.com/keycloak/')
    delete (globalThis as any).window
  })
})
