import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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

import OpenAICompatibleProviderInput from '../OpenAICompatibleProviderInput'

function FormHarness({
  enabled,
  baseUrl,
  provider,
  onSubmit,
}: {
  enabled: boolean
  baseUrl?: string
  provider: any
  onSubmit: () => Promise<void> | void
}) {
  const form = useForm({
    defaultValues: {
      providers: {
        OpenAICompatible: {
          enabled,
          apiKey: 'sk-test',
          baseUrl: baseUrl ?? 'https://api.example.com/v1',
        },
      },
    },
    onSubmit: async () => {
      await onSubmit()
    },
  })

  return (
    <OpenAICompatibleProviderInput
      provider={provider}
      form={form as any}
      isLoading={false}
    />
  )
}

describe('OpenAICompatibleProviderInput', () => {
  it('shows a skeleton while loading', () => {
    const { container } = render(
      <OpenAICompatibleProviderInput
        provider={{ enabled: false } as any}
        form={
          {
            Field: () => null,
            state: { values: {} },
            handleSubmit: vi.fn(),
          } as any
        }
        isLoading
      />,
    )
    expect(container).not.toBeEmptyDOMElement()
  })

  it('validates base URL and shows model toggles when enabled', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(
      <FormHarness
        enabled
        baseUrl="https://api.example.com"
        provider={{ enabled: true } as any}
        onSubmit={onSubmit}
      />,
    )

    expect(screen.getByText(/OpenAI Compatible/i)).toBeInTheDocument()
    expect(screen.getByTestId('model-toggles')).toBeInTheDocument()

    expect(screen.getByText('Base URL must include /v1')).toBeInTheDocument()

    const baseUrlInput = screen.getByLabelText(/Base URL/i)
    await user.clear(baseUrlInput)
    await user.type(baseUrlInput, 'https://api.example.com/v1')
    expect(
      screen.queryByText('Base URL must include /v1'),
    ).not.toBeInTheDocument()
  })
})
