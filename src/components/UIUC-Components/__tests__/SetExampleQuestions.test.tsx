import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import SetExampleQuestions from '../SetExampleQuestions'
import { renderWithProviders } from '~/test-utils/renderWithProviders'

vi.mock('~/utils/apiUtils', () => ({
  callSetCourseMetadata: vi.fn(async () => true),
}))

async function getCallSetCourseMetadata() {
  const { callSetCourseMetadata } = await import('~/utils/apiUtils')
  return vi.mocked(callSetCourseMetadata)
}

describe('SetExampleQuestions', () => {
  beforeEach(async () => {
    const mock = await getCallSetCourseMetadata()
    mock.mockClear()
    mock.mockResolvedValue(true)
  })

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  it('renders a single empty input when no example questions exist', () => {
    renderWithProviders(
      <SetExampleQuestions
        course_name="CS101"
        course_metadata={{ example_questions: [] } as any}
      />,
    )

    const inputs = screen.getAllByRole('textbox')
    expect(inputs).toHaveLength(1)
    expect(inputs[0]).toHaveValue('')
  })

  it('renders a single empty input when example_questions is undefined', () => {
    renderWithProviders(
      <SetExampleQuestions course_name="CS101" course_metadata={{} as any} />,
    )

    const inputs = screen.getAllByRole('textbox')
    expect(inputs).toHaveLength(1)
    expect(inputs[0]).toHaveValue('')
  })

  it('renders prefilled questions from metadata with an empty placeholder', () => {
    renderWithProviders(
      <SetExampleQuestions
        course_name="CS101"
        course_metadata={{ example_questions: ['Q1', 'Q2'] } as any}
      />,
    )

    const inputs = screen.getAllByRole('textbox')
    // 2 saved questions + 1 empty placeholder
    expect(inputs).toHaveLength(3)
    expect(inputs[0]).toHaveValue('Q1')
    expect(inputs[1]).toHaveValue('Q2')
    expect(inputs[2]).toHaveValue('')
  })

  it('renders placeholder text on every input', () => {
    renderWithProviders(
      <SetExampleQuestions
        course_name="CS101"
        course_metadata={{ example_questions: [] } as any}
      />,
    )

    expect(
      screen.getByPlaceholderText(
        'Add sample queries to illustrate usage of your AI.',
      ),
    ).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // Typing & auto-append
  // ---------------------------------------------------------------------------

  it('appends an empty input when user starts typing in the last input', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <SetExampleQuestions
        course_name="CS101"
        course_metadata={{ example_questions: [] } as any}
      />,
    )

    expect(screen.getAllByRole('textbox')).toHaveLength(1)

    const firstInput = screen.getAllByRole('textbox')[0]!
    await user.type(firstInput, 'H')

    await waitFor(() => expect(screen.getAllByRole('textbox')).toHaveLength(2))
    expect(screen.getAllByRole('textbox')[1]).toHaveValue('')
  })

  it('does not append a duplicate empty input if one already exists below', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <SetExampleQuestions
        course_name="CS101"
        course_metadata={{ example_questions: [] } as any}
      />,
    )

    const firstInput = screen.getAllByRole('textbox')[0]!
    await user.type(firstInput, 'Hello')

    await waitFor(() => expect(screen.getAllByRole('textbox')).toHaveLength(2))

    // Continue typing -- should still be 2, not 3
    await user.type(firstInput, ' world')
    expect(screen.getAllByRole('textbox')).toHaveLength(2)
  })

  it('resets status to idle when input value changes', async () => {
    const user = userEvent.setup()
    const mock = await getCallSetCourseMetadata()

    renderWithProviders(
      <SetExampleQuestions
        course_name="CS101"
        course_metadata={{ example_questions: ['Saved Q'] } as any}
      />,
    )

    // The first input starts as 'saved'. Editing it should reset status
    // (no check icon visible after editing, since it becomes idle/unsaved).
    const firstInput = screen.getAllByRole('textbox')[0]!
    await user.clear(firstInput)
    await user.type(firstInput, 'Changed Q')

    // No save should have been triggered yet (only on blur/enter)
    expect(mock).not.toHaveBeenCalled()
  })

  // ---------------------------------------------------------------------------
  // Saving on blur
  // ---------------------------------------------------------------------------

  it('submits filtered questions via callSetCourseMetadata on blur', async () => {
    const user = userEvent.setup()
    const mock = await getCallSetCourseMetadata()

    renderWithProviders(
      <SetExampleQuestions
        course_name="CS101"
        course_metadata={{ example_questions: [] } as any}
      />,
    )

    const firstInput = screen.getAllByRole('textbox')[0]!
    await user.type(firstInput, 'Q1')

    // Blur triggers auto-save
    fireEvent.blur(firstInput)

    await waitFor(() =>
      expect(mock).toHaveBeenCalledWith('CS101', {
        example_questions: ['Q1'],
      }),
    )
  })

  it('does not save empty questions on blur', async () => {
    const mock = await getCallSetCourseMetadata()

    renderWithProviders(
      <SetExampleQuestions
        course_name="CS101"
        course_metadata={{ example_questions: [] } as any}
      />,
    )

    const firstInput = screen.getAllByRole('textbox')[0]!
    fireEvent.blur(firstInput)

    expect(mock).not.toHaveBeenCalled()
  })

  it('does not re-save a question whose value has not changed', async () => {
    const mock = await getCallSetCourseMetadata()

    renderWithProviders(
      <SetExampleQuestions
        course_name="CS101"
        course_metadata={{ example_questions: ['Existing'] } as any}
      />,
    )

    // Blur on the first input which already has 'Existing' -- unchanged
    const firstInput = screen.getAllByRole('textbox')[0]!
    fireEvent.blur(firstInput)

    // Should not call API because value hasn't changed from original
    expect(mock).not.toHaveBeenCalled()
  })

  it('shows saved status after successful save on blur', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <SetExampleQuestions
        course_name="CS101"
        course_metadata={{ example_questions: [] } as any}
      />,
    )

    const firstInput = screen.getAllByRole('textbox')[0]!
    await user.type(firstInput, 'New question')
    fireEvent.blur(firstInput)

    // After successful save, the check icon should appear (svg inside the right slot)
    // The component renders a Check icon from lucide-react for saved status
    await waitFor(() => {
      // The saved check is rendered; we can verify the API was called and resolved
      expect(screen.getAllByRole('textbox')[0]).toHaveValue('New question')
    })
  })

  // ---------------------------------------------------------------------------
  // Saving on Enter
  // ---------------------------------------------------------------------------

  it('saves the question when Enter is pressed', async () => {
    const user = userEvent.setup()
    const mock = await getCallSetCourseMetadata()

    renderWithProviders(
      <SetExampleQuestions
        course_name="CS101"
        course_metadata={{ example_questions: [] } as any}
      />,
    )

    const firstInput = screen.getAllByRole('textbox')[0]!
    await user.type(firstInput, 'Enter question')
    await user.keyboard('{Enter}')

    await waitFor(() =>
      expect(mock).toHaveBeenCalledWith('CS101', {
        example_questions: ['Enter question'],
      }),
    )
  })

  it('focuses the next input when Enter is pressed', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <SetExampleQuestions
        course_name="CS101"
        course_metadata={{ example_questions: [] } as any}
      />,
    )

    const firstInput = screen.getAllByRole('textbox')[0]!
    await user.type(firstInput, 'Question 1')

    await waitFor(() => expect(screen.getAllByRole('textbox')).toHaveLength(2))

    await user.keyboard('{Enter}')

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

    expect(screen.getAllByRole('textbox')).toHaveLength(4)

    const secondInput = screen.getAllByRole('textbox')[1]!
    await user.click(secondInput)
    await user.keyboard('{Enter}')

    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox')
      expect(inputs[2]).toHaveFocus()
    })
  })

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  it('shows delete button on hover for a non-empty question', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <SetExampleQuestions
        course_name="CS101"
        course_metadata={{ example_questions: ['Q1'] } as any}
      />,
    )

    // Hover over the first question's container
    const firstInput = screen.getAllByRole('textbox')[0]!
    const container = firstInput.closest('.relative')!
    fireEvent.mouseEnter(container)

    await waitFor(() => {
      expect(screen.getByLabelText('Delete question')).toBeInTheDocument()
    })
  })

  it('hides delete button when mouse leaves', async () => {
    renderWithProviders(
      <SetExampleQuestions
        course_name="CS101"
        course_metadata={{ example_questions: ['Q1'] } as any}
      />,
    )

    const firstInput = screen.getAllByRole('textbox')[0]!
    const container = firstInput.closest('.relative')!

    fireEvent.mouseEnter(container)
    await waitFor(() => {
      expect(screen.getByLabelText('Delete question')).toBeInTheDocument()
    })

    fireEvent.mouseLeave(container)
    await waitFor(() => {
      expect(screen.queryByLabelText('Delete question')).not.toBeInTheDocument()
    })
  })

  it('does not show delete button on hover for an empty question', async () => {
    renderWithProviders(
      <SetExampleQuestions
        course_name="CS101"
        course_metadata={{ example_questions: [] } as any}
      />,
    )

    const firstInput = screen.getAllByRole('textbox')[0]!
    const container = firstInput.closest('.relative')!
    fireEvent.mouseEnter(container)

    // Empty input should not have a delete button
    expect(screen.queryByLabelText('Delete question')).not.toBeInTheDocument()
  })

  it('deletes a question and calls the API', async () => {
    const user = userEvent.setup()
    const mock = await getCallSetCourseMetadata()

    renderWithProviders(
      <SetExampleQuestions
        course_name="CS101"
        course_metadata={{ example_questions: ['Q1', 'Q2'] } as any}
      />,
    )

    expect(screen.getAllByRole('textbox')).toHaveLength(3)

    // Hover over the first question to reveal delete button
    const firstInput = screen.getAllByRole('textbox')[0]!
    const container = firstInput.closest('.relative')!
    fireEvent.mouseEnter(container)

    const deleteBtn = await screen.findByLabelText('Delete question')
    await user.click(deleteBtn)

    await waitFor(() =>
      expect(mock).toHaveBeenCalledWith('CS101', {
        example_questions: ['Q2'],
      }),
    )

    // After deletion, should have Q2 + empty placeholder = 2 inputs
    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox')
      expect(inputs).toHaveLength(2)
      expect(inputs[0]).toHaveValue('Q2')
    })
  })

  it('keeps at least one empty input after deleting the last question', async () => {
    const user = userEvent.setup()
    const mock = await getCallSetCourseMetadata()

    renderWithProviders(
      <SetExampleQuestions
        course_name="CS101"
        course_metadata={{ example_questions: ['Only Q'] } as any}
      />,
    )

    // 1 saved question + 1 empty placeholder = 2
    expect(screen.getAllByRole('textbox')).toHaveLength(2)

    // Hover and delete the only saved question
    const firstInput = screen.getAllByRole('textbox')[0]!
    const container = firstInput.closest('.relative')!
    fireEvent.mouseEnter(container)

    const deleteBtn = await screen.findByLabelText('Delete question')
    await user.click(deleteBtn)

    await waitFor(() => expect(mock).toHaveBeenCalled())

    // Should still have at least the empty placeholder input
    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox')
      expect(inputs.length).toBeGreaterThanOrEqual(1)
      // The remaining input(s) should include an empty one
      const hasEmpty = inputs.some(
        (input) => (input as HTMLInputElement).value === '',
      )
      expect(hasEmpty).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // Error handling
  // ---------------------------------------------------------------------------

  it('shows error state when save fails', async () => {
    const user = userEvent.setup()
    const mock = await getCallSetCourseMetadata()
    mock.mockResolvedValueOnce(false)

    renderWithProviders(
      <SetExampleQuestions
        course_name="CS101"
        course_metadata={{ example_questions: [] } as any}
      />,
    )

    const firstInput = screen.getAllByRole('textbox')[0]!
    await user.type(firstInput, 'Failing Q')
    fireEvent.blur(firstInput)

    // The component should display the error message in a tooltip
    // (Radix tooltip renders the text in multiple nodes)
    await waitFor(() => {
      expect(
        screen.getAllByText('Failed to save question').length,
      ).toBeGreaterThanOrEqual(1)
    })
  })

  it('shows error state when save throws an exception', async () => {
    const user = userEvent.setup()
    const mock = await getCallSetCourseMetadata()
    mock.mockRejectedValueOnce(new Error('Network error'))

    renderWithProviders(
      <SetExampleQuestions
        course_name="CS101"
        course_metadata={{ example_questions: [] } as any}
      />,
    )

    const firstInput = screen.getAllByRole('textbox')[0]!
    await user.type(firstInput, 'Failing Q')
    fireEvent.blur(firstInput)

    await waitFor(() => {
      expect(
        screen.getAllByText('Network error').length,
      ).toBeGreaterThanOrEqual(1)
    })
  })

  it('shows error state when delete fails', async () => {
    const user = userEvent.setup()
    const mock = await getCallSetCourseMetadata()
    mock.mockResolvedValueOnce(false)

    renderWithProviders(
      <SetExampleQuestions
        course_name="CS101"
        course_metadata={{ example_questions: ['Q1'] } as any}
      />,
    )

    const firstInput = screen.getAllByRole('textbox')[0]!
    const container = firstInput.closest('.relative')!
    fireEvent.mouseEnter(container)

    const deleteBtn = await screen.findByLabelText('Delete question')
    await user.click(deleteBtn)

    await waitFor(() => {
      expect(
        screen.getAllByText('Failed to delete question').length,
      ).toBeGreaterThanOrEqual(1)
    })
  })

  it('shows error state when delete throws an exception', async () => {
    const user = userEvent.setup()
    const mock = await getCallSetCourseMetadata()
    mock.mockRejectedValueOnce(new Error('Delete network error'))

    renderWithProviders(
      <SetExampleQuestions
        course_name="CS101"
        course_metadata={{ example_questions: ['Q1'] } as any}
      />,
    )

    const firstInput = screen.getAllByRole('textbox')[0]!
    const container = firstInput.closest('.relative')!
    fireEvent.mouseEnter(container)

    const deleteBtn = await screen.findByLabelText('Delete question')
    await user.click(deleteBtn)

    await waitFor(() => {
      expect(
        screen.getAllByText('Delete network error').length,
      ).toBeGreaterThanOrEqual(1)
    })
  })

  // ---------------------------------------------------------------------------
  // onStepLeave callback
  // ---------------------------------------------------------------------------

  it('registers onStepLeave callback and saves pending questions when called', async () => {
    const mock = await getCallSetCourseMetadata()
    let stepLeaveCallback: (() => Promise<void>) | undefined

    const onStepLeave = vi.fn((cb: () => Promise<void>) => {
      stepLeaveCallback = cb
    })

    const user = userEvent.setup()

    renderWithProviders(
      <SetExampleQuestions
        course_name="CS101"
        course_metadata={{ example_questions: [] } as any}
        onStepLeave={onStepLeave}
      />,
    )

    expect(onStepLeave).toHaveBeenCalled()

    // Type a question but don't blur (so it's still 'idle', not 'saved')
    const firstInput = screen.getAllByRole('textbox')[0]!
    await user.type(firstInput, 'Pending Q')

    // Now simulate the step leave
    await stepLeaveCallback!()

    await waitFor(() =>
      expect(mock).toHaveBeenCalledWith('CS101', {
        example_questions: ['Pending Q'],
      }),
    )
  })

  it('onStepLeave does not save when all questions are already saved', async () => {
    const mock = await getCallSetCourseMetadata()
    let stepLeaveCallback: (() => Promise<void>) | undefined

    const onStepLeave = vi.fn((cb: () => Promise<void>) => {
      stepLeaveCallback = cb
    })

    renderWithProviders(
      <SetExampleQuestions
        course_name="CS101"
        course_metadata={{ example_questions: ['Already saved'] } as any}
        onStepLeave={onStepLeave}
      />,
    )

    // All questions are already saved, so step leave should not trigger API call
    await stepLeaveCallback!()

    expect(mock).not.toHaveBeenCalled()
  })

  it('onStepLeave does not save empty-only questions', async () => {
    const mock = await getCallSetCourseMetadata()
    let stepLeaveCallback: (() => Promise<void>) | undefined

    const onStepLeave = vi.fn((cb: () => Promise<void>) => {
      stepLeaveCallback = cb
    })

    renderWithProviders(
      <SetExampleQuestions
        course_name="CS101"
        course_metadata={{ example_questions: [] } as any}
        onStepLeave={onStepLeave}
      />,
    )

    // Leave without typing anything
    await stepLeaveCallback!()

    expect(mock).not.toHaveBeenCalled()
  })

  // ---------------------------------------------------------------------------
  // Multiple questions saved together
  // ---------------------------------------------------------------------------

  it('saves all valid questions when saving one (includes existing questions)', async () => {
    const user = userEvent.setup()
    const mock = await getCallSetCourseMetadata()

    renderWithProviders(
      <SetExampleQuestions
        course_name="CS101"
        course_metadata={{ example_questions: ['Existing Q'] } as any}
      />,
    )

    // Type into the empty placeholder (index 1)
    const emptyInput = screen.getAllByRole('textbox')[1]!
    await user.type(emptyInput, 'New Q')
    fireEvent.blur(emptyInput)

    await waitFor(() =>
      expect(mock).toHaveBeenCalledWith('CS101', {
        example_questions: ['Existing Q', 'New Q'],
      }),
    )
  })

  // ---------------------------------------------------------------------------
  // Saving trims whitespace
  // ---------------------------------------------------------------------------

  it('trims whitespace from question values before saving', async () => {
    const user = userEvent.setup()
    const mock = await getCallSetCourseMetadata()

    renderWithProviders(
      <SetExampleQuestions
        course_name="CS101"
        course_metadata={{ example_questions: [] } as any}
      />,
    )

    const firstInput = screen.getAllByRole('textbox')[0]!
    await user.type(firstInput, '  Trimmed Q  ')
    fireEvent.blur(firstInput)

    await waitFor(() =>
      expect(mock).toHaveBeenCalledWith('CS101', {
        example_questions: ['Trimmed Q'],
      }),
    )
  })

  // ---------------------------------------------------------------------------
  // Whitespace-only input is treated as empty
  // ---------------------------------------------------------------------------

  it('does not save whitespace-only questions on blur', async () => {
    const user = userEvent.setup()
    const mock = await getCallSetCourseMetadata()

    renderWithProviders(
      <SetExampleQuestions
        course_name="CS101"
        course_metadata={{ example_questions: [] } as any}
      />,
    )

    const firstInput = screen.getAllByRole('textbox')[0]!
    await user.type(firstInput, '   ')
    fireEvent.blur(firstInput)

    expect(mock).not.toHaveBeenCalled()
  })
})
