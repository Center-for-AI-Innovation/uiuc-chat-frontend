import React from 'react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'

import { server } from '~/test-utils/server'
import { renderWithProviders } from '~/test-utils/renderWithProviders'

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn(),
    update: vi.fn(),
    hide: vi.fn(),
    clean: vi.fn(),
  },
}))

vi.mock('~/components/Layout/SettingsLayout', () => ({
  __esModule: true,
  default: ({ children }: any) => React.createElement('div', null, children),
  getInitialCollapsedState: () => false,
}))

vi.mock('../GlobalFooter', () => ({
  default: () => React.createElement('div', null, 'GlobalFooter'),
}))

vi.mock('../MainPageBackground', () => ({
  LoadingPlaceholderForAdminPages: () =>
    React.createElement(
      'div',
      { 'data-testid': 'loading-placeholder' },
      'Loading...',
    ),
}))

vi.mock('../N8nWorkflowsTable', () => ({
  N8nWorkflowsTable: () =>
    React.createElement('div', null, 'N8nWorkflowsTable'),
}))

declare global {
  // eslint-disable-next-line no-var
  var __TEST_N8N_WORKFLOWS__: any | undefined
}

const mockRefetch = vi.fn()

vi.mock('~/utils/functionCalling/handleFunctionCalling', () => ({
  useFetchAllWorkflows: () =>
    globalThis.__TEST_N8N_WORKFLOWS__ ?? {
      data: [],
      isSuccess: true,
      isError: false,
      refetch: mockRefetch,
    },
}))

vi.mock('~/utils/apiUtils', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    fetchCourseMetadata: vi.fn(async () => ({
      course_owner: 'owner@example.com',
      course_admins: ['admin@example.com'],
      is_private: false,
    })),
  }
})

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  globalThis.__TEST_N8N_WORKFLOWS__ = undefined
})

describe('N8NPage – loading and auth states', () => {
  it('shows loading placeholder when auth is loading', async () => {
    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/tools' }
    globalThis.__TEST_AUTH__ = {
      isLoading: true,
      isAuthenticated: false,
      user: null,
    }

    server.use(
      http.post('*/api/UIUC-api/getN8Napikey', async () => {
        return HttpResponse.json({ api_key: [] })
      }),
    )

    const MakeToolsPage = (await import('../N8NPage')).default
    renderWithProviders(<MakeToolsPage course_name="CS101" />)

    expect(screen.getByTestId('loading-placeholder')).toBeInTheDocument()
  })

  it('redirects to not_authorized when user is not owner or admin', async () => {
    const replaceFn = vi.fn()
    globalThis.__TEST_ROUTER__ = {
      asPath: '/CS101/tools',
      replace: replaceFn,
    }
    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: true,
      user: { profile: { email: 'stranger@example.com' } },
    }

    server.use(
      http.post('*/api/UIUC-api/getN8Napikey', async () => {
        return HttpResponse.json({ api_key: [] })
      }),
    )

    const MakeToolsPage = (await import('../N8NPage')).default
    renderWithProviders(<MakeToolsPage course_name="CS101" />)

    await waitFor(() => {
      expect(replaceFn).toHaveBeenCalledWith('/CS101/not_authorized')
    })

    expect(screen.getByText(/you cannot edit this page/i)).toBeInTheDocument()
  }, 15_000)

  it('renders page normally when user is an admin (not owner)', async () => {
    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/tools' }
    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: true,
      user: { profile: { email: 'admin@example.com' } },
    }

    server.use(
      http.post('*/api/UIUC-api/getN8Napikey', async () => {
        return HttpResponse.json({ api_key: [{ n8n_api_key: '' }] })
      }),
    )

    const MakeToolsPage = (await import('../N8NPage')).default
    renderWithProviders(<MakeToolsPage course_name="CS101" />)

    expect(
      await screen.findByRole('heading', { name: /Your n8n API Key/i }),
    ).toBeInTheDocument()
  }, 15_000)
})

