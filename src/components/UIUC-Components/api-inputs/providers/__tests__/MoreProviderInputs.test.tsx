import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from '@tanstack/react-form'

vi.mock('framer-motion', () => {
  const motion = new Proxy(
    {},
    {
      get: () => (props: any) => React.createElement('div', props),
    },
  )
  return {
    motion,
    AnimatePresence: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
  }
})

vi.mock('../../ModelToggles', () => ({
  ModelToggles: () => <div data-testid="model-toggles" />,
}))

import AnthropicProviderInput from '../AnthropicProviderInput'
import AzureProviderInput from '../AzureProviderInput'
import GeminiProviderInput from '../GeminiProviderInput'
import NCSAHostedProviderInput from '../NCSAHostedProviderInput'
import NCSAHostedVLMProviderInput from '../NCSAHostedVLMProviderInput'
import OllamaProviderInput from '../OllamaProviderInput'
import OpenAIProviderInput from '../OpenAIProviderInput'
import SambaNovaProviderInput from '../SambaNovaProviderInput'
import WebLLMProviderInput from '../WebLLMProviderInput'

function makeFormHarness(defaultValues: any, onSubmit: () => Promise<void> | void) {
  return useForm({
    defaultValues,
    onSubmit: async () => {
      await onSubmit()
    },
  })
}

