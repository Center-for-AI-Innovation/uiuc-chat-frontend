import { describe, expect, it } from 'vitest'
import { cleanSourceText } from '../google'

describe('cleanSourceText', () => {
  it('normalizes whitespace and newlines for search sources', () => {
    const input = '  a\n\n\n\n\tb\n\n c   d  '
    expect(cleanSourceText(input)).toBe('a \nb  c  d')
  })
})
