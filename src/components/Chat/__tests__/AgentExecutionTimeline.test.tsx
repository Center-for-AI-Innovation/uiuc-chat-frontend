import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AgentExecutionTimeline } from '../AgentExecutionTimeline'
import { type AgentEvent } from '@/types/chat'

const baseTime = '2026-03-09T20:00:00.000Z'

describe('AgentExecutionTimeline', () => {
  it('shows completed retrieval status for persisted chats without a final response event', () => {
    const events: AgentEvent[] = [
      {
        id: 'agent-initializing',
        stepNumber: 0,
        type: 'initializing',
        status: 'done',
        title: 'Initializing agent...',
        createdAt: baseTime,
        updatedAt: baseTime,
      },
      {
        id: 'agent-step-1-retrieval-0',
        stepNumber: 1,
        type: 'retrieval',
        status: 'done',
        title: 'Searching documents',
        createdAt: baseTime,
        updatedAt: '2026-03-09T20:00:03.000Z',
        metadata: {
          contextQuery: 'transformers',
          contextsRetrieved: 6,
        },
      },
    ]

    render(<AgentExecutionTimeline events={events} />)

    expect(screen.getByText('6 chunks retrieved')).toBeInTheDocument()
    expect(
      screen.queryByText('6 chunks retrieved so far'),
    ).not.toBeInTheDocument()
  })

  it('keeps the retrieval summary active while the final response is still running', () => {
    const events: AgentEvent[] = [
      {
        id: 'agent-step-1-retrieval-0',
        stepNumber: 1,
        type: 'retrieval',
        status: 'done',
        title: 'Searching documents',
        createdAt: baseTime,
        updatedAt: '2026-03-09T20:00:03.000Z',
        metadata: {
          contextQuery: 'transformers',
          contextsRetrieved: 6,
        },
      },
      {
        id: 'agent-final-response',
        stepNumber: 2,
        type: 'final_response',
        status: 'running',
        title: 'Generating response',
        createdAt: '2026-03-09T20:00:04.000Z',
      },
    ]

    render(<AgentExecutionTimeline events={events} />)

    expect(screen.getByText('6 chunks so far')).toBeInTheDocument()
  })
})
