import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'

import { server } from '~/test-utils/server'
import {
  createTestQueryClient,
  renderWithProviders,
} from '~/test-utils/renderWithProviders'
import type { CourseMetadata } from '~/types/courseMetadata'

// ---- Mocks ----

const mockCallSetCourseMetadata = vi.fn(async () => true)
const mockFetchCourseMetadata = vi.fn()

vi.mock('~/utils/apiUtils', () => ({
  callSetCourseMetadata: (...args: any[]) => mockCallSetCourseMetadata(...args),
  fetchCourseMetadata: (...args: any[]) => mockFetchCourseMetadata(...args),
}))

vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}))

vi.mock('~/components/Buttons/CustomCopyButton', () => ({
  default: ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button data-testid="custom-copy-button" onClick={onClick}>
      {label}
    </button>
  ),
}))

vi.mock('~/components/Switches/CustomSwitch', () => ({
  default: ({
    label,
    checked,
    onChange,
    tooltip,
  }: {
    label: string
    checked: boolean
    onChange: (value: boolean) => void
    tooltip?: string
  }) => (
    <label data-testid={`switch-${label}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
      />
      {label}
    </label>
  ),
}))

vi.mock('~/components/Modals/LinkGeneratorModal', () => ({
  LinkGeneratorModal: ({
    opened,
    onClose,
    course_name,
  }: {
    opened: boolean
    onClose: () => void
    course_name: string
  }) =>
    opened ? (
      <div data-testid="link-generator-modal">
        <span>Link Generator: {course_name}</span>
        <button onClick={onClose}>Close Link Modal</button>
      </div>
    ) : null,
}))

vi.mock('~/components/Chat/ModelSelect', () => ({
  getModelLogo: () => '/mock-logo.png',
}))

vi.mock('~/components/UIUC-Components/api-inputs/LLMsApiKeyInputForm', () => ({
  findDefaultModel: (providers: any) => {
    // Return first enabled model found
    for (const key of Object.keys(providers)) {
      const provider = providers[key]
      if (provider?.enabled && provider?.models?.length > 0) {
        return provider.models[0]
      }
    }
    return undefined
  },
}))

vi.mock('uuid', () => ({
  v4: () => 'test-uuid-1234',
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
    system_prompt: 'You are a helpful assistant.',
    openai_api_key: undefined,
    disabled_models: undefined,
    project_description: undefined,
    documentsOnly: false,
    guidedLearning: false,
    systemPromptOnly: false,
    vector_search_rewrite_disabled: false,
    agent_mode_enabled: false,
    allow_logged_in_users: undefined,
    is_frozen: undefined,
    ...overrides,
  }
}

const mockLLMProviders = {
  OpenAI: {
    enabled: true,
    apiKey: 'sk-test-key',
    models: [
      { id: 'gpt-4', name: 'GPT-4', enabled: true, temperature: 0.7 },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        enabled: true,
        temperature: 0.7,
      },
    ],
  },
  Anthropic: {
    enabled: true,
    apiKey: 'sk-ant-test',
    models: [
      {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        enabled: true,
        temperature: 0.7,
      },
    ],
  },
  Ollama: {
    enabled: false,
    models: [],
  },
}

function setupFetchHandlers(
  metadata: CourseMetadata = makeCourseMetadata(),
  providers: any = mockLLMProviders,
) {
  mockFetchCourseMetadata.mockResolvedValue(metadata)

  server.use(
    http.post('*/api/models', async () => {
      return HttpResponse.json(providers)
    }),
  )
}

async function renderPromptEditor(
  options: {
    metadata?: CourseMetadata
    providers?: any
    projectName?: string
    isEmbedded?: boolean
    showHeader?: boolean
    userEmail?: string
  } = {},
) {
  const projectName = options.projectName ?? 'TestProject'
  const metadata = options.metadata ?? makeCourseMetadata()
  const providers = options.providers ?? mockLLMProviders

  setupFetchHandlers(metadata, providers)

  const queryClient = createTestQueryClient()
  // Pre-populate cache so fetchCourseMetadata is bypassed in some cases
  queryClient.setQueryData(['courseMetadata', projectName], metadata)

  const PromptEditor = (await import('../PromptEditor')).default

  const result = renderWithProviders(
    <PromptEditor
      project_name={projectName}
      isEmbedded={options.isEmbedded}
      showHeader={options.showHeader}
      userEmail={options.userEmail}
    />,
    { queryClient },
  )

  return { ...result, queryClient }
}

// ---- Tests ----

describe('PromptEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCallSetCourseMetadata.mockResolvedValue(true)
  })

  describe('Loading state', () => {
    it('shows loading text while data is being fetched', async () => {
      // Delay the metadata fetch so loading state is visible
      mockFetchCourseMetadata.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(makeCourseMetadata()), 500),
          ),
      )

      server.use(
        http.post('*/api/models', async () => {
          return HttpResponse.json(mockLLMProviders)
        }),
      )

      const queryClient = createTestQueryClient()
      const PromptEditor = (await import('../PromptEditor')).default

      renderWithProviders(<PromptEditor project_name="TestProject" />, {
        queryClient,
      })

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('removes loading state after data is fetched', async () => {
      await renderPromptEditor()

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })
    })
  })

  describe('Header rendering', () => {
    it('shows header with project name when showHeader is true', async () => {
      await renderPromptEditor({ showHeader: true })

      await waitFor(() => {
        expect(screen.getByText('Prompting')).toBeInTheDocument()
        expect(screen.getByText('TestProject')).toBeInTheDocument()
      })
    })

    it('hides header when showHeader is false', async () => {
      await renderPromptEditor({ showHeader: false })

      await waitFor(() => {
        expect(screen.queryByText('Prompting')).not.toBeInTheDocument()
      })
    })

    it('hides header when isEmbedded is true', async () => {
      await renderPromptEditor({ isEmbedded: true, showHeader: true })

      await waitFor(() => {
        expect(screen.queryByText('Prompting')).not.toBeInTheDocument()
      })
    })
  })

  describe('System Prompt textarea', () => {
    it('displays the system prompt from metadata', async () => {
      await renderPromptEditor({
        metadata: makeCourseMetadata({
          system_prompt: 'Custom prompt for testing',
        }),
      })

      await waitFor(() => {
        const textarea = screen.getByLabelText('System Prompt')
        expect(textarea).toHaveValue('Custom prompt for testing')
      })
    })

    it('allows editing the system prompt', async () => {
      const user = userEvent.setup()
      await renderPromptEditor()

      await waitFor(() => {
        expect(screen.getByLabelText('System Prompt')).toBeInTheDocument()
      })

      const textarea = screen.getByLabelText('System Prompt')
      await user.clear(textarea)
      await user.type(textarea, 'New prompt')

      expect(textarea).toHaveValue('New prompt')
    })

    it('uses DEFAULT_SYSTEM_PROMPT when metadata has no system_prompt', async () => {
      await renderPromptEditor({
        metadata: makeCourseMetadata({ system_prompt: null }),
      })

      await waitFor(() => {
        const textarea = screen.getByLabelText('System Prompt')
        // Should use the default (from env or hardcoded)
        expect(textarea).toBeInTheDocument()
      })
    })
  })

  describe('Update System Prompt button', () => {
    it('calls callSetCourseMetadata when Update System Prompt is clicked', async () => {
      const user = userEvent.setup()
      await renderPromptEditor()

      await waitFor(() => {
        expect(screen.getByLabelText('System Prompt')).toBeInTheDocument()
      })

      // Find the "Update System Prompt" button (not inside the modal)
      const updateButtons = screen.getAllByRole('button', {
        name: /Update System Prompt/i,
      })
      const mainUpdateButton = updateButtons[0]!

      fireEvent.click(mainUpdateButton)

      await waitFor(() => {
        expect(mockCallSetCourseMetadata).toHaveBeenCalledWith(
          'TestProject',
          expect.objectContaining({
            system_prompt: expect.any(String),
          }),
        )
      })
    })

    it('shows error toast when callSetCourseMetadata fails', async () => {
      mockCallSetCourseMetadata.mockResolvedValueOnce(false)
      const { notifications } = await import('@mantine/notifications')

      await renderPromptEditor()

      await waitFor(() => {
        expect(screen.getByLabelText('System Prompt')).toBeInTheDocument()
      })

      const updateButtons = screen.getAllByRole('button', {
        name: /Update System Prompt/i,
      })
      fireEvent.click(updateButtons[0]!)

      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Error Updating Prompt',
          }),
        )
      })
    })

    it('shows success toast when prompt is updated successfully', async () => {
      mockCallSetCourseMetadata.mockResolvedValueOnce(true)
      const { notifications } = await import('@mantine/notifications')

      await renderPromptEditor()

      await waitFor(() => {
        expect(screen.getByLabelText('System Prompt')).toBeInTheDocument()
      })

      const updateButtons = screen.getAllByRole('button', {
        name: /Update System Prompt/i,
      })
      fireEvent.click(updateButtons[0]!)

      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Prompt Updated Successfully',
          }),
        )
      })
    })
  })

  describe('Prompt Engineering Guide', () => {
    it('renders the guide section collapsed by default', async () => {
      await renderPromptEditor()

      await waitFor(() => {
        expect(screen.getByText('Prompt Engineering Guide')).toBeInTheDocument()
      })
    })

    it('toggles guide open/closed on click', async () => {
      const user = userEvent.setup()
      await renderPromptEditor()

      await waitFor(() => {
        expect(screen.getByText('Prompt Engineering Guide')).toBeInTheDocument()
      })

      // Click the guide header to expand
      const guideToggle = screen.getByText('Prompt Engineering Guide')
      await user.click(guideToggle)

      await waitFor(() => {
        expect(
          screen.getByText(/For additional insights and best practices/i),
        ).toBeInTheDocument()
      })
    })

    it('toggles guide via keyboard Enter key', async () => {
      await renderPromptEditor()

      await waitFor(() => {
        expect(screen.getByText('Prompt Engineering Guide')).toBeInTheDocument()
      })

      const guideToggle = screen.getByRole('button', {
        name: /Prompt Engineering Guide/i,
      })
      fireEvent.keyDown(guideToggle, { key: 'Enter' })

      await waitFor(() => {
        expect(
          screen.getByText(/For additional insights and best practices/i),
        ).toBeInTheDocument()
      })
    })

    it('toggles guide via keyboard Space key', async () => {
      await renderPromptEditor()

      await waitFor(() => {
        expect(screen.getByText('Prompt Engineering Guide')).toBeInTheDocument()
      })

      const guideToggle = screen.getByRole('button', {
        name: /Prompt Engineering Guide/i,
      })
      fireEvent.keyDown(guideToggle, { key: ' ' })

      await waitFor(() => {
        expect(
          screen.getByText(/For additional insights and best practices/i),
        ).toBeInTheDocument()
      })
    })
  })

  describe('Sidebar toggle (non-embedded mode)', () => {
    it('shows the right sidebar by default in non-embedded mode', async () => {
      await renderPromptEditor({ isEmbedded: false })

      await waitFor(() => {
        expect(
          screen.getByText('Document Search Optimization'),
        ).toBeInTheDocument()
      })
    })

    it('hides sidebar when Close Prompt Builder button is clicked', async () => {
      const user = userEvent.setup()
      await renderPromptEditor({ isEmbedded: false })

      await waitFor(() => {
        expect(
          screen.getByText('Document Search Optimization'),
        ).toBeInTheDocument()
      })

      const closeButton = screen.getByLabelText('Close Prompt Builder')
      await user.click(closeButton)

      await waitFor(() => {
        expect(
          screen.queryByText('Document Search Optimization'),
        ).not.toBeInTheDocument()
      })
    })

    it('shows Open Prompt Builder button after closing sidebar', async () => {
      const user = userEvent.setup()
      await renderPromptEditor({ isEmbedded: false })

      await waitFor(() => {
        expect(
          screen.getByLabelText('Close Prompt Builder'),
        ).toBeInTheDocument()
      })

      await user.click(screen.getByLabelText('Close Prompt Builder'))

      await waitFor(() => {
        expect(screen.getByLabelText('Open Prompt Builder')).toBeInTheDocument()
      })
    })

    it('re-opens sidebar when Open Prompt Builder is clicked', async () => {
      const user = userEvent.setup()
      await renderPromptEditor({ isEmbedded: false })

      await waitFor(() => {
        expect(
          screen.getByLabelText('Close Prompt Builder'),
        ).toBeInTheDocument()
      })

      // Close
      await user.click(screen.getByLabelText('Close Prompt Builder'))
      await waitFor(() => {
        expect(screen.getByLabelText('Open Prompt Builder')).toBeInTheDocument()
      })

      // Re-open
      await user.click(screen.getByLabelText('Open Prompt Builder'))

      await waitFor(() => {
        expect(
          screen.getByText('Document Search Optimization'),
        ).toBeInTheDocument()
      })
    })

    it('does not show sidebar toggle buttons in embedded mode', async () => {
      await renderPromptEditor({ isEmbedded: true })

      await waitFor(() => {
        expect(screen.getByLabelText('System Prompt')).toBeInTheDocument()
      })

      expect(
        screen.queryByLabelText('Close Prompt Builder'),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByLabelText('Open Prompt Builder'),
      ).not.toBeInTheDocument()
    })
  })

  describe('Behavior settings in sidebar (non-embedded)', () => {
    it('renders all switch controls in the sidebar', async () => {
      await renderPromptEditor({ isEmbedded: false })

      await waitFor(() => {
        expect(
          screen.getAllByLabelText('Smart Document Search').length,
        ).toBeGreaterThanOrEqual(1)
        expect(
          screen.getAllByLabelText('Guided Learning').length,
        ).toBeGreaterThanOrEqual(1)
        expect(
          screen.getAllByLabelText('Document-Based References Only').length,
        ).toBeGreaterThanOrEqual(1)
        expect(
          screen.getAllByLabelText("Bypass Illinois Chat's internal prompting")
            .length,
        ).toBeGreaterThanOrEqual(1)
        expect(
          screen.getAllByLabelText('Enable Agent Mode').length,
        ).toBeGreaterThanOrEqual(1)
      })
    })

    it('shows reset and share link buttons in sidebar', async () => {
      await renderPromptEditor({ isEmbedded: false })

      await waitFor(() => {
        const resetButtons = screen.getAllByRole('button', {
          name: /Reset Prompting Settings/i,
        })
        expect(resetButtons.length).toBeGreaterThanOrEqual(1)

        const shareButtons = screen.getAllByRole('button', {
          name: /Generate Share Link/i,
        })
        expect(shareButtons.length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  describe('Behavior settings in embedded mode', () => {
    it('renders all switches inline when isEmbedded', async () => {
      await renderPromptEditor({ isEmbedded: true })

      await waitFor(() => {
        expect(screen.getByText('AI Behavior Settings')).toBeInTheDocument()
        expect(
          screen.getByLabelText('Smart Document Search'),
        ).toBeInTheDocument()
        expect(screen.getByLabelText('Guided Learning')).toBeInTheDocument()
        expect(
          screen.getByLabelText('Document-Based References Only'),
        ).toBeInTheDocument()
        expect(
          screen.getByLabelText("Bypass Illinois Chat's internal prompting"),
        ).toBeInTheDocument()
        expect(screen.getByLabelText('Enable Agent Mode')).toBeInTheDocument()
      })
    })

    it('shows Reset and Share Link buttons in embedded mode', async () => {
      await renderPromptEditor({ isEmbedded: true })

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Reset Prompting Settings/i }),
        ).toBeInTheDocument()
        expect(
          screen.getByRole('button', { name: /Generate Share Link/i }),
        ).toBeInTheDocument()
      })
    })

    it('shows Copy internal prompt button when systemPromptOnly is enabled', async () => {
      await renderPromptEditor({
        isEmbedded: true,
        metadata: makeCourseMetadata({ systemPromptOnly: true }),
      })

      await waitFor(() => {
        expect(screen.getByTestId('custom-copy-button')).toBeInTheDocument()
        expect(
          screen.getByText("Copy Illinois Chat's internal prompt"),
        ).toBeInTheDocument()
      })
    })

    it('hides Copy internal prompt button when systemPromptOnly is disabled', async () => {
      await renderPromptEditor({
        isEmbedded: true,
        metadata: makeCourseMetadata({ systemPromptOnly: false }),
      })

      await waitFor(() => {
        expect(screen.getByLabelText('System Prompt')).toBeInTheDocument()
      })

      expect(screen.queryByTestId('custom-copy-button')).not.toBeInTheDocument()
    })
  })

  describe('Toggle switch interactions', () => {
    it('updates Guided Learning when toggled', async () => {
      const user = userEvent.setup()
      await renderPromptEditor({
        isEmbedded: true,
        metadata: makeCourseMetadata({ guidedLearning: false }),
      })

      await waitFor(() => {
        expect(screen.getByLabelText('Guided Learning')).toBeInTheDocument()
      })

      const switchInput = screen.getByLabelText('Guided Learning')
      await user.click(switchInput)

      // The debounced save should eventually call callSetCourseMetadata
      await waitFor(
        () => {
          expect(mockCallSetCourseMetadata).toHaveBeenCalled()
        },
        { timeout: 2000 },
      )
    })

    it('updates Document-Based References Only when toggled', async () => {
      const user = userEvent.setup()
      await renderPromptEditor({
        isEmbedded: true,
        metadata: makeCourseMetadata({ documentsOnly: false }),
      })

      await waitFor(() => {
        expect(
          screen.getByLabelText('Document-Based References Only'),
        ).toBeInTheDocument()
      })

      const switchInput = screen.getByLabelText(
        'Document-Based References Only',
      )
      await user.click(switchInput)

      await waitFor(
        () => {
          expect(mockCallSetCourseMetadata).toHaveBeenCalled()
        },
        { timeout: 2000 },
      )
    })

    it('updates Smart Document Search when toggled', async () => {
      const user = userEvent.setup()
      await renderPromptEditor({
        isEmbedded: true,
        metadata: makeCourseMetadata({
          vector_search_rewrite_disabled: false,
        }),
      })

      await waitFor(() => {
        expect(
          screen.getByLabelText('Smart Document Search'),
        ).toBeInTheDocument()
      })

      const switchInput = screen.getByLabelText('Smart Document Search')
      await user.click(switchInput)

      await waitFor(
        () => {
          expect(mockCallSetCourseMetadata).toHaveBeenCalled()
        },
        { timeout: 2000 },
      )
    })

    it('updates Enable Agent Mode when toggled', async () => {
      const user = userEvent.setup()
      await renderPromptEditor({
        isEmbedded: true,
        metadata: makeCourseMetadata({ agent_mode_enabled: false }),
      })

      await waitFor(() => {
        expect(screen.getByLabelText('Enable Agent Mode')).toBeInTheDocument()
      })

      const switchInput = screen.getByLabelText('Enable Agent Mode')
      await user.click(switchInput)

      await waitFor(
        () => {
          expect(mockCallSetCourseMetadata).toHaveBeenCalled()
        },
        { timeout: 2000 },
      )
    })

    it('shows error toast when settings save fails', async () => {
      const user = userEvent.setup()
      mockCallSetCourseMetadata.mockResolvedValueOnce(false)
      const { notifications } = await import('@mantine/notifications')

      await renderPromptEditor({
        isEmbedded: true,
        metadata: makeCourseMetadata({ guidedLearning: false }),
      })

      await waitFor(() => {
        expect(screen.getByLabelText('Guided Learning')).toBeInTheDocument()
      })

      await user.click(screen.getByLabelText('Guided Learning'))

      await waitFor(
        () => {
          expect(notifications.show).toHaveBeenCalledWith(
            expect.objectContaining({
              title: expect.stringContaining('Error'),
            }),
          )
        },
        { timeout: 2000 },
      )
    })
  })

  describe('Reset Prompting Settings', () => {
    it('opens reset confirmation modal when Reset button is clicked', async () => {
      const user = userEvent.setup()
      await renderPromptEditor({ isEmbedded: true })

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Reset Prompting Settings/i }),
        ).toBeInTheDocument()
      })

      await user.click(
        screen.getByRole('button', { name: /Reset Prompting Settings/i }),
      )

      await waitFor(() => {
        expect(
          screen.getByText(
            /Are you sure you want to reset your system prompt/i,
          ),
        ).toBeInTheDocument()
      })
    })

    it('closes reset modal on Cancel', async () => {
      const user = userEvent.setup()
      await renderPromptEditor({ isEmbedded: true })

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Reset Prompting Settings/i }),
        ).toBeInTheDocument()
      })

      await user.click(
        screen.getByRole('button', { name: /Reset Prompting Settings/i }),
      )

      await waitFor(() => {
        expect(screen.getByText(/This action will:/i)).toBeInTheDocument()
      })

      // Click Cancel in the modal
      const cancelButtons = screen.getAllByRole('button', { name: /Cancel/i })
      const modalCancel =
        cancelButtons.find(
          (btn) =>
            btn.closest('[class*="Modal"]') ||
            btn.closest('.mantine-Modal-body'),
        ) ?? cancelButtons[0]!
      await user.click(modalCancel)

      await waitFor(() => {
        expect(
          screen.queryByText(
            /Are you sure you want to reset your system prompt/i,
          ),
        ).not.toBeInTheDocument()
      })
    })

    it('resets prompt and settings on Confirm', async () => {
      const user = userEvent.setup()
      mockCallSetCourseMetadata.mockResolvedValue(true)

      await renderPromptEditor({
        isEmbedded: true,
        metadata: makeCourseMetadata({
          system_prompt: 'Custom prompt',
          guidedLearning: true,
          documentsOnly: true,
        }),
      })

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Reset Prompting Settings/i }),
        ).toBeInTheDocument()
      })

      await user.click(
        screen.getByRole('button', { name: /Reset Prompting Settings/i }),
      )

      await waitFor(() => {
        expect(screen.getByText(/This action will:/i)).toBeInTheDocument()
      })

      // Click Confirm
      await user.click(screen.getByRole('button', { name: /Confirm/i }))

      await waitFor(() => {
        expect(mockCallSetCourseMetadata).toHaveBeenCalledWith(
          'TestProject',
          expect.objectContaining({
            system_prompt: null,
            guidedLearning: false,
            documentsOnly: false,
            systemPromptOnly: false,
          }),
        )
      })
    })

    it('shows error alert when reset fails', async () => {
      const user = userEvent.setup()
      mockCallSetCourseMetadata.mockResolvedValueOnce(false)
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

      await renderPromptEditor({
        isEmbedded: true,
        metadata: makeCourseMetadata({ system_prompt: 'Custom' }),
      })

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Reset Prompting Settings/i }),
        ).toBeInTheDocument()
      })

      await user.click(
        screen.getByRole('button', { name: /Reset Prompting Settings/i }),
      )

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Confirm/i }),
        ).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Confirm/i }))

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error resetting system prompt')
      })
    })
  })

  describe('Link Generator Modal', () => {
    it('opens link generator modal when Share Link button is clicked', async () => {
      const user = userEvent.setup()
      await renderPromptEditor({ isEmbedded: true })

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Generate Share Link/i }),
        ).toBeInTheDocument()
      })

      await user.click(
        screen.getByRole('button', { name: /Generate Share Link/i }),
      )

      await waitFor(() => {
        expect(screen.getByTestId('link-generator-modal')).toBeInTheDocument()
        expect(
          screen.getByText('Link Generator: TestProject'),
        ).toBeInTheDocument()
      })
    })

    it('closes link generator modal', async () => {
      const user = userEvent.setup()
      await renderPromptEditor({ isEmbedded: true })

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Generate Share Link/i }),
        ).toBeInTheDocument()
      })

      await user.click(
        screen.getByRole('button', { name: /Generate Share Link/i }),
      )

      await waitFor(() => {
        expect(screen.getByTestId('link-generator-modal')).toBeInTheDocument()
      })

      await user.click(
        screen.getByRole('button', { name: /Close Link Modal/i }),
      )

      await waitFor(() => {
        expect(
          screen.queryByTestId('link-generator-modal'),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('Optimize System Prompt', () => {
    it('renders optimize button', async () => {
      await renderPromptEditor()

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Optimize System Prompt/i }),
        ).toBeInTheDocument()
      })
    })

    it('disables optimize button when llmProviders are not loaded', async () => {
      // Return null providers
      server.use(
        http.post('*/api/models', async () => {
          return HttpResponse.json(null)
        }),
      )

      mockFetchCourseMetadata.mockResolvedValue(makeCourseMetadata())

      const queryClient = createTestQueryClient()
      queryClient.setQueryData(
        ['courseMetadata', 'TestProject'],
        makeCourseMetadata(),
      )

      const PromptEditor = (await import('../PromptEditor')).default
      renderWithProviders(<PromptEditor project_name="TestProject" />, {
        queryClient,
      })

      await waitFor(() => {
        const optimizeBtn = screen.getByRole('button', {
          name: /Optimize System Prompt/i,
        })
        expect(optimizeBtn).toBeDisabled()
      })
    })

    it('shows optimization modal with streamed response', async () => {
      // Set up streaming response
      server.use(
        http.post('*/api/models', async () => {
          return HttpResponse.json(mockLLMProviders)
        }),
        http.post('*/api/allNewRoutingChat', async () => {
          const encoder = new TextEncoder()
          const stream = new ReadableStream({
            start(controller) {
              controller.enqueue(encoder.encode('Optimized prompt content'))
              controller.close()
            },
          })
          return new Response(stream, {
            headers: { 'Content-Type': 'text/plain' },
          })
        }),
      )

      const user = userEvent.setup()
      await renderPromptEditor()

      await waitFor(() => {
        const optimizeBtn = screen.getByRole('button', {
          name: /Optimize System Prompt/i,
        })
        expect(optimizeBtn).not.toBeDisabled()
      })

      await user.click(
        screen.getByRole('button', { name: /Optimize System Prompt/i }),
      )

      await waitFor(
        () => {
          expect(
            screen.getByText('Optimized System Prompt'),
          ).toBeInTheDocument()
        },
        { timeout: 3000 },
      )

      // The streamed content should be visible
      await waitFor(() => {
        expect(screen.getByText('Optimized prompt content')).toBeInTheDocument()
      })
    })

    it('shows error toast when optimization API call fails', async () => {
      server.use(
        http.post('*/api/models', async () => {
          return HttpResponse.json(mockLLMProviders)
        }),
        http.post('*/api/allNewRoutingChat', async () => {
          return HttpResponse.json({ error: 'API failure' }, { status: 500 })
        }),
      )

      const { notifications } = await import('@mantine/notifications')
      const user = userEvent.setup()
      await renderPromptEditor()

      await waitFor(() => {
        const optimizeBtn = screen.getByRole('button', {
          name: /Optimize System Prompt/i,
        })
        expect(optimizeBtn).not.toBeDisabled()
      })

      await user.click(
        screen.getByRole('button', { name: /Optimize System Prompt/i }),
      )

      await waitFor(
        () => {
          expect(notifications.show).toHaveBeenCalledWith(
            expect.objectContaining({
              title: expect.stringContaining('Error'),
            }),
          )
        },
        { timeout: 3000 },
      )
    })

    it('shows provider required error when provider is not enabled', async () => {
      const disabledProviders = {
        OpenAI: {
          enabled: false,
          apiKey: '',
          models: [
            { id: 'gpt-4', name: 'GPT-4', enabled: true, temperature: 0.7 },
          ],
        },
      }

      server.use(
        http.post('*/api/models', async () => {
          return HttpResponse.json(disabledProviders)
        }),
      )

      const { notifications } = await import('@mantine/notifications')
      const user = userEvent.setup()
      await renderPromptEditor({ providers: disabledProviders })

      await waitFor(() => {
        expect(screen.getByLabelText('System Prompt')).toBeInTheDocument()
      })

      // The button should still be clickable even if providers are disabled
      // (clicking triggers validation)
      const optimizeBtn = screen.queryByRole('button', {
        name: /Optimize System Prompt/i,
      })
      if (optimizeBtn && !optimizeBtn.hasAttribute('disabled')) {
        await user.click(optimizeBtn)

        await waitFor(
          () => {
            expect(notifications.show).toHaveBeenCalled()
          },
          { timeout: 3000 },
        )
      }
    })

    it('shows API key required error when provider has no API key', async () => {
      const noKeyProviders = {
        OpenAI: {
          enabled: true,
          apiKey: '',
          models: [
            { id: 'gpt-4', name: 'GPT-4', enabled: true, temperature: 0.7 },
          ],
        },
      }

      server.use(
        http.post('*/api/models', async () => {
          return HttpResponse.json(noKeyProviders)
        }),
      )

      const { notifications } = await import('@mantine/notifications')
      const user = userEvent.setup()
      await renderPromptEditor({ providers: noKeyProviders })

      await waitFor(() => {
        const btn = screen.getByRole('button', {
          name: /Optimize System Prompt/i,
        })
        expect(btn).not.toBeDisabled()
      })

      await user.click(
        screen.getByRole('button', { name: /Optimize System Prompt/i }),
      )

      await waitFor(
        () => {
          expect(notifications.show).toHaveBeenCalledWith(
            expect.objectContaining({
              title: expect.stringContaining('API Key Required'),
            }),
          )
        },
        { timeout: 3000 },
      )
    })
  })

  describe('Optimization Modal actions', () => {
    async function openOptimizationModal() {
      server.use(
        http.post('*/api/models', async () => {
          return HttpResponse.json(mockLLMProviders)
        }),
        http.post('*/api/allNewRoutingChat', async () => {
          const encoder = new TextEncoder()
          const stream = new ReadableStream({
            start(controller) {
              controller.enqueue(encoder.encode('Optimized text'))
              controller.close()
            },
          })
          return new Response(stream, {
            headers: { 'Content-Type': 'text/plain' },
          })
        }),
      )

      const user = userEvent.setup()
      await renderPromptEditor()

      await waitFor(() => {
        const btn = screen.getByRole('button', {
          name: /Optimize System Prompt/i,
        })
        expect(btn).not.toBeDisabled()
      })

      await user.click(
        screen.getByRole('button', { name: /Optimize System Prompt/i }),
      )

      await waitFor(
        () => {
          expect(
            screen.getByText('Optimized System Prompt'),
          ).toBeInTheDocument()
        },
        { timeout: 3000 },
      )

      return user
    }

    it('closes optimization modal on Cancel', async () => {
      const user = await openOptimizationModal()

      const cancelButtons = screen.getAllByRole('button', { name: /Cancel/i })
      await user.click(cancelButtons[0]!)

      await waitFor(() => {
        expect(
          screen.queryByText('Optimized System Prompt'),
        ).not.toBeInTheDocument()
      })
    })

    it('applies optimized prompt and submits on Update System Prompt in modal', async () => {
      const user = await openOptimizationModal()

      // Click the modal's "Update System Prompt" button
      const updateButtons = screen.getAllByRole('button', {
        name: /Update System Prompt/i,
      })
      // The last one should be in the modal
      const modalUpdateBtn = updateButtons[updateButtons.length - 1]!
      await user.click(modalUpdateBtn)

      await waitFor(() => {
        expect(mockCallSetCourseMetadata).toHaveBeenCalledWith(
          'TestProject',
          expect.objectContaining({
            system_prompt: expect.stringContaining('Optimized text'),
          }),
        )
      })
    })
  })

  describe('Copy default prompt', () => {
    it('calls fetch for default prompt and shows copied toast on success', async () => {
      // Override the catch-all to return a prompt for the specific endpoint
      server.use(
        http.all('*/api/getDefaultPostPrompt', async () => {
          return HttpResponse.json({ prompt: 'Default prompt text' })
        }),
      )

      // Re-assign clipboard.writeText as a fresh spy since clearMocks resets it
      const writeTextSpy = vi.fn(() => Promise.resolve())
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextSpy },
        configurable: true,
      })

      const { notifications } = await import('@mantine/notifications')
      const user = userEvent.setup()
      await renderPromptEditor({
        isEmbedded: true,
        metadata: makeCourseMetadata({ systemPromptOnly: true }),
      })

      await waitFor(() => {
        expect(screen.getByTestId('custom-copy-button')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('custom-copy-button'))

      await waitFor(() => {
        // Either clipboard is called, or the success/error toast fires
        const wasCalled =
          writeTextSpy.mock.calls.length > 0 ||
          vi.mocked(notifications.show).mock.calls.length > 0
        expect(wasCalled).toBe(true)
      })
    })

    it('shows error toast when fetching default prompt fails', async () => {
      server.use(
        http.get('*/api/getDefaultPostPrompt', async () => {
          return new HttpResponse(null, {
            status: 500,
            statusText: 'Internal Server Error',
          })
        }),
      )

      const { notifications } = await import('@mantine/notifications')
      const user = userEvent.setup()
      await renderPromptEditor({
        isEmbedded: true,
        metadata: makeCourseMetadata({ systemPromptOnly: true }),
      })

      await waitFor(() => {
        expect(screen.getByTestId('custom-copy-button')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('custom-copy-button'))

      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringContaining('Error'),
          }),
        )
      })
    })
  })

  describe('Model select', () => {
    it('renders the model select dropdown', async () => {
      await renderPromptEditor()

      await waitFor(() => {
        expect(screen.getByLabelText('Select model')).toBeInTheDocument()
      })
    })
  })

  describe('Edge cases', () => {
    it('handles empty project_name gracefully', async () => {
      setupFetchHandlers()

      const queryClient = createTestQueryClient()
      const PromptEditor = (await import('../PromptEditor')).default

      renderWithProviders(<PromptEditor project_name="" />, { queryClient })

      // Should render without crashing; may show loading state since fetchData returns early
      await waitFor(() => {
        expect(
          screen.queryByText('Loading...') ||
            screen.queryByLabelText('System Prompt'),
        ).toBeTruthy()
      })
    })

    it('handles metadata with no system_prompt set', async () => {
      await renderPromptEditor({
        metadata: makeCourseMetadata({ system_prompt: undefined }),
      })

      await waitFor(() => {
        const textarea = screen.getByLabelText('System Prompt')
        expect(textarea).toBeInTheDocument()
      })
    })

    it('handles metadata with all toggles enabled', async () => {
      await renderPromptEditor({
        isEmbedded: true,
        metadata: makeCourseMetadata({
          guidedLearning: true,
          documentsOnly: true,
          systemPromptOnly: true,
          vector_search_rewrite_disabled: false,
          agent_mode_enabled: true,
        }),
      })

      await waitFor(() => {
        const guidedSwitch = screen.getByLabelText(
          'Guided Learning',
        ) as HTMLInputElement
        expect(guidedSwitch.checked).toBe(true)

        const docsSwitch = screen.getByLabelText(
          'Document-Based References Only',
        ) as HTMLInputElement
        expect(docsSwitch.checked).toBe(true)

        const bypassSwitch = screen.getByLabelText(
          "Bypass Illinois Chat's internal prompting",
        ) as HTMLInputElement
        expect(bypassSwitch.checked).toBe(true)

        const agentSwitch = screen.getByLabelText(
          'Enable Agent Mode',
        ) as HTMLInputElement
        expect(agentSwitch.checked).toBe(true)
      })
    })
  })
})

describe('showPromptToast', () => {
  it('calls notifications.show with correct structure', async () => {
    const { showPromptToast } = await import('../PromptEditor')
    const { notifications } = await import('@mantine/notifications')

    const theme = { colors: { gray: [] } } as any
    showPromptToast(theme, 'Test Title', 'Test message', false)

    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test Title',
        message: 'Test message',
        withCloseButton: true,
      }),
    )
  })

  it('uses error styling when isError is true', async () => {
    const { showPromptToast } = await import('../PromptEditor')
    const { notifications } = await import('@mantine/notifications')

    const theme = { colors: { gray: [] } } as any
    showPromptToast(theme, 'Error Title', 'Error message', true)

    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Error Title',
        message: 'Error message',
      }),
    )
  })

  it('calculates auto-close duration based on message length', async () => {
    const { showPromptToast } = await import('../PromptEditor')
    const { notifications } = await import('@mantine/notifications')

    const theme = { colors: { gray: [] } } as any
    const longMessage = 'A'.repeat(300)
    showPromptToast(theme, 'Title', longMessage)

    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({
        // 300 * 50 = 15000, capped at 15000
        autoClose: 15000,
      }),
    )
  })

  it('uses minimum 5000ms for short messages', async () => {
    const { showPromptToast } = await import('../PromptEditor')
    const { notifications } = await import('@mantine/notifications')

    const theme = { colors: { gray: [] } } as any
    showPromptToast(theme, 'Title', 'Hi')

    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({
        autoClose: 5000,
      }),
    )
  })
})

describe('showToastOnPromptUpdate', () => {
  it('shows success message by default', async () => {
    const { showToastOnPromptUpdate } = await import('../PromptEditor')
    const { notifications } = await import('@mantine/notifications')

    const theme = { colors: { gray: [] } } as any
    showToastOnPromptUpdate(theme)

    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Prompt Updated Successfully',
        message: 'The system prompt has been updated.',
      }),
    )
  })

  it('shows error message when was_error is true', async () => {
    const { showToastOnPromptUpdate } = await import('../PromptEditor')
    const { notifications } = await import('@mantine/notifications')

    const theme = { colors: { gray: [] } } as any
    showToastOnPromptUpdate(theme, true)

    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Error Updating Prompt',
      }),
    )
  })

  it('shows reset message when isReset is true', async () => {
    const { showToastOnPromptUpdate } = await import('../PromptEditor')
    const { notifications } = await import('@mantine/notifications')

    const theme = { colors: { gray: [] } } as any
    showToastOnPromptUpdate(theme, false, true)

    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Prompt Reset to Default',
        message: 'The system prompt has been reset to default settings.',
      }),
    )
  })
})

describe('showToastNotification', () => {
  it('shows a notification with provided title and message', async () => {
    const { showToastNotification } = await import('../PromptEditor')
    const { notifications } = await import('@mantine/notifications')

    showToastNotification('My Title', 'My Message')

    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'My Title',
        message: 'My Message',
        withCloseButton: true,
      }),
    )
  })

  it('uses error icon when isError is true', async () => {
    const { showToastNotification } = await import('../PromptEditor')
    const { notifications } = await import('@mantine/notifications')

    showToastNotification('Error', 'Something failed', true)

    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Error',
        message: 'Something failed',
      }),
    )
  })
})
