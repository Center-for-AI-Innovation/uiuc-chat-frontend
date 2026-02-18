import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '~/test-utils/renderWithProviders'
import { fireEvent, screen, waitFor } from '@testing-library/react'

import { LinkGeneratorModal } from '~/components/Modals/LinkGeneratorModal'

describe('LinkGeneratorModal', () => {
  it('generates a link that reflects toggle state and resets on reopen', async () => {
    const onClose = vi.fn()

    const { rerender } = renderWithProviders(
      <LinkGeneratorModal
        opened
        onClose={onClose}
        course_name="CS101"
        currentSettings={{
          guidedLearning: false,
          documentsOnly: true,
          systemPromptOnly: false,
        }}
      />,
    )

    // Starts with base /chat link.
    expect(screen.getByText(/\/CS101\/chat/)).toBeInTheDocument()
    expect(screen.queryByText(/guidedLearning=true/)).toBeNull()

    // Toggle guided learning.
    fireEvent.click(screen.getByText('Guided Learning'))
    await waitFor(() =>
      expect(screen.getByText(/guidedLearning=true/)).toBeInTheDocument(),
    )

    // Close & reopen resets state.
    rerender(
      <LinkGeneratorModal
        opened={false}
        onClose={onClose}
        course_name="CS101"
        currentSettings={{
          guidedLearning: false,
          documentsOnly: true,
          systemPromptOnly: false,
        }}
      />,
    )
    rerender(
      <LinkGeneratorModal
        opened
        onClose={onClose}
        course_name="CS101"
        currentSettings={{
          guidedLearning: false,
          documentsOnly: true,
          systemPromptOnly: false,
        }}
      />,
    )
    await waitFor(() =>
      expect(screen.queryByText(/guidedLearning=true/)).toBeNull(),
    )
  })

  it('copies the generated link via CopyButton', async () => {
    const writeText = vi.fn(() => Promise.resolve())
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })

    renderWithProviders(
      <LinkGeneratorModal
        opened
        onClose={vi.fn()}
        course_name="CS101"
        currentSettings={{
          guidedLearning: false,
          documentsOnly: false,
          systemPromptOnly: false,
        }}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Copy Link/i }))
    await waitFor(() => expect(writeText).toHaveBeenCalled())
    expect(screen.getByText('Copied!')).toBeInTheDocument()
  })
})
