import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mocks must be defined before importing the component under test.
const useAuthMock = vi.fn()
vi.mock('react-oidc-context', () => ({
  useAuth: () => useAuthMock(),
}))
vi.mock('~/hooks/useRenewalWatchdog', () => ({
  useRenewalWatchdog: vi.fn(),
}))
const writeAccessTokenCookie = vi.fn()
vi.mock('~/utils/auth/accessTokenCookie', () => ({
  writeAccessTokenCookie: (token: string) => writeAccessTokenCookie(token),
}))

import { AuthCookie } from '../AuthCookie'

beforeEach(() => {
  useAuthMock.mockReset()
  writeAccessTokenCookie.mockReset()
})

describe('AuthCookie', () => {
  it('writes the cookie and renders children for an authenticated user', () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: true,
      user: { access_token: 'tok' },
    })

    render(
      <AuthCookie>
        <div>protected content</div>
      </AuthCookie>,
    )

    expect(screen.getByText('protected content')).toBeInTheDocument()
    expect(writeAccessTokenCookie).toHaveBeenCalledWith('tok')
  })

  it('renders children for an unauthenticated user without writing cookies', () => {
    useAuthMock.mockReturnValue({ isAuthenticated: false, user: undefined })

    render(
      <AuthCookie>
        <div>public content</div>
      </AuthCookie>,
    )

    expect(screen.getByText('public content')).toBeInTheDocument()
    expect(writeAccessTokenCookie).not.toHaveBeenCalled()
  })
})
