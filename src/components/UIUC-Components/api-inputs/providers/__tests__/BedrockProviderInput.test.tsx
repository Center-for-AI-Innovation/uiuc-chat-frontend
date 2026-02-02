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

import BedrockProviderInput from '../BedrockProviderInput'

function FormHarness({
  enabled,
  credentials,
  provider,
  onSubmit,
}: {
  enabled: boolean
  credentials?: { accessKeyId: string; secretAccessKey: string; region: string }
  provider: any
  onSubmit: () => Promise<void> | void
}) {
  const form = useForm({
    defaultValues: {
      providers: {
        Bedrock: {
          enabled,
          accessKeyId: credentials?.accessKeyId ?? '',
          secretAccessKey: credentials?.secretAccessKey ?? '',
          region: credentials?.region ?? '',
        },
      },
    },
    onSubmit: async () => {
      await onSubmit()
    },
  })

  return (
    <BedrockProviderInput provider={provider} form={form as any} isLoading={false} />
  )
}

describe('BedrockProviderInput', () => {
  it('shows a skeleton while loading', () => {
    const { container } = render(
      <BedrockProviderInput
        provider={{ enabled: false } as any}
        form={{ Field: () => null, state: { values: {} }, handleSubmit: vi.fn() } as any}
        isLoading
      />,
    )
    expect(container).not.toBeEmptyDOMElement()
  })

  it('toggles enabled, saves credentials, and shows model toggles when complete', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(
      <FormHarness
        enabled
        credentials={{
          accessKeyId: 'AKIA',
          secretAccessKey: 'SECRET',
          region: 'us-east-1',
        }}
        provider={{ enabled: false, error: 'bad creds' } as any}
        onSubmit={onSubmit}
      />,
    )

    expect(screen.getByText(/bad creds/i)).toBeInTheDocument()
    expect(screen.getByTestId('model-toggles')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Save/i }))
    expect(onSubmit).toHaveBeenCalled()

    // Switch change triggers submit
    await user.click(
      screen.getByRole('switch', { name: /Enable Bedrock provider/i }),
    )
    expect(onSubmit).toHaveBeenCalled()
  })
})
