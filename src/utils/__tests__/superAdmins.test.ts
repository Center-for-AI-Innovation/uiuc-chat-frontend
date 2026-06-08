import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('superAdmins', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('exports a list of emails (hardcoded baseline)', async () => {
    vi.stubEnv('SUPER_ADMIN_EMAILS', '')
    const { superAdmins } = await import('../superAdmins')
    expect(Array.isArray(superAdmins)).toBe(true)
    expect(superAdmins.length).toBeGreaterThan(0)
    expect(superAdmins[0]).toMatch(/@/)
  })

  it('lowercases env-provided emails and de-dupes against the hardcoded list', async () => {
    vi.stubEnv(
      'SUPER_ADMIN_EMAILS',
      'Foo@Example.com,  bar@example.com  ,  ROHAN13@illinois.edu',
    )
    const { superAdmins } = await import('../superAdmins')
    expect(superAdmins).toContain('foo@example.com')
    expect(superAdmins).toContain('bar@example.com')
    // duplicate of the hardcoded entry, post-lowercase
    expect(
      superAdmins.filter((e) => e === 'rohan13@illinois.edu'),
    ).toHaveLength(1)
  })

  it('isSuperAdmin matches case-insensitively and rejects empties', async () => {
    vi.stubEnv('SUPER_ADMIN_EMAILS', 'admin@example.com')
    const { isSuperAdmin } = await import('../superAdmins')
    expect(isSuperAdmin('admin@example.com')).toBe(true)
    expect(isSuperAdmin('ADMIN@example.com')).toBe(true)
    expect(isSuperAdmin('Rohan13@Illinois.edu')).toBe(true)
    expect(isSuperAdmin('stranger@example.com')).toBe(false)
    expect(isSuperAdmin('')).toBe(false)
    expect(isSuperAdmin(null)).toBe(false)
    expect(isSuperAdmin(undefined)).toBe(false)
  })
})
