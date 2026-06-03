import React from 'react'
import { vi, describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { APIKeyInput } from '../../LLMsApiKeyInputForm'

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

describe('APIKeyInput', () => {
  it('renders label and password input with placeholder', () => {
    const field = makeField()
    render(<APIKeyInput field={field as any} placeholder="API Key" />)

    expect(screen.getByText('API Key')).toBeInTheDocument()
    const input = screen.getByLabelText('API Key')
    expect(input).toHaveAttribute('type', 'password')
  })

  it('calls handleChange on input change', () => {
    const field = makeField()
    render(<APIKeyInput field={field as any} placeholder="API Key" />)

    fireEvent.change(screen.getByLabelText('API Key'), {
      target: { value: 'sk-test' },
    })
    expect(field.handleChange).toHaveBeenCalledWith('sk-test')
  })

  it('clears value when clear button is clicked', () => {
    const field = makeField({
      state: {
        value: 'existing-key',
        meta: { isTouched: false, errors: [], isValidating: false },
      },
    })
    render(<APIKeyInput field={field as any} placeholder="API Key" />)

    fireEvent.click(screen.getByLabelText('Clear'))
    expect(field.handleChange).toHaveBeenCalledWith('')
  })

  it('shows validation errors when field is touched', () => {
    const field = makeField({
      state: {
        value: '',
        meta: {
          isTouched: true,
          errors: ['Required', 'Too short'],
          isValidating: false,
        },
      },
    })
    render(<APIKeyInput field={field as any} placeholder="API Key" />)

    expect(screen.getByText('Required, Too short')).toBeInTheDocument()
  })

  it('shows validating message when field is validating', () => {
    const field = makeField({
      state: {
        value: 'test',
        meta: { isTouched: false, errors: [], isValidating: true },
      },
    })
    render(<APIKeyInput field={field as any} placeholder="API Key" />)

    expect(screen.getByText('Validating...')).toBeInTheDocument()
  })
})
