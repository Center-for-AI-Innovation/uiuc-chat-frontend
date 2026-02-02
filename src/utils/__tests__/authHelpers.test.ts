import { describe, expect, it, vi } from 'vitest'
import { getKeycloakBaseFromHost, getKeycloakBaseUrl, initiateSignIn } from '../authHelpers'

function decodeBase64Url(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  return atob(padded)
}

describe('initiateSignIn', () => {
  it('passes URL-safe base64 state to signinRedirect', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(1234))

    const auth = { signinRedirect: vi.fn().mockResolvedValue('ok') }
    initiateSignIn(auth, '/course/CS101')

    expect(auth.signinRedirect).toHaveBeenCalledTimes(1)
    const state = auth.signinRedirect.mock.calls[0]?.[0]?.state as string
    expect(state).toBeTruthy()
    expect(state).not.toMatch(/[+/=]/)

    const decoded = JSON.parse(decodeBase64Url(state))
    expect(decoded.redirect).toBe('/course/CS101')
    expect(decoded.timestamp).toBe(1234)

    vi.useRealTimers()
  })
})

describe('keycloak base URL helpers', () => {
  it('getKeycloakBaseFromHost handles common hostnames', () => {
    expect(getKeycloakBaseFromHost('localhost')).toBe('http://localhost:8080/')
    expect(getKeycloakBaseFromHost('uiuc.chat')).toBe('https://login.uiuc.chat/')
    expect(getKeycloakBaseFromHost('example.com')).toBe('https://example.com/keycloak/')
  })

  it('getKeycloakBaseFromHost prefers NEXT_PUBLIC_KEYCLOAK_URL when set', () => {
    vi.stubEnv('NEXT_PUBLIC_KEYCLOAK_URL', 'https://override.example/')
    expect(getKeycloakBaseFromHost('example.com')).toBe('https://override.example/')
    vi.stubEnv('NEXT_PUBLIC_KEYCLOAK_URL', '')
  })

  it('getKeycloakBaseUrl prefers NEXT_PUBLIC_KEYCLOAK_URL when set', () => {
    vi.stubEnv('NEXT_PUBLIC_KEYCLOAK_URL', 'https://override.example/')
    expect(getKeycloakBaseUrl()).toBe('https://override.example/')
  })
})
