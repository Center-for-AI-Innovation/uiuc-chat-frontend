import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import BrandingForm from '../BrandingForm'
import {
  createTestQueryClient,
  renderWithProviders,
} from '~/test-utils/renderWithProviders'
import type { CourseMetadata } from '~/types/courseMetadata'

// ---- Mocks ----

vi.mock('~/utils/apiUtils', () => ({
  callSetCourseMetadata: vi.fn(async () => true),
  uploadToS3: vi.fn(async () => 'https://s3.example.com/logo.png'),
}))

vi.mock('../SetExampleQuestions', () => ({
  default: ({ course_name }: { course_name: string }) => (
    <div data-testid="set-example-questions">
      SetExampleQuestions: {course_name}
    </div>
  ),
}))

// ---- Helpers ----

function makeCourseMetadata(
  overrides: Partial<CourseMetadata> = {},
): CourseMetadata {
  return {
    is_private: false,
    course_owner: 'owner@test.com',
    course_admins: [],
    approved_emails_list: [],
    example_questions: [],
    banner_image_s3: undefined,
    course_intro_message: '',
    system_prompt: undefined,
    openai_api_key: undefined,
    disabled_models: undefined,
    project_description: undefined,
    documentsOnly: undefined,
    guidedLearning: undefined,
    systemPromptOnly: undefined,
    vector_search_rewrite_disabled: undefined,
    allow_logged_in_users: undefined,
    is_frozen: undefined,
    ...overrides,
  }
}

function renderBrandingForm(
  options: {
    metadata?: CourseMetadata
    projectName?: string
  } = {},
) {
  const projectName = options.projectName ?? 'TestProject'
  const queryClient = createTestQueryClient()

  if (options.metadata) {
    queryClient.setQueryData(['courseMetadata', projectName], options.metadata)
  }

  const result = renderWithProviders(
    <BrandingForm project_name={projectName} user_id="user-123" />,
    { queryClient },
  )

  // Trigger the cache subscription callback by setting data after mount
  if (options.metadata) {
    queryClient.setQueryData(['courseMetadata', projectName], options.metadata)
  }

  return { ...result, queryClient }
}

// ---- Tests ----

