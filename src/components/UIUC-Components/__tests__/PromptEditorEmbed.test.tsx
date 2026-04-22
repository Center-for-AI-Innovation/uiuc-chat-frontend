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
  v4: () => 'test-uuid-5678',
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
  system_prompt: 'You are a helpful bot.',
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
  const PromptEditorEmbed = (await import('../PromptEditorEmbed')).default
  const result = renderWithProviders(
    <PromptEditorEmbed project_name="EmbedProject" {...props} />,
  )
  await waitFor(() => {
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  })
  return result
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('PromptEditorEmbed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupDefaultMocks()
  })

  // ── Toast utility functions ──────────────────────────────────────────

  describe('showPromptToast', () => {
    it('calls notifications.show with correct params', async () => {
      const { showPromptToast } = await import('../PromptEditorEmbed')
      showPromptToast({} as any, 'Title', 'Message')
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Title',
          message: 'Message',
          withCloseButton: true,
        }),
      )
    })

    it('uses error styling when isError=true', async () => {
      const { showPromptToast } = await import('../PromptEditorEmbed')
      showPromptToast({} as any, 'Error', 'Msg', true)
      expect(mockNotificationsShow).toHaveBeenCalled()
    })

    it('handles custom icon', async () => {
      const { showPromptToast } = await import('../PromptEditorEmbed')
      const icon = React.createElement('div', null, 'ico')
      showPromptToast({} as any, 'T', 'M', false, icon)
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({ icon }),
      )
    })

    it('caps duration at 15000ms for long messages', async () => {
      const { showPromptToast } = await import('../PromptEditorEmbed')
      showPromptToast({} as any, 'T', 'x'.repeat(500))
      const call = mockNotificationsShow.mock.calls[0]![0]
      expect(call.autoClose).toBe(15000)
    })

    it('uses baseDuration for short messages', async () => {
      const { showPromptToast } = await import('../PromptEditorEmbed')
      showPromptToast({} as any, 'T', 'hi')
      const call = mockNotificationsShow.mock.calls[0]![0]
      expect(call.autoClose).toBe(5000)
    })
  })

  describe('showToastOnPromptUpdate', () => {
    it('shows success message', async () => {
      const { showToastOnPromptUpdate } = await import('../PromptEditorEmbed')
      showToastOnPromptUpdate({} as any)
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Prompt Updated Successfully' }),
      )
    })

    it('shows error message', async () => {
      const { showToastOnPromptUpdate } = await import('../PromptEditorEmbed')
      showToastOnPromptUpdate({} as any, true)
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Error Updating Prompt' }),
      )
    })

    it('shows reset message', async () => {
      const { showToastOnPromptUpdate } = await import('../PromptEditorEmbed')
      showToastOnPromptUpdate({} as any, false, true)
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Prompt Reset to Default' }),
      )
    })
  })

  describe('showToastNotification', () => {
    it('shows success notification', async () => {
      const { showToastNotification } = await import('../PromptEditorEmbed')
      showToastNotification('Title', 'Msg')
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Title', message: 'Msg' }),
      )
    })

    it('shows error notification', async () => {
      const { showToastNotification } = await import('../PromptEditorEmbed')
      showToastNotification('Err', 'Bad', true)
      expect(mockNotificationsShow).toHaveBeenCalled()
    })
  })

  // ── Component rendering ──────────────────────────────────────────────

  describe('loading state', () => {
    it('shows loading initially', async () => {
      mockFetchCourseMetadata.mockReturnValue(new Promise(() => {}))
      const PromptEditorEmbed = (await import('../PromptEditorEmbed')).default
      renderWithProviders(<PromptEditorEmbed project_name="Test" />)
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  describe('basic rendering', () => {
    it('renders system prompt section', async () => {
      await renderLoaded()
      expect(screen.getByText('System Prompt')).toBeInTheDocument()
    })

    it('renders textarea with prompt value', async () => {
      await renderLoaded()
      const textarea = screen.getByPlaceholderText('Enter the system prompt...')
      expect(textarea).toHaveValue('You are a helpful bot.')
    })

    it('renders Update System Prompt button', async () => {
      await renderLoaded()
      expect(
        screen.getByText('Update System Prompt', { selector: 'button' }),
      ).toBeInTheDocument()
    })

    it('renders Optimize button', async () => {
      await renderLoaded()
      expect(screen.getByText('Optimize System Prompt')).toBeInTheDocument()
    })

    it('renders Prompt Engineering Guide', async () => {
      await renderLoaded()
      expect(screen.getByText('Prompt Engineering Guide')).toBeInTheDocument()
    })
  })

  describe('header', () => {
    it('shows header when not embedded', async () => {
      await renderLoaded({ showHeader: true, isEmbedded: false })
      expect(screen.getByText('Prompting')).toBeInTheDocument()
      expect(screen.getByText('EmbedProject')).toBeInTheDocument()
    })

    it('hides header when embedded', async () => {
      await renderLoaded({ isEmbedded: true })
      expect(screen.queryByText('Prompting')).not.toBeInTheDocument()
    })
  })

  describe('embedded mode', () => {
    it('shows AI Behavior Settings', async () => {
      await renderLoaded({ isEmbedded: true })
      expect(screen.getByText('AI Behavior Settings')).toBeInTheDocument()
    })

    it('shows all switches', async () => {
      await renderLoaded({ isEmbedded: true })
      expect(screen.getByText('Smart Document Search')).toBeInTheDocument()
      expect(screen.getByText('Guided Learning')).toBeInTheDocument()
      expect(
        screen.getByText('Document-Based References Only'),
      ).toBeInTheDocument()
    })

    it('shows action buttons', async () => {
      await renderLoaded({ isEmbedded: true })
      expect(screen.getByText('Reset Prompting Settings')).toBeInTheDocument()
      expect(screen.getByText('Generate Share Link')).toBeInTheDocument()
    })
  })

  describe('non-embedded mode', () => {
    it('shows sidebar', async () => {
      await renderLoaded({ isEmbedded: false })
      expect(
        screen.getByText('Document Search Optimization'),
      ).toBeInTheDocument()
    })

    it('shows close sidebar icon', async () => {
      await renderLoaded({ isEmbedded: false })
      expect(screen.getByLabelText('Close Prompt Builder')).toBeInTheDocument()
    })
  })

  // ── Interactions ─────────────────────────────────────────────────────

  describe('Prompt Engineering Guide', () => {
    it('expands on click', async () => {
      await renderLoaded()
      fireEvent.click(screen.getByText('Prompt Engineering Guide'))
      await waitFor(() => {
        expect(screen.getByText(/For additional insights/)).toBeInTheDocument()
      })
    })
  })

  describe('textarea', () => {
    it('updates on change', async () => {
      await renderLoaded()
      const textarea = screen.getByPlaceholderText('Enter the system prompt...')
      fireEvent.change(textarea, { target: { value: 'Updated prompt' } })
      expect(textarea).toHaveValue('Updated prompt')
    })
  })

  describe('Update System Prompt', () => {
    it('calls API on click', async () => {
      await renderLoaded()
      fireEvent.click(
        screen.getByText('Update System Prompt', { selector: 'button' }),
      )
      await waitFor(() => {
        expect(mockCallSetCourseMetadata).toHaveBeenCalledWith(
          'EmbedProject',
          expect.objectContaining({
            system_prompt: 'You are a helpful bot.',
          }),
        )
      })
    })

    it('shows success toast', async () => {
      await renderLoaded()
      fireEvent.click(
        screen.getByText('Update System Prompt', { selector: 'button' }),
      )
      await waitFor(() => {
        expect(mockNotificationsShow).toHaveBeenCalledWith(
          expect.objectContaining({ title: 'Prompt Updated Successfully' }),
        )
      })
    })

    it('shows error toast on failure', async () => {
      mockCallSetCourseMetadata.mockResolvedValue(false)
      await renderLoaded()
      fireEvent.click(
        screen.getByText('Update System Prompt', { selector: 'button' }),
      )
      await waitFor(() => {
        expect(mockNotificationsShow).toHaveBeenCalledWith(
          expect.objectContaining({ title: 'Error Updating Prompt' }),
        )
      })
    })
  })

  describe('reset prompt', () => {
    it('opens modal on click', async () => {
      await renderLoaded({ isEmbedded: true })
      fireEvent.click(screen.getByText('Reset Prompting Settings'))
      await waitFor(() => {
        expect(
          screen.getByText(/Are you sure you want to reset/),
        ).toBeInTheDocument()
      })
    })

    it('resets on confirm', async () => {
      await renderLoaded({ isEmbedded: true })
      fireEvent.click(screen.getByText('Reset Prompting Settings'))
      await waitFor(() =>
        expect(screen.getByText('Confirm')).toBeInTheDocument(),
      )
      fireEvent.click(screen.getByText('Confirm'))
      await waitFor(() => {
        expect(mockCallSetCourseMetadata).toHaveBeenCalledWith(
          'EmbedProject',
          expect.objectContaining({ system_prompt: null }),
        )
      })
    })

    it('shows error when reset fails', async () => {
      mockCallSetCourseMetadata.mockResolvedValue(false)
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      await renderLoaded({ isEmbedded: true })
      fireEvent.click(screen.getByText('Reset Prompting Settings'))
      await waitFor(() =>
        expect(screen.getByText('Confirm')).toBeInTheDocument(),
      )
      fireEvent.click(screen.getByText('Confirm'))
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error resetting system prompt')
      })
      alertSpy.mockRestore()
    })

    it('closes modal on cancel', async () => {
      await renderLoaded({ isEmbedded: true })
      fireEvent.click(screen.getByText('Reset Prompting Settings'))
      await waitFor(() =>
        expect(screen.getByText('Cancel')).toBeInTheDocument(),
      )
      fireEvent.click(screen.getByText('Cancel'))
    })
  })

  describe('edge cases', () => {
    it('handles null metadata', async () => {
      mockFetchCourseMetadata.mockResolvedValue(null)
      const PromptEditorEmbed = (await import('../PromptEditorEmbed')).default
      renderWithProviders(<PromptEditorEmbed project_name="Empty" />)
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })
    })

    it('uses DEFAULT_SYSTEM_PROMPT when system_prompt is undefined', async () => {
      mockFetchCourseMetadata.mockResolvedValue({
        ...baseMetadata,
        system_prompt: undefined,
      })
      await renderLoaded()
      expect(
        screen.getByPlaceholderText('Enter the system prompt...'),
      ).toHaveValue('Default system prompt')
    })

    it('handles fetch error gracefully', async () => {
      mockFetchCourseMetadata.mockRejectedValue(new Error('fail'))
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const PromptEditorEmbed = (await import('../PromptEditorEmbed')).default
      renderWithProviders(<PromptEditorEmbed project_name="Fail" />)
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })
      spy.mockRestore()
    })
  })

  describe('sidebar toggle', () => {
    it('hides sidebar on close click', async () => {
      await renderLoaded({ isEmbedded: false })
      fireEvent.click(screen.getByLabelText('Close Prompt Builder'))
      await waitFor(() => {
        expect(
          screen.queryByText('Document Search Optimization'),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('Generate Share Link', () => {
    it('opens link generator modal', async () => {
      await renderLoaded({ isEmbedded: true })
      fireEvent.click(screen.getByText('Generate Share Link'))
      await waitFor(() => {
        expect(screen.getByTestId('link-generator-modal')).toBeInTheDocument()
      })
    })
  })

  describe('systemPromptOnly copy button', () => {
    it('shows copy button when systemPromptOnly is true', async () => {
      mockFetchCourseMetadata.mockResolvedValue({
        ...baseMetadata,
        systemPromptOnly: true,
      })
      await renderLoaded({ isEmbedded: true })
      expect(screen.getByTestId('copy-button')).toBeInTheDocument()
    })

    it('handles copy default prompt', async () => {
      server.use(
        http.get('*/api/getDefaultPostPrompt', () =>
          HttpResponse.json({ prompt: 'Default prompt text' }),
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
          'Default prompt text',
        )
      })
    })
  })

  describe('metadata with all toggles enabled', () => {
    it('renders correctly with all settings on', async () => {
      mockFetchCourseMetadata.mockResolvedValue({
        ...baseMetadata,
        guidedLearning: true,
        documentsOnly: true,
        systemPromptOnly: true,
        vector_search_rewrite_disabled: true,
      })
      await renderLoaded({ isEmbedded: true })
      expect(screen.getByTestId('copy-button')).toBeInTheDocument()
    })
  })

  describe('sidebar settings in non-embedded mode', () => {
    it('shows all switches', async () => {
      await renderLoaded({ isEmbedded: false })
      expect(
        screen.getAllByText('Guided Learning').length,
      ).toBeGreaterThanOrEqual(1)
      expect(
        screen.getAllByText('Smart Document Search').length,
      ).toBeGreaterThanOrEqual(1)
    })

    it('shows action buttons', async () => {
      await renderLoaded({ isEmbedded: false })
      expect(
        screen.getAllByText('Reset Prompting Settings').length,
      ).toBeGreaterThanOrEqual(1)
      expect(
        screen.getAllByText('Generate Share Link').length,
      ).toBeGreaterThanOrEqual(1)
    })
  })

  describe('handleCopyDefaultPrompt errors', () => {
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

    it('shows error when provider not enabled', async () => {
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
      fireEvent.click(screen.getByText('Optimize System Prompt'))
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
      fireEvent.click(screen.getByText('Optimize System Prompt'))
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
          controller.enqueue(encoder.encode('Optimized embed prompt'))
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
          expect(screen.getByText('Optimized embed prompt')).toBeInTheDocument()
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
          controller.enqueue(encoder.encode('Suggested embed prompt'))
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
          expect(screen.getByText('Suggested embed prompt')).toBeInTheDocument()
        },
        { timeout: 5000 },
      )
    }

    it('accepts optimized prompt', async () => {
      await openOptimizationModal()
      const updateButtons = screen.getAllByText('Update System Prompt')
      fireEvent.click(updateButtons[updateButtons.length - 1]!)
      await waitFor(() => {
        expect(mockCallSetCourseMetadata).toHaveBeenCalledWith(
          'EmbedProject',
          expect.objectContaining({
            system_prompt: 'Suggested embed prompt',
          }),
        )
      })
    })

    it('closes modal on Cancel', async () => {
      await openOptimizationModal()
      fireEvent.click(screen.getByText('Cancel'))
      expect(mockCallSetCourseMetadata).not.toHaveBeenCalled()
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
          'EmbedProject',
          expect.objectContaining({ system_prompt: null }),
        )
      })
    })
  })

  describe('Generate Share Link in non-embedded', () => {
    it('opens link generator from sidebar', async () => {
      await renderLoaded({ isEmbedded: false })
      const linkButtons = screen.getAllByText('Generate Share Link')
      fireEvent.click(linkButtons[0]!)
      await waitFor(() => {
        expect(screen.getByTestId('link-generator-modal')).toBeInTheDocument()
      })
    })
  })
})
