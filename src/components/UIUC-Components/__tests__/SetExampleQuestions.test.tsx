import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import SetExampleQuestions from '../SetExampleQuestions'
import { renderWithProviders } from '~/test-utils/renderWithProviders'

vi.mock('~/utils/apiUtils', () => ({
  callSetCourseMetadata: vi.fn(async () => true),
}))

describe('SetExampleQuestions', () => {
  it('adds a new empty input when clicking Add new question button', async () => {
    renderWithProviders(
      <SetExampleQuestions
        course_name="CS101"
        course_metadata={{ example_questions: [''] } as any}
      />,
    )

    const inputs = screen.getAllByRole('textbox')
    expect(inputs).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: /Add new question/i }))
    await waitFor(() => expect(screen.getAllByRole('textbox')).toHaveLength(2))
  })

  it('renders prefilled questions from metadata', async () => {
    renderWithProviders(
      <SetExampleQuestions
        course_name="CS101"
        course_metadata={{ example_questions: ['Q1', 'Q2'] } as any}
      />,
    )

    const inputs = screen.getAllByRole('textbox')
    expect(inputs).toHaveLength(2)
    expect(inputs[0]).toHaveValue('Q1')
    expect(inputs[1]).toHaveValue('Q2')
  })

  it('submits filtered questions via callSetCourseMetadata on blur', async () => {
    const user = userEvent.setup()
    const { callSetCourseMetadata } = await import('~/utils/apiUtils')

    renderWithProviders(
      <SetExampleQuestions
        course_name="CS101"
        course_metadata={{ example_questions: [''] } as any}
      />,
    )

    const firstInput = screen.getAllByRole('textbox')[0]!
    await user.type(firstInput, 'Q1')

    // Blur triggers auto-save
    fireEvent.blur(firstInput)

    await waitFor(() =>
      expect(vi.mocked(callSetCourseMetadata)).toHaveBeenCalledWith('CS101', {
        example_questions: ['Q1'],
      }),
    )
  })

  it('does not save empty questions on blur', async () => {
    const { callSetCourseMetadata } = await import('~/utils/apiUtils')
    vi.mocked(callSetCourseMetadata).mockClear()

    renderWithProviders(
      <SetExampleQuestions
        course_name="CS101"
        course_metadata={{ example_questions: [''] } as any}
      />,
    )

    const firstInput = screen.getAllByRole('textbox')[0]!
    fireEvent.blur(firstInput)

    // Should not call API for empty input
    expect(vi.mocked(callSetCourseMetadata)).not.toHaveBeenCalled()
  })

  it('appends an empty input when user starts typing in the last input', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <SetExampleQuestions
        course_name="CS101"
        course_metadata={{ example_questions: [''] } as any}
      />,
    )

    // Starts with one empty input
    expect(screen.getAllByRole('textbox')).toHaveLength(1)

    // Type into the first (and only) input
    const firstInput = screen.getAllByRole('textbox')[0]!
    await user.type(firstInput, 'H')

    // A new empty input should have been appended
    await waitFor(() => expect(screen.getAllByRole('textbox')).toHaveLength(2))

    // The new input should be empty
    const inputs = screen.getAllByRole('textbox')
    expect(inputs[1]).toHaveValue('')
  })

  it('does not append a duplicate empty input if one already exists below', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <SetExampleQuestions
        course_name="CS101"
        course_metadata={{ example_questions: [''] } as any}
      />,
    )

    const firstInput = screen.getAllByRole('textbox')[0]!
    await user.type(firstInput, 'Hello')

    // Should have exactly 2 inputs (original + auto-appended)
    await waitFor(() => expect(screen.getAllByRole('textbox')).toHaveLength(2))

    // Continue typing — should still be 2, not 3
    await user.type(firstInput, ' world')
    expect(screen.getAllByRole('textbox')).toHaveLength(2)
  })

  it('focuses the next input when Enter is pressed', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <SetExampleQuestions
        course_name="CS101"
        course_metadata={{ example_questions: [''] } as any}
      />,
    )

    const firstInput = screen.getAllByRole('textbox')[0]!
    await user.type(firstInput, 'Question 1')

    // A second input should have appeared
    await waitFor(() => expect(screen.getAllByRole('textbox')).toHaveLength(2))

    // Press Enter on the first input
    await user.keyboard('{Enter}')

    // The second input should now be focused
    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox')
      expect(inputs[1]).toHaveFocus()
    })
  })

  it('focuses the next input when Enter is pressed on a middle input', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <SetExampleQuestions
        course_name="CS101"
        course_metadata={{ example_questions: ['Q1', 'Q2', 'Q3'] } as any}
      />,
    )

    expect(screen.getAllByRole('textbox')).toHaveLength(3)

    // Click into the second input and press Enter
    const secondInput = screen.getAllByRole('textbox')[1]!
    await user.click(secondInput)
    await user.keyboard('{Enter}')

    // The third input should now be focused
    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox')
      expect(inputs[2]).toHaveFocus()
    })
  })
})
