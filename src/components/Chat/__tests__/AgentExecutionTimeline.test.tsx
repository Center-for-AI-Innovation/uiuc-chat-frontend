import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AgentExecutionTimeline } from '../AgentExecutionTimeline'
import { type AgentEvent } from '@/types/chat'

const baseTime = '2026-03-09T20:00:00.000Z'

const makeRetrievalEvent = (
  overrides: Partial<AgentEvent> = {},
): AgentEvent => ({
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
  ...overrides,
})

const makeFinalResponseEvent = (
  overrides: Partial<AgentEvent> = {},
): AgentEvent => ({
  id: 'agent-final-response',
  stepNumber: 2,
  type: 'final_response',
  status: 'running',
  title: 'Generating response',
  createdAt: '2026-03-09T20:00:04.000Z',
  ...overrides,
})

describe('AgentExecutionTimeline', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

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
      makeRetrievalEvent(),
    ]

    render(<AgentExecutionTimeline events={events} />)

    expect(screen.getByText('6 chunks retrieved')).toBeInTheDocument()
    expect(
      screen.queryByText('6 chunks retrieved so far'),
    ).not.toBeInTheDocument()
  })

  it('marks retrieval work complete once final response generation starts', () => {
    const events: AgentEvent[] = [
      makeRetrievalEvent(),
      makeFinalResponseEvent(),
    ]

    render(<AgentExecutionTimeline events={events} />)

    expect(screen.getByText('6 chunks retrieved')).toBeInTheDocument()
    expect(screen.queryByText('Active')).not.toBeInTheDocument()
  })

  it('keeps the timeline active between visible agent steps when the run is still in progress', () => {
    render(<AgentExecutionTimeline events={[makeRetrievalEvent()]} isRunning />)

    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('6 chunks so far')).toBeInTheDocument()
    expect(screen.queryByText('6 chunks retrieved')).not.toBeInTheDocument()
  })

  it('freezes elapsed time once agent work completes even if final response updates later', () => {
    vi.useFakeTimers()

    const { rerender } = render(
      <AgentExecutionTimeline
        events={[makeRetrievalEvent(), makeFinalResponseEvent()]}
      />,
    )

    expect(screen.getByText('3s')).toBeInTheDocument()

    rerender(
      <AgentExecutionTimeline
        events={[
          makeRetrievalEvent(),
          makeFinalResponseEvent({
            status: 'done',
            title: 'Done',
            updatedAt: '2026-03-09T20:00:12.000Z',
          }),
        ]}
      />,
    )

    expect(screen.getByText('3s')).toBeInTheDocument()
    expect(screen.queryByText('12s')).not.toBeInTheDocument()
  })
})
