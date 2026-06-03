import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '~/test-utils/renderWithProviders'

// ---------------------------------------------------------------------------
// Hoisted mocks – must be declared before any vi.mock() that references them
// ---------------------------------------------------------------------------
const mocks = vi.hoisted(() => ({
  query: {
    data: null as any,
    isLoading: false,
    isError: false,
    error: null as any,
  },
  mutate: vi.fn(),
  isPending: false,
}))

vi.mock('@/hooks/queries/useFetchLLMProviders', () => ({
  useFetchLLMProviders: () => mocks.query,
}))

vi.mock('@/hooks/queries/useUpdateProjectLLMProviders', () => ({
  useUpdateProjectLLMProviders: () => ({
    mutate: mocks.mutate,
    isPending: mocks.isPending,
  }),
}))

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn(),
    update: vi.fn(),
    hide: vi.fn(),
    clean: vi.fn(),
  },
}))

vi.mock('@mantine/core', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    Select: (props: any) => (
      <label>
        <span>{props.placeholder ?? 'Select'}</span>
        <select
          aria-label={props.placeholder ?? 'Select'}
          value={props.value ?? ''}
          onChange={(e) => props.onChange?.(e.target.value)}
        >
          {(props.data ?? []).map((opt: { value: string; label: string }) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
    ),
  }
})

vi.mock('~/components/Layout/SettingsLayout', () => ({
  __esModule: true,
  default: ({ children }: any) => (
    <div data-testid="settings-layout">{children}</div>
  ),
  getInitialCollapsedState: () => false,
}))

vi.mock('../GlobalFooter', () => ({
  default: () => <div data-testid="footer" />,
}))

// ---------------------------------------------------------------------------
// Imports after all vi.mock() calls
// ---------------------------------------------------------------------------
import LLMsApiKeyInputForm, {
  APIKeyInput,
  ModelItem,
  findDefaultModel,
  showConfirmationToast,
} from '../api-inputs/LLMsApiKeyInputForm'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeProviders(overrides: Record<string, unknown> = {}) {
  return {
    OpenAI: { provider: 'OpenAI', enabled: false, apiKey: '', models: [] },
    Azure: { provider: 'Azure', enabled: false, apiKey: '', models: [] },
    Anthropic: {
      provider: 'Anthropic',
      enabled: false,
      apiKey: '',
      models: [],
    },
    Bedrock: {
      provider: 'Amazon Bedrock',
      enabled: false,
      apiKey: '',
      models: [],
    },
    Gemini: { provider: 'Gemini', enabled: false, apiKey: '', models: [] },
    NCSAHosted: {
      provider: 'NCSA Hosted',
      enabled: false,
      apiKey: '',
      models: [],
    },
    NCSAHostedVLM: {
      provider: 'NCSA Hosted VLM',
      enabled: false,
      apiKey: '',
      models: [],
    },
    OpenAICompatible: {
      provider: 'OpenAI Compatible',
      enabled: false,
      apiKey: '',
      models: [],
    },
    SambaNova: {
      provider: 'SambaNova',
      enabled: false,
      apiKey: '',
      models: [],
    },
    Ollama: { provider: 'Ollama', enabled: false, apiKey: '', models: [] },
    WebLLM: { provider: 'WebLLM', enabled: false, apiKey: '', models: [] },
    ...overrides,
  }
}

function makeField(overrides: Record<string, any> = {}) {
  return {
    state: {
      value: '',
      meta: { isTouched: false, errors: [], isValidating: false },
    },
    handleChange: vi.fn(),
    form: { handleSubmit: vi.fn() },
    ...overrides,
  }
}

function setUpGlobals() {
  globalThis.__TEST_ROUTER__ = { asPath: '/CS101/llms', isReady: true }
  globalThis.__TEST_AUTH__ = {
    isLoading: false,
    isAuthenticated: true,
    user: { profile: { email: 'owner@example.com' } },
  }
}

beforeEach(() => {
  mocks.query.data = null
  mocks.query.isLoading = false
  mocks.query.isError = false
  mocks.query.error = null
  mocks.mutate.mockClear()
  mocks.isPending = false
})

