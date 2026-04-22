import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '~/test-utils/renderWithProviders'

vi.mock('../Temperature', () => ({
  TemperatureSlider: ({ label, onChangeTemperature }: any) => (
    <div data-testid="temperature-slider">
      <span>{label}</span>
      <button
        data-testid="change-temp"
        onClick={() => onChangeTemperature(0.7)}
      >
        Set temp
      </button>
    </div>
  ),
}))

import { ModelParams } from '../ModelParams'

describe('ModelParams', () => {
  const conversation = { id: 'c1', temperature: 0.5 }
  const defaultProps = {
    selectedConversation: conversation,
    prompts: [],
    handleUpdateConversation: vi.fn(),
    t: (key: string) => key,
  }

  it('renders temperature slider', () => {
    renderWithProviders(<ModelParams {...defaultProps} />)
    expect(screen.getByTestId('temperature-slider')).toBeInTheDocument()
    expect(screen.getByText('Temperature')).toBeInTheDocument()
  })

  it('calls handleUpdateConversation when temperature changes', () => {
    const handleUpdate = vi.fn()
    renderWithProviders(
      <ModelParams {...defaultProps} handleUpdateConversation={handleUpdate} />,
    )

    screen.getByTestId('change-temp').click()

    expect(handleUpdate).toHaveBeenCalledWith(conversation, {
      key: 'temperature',
      value: 0.7,
    })
  })
})
