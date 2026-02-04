import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '~/test-utils/renderWithProviders'

vi.mock('../navbars/Navbar', () => ({
  __esModule: true,
  default: () => <div data-testid="navbar" />,
}))

vi.mock('../GlobalFooter', () => ({
  __esModule: true,
  default: () => <div data-testid="footer" />,
}))

vi.mock('~/utils/apiUtils', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    createProject: vi.fn(async () => ({ ok: true })),
  }
})

describe('MakeNewCoursePage', () => {
  it('shows the Illinois Chat migration notice when UI creation is disabled', async () => {
    const prev = process.env.NEXT_PUBLIC_USE_ILLINOIS_CHAT_CONFIG
    process.env.NEXT_PUBLIC_USE_ILLINOIS_CHAT_CONFIG = 'False'
    try {
      const MakeNewCoursePage = (await import('../MakeNewCoursePage')).default
      renderWithProviders(
        <MakeNewCoursePage
          project_name=""
          current_user_email="owner@example.com"
          is_new_course={true}
        />,
      )
      expect(
        await screen.findByText(/New project creation is currently disabled/i),
      ).toBeInTheDocument()
    } finally {
      process.env.NEXT_PUBLIC_USE_ILLINOIS_CHAT_CONFIG = prev
    }
  })

  it('creates a new project and routes to its dashboard when available', async () => {
    const user = userEvent.setup()
    const prev = process.env.NEXT_PUBLIC_USE_ILLINOIS_CHAT_CONFIG
    process.env.NEXT_PUBLIC_USE_ILLINOIS_CHAT_CONFIG = 'True'

    const router = await import('next/router')
    ;(router.default.push as any).mockClear?.()

    const apiUtils = await import('~/utils/apiUtils')
    ;(apiUtils as any).createProject.mockResolvedValueOnce({ ok: true })

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: any) => {
      const url = String(input?.url ?? input)
      if (url.includes('/api/UIUC-api/getCourseExists')) {
        return new Response(JSON.stringify(false), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    })

    try {
      const MakeNewCoursePage = (await import('../MakeNewCoursePage')).default
      renderWithProviders(
        <MakeNewCoursePage
          project_name="CS101"
          current_user_email="owner@example.com"
          is_new_course={true}
        />,
      )

      // Availability check should enable Create.
      const createBtn = await screen.findByRole('button', { name: /^Create$/i })
      await waitFor(() => expect(createBtn).not.toBeDisabled())

      await user.click(createBtn)
      await waitFor(() =>
        expect((apiUtils as any).createProject).toHaveBeenCalled(),
      )
      await waitFor(() => expect(router.default.push as any).toHaveBeenCalled())
    } finally {
      process.env.NEXT_PUBLIC_USE_ILLINOIS_CHAT_CONFIG = prev
    }
  })
})
