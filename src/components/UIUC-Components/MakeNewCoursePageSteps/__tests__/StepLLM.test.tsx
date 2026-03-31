import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'

import { renderWithProviders } from '~/test-utils/renderWithProviders'
import {
  ProviderNames,
  type AllLLMProviders,
} from '~/utils/modelProviders/LLMProvider'
import { NCSAHostedVLMModelID } from '~/utils/modelProviders/types/NCSAHostedVLM'

vi.mock('../HeaderStepNavigation', () => ({
  __esModule: true,
  default: ({ title, description }: any) => (
    <div data-testid="header">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  ),
}))

vi.mock('../../api-inputs/LLMsApiKeyInputForm', () => ({
  __esModule: true,
  default: ({ projectName, isEmbedded }: any) => (
    <div data-testid="api-key-form">
      <span data-testid="form-project">{projectName}</span>
      <span data-testid="form-embedded">{String(isEmbedded)}</span>
    </div>
  ),
}))

// Mock the hooks
const mockMutate = vi.fn()
vi.mock('@/hooks/queries/useFetchLLMProviders', () => ({
  useFetchLLMProviders: vi.fn(() => ({ data: undefined })),
}))

vi.mock('@/hooks/queries/useUpdateProjectLLMProviders', () => ({
  useUpdateProjectLLMProviders: vi.fn(() => ({
    mutate: mockMutate,
  })),
}))

import { useFetchLLMProviders } from '@/hooks/queries/useFetchLLMProviders'

const mockUseFetchLLMProviders = useFetchLLMProviders as ReturnType<
  typeof vi.fn
>

/** Build a minimal AllLLMProviders-like object for testing */
function makeMockProviders(
  overrides?: Partial<Record<ProviderNames, any>>,
): AllLLMProviders {
  const base: any = {}
  for (const name of Object.values(ProviderNames)) {
    const models =
      name === ProviderNames.NCSAHostedVLM
        ? [
            {
              id: NCSAHostedVLMModelID.QWEN2_5VL_72B_INSTRUCT,
              name: 'Qwen 2.5 VL 72B',
              default: false,
            },
          ]
        : [
            {
              id: `${name}-model-1`,
              name: `${name} Model 1`,
              default: false,
            },
          ]

    base[name] = {
      enabled: true,
      models,
      ...(overrides?.[name] || {}),
    }
  }
  return base as AllLLMProviders
}

import StepLLM from '../StepLLM'

describe('StepLLM', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseFetchLLMProviders.mockReturnValue({ data: undefined })
  })

  it('renders the header with title and description', () => {
    renderWithProviders(<StepLLM project_name="test-project" />)
    expect(screen.getByText('Configure AI Models')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Set up API keys for the LLM providers you want to use.',
      ),
    ).toBeInTheDocument()
  })

  it('renders APIKeyInputForm with correct props', () => {
    renderWithProviders(<StepLLM project_name="test-project" />)
    expect(screen.getByTestId('api-key-form')).toBeInTheDocument()
    expect(screen.getByTestId('form-project')).toHaveTextContent('test-project')
    expect(screen.getByTestId('form-embedded')).toHaveTextContent('true')
  })

  it('does not apply defaults when providers are not yet loaded', () => {
    mockUseFetchLLMProviders.mockReturnValue({ data: undefined })
    renderWithProviders(<StepLLM project_name="test-project" />)
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('applies NCSA-only defaults when providers load without a default model', async () => {
    const providers = makeMockProviders()
    mockUseFetchLLMProviders.mockReturnValue({ data: providers })

    renderWithProviders(<StepLLM project_name="test-project" />)

    await waitFor(() => expect(mockMutate).toHaveBeenCalledOnce())

    const mutateCall = mockMutate.mock.calls[0]![0]
    expect(mutateCall.projectName).toBe('test-project')

    const modified = mutateCall.llmProviders as AllLLMProviders

    // NCSAHosted and NCSAHostedVLM should remain enabled
    expect((modified as any)[ProviderNames.NCSAHosted]?.enabled).not.toBe(false)
    expect((modified as any)[ProviderNames.NCSAHostedVLM]?.enabled).not.toBe(
      false,
    )

    // Other providers should be disabled
    for (const name of Object.values(ProviderNames)) {
      if (
        name === ProviderNames.NCSAHosted ||
        name === ProviderNames.NCSAHostedVLM
      ) {
        continue
      }
      expect((modified as any)[name]?.enabled).toBe(false)
    }

    // Qwen 2.5 VL 72B should be set as default
    const vlmProvider = (modified as any)[ProviderNames.NCSAHostedVLM]
    const defaultModel = vlmProvider?.models?.find((m: any) => m.default)
    expect(defaultModel?.id).toBe(NCSAHostedVLMModelID.QWEN2_5VL_72B_INSTRUCT)
  })

  it('does not apply defaults when a default model already exists', () => {
    const providers = makeMockProviders({
      [ProviderNames.NCSAHostedVLM]: {
        enabled: true,
        models: [
          {
            id: NCSAHostedVLMModelID.QWEN2_5VL_72B_INSTRUCT,
            name: 'Qwen 2.5 VL 72B',
            default: true, // already has a default
          },
        ],
      },
    })
    mockUseFetchLLMProviders.mockReturnValue({ data: providers })

    renderWithProviders(<StepLLM project_name="test-project" />)
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('does not apply defaults twice on re-render', async () => {
    const providers = makeMockProviders()
    mockUseFetchLLMProviders.mockReturnValue({ data: providers })

    const { rerender } = renderWithProviders(
      <StepLLM project_name="test-project" />,
    )

    await waitFor(() => expect(mockMutate).toHaveBeenCalledOnce())

    // Re-render with same providers
    rerender(<StepLLM project_name="test-project" />)

    // Should still only be called once
    expect(mockMutate).toHaveBeenCalledOnce()
  })
})
