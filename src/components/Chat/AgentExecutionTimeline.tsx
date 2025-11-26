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
import { cn } from '@/lib/utils'
import { Search, Wrench, CheckCircle2, Clock } from 'lucide-react'
import type { AgentEvent, AgentEventMetadata } from '@/types/chat'

interface AgentExecutionTimelineProps {
  events?: AgentEvent[]
}

// Grouped event - multiple retrievals in same step become one group
interface GroupedEvent {
  id: string
  stepNumber: number
  type: 'retrieval_group' | 'tool' | 'final_response'
  status: 'running' | 'done' | 'error' | 'pending'
  retrievals?: Array<{
    query: string
    count?: number
    status: 'running' | 'done' | 'error' | 'pending'
  }>
  // For non-retrieval events
  title?: string
  detail?: string
  errorMessage?: string
  createdAt: string
  updatedAt?: string
}

const getEventTimestamp = (event: AgentEvent | GroupedEvent) =>
  new Date(event.updatedAt ?? event.createdAt ?? 0).getTime()

// Group retrieval events by step number
const groupEventsByStep = (events: AgentEvent[]): GroupedEvent[] => {
  const grouped: GroupedEvent[] = []
  const retrievalsByStep = new Map<number, AgentEvent[]>()

  for (const event of events) {
    if (event.type === 'retrieval') {
      const step = event.stepNumber
      if (!retrievalsByStep.has(step)) {
        retrievalsByStep.set(step, [])
      }
      retrievalsByStep.get(step)!.push(event)
    } else if (event.type === 'tool') {
      grouped.push({
        id: event.id,
        stepNumber: event.stepNumber,
        type: 'tool',
        status: event.status,
        title: event.metadata?.readableToolName ?? event.metadata?.toolName ?? 'Tool',
        detail: event.metadata?.outputText || event.metadata?.info,
        errorMessage: event.metadata?.errorMessage,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      })
    } else if (event.type === 'final_response') {
      grouped.push({
        id: event.id,
        stepNumber: event.stepNumber,
        type: 'final_response',
        status: event.status,
        title: event.status === 'done' ? 'Done' : 'Generating response',
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      })
    }
    // Skip action_selection - redundant
  }

  // Convert retrieval groups
  for (const [stepNumber, retrievals] of retrievalsByStep) {
    const allDone = retrievals.every(r => r.status === 'done')
    const anyError = retrievals.some(r => r.status === 'error')
    const anyRunning = retrievals.some(r => r.status === 'running')

    grouped.push({
      id: `retrieval-group-step-${stepNumber}`,
      stepNumber,
      type: 'retrieval_group',
      status: anyError ? 'error' : anyRunning ? 'running' : allDone ? 'done' : 'pending',
      retrievals: retrievals.map(r => ({
        query: r.metadata?.contextQuery || 'documents',
        count: typeof r.metadata?.contextsRetrieved === 'number' ? r.metadata.contextsRetrieved : undefined,
        status: r.status,
      })),
      createdAt: retrievals[0]?.createdAt || new Date().toISOString(),
      updatedAt: retrievals[retrievals.length - 1]?.updatedAt,
    })
  }

  // Sort by timestamp
  return grouped.sort((a, b) => getEventTimestamp(a) - getEventTimestamp(b))
}

// Get all queries from grouped events for scrolling preview
const getAllQueries = (events: GroupedEvent[]): Array<{ query: string; status: string; count?: number }> => {
  const queries: Array<{ query: string; status: string; count?: number }> = []
  for (const event of events) {
    if (event.type === 'retrieval_group' && event.retrievals) {
      for (const r of event.retrievals) {
        queries.push({ query: r.query, status: r.status, count: r.count })
      }
    }
  }
  return queries
}

// Format elapsed time
const formatElapsedTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

