import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { APIKeyInput } from '../api-inputs/LLMsApiKeyInputForm'

function makeField(value = '') {
  return {
    state: {
      value,
      meta: { isTouched: true, errors: [], isValidating: false },
    },
    handleChange: vi.fn(),
    form: { handleSubmit: vi.fn() },
  } as any
}

describe('APIKeyInput', () => {
  it('submits on enter, save, and clear', async () => {
    const user = userEvent.setup()
    const field = makeField('sk-old')

    render(<APIKeyInput field={field} placeholder="API Key" />)

    const input = screen.getByLabelText(/API Key/i)
    await user.click(input)
    await user.keyboard('{Enter}')
    expect(field.form.handleSubmit).toHaveBeenCalled()

    await user.type(input, 'x')
    expect(field.handleChange).toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: /Save/i }))
    expect(field.form.handleSubmit).toHaveBeenCalled()

    // Clear button is an unlabeled ActionIcon; click the first button that's not Save.
    const buttons = screen.getAllByRole('button')
    const clearButton = buttons.find((b) => b.textContent?.trim() !== 'Save')!
    await user.click(clearButton)
    expect(field.handleChange).toHaveBeenCalledWith('')
    expect(field.form.handleSubmit).toHaveBeenCalled()
  })
})
