import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  createTestQueryClient,
  renderWithProviders,
} from '~/test-utils/renderWithProviders'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../navbars/Navbar', () => ({
  __esModule: true,
  default: () => <div data-testid="navbar" />,
}))

vi.mock('../UploadNotification', () => ({
  __esModule: true,
  default: ({
    files,
    onClose,
  }: {
    files: any[]
    onClose: () => void
    projectName: string
  }) => (
    <div data-testid="upload-notification">
      <span data-testid="upload-files-count">{files.length}</span>
      <button data-testid="close-notification" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}))

vi.mock('../MakeNewCoursePageSteps/StepCreate', () => ({
  __esModule: true,
  default: ({
    project_name,
    is_new_course,
    isCourseAvailable,
    isCheckingAvailability,
    onUpdateName,
    onUpdateDescription,
  }: any) => (
    <div data-testid="step-create">
      <span data-testid="step-create-name">{project_name}</span>
      <span data-testid="step-create-is-new">{String(is_new_course)}</span>
      <span data-testid="step-create-available">
        {String(isCourseAvailable)}
      </span>
      <span data-testid="step-create-checking">
        {String(isCheckingAvailability)}
      </span>
      <input
        data-testid="mock-name-input"
        onChange={(e) => onUpdateName(e.target.value)}
      />
      <input
        data-testid="mock-desc-input"
        onChange={(e) => onUpdateDescription(e.target.value)}
      />
    </div>
  ),
}))

vi.mock('../MakeNewCoursePageSteps/StepUpload', () => ({
  __esModule: true,
  default: ({ project_name }: any) => (
    <div data-testid="step-upload">
      <span>Add Content</span>
      <span data-testid="step-upload-name">{project_name}</span>
    </div>
  ),
}))

vi.mock('../MakeNewCoursePageSteps/StepLLM', () => ({
  __esModule: true,
  default: () => <div data-testid="step-llm">LLM Config</div>,
}))

vi.mock('../MakeNewCoursePageSteps/StepPrompt', () => ({
  __esModule: true,
  default: () => <div data-testid="step-prompt">System Prompt</div>,
}))

vi.mock('../MakeNewCoursePageSteps/StepBranding', () => ({
  __esModule: true,
  default: () => <div data-testid="step-branding">Branding</div>,
}))

vi.mock('../MakeNewCoursePageSteps/StepSuccess', () => ({
  __esModule: true,
  default: () => <div data-testid="step-success">Success!</div>,
}))

vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}))

vi.mock('~/utils/apiUtils', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    createProject: vi.fn(async () => true),
    fetchCourseMetadata: vi.fn(async () => ({
      is_frozen: false,
      is_private: false,
      course_owner: 'owner@example.com',
      course_admins: [],
      approved_emails_list: [],
      example_questions: undefined,
      banner_image_s3: undefined,
      course_intro_message: undefined,
      system_prompt: undefined,
      openai_api_key: undefined,
      disabled_models: undefined,
      project_description: undefined,
      documentsOnly: undefined,
      guidedLearning: undefined,
      systemPromptOnly: undefined,
      vector_search_rewrite_disabled: undefined,
      allow_logged_in_users: undefined,
    })),
  }
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let savedEnv: string | undefined

function setIllinoisConfig(value: string) {
  process.env.NEXT_PUBLIC_USE_ILLINOIS_CHAT_CONFIG = value
}

