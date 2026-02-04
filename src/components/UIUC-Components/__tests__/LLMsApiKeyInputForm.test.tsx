import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '~/test-utils/renderWithProviders'

const mocks = vi.hoisted(() => ({
  query: {
    data: null as any,
    isLoading: false,
    isError: false,
    error: null as any,
  },
  mutate: vi.fn(),
}))

vi.mock('@/hooks/queries/useFetchLLMProviders', () => ({
  useFetchLLMProviders: () => mocks.query,
}))

vi.mock('@/hooks/queries/useUpdateProjectLLMProviders', () => ({
  useUpdateProjectLLMProviders: () => ({
    mutate: mocks.mutate,
    isPending: false,
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

vi.mock('../GlobalFooter', () => ({
  default: () => <div data-testid="footer" />,
}))

import LLMsApiKeyInputForm from '../api-inputs/LLMsApiKeyInputForm'

describe('LLMsApiKeyInputForm', () => {
  const makeProviders = (overrides: Record<string, unknown> = {}) => ({
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
  })

  it('renders the LLM settings layout', async () => {
    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/llms', isReady: true }
    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: true,
      user: { profile: { email: 'owner@example.com' } },
    }
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
    mocks.query.isError = false
    renderWithProviders((<LLMsApiKeyInputForm course_name="CS101" />) as any)

    expect(
      await screen.findByText(/Configure LLM Providers for your Chatbot/i),
    ).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })

  it('submits when changing the default model', async () => {
    const user = userEvent.setup()

    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/llms', isReady: true }
    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: true,
      user: { profile: { email: 'owner@example.com' } },
    }

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
    mocks.query.isError = false
    mocks.mutate.mockClear()

    renderWithProviders((<LLMsApiKeyInputForm course_name="CS101" />) as any)

    await user.selectOptions(screen.getByLabelText('Select a model'), 'gpt-4o')
    await waitFor(() => expect(mocks.mutate).toHaveBeenCalled())
  })

  it('shows an error toast when providers fail to load', async () => {
    const { notifications } = await import('@mantine/notifications')

    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/llms', isReady: true }
    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: true,
      user: { profile: { email: 'owner@example.com' } },
    }

    mocks.query.data = null
    mocks.query.isError = true

    renderWithProviders((<LLMsApiKeyInputForm course_name="CS101" />) as any)
    await waitFor(() => expect((notifications as any).show).toHaveBeenCalled())
  })
})
