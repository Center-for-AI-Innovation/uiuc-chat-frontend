import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '~/test-utils/renderWithProviders'

vi.mock('../AuthMenu', () => ({
  AuthMenu: () => React.createElement('div', null, 'AuthMenu'),
}))

describe('GlobalHeader', () => {
  it('shows a skeleton while auth is loading', async () => {
    globalThis.__TEST_AUTH__ = { isLoading: true, isAuthenticated: false }
    const Header = (await import('../GlobalHeader')).default
    const { container } = renderWithProviders(<Header />)
    expect(container.querySelectorAll('.skeleton-box').length).toBeGreaterThan(0)
  })

  it('renders AuthMenu once loaded', async () => {
    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: true,
      user: { profile: { sub: 'u1', email: 'u1@example.com' } },
    }
    const Header = (await import('../GlobalHeader')).default
    renderWithProviders(<Header />)
    expect(await screen.findByText('AuthMenu')).toBeInTheDocument()
  })

  it('opens the hamburger menu on small screens', async () => {
    const user = userEvent.setup()
    const { LandingPageHeader } = await import('../GlobalHeader')

    const prevWidth = window.innerWidth
    ;(window as any).innerWidth = 500
    window.dispatchEvent(new Event('resize'))

    renderWithProviders(<LandingPageHeader />)
    await user.click(screen.getByRole('button', { name: /Open menu/i }))
    expect(await screen.findByText('Docs')).toBeInTheDocument()

    ;(window as any).innerWidth = prevWidth
    window.dispatchEvent(new Event('resize'))
  })
})