describe('BrandingForm', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('rendering', () => {
    it('renders greeting section with textarea and update button', () => {
      renderBrandingForm()

      expect(screen.getByText('Greeting')).toBeInTheDocument()
      expect(screen.getByLabelText('Greeting')).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /Update/i }),
      ).toBeInTheDocument()
    })

    it('renders example questions section with SetExampleQuestions child', () => {
      renderBrandingForm()

      expect(screen.getByText('Example questions')).toBeInTheDocument()
      expect(screen.getByTestId('set-example-questions')).toBeInTheDocument()
    })

    it('renders logo upload section', () => {
      renderBrandingForm()

      expect(screen.getByText('Add a logo')).toBeInTheDocument()
      expect(
        screen.getByText(
          'This logo will appear in the header of the chat window.',
        ),
      ).toBeInTheDocument()
    })

    it('passes project_name to SetExampleQuestions', () => {
      renderBrandingForm({ projectName: 'MyProject' })

      expect(
        screen.getByText('SetExampleQuestions: MyProject'),
      ).toBeInTheDocument()
    })

    it('disables the Update button initially (no changes made)', () => {
      renderBrandingForm()

      const updateButton = screen.getByRole('button', { name: /Update/i })
      expect(updateButton).toBeDisabled()
    })
  })

  describe('intro message from query cache', () => {
    it('populates the textarea when courseMetadata is in the query cache', async () => {
      const metadata = makeCourseMetadata({
        course_intro_message: 'Welcome to the course!',
      })

      renderBrandingForm({ metadata })

      const textarea = screen.getByLabelText('Greeting')
      await waitFor(() =>
        expect(textarea).toHaveValue('Welcome to the course!'),
      )
    })

    it('populates empty string when course_intro_message is undefined', async () => {
      const metadata = makeCourseMetadata({
        course_intro_message: undefined,
      })

      renderBrandingForm({ metadata })

      const textarea = screen.getByLabelText('Greeting')
      await waitFor(() => expect(textarea).toHaveValue(''))
    })
  })

  describe('greeting text interaction', () => {
    it('enables the Update button when user types in textarea', async () => {
      const user = userEvent.setup()
      renderBrandingForm()

      const textarea = screen.getByLabelText('Greeting')
      await user.type(textarea, 'Hello students!')

      // When isIntroMessageUpdated is true, two Update buttons exist; pick the first (primary)
      const updateButtons = screen.getAllByRole('button', { name: /Update/i })
      expect(updateButtons[0]).toBeEnabled()
    })

    it('updates the textarea value as user types', async () => {
      const user = userEvent.setup()
      renderBrandingForm()

      const textarea = screen.getByLabelText('Greeting')
      await user.type(textarea, 'New greeting')

      expect(textarea).toHaveValue('New greeting')
    })
  })

  describe('greeting submission', () => {
    it('calls callSetCourseMetadata with updated intro message on Update click', async () => {
      const user = userEvent.setup()
      const { callSetCourseMetadata } = await import('~/utils/apiUtils')

      const metadata = makeCourseMetadata({
        course_intro_message: 'Old greeting',
      })

      renderBrandingForm({ metadata })

      const textarea = screen.getByLabelText('Greeting')
      await waitFor(() => expect(textarea).toHaveValue('Old greeting'))

      await user.clear(textarea)
      await user.type(textarea, 'New greeting')

      // Two Update buttons exist when text has changed; first is the primary one
      const updateButtons = screen.getAllByRole('button', { name: /Update/i })
      await user.click(updateButtons[0]!)

      await waitFor(() => {
        expect(vi.mocked(callSetCourseMetadata)).toHaveBeenCalledWith(
          'TestProject',
          expect.objectContaining({
            course_intro_message: 'New greeting',
          }),
        )
      })
    })

    it('disables the Update button after submission', async () => {
      const user = userEvent.setup()
      const metadata = makeCourseMetadata({
        course_intro_message: '',
      })

      renderBrandingForm({ metadata })

      const textarea = screen.getByLabelText('Greeting')
      await user.type(textarea, 'Some text')

      // Two Update buttons exist when text has changed; first is the primary one
      const updateButtons = screen.getAllByRole('button', { name: /Update/i })
      const primaryButton = updateButtons[0]!
      expect(primaryButton).toBeEnabled()

      await user.click(primaryButton)

      await waitFor(() => expect(primaryButton).toBeDisabled())
    })

    it('does not call callSetCourseMetadata when metadata is null', async () => {
      const user = userEvent.setup()
      const { callSetCourseMetadata } = await import('~/utils/apiUtils')

      // Render without setting metadata in query cache
      renderBrandingForm()

      const textarea = screen.getByLabelText('Greeting')
      await user.type(textarea, 'Something')

      // Two Update buttons exist when text has changed; first is the primary one
      const updateButtons = screen.getAllByRole('button', { name: /Update/i })
      await user.click(updateButtons[0]!)

      // Should not call API since metadata is null
      expect(vi.mocked(callSetCourseMetadata)).not.toHaveBeenCalled()
    })

    it('logs an error when callSetCourseMetadata returns false', async () => {
      const user = userEvent.setup()
      const { callSetCourseMetadata } = await import('~/utils/apiUtils')
      vi.mocked(callSetCourseMetadata).mockResolvedValueOnce(false)

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const metadata = makeCourseMetadata({
        course_intro_message: 'Hello',
      })
      renderBrandingForm({ metadata })

      const textarea = screen.getByLabelText('Greeting')
      await waitFor(() => expect(textarea).toHaveValue('Hello'))

      await user.clear(textarea)
      await user.type(textarea, 'Changed')

      // Two Update buttons exist when text has changed; first is the primary one
      const updateButtons = screen.getAllByRole('button', { name: /Update/i })
      await user.click(updateButtons[0]!)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error upserting course metadata for course: ',
          'TestProject',
        )
      })
    })
  })

  describe('hidden update button (shown when isIntroMessageUpdated is true)', () => {
    it('renders the hidden Update button when text changes', async () => {
      const user = userEvent.setup()
      renderBrandingForm()

      const textarea = screen.getByLabelText('Greeting')
      await user.type(textarea, 'typing...')

      // There should be two Update buttons when isIntroMessageUpdated is true
      const buttons = screen.getAllByRole('button', { name: /Update/i })
      expect(buttons.length).toBeGreaterThanOrEqual(2)
    })

    it('hidden Update button also calls callSetCourseMetadata on click', async () => {
      const user = userEvent.setup()
      const { callSetCourseMetadata } = await import('~/utils/apiUtils')

      const metadata = makeCourseMetadata({
        course_intro_message: '',
      })
      renderBrandingForm({ metadata })

      const textarea = screen.getByLabelText('Greeting')
      await user.type(textarea, 'Test input')

      // The second Update button (hidden one, but rendered in DOM)
      const buttons = screen.getAllByRole('button', { name: /Update/i })
      const hiddenButton = buttons[1]
      expect(hiddenButton).toBeDefined()

      // Click the hidden update button
      if (hiddenButton) {
        await user.click(hiddenButton)
      }

      await waitFor(() => {
        expect(vi.mocked(callSetCourseMetadata)).toHaveBeenCalledWith(
          'TestProject',
          expect.objectContaining({
            course_intro_message: 'Test input',
          }),
        )
      })
    })

    it('hidden Update button does not call API when metadata is null', async () => {
      const user = userEvent.setup()
      const { callSetCourseMetadata } = await import('~/utils/apiUtils')

      // No metadata set
      renderBrandingForm()

      const textarea = screen.getByLabelText('Greeting')
      await user.type(textarea, 'Something')

      const buttons = screen.getAllByRole('button', { name: /Update/i })
      const hiddenButton = buttons[1]
      if (hiddenButton) {
        await user.click(hiddenButton)
      }

      expect(vi.mocked(callSetCourseMetadata)).not.toHaveBeenCalled()
    })

    it('hidden Update button logs error when callSetCourseMetadata returns false', async () => {
      const user = userEvent.setup()
      const { callSetCourseMetadata } = await import('~/utils/apiUtils')
      vi.mocked(callSetCourseMetadata).mockResolvedValueOnce(false)

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const metadata = makeCourseMetadata({
        course_intro_message: '',
      })
      renderBrandingForm({ metadata })

      const textarea = screen.getByLabelText('Greeting')
      await user.type(textarea, 'Something')

      const buttons = screen.getAllByRole('button', { name: /Update/i })
      const hiddenButton = buttons[1]
      if (hiddenButton) {
        await user.click(hiddenButton)
      }

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error upserting course metadata for course: ',
          'TestProject',
        )
      })
    })
  })

  describe('logo upload', () => {
    it('calls uploadToS3 and callSetCourseMetadata when a logo file is selected', async () => {
      const { uploadToS3, callSetCourseMetadata } = await import(
        '~/utils/apiUtils'
      )

      const metadata = makeCourseMetadata()
      renderBrandingForm({ metadata })

      // Wait for metadata to be loaded
      await waitFor(() =>
        expect(screen.getByLabelText('Greeting')).toHaveValue(''),
      )

      const file = new File(['logo-content'], 'logo.png', {
        type: 'image/png',
      })

      // Find the file input
      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement
      expect(fileInput).toBeTruthy()

      // Trigger the file change
      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(vi.mocked(uploadToS3)).toHaveBeenCalledWith(
          file,
          'user-123',
          'TestProject',
        )
      })

      await waitFor(() => {
        expect(vi.mocked(callSetCourseMetadata)).toHaveBeenCalledWith(
          'TestProject',
          expect.objectContaining({
            banner_image_s3: 'https://s3.example.com/logo.png',
          }),
        )
      })
    })

    it('does not call uploadToS3 when no file is provided (null)', async () => {
      const { uploadToS3 } = await import('~/utils/apiUtils')

      renderBrandingForm()

      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement
      expect(fileInput).toBeTruthy()

      // Trigger change with no files
      fireEvent.change(fileInput, { target: { files: [] } })

      // uploadToS3 should not be called for null file
      expect(vi.mocked(uploadToS3)).not.toHaveBeenCalled()
    })

    it('does not call callSetCourseMetadata when uploadToS3 returns undefined', async () => {
      const { uploadToS3, callSetCourseMetadata } = await import(
        '~/utils/apiUtils'
      )
      vi.mocked(uploadToS3).mockResolvedValueOnce(undefined)

      const metadata = makeCourseMetadata()
      renderBrandingForm({ metadata })

      await waitFor(() =>
        expect(screen.getByLabelText('Greeting')).toHaveValue(''),
      )

      const file = new File(['content'], 'logo.png', { type: 'image/png' })
      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement

      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(vi.mocked(uploadToS3)).toHaveBeenCalled()
      })

      // callSetCourseMetadata should NOT have been called since uploadToS3 returned undefined
      expect(vi.mocked(callSetCourseMetadata)).not.toHaveBeenCalled()
    })

    it('does not call callSetCourseMetadata when metadata is null', async () => {
      const { uploadToS3, callSetCourseMetadata } = await import(
        '~/utils/apiUtils'
      )
      vi.mocked(uploadToS3).mockResolvedValueOnce(
        'https://s3.example.com/logo.png',
      )

      // Render without metadata
      renderBrandingForm()

      const file = new File(['content'], 'logo.png', { type: 'image/png' })
      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement

      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(vi.mocked(uploadToS3)).toHaveBeenCalled()
      })

      // Should not call callSetCourseMetadata since metadata is null
      expect(vi.mocked(callSetCourseMetadata)).not.toHaveBeenCalled()
    })
  })

  describe('query cache subscription', () => {
    it('updates greeting when query cache data changes after mount', async () => {
      const queryClient = createTestQueryClient()

      renderWithProviders(
        <BrandingForm project_name="TestProject" user_id="user-123" />,
        { queryClient },
      )

      const textarea = screen.getByLabelText('Greeting')
      expect(textarea).toHaveValue('')

      // Simulate query cache update
      const metadata = makeCourseMetadata({
        course_intro_message: 'Updated via cache',
      })
      queryClient.setQueryData(['courseMetadata', 'TestProject'], metadata)

      await waitFor(() => expect(textarea).toHaveValue('Updated via cache'))
    })

    it('handles multiple query cache updates correctly', async () => {
      const queryClient = createTestQueryClient()

      renderWithProviders(
        <BrandingForm project_name="TestProject" user_id="user-123" />,
        { queryClient },
      )

      const textarea = screen.getByLabelText('Greeting')

      // First update
      queryClient.setQueryData(
        ['courseMetadata', 'TestProject'],
        makeCourseMetadata({ course_intro_message: 'First update' }),
      )

      await waitFor(() => expect(textarea).toHaveValue('First update'))

      // Second update
      queryClient.setQueryData(
        ['courseMetadata', 'TestProject'],
        makeCourseMetadata({ course_intro_message: 'Second update' }),
      )

      await waitFor(() => expect(textarea).toHaveValue('Second update'))
    })
  })
})
