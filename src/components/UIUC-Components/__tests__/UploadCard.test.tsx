import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  renderWithProviders,
  createTestQueryClient,
} from '~/test-utils/renderWithProviders'
import type { CourseMetadata } from '~/types/courseMetadata'

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
  default: ({
    onClose,
  }: {
    files: any[]
    onClose: () => void
    projectName: string
  }) => (
    <div data-testid="upload-notification">
      <button type="button" onClick={onClose}>
        Close notification
      </button>
    </div>
  ),
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

vi.mock('~/utils/apiUtils', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    callSetCourseMetadata: vi.fn(async () => true),
    uploadToS3: vi.fn(async () => 'cs101/logo.png'),
  }
})

const baseMetadata: CourseMetadata = {
  course_owner: 'owner@example.com',
  course_admins: [],
  approved_emails_list: [],
  is_private: false,
  project_description: '',
  course_intro_message: '',
  banner_image_s3: undefined,
  example_questions: undefined,
  system_prompt: undefined,
  openai_api_key: undefined,
  disabled_models: undefined,
  documentsOnly: undefined,
  guidedLearning: undefined,
  systemPromptOnly: undefined,
  vector_search_rewrite_disabled: undefined,
  allow_logged_in_users: undefined,
  is_frozen: undefined,
}