// ===========================================================================
// findDefaultModel
// ===========================================================================
describe('findDefaultModel', () => {
  it('returns the first model with default=true across providers', () => {
    const providers = makeProviders({
      OpenAI: {
        provider: 'OpenAI',
        enabled: true,
        apiKey: 'sk-test',
        models: [
          { id: 'gpt-4o', name: 'GPT-4o', enabled: true, default: true },
        ],
      },
    }) as any

    const result = findDefaultModel(providers)
    expect(result).toMatchObject({ id: 'gpt-4o', provider: 'OpenAI' })
  })

  it('returns undefined when no provider has a default model', () => {
    const providers = makeProviders() as any
    expect(findDefaultModel(providers)).toBeUndefined()
  })

  it('returns undefined when models exist but none is default', () => {
    const providers = makeProviders({
      Anthropic: {
        provider: 'Anthropic',
        enabled: true,
        apiKey: 'key',
        models: [
          { id: 'claude-3', name: 'Claude 3', enabled: true, default: false },
        ],
      },
    }) as any

    expect(findDefaultModel(providers)).toBeUndefined()
  })

  it('skips providers with no models array', () => {
    const providers = makeProviders({
      OpenAI: {
        provider: 'OpenAI',
        enabled: true,
        apiKey: 'sk',
        models: undefined,
      },
      Anthropic: {
        provider: 'Anthropic',
        enabled: true,
        apiKey: 'key',
        models: [
          { id: 'claude-3', name: 'Claude 3', enabled: true, default: true },
        ],
      },
    }) as any

    const result = findDefaultModel(providers)
    expect(result).toMatchObject({ id: 'claude-3', provider: 'Anthropic' })
  })
})

// ===========================================================================
// showConfirmationToast
// ===========================================================================
describe('showConfirmationToast', () => {
  it('calls notifications.show with success styling by default', async () => {
    const { notifications } = await import('@mantine/notifications')
    ;(notifications.show as ReturnType<typeof vi.fn>).mockClear()

    showConfirmationToast({ title: 'Success', message: 'Saved!' })

    expect(notifications.show).toHaveBeenCalledTimes(1)
    const call = (notifications.show as ReturnType<typeof vi.fn>).mock
      .calls[0]![0]
    expect(call.title).toBe('Success')
    expect(call.message).toBe('Saved!')
    expect(call.color).toBe('green')
  })

  it('calls notifications.show with error styling when isError=true', async () => {
    const { notifications } = await import('@mantine/notifications')
    ;(notifications.show as ReturnType<typeof vi.fn>).mockClear()

    showConfirmationToast({
      title: 'Error',
      message: 'Something broke',
      isError: true,
    })

    const call = (notifications.show as ReturnType<typeof vi.fn>).mock
      .calls[0]![0]
    expect(call.color).toBe('red')
  })

  it('respects custom autoClose value', async () => {
    const { notifications } = await import('@mantine/notifications')
    ;(notifications.show as ReturnType<typeof vi.fn>).mockClear()

    showConfirmationToast({
      title: 'Quick',
      message: 'Gone fast',
      autoClose: 1000,
    })

    const call = (notifications.show as ReturnType<typeof vi.fn>).mock
      .calls[0]![0]
    expect(call.autoClose).toBe(1000)
  })
})

// ===========================================================================
// ModelItem
// ===========================================================================
describe('ModelItem', () => {
  it('renders model label and provider logo', () => {
    const { container } = renderWithProviders(
      <ModelItem
        label="GPT-4o"
        modelId="gpt-4o"
        selectedModelId="gpt-4o"
        modelType="OpenAI"
        vram_required_MB={0}
        loadingModelId={null}
      />,
    )

    expect(screen.getByText('GPT-4o')).toBeInTheDocument()
    const img = container.querySelector('img')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('alt', 'OpenAI logo')
  })

  it('renders without crashing when loadingModelId is set', () => {
    renderWithProviders(
      <ModelItem
        label="Claude 3"
        modelId="claude-3"
        selectedModelId={undefined}
        modelType="Anthropic"
        vram_required_MB={0}
        loadingModelId="claude-3"
      />,
    )

    expect(screen.getByText('Claude 3')).toBeInTheDocument()
  })
})

