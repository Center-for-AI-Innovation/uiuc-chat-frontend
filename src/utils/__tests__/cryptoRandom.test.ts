import { describe, expect, it, vi } from 'vitest'
import {
  generateAnonymousUserId,
  generateSecureBase36String,
  generateSecureKey,
  generateSecureRandomString,
} from '../cryptoRandom'

describe('cryptoRandom utilities', () => {
  const mockGetRandomValuesFill = (value: number) =>
    ((arr: any) => {
      if (arr?.fill) arr.fill(value)
      return arr
    }) as unknown as typeof globalThis.crypto.getRandomValues

  it('generateSecureRandomString uses crypto.getRandomValues', () => {
    vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(
      mockGetRandomValuesFill(0),
    )

    expect(generateSecureRandomString(5)).toBe('AAAAA')
    expect(generateSecureRandomString(3, 'XYZ')).toBe('XXX')
    expect(generateSecureRandomString(3, 'ABC', true)).toBe('aaa')
    expect(generateSecureRandomString(3, '')).toBe('AAA')
  })

  it('generateAnonymousUserId includes prefix and timestamp', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(42))
    vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(
      mockGetRandomValuesFill(0),
    )

    expect(generateAnonymousUserId()).toBe('anon_AAAAAAAAA_42')
    vi.useRealTimers()
  })

  it('generateSecureKey delegates to crypto.randomUUID', () => {
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('uuid-123')
    expect(generateSecureKey()).toBe('uuid-123')
  })

  it('generateSecureBase36String returns the requested length', () => {
    vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(
      mockGetRandomValuesFill(35), // 35 => 'z' in base36
    )

    expect(generateSecureBase36String(10)).toBe('zzzzzzzzzz')
  })

  it('generateSecureBase36String returns empty string for non-positive length', () => {
    expect(generateSecureBase36String(0)).toBe('')
    expect(generateSecureBase36String(-1)).toBe('')
  })

  it('generateSecureRandomString returns empty string for non-positive length', () => {
    expect(generateSecureRandomString(0)).toBe('')
    expect(generateSecureRandomString(-1)).toBe('')
  })
})
