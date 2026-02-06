import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '~/test-utils/renderWithProviders'

describe('Key', () => {
  it('lets users edit an API key and saves on Enter', async () => {
    const user = userEvent.setup()
    const onApiKeyChange = vi.fn()

    const { Key } = await import('../Key')
    renderWithProviders(<Key apiKey=" old " onApiKeyChange={onApiKeyChange} />)

    await user.click(screen.getByRole('button', { name: /OpenAI API Key/i }))

    const input = screen.getByPlaceholderText(/API Key/i)
    expect(input).toHaveFocus()

    await user.clear(input)
    await user.type(input, '  new-key  {Enter}')

    expect(onApiKeyChange).toHaveBeenCalledWith('new-key')
    expect(
      screen.getByRole('button', { name: /OpenAI API Key/i }),
    ).toBeInTheDocument()
  })

  it('cancels edits and restores the original key', async () => {
    const user = userEvent.setup()
    const onApiKeyChange = vi.fn()

    const { Key } = await import('../Key')
    renderWithProviders(<Key apiKey="orig" onApiKeyChange={onApiKeyChange} />)

    await user.click(screen.getByRole('button', { name: /OpenAI API Key/i }))

    const input = screen.getByPlaceholderText(/API Key/i) as HTMLInputElement
    await user.clear(input)
    await user.type(input, 'changed')

    // Click the cancel icon (second icon in the control cluster).
    const container = input.closest('div') as HTMLElement
    const icons = container.querySelectorAll('svg')
    expect(icons.length).toBeGreaterThanOrEqual(2)
    await user.click(icons[icons.length - 1] as any)

    expect(onApiKeyChange).not.toHaveBeenCalled()

    // Re-open and ensure the input value reset to original.
    await user.click(screen.getByRole('button', { name: /OpenAI API Key/i }))
    expect(
      (screen.getByPlaceholderText(/API Key/i) as HTMLInputElement).value,
    ).toBe('orig')
  })
})