// ===========================================================================
// APIKeyInput – additional edge cases
// ===========================================================================
describe('APIKeyInput – additional', () => {
  it('submits form on Enter key press', () => {
    const field = makeField({
      state: {
        value: 'sk-key',
        meta: { isTouched: false, errors: [], isValidating: false },
      },
    })
    renderWithProviders(
      <APIKeyInput field={field as any} placeholder="OpenAI API Key" />,
    )

    const input = screen.getByLabelText('OpenAI API Key')
    fireEvent.keyPress(input, { key: 'Enter', charCode: 13 })

    expect(field.form.handleSubmit).toHaveBeenCalled()
  })

  it('does not submit form on non-Enter key press', () => {
    const field = makeField({
      state: {
        value: 'sk-key',
        meta: { isTouched: false, errors: [], isValidating: false },
      },
    })
    renderWithProviders(
      <APIKeyInput field={field as any} placeholder="OpenAI API Key" />,
    )

    const input = screen.getByLabelText('OpenAI API Key')
    fireEvent.keyPress(input, { key: 'a', charCode: 97 })

    expect(field.form.handleSubmit).not.toHaveBeenCalled()
  })

  it('clears the field and submits when the clear button is clicked', () => {
    const field = makeField({
      state: {
        value: 'existing-key',
        meta: { isTouched: false, errors: [], isValidating: false },
      },
    })
    renderWithProviders(
      <APIKeyInput field={field as any} placeholder="API Key" />,
    )

    const clearBtn = screen.getByLabelText('Clear')
    clearBtn.click()
    expect(field.handleChange).toHaveBeenCalledWith('')
    expect(field.form.handleSubmit).toHaveBeenCalled()
  })

  it('submits when Save button is clicked', () => {
    const field = makeField()
    renderWithProviders(
      <APIKeyInput field={field as any} placeholder="API Key" />,
    )

    const saveBtn = screen.getByText('Save')
    saveBtn.click()
    expect(field.form.handleSubmit).toHaveBeenCalled()
  })

  it('resets error state when value changes', async () => {
    const field = makeField({
      state: {
        value: 'initial',
        meta: { isTouched: false, errors: [], isValidating: false },
      },
    })

    const { rerender } = renderWithProviders(
      <APIKeyInput field={field as any} placeholder="API Key" />,
    )

    // Update the value to trigger the useEffect
    const updatedField = {
      ...field,
      state: {
        ...field.state,
        value: 'new-value',
      },
    }

    rerender(<APIKeyInput field={updatedField as any} placeholder="API Key" />)
    // Should not display any error
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

// ===========================================================================
// LLMsApiKeyInputForm – isEmbedded mode
// ===========================================================================
describe('LLMsApiKeyInputForm – isEmbedded', () => {
  it('renders form content without SettingsLayout wrapper', () => {
    setUpGlobals()
    mocks.query.data = makeProviders({
      OpenAI: {
        provider: 'OpenAI',
        enabled: true,
        apiKey: 'sk-test',
        models: [
          {
            id: 'gpt-4o-mini',
            name: 'GPT-4o mini',
            enabled: true,
            default: true,
          },
        ],
      },
    })

    renderWithProviders(
      (<LLMsApiKeyInputForm projectName="CS101" isEmbedded={true} />) as any,
    )

    // Should NOT have the SettingsLayout wrapper
    expect(screen.queryByTestId('settings-layout')).not.toBeInTheDocument()
    // Should still render section titles
    expect(screen.getByText('Closed source LLMs')).toBeInTheDocument()
    expect(screen.getByText('Open source LLMs')).toBeInTheDocument()
    expect(screen.getByText('Default Model')).toBeInTheDocument()
  })

  it('renders the default model dropdown in embedded mode', () => {
    setUpGlobals()
    mocks.query.data = makeProviders({
      Anthropic: {
        provider: 'Anthropic',
        enabled: true,
        apiKey: 'key',
        models: [
          {
            id: 'claude-3',
            name: 'Claude 3',
            enabled: true,
            default: true,
          },
        ],
      },
    })

    renderWithProviders(
      (<LLMsApiKeyInputForm projectName="CS101" isEmbedded={true} />) as any,
    )

    expect(screen.getByLabelText('Select a model')).toBeInTheDocument()
  })
})

// ===========================================================================
// LLMsApiKeyInputForm – full page mode (non-embedded)
// ===========================================================================
describe('LLMsApiKeyInputForm – full page', () => {
  it('renders within SettingsLayout when not embedded', () => {
    setUpGlobals()
    mocks.query.data = makeProviders({
      OpenAI: {
        provider: 'OpenAI',
        enabled: true,
        apiKey: 'sk-test',
        models: [
          {
            id: 'gpt-4o-mini',
            name: 'GPT-4o mini',
            enabled: true,
            default: true,
          },
        ],
      },
    })

    renderWithProviders((<LLMsApiKeyInputForm projectName="CS101" />) as any)

    expect(screen.getByTestId('settings-layout')).toBeInTheDocument()
    expect(
      screen.getByText(/Configure LLM Providers for your Chatbot/i),
    ).toBeInTheDocument()
  })

  it('renders both Default Model sections in full page mode', () => {
    setUpGlobals()
    mocks.query.data = makeProviders({
      Gemini: {
        provider: 'Gemini',
        enabled: true,
        apiKey: 'gem-key',
        models: [
          {
            id: 'gemini-pro',
            name: 'Gemini Pro',
            enabled: true,
            default: true,
          },
        ],
      },
    })

    renderWithProviders((<LLMsApiKeyInputForm projectName="CS101" />) as any)

    // In full page mode, "Default Model" text appears in the sidebar
    const defaultModelTexts = screen.getAllByText('Default Model')
    expect(defaultModelTexts.length).toBeGreaterThanOrEqual(1)
  })

  it('renders GlobalFooter in full page mode', () => {
    setUpGlobals()
    mocks.query.data = makeProviders()

    renderWithProviders((<LLMsApiKeyInputForm projectName="CS101" />) as any)

    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })
})

// ===========================================================================
// Default model selection flows
// ===========================================================================
describe('LLMsApiKeyInputForm – default model selection', () => {
  it('changes the default model and calls mutate', async () => {
    const user = userEvent.setup()
    setUpGlobals()

    mocks.query.data = makeProviders({
      OpenAI: {
        provider: 'OpenAI',
        enabled: true,
        apiKey: 'sk-test',
        models: [
          {
            id: 'gpt-4o-mini',
            name: 'GPT-4o mini',
            enabled: true,
            default: true,
          },
          { id: 'gpt-4o', name: 'GPT-4o', enabled: true, default: false },
        ],
      },
      Anthropic: {
        provider: 'Anthropic',
        enabled: true,
        apiKey: 'key',
        models: [
          {
            id: 'claude-3',
            name: 'Claude 3',
            enabled: true,
            default: false,
          },
        ],
      },
    })

    renderWithProviders(
      (<LLMsApiKeyInputForm projectName="CS101" isEmbedded={true} />) as any,
    )

    // Select a different model
    await user.selectOptions(
      screen.getByLabelText('Select a model'),
      'claude-3',
    )
    await waitFor(() => expect(mocks.mutate).toHaveBeenCalled())
  })

  it('filters out disabled providers from the dropdown', () => {
    setUpGlobals()
    mocks.query.data = makeProviders({
      OpenAI: {
        provider: 'OpenAI',
        enabled: true,
        apiKey: 'sk-test',
        models: [
          {
            id: 'gpt-4o',
            name: 'GPT-4o',
            enabled: true,
            default: true,
          },
        ],
      },
      Anthropic: {
        provider: 'Anthropic',
        enabled: false, // disabled
        apiKey: '',
        models: [
          {
            id: 'claude-3',
            name: 'Claude 3',
            enabled: true,
            default: false,
          },
        ],
      },
    })

    renderWithProviders(
      (<LLMsApiKeyInputForm projectName="CS101" isEmbedded={true} />) as any,
    )

    const select = screen.getByLabelText('Select a model')
    const options = within(select).getAllByRole('option')
    const optionValues = options.map((o) => o.getAttribute('value'))

    expect(optionValues).toContain('gpt-4o')
    expect(optionValues).not.toContain('claude-3')
  })

  it('filters out disabled models within an enabled provider', () => {
    setUpGlobals()
    mocks.query.data = makeProviders({
      OpenAI: {
        provider: 'OpenAI',
        enabled: true,
        apiKey: 'sk-test',
        models: [
          {
            id: 'gpt-4o',
            name: 'GPT-4o',
            enabled: true,
            default: true,
          },
          {
            id: 'gpt-3.5',
            name: 'GPT-3.5',
            enabled: false, // disabled model
            default: false,
          },
        ],
      },
    })

    renderWithProviders(
      (<LLMsApiKeyInputForm projectName="CS101" isEmbedded={true} />) as any,
    )

    const select = screen.getByLabelText('Select a model')
    const options = within(select).getAllByRole('option')
    const optionValues = options.map((o) => o.getAttribute('value'))

    expect(optionValues).toContain('gpt-4o')
    expect(optionValues).not.toContain('gpt-3.5')
  })

  it('does not render dropdown when no providers are loaded', () => {
    setUpGlobals()
    mocks.query.data = null

    renderWithProviders(
      (<LLMsApiKeyInputForm projectName="CS101" isEmbedded={true} />) as any,
    )

    expect(screen.queryByLabelText('Select a model')).not.toBeInTheDocument()
  })
})

// ===========================================================================
// Form submission – onSuccess / onError callbacks
// ===========================================================================
describe('LLMsApiKeyInputForm – form submission callbacks', () => {
  it('shows success toast on mutation success', async () => {
    const user = userEvent.setup()
    const { notifications } = await import('@mantine/notifications')
    ;(notifications.show as ReturnType<typeof vi.fn>).mockClear()

    setUpGlobals()
    mocks.query.data = makeProviders({
      OpenAI: {
        provider: 'OpenAI',
        enabled: true,
        apiKey: 'sk-test',
        models: [
          {
            id: 'gpt-4o-mini',
            name: 'GPT-4o mini',
            enabled: true,
            default: true,
          },
          { id: 'gpt-4o', name: 'GPT-4o', enabled: true, default: false },
        ],
      },
    })

    // Make mutate call onSuccess synchronously
    mocks.mutate.mockImplementation((_args: any, opts: any) => {
      opts?.onSuccess?.({}, {}, {})
    })

    renderWithProviders(
      (<LLMsApiKeyInputForm projectName="CS101" isEmbedded={true} />) as any,
    )

    // Trigger form submit by selecting a different default model
    await user.selectOptions(screen.getByLabelText('Select a model'), 'gpt-4o')

    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Updated LLM providers',
          color: 'green',
        }),
      )
    })
  })

  it('shows error toast on mutation failure', async () => {
    const user = userEvent.setup()
    const { notifications } = await import('@mantine/notifications')
    ;(notifications.show as ReturnType<typeof vi.fn>).mockClear()

    setUpGlobals()
    mocks.query.data = makeProviders({
      OpenAI: {
        provider: 'OpenAI',
        enabled: true,
        apiKey: 'sk-test',
        models: [
          {
            id: 'gpt-4o-mini',
            name: 'GPT-4o mini',
            enabled: true,
            default: true,
          },
          { id: 'gpt-4o', name: 'GPT-4o', enabled: true, default: false },
        ],
      },
    })

    // Make mutate call onError
    mocks.mutate.mockImplementation((_args: any, opts: any) => {
      opts?.onError?.(
        { name: 'NetworkError', message: 'Connection refused' },
        {},
        {},
      )
    })

    renderWithProviders(
      (<LLMsApiKeyInputForm projectName="CS101" isEmbedded={true} />) as any,
    )

    await user.selectOptions(screen.getByLabelText('Select a model'), 'gpt-4o')

    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error updating LLM providers',
          color: 'red',
        }),
      )
    })
  })
})