describe('N8NPage – Illinois Chat config', () => {
  it('shows "Coming soon!" card when NEXT_PUBLIC_USE_ILLINOIS_CHAT_CONFIG is True', async () => {
    const original = process.env.NEXT_PUBLIC_USE_ILLINOIS_CHAT_CONFIG
    process.env.NEXT_PUBLIC_USE_ILLINOIS_CHAT_CONFIG = 'True'

    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/tools' }
    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: true,
      user: { profile: { email: 'owner@example.com' } },
    }

    server.use(
      http.post('*/api/UIUC-api/getN8Napikey', async () => {
        return HttpResponse.json({ api_key: [{ n8n_api_key: '' }] })
      }),
    )

    const MakeToolsPage = (await import('../N8NPage')).default
    renderWithProviders(<MakeToolsPage course_name="CS101" />)

    await waitFor(() => {
      expect(screen.getByText(/Coming soon!/i)).toBeInTheDocument()
    })

    process.env.NEXT_PUBLIC_USE_ILLINOIS_CHAT_CONFIG = original
  }, 15_000)
})

describe('N8NPage – API key fetch edge cases', () => {
  it('populates the textbox when an existing API key is returned', async () => {
    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/tools' }
    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: true,
      user: { profile: { email: 'owner@example.com' } },
    }

    server.use(
      http.post('*/api/UIUC-api/getN8Napikey', async () => {
        return HttpResponse.json({
          api_key: [{ n8n_api_key: 'pre-existing-key-123' }],
        })
      }),
    )

    const MakeToolsPage = (await import('../N8NPage')).default
    renderWithProviders(<MakeToolsPage course_name="CS101" />)

    const input = await screen.findByPlaceholderText(
      /Enter your n8n API Key here/i,
    )
    await waitFor(() => {
      expect(input).toHaveValue('pre-existing-key-123')
    })
  }, 15_000)

  it('warns and does not set key when API response has no key', async () => {
    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/tools' }
    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: true,
      user: { profile: { email: 'owner@example.com' } },
    }

    server.use(
      http.post('*/api/UIUC-api/getN8Napikey', async () => {
        return HttpResponse.json({ api_key: [] })
      }),
    )

    const MakeToolsPage = (await import('../N8NPage')).default
    renderWithProviders(<MakeToolsPage course_name="CS101" />)

    const input = await screen.findByPlaceholderText(
      /Enter your n8n API Key here/i,
    )
    expect(input).toHaveValue('')

    await waitFor(() => {
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('API key not found'),
        expect.anything(),
      )
    })
  }, 15_000)

  it('handles fetch error for getN8Napikey gracefully', async () => {
    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/tools' }
    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: true,
      user: { profile: { email: 'owner@example.com' } },
    }

    server.use(
      http.post('*/api/UIUC-api/getN8Napikey', async () => {
        return HttpResponse.error()
      }),
    )

    const MakeToolsPage = (await import('../N8NPage')).default
    renderWithProviders(<MakeToolsPage course_name="CS101" />)

    // Should still render the page (error is caught)
    expect(
      await screen.findByRole('heading', { name: /Your n8n API Key/i }),
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error getting course data'),
        expect.anything(),
      )
    })
  }, 15_000)
})

