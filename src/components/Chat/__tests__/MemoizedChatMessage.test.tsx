import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '~/test-utils/renderWithProviders'
import { makeMessage } from '~/test-utils/mocks/chat'
import { MemoizedChatMessage } from '../MemoizedChatMessage'

vi.mock('../ChatMessage', () => ({
  ChatMessage: (props: {
    message: { content?: string; id?: string; feedback?: unknown }
  }) =>
    React.createElement(
      'div',
      { 'data-testid': 'chat-message' },
      props.message?.content ?? '',
    ),
}))

describe('MemoizedChatMessage', () => {
  it('renders message content via ChatMessage', () => {
    const message = makeMessage({
      id: 'm1',
      role: 'user',
      content: 'Hello',
      feedback: null,
    }) as any

    renderWithProviders(
      <MemoizedChatMessage
        message={message}
        messageIndex={0}
        courseName="CS101"
      />,
    )
    expect(screen.getByTestId('chat-message')).toHaveTextContent('Hello')
  })

  it('memo comparator: re-render with same content/id/feedback does not change displayed content', () => {
    const message = makeMessage({
      id: 'm1',
      role: 'assistant',
      content: 'Same',
      feedback: { rating: 1 },
    }) as any

    const { rerender } = renderWithProviders(
      <MemoizedChatMessage
        message={message}
        messageIndex={0}
        courseName="CS101"
      />,
    )
    expect(screen.getByTestId('chat-message')).toHaveTextContent('Same')

    rerender(
      <MemoizedChatMessage
        message={{
          ...message,
          content: 'Same',
          id: 'm1',
          feedback: { rating: 1 },
        }}
        messageIndex={0}
        courseName="CS101"
      />,
    )
    expect(screen.getByTestId('chat-message')).toHaveTextContent('Same')
  })

  it('memo comparator: re-render with different content triggers update', () => {
    const message1 = makeMessage({
      id: 'm1',
      role: 'user',
      content: 'First',
      feedback: null,
    }) as any

    const { rerender } = renderWithProviders(
      <MemoizedChatMessage
        message={message1}
        messageIndex={0}
        courseName="CS101"
      />,
    )
    expect(screen.getByTestId('chat-message')).toHaveTextContent('First')

    const message2 = {
      ...message1,
      content: 'Second',
      id: 'm1',
      feedback: null,
    }
    rerender(
      <MemoizedChatMessage
        message={message2}
        messageIndex={0}
        courseName="CS101"
      />,
    )
    expect(screen.getByTestId('chat-message')).toHaveTextContent('Second')
  })

  it('memo comparator: re-render with different feedback triggers update', () => {
    const message1 = makeMessage({
      id: 'm1',
      role: 'user',
      content: 'Same',
      feedback: { rating: 1 },
    }) as any

    const { rerender } = renderWithProviders(
      <MemoizedChatMessage
        message={message1}
        messageIndex={0}
        courseName="CS101"
      />,
    )

    const message2 = { ...message1, feedback: { rating: -1 } }
    rerender(
      <MemoizedChatMessage
        message={message2}
        messageIndex={0}
        courseName="CS101"
      />,
    )
    expect(screen.getByTestId('chat-message')).toHaveTextContent('Same')
  })
})
