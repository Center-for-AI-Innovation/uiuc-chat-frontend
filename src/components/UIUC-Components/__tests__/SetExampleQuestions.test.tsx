import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import SetExampleQuestions from '../SetExampleQuestions'
import { renderWithProviders } from '~/test-utils/renderWithProviders'

vi.mock('@/hooks/__internal__/setCourseMetadata', () => ({
  callSetCourseMetadata: vi.fn(async () => true),
}))

describe('SetExampleQuestions', () => {
  it('adds a new empty input when typing into the last input', async () => {
    renderWithProviders(
      <SetExampleQuestions
        course_name="CS101"
        course_metadata={{ example_questions: [''] } as any}
      />,
    )

    const inputs = screen.getAllByLabelText(/Example question/i)
    expect(inputs).toHaveLength(1)

    fireEvent.change(inputs[0]!, { target: { value: 'What is a monad?' } })
    await waitFor(() =>
      expect(screen.getAllByLabelText(/Example question/i)).toHaveLength(2),
    )
  })

  it('adds an input on focus when all current questions are filled', async () => {
    renderWithProviders(
      <SetExampleQuestions
        course_name="CS101"
        course_metadata={{ example_questions: ['Q1', 'Q2'] } as any}
      />,
    )

    const inputs = screen.getAllByLabelText(/Example question/i)
    expect(inputs).toHaveLength(2)

    fireEvent.focus(inputs[1]!)
    await waitFor(() =>
      expect(screen.getAllByLabelText(/Example question/i)).toHaveLength(3),
    )
  })

  it('submits filtered questions via callSetCourseMetadata', async () => {
    const user = userEvent.setup()
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    const { callSetCourseMetadata } = await import(
      '@/hooks/__internal__/setCourseMetadata'
    )

    renderWithProviders(
      <SetExampleQuestions
        course_name="CS101"
        course_metadata={{ example_questions: [''] } as any}
      />,
    )

    // Type a second question (the component appends an empty input when typing in the last).
    const inputs = screen.getAllByLabelText(/Example question/i)
    const firstInput = inputs[0]
    if (!firstInput) throw new Error('Expected an example question input')
    await user.type(firstInput, 'Q1')
    await waitFor(() =>
      expect(screen.getAllByLabelText(/Example question/i)).toHaveLength(2),
    )
    const secondInput = screen.getAllByLabelText(/Example question/i)[1]
    if (!secondInput)
      throw new Error('Expected a second example question input')
    await user.type(secondInput, 'Q2')

    const saveButton = screen.getAllByRole('button', { name: /Save/i })[0]
    if (!saveButton) throw new Error('Expected a Save button')
    fireEvent.click(saveButton)

    await waitFor(() =>
      expect(vi.mocked(callSetCourseMetadata)).toHaveBeenCalledWith('CS101', {
        example_questions: ['Q1', 'Q2'],
      }),
    )
    expect(alertSpy).not.toHaveBeenCalled()
  })

  it('alerts and does not submit when course_name is empty', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    const { callSetCourseMetadata } = await import(
      '@/hooks/__internal__/setCourseMetadata'
    )

    renderWithProviders(
      <SetExampleQuestions
        course_name=""
        course_metadata={{ example_questions: ['Q1'] } as any}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Save/i }))

    expect(alertSpy).toHaveBeenCalledWith('Course name is required')
    expect(vi.mocked(callSetCourseMetadata)).not.toHaveBeenCalled()
  })
})
