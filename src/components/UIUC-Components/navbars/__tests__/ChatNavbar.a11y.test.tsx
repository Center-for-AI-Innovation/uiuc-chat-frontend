import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '~/test-utils/renderWithProviders'

vi.mock('@mantine/core', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    Burger: ({ onClick, opened }: any) => (
      <button type="button" aria-label="burger" onClick={onClick}>
        {opened ? 'burger-open' : 'burger-closed'}
      </button>
    ),
    Transition: ({ mounted, children }: any) =>
      mounted ? <div data-testid="hamburger-menu">{children({})}</div> : null,
  }
})

vi.mock('../ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}))

vi.mock('./AuthMenu', () => ({
  AuthMenu: () => <div data-testid="auth-menu" />,
}))

vi.mock('~/components/Chat/UserSettings', () => ({
  UserSettings: () => <div data-testid="user-settings" />,
}))

describe('ChatNavbar - accessibility', () => {
  it('all interactive buttons have accessible labels', async () => {
    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: false,
      user: null,
    }
    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/chat', push: vi.fn() }

    const ChatNavbar = (await import('../ChatNavbar')).default
    renderWithProviders(<ChatNavbar bannerUrl="" isgpt4 />, {
      homeState: { showModelSettings: false } as any,
      homeContext: {
        dispatch: vi.fn(),
        handleNewConversation: vi.fn(),
      },
    })

    expect(
      screen.getByRole('button', { name: /Start a new chat/i }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('button', {
        name: /Open or close show model settings/i,
      }),
    ).toBeInTheDocument()
  })
})
