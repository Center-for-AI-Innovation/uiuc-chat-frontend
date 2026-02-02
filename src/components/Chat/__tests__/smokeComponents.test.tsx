import React from 'react'
import { describe, expect, it } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '~/test-utils/renderWithProviders'
import { ChatLoader } from '../ChatLoader'
import { ErrorMessageDiv } from '../ErrorMessageDiv'
import { ImagePreview } from '../ImagePreview'

describe('Chat components (smoke)', () => {
  it('ChatLoader renders a pulsing cursor', () => {
    renderWithProviders(<ChatLoader />)
    expect(screen.getByText('▍')).toBeInTheDocument()
  })

  it('ErrorMessageDiv renders title, message lines, and code', () => {
    renderWithProviders(
      <ErrorMessageDiv
        error={{
          title: 'Boom',
          messageLines: ['line 1', 'line 2'],
          code: 'E_TEST',
        }}
      />,
    )
    expect(screen.getByText('Boom')).toBeInTheDocument()
    expect(screen.getByText('line 1')).toBeInTheDocument()
    expect(screen.getByText('line 2')).toBeInTheDocument()
    expect(screen.getByText(/Code: E_TEST/)).toBeInTheDocument()
  })

  it('ImagePreview opens a modal on click', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <ImagePreview src="https://example.com/img.png" alt="My Image" className="c" />,
    )

    const img = screen.getByAltText('My Image')
    fireEvent.load(img)
    await user.click(img)

    expect(screen.getByText('My Image')).toBeInTheDocument()
    expect(screen.getByLabelText('Close image preview')).toBeInTheDocument()
  })
})