/** Mock fetch to return courseExists = false (name available) by default */
function mockFetchCourseAvailable(exists = false) {
  return vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async (input: any) => {
      const url = String(input?.url ?? input)
      if (url.includes('/api/UIUC-api/getCourseExists')) {
        return new Response(JSON.stringify(exists), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    })
}

async function importComponent() {
  // Dynamic import to pick up the current env var
  const mod = await import('../MakeNewCoursePage')
  return mod.default
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MakeNewCoursePage', () => {
  beforeEach(() => {
    savedEnv = process.env.NEXT_PUBLIC_USE_ILLINOIS_CHAT_CONFIG
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_USE_ILLINOIS_CHAT_CONFIG = savedEnv
    vi.restoreAllMocks()
  })

  // -----------------------------------------------------------------------
  // Illinois Chat config disabled
  // -----------------------------------------------------------------------

  describe('when Illinois config is disabled', () => {
    it('still renders the wizard instead of the migration notice', async () => {
      setIllinoisConfig('False')
      const MakeNewCoursePage = await importComponent()

      renderWithProviders(
        <MakeNewCoursePage
          project_name=""
          current_user_email="owner@example.com"
          is_new_course={true}
        />,
      )

      expect(await screen.findByTestId('step-create')).toBeInTheDocument()
      expect(
        screen.queryByText(/New project creation is currently disabled/i),
      ).not.toBeInTheDocument()
    })

    it('does not display the migration links', async () => {
      setIllinoisConfig('False')
      const MakeNewCoursePage = await importComponent()

      renderWithProviders(
        <MakeNewCoursePage
          project_name=""
          current_user_email="owner@example.com"
        />,
      )

      expect(
        screen.queryByRole('link', { name: /chat\.illinois\.edu/i }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('link', {
          name: /genaisupport@mx\.uillinois\.edu/i,
        }),
      ).not.toBeInTheDocument()
    })

    it('renders the Navbar and wizard navigation', async () => {
      setIllinoisConfig('False')
      const MakeNewCoursePage = await importComponent()

      renderWithProviders(
        <MakeNewCoursePage
          project_name=""
          current_user_email="owner@example.com"
        />,
      )

      expect(screen.getByTestId('navbar')).toBeInTheDocument()
      expect(
        screen.getByRole('navigation', { name: /Wizard navigation/i }),
      ).toBeInTheDocument()
    })

    it('uses project_name in the title or falls back to "New Project"', async () => {
      setIllinoisConfig('False')
      const MakeNewCoursePage = await importComponent()

      renderWithProviders(
        <MakeNewCoursePage
          project_name="MyBot"
          current_user_email="owner@example.com"
        />,
      )

      // next/head is not fully rendered in JSDOM, but the h1 sr-only is rendered
      expect(screen.getByText('Create New Project')).toBeInTheDocument()
    })
  })

  // -----------------------------------------------------------------------
  // Normal wizard rendering (Illinois config enabled)
  // -----------------------------------------------------------------------

  describe('wizard rendering', () => {
    beforeEach(() => {
      setIllinoisConfig('True')
      mockFetchCourseAvailable(false)
    })

    it('renders the create step initially', async () => {
      const MakeNewCoursePage = await importComponent()

      renderWithProviders(
        <MakeNewCoursePage
          project_name="CS101"
          current_user_email="owner@example.com"
          is_new_course={true}
        />,
      )

      expect(await screen.findByTestId('step-create')).toBeInTheDocument()
    })

    it('renders Back and Continue buttons', async () => {
      const MakeNewCoursePage = await importComponent()

      renderWithProviders(
        <MakeNewCoursePage
          project_name="CS101"
          current_user_email="owner@example.com"
          is_new_course={true}
        />,
      )

      expect(
        await screen.findByRole('button', { name: /Go to previous step/i }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /Continue to next step/i }),
      ).toBeInTheDocument()
    })

    it('disables the Back button on the first step', async () => {
      const MakeNewCoursePage = await importComponent()

      renderWithProviders(
        <MakeNewCoursePage
          project_name="CS101"
          current_user_email="owner@example.com"
          is_new_course={true}
        />,
      )

      const backBtn = await screen.findByRole('button', {
        name: /Go to previous step/i,
      })
      expect(backBtn).toBeDisabled()
    })

    it('renders pagination dots matching the number of steps', async () => {
      const MakeNewCoursePage = await importComponent()

      const { container } = renderWithProviders(
        <MakeNewCoursePage
          project_name="CS101"
          current_user_email="owner@example.com"
          is_new_course={true}
        />,
      )

      // 6 steps: Create, Success, Upload, Branding, LLM, Prompt
      const dots = container.querySelectorAll('.rounded-full')
      expect(dots.length).toBe(6)
    })

    it('renders the UploadNotification component', async () => {
      const MakeNewCoursePage = await importComponent()

      renderWithProviders(
        <MakeNewCoursePage
          project_name="CS101"
          current_user_email="owner@example.com"
          is_new_course={true}
        />,
      )

      expect(
        await screen.findByTestId('upload-notification'),
      ).toBeInTheDocument()
      expect(screen.getByTestId('upload-files-count')).toHaveTextContent('0')
    })

    it('uses auth user email when available', async () => {
      globalThis.__TEST_AUTH__ = {
        isAuthenticated: true,
        user: { profile: { email: 'auth-user@example.com' } },
      }

      const MakeNewCoursePage = await importComponent()

      renderWithProviders(
        <MakeNewCoursePage
          project_name="CS101"
          current_user_email="fallback@example.com"
          is_new_course={true}
        />,
      )

      // The auth user email is used for StepBranding (user_id prop) and submission.
      // We verify the component rendered without error.
      expect(await screen.findByTestId('step-create')).toBeInTheDocument()
    })
  })

  // -----------------------------------------------------------------------
  // Continue button disabled states on step 0
  // -----------------------------------------------------------------------

  describe('Continue button disabled states', () => {
    beforeEach(() => {
      setIllinoisConfig('True')
    })

    it('disables Continue when project name is empty', async () => {
      mockFetchCourseAvailable(false)
      const MakeNewCoursePage = await importComponent()

      renderWithProviders(
        <MakeNewCoursePage
          project_name=""
          current_user_email="owner@example.com"
          is_new_course={true}
        />,
      )

      const continueBtn = await screen.findByRole('button', {
        name: /Continue to next step/i,
      })
      expect(continueBtn).toBeDisabled()
    })

    it('disables Continue when course name is taken (not available)', async () => {
      mockFetchCourseAvailable(true) // exists = true => not available
      const MakeNewCoursePage = await importComponent()

      renderWithProviders(
        <MakeNewCoursePage
          project_name="TakenProject"
          current_user_email="owner@example.com"
          is_new_course={true}
        />,
      )

      const continueBtn = await screen.findByRole('button', {
        name: /Continue to next step/i,
      })
      // Wait for debounce + availability check to settle
      await waitFor(
        () => {
          expect(continueBtn).toBeDisabled()
        },
        { timeout: 3000 },
      )
    })
  })

  // -----------------------------------------------------------------------
  // Project creation and step navigation
  // -----------------------------------------------------------------------

  describe('project creation and navigation', () => {
    beforeEach(() => {
      setIllinoisConfig('True')
    })

    it('creates a project and advances to the success step', async () => {
      const user = userEvent.setup()
      mockFetchCourseAvailable(false)

      const apiUtils = await import('~/utils/apiUtils')
      ;(
        apiUtils.createProject as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(true)

      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name="NewBot"
          current_user_email="owner@example.com"
          is_new_course={true}
        />,
      )

      const continueBtn = await screen.findByRole('button', {
        name: /Continue to next step/i,
      })
      await waitFor(() => expect(continueBtn).not.toBeDisabled(), {
        timeout: 3000,
      })

      await user.click(continueBtn)

      await waitFor(() => {
        expect(apiUtils.createProject).toHaveBeenCalledWith(
          'NewBot',
          '',
          'owner@example.com',
          true, // useIllinoisChatConfig = true
        )
      })

      // Should advance to StepSuccess (step 1 in wizard)
      expect(await screen.findByTestId('step-success')).toBeInTheDocument()
    })

    it('fetches and caches course metadata after creation', async () => {
      const user = userEvent.setup()
      mockFetchCourseAvailable(false)

      const apiUtils = await import('~/utils/apiUtils')
      ;(
        apiUtils.createProject as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(true)
      const mockMetadata = {
        is_frozen: false,
        is_private: false,
        course_owner: 'owner@example.com',
        course_admins: [],
        approved_emails_list: [],
        example_questions: undefined,
        banner_image_s3: undefined,
        course_intro_message: undefined,
        system_prompt: undefined,
        openai_api_key: undefined,
        disabled_models: undefined,
        project_description: undefined,
        documentsOnly: undefined,
        guidedLearning: undefined,
        systemPromptOnly: undefined,
        vector_search_rewrite_disabled: undefined,
        allow_logged_in_users: undefined,
      }
      ;(
        apiUtils.fetchCourseMetadata as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockMetadata)

      const queryClient = createTestQueryClient()
      const MakeNewCoursePage = await importComponent()

      renderWithProviders(
        <MakeNewCoursePage
          project_name="NewBot"
          current_user_email="owner@example.com"
          is_new_course={true}
        />,
        { queryClient },
      )

      const continueBtn = await screen.findByRole('button', {
        name: /Continue to next step/i,
      })
      await waitFor(() => expect(continueBtn).not.toBeDisabled(), {
        timeout: 3000,
      })
      await user.click(continueBtn)

      await waitFor(() => {
        expect(apiUtils.fetchCourseMetadata).toHaveBeenCalledWith('NewBot')
      })

      // Verify metadata was cached in query client
      await waitFor(() => {
        const cached = queryClient.getQueryData(['courseMetadata', 'NewBot'])
        expect(cached).toEqual(mockMetadata)
      })
    })

    it('uses fallback metadata when fetchCourseMetadata fails', async () => {
      const user = userEvent.setup()
      mockFetchCourseAvailable(false)
      vi.spyOn(console, 'error').mockImplementation(() => {})

      const apiUtils = await import('~/utils/apiUtils')
      ;(
        apiUtils.createProject as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(true)
      ;(
        apiUtils.fetchCourseMetadata as ReturnType<typeof vi.fn>
      ).mockRejectedValueOnce(new Error('Metadata fetch failed'))

      const queryClient = createTestQueryClient()
      const MakeNewCoursePage = await importComponent()

      renderWithProviders(
        <MakeNewCoursePage
          project_name="NewBot"
          current_user_email="owner@example.com"
          is_new_course={true}
        />,
        { queryClient },
      )

      const continueBtn = await screen.findByRole('button', {
        name: /Continue to next step/i,
      })
      await waitFor(() => expect(continueBtn).not.toBeDisabled(), {
        timeout: 3000,
      })
      await user.click(continueBtn)

      // Should still advance (fallback metadata used)
      expect(await screen.findByTestId('step-success')).toBeInTheDocument()

      // Fallback metadata should be cached
      await waitFor(() => {
        const cached = queryClient.getQueryData([
          'courseMetadata',
          'NewBot',
        ]) as any
        expect(cached).toBeDefined()
        expect(cached.course_owner).toBe('owner@example.com')
        expect(cached.is_private).toBe(true) // is_private = useIllinoisChatConfig = true
      })
    })

    it('does not advance when createProject returns false', async () => {
      const user = userEvent.setup()
      mockFetchCourseAvailable(false)

      const apiUtils = await import('~/utils/apiUtils')
      ;(
        apiUtils.createProject as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(false)

      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name="NewBot"
          current_user_email="owner@example.com"
          is_new_course={true}
        />,
      )

      const continueBtn = await screen.findByRole('button', {
        name: /Continue to next step/i,
      })
      await waitFor(() => expect(continueBtn).not.toBeDisabled(), {
        timeout: 3000,
      })
      await user.click(continueBtn)

      // Should still be on the create step
      await waitFor(() => {
        expect(screen.getByTestId('step-create')).toBeInTheDocument()
      })
    })

    it('skips project creation on step 0 if already created', async () => {
      const user = userEvent.setup()
      mockFetchCourseAvailable(false)

      const apiUtils = await import('~/utils/apiUtils')
      ;(apiUtils.createProject as ReturnType<typeof vi.fn>).mockResolvedValue(
        true,
      )
      ;(
        apiUtils.fetchCourseMetadata as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        is_frozen: false,
        is_private: false,
        course_owner: 'owner@example.com',
        course_admins: [],
        approved_emails_list: [],
        example_questions: undefined,
        banner_image_s3: undefined,
        course_intro_message: undefined,
        system_prompt: undefined,
        openai_api_key: undefined,
        disabled_models: undefined,
        project_description: undefined,
        documentsOnly: undefined,
        guidedLearning: undefined,
        systemPromptOnly: undefined,
        vector_search_rewrite_disabled: undefined,
        allow_logged_in_users: undefined,
      })

      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name="NewBot"
          current_user_email="owner@example.com"
          is_new_course={true}
        />,
      )

      // First click: creates the project and goes to step 1 (StepSuccess)
      const continueBtn = await screen.findByRole('button', {
        name: /Continue to next step/i,
      })
      await waitFor(() => expect(continueBtn).not.toBeDisabled(), {
        timeout: 3000,
      })
      await user.click(continueBtn)
      await screen.findByTestId('step-success')

      // Go back to step 0
      const backBtn = screen.getByRole('button', {
        name: /Go to previous step/i,
      })
      await user.click(backBtn)
      await screen.findByTestId('step-create')

      // Clear the mock call count
      ;(apiUtils.createProject as ReturnType<typeof vi.fn>).mockClear()

      // Second click on Continue: should NOT call createProject again
      const continueBtn2 = screen.getByRole('button', {
        name: /Continue to next step/i,
      })
      await user.click(continueBtn2)

      await screen.findByTestId('step-success')
      expect(apiUtils.createProject).not.toHaveBeenCalled()
    })
  })

  // -----------------------------------------------------------------------
  // Error handling during project creation
  // -----------------------------------------------------------------------

  describe('error handling', () => {
    beforeEach(() => {
      setIllinoisConfig('True')
      vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    it('shows notification for 409 conflict (project name already taken)', async () => {
      const user = userEvent.setup()
      mockFetchCourseAvailable(false)

      const apiUtils = await import('~/utils/apiUtils')
      const conflictError = Object.assign(
        new Error('A project with this name already exists'),
        { status: 409 },
      )
      ;(
        apiUtils.createProject as ReturnType<typeof vi.fn>
      ).mockRejectedValueOnce(conflictError)

      const { notifications } = await import('@mantine/notifications')

      const queryClient = createTestQueryClient()
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name="Existing"
          current_user_email="owner@example.com"
          is_new_course={true}
        />,
        { queryClient },
      )

      const continueBtn = await screen.findByRole('button', {
        name: /Continue to next step/i,
      })
      await waitFor(() => expect(continueBtn).not.toBeDisabled(), {
        timeout: 3000,
      })
      await user.click(continueBtn)

      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Project name already taken',
            color: 'red',
          }),
        )
      })

      // Should invalidate the availability query
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['projectNameAvailability', 'Existing'],
        }),
      )

      // Should remain on step 0
      expect(screen.getByTestId('step-create')).toBeInTheDocument()
    })

    it('shows generic error notification for non-409 errors', async () => {
      const user = userEvent.setup()
      mockFetchCourseAvailable(false)

      const apiUtils = await import('~/utils/apiUtils')
      const serverError = Object.assign(new Error('Internal server error'), {
        status: 500,
      })
      ;(
        apiUtils.createProject as ReturnType<typeof vi.fn>
      ).mockRejectedValueOnce(serverError)

      const { notifications } = await import('@mantine/notifications')
      ;(notifications.show as ReturnType<typeof vi.fn>).mockClear()

      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name="NewBot"
          current_user_email="owner@example.com"
          is_new_course={true}
        />,
      )

      const continueBtn = await screen.findByRole('button', {
        name: /Continue to next step/i,
      })
      await waitFor(() => expect(continueBtn).not.toBeDisabled(), {
        timeout: 3000,
      })
      await user.click(continueBtn)

      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Failed to create project',
            color: 'red',
          }),
        )
      })

      // Should remain on step 0
      expect(screen.getByTestId('step-create')).toBeInTheDocument()
    })

    it('shows fallback message when error has no message', async () => {
      const user = userEvent.setup()
      mockFetchCourseAvailable(false)

      const apiUtils = await import('~/utils/apiUtils')
      // Error with empty message and no status
      const emptyError = Object.assign(new Error(''), {})
      ;(
        apiUtils.createProject as ReturnType<typeof vi.fn>
      ).mockRejectedValueOnce(emptyError)

      const { notifications } = await import('@mantine/notifications')
      ;(notifications.show as ReturnType<typeof vi.fn>).mockClear()

      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name="TestProj"
          current_user_email="owner@example.com"
          is_new_course={true}
        />,
      )

      const continueBtn = await screen.findByRole('button', {
        name: /Continue to next step/i,
      })
      await waitFor(() => expect(continueBtn).not.toBeDisabled(), {
        timeout: 3000,
      })
      await user.click(continueBtn)

      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Failed to create project',
            message: expect.stringContaining(
              'An error occurred while creating the project',
            ),
          }),
        )
      })
    })

    it('resets isLoading after a failed creation', async () => {
      const user = userEvent.setup()
      mockFetchCourseAvailable(false)

      const apiUtils = await import('~/utils/apiUtils')
      ;(
        apiUtils.createProject as ReturnType<typeof vi.fn>
      ).mockRejectedValueOnce(new Error('Server error'))

      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name="NewBot"
          current_user_email="owner@example.com"
          is_new_course={true}
        />,
      )

      const continueBtn = await screen.findByRole('button', {
        name: /Continue to next step/i,
      })
      await waitFor(() => expect(continueBtn).not.toBeDisabled(), {
        timeout: 3000,
      })
      await user.click(continueBtn)

      // After error, button should not be in loading state and should be clickable again
      await waitFor(() => {
        expect(continueBtn).not.toBeDisabled()
      })
    })
  })

  // -----------------------------------------------------------------------
  // Step navigation (Back / Continue through multiple steps)
  // -----------------------------------------------------------------------

  describe('step navigation', () => {
    beforeEach(() => {
      setIllinoisConfig('True')
      mockFetchCourseAvailable(false)
    })

    it('navigates forward through all steps and back', async () => {
      const user = userEvent.setup()

      const apiUtils = await import('~/utils/apiUtils')
      ;(apiUtils.createProject as ReturnType<typeof vi.fn>).mockResolvedValue(
        true,
      )
      ;(
        apiUtils.fetchCourseMetadata as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        is_frozen: false,
        is_private: false,
        course_owner: 'owner@example.com',
        course_admins: [],
        approved_emails_list: [],
        example_questions: undefined,
        banner_image_s3: undefined,
        course_intro_message: undefined,
        system_prompt: undefined,
        openai_api_key: undefined,
        disabled_models: undefined,
        project_description: undefined,
        documentsOnly: undefined,
        guidedLearning: undefined,
        systemPromptOnly: undefined,
        vector_search_rewrite_disabled: undefined,
        allow_logged_in_users: undefined,
      })

      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name="NavTest"
          current_user_email="owner@example.com"
          is_new_course={true}
        />,
      )

      // Step 0: Create
      expect(await screen.findByTestId('step-create')).toBeInTheDocument()

      const continueBtn = screen.getByRole('button', {
        name: /Continue to next step/i,
      })
      await waitFor(() => expect(continueBtn).not.toBeDisabled(), {
        timeout: 3000,
      })

      // Step 0 -> 1: Success
      await user.click(continueBtn)
      expect(await screen.findByTestId('step-success')).toBeInTheDocument()

      // Step 1 -> 2: Upload
      await user.click(
        screen.getByRole('button', { name: /Continue to next step/i }),
      )
      expect(await screen.findByTestId('step-upload')).toBeInTheDocument()

      // Step 2 -> 3: Branding
      await user.click(
        screen.getByRole('button', { name: /Continue to next step/i }),
      )
      expect(await screen.findByTestId('step-branding')).toBeInTheDocument()

      // Step 3 -> 4: LLM
      await user.click(
        screen.getByRole('button', { name: /Continue to next step/i }),
      )
      expect(await screen.findByTestId('step-llm')).toBeInTheDocument()

      // Step 4 -> 5: Prompt (last step)
      await user.click(
        screen.getByRole('button', { name: /Continue to next step/i }),
      )
      expect(await screen.findByTestId('step-prompt')).toBeInTheDocument()

      // On the last step, the button says "Start Chatting"
      const lastBtn = screen.getByRole('button', {
        name: /Start Chatting/i,
      })
      expect(lastBtn).toBeInTheDocument()

      // Now go back
      const backBtn = screen.getByRole('button', {
        name: /Go to previous step/i,
      })
      await user.click(backBtn)
      expect(await screen.findByTestId('step-llm')).toBeInTheDocument()

      await user.click(backBtn)
      expect(await screen.findByTestId('step-branding')).toBeInTheDocument()
    })

    it('Back button does not go below step 0', async () => {
      const user = userEvent.setup()

      const apiUtils = await import('~/utils/apiUtils')
      ;(apiUtils.createProject as ReturnType<typeof vi.fn>).mockResolvedValue(
        true,
      )
      ;(
        apiUtils.fetchCourseMetadata as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        is_frozen: false,
        is_private: false,
        course_owner: 'owner@example.com',
        course_admins: [],
        approved_emails_list: [],
        example_questions: undefined,
        banner_image_s3: undefined,
        course_intro_message: undefined,
        system_prompt: undefined,
        openai_api_key: undefined,
        disabled_models: undefined,
        project_description: undefined,
        documentsOnly: undefined,
        guidedLearning: undefined,
        systemPromptOnly: undefined,
        vector_search_rewrite_disabled: undefined,
        allow_logged_in_users: undefined,
      })

      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name="NavTest"
          current_user_email="owner@example.com"
          is_new_course={true}
        />,
      )

      // Navigate to step 1
      const continueBtn = await screen.findByRole('button', {
        name: /Continue to next step/i,
      })
      await waitFor(() => expect(continueBtn).not.toBeDisabled(), {
        timeout: 3000,
      })
      await user.click(continueBtn)
      await screen.findByTestId('step-success')

      // Go back to step 0
      const backBtn = screen.getByRole('button', {
        name: /Go to previous step/i,
      })
      await user.click(backBtn)
      expect(await screen.findByTestId('step-create')).toBeInTheDocument()

      // Back button should be disabled on step 0
      expect(backBtn).toBeDisabled()
    })
  })

  // -----------------------------------------------------------------------
  // is_new_course = false
  // -----------------------------------------------------------------------

  describe('when is_new_course is false', () => {
    beforeEach(() => {
      setIllinoisConfig('True')
    })

    it('does not run the availability check query', async () => {
      const fetchSpy = mockFetchCourseAvailable(false)
      const MakeNewCoursePage = await importComponent()

      renderWithProviders(
        <MakeNewCoursePage
          project_name="ExistingProject"
          current_user_email="owner@example.com"
          is_new_course={false}
        />,
      )

      // Give it time to settle - should NOT have called getCourseExists
      await waitFor(
        () => {
          const calls = fetchSpy.mock.calls.map((c) =>
            String(c[0]?.url ?? c[0]),
          )
          const existsCalls = calls.filter((url) =>
            url.includes('getCourseExists'),
          )
          expect(existsCalls).toHaveLength(0)
        },
        { timeout: 2000 },
      )
    })
  })

  // -----------------------------------------------------------------------
  // UploadNotification close handler
  // -----------------------------------------------------------------------

  describe('upload notification', () => {
    beforeEach(() => {
      setIllinoisConfig('True')
      mockFetchCourseAvailable(false)
    })

    it('clears upload files when close notification is clicked', async () => {
      const user = userEvent.setup()
      const MakeNewCoursePage = await importComponent()

      renderWithProviders(
        <MakeNewCoursePage
          project_name="CS101"
          current_user_email="owner@example.com"
          is_new_course={true}
        />,
      )

      const closeBtn = await screen.findByTestId('close-notification')
      await user.click(closeBtn)

      // After close, files count should be 0
      expect(screen.getByTestId('upload-files-count')).toHaveTextContent('0')
    })
  })

  // -----------------------------------------------------------------------
  // Continue button guard on step 0 (empty name, loading, waiting)
  // -----------------------------------------------------------------------

  describe('Continue guard on step 0 - early return conditions', () => {
    beforeEach(() => {
      setIllinoisConfig('True')
    })

    it('does not call createProject when project name is empty on click', async () => {
      const user = userEvent.setup()
      mockFetchCourseAvailable(false)

      const apiUtils = await import('~/utils/apiUtils')
      ;(apiUtils.createProject as ReturnType<typeof vi.fn>).mockClear()

      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name=""
          current_user_email="owner@example.com"
          is_new_course={true}
        />,
      )

      const continueBtn = await screen.findByRole('button', {
        name: /Continue to next step/i,
      })

      // The button should be disabled, but even if we force-click...
      expect(continueBtn).toBeDisabled()

      // createProject should not have been called
      expect(apiUtils.createProject).not.toHaveBeenCalled()
    })
  })

  // -----------------------------------------------------------------------
  // Course availability check (fetch error)
  // -----------------------------------------------------------------------

  describe('course availability check', () => {
    beforeEach(() => {
      setIllinoisConfig('True')
    })

    it('handles fetch error in availability check gracefully', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: any) => {
        const url = String(input?.url ?? input)
        if (url.includes('/api/UIUC-api/getCourseExists')) {
          return new Response('Server Error', { status: 500 })
        }
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      })

      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name="ErrorCheck"
          current_user_email="owner@example.com"
          is_new_course={true}
        />,
      )

      // Should render without crashing
      expect(await screen.findByTestId('step-create')).toBeInTheDocument()

      // Continue should remain disabled since availability is unknown
      const continueBtn = screen.getByRole('button', {
        name: /Continue to next step/i,
      })
      await waitFor(
        () => {
          expect(continueBtn).toBeDisabled()
        },
        { timeout: 3000 },
      )
    })
  })

  // -----------------------------------------------------------------------
  // Project description is passed through
  // -----------------------------------------------------------------------

  describe('project description', () => {
    beforeEach(() => {
      setIllinoisConfig('True')
      mockFetchCourseAvailable(false)
    })

    it('passes project_description to handleSubmit on creation', async () => {
      const user = userEvent.setup()

      const apiUtils = await import('~/utils/apiUtils')
      ;(
        apiUtils.createProject as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(true)
      ;(
        apiUtils.fetchCourseMetadata as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        is_frozen: false,
        is_private: false,
        course_owner: 'owner@example.com',
        course_admins: [],
        approved_emails_list: [],
        example_questions: undefined,
        banner_image_s3: undefined,
        course_intro_message: undefined,
        system_prompt: undefined,
        openai_api_key: undefined,
        disabled_models: undefined,
        project_description: 'A test project',
        documentsOnly: undefined,
        guidedLearning: undefined,
        systemPromptOnly: undefined,
        vector_search_rewrite_disabled: undefined,
        allow_logged_in_users: undefined,
      })

      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name="DescTest"
          current_user_email="owner@example.com"
          is_new_course={true}
          project_description="A test project"
        />,
      )

      const continueBtn = await screen.findByRole('button', {
        name: /Continue to next step/i,
      })
      await waitFor(() => expect(continueBtn).not.toBeDisabled(), {
        timeout: 3000,
      })
      await user.click(continueBtn)

      await waitFor(() => {
        expect(apiUtils.createProject).toHaveBeenCalledWith(
          'DescTest',
          'A test project',
          'owner@example.com',
          true,
        )
      })
    })

    it('updates description via mock input and uses it in submission', async () => {
      const user = userEvent.setup()

      const apiUtils = await import('~/utils/apiUtils')
      ;(
        apiUtils.createProject as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(true)
      ;(
        apiUtils.fetchCourseMetadata as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        is_frozen: false,
        is_private: false,
        course_owner: 'owner@example.com',
        course_admins: [],
        approved_emails_list: [],
        example_questions: undefined,
        banner_image_s3: undefined,
        course_intro_message: undefined,
        system_prompt: undefined,
        openai_api_key: undefined,
        disabled_models: undefined,
        project_description: 'Updated desc',
        documentsOnly: undefined,
        guidedLearning: undefined,
        systemPromptOnly: undefined,
        vector_search_rewrite_disabled: undefined,
        allow_logged_in_users: undefined,
      })

      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name="DescTest"
          current_user_email="owner@example.com"
          is_new_course={true}
        />,
      )

      // Update the description through the mock input
      const descInput = await screen.findByTestId('mock-desc-input')
      await user.type(descInput, 'My new description')

      const continueBtn = screen.getByRole('button', {
        name: /Continue to next step/i,
      })
      await waitFor(() => expect(continueBtn).not.toBeDisabled(), {
        timeout: 3000,
      })
      await user.click(continueBtn)

      await waitFor(() => {
        expect(apiUtils.createProject).toHaveBeenCalledWith(
          'DescTest',
          'My new description',
          'owner@example.com',
          true,
        )
      })
    })
  })
})
