import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '~/test-utils/renderWithProviders'
import { FeedbackModal } from '../FeedbackModal'

function renderModal(
  overrides: Partial<{
    isOpen: boolean
    onClose: () => void
    onSubmit: (feedback: string, category: string) => Promise<void> | void
  }> = {},
) {
  const props = {
    isOpen: true,
    onClose: overrides.onClose ?? vi.fn(),
    onSubmit: overrides.onSubmit ?? vi.fn(),
  }

  const result = renderWithProviders(
    <FeedbackModal
      isOpen={props.isOpen}
      onClose={props.onClose}
      onSubmit={props.onSubmit}
    />,
  )

  return { ...result, ...props }
}

describe('FeedbackModal', () => {
  // ---------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------

  it('renders nothing when isOpen is false', () => {
    renderWithProviders(
      <FeedbackModal isOpen={false} onClose={vi.fn()} onSubmit={vi.fn()} />,
    )

    expect(screen.queryByText('Feedback')).not.toBeInTheDocument()
  })

  it('renders the modal title, category select, textarea, and buttons when open', () => {
    renderModal()

    expect(screen.getByText('Feedback')).toBeInTheDocument()
    expect(
      screen.getByLabelText('Feedback category select'),
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText('Optional feedback details textarea'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Cancel')).toBeInTheDocument()
    expect(screen.getByLabelText('Submit Feedback')).toBeInTheDocument()
  })

  it('renders the textarea label with "(Optional)" hint', () => {
    renderModal()

    expect(screen.getByText('Feedback Details')).toBeInTheDocument()
    expect(screen.getByText('(Optional)')).toBeInTheDocument()
  })

  it('renders "Feedback Category" label', () => {
    renderModal()

    expect(screen.getByText('Feedback Category')).toBeInTheDocument()
  })

  it('defaults the category select to "Other"', () => {
    renderModal()

    const select = screen.getByLabelText('Feedback category select')
    expect(select).toHaveValue('Other')
  })

  // ---------------------------------------------------------------
  // Cancel / close
  // ---------------------------------------------------------------

  it('calls onClose when the Cancel button is clicked', async () => {
    const user = userEvent.setup()
    const { onClose } = renderModal()

    await user.click(screen.getByLabelText('Cancel'))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  // ---------------------------------------------------------------
  // Successful submission
  // ---------------------------------------------------------------

  it('submits with default category and empty feedback when nothing is changed', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const onClose = vi.fn()

    renderModal({ onSubmit, onClose })

    await user.click(screen.getByLabelText('Submit Feedback'))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('', 'other')
    })
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  it('submits typed feedback text with the default category', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const onClose = vi.fn()

    renderModal({ onSubmit, onClose })

    const textarea = screen.getByLabelText('Optional feedback details textarea')
    await user.type(textarea, 'The response was not helpful')
    await user.click(screen.getByLabelText('Submit Feedback'))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        'The response was not helpful',
        'other',
      )
    })
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  it('resets feedback and category after successful submission', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    const { rerender } = renderWithProviders(
      <FeedbackModal isOpen={true} onClose={vi.fn()} onSubmit={onSubmit} />,
    )

    const textarea = screen.getByLabelText('Optional feedback details textarea')
    await user.type(textarea, 'Some text')
    await user.click(screen.getByLabelText('Submit Feedback'))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled()
    })

    // Re-render as if the modal was reopened
    rerender(
      <FeedbackModal isOpen={true} onClose={vi.fn()} onSubmit={onSubmit} />,
    )

    // State should have been reset inside the component
    const newTextarea = screen.getByLabelText(
      'Optional feedback details textarea',
    )
    expect(newTextarea).toHaveValue('')

    const select = screen.getByLabelText('Feedback category select')
    expect(select).toHaveValue('Other')
  })

  // ---------------------------------------------------------------
  // Category selection
  // ---------------------------------------------------------------

  it('allows selecting a different feedback category', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    renderModal({ onSubmit })

    const select = screen.getByLabelText('Feedback category select')
    await user.click(select)

    // Pick "UI bug" from the dropdown
    const option = await screen.findByText('UI bug')
    await user.click(option)

    await user.click(screen.getByLabelText('Submit Feedback'))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('', 'ui_bug')
    })
  })

  it('submits with both custom category and feedback text', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    renderModal({ onSubmit })

    // Select category
    const select = screen.getByLabelText('Feedback category select')
    await user.click(select)
    const option = await screen.findByText('Not factually correct')
    await user.click(option)

    // Type feedback
    const textarea = screen.getByLabelText('Optional feedback details textarea')
    await user.type(textarea, 'Incorrect dates mentioned')

    await user.click(screen.getByLabelText('Submit Feedback'))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        'Incorrect dates mentioned',
        'inaccurate',
      )
    })
  })

  // ---------------------------------------------------------------
  // Error handling
  // ---------------------------------------------------------------

  it('does not close the modal when onSubmit throws an error', async () => {
    const user = userEvent.setup()
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})
    const submitError = new Error('Network failure')
    const onSubmit = vi.fn().mockRejectedValue(submitError)
    const onClose = vi.fn()

    renderModal({ onSubmit, onClose })

    await user.click(screen.getByLabelText('Submit Feedback'))

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Feedback submission failed:',
        submitError,
      )
    })

    expect(onClose).not.toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })

  it('re-enables the submit button after a failed submission', async () => {
    const user = userEvent.setup()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const onSubmit = vi.fn().mockRejectedValue(new Error('fail'))

    renderModal({ onSubmit })

    const submitButton = screen.getByLabelText('Submit Feedback')
    await user.click(submitButton)

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })
  })

  // ---------------------------------------------------------------
  // Submitting state
  // ---------------------------------------------------------------

  it('disables the submit button while submission is in progress', async () => {
    const user = userEvent.setup()
    let resolveSubmit: () => void = () => {}
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve
        }),
    )

    renderModal({ onSubmit })

    const submitButton = screen.getByLabelText('Submit Feedback')

    await user.click(submitButton)

    await waitFor(() => {
      expect(submitButton).toBeDisabled()
    })

    // Resolve the promise to finish submission
    resolveSubmit()

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })
  })

  // ---------------------------------------------------------------
  // All category options are available
  // ---------------------------------------------------------------

  it('renders all feedback category options', async () => {
    const user = userEvent.setup()
    renderModal()

    const select = screen.getByLabelText('Feedback category select')
    await user.click(select)

    const expectedLabels = [
      'Not factually correct',
      'Harmful content',
      'Unclear Response',
      'UI bug',
      'Overactive refusal',
      'Did not fully follow my request',
      'Other',
    ]

    for (const label of expectedLabels) {
      expect(await screen.findByText(label)).toBeInTheDocument()
    }
  })
})
