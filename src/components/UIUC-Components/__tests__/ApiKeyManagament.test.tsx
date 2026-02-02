import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'

import { server } from '~/test-utils/server'
import { renderWithProviders } from '~/test-utils/renderWithProviders'

vi.mock('@mantine/notifications', () => ({
  showNotification: vi.fn(),
}))

vi.mock('~/utils/apiUtils', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    fetchCourseMetadata: vi.fn(async () => ({ system_prompt: 'sys' })),
  }
})

vi.mock('../APIRequestBuilder', () => ({
  default: () => <div>APIRequestBuilder</div>,
}))

describe('ApiKeyManagament', () => {
  it('shows Generate API Key when authenticated and no key exists, then generates, copies, rotates, and deletes', async () => {
    const user = userEvent.setup()
    const { showNotification } = await import('@mantine/notifications')

    let currentKey: string | null = null
    server.use(
      http.get('*/api/chat-api/keys/fetch*', async () => {
        return HttpResponse.json({ apiKey: currentKey })
      }),
      http.post('*/api/chat-api/keys/generate*', async () => {
        currentKey = 'key-generated'
        return HttpResponse.json({ apiKey: currentKey })
      }),
      http.put('*/api/chat-api/keys/rotate*', async () => {
        currentKey = 'key-rotated'
        return HttpResponse.json({ newApiKey: currentKey })
      }),
      http.delete('*/api/chat-api/keys/delete*', async () => {
        currentKey = null
        return HttpResponse.json({ ok: true })
      }),
    )

    const ApiKeyManagament = (await import('../ApiKeyManagament')).default
    renderWithProviders(
      <ApiKeyManagament
        course_name="CS101"
        auth={{ isAuthenticated: true } as any}
        sidebarCollapsed={false}
      />,
      { homeContext: { dispatch: vi.fn() } },
    )

    await user.click(await screen.findByRole('button', { name: /Generate API Key/i }))
    await waitFor(() =>
      expect(showNotification as any).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Success' }),
      ),
    )

    // Copy button appears once an API key exists.
    const copyBtn = await screen.findByRole('button', { name: /Copy API key/i })
    await user.click(copyBtn)

    await user.click(screen.getByRole('button', { name: /Rotate API Key/i }))
    await waitFor(() =>
      expect(showNotification as any).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'API key rotated successfully.' }),
      ),
    )

    await user.click(screen.getByRole('button', { name: /Delete API Key/i }))
    await waitFor(() =>
      expect(showNotification as any).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'API key deleted successfully.' }),
      ),
    )
  })

  it('does not fetch a key when unauthenticated', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const ApiKeyManagament = (await import('../ApiKeyManagament')).default

    renderWithProviders(
      <ApiKeyManagament
        course_name="CS101"
        auth={{ isAuthenticated: false } as any}
        sidebarCollapsed={false}
      />,
      { homeContext: { dispatch: vi.fn() } },
    )

    expect(fetchSpy.mock.calls.some(([url]) => String(url).includes('/api/chat-api/keys/fetch'))).toBe(false)
  })
})