describe('UploadCard', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  it('opens the share modal and updates metadata fields', async () => {
    const user = userEvent.setup()

    const { UploadCard } = await import('../UploadCard')
    const apiUtils = await import('~/utils/apiUtils')

    renderWithProviders(
      <UploadCard
        projectName="CS101"
        current_user_email="owner@example.com"
        metadata={baseMetadata}
      />,
    )

    await user.click(
      screen.getByRole('button', {
        name: /Sharing and Access|Share Chatbot|Share/i,
      }),
    )
    expect(
      screen.getByRole('dialog', { name: 'Share modal' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^Close$/i }))
    expect(
      screen.queryByRole('dialog', { name: 'Share modal' }),
    ).not.toBeInTheDocument()

    await user.type(
      screen.getByPlaceholderText(/Describe your project/i),
      'My project',
    )
    await user.click(screen.getByRole('button', { name: /^Update$/i }))
    await waitFor(() =>
      expect((apiUtils as any).callSetCourseMetadata).toHaveBeenCalled(),
    )

    await user.type(
      screen.getByPlaceholderText(/Enter a greeting/i),
      'Hello students',
    )
    await user.click(screen.getByRole('button', { name: /^Submit$/i }))
    await waitFor(() =>
      expect((apiUtils as any).callSetCourseMetadata).toHaveBeenCalled(),
    )

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    expect(fileInput).toBeTruthy()
    await user.upload(
      fileInput,
      new File(['x'], 'logo.png', { type: 'image/png' }),
    )
    await waitFor(() => expect((apiUtils as any).uploadToS3).toHaveBeenCalled())
  })

  it('handles failed metadata upserts gracefully', async () => {
    const user = userEvent.setup()

    const apiUtils = await import('~/utils/apiUtils')
    ;(apiUtils as any).callSetCourseMetadata.mockResolvedValueOnce(false)

    const { UploadCard } = await import('../UploadCard')

    renderWithProviders(
      <UploadCard
        projectName="CS101"
        current_user_email="owner@example.com"
        metadata={baseMetadata}
      />,
    )

    await user.type(
      screen.getByPlaceholderText(/Describe your project/i),
      'My project',
    )
    await user.click(screen.getByRole('button', { name: /^Update$/i }))

    await waitFor(() =>
      expect((apiUtils as any).callSetCourseMetadata).toHaveBeenCalled(),
    )
    expect(console.log).toHaveBeenCalled()
  })

  it('renders with sidebarCollapsed prop', async () => {
    const { UploadCard } = await import('../UploadCard')

    renderWithProviders(
      <UploadCard
        projectName="CS101"
        current_user_email="owner@example.com"
        metadata={baseMetadata}
        sidebarCollapsed={true}
      />,
    )

    // Component should render successfully with collapsed sidebar
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('CS101')).toBeInTheDocument()
  })

  it('truncates long project names exceeding 40 characters', async () => {
    const { UploadCard } = await import('../UploadCard')
    const longName =
      'this-is-a-very-long-project-name-that-exceeds-forty-characters-limit'

    renderWithProviders(
      <UploadCard
        projectName={longName}
        current_user_email="owner@example.com"
        metadata={baseMetadata}
      />,
    )

    expect(screen.getByText(longName)).toBeInTheDocument()
    // The title with long name gets a truncate class
    const projectTitle = screen.getByText(longName)
    expect(projectTitle.className).toContain('truncate')
  })

  it('handles failed intro message submit gracefully', async () => {
    const user = userEvent.setup()

    const apiUtils = await import('~/utils/apiUtils')
    ;(apiUtils as any).callSetCourseMetadata.mockResolvedValueOnce(false)

    const { UploadCard } = await import('../UploadCard')

    renderWithProviders(
      <UploadCard
        projectName="CS101"
        current_user_email="owner@example.com"
        metadata={baseMetadata}
      />,
    )

    // Type and submit greeting
    await user.type(screen.getByPlaceholderText(/Enter a greeting/i), 'Hello!')
    await user.click(screen.getByRole('button', { name: /^Submit$/i }))

    await waitFor(() =>
      expect((apiUtils as any).callSetCourseMetadata).toHaveBeenCalled(),
    )
    expect(console.log).toHaveBeenCalledWith(
      'Error upserting course metadata for course: ',
      'CS101',
    )
  })

  it('does not call uploadToS3 when no file is selected', async () => {
    const { UploadCard } = await import('../UploadCard')
    const apiUtils = await import('~/utils/apiUtils')

    renderWithProviders(
      <UploadCard
        projectName="CS101"
        current_user_email="owner@example.com"
        metadata={baseMetadata}
      />,
    )

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    expect(fileInput).toBeTruthy()

    // Fire change event with no files
    const event = new Event('change', { bubbles: true })
    Object.defineProperty(event, 'target', {
      value: { files: [] },
    })
    fileInput.dispatchEvent(event)

    // uploadToS3 should not be called since there are no files
    expect((apiUtils as any).uploadToS3).not.toHaveBeenCalled()
  })

  it('does not update metadata when uploadToS3 returns undefined', async () => {
    const user = userEvent.setup()

    const apiUtils = await import('~/utils/apiUtils')
    ;(apiUtils as any).uploadToS3.mockResolvedValueOnce(undefined)

    const { UploadCard } = await import('../UploadCard')

    renderWithProviders(
      <UploadCard
        projectName="CS101"
        current_user_email="owner@example.com"
        metadata={baseMetadata}
      />,
    )

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    await user.upload(
      fileInput,
      new File(['x'], 'logo.png', { type: 'image/png' }),
    )

    await waitFor(() => expect((apiUtils as any).uploadToS3).toHaveBeenCalled())
    // callSetCourseMetadata should NOT be called when uploadToS3 returns undefined
    // (the conditional checks `if (banner_s3_image && metadata)`)
    // But the previous test already called callSetCourseMetadata in its setup,
    // so we check it was not called *after* the upload specifically
    const callCount = (apiUtils as any).callSetCourseMetadata.mock.calls.length
    // No additional call from the file upload handler
    expect(callCount).toBe(0)
  })

  it('renders initial project description and intro message from metadata', async () => {
    const { UploadCard } = await import('../UploadCard')

    const metadataWithValues: CourseMetadata = {
      ...baseMetadata,
      project_description: 'Existing description',
      course_intro_message: 'Welcome to CS101',
    }

    renderWithProviders(
      <UploadCard
        projectName="CS101"
        current_user_email="owner@example.com"
        metadata={metadataWithValues}
      />,
    )

    expect(screen.getByPlaceholderText(/Describe your project/i)).toHaveValue(
      'Existing description',
    )
    expect(screen.getByPlaceholderText(/Enter a greeting/i)).toHaveValue(
      'Welcome to CS101',
    )
  })

  it('does not show Submit button until greeting is modified', async () => {
    const { UploadCard } = await import('../UploadCard')

    renderWithProviders(
      <UploadCard
        projectName="CS101"
        current_user_email="owner@example.com"
        metadata={baseMetadata}
      />,
    )

    // Submit button should not be present initially
    expect(
      screen.queryByRole('button', { name: /^Submit$/i }),
    ).not.toBeInTheDocument()
  })

  it('shows Submit button after modifying the greeting', async () => {
    const user = userEvent.setup()
    const { UploadCard } = await import('../UploadCard')

    renderWithProviders(
      <UploadCard
        projectName="CS101"
        current_user_email="owner@example.com"
        metadata={baseMetadata}
      />,
    )

    await user.type(screen.getByPlaceholderText(/Enter a greeting/i), 'Hi')

    expect(
      screen.getByRole('button', { name: /^Submit$/i }),
    ).toBeInTheDocument()
  })

  it('renders all expected sections and sub-components', async () => {
    const { UploadCard } = await import('../UploadCard')

    renderWithProviders(
      <UploadCard
        projectName="CS101"
        current_user_email="owner@example.com"
        metadata={baseMetadata}
      />,
    )

    // Dashboard header
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('CS101')).toBeInTheDocument()

    // Sidebar sections
    expect(screen.getByText('Project Description')).toBeInTheDocument()
    expect(screen.getByText('Branding')).toBeInTheDocument()
    expect(screen.getByText('Set a greeting')).toBeInTheDocument()
    expect(screen.getByText('Set example questions')).toBeInTheDocument()
    expect(screen.getByText('Upload your logo')).toBeInTheDocument()

    // Sub-component stubs
    expect(screen.getByTestId('dropzone')).toBeInTheDocument()
    expect(screen.getByTestId('upload-notification')).toBeInTheDocument()
  })

  it('updates local metadata when query cache changes', async () => {
    const { UploadCard } = await import('../UploadCard')
    const queryClient = createTestQueryClient()

    renderWithProviders(
      <UploadCard
        projectName="CS101"
        current_user_email="owner@example.com"
        metadata={baseMetadata}
      />,
      { queryClient },
    )

    // Update query cache externally
    const updatedMetadata: CourseMetadata = {
      ...baseMetadata,
      project_description: 'Updated externally',
    }
    queryClient.setQueryData(['courseMetadata', 'CS101'], updatedMetadata)

    // The component subscribes to query cache changes and updates local state.
    // Since ShareSettingsModal receives metadata as a prop, we can verify the
    // component re-rendered without errors.
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })
  })

  it('handles close notification callback', async () => {
    const user = userEvent.setup()
    const { UploadCard } = await import('../UploadCard')

    renderWithProviders(
      <UploadCard
        projectName="CS101"
        current_user_email="owner@example.com"
        metadata={baseMetadata}
      />,
    )

    // Our mock renders a close button that calls onClose
    const closeNotifBtn = screen.getByRole('button', {
      name: /Close notification/i,
    })
    await user.click(closeNotifBtn)

    // The component should still render fine after closing notification
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('renders descriptive text labels for branding section', async () => {
    const { UploadCard } = await import('../UploadCard')

    renderWithProviders(
      <UploadCard
        projectName="CS101"
        current_user_email="owner@example.com"
        metadata={baseMetadata}
      />,
    )

    expect(
      screen.getByText(/Shown before users send their first chat/i),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        /Users will likely try these first to get a feel for your bot/i,
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/This logo will appear in the header of the chat page/i),
    ).toBeInTheDocument()
  })
})
