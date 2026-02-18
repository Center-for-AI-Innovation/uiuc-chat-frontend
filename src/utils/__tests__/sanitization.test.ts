import { describe, expect, it } from 'vitest'
import { sanitizeForLogging, sanitizeText } from '../sanitization'

describe('sanitizeText', () => {
  it('removes null bytes in multiple forms', () => {
    const input = `a\u0000b\\u0000c\0d`
    expect(sanitizeText(input)).toBe('abcd')
  })
})

describe('sanitizeForLogging', () => {
  it('recursively sanitizes string values in objects and arrays', () => {
    const input = {
      ok: 'hi',
      bad: 'a\u0000b',
      nested: [{ value: 'x\\u0000y' }, 123, null],
    }

    const sanitized = sanitizeForLogging(input)
    expect(sanitized).toEqual({
      ok: 'hi',
      bad: 'ab',
      nested: [{ value: 'xy' }, 123, null],
    })
  })

  it('returns non-string primitives unchanged', () => {
    expect(sanitizeForLogging(123)).toBe(123)
    expect(sanitizeForLogging(null)).toBeNull()
    expect(sanitizeForLogging(undefined)).toBeUndefined()
    expect(sanitizeForLogging(true)).toBe(true)
  })
})
