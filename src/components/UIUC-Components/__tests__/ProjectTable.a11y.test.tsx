import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'

import { renderWithProviders } from '~/test-utils/renderWithProviders'

vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}))

import ProjectTable from '../ProjectTable'

describe('ProjectTable - accessibility', () => {
  it('project rows are keyboard-accessible with Enter and Space', async () => {
    globalThis.__TEST_AUTH__ = {
      isAuthenticated: true,
      isLoading: false,
      user: { profile: { email: 'u@example.com' } },
    }
    globalThis.__TEST_ROUTER__ = { push: vi.fn() }

    const projects = [
      {
        CS101: {
          course_owner: 'owner@example.com',
          course_admins: [],
          is_private: false,
        },
      },
    ]

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(projects), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    renderWithProviders(<ProjectTable />)

    const row = await screen.findByRole('row', { name: /CS101/i })
    expect(row).toBeInTheDocument()
    expect(row).toHaveAttribute('tabindex', '0')

    fireEvent.keyDown(row, { key: 'Enter' })
    await waitFor(() =>
      expect(globalThis.__TEST_ROUTER__?.push).toHaveBeenCalledWith(
        '/CS101/chat',
      ),
    )
    ;(globalThis.__TEST_ROUTER__?.push as any).mockClear()
    fireEvent.keyDown(row, { key: ' ' })
    await waitFor(() =>
      expect(globalThis.__TEST_ROUTER__?.push).toHaveBeenCalledWith(
        '/CS101/chat',
      ),
    )
  })
})
