import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '~/test-utils/renderWithProviders'

vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}))

import ProjectTable from '../ProjectTable'

describe('ProjectTable', () => {
  it('renders nothing when unauthenticated', () => {
    globalThis.__TEST_AUTH__ = { isAuthenticated: false, isLoading: false }
    const { container } = renderWithProviders(<ProjectTable />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows empty state when authenticated but has no projects', async () => {
    globalThis.__TEST_AUTH__ = {
      isAuthenticated: true,
      isLoading: false,
      user: { profile: { email: 'u@example.com' } },
    }
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    renderWithProviders(<ProjectTable />)
    expect(
      await screen.findByText(/You haven't created any projects yet/i),
    ).toBeInTheDocument()
  })

  it('renders a project row and navigates on click', async () => {
    const user = userEvent.setup()

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
          course_admins: ['admin@example.com', 'rohan13@illinois.edu'],
          is_private: true,
        },
      },
      {
        CS102: {
          course_owner: 'b@example.com',
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

    const open = vi.spyOn(window, 'open').mockImplementation(() => null as any)

    renderWithProviders(<ProjectTable />)

    expect(await screen.findByText('CS101')).toBeInTheDocument()
    expect(screen.getByText('Private')).toBeInTheDocument()

    // Click row navigates in same tab
    await user.click(screen.getByText('CS101'))
    await waitFor(() => {
      expect(globalThis.__TEST_ROUTER__?.push).toHaveBeenCalledWith(
        '/CS101/chat',
      )
    })

    // Cmd/Ctrl click opens new tab
    fireEvent.click(screen.getByText('CS101'), { metaKey: true })
    expect(open).toHaveBeenCalledWith('/CS101/chat', '_blank')
  })
})