// ===========================================================================
// LLMsApiKeyInputForm – error state
// ===========================================================================
describe('LLMsApiKeyInputForm – error loading providers', () => {
  it('shows error notification when providers fail to load', async () => {
    const { notifications } = await import('@mantine/notifications')
    ;(notifications.show as ReturnType<typeof vi.fn>).mockClear()

    setUpGlobals()
    mocks.query.data = null
    mocks.query.isError = true

    renderWithProviders(
      (<LLMsApiKeyInputForm projectName="CS101" isEmbedded={true} />) as any,
    )

    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          color: 'red',
        }),
      )
    })
  })
})

// ===========================================================================
// LLMsApiKeyInputForm – loading state
// ===========================================================================
describe('LLMsApiKeyInputForm – loading state', () => {
  it('renders with loading providers without crashing', () => {
    setUpGlobals()
    mocks.query.data = null
    mocks.query.isLoading = true

    renderWithProviders(
      (<LLMsApiKeyInputForm projectName="CS101" isEmbedded={true} />) as any,
    )

    // Component should render form sections even during loading
    expect(screen.getByText('Closed source LLMs')).toBeInTheDocument()
  })
})

// ===========================================================================
// LLMsApiKeyInputForm – multiple enabled providers
// ===========================================================================
describe('LLMsApiKeyInputForm – multiple providers', () => {
  it('shows models from multiple enabled providers in dropdown', () => {
    setUpGlobals()
    mocks.query.data = makeProviders({
      OpenAI: {
        provider: 'OpenAI',
        enabled: true,
        apiKey: 'sk-test',
        models: [
          {
            id: 'gpt-4o',
            name: 'GPT-4o',
            enabled: true,
            default: true,
          },
        ],
      },
      Anthropic: {
        provider: 'Anthropic',
        enabled: true,
        apiKey: 'key',
        models: [
          {
            id: 'claude-3',
            name: 'Claude 3',
            enabled: true,
            default: false,
          },
        ],
      },
      Gemini: {
        provider: 'Gemini',
        enabled: true,
        apiKey: 'gem-key',
        models: [
          {
            id: 'gemini-pro',
            name: 'Gemini Pro',
            enabled: true,
            default: false,
          },
        ],
      },
    })

    renderWithProviders(
      (<LLMsApiKeyInputForm projectName="CS101" isEmbedded={true} />) as any,
    )

    const select = screen.getByLabelText('Select a model')
    const options = within(select).getAllByRole('option')
    const optionValues = options.map((o) => o.getAttribute('value'))

    expect(optionValues).toContain('gpt-4o')
    expect(optionValues).toContain('claude-3')
    expect(optionValues).toContain('gemini-pro')
  })

  it('skips providers with enabled=true but no enabled models', () => {
    setUpGlobals()
    mocks.query.data = makeProviders({
      OpenAI: {
        provider: 'OpenAI',
        enabled: true,
        apiKey: 'sk-test',
        models: [
          {
            id: 'gpt-4o',
            name: 'GPT-4o',
            enabled: true,
            default: true,
          },
        ],
      },
      Anthropic: {
        provider: 'Anthropic',
        enabled: true,
        apiKey: 'key',
        models: [
          // All models disabled
          {
            id: 'claude-3',
            name: 'Claude 3',
            enabled: false,
            default: false,
          },
        ],
      },
    })

    renderWithProviders(
      (<LLMsApiKeyInputForm projectName="CS101" isEmbedded={true} />) as any,
    )

    const select = screen.getByLabelText('Select a model')
    const options = within(select).getAllByRole('option')
    const optionValues = options.map((o) => o.getAttribute('value'))

    expect(optionValues).toContain('gpt-4o')
    expect(optionValues).not.toContain('claude-3')
  })
})