describe('N8NPage – API key form controls', () => {
  it('keeps save controls disabled when workflows are in an error state', async () => {
    const { notifications } = await import('@mantine/notifications')

    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/tools' }
    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: true,
      user: { profile: { email: 'owner@example.com' } },
    }

    globalThis.__TEST_N8N_WORKFLOWS__ = {
      data: null,
      isSuccess: false,
      isError: true,
      refetch: mockRefetch,
    }

    server.use(
      http.post('*/api/UIUC-api/getN8Napikey', async () => {
        return HttpResponse.json({ api_key: [{ n8n_api_key: '' }] })
      }),
      http.post('*/api/UIUC-api/tools/testN8nAPI', async () => {
        return HttpResponse.json({ ok: true }, { status: 200 })
      }),
      http.post('*/api/UIUC-api/tools/upsertN8nAPIKey', async () => {
        return HttpResponse.json({ ok: true }, { status: 200 })
      }),
    )

    const MakeToolsPage = (await import('../N8NPage')).default
    renderWithProviders(<MakeToolsPage course_name="CS101" />)

    const input = await screen.findByPlaceholderText(
      /Enter your n8n API Key here/i,
    )
    const saveButton = screen.getByRole('button', { name: /Save/i })
    expect(input).toBeDisabled()
    expect(saveButton).toBeDisabled()
    expect((notifications as any).show).not.toHaveBeenCalled()
  }, 20_000)

  it('keeps save controls disabled when workflows table is empty', async () => {
    const { notifications } = await import('@mantine/notifications')

    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/tools' }
    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: true,
      user: { profile: { email: 'owner@example.com' } },
    }

    globalThis.__TEST_N8N_WORKFLOWS__ = {
      data: null,
      isSuccess: true,
      isError: false,
      refetch: mockRefetch,
    }

    server.use(
      http.post('*/api/UIUC-api/getN8Napikey', async () => {
        return HttpResponse.json({ api_key: [{ n8n_api_key: '' }] })
      }),
      http.post('*/api/UIUC-api/tools/testN8nAPI', async () => {
        return HttpResponse.json({ ok: true }, { status: 200 })
      }),
      http.post('*/api/UIUC-api/tools/upsertN8nAPIKey', async () => {
        return HttpResponse.json({ ok: true }, { status: 200 })
      }),
    )

    const MakeToolsPage = (await import('../N8NPage')).default
    renderWithProviders(<MakeToolsPage course_name="CS101" />)

    const input = await screen.findByPlaceholderText(
      /Enter your n8n API Key here/i,
    )
    const saveButton = screen.getByRole('button', { name: /Save/i })
    expect(input).toBeDisabled()
    expect(saveButton).toBeDisabled()
    expect((notifications as any).show).not.toHaveBeenCalled()
  }, 20_000)

  it('keeps save controls disabled when upsert would fail', async () => {
    const { notifications } = await import('@mantine/notifications')

    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/tools' }
    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: true,
      user: { profile: { email: 'owner@example.com' } },
    }

    globalThis.__TEST_N8N_WORKFLOWS__ = {
      data: [{ id: 1 }],
      isSuccess: true,
      isError: false,
      refetch: mockRefetch,
    }

    server.use(
      http.post('*/api/UIUC-api/getN8Napikey', async () => {
        return HttpResponse.json({ api_key: [{ n8n_api_key: '' }] })
      }),
      http.post('*/api/UIUC-api/tools/testN8nAPI', async () => {
        return HttpResponse.json({ ok: true }, { status: 200 })
      }),
      http.post('*/api/UIUC-api/tools/upsertN8nAPIKey', async () => {
        return HttpResponse.json({ error: 'Internal error' }, { status: 500 })
      }),
    )

    const MakeToolsPage = (await import('../N8NPage')).default
    renderWithProviders(<MakeToolsPage course_name="CS101" />)

    const input = await screen.findByPlaceholderText(
      /Enter your n8n API Key here/i,
    )
    const saveButton = screen.getByRole('button', { name: /Save/i })
    expect(input).toBeDisabled()
    expect(saveButton).toBeDisabled()
    expect((notifications as any).show).not.toHaveBeenCalled()
  }, 20_000)

  it('keeps save controls disabled even when upsert would succeed', async () => {
    const { notifications } = await import('@mantine/notifications')

    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/tools' }
    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: true,
      user: { profile: { email: 'owner@example.com' } },
    }

    globalThis.__TEST_N8N_WORKFLOWS__ = {
      data: [{ id: 1 }],
      isSuccess: true,
      isError: false,
      refetch: mockRefetch,
    }

    server.use(
      http.post('*/api/UIUC-api/getN8Napikey', async () => {
        return HttpResponse.json({ api_key: [{ n8n_api_key: '' }] })
      }),
      http.post('*/api/UIUC-api/tools/testN8nAPI', async () => {
        return HttpResponse.json({ ok: true }, { status: 200 })
      }),
      http.post('*/api/UIUC-api/tools/upsertN8nAPIKey', async () => {
        return HttpResponse.json({ ok: true }, { status: 200 })
      }),
    )

    const MakeToolsPage = (await import('../N8NPage')).default
    renderWithProviders(<MakeToolsPage course_name="CS101" />)

    const input = await screen.findByPlaceholderText(
      /Enter your n8n API Key here/i,
    )
    const saveButton = screen.getByRole('button', { name: /Save/i })
    expect(input).toBeDisabled()
    expect(saveButton).toBeDisabled()
    expect((notifications as any).show).not.toHaveBeenCalled()
  }, 20_000)
})

