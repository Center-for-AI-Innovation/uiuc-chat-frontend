import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '~/test-utils/renderWithProviders'

vi.mock('../LargeDropzone', () => ({
  __esModule: true,
  default: () => <div data-testid="dropzone" />,
}))
vi.mock('../CanvasIngestForm', () => ({
  __esModule: true,
  default: () => <div />,
}))
vi.mock('../WebsiteIngestForm', () => ({
  __esModule: true,
  default: () => <div />,
}))
vi.mock('../GitHubIngestForm', () => ({
  __esModule: true,
  default: () => <div />,
}))
vi.mock('../MITIngestForm', () => ({
  __esModule: true,
  default: () => <div />,
}))
vi.mock('../CourseraIngestForm', () => ({
  __esModule: true,
  default: () => <div />,
}))
vi.mock('../SetExampleQuestions', () => ({
  __esModule: true,
  default: () => <div />,
}))
vi.mock('../UploadNotification', () => ({
  __esModule: true,
  default: () => <div data-testid="upload-notification" />,
}))

vi.mock('../ShareSettingsModal', () => ({
  __esModule: true,
  default: ({ opened, onClose }: any) => {
    if (!opened) return null
    return (
      <div role="dialog" aria-label="Share modal">
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
    )
  },
}))

vi.mock('@/hooks/__internal__/setCourseMetadata', () => ({
  callSetCourseMetadata: vi.fn(async () => true),
}))

vi.mock('~/hooks/queries/useUploadToS3', async () => {
  const { useMutation } = await import('@tanstack/react-query')
  const mockUploadToS3 = vi.fn(async () => 'cs101/logo.png')
  return {
    uploadToS3: mockUploadToS3,
    useUploadToS3: () =>
      useMutation({
        mutationKey: ['uploadToS3'],
        mutationFn: mockUploadToS3,
      }),
  }
})

describe('UploadCard', () => {
  it('opens the share modal and updates metadata fields', async () => {
    const user = userEvent.setup()

    const { UploadCard } = await import('../UploadCard')
    const setCourseMetadataModule = await import(
      '@/hooks/__internal__/setCourseMetadata'
    )
    const uploadModule = await import('~/hooks/queries/useUploadToS3')

    renderWithProviders(
      <UploadCard
        projectName="CS101"
        current_user_email="owner@example.com"
        metadata={
          {
            course_owner: 'owner@example.com',
            course_admins: [],
            approved_emails_list: [],
            is_private: false,
            project_description: '',
            course_intro_message: '',
            banner_image_s3: undefined,
          } as any
        }
      />,
    )

    await user.click(
      screen.getByRole('button', { name: /Share Chatbot|Share/i }),
    )
    expect(
      screen.getByRole('dialog', { name: 'Share modal' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Close/i }))
    expect(
      screen.queryByRole('dialog', { name: 'Share modal' }),
    ).not.toBeInTheDocument()

    await user.type(
      screen.getByPlaceholderText(/Describe your project/i),
      'My project',
    )
    await user.click(screen.getByRole('button', { name: /^Update$/i }))
    await waitFor(() =>
      expect(
        (setCourseMetadataModule as any).callSetCourseMetadata,
      ).toHaveBeenCalled(),
    )

    await user.type(
      screen.getByPlaceholderText(/Enter a greeting/i),
      'Hello students',
    )
    await user.click(screen.getByRole('button', { name: /^Submit$/i }))
    await waitFor(() =>
      expect(
        (setCourseMetadataModule as any).callSetCourseMetadata,
      ).toHaveBeenCalled(),
    )

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    expect(fileInput).toBeTruthy()
    await user.upload(
      fileInput,
      new File(['x'], 'logo.png', { type: 'image/png' }),
    )
    await waitFor(() =>
      expect((uploadModule as any).uploadToS3).toHaveBeenCalled(),
    )
  })

  it('handles failed metadata upserts gracefully', async () => {
    const user = userEvent.setup()
    vi.spyOn(console, 'log').mockImplementation(() => {})

    const setCourseMetadataModule = await import(
      '@/hooks/__internal__/setCourseMetadata'
    )
    ;(
      setCourseMetadataModule as any
    ).callSetCourseMetadata.mockResolvedValueOnce(false)

    const { UploadCard } = await import('../UploadCard')

    renderWithProviders(
      <UploadCard
        projectName="CS101"
        current_user_email="owner@example.com"
        metadata={
          {
            course_owner: 'owner@example.com',
            course_admins: [],
            approved_emails_list: [],
            is_private: false,
            project_description: '',
            course_intro_message: '',
          } as any
        }
      />,
    )

    await user.type(
      screen.getByPlaceholderText(/Describe your project/i),
      'My project',
    )
    await user.click(screen.getByRole('button', { name: /^Update$/i }))

    await waitFor(() =>
      expect(
        (setCourseMetadataModule as any).callSetCourseMetadata,
      ).toHaveBeenCalled(),
    )
    expect(console.log).toHaveBeenCalled()
  })
})