// ===========================================================================
// LLMsApiKeyInputForm – projectName fallback
// ===========================================================================
describe('LLMsApiKeyInputForm – projectName fallback', () => {
  it('falls back to router-based project name when projectName prop is not provided', () => {
    globalThis.__TEST_ROUTER__ = { asPath: '/TestCourse/llms', isReady: true }
    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: true,
      user: { profile: { email: 'owner@example.com' } },
    }
    mocks.query.data = makeProviders()

    renderWithProviders((<LLMsApiKeyInputForm />) as any)

    // The component should render without error using the router-derived name
    expect(screen.getByTestId('settings-layout')).toBeInTheDocument()
  })
})

// ===========================================================================
// LLMsApiKeyInputForm – form onSubmit prevents default
// ===========================================================================
describe('LLMsApiKeyInputForm – embedded form submission', () => {
  it('prevents default form submission', () => {
    setUpGlobals()
    mocks.query.data = makeProviders({
      OpenAI: {
        provider: 'OpenAI',
        enabled: true,
        apiKey: 'sk-test',
        models: [
          {
            id: 'gpt-4o',
            name: 'GPT-4o',
            enabled: true,
            default: true,
          },
        ],
      },
    })

    renderWithProviders(
      (<LLMsApiKeyInputForm projectName="CS101" isEmbedded={true} />) as any,
    )

    const form = document.querySelector('.llm-providers-form form')
    expect(form).toBeInTheDocument()

    // Submit the form directly, should not cause page navigation
    const submitEvent = new Event('submit', {
      bubbles: true,
      cancelable: true,
    })
    const wasPrevented = !form!.dispatchEvent(submitEvent)
    expect(wasPrevented).toBe(true)
  })
})

