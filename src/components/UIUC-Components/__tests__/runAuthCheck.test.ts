import { describe, expect, it } from 'vitest'
import { get_user_permission } from '../runAuthCheck'

function makeAuth(overrides: Partial<any> = {}) {
  return {
    isLoading: false,
    isAuthenticated: false,
    error: null,
    user: null,
    ...overrides,
  }
}

describe('get_user_permission', () => {
  it('throws when course metadata is missing/empty', () => {
    expect(() => get_user_permission({} as any, makeAuth())).toThrow(
      'No course metadata',
    )
  })

  it('returns no_permission while auth is loading or erroring', () => {
    expect(
      get_user_permission(
        { is_private: true } as any,
        makeAuth({ isLoading: true }),
      ),
    ).toBe('no_permission')

    expect(
      get_user_permission(
        { is_private: true } as any,
        makeAuth({ error: new Error('boom') }),
      ),
    ).toBe('no_permission')
  })

  it('handles public course permissions', () => {
    const meta: any = {
      is_private: false,
      course_owner: 'owner@example.com',
      course_admins: ['admin@example.com'],
    }

    expect(
      get_user_permission(meta, makeAuth({ isAuthenticated: false })),
    ).toBe('view')
    expect(
      get_user_permission(
        meta,
        makeAuth({
          isAuthenticated: true,
          user: { profile: { email: 'owner@example.com' } },
        }),
      ),
    ).toBe('edit')
    expect(
      get_user_permission(
        meta,
        makeAuth({
          isAuthenticated: true,
          user: { profile: { email: 'someone@example.com' } },
        }),
      ),
    ).toBe('view')
  })

  it('handles private course permissions', () => {
    const meta: any = {
      is_private: true,
      course_owner: 'owner@example.com',
      course_admins: ['admin@example.com'],
      approved_emails_list: ['approved@example.com'],
      allow_logged_in_users: false,
    }

    expect(
      get_user_permission(meta, makeAuth({ isAuthenticated: false })),
    ).toBe('no_permission')
    expect(
      get_user_permission(
        meta,
        makeAuth({
          isAuthenticated: true,
          user: { profile: { email: 'owner@example.com' } },
        }),
      ),
    ).toBe('edit')
    expect(
      get_user_permission(
        meta,
        makeAuth({
          isAuthenticated: true,
          user: { profile: { email: 'admin@example.com' } },
        }),
      ),
    ).toBe('edit')
    expect(
      get_user_permission(
        meta,
        makeAuth({
          isAuthenticated: true,
          user: { profile: { email: 'approved@example.com' } },
        }),
      ),
    ).toBe('view')
    expect(
      get_user_permission(
        { ...meta, allow_logged_in_users: true },
        makeAuth({
          isAuthenticated: true,
          user: { profile: { email: 'x@example.com' } },
        }),
      ),
    ).toBe('view')
    expect(
      get_user_permission(
        meta,
        makeAuth({
          isAuthenticated: true,
          user: { profile: { email: 'x@example.com' } },
        }),
      ),
    ).toBe('no_permission')
  })
})
