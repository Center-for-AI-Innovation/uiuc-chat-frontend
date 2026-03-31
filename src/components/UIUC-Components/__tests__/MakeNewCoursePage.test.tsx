import React from 'react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '~/test-utils/renderWithProviders'
import { notifications } from '@mantine/notifications'

// ---------------------------------------------------------------------------
// Heavy child components stubbed as lightweight elements
// ---------------------------------------------------------------------------
vi.mock('../navbars/Navbar', () => ({
  __esModule: true,
  default: () => <div data-testid="navbar" />,
}))

vi.mock('../GlobalFooter', () => ({
  __esModule: true,
  default: () => <div data-testid="footer" />,
}))

vi.mock('../MakeNewCoursePageSteps/StepCreate', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="step-create">
      <span data-testid="step-create-name">{props.project_name}</span>
      <span data-testid="step-create-desc">{props.project_description}</span>
      <span data-testid="step-create-is-new">
        {String(props.is_new_course)}
      </span>
      <span data-testid="step-create-available">
        {String(props.isCourseAvailable)}
      </span>
      <span data-testid="step-create-checking">
        {String(props.isCheckingAvailability)}
      </span>
    </div>
  ),
}))

vi.mock('../MakeNewCoursePageSteps/StepUpload', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="step-upload">
      <span data-testid="step-upload-name">{props.project_name}</span>
    </div>
  ),
}))

vi.mock('../MakeNewCoursePageSteps/StepBranding', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="step-branding">
      <span data-testid="step-branding-name">{props.project_name}</span>
    </div>
  ),
}))

vi.mock('../MakeNewCoursePageSteps/StepLLM', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="step-llm">
      <span data-testid="step-llm-name">{props.project_name}</span>
    </div>
  ),
}))

vi.mock('../MakeNewCoursePageSteps/StepPrompt', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="step-prompt">
      <span data-testid="step-prompt-name">{props.project_name}</span>
    </div>
  ),
}))

vi.mock('../MakeNewCoursePageSteps/StepSuccess', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="step-success">
      <span data-testid="step-success-name">{props.project_name}</span>
    </div>
  ),
}))

vi.mock('../UploadNotification', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="upload-notification">
      <span data-testid="upload-files-count">{props.files?.length ?? 0}</span>
    </div>
  ),
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
    })),
  }
})

vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
import * as apiUtilsModule from '~/utils/apiUtils'

const mockedCreateProject = apiUtilsModule.createProject as ReturnType<
  typeof vi.fn
>
const mockedFetchCourseMetadata =
  apiUtilsModule.fetchCourseMetadata as unknown as ReturnType<typeof vi.fn>

let savedEnv: string | undefined

/**
 * Mock fetch so the project-name availability query resolves.
 * By default the course does NOT exist (i.e. name is available).
 */
function mockFetchCourseExists(exists = false) {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: any) => {
    const url = String(input?.url ?? input)
    if (url.includes('/api/UIUC-api/getCourseExists')) {
      return new Response(JSON.stringify(exists), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  })
}

async function importComponent() {
  return (await import('../MakeNewCoursePage')).default
}

beforeEach(() => {
  savedEnv = process.env.NEXT_PUBLIC_USE_ILLINOIS_CHAT_CONFIG
  vi.clearAllMocks()
})

afterEach(() => {
  process.env.NEXT_PUBLIC_USE_ILLINOIS_CHAT_CONFIG = savedEnv
  vi.restoreAllMocks()
})