// ===========================================================================
// LLMsApiKeyInputForm – provider with empty models array
// ===========================================================================
describe('LLMsApiKeyInputForm – edge cases', () => {
  it('handles provider with empty models array gracefully', () => {
    setUpGlobals()
    mocks.query.data = makeProviders({
      OpenAI: {
        provider: 'OpenAI',
        enabled: true,
        apiKey: 'sk-test',
        models: [], // empty models
      },
    })

    renderWithProviders(
      (<LLMsApiKeyInputForm projectName="CS101" isEmbedded={true} />) as any,
    )

    // Should render without errors
    expect(screen.getByText('Closed source LLMs')).toBeInTheDocument()
  })

  it('handles all providers disabled with empty dropdown', () => {
    setUpGlobals()
    mocks.query.data = makeProviders() // all disabled by default

    renderWithProviders(
      (<LLMsApiKeyInputForm projectName="CS101" isEmbedded={true} />) as any,
    )

    // The dropdown renders but has no model options
    const select = screen.getByLabelText('Select a model')
    const options = within(select).queryAllByRole('option')
    // No options should be present when all providers are disabled
    expect(options).toHaveLength(0)
  })
})

// ===========================================================================
// LLMsApiKeyInputForm – full page form submit
// ===========================================================================
describe('LLMsApiKeyInputForm – full page form submit', () => {
  it('submits form via the full page layout', async () => {
    const user = userEvent.setup()
    setUpGlobals()

    mocks.query.data = makeProviders({
      OpenAI: {
        provider: 'OpenAI',
        enabled: true,
        apiKey: 'sk-test',
        models: [
          {
            id: 'gpt-4o-mini',
            name: 'GPT-4o mini',
            enabled: true,
            default: true,
          },
          { id: 'gpt-4o', name: 'GPT-4o', enabled: true, default: false },
        ],
      },
    })
    mocks.mutate.mockClear()

    renderWithProviders((<LLMsApiKeyInputForm projectName="CS101" />) as any)

    // In full page mode there are two model dropdowns (embedded content + sidebar)
    const selects = screen.getAllByLabelText('Select a model')
    expect(selects.length).toBeGreaterThanOrEqual(1)

    // Select a model from the first dropdown to trigger submission
    await user.selectOptions(selects[0]!, 'gpt-4o')
    await waitFor(() => expect(mocks.mutate).toHaveBeenCalled())
  })
})

