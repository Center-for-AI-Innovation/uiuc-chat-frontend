import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { makeMessage } from '~/test-utils/mocks/chat'
import { MessageActions } from '../MessageActions'
import { FeedbackModal } from '../FeedbackModal'
import { DocumentGroupsItem } from '../DocumentGroupsItem'
import HomeContext from '~/pages/api/home/home.context'
import { makeHomeContext, makeHomeState } from '~/test-utils/mocks/homeContext'

vi.mock('@mantine/hooks', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    useMediaQuery: () => false,
  }
})

describe('MessageActions', () => {
  it('copies content, toggles thumbs up feedback, and calls regenerate', async () => {
    const user = userEvent.setup()
    const onFeedback = vi.fn()
    const onRegenerate = vi.fn()
    const onOpenFeedbackModal = vi.fn()
    const writeTextSpy = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue()

    const message = makeMessage({
      role: 'assistant',
      content: 'Assistant response',
    })

    render(
      <MessageActions
        message={message}
        messageIndex={3}
        isLastMessage={true}
        onRegenerate={onRegenerate}
        onFeedback={onFeedback}
        onOpenFeedbackModal={onOpenFeedbackModal}
      />,
    )

    await user.click(screen.getByRole('button', { name: /copy message/i }))
    expect(writeTextSpy).toHaveBeenCalledWith('Assistant response')

    const thumbsUp = screen.getByRole('button', { name: /good response/i })
    await user.click(thumbsUp)
    expect(onFeedback).toHaveBeenCalledWith(message, true)

    await user.click(
      screen.getByRole('button', { name: /remove good response/i }),
    )
    expect(onFeedback).toHaveBeenCalledWith(message, null)

    await user.click(
      screen.getByRole('button', { name: /regenerate response/i }),
    )
    expect(onRegenerate).toHaveBeenCalledWith(3)
  })

  it('opens feedback modal when thumbs down is clicked', async () => {
    const user = userEvent.setup()
    const onOpenFeedbackModal = vi.fn()

    render(
      <MessageActions
        message={makeMessage({ role: 'assistant', content: 'Nope' })}
        messageIndex={0}
        isLastMessage={true}
        onOpenFeedbackModal={onOpenFeedbackModal}
      />,
    )

    await user.click(screen.getByRole('button', { name: /bad response/i }))
    expect(onOpenFeedbackModal).toHaveBeenCalled()
  })
})

describe('FeedbackModal', () => {
  it('submits feedback and closes on success', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(
      <FeedbackModal isOpen={true} onClose={onClose} onSubmit={onSubmit} />,
    )

    fireEvent.change(
      screen.getByLabelText(/optional feedback details textarea/i),
      { target: { value: 'Details here' } },
    )
    await user.click(screen.getByRole('button', { name: /submit feedback/i }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith('Details here', 'other'),
    )
    expect(onClose).toHaveBeenCalled()
  })

  it('logs errors when submission fails', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onSubmit = vi.fn().mockRejectedValue(new Error('submit failed'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <FeedbackModal isOpen={true} onClose={onClose} onSubmit={onSubmit} />,
    )
    await user.click(screen.getByRole('button', { name: /submit feedback/i }))

    await waitFor(() => expect(consoleSpy).toHaveBeenCalled())
    expect(onClose).not.toHaveBeenCalled()
  })
})

describe('DocumentGroupsItem', () => {
  it('filters document groups and dispatches toggle updates', async () => {
    const user = userEvent.setup()
    const dispatch = vi.fn()
    const state = makeHomeState({
      documentGroups: [
        { id: 'dg-1', name: 'Physics', checked: true },
        { id: 'dg-2', name: 'Math', checked: false },
      ],
    })

    const context = makeHomeContext({ state, dispatch })

    render(
      <HomeContext.Provider value={context}>
        <DocumentGroupsItem />
      </HomeContext.Provider>,
    )

    await user.type(
      screen.getByPlaceholderText(/search by document group/i),
      'zzz',
    )
    expect(screen.getByText(/no document groups found/i)).toBeInTheDocument()

    await user.clear(screen.getByPlaceholderText(/search by document group/i))
    const switches = screen.getAllByRole('switch')
    await user.click(switches[0]!)

    expect(dispatch).toHaveBeenCalledWith({
      field: 'documentGroups',
      value: [
        { id: 'dg-1', name: 'Physics', checked: false },
        { id: 'dg-2', name: 'Math', checked: false },
      ],
    })
  })
})
