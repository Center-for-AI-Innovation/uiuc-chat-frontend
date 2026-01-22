import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { VariableModal } from '../VariableModal'

describe('VariableModal', () => {
  it('dedupes variables, focuses first field, and blocks submit when values are missing', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const onClose = vi.fn()
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

    render(
      <VariableModal
        variables={['topic', 'topic', 'level']}
        onSubmit={onSubmit}
        onClose={onClose}
      />,
    )

    const textareas = screen.getAllByRole('textbox')
    expect(textareas).toHaveLength(2)

    await waitFor(() => expect(textareas[0]).toHaveFocus())

    await user.click(screen.getByRole('button', { name: /submit/i }))
    expect(alertSpy).toHaveBeenCalledWith('Please fill out all variables')
    expect(onSubmit).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('submits via Enter and closes; closes on Escape and outside click', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const onClose = vi.fn()

    const { container } = render(
      <VariableModal
        variables={['a', 'b']}
        onSubmit={onSubmit}
        onClose={onClose}
      />,
    )

    const textareas = screen.getAllByRole('textbox')
    await user.type(textareas[0]!, 'one')
    await user.type(textareas[1]!, 'two')

    // Submit on Enter (without shift).
    fireEvent.keyDown(container.firstChild as HTMLElement, { key: 'Enter' })
    expect(onSubmit).toHaveBeenCalledWith(['one', 'two'])
    expect(onClose).toHaveBeenCalled()

    onClose.mockClear()

    // Escape closes.
    fireEvent.keyDown(container.firstChild as HTMLElement, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()

    // Clicking inside the modal does not close (outside-click handler ignores it).
    onClose.mockClear()
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()

    // Clicking overlay does close.
    fireEvent.click(container.firstChild as HTMLElement)
    expect(onClose).toHaveBeenCalled()
  })
})

