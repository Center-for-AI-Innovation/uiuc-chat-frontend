import React from 'react'
import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '~/test-utils/renderWithProviders'
import { ChatLoader } from '../ChatLoader'

describe('ChatLoader - accessibility', () => {
  it('cursor is accessible as a status element', () => {
    const { container } = renderWithProviders(<ChatLoader />)
    const cursor = screen.getByText('▍')
    expect(cursor).toBeInTheDocument()
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
  })
})
