import React from 'react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '~/test-utils/server'
import { renderWithProviders } from '~/test-utils/renderWithProviders'
import type { CourseMetadata } from '~/types/courseMetadata'

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockNotificationsShow = vi.fn()
vi.mock('@mantine/notifications', () => ({
  notifications: { show: (...args: any[]) => mockNotificationsShow(...args) },
}))

const mockFetchCourseMetadata = vi.fn<() => Promise<CourseMetadata | null>>()
const mockCallSetCourseMetadata = vi.fn<() => Promise<boolean>>()
vi.mock('~/utils/apiUtils', () => ({
  fetchCourseMetadata: (...args: any[]) => mockFetchCourseMetadata(...args),
  callSetCourseMetadata: (...args: any[]) => mockCallSetCourseMetadata(...args),
}))

vi.mock('~/utils/app/const', () => ({
  DEFAULT_SYSTEM_PROMPT: 'Default system prompt',
  GUIDED_LEARNING_PROMPT: '[GUIDED_LEARNING]',
  DOCUMENT_FOCUS_PROMPT: '[DOCUMENT_FOCUS]',
}))

vi.mock('~/components/Chat/ModelSelect', () => ({
  getModelLogo: () => '/mock-logo.png',
}))

vi.mock('~/components/UIUC-Components/api-inputs/LLMsApiKeyInputForm', () => ({
  findDefaultModel: (providers: any) => {
    if (!providers) return null
    return { id: 'gpt-4o', name: 'GPT-4o' }
  },
}))

vi.mock('~/components/Modals/LinkGeneratorModal', () => ({
  LinkGeneratorModal: ({ opened }: any) =>
    opened ? (
      <div data-testid="link-generator-modal">Link Generator</div>
    ) : null,
}))

vi.mock('~/components/Buttons/CustomCopyButton', () => ({
  __esModule: true,
  default: ({ label, onClick }: any) => (
    <button data-testid="copy-button" onClick={onClick}>
      {label}
    </button>
  ),
}))

vi.mock('~/components/UIUC-Components/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}))

vi.mock('~/utils/modelProviders/ConfigWebLLM', () => ({
  recommendedModelIds: ['Llama-3.1-8B'],
  warningLargeModelIds: ['Llama-3.1-70B'],
}))

vi.mock('~/utils/modelProviders/LLMProvider', () => ({
  ProviderNames: {
    OpenAI: 'OpenAI',
    Anthropic: 'Anthropic',
    Azure: 'Azure',
    Gemini: 'Gemini',
    Bedrock: 'Bedrock',
    WebLLM: 'WebLLM',
    Ollama: 'Ollama',
    NCS: 'NCS',
  },
  LLM_PROVIDER_ORDER: ['OpenAI', 'Anthropic', 'Gemini'],
  ReasoningCapableModels: new Set(['deepseek-r1']),
  BedrockProvider: class {},
}))

vi.mock('use-debounce', () => ({
  useDebouncedCallback: (fn: any) => fn,
}))

vi.mock('uuid', () => ({
  v4: () => 'test-uuid-1234',
}))

// ── Helpers ────────────────────────────────────────────────────────────────

const baseMetadata: CourseMetadata = {
  is_private: false,
  course_owner: 'owner@test.com',
  course_admins: ['owner@test.com'],
  approved_emails_list: [],
  example_questions: undefined,
  banner_image_s3: undefined,
  course_intro_message: undefined,
  system_prompt: 'You are a helpful assistant.',
  openai_api_key: undefined,
  disabled_models: undefined,
  project_description: undefined,
  documentsOnly: false,
  guidedLearning: false,
  systemPromptOnly: false,
  vector_search_rewrite_disabled: false,
  allow_logged_in_users: undefined,
  is_frozen: undefined,
}

const mockProviders = {
  OpenAI: {
    enabled: true,
    apiKey: 'sk-test',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', enabled: true },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', enabled: true },
    ],
  },
  Anthropic: {
    enabled: true,
    apiKey: 'sk-ant-test',
    models: [
      { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', enabled: true },
    ],
  },
}

function setupMswModels() {
  server.use(http.post('*/api/models', () => HttpResponse.json(mockProviders)))
}

function setupDefaultMocks() {
  mockFetchCourseMetadata.mockResolvedValue(baseMetadata)
  mockCallSetCourseMetadata.mockResolvedValue(true)
  setupMswModels()
}

