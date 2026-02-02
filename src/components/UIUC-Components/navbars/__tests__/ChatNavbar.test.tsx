import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

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

describe('ChatNavbar', () => {
  it('shows admin dashboard button for owners and routes on click', async () => {
    const user = userEvent.setup()

    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: true,
      user: { profile: { email: 'owner@example.com', sub: 'sub' } },
    }
    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/chat', push: vi.fn() }

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          course_metadata: {
            course_owner: 'owner@example.com',
            course_admins: [],
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )

    const ChatNavbar = (await import('../ChatNavbar')).default

    const dispatch = vi.fn()
    renderWithProviders(<ChatNavbar bannerUrl="" isgpt4 />, {
      homeState: { showModelSettings: false } as any,
      homeContext: {
        dispatch,
        handleNewConversation: vi.fn(),
      },
    })

    const dashboardButton = await screen.findByRole('button', {
      name: /Go to dashboard/i,
    })
    await user.click(dashboardButton)

    await waitFor(() =>
      expect(globalThis.__TEST_ROUTER__?.push).toHaveBeenCalledWith(
        '/CS101/dashboard',
      ),
    )
  })

  it('fires new chat and settings actions', async () => {
    const user = userEvent.setup()
    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: false,
      user: null,
    }
    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/chat', push: vi.fn() }

    const ChatNavbar = (await import('../ChatNavbar')).default
    const dispatch = vi.fn()
    const handleNewConversation = vi.fn()

    renderWithProviders(<ChatNavbar bannerUrl="" isgpt4 />, {
      homeState: { showModelSettings: false } as any,
      homeContext: {
        dispatch,
        handleNewConversation,
      },
    })

    await user.click(screen.getByRole('button', { name: /Start a new chat/i }))
    expect(handleNewConversation).toHaveBeenCalled()

    await user.click(
      screen.getByRole('button', {
        name: /Open or close show model settings/i,
      }),
    )
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        field: 'showModelSettings',
        value: true,
      }),
    )
  })

  it('supports hamburger menu actions on small screens', async () => {
    const user = userEvent.setup()
    window.innerWidth = 400

    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: true,
      user: { profile: { email: 'owner@example.com', sub: 'sub' } },
    }
    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/chat', push: vi.fn() }

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          course_metadata: {
            course_owner: 'owner@example.com',
            course_admins: [],
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )

    const ChatNavbar = (await import('../ChatNavbar')).default
    const dispatch = vi.fn()
    const handleNewConversation = vi.fn()

    renderWithProviders(<ChatNavbar bannerUrl="" isgpt4 />, {
      homeState: { showModelSettings: false } as any,
      homeContext: { dispatch, handleNewConversation } as any,
    })

    await user.click(screen.getByRole('button', { name: /burger/i }))
    const menu = await screen.findByTestId('hamburger-menu')
    await user.click(within(menu).getByText(/New Chat/i))
    expect(handleNewConversation).toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: /burger/i }))
    const menu2 = await screen.findByTestId('hamburger-menu')
    await user.click(within(menu2).getByText(/^Settings$/i))
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ field: 'showModelSettings' }),
    )
  })

  it('hides the banner image on load error', async () => {
    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: false,
      user: null,
    }
    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/chat', push: vi.fn() }

    const ChatNavbar = (await import('../ChatNavbar')).default
    renderWithProviders(
      <ChatNavbar bannerUrl="http://example.com/banner.png" isgpt4 />,
      {
        homeState: { showModelSettings: false } as any,
        homeContext: {
          dispatch: vi.fn(),
          handleNewConversation: vi.fn(),
        } as any,
      },
    )

    const img = await screen.findByRole('img', {
      name: /course creator uploaded a logo/i,
    })
    expect(img).toBeInTheDocument()
    img.dispatchEvent(new Event('error'))
    expect((img as HTMLImageElement).style.display).toBe('none')
  })

  it('auto-closes the hamburger menu on resize', async () => {
    const user = userEvent.setup()
    window.innerWidth = 400

    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: true,
      user: { profile: { email: 'owner@example.com', sub: 'sub' } },
    }
    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/chat', push: vi.fn() }

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          course_metadata: {
            course_owner: 'owner@example.com',
            course_admins: [],
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )

    const ChatNavbar = (await import('../ChatNavbar')).default
    renderWithProviders(<ChatNavbar bannerUrl="" isgpt4 />, {
      homeState: { showModelSettings: false } as any,
      homeContext: { dispatch: vi.fn(), handleNewConversation: vi.fn() } as any,
    })

    await user.click(screen.getByRole('button', { name: /burger/i }))
    expect(await screen.findByTestId('hamburger-menu')).toBeInTheDocument()

    window.innerWidth = 1000
    window.dispatchEvent(new Event('resize'))

    await waitFor(() =>
      expect(screen.queryByTestId('hamburger-menu')).not.toBeInTheDocument(),
    )
  })
})