describe('Provider inputs (coverage)', () => {
  it('renders skeletons while loading', () => {
    const noopForm = {
      Field: () => null,
      state: { values: {} },
      handleSubmit: vi.fn(),
    } as any

    expect(
      render(
        <AnthropicProviderInput
          provider={{ enabled: false } as any}
          form={noopForm}
          isLoading
        />,
      ).container,
    ).not.toBeEmptyDOMElement()
    expect(
      render(
        <AzureProviderInput
          provider={{ enabled: false } as any}
          form={noopForm}
          isLoading
        />,
      ).container,
    ).not.toBeEmptyDOMElement()
    expect(
      render(
        <GeminiProviderInput
          provider={{ enabled: false } as any}
          form={noopForm}
          isLoading
        />,
      ).container,
    ).not.toBeEmptyDOMElement()
    expect(
      render(
        <NCSAHostedProviderInput
          provider={{ enabled: false } as any}
          form={noopForm}
          isLoading
        />,
      ).container,
    ).not.toBeEmptyDOMElement()
    expect(
      render(
        <NCSAHostedVLMProviderInput
          provider={{ enabled: false } as any}
          form={noopForm}
          isLoading
        />,
      ).container,
    ).not.toBeEmptyDOMElement()
    expect(
      render(
        <OllamaProviderInput
          provider={{ enabled: false } as any}
          form={noopForm}
          isLoading
        />,
      ).container,
    ).not.toBeEmptyDOMElement()
    expect(
      render(
        <OpenAIProviderInput
          provider={{ enabled: false } as any}
          form={noopForm}
          isLoading
        />,
      ).container,
    ).not.toBeEmptyDOMElement()
    expect(
      render(
        <SambaNovaProviderInput
          provider={{ enabled: false } as any}
          form={noopForm}
          isLoading
        />,
      ).container,
    ).not.toBeEmptyDOMElement()
    expect(
      render(
        <WebLLMProviderInput
          provider={{ enabled: false } as any}
          form={noopForm}
          isLoading
        />,
      ).container,
    ).not.toBeEmptyDOMElement()
  })

  it('handles enable toggles and shows conditional fields', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    function AnthropicHarness({ enabled }: { enabled: boolean }) {
      const form = makeFormHarness(
        {
          providers: {
            Anthropic: { enabled, apiKey: 'sk-anth' },
          },
        },
        onSubmit,
      )
      return (
        <AnthropicProviderInput
          provider={{ enabled, error: 'bad key' } as any}
          form={form as any}
          isLoading={false}
        />
      )
    }

    function AzureHarness({ enabled }: { enabled: boolean }) {
      const form = makeFormHarness(
        {
          providers: {
            Azure: {
              enabled,
              apiKey: 'sk-azure',
              AzureEndpoint: 'https://example.openai.azure.com/',
            },
          },
        },
        onSubmit,
      )
      return (
        <AzureProviderInput
          provider={{ enabled, error: 'bad endpoint' } as any}
          form={form as any}
          isLoading={false}
        />
      )
    }

    function GeminiHarness({ enabled }: { enabled: boolean }) {
      const form = makeFormHarness(
        {
          providers: {
            Gemini: { enabled, apiKey: 'sk-gem' },
          },
        },
        onSubmit,
      )
      return (
        <GeminiProviderInput
          provider={{ enabled, error: 'bad key' } as any}
          form={form as any}
          isLoading={false}
        />
      )
    }

    render(
      <div>
        <AnthropicHarness enabled />
        <AzureHarness enabled />
        <GeminiHarness enabled />
      </div>,
    )

    expect(screen.getAllByTestId('model-toggles').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/bad key|bad endpoint/i).length).toBeGreaterThan(0)

    // Azure endpoint field is wired (visible while enabled).
    const endpointInput = await screen.findByLabelText(/Azure Endpoint/i)
    await user.clear(endpointInput)
    await user.type(endpointInput, 'https://new.openai.azure.com/')
    expect(endpointInput).toHaveValue('https://new.openai.azure.com/')

    // Controlled switch click triggers form.submit (some providers submit immediately).
    await user.click(
      screen.getByRole('switch', { name: /Enable Anthropic provider/i }),
    )
    await user.click(
      screen.getByRole('switch', { name: /Enable Azure OpenAI provider/i }),
    )
    await user.click(
      screen.getByRole('switch', { name: /Enable Gemini provider/i }),
    )
    expect(onSubmit).toHaveBeenCalled()
  })

  it('supports providers that submit via setTimeout and conditional model toggles', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    function OllamaHarness({
      enabled,
      baseUrl,
      error,
    }: {
      enabled: boolean
      baseUrl?: string
      error?: string
    }) {
      const form = makeFormHarness(
        {
          providers: {
            Ollama: { enabled, baseUrl: baseUrl ?? 'http://localhost:11434' },
          },
        },
        onSubmit,
      )
      return (
        <OllamaProviderInput
          provider={{ enabled, error } as any}
          form={form as any}
          isLoading={false}
        />
      )
    }

    function NCSAHostedHarness({ enabled }: { enabled: boolean }) {
      const form = makeFormHarness(
        { providers: { NCSAHosted: { enabled } } },
        onSubmit,
      )
      return (
        <NCSAHostedProviderInput
          provider={{ enabled } as any}
          form={form as any}
          isLoading={false}
        />
      )
    }

    function NCSAHostedVLMHarness({ enabled }: { enabled: boolean }) {
      const form = makeFormHarness(
        { providers: { NCSAHostedVLM: { enabled } } },
        onSubmit,
      )
      return (
        <NCSAHostedVLMProviderInput
          provider={{ enabled, error: 'bad' } as any}
          form={form as any}
          isLoading={false}
        />
      )
    }

    function WebLLMHarness({ enabled }: { enabled: boolean }) {
      const form = makeFormHarness({ providers: { WebLLM: { enabled } } }, onSubmit)
      return (
        <WebLLMProviderInput
          provider={{ enabled } as any}
          form={form as any}
          isLoading={false}
        />
      )
    }

    function OpenAIHarness({ enabled }: { enabled: boolean }) {
      const form = makeFormHarness(
        { providers: { OpenAI: { enabled, apiKey: 'sk-openai' } } },
        onSubmit,
      )
      return (
        <OpenAIProviderInput
          provider={{ enabled, error: 'bad key' } as any}
          form={form as any}
          isLoading={false}
        />
      )
    }

    function SambaHarness({
      enabled,
      apiKey,
    }: {
      enabled: boolean
      apiKey?: string
    }) {
      const form = makeFormHarness(
        { providers: { SambaNova: { enabled, apiKey: apiKey ?? '' } } },
        onSubmit,
      )
      return (
        <SambaNovaProviderInput
          provider={{ enabled, error: 'bad key' } as any}
          form={form as any}
          isLoading={false}
        />
      )
    }

    render(
      <div>
        <div data-testid="ollama">
          <OllamaHarness enabled baseUrl="http://localhost:11434" error="bad" />
        </div>
        <div data-testid="ncsa-hosted">
          <NCSAHostedHarness enabled={false} />
        </div>
        <div data-testid="ncsa-vlm">
          <NCSAHostedVLMHarness enabled />
        </div>
        <div data-testid="webllm">
          <WebLLMHarness enabled={false} />
        </div>
        <div data-testid="openai">
          <OpenAIHarness enabled={false} />
        </div>
        <div data-testid="samba-with-key">
          <SambaHarness enabled apiKey="sk-samba" />
        </div>
        <div data-testid="samba-empty-key">
          <SambaHarness enabled apiKey="" />
        </div>
      </div>,
    )

    // Error blocks render when enabled (or provider.enabled) and error exists.
    expect(screen.getAllByText(/bad/i).length).toBeGreaterThan(0)

    // SambaNova only shows model toggles when apiKey is present.
    expect(
      within(screen.getByTestId('samba-with-key')).getAllByTestId('model-toggles')
        .length,
    ).toBeGreaterThan(0)
    expect(
      within(screen.getByTestId('samba-empty-key')).queryByTestId('model-toggles'),
    ).toBeNull()

    // setTimeout-submitting providers (toggle should call onSubmit after timers run)
    await user.click(screen.getByRole('switch', { name: /Enable Ollama provider/i }))
    await user.click(
      screen.getByRole('switch', { name: /Enable NCSA Hosted LLMs provider/i }),
    )
    await user.click(
      screen.getByRole('switch', { name: /Enable NCSA Hosted VLMs provider/i }),
    )
    await user.click(screen.getByRole('switch', { name: /Enable WebLLM provider/i }))
    await user.click(screen.getByRole('switch', { name: /Enable OpenAI provider/i }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
  })
})