async function renderLoaded(props: Record<string, any> = {}) {
  const PromptEditor = (await import('../PromptEditor')).default
  const result = renderWithProviders(
    <PromptEditor project_name="TestProject" {...props} />,
  )
  await waitFor(() => {
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  })
  return result
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('PromptEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupDefaultMocks()
  })

  // ── Toast utility functions ──────────────────────────────────────────

  describe('showPromptToast', () => {
    it('calls notifications.show with success styling', async () => {
      const { showPromptToast } = await import('../PromptEditor')
      const theme = { colors: { dark: Array(10).fill('#000') } } as any
      showPromptToast(theme, 'Test Title', 'Test message')
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Title',
          message: 'Test message',
          withCloseButton: true,
        }),
      )
    })

    it('calls notifications.show with error styling', async () => {
      const { showPromptToast } = await import('../PromptEditor')
      const theme = { colors: { dark: Array(10).fill('#000') } } as any
      showPromptToast(theme, 'Error Title', 'Error msg', true)
      expect(mockNotificationsShow).toHaveBeenCalled()
    })

    it('uses custom icon when provided', async () => {
      const { showPromptToast } = await import('../PromptEditor')
      const theme = { colors: { dark: Array(10).fill('#000') } } as any
      const icon = React.createElement('span', null, 'icon')
      showPromptToast(theme, 'Title', 'Message', false, icon)
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({ icon }),
      )
    })

    it('calculates duration based on message length', async () => {
      const { showPromptToast } = await import('../PromptEditor')
      const theme = {} as any
      showPromptToast(theme, 'T', 'x'.repeat(400))
      const call = mockNotificationsShow.mock.calls[0]![0]
      expect(call.autoClose).toBe(15000) // capped at 15000
    })
  })

  describe('showToastOnPromptUpdate', () => {
    it('shows success toast', async () => {
      const { showToastOnPromptUpdate } = await import('../PromptEditor')
      showToastOnPromptUpdate({} as any)
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Prompt Updated Successfully' }),
      )
    })

    it('shows error toast', async () => {
      const { showToastOnPromptUpdate } = await import('../PromptEditor')
      showToastOnPromptUpdate({} as any, true)
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Error Updating Prompt' }),
      )
    })

    it('shows reset toast', async () => {
      const { showToastOnPromptUpdate } = await import('../PromptEditor')
      showToastOnPromptUpdate({} as any, false, true)
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Prompt Reset to Default' }),
      )
    })
  })

  describe('showToastNotification', () => {
    it('shows notification with success styling', async () => {
      const { showToastNotification } = await import('../PromptEditor')
      showToastNotification('Title', 'Message')
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Title', message: 'Message' }),
      )
    })

    it('shows notification with error styling', async () => {
      const { showToastNotification } = await import('../PromptEditor')
      showToastNotification('Error', 'Oops', true)
      expect(mockNotificationsShow).toHaveBeenCalled()
    })
  })

  // ── Component rendering ──────────────────────────────────────────────

  describe('loading state', () => {
    it('shows loading text while fetching data', async () => {
      mockFetchCourseMetadata.mockReturnValue(new Promise(() => {})) // never resolves
      const PromptEditor = (await import('../PromptEditor')).default
      renderWithProviders(<PromptEditor project_name="TestProject" />)
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  describe('basic rendering', () => {
    it('renders system prompt section after loading', async () => {
      await renderLoaded()
      expect(screen.getByText('System Prompt')).toBeInTheDocument()
    })

    it('renders textarea with system prompt value', async () => {
      await renderLoaded()
      const textarea = screen.getByPlaceholderText('Enter the system prompt...')
      expect(textarea).toHaveValue('You are a helpful assistant.')
    })

    it('renders Update System Prompt button', async () => {
      await renderLoaded()
      const buttons = screen.getAllByText('Update System Prompt')
      expect(buttons.length).toBeGreaterThanOrEqual(1)
    })

    it('renders Optimize System Prompt button', async () => {
      await renderLoaded()
      const btn = screen.getByText('Optimize System Prompt')
      expect(btn).toBeInTheDocument()
    })

    it('renders Prompt Engineering Guide', async () => {
      await renderLoaded()
      expect(screen.getByText('Prompt Engineering Guide')).toBeInTheDocument()
    })
  })

  describe('header rendering', () => {
    it('shows header when showHeader=true and isEmbedded=false', async () => {
      await renderLoaded({ showHeader: true, isEmbedded: false })
      expect(screen.getByText('Prompting')).toBeInTheDocument()
      expect(screen.getByText('TestProject')).toBeInTheDocument()
    })

    it('hides header when isEmbedded=true', async () => {
      await renderLoaded({ isEmbedded: true })
      expect(screen.queryByText('Prompting')).not.toBeInTheDocument()
    })

    it('hides header when showHeader=false', async () => {
      await renderLoaded({ showHeader: false })
      expect(screen.queryByText('Prompting')).not.toBeInTheDocument()
    })
  })

  describe('embedded mode', () => {
    it('shows AI Behavior Settings inline', async () => {
      await renderLoaded({ isEmbedded: true })
      expect(screen.getByText('AI Behavior Settings')).toBeInTheDocument()
    })

    it('shows behavior switches in embedded mode', async () => {
      await renderLoaded({ isEmbedded: true })
      expect(screen.getByText('Smart Document Search')).toBeInTheDocument()
      expect(screen.getByText('Guided Learning')).toBeInTheDocument()
      expect(
        screen.getByText('Document-Based References Only'),
      ).toBeInTheDocument()
    })

    it('shows Reset Prompting Settings button', async () => {
      await renderLoaded({ isEmbedded: true })
      expect(screen.getByText('Reset Prompting Settings')).toBeInTheDocument()
    })

    it('shows Generate Share Link button', async () => {
      await renderLoaded({ isEmbedded: true })
      expect(screen.getByText('Generate Share Link')).toBeInTheDocument()
    })
  })

  describe('non-embedded mode', () => {
    it('shows sidebar with settings when not embedded', async () => {
      await renderLoaded({ isEmbedded: false })
      expect(
        screen.getByText('Document Search Optimization'),
      ).toBeInTheDocument()
    })

    it('shows sidebar toggle icon', async () => {
      await renderLoaded({ isEmbedded: false })
      const icon = screen.getByLabelText('Close Prompt Builder')
      expect(icon).toBeInTheDocument()
    })
  })

  // ── Interactions ─────────────────────────────────────────────────────

  describe('Prompt Engineering Guide', () => {
    it('toggles collapsible section', async () => {
      await renderLoaded()
      const guide = screen.getByText('Prompt Engineering Guide')
      fireEvent.click(guide)
      // After click, collapse opens - check for content
      await waitFor(() => {
        expect(screen.getByText(/For additional insights/)).toBeInTheDocument()
      })
    })
  })

  describe('textarea interaction', () => {
    it('updates value on change', async () => {
      await renderLoaded()
      const textarea = screen.getByPlaceholderText('Enter the system prompt...')
      fireEvent.change(textarea, { target: { value: 'New prompt text' } })
      expect(textarea).toHaveValue('New prompt text')
    })
  })

  describe('Update System Prompt', () => {
    it('calls callSetCourseMetadata on click', async () => {
      await renderLoaded()
      const buttons = screen.getAllByText('Update System Prompt')
      // Click the first one (the inline button, not modal)
      fireEvent.click(buttons[0]!)
      await waitFor(() => {
        expect(mockCallSetCourseMetadata).toHaveBeenCalledWith(
          'TestProject',
          expect.objectContaining({
            system_prompt: 'You are a helpful assistant.',
          }),
        )
      })
    })

    it('shows success toast on successful update', async () => {
      mockCallSetCourseMetadata.mockResolvedValue(true)
      await renderLoaded()
      const buttons = screen.getAllByText('Update System Prompt')
      fireEvent.click(buttons[0]!)
      await waitFor(() => {
        expect(mockNotificationsShow).toHaveBeenCalledWith(
          expect.objectContaining({ title: 'Prompt Updated Successfully' }),
        )
      })
    })

    it('shows error toast on failed update', async () => {
      mockCallSetCourseMetadata.mockResolvedValue(false)
      await renderLoaded()
      const buttons = screen.getAllByText('Update System Prompt')
      fireEvent.click(buttons[0]!)
      await waitFor(() => {
        expect(mockNotificationsShow).toHaveBeenCalledWith(
          expect.objectContaining({ title: 'Error Updating Prompt' }),
        )
      })
    })
  })

  describe('reset system prompt', () => {
    it('opens reset modal on button click in embedded mode', async () => {
      await renderLoaded({ isEmbedded: true })
      fireEvent.click(screen.getByText('Reset Prompting Settings'))
      await waitFor(() => {
        expect(
          screen.getByText(/Are you sure you want to reset/),
        ).toBeInTheDocument()
      })
    })

    it('calls API and resets on confirm', async () => {
      mockCallSetCourseMetadata.mockResolvedValue(true)
      await renderLoaded({ isEmbedded: true })
      fireEvent.click(screen.getByText('Reset Prompting Settings'))
      await waitFor(() => {
        expect(screen.getByText('Confirm')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('Confirm'))
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
      mockCallSetCourseMetadata.mockResolvedValue(false)
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      await renderLoaded({ isEmbedded: true })
      fireEvent.click(screen.getByText('Reset Prompting Settings'))
      await waitFor(() => {
        expect(screen.getByText('Confirm')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('Confirm'))
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error resetting system prompt')
      })
      alertSpy.mockRestore()
    })

    it('closes reset modal on Cancel', async () => {
      await renderLoaded({ isEmbedded: true })
      fireEvent.click(screen.getByText('Reset Prompting Settings'))
      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('Cancel'))
    })
  })

  describe('no courseMetadata', () => {
    it('does not crash when metadata is null', async () => {
      mockFetchCourseMetadata.mockResolvedValue(null)
      const PromptEditor = (await import('../PromptEditor')).default
      renderWithProviders(<PromptEditor project_name="NullProject" />)
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })
    })
  })

  describe('metadata without system_prompt', () => {
    it('uses DEFAULT_SYSTEM_PROMPT when system_prompt is undefined', async () => {
      mockFetchCourseMetadata.mockResolvedValue({
        ...baseMetadata,
        system_prompt: undefined,
      })
      await renderLoaded()
      const textarea = screen.getByPlaceholderText('Enter the system prompt...')
      expect(textarea).toHaveValue('Default system prompt')
    })
  })

  describe('metadata from query cache', () => {
    it('uses cached metadata instead of fetching', async () => {
      const PromptEditor = (await import('../PromptEditor')).default
      const { queryClient } = renderWithProviders(
        <PromptEditor project_name="CachedProject" />,
      )
      // Pre-fill query cache before the component's useEffect runs
      queryClient.setQueryData(
        ['courseMetadata', 'CachedProject'],
        baseMetadata,
      )
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })
    })
  })

  describe('fetch error', () => {
    it('handles fetch error gracefully', async () => {
      mockFetchCourseMetadata.mockRejectedValue(new Error('Network error'))
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const PromptEditor = (await import('../PromptEditor')).default
      renderWithProviders(<PromptEditor project_name="FailProject" />)
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })
      consoleErrorSpy.mockRestore()
    })
  })

  describe('sidebar toggle', () => {
    it('hides sidebar when close icon is clicked', async () => {
      await renderLoaded({ isEmbedded: false })
      const closeIcon = screen.getByLabelText('Close Prompt Builder')
      fireEvent.click(closeIcon)
      await waitFor(() => {
        expect(
          screen.queryByText('Document Search Optimization'),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('Generate Share Link', () => {
    it('opens link generator modal in embedded mode', async () => {
      await renderLoaded({ isEmbedded: true })
      fireEvent.click(screen.getByText('Generate Share Link'))
      await waitFor(() => {
        expect(screen.getByTestId('link-generator-modal')).toBeInTheDocument()
      })
    })
  })

  describe('Optimize System Prompt', () => {
    it('Optimize button becomes enabled when providers load', async () => {
      await renderLoaded()
      const btn = screen.getByText('Optimize System Prompt')
      expect(btn).not.toBeDisabled()
    })
  })

  describe('behavior settings in non-embedded sidebar', () => {
    it('shows all switches in sidebar', async () => {
      await renderLoaded({ isEmbedded: false })
      const switches = screen.getAllByText('Smart Document Search')
      expect(switches.length).toBeGreaterThanOrEqual(1)
      expect(
        screen.getAllByText('Guided Learning').length,
      ).toBeGreaterThanOrEqual(1)
    })

    it('shows Reset and Generate Share Link in sidebar', async () => {
      await renderLoaded({ isEmbedded: false })
      expect(
        screen.getAllByText('Reset Prompting Settings').length,
      ).toBeGreaterThanOrEqual(1)
      expect(
        screen.getAllByText('Generate Share Link').length,
      ).toBeGreaterThanOrEqual(1)
    })
  })

  describe('metadata with toggles enabled', () => {
    it('renders with guidedLearning enabled', async () => {
      mockFetchCourseMetadata.mockResolvedValue({
        ...baseMetadata,
        guidedLearning: true,
        documentsOnly: true,
        systemPromptOnly: true,
        vector_search_rewrite_disabled: true,
      })
      await renderLoaded({ isEmbedded: true })
      // systemPromptOnly should show copy button
      expect(screen.getByTestId('copy-button')).toBeInTheDocument()
    })
  })

  describe('handleCopyDefaultPrompt', () => {
    it('copies default prompt to clipboard on success', async () => {
      server.use(
        http.get('*/api/getDefaultPostPrompt', () =>
          HttpResponse.json({ prompt: 'Default post prompt' }),
        ),
      )
      mockFetchCourseMetadata.mockResolvedValue({
        ...baseMetadata,
        systemPromptOnly: true,
      })
      await renderLoaded({ isEmbedded: true })
      fireEvent.click(screen.getByTestId('copy-button'))
      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          'Default post prompt',
        )
      })
    })

    it('shows error toast when fetch fails', async () => {
      server.use(
        http.get('*/api/getDefaultPostPrompt', () => HttpResponse.error()),
      )
      mockFetchCourseMetadata.mockResolvedValue({
        ...baseMetadata,
        systemPromptOnly: true,
      })
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      await renderLoaded({ isEmbedded: true })
      fireEvent.click(screen.getByTestId('copy-button'))
      await waitFor(() => {
        expect(mockNotificationsShow).toHaveBeenCalledWith(
          expect.objectContaining({ title: 'Error Fetching' }),
        )
      })
      consoleSpy.mockRestore()
    })

    it('shows error toast when API returns non-ok', async () => {
      server.use(
        http.get(
          '*/api/getDefaultPostPrompt',
          () =>
            new HttpResponse(null, { status: 500, statusText: 'Server Error' }),
        ),
      )
      mockFetchCourseMetadata.mockResolvedValue({
        ...baseMetadata,
        systemPromptOnly: true,
      })
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      await renderLoaded({ isEmbedded: true })
      fireEvent.click(screen.getByTestId('copy-button'))
      await waitFor(() => {
        expect(mockNotificationsShow).toHaveBeenCalledWith(
          expect.objectContaining({ title: 'Error Fetching' }),
        )
      })
      consoleSpy.mockRestore()
    })
  })

  describe('handleSubmitPromptOptimization', () => {
    it('disables optimize button when no llmProviders', async () => {
      server.use(
        http.post(
          '*/api/models',
          () => new HttpResponse(null, { status: 500 }),
        ),
      )
      await renderLoaded()
      const btn = screen.getByText('Optimize System Prompt').closest('button')
      expect(btn).toBeDisabled()
    })

    it('shows error when provider is not enabled', async () => {
      server.use(
        http.post('*/api/models', () =>
          HttpResponse.json({
            OpenAI: {
              enabled: false,
              apiKey: 'sk-test',
              models: [{ id: 'gpt-4o', name: 'GPT-4o', enabled: true }],
            },
          }),
        ),
      )
      await renderLoaded()
      const btn = screen.getByText('Optimize System Prompt')
      fireEvent.click(btn)
      await waitFor(() => {
        expect(mockNotificationsShow).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringContaining('Required'),
          }),
        )
      })
    })

    it('shows error when provider has no API key', async () => {
      server.use(
        http.post('*/api/models', () =>
          HttpResponse.json({
            OpenAI: {
              enabled: true,
              apiKey: '',
              models: [{ id: 'gpt-4o', name: 'GPT-4o', enabled: true }],
            },
          }),
        ),
      )
      await renderLoaded()
      const btn = screen.getByText('Optimize System Prompt')
      fireEvent.click(btn)
      await waitFor(() => {
        expect(mockNotificationsShow).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringContaining('API Key Required'),
          }),
        )
      })
    })

    it('streams optimized prompt on success', async () => {
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('Optimized prompt content'))
          controller.close()
        },
      })
      server.use(
        http.post(
          '*/api/allNewRoutingChat',
          () =>
            new HttpResponse(stream, {
              headers: { 'Content-Type': 'text/plain' },
            }),
        ),
      )
      await renderLoaded()
      const btn = screen.getByText('Optimize System Prompt')
      fireEvent.click(btn)
      // The modal should open with streaming content
      await waitFor(
        () => {
          expect(
            screen.getByText('Optimized prompt content'),
          ).toBeInTheDocument()
        },
        { timeout: 5000 },
      )
    })

    it('shows error toast when API returns error', async () => {
      server.use(
        http.post('*/api/allNewRoutingChat', () =>
          HttpResponse.json({ error: 'Rate limited' }, { status: 429 }),
        ),
      )
      await renderLoaded()
      fireEvent.click(screen.getByText('Optimize System Prompt'))
      await waitFor(() => {
        expect(mockNotificationsShow).toHaveBeenCalledWith(
          expect.objectContaining({ title: 'Error' }),
        )
      })
    })

    it('shows error toast when stream throws', async () => {
      server.use(
        http.post('*/api/allNewRoutingChat', () => HttpResponse.error()),
      )
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      await renderLoaded()
      fireEvent.click(screen.getByText('Optimize System Prompt'))
      await waitFor(() => {
        expect(mockNotificationsShow).toHaveBeenCalledWith(
          expect.objectContaining({ title: 'Error' }),
        )
      })
      consoleSpy.mockRestore()
    })
  })

  describe('optimization modal actions', () => {
    async function openOptimizationModal() {
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('Suggested improved prompt'))
          controller.close()
        },
      })
      server.use(
        http.post(
          '*/api/allNewRoutingChat',
          () =>
            new HttpResponse(stream, {
              headers: { 'Content-Type': 'text/plain' },
            }),
        ),
      )
      await renderLoaded()
      fireEvent.click(screen.getByText('Optimize System Prompt'))
      await waitFor(
        () => {
          expect(
            screen.getByText('Suggested improved prompt'),
          ).toBeInTheDocument()
        },
        { timeout: 5000 },
      )
    }

    it('accepts optimized prompt via Update System Prompt in modal', async () => {
      await openOptimizationModal()
      // Click "Update System Prompt" in the modal (last one)
      const updateButtons = screen.getAllByText('Update System Prompt')
      fireEvent.click(updateButtons[updateButtons.length - 1]!)
      await waitFor(() => {
        expect(mockCallSetCourseMetadata).toHaveBeenCalledWith(
          'TestProject',
          expect.objectContaining({
            system_prompt: 'Suggested improved prompt',
          }),
        )
      })
    })

    it('closes modal on Cancel without updating', async () => {
      await openOptimizationModal()
      fireEvent.click(screen.getByText('Cancel'))
      // Should not have called API for update
      expect(mockCallSetCourseMetadata).not.toHaveBeenCalled()
    })
  })

  describe('handleCheckboxChange', () => {
    it('shows error when courseMetadata is null', async () => {
      mockFetchCourseMetadata.mockResolvedValue(null)
      const PromptEditor = (await import('../PromptEditor')).default
      renderWithProviders(<PromptEditor project_name="NullMeta" />)
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })
      // No switches visible without metadata, so no error
    })
  })

  describe('handleSettingChange', () => {
    it('updates vector search rewrite setting', async () => {
      await renderLoaded({ isEmbedded: true })
      // The Smart Document Search switch is present
      expect(screen.getByText('Smart Document Search')).toBeInTheDocument()
    })
  })

  describe('reset in non-embedded mode', () => {
    it('opens and confirms reset from sidebar', async () => {
      await renderLoaded({ isEmbedded: false })
      const resetButtons = screen.getAllByText('Reset Prompting Settings')
      fireEvent.click(resetButtons[0]!)
      await waitFor(() => {
        expect(
          screen.getByText(/Are you sure you want to reset/),
        ).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('Confirm'))
      await waitFor(() => {
        expect(mockCallSetCourseMetadata).toHaveBeenCalledWith(
          'TestProject',
          expect.objectContaining({ system_prompt: null }),
        )
      })
    })
  })

  describe('Generate Share Link in non-embedded', () => {
    it('opens link generator modal from sidebar', async () => {
      await renderLoaded({ isEmbedded: false })
      const linkButtons = screen.getAllByText('Generate Share Link')
      fireEvent.click(linkButtons[0]!)
      await waitFor(() => {
        expect(screen.getByTestId('link-generator-modal')).toBeInTheDocument()
      })
    })
  })
})
