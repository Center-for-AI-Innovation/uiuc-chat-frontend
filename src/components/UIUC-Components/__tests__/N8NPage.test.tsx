import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
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
    React.createElement('div', null, 'Loading...'),
}))

vi.mock('../N8nWorkflowsTable', () => ({
  N8nWorkflowsTable: () => React.createElement('div', null, 'N8nWorkflowsTable'),
}))

declare global {
  // eslint-disable-next-line no-var
  var __TEST_N8N_WORKFLOWS__: any | undefined
}

vi.mock('~/utils/functionCalling/handleFunctionCalling', () => ({
  useFetchAllWorkflows: () =>
    globalThis.__TEST_N8N_WORKFLOWS__ ?? {
      data: [],
      isSuccess: true,
      isError: false,
      refetch: vi.fn(),
    },
}))

vi.mock('~/utils/apiUtils', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    fetchCourseMetadata: vi.fn(async () => ({
      course_owner: 'owner@example.com',
      course_admins: [],
      is_private: false,
    })),
  }
})

describe('N8NPage', () => {
  it('renders and saves an API key', async () => {
    const user = userEvent.setup()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})

    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/tools' }
    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: true,
      user: { profile: { email: 'owner@example.com' } },
    }

    let testedKey = false
    let upsertedKey = false

    server.use(
      http.post('*/api/UIUC-api/getN8Napikey', async () => {
        return HttpResponse.json({ api_key: [{ n8n_api_key: '' }] })
      }),
      http.post('*/api/UIUC-api/tools/testN8nAPI', async () => {
        testedKey = true
        return HttpResponse.json({ ok: true }, { status: 200 })
      }),
      http.post('*/api/UIUC-api/tools/upsertN8nAPIKey', async () => {
        upsertedKey = true
        return HttpResponse.json({ ok: true }, { status: 200 })
      }),
    )

    const MakeToolsPage = (await import('../N8NPage')).default
    renderWithProviders(<MakeToolsPage course_name="CS101" />)

    expect(
      await screen.findByRole('heading', { name: /Your n8n API Key/i }),
    ).toBeInTheDocument()

    await user.type(
      screen.getByPlaceholderText(/Enter your n8n API Key here/i),
      'test-key',
    )
    await user.click(screen.getByRole('button', { name: /Save/i }))

    expect(testedKey).toBe(true)
    expect(upsertedKey).toBe(true)
  }, 20_000)

  it('shows an error toast and does not upsert when the key test fails', async () => {
    const user = userEvent.setup()
    const { notifications } = await import('@mantine/notifications')

    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/tools' }
    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: true,
      user: { profile: { email: 'owner@example.com' } },
    }

    let upsertedKey = false
    server.use(
      http.post('*/api/UIUC-api/getN8Napikey', async () => {
        return HttpResponse.json({ api_key: [{ n8n_api_key: '' }] })
      }),
      http.post('*/api/UIUC-api/tools/testN8nAPI', async () => {
        return HttpResponse.json({ ok: false }, { status: 500 })
      }),
      http.post('*/api/UIUC-api/tools/upsertN8nAPIKey', async () => {
        upsertedKey = true
        return HttpResponse.json({ ok: true }, { status: 200 })
      }),
    )

    const MakeToolsPage = (await import('../N8NPage')).default
    renderWithProviders(<MakeToolsPage course_name="CS101" />)

    await user.type(
      await screen.findByPlaceholderText(/Enter your n8n API Key here/i),
      'bad-key',
    )
    await user.click(screen.getByRole('button', { name: /Save/i }))

    expect((notifications as any).show).toHaveBeenCalled()
    expect(upsertedKey).toBe(false)
  }, 20_000)

  it('allows saving an empty key and marks the workflow table as empty', async () => {
    const user = userEvent.setup()
    const { notifications } = await import('@mantine/notifications')

    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/tools' }
    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: true,
      user: { profile: { email: 'owner@example.com' } },
    }

    globalThis.__TEST_N8N_WORKFLOWS__ = {
      data: [],
      isSuccess: true,
      isError: false,
      refetch: vi.fn(),
    }

    server.use(
      http.post('*/api/UIUC-api/getN8Napikey', async () => {
        return HttpResponse.json({ api_key: [{ n8n_api_key: 'existing' }] })
      }),
      http.post('*/api/UIUC-api/tools/upsertN8nAPIKey', async () => {
        return HttpResponse.json({ ok: true }, { status: 200 })
      }),
    )

    const MakeToolsPage = (await import('../N8NPage')).default
    renderWithProviders(<MakeToolsPage course_name="CS101" />)

    const input = await screen.findByPlaceholderText(/Enter your n8n API Key here/i)
    await user.clear(input)
    await user.click(screen.getByRole('button', { name: /Save/i }))

    expect((notifications as any).show).toHaveBeenCalled()
    globalThis.__TEST_N8N_WORKFLOWS__ = undefined
  }, 20_000)
})