describe('N8NPage – usage instructions accordion', () => {
  it('shows usage instructions when API key is present and workflows exist', async () => {
    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/tools' }
    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: true,
      user: { profile: { email: 'owner@example.com' } },
    }

    server.use(
      http.post('*/api/UIUC-api/getN8Napikey', async () => {
        return HttpResponse.json({
          api_key: [{ n8n_api_key: 'existing-key' }],
        })
      }),
    )

    const MakeToolsPage = (await import('../N8NPage')).default
    renderWithProviders(<MakeToolsPage course_name="CS101" />)

    // Wait for the key to be loaded and the usage instructions accordion to appear
    await waitFor(() => {
      expect(screen.getByText(/Usage Instructions/i)).toBeInTheDocument()
    })

    // The "Create/Edit Workflows" button should be enabled when n8nApiKey is set
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Create\/Edit Workflows/i }),
      ).not.toBeDisabled()
    })
  }, 15_000)

  it('opens n8n workflows URL when "Create/Edit Workflows" button is clicked', async () => {
    const user = userEvent.setup()
    const windowOpenSpy = vi
      .spyOn(window, 'open')
      .mockImplementation(() => null)

    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/tools' }
    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: true,
      user: { profile: { email: 'owner@example.com' } },
    }

    server.use(
      http.post('*/api/UIUC-api/getN8Napikey', async () => {
        return HttpResponse.json({
          api_key: [{ n8n_api_key: 'existing-key' }],
        })
      }),
    )

    const MakeToolsPage = (await import('../N8NPage')).default
    renderWithProviders(<MakeToolsPage course_name="CS101" />)

    const btn = await screen.findByRole('button', {
      name: /Create\/Edit Workflows/i,
    })
    await waitFor(() => {
      expect(btn).not.toBeDisabled()
    })

    await user.click(btn)

    expect(windowOpenSpy).toHaveBeenCalledWith(
      'https://tools.uiuc.chat/workflows',
      '_blank',
    )

    windowOpenSpy.mockRestore()
  }, 15_000)

  it('disables "Create/Edit Workflows" button when no API key', async () => {
    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/tools' }
    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: true,
      user: { profile: { email: 'owner@example.com' } },
    }

    server.use(
      http.post('*/api/UIUC-api/getN8Napikey', async () => {
        return HttpResponse.json({ api_key: [{ n8n_api_key: '' }] })
      }),
    )

    const MakeToolsPage = (await import('../N8NPage')).default
    renderWithProviders(<MakeToolsPage course_name="CS101" />)

    const btn = await screen.findByRole('button', {
      name: /Create\/Edit Workflows/i,
    })
    expect(btn).toBeDisabled()
  }, 15_000)
})

describe('N8NPage – metadata with is_private', () => {
  it('parses is_private as a JSON string from metadata', async () => {
    const { fetchCourseMetadata } = await import('~/utils/apiUtils')
    ;(fetchCourseMetadata as any).mockResolvedValueOnce({
      course_owner: 'owner@example.com',
      course_admins: [],
      is_private: 'true',
    })

    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/tools' }
    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: true,
      user: { profile: { email: 'owner@example.com' } },
    }

    server.use(
      http.post('*/api/UIUC-api/getN8Napikey', async () => {
        return HttpResponse.json({ api_key: [{ n8n_api_key: '' }] })
      }),
    )

    const MakeToolsPage = (await import('../N8NPage')).default
    renderWithProviders(<MakeToolsPage course_name="CS101" />)

    // Should render normally (is_private is parsed but doesn't block rendering for owners)
    expect(
      await screen.findByRole('heading', { name: /Your n8n API Key/i }),
    ).toBeInTheDocument()
  }, 15_000)

  it('handles fetchCourseMetadata throwing an error gracefully', async () => {
    const { fetchCourseMetadata } = await import('~/utils/apiUtils')
    ;(fetchCourseMetadata as any).mockRejectedValueOnce(
      new Error('Network error'),
    )

    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/tools' }
    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: true,
      user: { profile: { email: 'owner@example.com' } },
    }

    server.use(
      http.post('*/api/UIUC-api/getN8Napikey', async () => {
        return HttpResponse.json({ api_key: [] })
      }),
    )

    const MakeToolsPage = (await import('../N8NPage')).default
    renderWithProviders(<MakeToolsPage course_name="CS101" />)

    // courseMetadata stays null => shows loading placeholder
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled()
    })

    expect(screen.getByTestId('loading-placeholder')).toBeInTheDocument()
  }, 15_000)
})