// ===========================================================================
// showConfirmationToast – onOpen / onClose callbacks
// ===========================================================================
describe('showConfirmationToast – callbacks and styles', () => {
  it('passes onOpen and onClose callbacks to notifications.show', async () => {
    const { notifications } = await import('@mantine/notifications')
    ;(notifications.show as ReturnType<typeof vi.fn>).mockClear()

    showConfirmationToast({ title: 'Test', message: 'msg' })

    const call = (notifications.show as ReturnType<typeof vi.fn>).mock
      .calls[0]![0]

    // onOpen and onClose should be functions
    expect(typeof call.onOpen).toBe('function')
    expect(typeof call.onClose).toBe('function')

    // Calling them should not throw
    expect(() => call.onOpen()).not.toThrow()
    expect(() => call.onClose()).not.toThrow()
  })

  it('uses green color and non-error icon for success toast', async () => {
    const { notifications } = await import('@mantine/notifications')
    ;(notifications.show as ReturnType<typeof vi.fn>).mockClear()

    showConfirmationToast({ title: 'OK', message: 'done' })

    const call = (notifications.show as ReturnType<typeof vi.fn>).mock
      .calls[0]![0]
    expect(call.color).toBe('green')
    expect(call.styles.root.borderColor).not.toBe('#E53935')
  })

  it('uses red color and error icon for error toast', async () => {
    const { notifications } = await import('@mantine/notifications')
    ;(notifications.show as ReturnType<typeof vi.fn>).mockClear()

    showConfirmationToast({
      title: 'Fail',
      message: 'error',
      isError: true,
    })

    const call = (notifications.show as ReturnType<typeof vi.fn>).mock
      .calls[0]![0]
    expect(call.color).toBe('red')
    expect(call.styles.root.borderColor).toBe('#E53935')
    expect(call.styles.icon.color).toBe('#E53935')
  })

  it('uses default autoClose of 5000ms', async () => {
    const { notifications } = await import('@mantine/notifications')
    ;(notifications.show as ReturnType<typeof vi.fn>).mockClear()

    showConfirmationToast({ title: 'Default', message: 'auto' })

    const call = (notifications.show as ReturnType<typeof vi.fn>).mock
      .calls[0]![0]
    expect(call.autoClose).toBe(5000)
  })
})