export const AgentExecutionTimeline = ({
  events,
}: AgentExecutionTimelineProps) => {
  const groupedEvents = useMemo(() => {
    if (!events) return []
    return groupEventsByStep(events)
  }, [events])

  // Get all queries for scrolling preview
  const allQueries = useMemo(() => getAllQueries(groupedEvents), [groupedEvents])

  // Calculate total chunks
  const totalChunks = useMemo(() => {
    return groupedEvents.reduce((sum, event) => {
      if (event.type === 'retrieval_group' && event.retrievals) {
        return sum + event.retrievals.reduce((s, r) => s + (r.count || 0), 0)
      }
      return sum
    }, 0)
  }, [groupedEvents])

  // Agent is "active" until final_response is done (not just when something is running)
  const streaming = useMemo(() => {
    if (groupedEvents.length === 0) return false
    
    // Check if final_response exists and is done
    const finalResponse = groupedEvents.find(e => e.type === 'final_response')
    if (finalResponse?.status === 'done') return false
    
    // If no final response yet, or it's still running, we're active
    return true
  }, [groupedEvents])

  // Elapsed time tracking
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (events && events.length > 0 && !startTimeRef.current) {
      // Set start time from first event
      const firstEvent = events[0]
      startTimeRef.current = new Date(firstEvent?.createdAt || Date.now()).getTime()
    }

    if (!streaming) {
      // Calculate final elapsed time
      if (startTimeRef.current && events && events.length > 0) {
        const lastEvent = events[events.length - 1]
        const endTime = new Date(lastEvent?.updatedAt || lastEvent?.createdAt || Date.now()).getTime()
        setElapsedSeconds(Math.round((endTime - startTimeRef.current) / 1000))
      }
      return
    }

    // Update every second while streaming
    const interval = setInterval(() => {
      if (startTimeRef.current) {
        setElapsedSeconds(Math.round((Date.now() - startTimeRef.current) / 1000))
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [streaming, events])

  const [isOpen, setIsOpen] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const previewRef = useRef<HTMLDivElement | null>(null)
  
  // Delay showing collapsed preview when closing to avoid overlap with collapse animation
  useEffect(() => {
    if (isOpen) {
      setShowPreview(false)
    } else {
      const timer = setTimeout(() => setShowPreview(true), 150)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Auto-scroll preview
  useEffect(() => {
    if (!streaming || !previewRef.current) return
    previewRef.current.scrollTo({
      top: previewRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [allQueries, streaming])

  if (groupedEvents.length === 0) {
    return null
  }

  const getStatus = (event: GroupedEvent): 'complete' | 'active' | 'pending' => {
    if (event.status === 'error') return 'complete'
    if (event.status === 'running') return 'active'
    if (event.status === 'pending') return 'pending'
    return 'complete'
  }

  const getIcon = (event: GroupedEvent) => {
    if (event.type === 'retrieval_group') return Search
    if (event.type === 'tool') return Wrench
    if (event.type === 'final_response') return CheckCircle2
    return undefined
  }

  return (
    <div className="rounded-lg overflow-hidden bg-[--background] shadow-md w-[95%]">
      <ChainOfThought open={isOpen} onOpenChange={setIsOpen} className="w-full max-w-none [&_.bg-border]:bg-[--foreground-faded]">
        <ChainOfThoughtHeader className="p-3 pb-0">
          <div className="flex items-center justify-between w-full">
            <span>Agent reasoning</span>
            <div className="flex items-center gap-3">
              {/* Elapsed time */}
              <span className="flex items-center gap-1 text-xs text-[--foreground-faded]">
                <Clock className="h-3 w-3" />
                {formatElapsedTime(elapsedSeconds)}
              </span>
              {streaming && (
                <span className="flex items-center gap-1.5 text-xs text-[--foreground-faded]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[--primary] animate-pulse" />
                  Active
                </span>
              )}
            </div>
          </div>
        </ChainOfThoughtHeader>

        {/* Collapsed preview - show scrolling queries */}
        {!isOpen && showPreview && (
          <div className="px-3 pt-1">
            {/* Queries list */}
            <div
              ref={previewRef}
              className="max-h-36 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,rgba(0,0,0,0.1),rgba(0,0,0,0.5),rgba(0,0,0,1))]"
            >
                <div className="space-y-1">
                  {allQueries.map((q, idx) => {
                    const isRunning = q.status === 'running'
                    const isDone = q.status === 'done'
                    return (
                      <div
                        key={`query-${idx}`}
                        className="flex items-start gap-2 text-xs"
                      >
                        <Search className={cn(
                          'mt-0.5 h-3 w-3 shrink-0',
                          isRunning ? 'text-[--primary] animate-pulse' : 'text-[--foreground-faded]'
                        )} />
                        <span className={cn(
                          'truncate flex-1',
                          isRunning ? 'text-[--foreground]' : 'text-[--foreground-faded]'
                        )}>
                          {q.query}
                        </span>
                        {isDone && q.count !== undefined && (
                          <span className="text-[--foreground-faded]/60 shrink-0">
                            {q.count}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            {/* Summary line - always visible when collapsed (not part of delayed animation) */}
            {totalChunks > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-[--foreground-faded] mt-3 pt-2 border-t border-[--foreground-faded]/10">
                {streaming ? (
                  <>
                    <span className="h-3 w-3 rounded-full bg-[--primary] animate-pulse shrink-0" />
                    <span>{totalChunks} chunks so far</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                    <span>{totalChunks} chunks retrieved</span>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Expanded view */}
        <ChainOfThoughtContent className="p-4">
          {groupedEvents.map((event) => {
            const status = getStatus(event)
            const icon = getIcon(event)

            // Render retrieval group with sub-queries
            if (event.type === 'retrieval_group' && event.retrievals) {
              const totalChunksInGroup = event.retrievals.reduce((sum, r) => sum + (r.count || 0), 0)
              const queryCount = event.retrievals.length

              return (
                <ChainOfThoughtStep
                  key={event.id}
                  status={status}
                  icon={icon}
                  label={
                    <div className="space-y-2">
                      <div className="text-[--foreground] font-medium">
                        {queryCount > 1 ? `Searching ${queryCount} queries` : 'Searching documents'}
                        {status === 'complete' && totalChunksInGroup > 0 && (
                          <span className="font-normal text-[--foreground-faded]">
                            {' '}· {totalChunksInGroup} chunks
                          </span>
                        )}
                      </div>
                      {/* Sub-queries */}
                      <div className="pl-4 md:pl-5 space-y-1 md:space-y-1.5">
                        {event.retrievals.map((r, idx) => (
                          <div key={idx} className="text-xs md:text-sm text-[--foreground-faded] flex items-center gap-2">
                            <span className={cn(
                              'h-1 w-1 md:h-1.5 md:w-1.5 rounded-full shrink-0',
                              r.status === 'running' ? 'bg-[--primary] animate-pulse' :
                              r.status === 'error' ? 'bg-red-500' : 'bg-[--foreground-faded]'
                            )} />
                            <span className="flex-1" title={r.query}>
                              "{r.query}"
                            </span>
                            {r.count !== undefined && r.status === 'done' && (
                              <span className="text-[--foreground-faded]/60 shrink-0">
                                {r.count}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  }
                />
              )
            }

            // Render tool or final_response
            return (
              <ChainOfThoughtStep
                key={event.id}
                status={status}
                icon={icon}
                label={
                  <div className="space-y-1">
                    <div className="text-[--foreground]">{event.title}</div>
                    {event.detail && (
                      <div className="text-sm text-[--foreground-faded]">
                        {event.detail}
                      </div>
                    )}
                    {event.errorMessage && (
                      <div className="text-sm text-red-500">
                        {event.errorMessage}
                      </div>
                    )}
                  </div>
                }
              />
            )
          })}
          {/* Total chunks indicator at bottom of expanded view */}
          {totalChunks > 0 && (
            <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-[--foreground-faded] mt-3 pt-2 border-t border-[--foreground-faded]/10">
              {streaming ? (
                <>
                  <span className="h-3 w-3 md:h-4 md:w-4 rounded-full bg-[--primary] animate-pulse shrink-0" />
                  <span>{totalChunks} chunks retrieved so far</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-green-500 shrink-0" />
                  <span>{totalChunks} chunks retrieved</span>
                </>
              )}
            </div>
          )}
        </ChainOfThoughtContent>
      </ChainOfThought>
    </div>
  )
}
