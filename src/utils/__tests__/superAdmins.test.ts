import { describe, expect, it } from 'vitest'
import { superAdmins } from '../superAdmins'

describe('superAdmins', () => {
  it('exports a list of emails', () => {
    expect(Array.isArray(superAdmins)).toBe(true)
    expect(superAdmins.length).toBeGreaterThan(0)
    expect(superAdmins[0]).toMatch(/@/)
  })
})

