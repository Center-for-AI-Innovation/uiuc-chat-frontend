import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import SetExampleQuestions from '../SetExampleQuestions'
import { renderWithProviders } from '~/test-utils/renderWithProviders'

vi.mock('~/utils/apiUtils', () => ({
  callSetCourseMetadata: vi.fn(async () => undefined),
}))

describe('SetExampleQuestions - accessibility', () => {
  it('persists edits to pre-existing questions when saved', async () => {
    const user = userEvent.setup()
    const { callSetCourseMetadata } = await import('~/utils/apiUtils')

    renderWithProviders(
      <SetExampleQuestions
        course_name="CS101"
        course_metadata={{ example_questions: ['Old question'] } as any}
      />,
    )

    const input = screen.getByDisplayValue('Old question')
    expect(input).toBeInTheDocument()

    await user.clear(input)
    await user.type(input, 'Updated question')

    const saveButton = screen.getAllByRole('button', { name: /Save/i })[0]
    if (!saveButton) throw new Error('Expected a Save button')
    fireEvent.click(saveButton)

    await waitFor(() =>
      expect(vi.mocked(callSetCourseMetadata)).toHaveBeenCalledWith('CS101', {
        example_questions: ['Updated question'],
      }),
    )
  })
})
