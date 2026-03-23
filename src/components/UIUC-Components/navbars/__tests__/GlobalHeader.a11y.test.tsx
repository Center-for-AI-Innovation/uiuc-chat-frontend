import React from 'react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '~/test-utils/renderWithProviders'

vi.mock('../AuthMenu', () => ({
  AuthMenu: () => React.createElement('div', null, 'AuthMenu'),
}))

describe('GlobalHeader - accessibility', () => {
  it('desktop navigation has role="navigation" landmark', async () => {
    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: true,
      user: { profile: { sub: 'u1', email: 'u1@example.com' } },
    }
    const { LandingPageHeader } = await import('../GlobalHeader')
    const { container } = renderWithProviders(<LandingPageHeader />)

    const nav = container.querySelector('[role="navigation"]')
    expect(nav).toBeTruthy()
    expect(nav?.getAttribute('aria-label')).toBe('Main')
  })
})
