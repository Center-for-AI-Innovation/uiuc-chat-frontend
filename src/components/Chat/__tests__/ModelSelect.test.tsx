import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '~/test-utils/renderWithProviders'
import { ProviderNames } from '~/utils/modelProviders/LLMProvider'

// Keep animations lightweight/stable in jsdom.
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

// The real module can pull in WebGPU/WebAssembly details; stub for unit tests.
vi.mock('~/utils/modelProviders/WebLLM', () => ({
  default: class ChatUI {
    isModelLoading() {
      return false
    }
  },
  webLLMModels: [],
}))

vi.mock('../UserSettings', () => ({
  modelCached: [],
}))

describe('ModelSelect', () => {
  it('renders and toggles the details accordion', async () => {
    const user = userEvent.setup()
    const { ModelSelect, getModelLogo } = await import('../ModelSelect')

    expect(() => getModelLogo(ProviderNames.OpenAI)).not.toThrow()
    expect(() => getModelLogo(ProviderNames.Ollama)).not.toThrow()
    expect(() => getModelLogo(ProviderNames.WebLLM)).not.toThrow()
    expect(() => getModelLogo(ProviderNames.Anthropic)).not.toThrow()
    expect(() => getModelLogo(ProviderNames.NCSAHosted)).not.toThrow()
    expect(() => getModelLogo(ProviderNames.NCSAHostedVLM)).not.toThrow()
    expect(() => getModelLogo(ProviderNames.Azure)).not.toThrow()
    expect(() => getModelLogo(ProviderNames.Bedrock)).not.toThrow()
    expect(() => getModelLogo(ProviderNames.Gemini)).not.toThrow()
    expect(() => getModelLogo(ProviderNames.SambaNova)).not.toThrow()
    expect(() => getModelLogo(ProviderNames.OpenAICompatible)).not.toThrow()
    expect(() => getModelLogo('UnknownProvider' as any)).toThrow()

    const llmProviders: any = {
      [ProviderNames.OpenAI]: {
        provider: ProviderNames.OpenAI,
        enabled: true,
        models: [
          { id: 'gpt-4o-mini', name: 'GPT-4o mini', tokenLimit: 128000, enabled: true },
          { id: 'gpt-4o', name: 'GPT-4o', tokenLimit: 128000, enabled: true },
        ],
      },
    }

    renderWithProviders(<ModelSelect chat_ui={{} as any} />, {
      homeState: {
        llmProviders,
        defaultModelId: 'gpt-4o-mini' as any,
        selectedConversation: {
          id: 'c1',
          name: 'Test',
          messages: [],
          model: { id: 'gpt-4o-mini', name: 'GPT-4o mini', tokenLimit: 128000, enabled: true, provider: ProviderNames.OpenAI },
          prompt: 'p',
          temperature: 0.3,
          folderId: null,
        } as any,
      },
      homeContext: {
        handleUpdateConversation: vi.fn(),
      },
    })

    expect(screen.getByText('Model')).toBeInTheDocument()
    const toggle = screen.getByRole('button', { name: /More details about the AI models/i })
    await user.click(toggle)
    // The accordion contains multiple blocks; checking for a stable substring is sufficient.
    expect(screen.getByText(/More details about the AI models/i)).toBeInTheDocument()
    await user.click(toggle)
    expect(screen.getByText(/More details about the AI models/i)).toBeInTheDocument()
  })

  it('renders ModelItem states for WebLLM downloads', async () => {
    const { ModelItem } = await import('../ModelSelect')

    renderWithProviders(
      <ModelItem
        label="Some model"
        downloadSize="100MB"
        modelId="m1"
        selectedModelId="m1"
        modelType={ProviderNames.WebLLM}
        vram_required_MB={1024}
        chat_ui={{} as any}
        loadingModelId="m1"
        setLoadingModelId={() => {}}
      />,
      {
        homeState: {
          webLLMModelIdLoading: { id: 'm1', isLoading: true },
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    expect(screen.getByText(/loading/i)).toBeInTheDocument()

    const userSettings = await import('../UserSettings')
    ;(userSettings as any).modelCached.push({ id: 'm1' })

    renderWithProviders(
      <ModelItem
        label="Some model"
        downloadSize="100MB"
        modelId="m1"
        selectedModelId="m1"
        modelType={ProviderNames.WebLLM}
        vram_required_MB={1024}
        chat_ui={{} as any}
        loadingModelId={null}
        setLoadingModelId={() => {}}
      />,
      {
        homeState: {
          webLLMModelIdLoading: { id: 'm1', isLoading: false },
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    expect(screen.getByText(/downloaded/i)).toBeInTheDocument()
  })
})
