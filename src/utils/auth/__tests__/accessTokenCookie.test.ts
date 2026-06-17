import { describe, it, expect, beforeEach } from 'vitest'
import {
  writeAccessTokenCookie,
  clearAccessTokenCookie,
  ACCESS_TOKEN_COOKIE,
} from '../accessTokenCookie'

function cookieMap(): Record<string, string> {
  const map: Record<string, string> = {}
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    map[trimmed.slice(0, eq)] = decodeURIComponent(trimmed.slice(eq + 1))
  }
  return map
}

function clearAllCookies(): void {
  for (const part of document.cookie.split(';')) {
    const name = part.trim().split('=')[0]
    if (name) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
    }
  }
}

beforeEach(() => clearAllCookies())

describe('accessTokenCookie', () => {
  it('writes the access token to a single cookie', () => {
    writeAccessTokenCookie('header.payload.signature')
    expect(cookieMap()[ACCESS_TOKEN_COOKIE]).toBe('header.payload.signature')
  })

  it('overwrites the cookie when the token is renewed', () => {
    writeAccessTokenCookie('old.token')
    writeAccessTokenCookie('new.token')
    expect(cookieMap()[ACCESS_TOKEN_COOKIE]).toBe('new.token')
  })

  it('clears the access-token cookie', () => {
    writeAccessTokenCookie('a.b.c')
    clearAccessTokenCookie()
    expect(cookieMap()[ACCESS_TOKEN_COOKIE]).toBeUndefined()
  })
})
