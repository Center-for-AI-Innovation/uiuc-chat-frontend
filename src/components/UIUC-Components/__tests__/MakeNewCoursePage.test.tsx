import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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

vi.mock('~/hooks/queries/useCreateProject', () => ({
  useCreateProjectMutation: vi.fn(),
}))

vi.mock('~/hooks/queries/useFetchCourseExists', () => ({
  useFetchCourseExists: vi.fn(),
}))

vi.mock('~/hooks/queries/useFetchCourseMetadata', () => ({
  useFetchCourseMetadata: vi.fn(),
}))

describe('MakeNewCoursePage', () => {
  beforeEach(async () => {
    const { useCreateProjectMutation } = await import(
      '~/hooks/queries/useCreateProject'
    )
    const { useFetchCourseExists } = await import(
      '~/hooks/queries/useFetchCourseExists'
    )
    const { useFetchCourseMetadata } = await import(
      '~/hooks/queries/useFetchCourseMetadata'
    )

    ;(useCreateProjectMutation as any).mockReturnValue({
      mutateAsync: vi.fn(async () => true),
    })
    ;(useFetchCourseExists as any).mockReturnValue({
      data: false,
      isFetching: false,
    })
    ;(useFetchCourseMetadata as any).mockReturnValue({
      refetch: vi.fn(async () => ({ data: undefined })),
    })
  })

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
  }, 15000)

  it('creates a new project and advances to the next step when available', async () => {
    const user = userEvent.setup()
    const prev = process.env.NEXT_PUBLIC_USE_ILLINOIS_CHAT_CONFIG
    process.env.NEXT_PUBLIC_USE_ILLINOIS_CHAT_CONFIG = 'True'

    const { useCreateProjectMutation } = await import(
      '~/hooks/queries/useCreateProject'
    )
    const mutateAsync = vi.fn(async () => true)
    ;(useCreateProjectMutation as any).mockReturnValue({
      mutateAsync,
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

      // Availability check should enable Continue.
      const continueBtn = await screen.findByRole('button', {
        name: /^Continue$/i,
      })
      await waitFor(() => expect(continueBtn).not.toBeDisabled(), {
        timeout: 3000,
      })

      await user.click(continueBtn)
      await waitFor(() =>
        expect(mutateAsync).toHaveBeenCalledWith({
          project_name: 'CS101',
          project_description: '',
          project_owner_email: 'owner@example.com',
          is_private: true,
        }),
      )
      expect(await screen.findByText('Add Content')).toBeInTheDocument()
    } finally {
      process.env.NEXT_PUBLIC_USE_ILLINOIS_CHAT_CONFIG = prev
    }
  }, 15000)
})
