'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
  ChainOfThoughtSearchResults,
  ChainOfThoughtSearchResult,
} from '@/components/ai-elements/chain-of-thought'
import { cn } from '@/components/shadcn/lib/utils'
import { Search } from 'lucide-react'
import type { AgentEvent } from '@/types/chat'

interface AgentExecutionTimelineProps {
  events?: AgentEvent[]
}

const getEventTimestamp = (event: AgentEvent) =>
  new Date(event.updatedAt ?? event.createdAt ?? 0).getTime()

const summariseEvent = (event: AgentEvent) => {
  const meta = event.metadata

  if (event.type === 'retrieval') {
    const query = meta?.contextQuery || 'documents'
    const count =
      typeof meta?.contextsRetrieved === 'number'
        ? meta.contextsRetrieved
        : undefined

    return {
      title: `Searching for ${query}`,
      count: count,
      detail: '',
      show: true,
    }
  }

  if (event.type === 'final_response') {
    return {
      title: 'Response generated',
      count: undefined,
      detail: '',
      show: true,
    }
  }

  if (event.type === 'tool') {
    const tool =
      meta?.readableToolName ?? meta?.toolName ?? meta?.selectedToolNames?.[0]
    const output = meta?.outputText
    return {
      title: tool || 'Tool executed',
      count: undefined,
      detail: output || meta?.info || '',
      show: true,
    }
  }

  // Skip action_selection - redundant
  return {
    title: '',
    count: undefined,
    detail: '',
    show: false,
  }
}

// Only filter out action_selection, keep all other events
const getFilteredEvents = (events: AgentEvent[]): AgentEvent[] => {
  return events.filter((e) => {
    const summary = summariseEvent(e)
    return summary.show
  })
}

export const AgentExecutionTimeline = ({
  events,
}: AgentExecutionTimelineProps) => {
  const sortedEvents = useMemo(() => {
    if (!events) return []
    return [...events].sort(
      (a, b) => getEventTimestamp(a) - getEventTimestamp(b),
    )
  }, [events])

  const filteredEvents = useMemo(
    () => getFilteredEvents(sortedEvents),
    [sortedEvents],
  )

  const previewEvents = useMemo(
    () => filteredEvents.slice(-5),
    [filteredEvents],
  )

  const streaming = useMemo(
    () =>
      sortedEvents.some(
        (event) => event.status === 'running' || event.status === 'pending',
      ),
    [sortedEvents],
  )

  const [isOpen, setIsOpen] = useState(false)
  const previewRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!streaming || !previewRef.current) return
    previewRef.current.scrollTo({
      top: previewRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [previewEvents, streaming])

  if (sortedEvents.length === 0) {
    return null
  }

  const getStatus = (event: AgentEvent): 'complete' | 'active' | 'pending' => {
    if (event.status === 'error') return 'complete'
    if (event.status === 'running') return 'active'
    if (event.status === 'pending') return 'pending'
    return 'complete'
  }

  return (
    <div className="w-[95%] overflow-hidden rounded-lg bg-[--background] shadow-md">
      <ChainOfThought
        open={isOpen}
        onOpenChange={setIsOpen}
        className="w-full max-w-none [&_.bg-border]:bg-[--foreground-faded]"
      >
        <ChainOfThoughtHeader className="p-3 pb-0">
          <div className="flex w-full items-center justify-between">
            <span>Agent reasoning</span>
            {streaming && (
              <span className="flex items-center gap-1.5 text-xs text-[--foreground-faded]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[--primary]" />
                Active
              </span>
            )}
          </div>
        </ChainOfThoughtHeader>

        {!isOpen && (
          <div className="p-3 px-3 pt-2">
            <div
              ref={previewRef}
              className="max-h-20 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,rgba(0,0,0,0.15),rgba(0,0,0,0.6),rgba(0,0,0,1))]"
            >
              <div className="space-y-1">
                {previewEvents.map((event) => {
                  const { title, count } = summariseEvent(event)
                  const isRunning = event.status === 'running'
                  return (
                    <div
                      key={event.id}
                      className="flex items-start gap-2 text-xs"
                    >
                      <span
                        className={cn(
                          'mt-1.5 h-1 w-1 shrink-0 rounded-full',
                          isRunning
                            ? 'animate-pulse bg-[--primary]'
                            : 'bg-[--foreground-faded]',
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-[--foreground]">{title}</span>
                        {count !== undefined && (
                          <span className="text-[--foreground-faded]">
                            {' '}
                            · {count} doc{count === 1 ? '' : 's'}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        <ChainOfThoughtContent className="p-4">
          {filteredEvents.map((event) => {
            const { title, count, detail } = summariseEvent(event)
            const status = getStatus(event)
            const icon = event.type === 'retrieval' ? Search : undefined

            return (
              <ChainOfThoughtStep
                key={event.id}
                status={status}
                icon={icon}
                label={
                  <div className="space-y-1">
                    <div className="text-[--foreground]">{title}</div>
                    {count !== undefined && (
                      <ChainOfThoughtSearchResults>
                        <ChainOfThoughtSearchResult className="border-0 bg-[--primary] text-[--primary-foreground] hover:bg-[--primary]">
                          Found {count} document chunk{count === 1 ? '' : 's'}
                        </ChainOfThoughtSearchResult>
                      </ChainOfThoughtSearchResults>
                    )}
                    {detail && (
                      <div className="text-sm text-[--foreground-faded]">
                        {detail}
                      </div>
                    )}
                    {event.metadata?.errorMessage && (
                      <div className="text-sm text-red-500">
                        {event.metadata.errorMessage}
                      </div>
                    )}
                  </div>
                }
              />
            )
          })}
        </ChainOfThoughtContent>
      </ChainOfThought>
    </div>
  )
}