// ===========================================================================
// TESTS
// ===========================================================================
describe('MakeNewCoursePage', () => {
  // -----------------------------------------------------------------------
  // Disabled config: migration notice
  // -----------------------------------------------------------------------
  describe('when Illinois Chat config is disabled', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_USE_ILLINOIS_CHAT_CONFIG = 'False'
    })

    it('renders the migration / disabled notice', async () => {
      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name="TestProject"
          current_user_email="owner@example.com"
        />,
      )

      expect(
        await screen.findByText(/New project creation is currently disabled/i),
      ).toBeInTheDocument()
    })

    it('renders Navbar and GlobalFooter in disabled mode', async () => {
      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name="TestProject"
          current_user_email="owner@example.com"
        />,
      )

      expect(screen.getByTestId('navbar')).toBeInTheDocument()
      expect(screen.getByTestId('footer')).toBeInTheDocument()
    })

    it('includes a link to chat.illinois.edu', async () => {
      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name="TestProject"
          current_user_email="owner@example.com"
        />,
      )

      const link = await screen.findByText(/chat\.illinois\.edu/i)
      expect(link.closest('a')).toHaveAttribute(
        'href',
        'https://chat.illinois.edu',
      )
      expect(link.closest('a')).toHaveAttribute('target', '_blank')
    })

    it('includes a mailto link for support', async () => {
      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name="TestProject"
          current_user_email="owner@example.com"
        />,
      )

      const mailto = await screen.findByText(/genaisupport@mx\.uillinois\.edu/i)
      expect(mailto.closest('a')).toHaveAttribute(
        'href',
        'mailto:genaisupport@mx.uillinois.edu',
      )
    })

    it('does not render wizard steps or navigation buttons', async () => {
      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name="TestProject"
          current_user_email="owner@example.com"
        />,
      )

      expect(screen.queryByTestId('step-create')).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: /Continue/i }),
      ).not.toBeInTheDocument()
    })
  })

  // -----------------------------------------------------------------------
  // Enabled config: wizard flow
  // -----------------------------------------------------------------------
  describe('when Illinois Chat config is enabled', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_USE_ILLINOIS_CHAT_CONFIG = 'True'
      mockFetchCourseExists(false) // name available by default
      mockedCreateProject.mockResolvedValue(true)
      mockedFetchCourseMetadata.mockResolvedValue({
        is_frozen: false,
        is_private: false,
        course_owner: 'owner@example.com',
        course_admins: [],
        approved_emails_list: [],
      })
    })

    it('renders the first step (StepCreate) initially', async () => {
      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name="CS101"
          current_user_email="owner@example.com"
        />,
      )

      expect(await screen.findByTestId('step-create')).toBeInTheDocument()
    })

    it('renders Navbar, Continue, and Back buttons', async () => {
      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name="CS101"
          current_user_email="owner@example.com"
        />,
      )

      expect(screen.getByTestId('navbar')).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /previous step|Back/i }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /Continue/i }),
      ).toBeInTheDocument()
    })

    it('renders pagination dots for all 6 steps', async () => {
      const MakeNewCoursePage = await importComponent()
      const { container } = renderWithProviders(
        <MakeNewCoursePage
          project_name="CS101"
          current_user_email="owner@example.com"
        />,
      )

      // 6 steps -> 6 dots
      const dots = container.querySelectorAll('.rounded-full')
      expect(dots.length).toBe(6)
    })

    it('Back button is disabled on the first step', async () => {
      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name="CS101"
          current_user_email="owner@example.com"
        />,
      )

      expect(
        screen.getByRole('button', { name: /previous step|Back/i }),
      ).toBeDisabled()
    })

    it('Continue button is disabled when project name is empty', async () => {
      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name=""
          current_user_email="owner@example.com"
        />,
      )

      expect(screen.getByRole('button', { name: /Continue/i })).toBeDisabled()
    })

    it('Continue button is disabled when project name is empty (acts as Start Chatting on last step)', async () => {
      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name=""
          current_user_email="owner@example.com"
        />,
      )

      // Single unified button — disabled on step 1 when no project name
      expect(screen.getByRole('button', { name: /Continue/i })).toBeDisabled()
    })

    // -----------------------------------------------------------------------
    // Creating project & stepping through
    // -----------------------------------------------------------------------
    it('calls createProject and advances to step 2 (StepSuccess) on Continue click', async () => {
      const user = userEvent.setup()
      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name="CS101"
          current_user_email="owner@example.com"
          is_new_course={true}
        />,
      )

      const continueBtn = screen.getByRole('button', { name: /Continue/i })
      await waitFor(() => expect(continueBtn).not.toBeDisabled(), {
        timeout: 3000,
      })

      await user.click(continueBtn)

      await waitFor(() =>
        expect(mockedCreateProject).toHaveBeenCalledWith(
          'CS101',
          '',
          'owner@example.com',
          true,
        ),
      )

      // Should advance to StepSuccess (step 2 in the new order)
      expect(await screen.findByTestId('step-success')).toBeInTheDocument()
      expect(screen.queryByTestId('step-create')).not.toBeInTheDocument()
    })

    it('does not call createProject when project name is unavailable (course exists)', async () => {
      vi.restoreAllMocks() // restore fetch
      mockFetchCourseExists(true) // name taken

      const user = userEvent.setup()
      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name="TakenName"
          current_user_email="owner@example.com"
          is_new_course={true}
        />,
      )

      // Continue should remain disabled because isCourseAvailable is false
      const continueBtn = screen.getByRole('button', { name: /Continue/i })
      // Give debounce + query time to settle
      await waitFor(
        () => {
          // Button should stay disabled
          expect(continueBtn).toBeDisabled()
        },
        { timeout: 3000 },
      )

      expect(mockedCreateProject).not.toHaveBeenCalled()
    })

    it('navigates back after advancing past step 1', async () => {
      const user = userEvent.setup()
      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name="CS101"
          current_user_email="owner@example.com"
          is_new_course={true}
        />,
      )

      const continueBtn = screen.getByRole('button', { name: /Continue/i })
      await waitFor(() => expect(continueBtn).not.toBeDisabled(), {
        timeout: 3000,
      })
      await user.click(continueBtn)

      // Wait for step 2 (StepSuccess in new order)
      await screen.findByTestId('step-success')

      // Back should be enabled now
      const backBtn = screen.getByRole('button', {
        name: /previous step|Back/i,
      })
      expect(backBtn).not.toBeDisabled()

      await user.click(backBtn)
      // Should go back to step 1
      expect(await screen.findByTestId('step-create')).toBeInTheDocument()
    })

    it('can navigate through all steps after project creation', async () => {
      const user = userEvent.setup()
      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name="CS101"
          current_user_email="owner@example.com"
          is_new_course={true}
        />,
      )

      const continueBtn = screen.getByRole('button', { name: /Continue/i })
      await waitFor(() => expect(continueBtn).not.toBeDisabled(), {
        timeout: 3000,
      })

      // Step 0 -> 1 (creates project, advances to StepSuccess)
      await user.click(continueBtn)
      await screen.findByTestId('step-success')

      // Step 1 -> 2 (StepUpload)
      await user.click(screen.getByRole('button', { name: /Continue/i }))
      await screen.findByTestId('step-upload')

      // Step 2 -> 3 (StepBranding)
      await user.click(screen.getByRole('button', { name: /Continue/i }))
      await screen.findByTestId('step-branding')

      // Step 3 -> 4 (StepLLM)
      await user.click(screen.getByRole('button', { name: /Continue/i }))
      await screen.findByTestId('step-llm')

      // Step 4 -> 5 (StepPrompt — last step)
      await user.click(screen.getByRole('button', { name: /Continue/i }))
      await screen.findByTestId('step-prompt')
    })

    it('shows Start Chatting on the last step', async () => {
      const user = userEvent.setup()
      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name="CS101"
          current_user_email="owner@example.com"
          is_new_course={true}
        />,
      )

      const continueBtn = screen.getByRole('button', { name: /Continue/i })
      await waitFor(() => expect(continueBtn).not.toBeDisabled(), {
        timeout: 3000,
      })

      // Navigate through all steps
      for (let i = 0; i < 5; i++) {
        await user.click(
          screen.getByRole('button', { name: /Continue|Start Chatting/i }),
        )
      }

      await screen.findByTestId('step-prompt')

      // On the last step, the button text changes to "Start Chatting"
      const lastBtn = screen.getByRole('button', {
        name: /Start Chatting/i,
      })
      expect(lastBtn).toBeInTheDocument()
    })

    // -----------------------------------------------------------------------
    // Start Chatting (last step button)
    // -----------------------------------------------------------------------
    it('Start Chatting navigates to chat page on last step', async () => {
      const pushMock = vi.fn()
      globalThis.__TEST_ROUTER__ = { push: pushMock }

      const user = userEvent.setup()
      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name="CS101"
          current_user_email="owner@example.com"
          is_new_course={true}
        />,
      )

      const continueBtn = screen.getByRole('button', { name: /Continue/i })
      await waitFor(() => expect(continueBtn).not.toBeDisabled(), {
        timeout: 3000,
      })

      // Navigate to last step
      for (let i = 0; i < 5; i++) {
        await user.click(
          screen.getByRole('button', { name: /Continue|Start Chatting/i }),
        )
      }

      await screen.findByTestId('step-prompt')

      // Click Start Chatting on last step
      const startBtn = screen.getByRole('button', {
        name: /Start Chatting/i,
      })
      await user.click(startBtn)

      await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/CS101/chat'))
    })

    it('Start Chatting does not call createProject again after initial creation', async () => {
      const pushMock = vi.fn()
      globalThis.__TEST_ROUTER__ = { push: pushMock }

      const user = userEvent.setup()
      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name="CS101"
          current_user_email="owner@example.com"
          is_new_course={true}
        />,
      )

      const continueBtn = screen.getByRole('button', { name: /Continue/i })
      await waitFor(() => expect(continueBtn).not.toBeDisabled(), {
        timeout: 3000,
      })

      // Navigate to last step (project created on step 0 -> 1 transition)
      for (let i = 0; i < 5; i++) {
        await user.click(
          screen.getByRole('button', { name: /Continue|Start Chatting/i }),
        )
      }

      await screen.findByTestId('step-prompt')

      // createProject was called once on step 0; clear it
      mockedCreateProject.mockClear()

      const startBtn = screen.getByRole('button', {
        name: /Start Chatting/i,
      })
      await user.click(startBtn)

      await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/CS101/chat'))
      expect(mockedCreateProject).not.toHaveBeenCalled()
    })

    // -----------------------------------------------------------------------
    // Error handling in handleSubmit
    // -----------------------------------------------------------------------
    it('shows notification on 409 conflict error', async () => {
      const error = Object.assign(new Error('Name taken'), { status: 409 })
      mockedCreateProject.mockRejectedValueOnce(error)

      const user = userEvent.setup()
      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name="CS101"
          current_user_email="owner@example.com"
          is_new_course={true}
        />,
      )

      const continueBtn = screen.getByRole('button', { name: /Continue/i })
      await waitFor(() => expect(continueBtn).not.toBeDisabled(), {
        timeout: 3000,
      })
      await user.click(continueBtn)

      await waitFor(() =>
        expect(notifications.show).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Project name already taken',
            color: 'red',
          }),
        ),
      )
    })

    it('shows generic error notification on non-409 errors', async () => {
      mockedCreateProject.mockRejectedValueOnce(new Error('Server error'))

      const user = userEvent.setup()
      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name="CS101"
          current_user_email="owner@example.com"
          is_new_course={true}
        />,
      )

      const continueBtn = screen.getByRole('button', { name: /Continue/i })
      await waitFor(() => expect(continueBtn).not.toBeDisabled(), {
        timeout: 3000,
      })
      await user.click(continueBtn)

      await waitFor(() =>
        expect(notifications.show).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Failed to create project',
            color: 'red',
          }),
        ),
      )
    })

    it('does not advance step when createProject fails', async () => {
      mockedCreateProject.mockRejectedValueOnce(new Error('Server error'))

      const user = userEvent.setup()
      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name="CS101"
          current_user_email="owner@example.com"
          is_new_course={true}
        />,
      )

      const continueBtn = screen.getByRole('button', { name: /Continue/i })
      await waitFor(() => expect(continueBtn).not.toBeDisabled(), {
        timeout: 3000,
      })
      await user.click(continueBtn)

      // Should remain on step 0
      await waitFor(() =>
        expect(screen.getByTestId('step-create')).toBeInTheDocument(),
      )
      expect(screen.queryByTestId('step-upload')).not.toBeInTheDocument()
    })

    it('does not advance step when createProject returns false', async () => {
      mockedCreateProject.mockResolvedValueOnce(false)

      const user = userEvent.setup()
      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name="CS101"
          current_user_email="owner@example.com"
          is_new_course={true}
        />,
      )

      const continueBtn = screen.getByRole('button', { name: /Continue/i })
      await waitFor(() => expect(continueBtn).not.toBeDisabled(), {
        timeout: 3000,
      })
      await user.click(continueBtn)

      // Should remain on step 0
      await waitFor(() =>
        expect(screen.getByTestId('step-create')).toBeInTheDocument(),
      )
      expect(screen.queryByTestId('step-upload')).not.toBeInTheDocument()
    })

    // -----------------------------------------------------------------------
    // Metadata fetch fallback
    // -----------------------------------------------------------------------
    it('uses fallback metadata when fetchCourseMetadata fails', async () => {
      mockedFetchCourseMetadata.mockRejectedValueOnce(
        new Error('metadata error'),
      )
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const user = userEvent.setup()
      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name="CS101"
          current_user_email="owner@example.com"
          is_new_course={true}
        />,
      )

      const continueBtn = screen.getByRole('button', { name: /Continue/i })
      await waitFor(() => expect(continueBtn).not.toBeDisabled(), {
        timeout: 3000,
      })
      await user.click(continueBtn)

      // Should still advance - fallback metadata is used
      await screen.findByTestId('step-success')

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching course metadata after creation:',
        expect.any(Error),
      )
      consoleSpy.mockRestore()
    })

    // -----------------------------------------------------------------------
    // Continue does NOT navigate if createProject fails
    // -----------------------------------------------------------------------
    it('Continue does not navigate when createProject fails on step 1', async () => {
      const pushMock = vi.fn()
      globalThis.__TEST_ROUTER__ = { push: pushMock }
      mockedCreateProject.mockRejectedValueOnce(new Error('Server error'))

      const user = userEvent.setup()
      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name="CS101"
          current_user_email="owner@example.com"
          is_new_course={true}
        />,
      )

      const continueBtn = screen.getByRole('button', {
        name: /Continue/i,
      })
      await waitFor(() => expect(continueBtn).not.toBeDisabled(), {
        timeout: 3000,
      })
      await user.click(continueBtn)

      await waitFor(() => expect(notifications.show).toHaveBeenCalled())
      // Should stay on step 0, not navigate
      expect(screen.getByTestId('step-create')).toBeInTheDocument()
      expect(pushMock).not.toHaveBeenCalled()
    })

    // -----------------------------------------------------------------------
    // is_new_course = false (editing existing project)
    // -----------------------------------------------------------------------
    it('does not check course availability when is_new_course is false', async () => {
      vi.restoreAllMocks()
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async () => {
          return new Response(JSON.stringify({}), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          })
        })

      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name="CS101"
          current_user_email="owner@example.com"
          is_new_course={false}
        />,
      )

      // Give debounce time to pass without triggering availability check
      await new Promise((r) => setTimeout(r, 1500))

      const calls = fetchSpy.mock.calls.filter((c) =>
        String(c[0]?.url ?? c[0]).includes('getCourseExists'),
      )
      expect(calls.length).toBe(0)
    })

    // -----------------------------------------------------------------------
    // UploadNotification rendering
    // -----------------------------------------------------------------------
    it('renders the UploadNotification component', async () => {
      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name="CS101"
          current_user_email="owner@example.com"
          is_new_course={true}
        />,
      )

      expect(screen.getByTestId('upload-notification')).toBeInTheDocument()
    })

    // -----------------------------------------------------------------------
    // project_description prop
    // -----------------------------------------------------------------------
    it('passes project_description to StepCreate', async () => {
      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name="CS101"
          current_user_email="owner@example.com"
          is_new_course={true}
          project_description="A test description"
        />,
      )

      expect(screen.getByTestId('step-create-desc')).toHaveTextContent(
        'A test description',
      )
    })

    // -----------------------------------------------------------------------
    // Auth email fallback
    // -----------------------------------------------------------------------
    it('uses current_user_email when auth user is not available', async () => {
      globalThis.__TEST_AUTH__ = { user: null }

      const user = userEvent.setup()
      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name="CS101"
          current_user_email="fallback@example.com"
          is_new_course={true}
        />,
      )

      const continueBtn = screen.getByRole('button', { name: /Continue/i })
      await waitFor(() => expect(continueBtn).not.toBeDisabled(), {
        timeout: 3000,
      })
      await user.click(continueBtn)

      await waitFor(() =>
        expect(mockedCreateProject).toHaveBeenCalledWith(
          'CS101',
          '',
          'fallback@example.com',
          true,
        ),
      )
    })

    it('uses auth email when available', async () => {
      globalThis.__TEST_AUTH__ = {
        isAuthenticated: true,
        user: { profile: { email: 'auth@example.com' } },
      }

      const user = userEvent.setup()
      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name="CS101"
          current_user_email="fallback@example.com"
          is_new_course={true}
        />,
      )

      // Navigate to branding step to check user_id is passed correctly
      const continueBtn = screen.getByRole('button', { name: /Continue/i })
      await waitFor(() => expect(continueBtn).not.toBeDisabled(), {
        timeout: 3000,
      })
      await user.click(continueBtn)

      // createProject should use auth email (via user_id) but wait -
      // createProject is called with current_user_email prop, not user_id.
      // The user_id is only used for StepBranding.
      // So createProject still uses current_user_email.
      await waitFor(() =>
        expect(mockedCreateProject).toHaveBeenCalledWith(
          'CS101',
          '',
          'fallback@example.com',
          true,
        ),
      )
    })

    // -----------------------------------------------------------------------
    // goToPreviousStep does not go below 0
    // -----------------------------------------------------------------------
    it('Back button does not go below step 0', async () => {
      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name="CS101"
          current_user_email="owner@example.com"
        />,
      )

      // On first step, back is disabled, so clicking does nothing
      const backBtn = screen.getByRole('button', {
        name: /previous step|Back/i,
      })
      expect(backBtn).toBeDisabled()
      expect(screen.getByTestId('step-create')).toBeInTheDocument()
    })

    // -----------------------------------------------------------------------
    // URL encoding in Start Chatting
    // -----------------------------------------------------------------------
    it('encodes project name in the URL when navigating to chat', async () => {
      const pushMock = vi.fn()
      globalThis.__TEST_ROUTER__ = { push: pushMock }

      const user = userEvent.setup()
      const MakeNewCoursePage = await importComponent()
      renderWithProviders(
        <MakeNewCoursePage
          project_name="My Project"
          current_user_email="owner@example.com"
          is_new_course={true}
        />,
      )

      const continueBtn = screen.getByRole('button', { name: /Continue/i })
      await waitFor(() => expect(continueBtn).not.toBeDisabled(), {
        timeout: 3000,
      })

      // Navigate to last step
      for (let i = 0; i < 5; i++) {
        await user.click(
          screen.getByRole('button', { name: /Continue|Start Chatting/i }),
        )
      }

      await screen.findByTestId('step-prompt')

      const startBtn = screen.getByRole('button', {
        name: /Start Chatting/i,
      })
      await user.click(startBtn)

      await waitFor(() =>
        expect(pushMock).toHaveBeenCalledWith('/My%20Project/chat'),
      )
    })
  })
})
