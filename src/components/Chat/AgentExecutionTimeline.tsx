import React from 'react'
import { IconAlertTriangle, IconCircleCheck } from '@tabler/icons-react'

import {
  type AgentEvent,
  type AgentEventMetadata,
  type AgentEventStatus,
  type AgentEventType,
} from '@/types/chat'

interface AgentExecutionTimelineProps {
  events?: AgentEvent[]
}

interface StepGroup {
  stepNumber: number
  events: AgentEvent[]
}

const typePriority: Record<AgentEventType, number> = {
  final_response: 0,
  tool: 1,
  retrieval: 2,
  action_selection: 3,
}

const formatTimestamp = (value?: string) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const cleanTitle = (title?: string) => {
  if (!title) return ''
  return title.replace(/^Step\s+\d+:\s*/i, '').trim()
}

const groupEventsByStep = (events: AgentEvent[]): StepGroup[] => {
  const grouped = new Map<number, AgentEvent[]>()

  events.forEach((event) => {
    const entry = grouped.get(event.stepNumber) ?? []
    entry.push(event)
    grouped.set(event.stepNumber, entry)
  })

  return Array.from(grouped.entries())
    .sort(([stepA], [stepB]) => stepA - stepB)
    .map(([stepNumber, stepEvents]) => ({
      stepNumber,
      events: [...stepEvents].sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return timeA - timeB
      }),
    }))
}

const getPrimaryEvent = (events: AgentEvent[]) =>
  [...events].sort((a, b) => {
    const priorityDiff = typePriority[a.type] - typePriority[b.type]
    if (priorityDiff !== 0) return priorityDiff

    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return timeA - timeB
  })[0]

const truncate = (value: string, max: number) =>
  value.length > max ? `${value.slice(0, max)}…` : value

const buildMetadataLines = (events: AgentEvent[]) => {
  const lines: React.ReactNode[] = []
  const added = new Set<string>()

  const addLine = (key: string, content: React.ReactNode) => {
    if (added.has(key)) return
    lines.push(
      <div key={key} className="leading-relaxed">
        {content}
      </div>,
    )
    added.add(key)
  }

  events.forEach((event) => {
    const metadata = event.metadata
    if (!metadata) return

    if (metadata.info) {
      addLine(`info-${event.id}`, metadata.info)
    }

    if (metadata.selectedToolNames && metadata.selectedToolNames.length > 0) {
      addLine(
        `tools-${event.id}`,
        <>
          Tools: <span className="font-medium">{metadata.selectedToolNames.join(', ')}</span>
        </>,
      )
    }

    if (event.type === 'retrieval') {
      const query = metadata.contextQuery
      const contexts =
        typeof metadata.contextsRetrieved === 'number'
          ? `${metadata.contextsRetrieved} document${metadata.contextsRetrieved === 1 ? '' : 's'}`
          : null

      if (query || contexts) {
        addLine(
          `retrieval-${event.id}`,
          <>
            Search query: {query ? <span className="font-medium">&ldquo;{truncate(query, 80)}&rdquo;</span> : '—'}
            {contexts ? <span className="text-[--message]"> · {contexts}</span> : null}
          </>,
        )
      }
    }

    if (event.type === 'tool') {
      const toolName = metadata.readableToolName ?? metadata.toolName
      if (toolName) {
        addLine(
          `tool-name-${event.id}`,
          <>
            Tool: <span className="font-medium">{toolName}</span>
          </>,
        )
      }

      if (metadata.arguments && Object.keys(metadata.arguments).length > 0) {
        addLine(
          `tool-args-${event.id}`,
          <>
            Inputs: {truncate(JSON.stringify(metadata.arguments), 100)}
          </>,
        )
      }

      if (metadata.outputText) {
        addLine(
          `tool-output-${event.id}`,
          <>
            Output: {truncate(metadata.outputText, 120)}
          </>,
        )
      }

      if (metadata.errorMessage) {
        addLine(
          `tool-error-${event.id}`,
          <span className="text-[--badge-error]">Error: {metadata.errorMessage}</span>,
        )
      }
    }

    if (event.type === 'final_response' && metadata.outputText) {
      addLine(
        `final-response-${event.id}`,
        <>
          Summary: {truncate(metadata.outputText, 140)}
        </>,
      )
    }

    if (metadata.errorMessage && event.type !== 'tool') {
      addLine(
        `error-${event.id}`,
        <span className="text-[--badge-error]">Error: {metadata.errorMessage}</span>,
      )
    }
  })

  return lines
}

const getGroupStatus = (events: AgentEvent[]): AgentEventStatus => {
  let hasRunning = false
  let hasPending = false
  let hasDone = false

  for (const event of events) {
    if (event.status === 'error') return 'error'
    if (event.status === 'running') {
      hasRunning = true
      continue
    }
    if (event.status === 'pending') {
      hasPending = true
      continue
    }
    if (event.status === 'done') {
      hasDone = true
    }
  }

  if (hasRunning) return 'running'
  if (hasPending) return 'pending'
  if (hasDone) return 'done'
  return 'pending'
}

const getGroupTimestamp = (events: AgentEvent[]) => {
  const latest = events.reduce((acc, event) => {
    const value = event.updatedAt ?? event.createdAt
    if (!value) return acc
    const time = new Date(value).getTime()
    return time > acc ? time : acc
  }, 0)

  if (latest === 0) return null
  return formatTimestamp(new Date(latest).toISOString())
}

const getGroupLabel = (stepNumber: number, events: AgentEvent[]) => {
  const primary = getPrimaryEvent(events)
  if (!primary) return `Step ${stepNumber}`

  if (primary.type === 'action_selection') {
    return 'Preparing next step'
  }

  const cleaned = cleanTitle(primary.title)
  if (cleaned.length > 0) {
    return cleaned
  }

  if (primary.type === 'retrieval') return 'Searching documents'
  if (primary.type === 'tool') return primary.metadata?.readableToolName ?? 'Running tool'
  if (primary.type === 'final_response') return 'Crafting final response'

  return `Step ${stepNumber}`
}

const AnimatedDots: React.FC = () => (
  <span className="agent-thinking-dots" aria-hidden>
    <span className="agent-thinking-dot" />
    <span className="agent-thinking-dot" />
    <span className="agent-thinking-dot" />
  </span>
)

const renderStatusBadge = (status: AgentEventStatus) => {
  switch (status) {
    case 'running':
      return (
        <span className="flex items-center gap-2 rounded-full bg-[--illinois-orange]/10 px-2.5 py-1 text-[11px] font-semibold text-[--illinois-orange]">
          Thinking
          <AnimatedDots />
        </span>
      )
    case 'done':
      return (
        <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-500">
          <IconCircleCheck size={14} /> Done
        </span>
      )
    case 'error':
      return (
        <span className="flex items-center gap-1 rounded-full bg-[--badge-error]/10 px-2.5 py-1 text-[11px] font-semibold text-[--badge-error]">
          <IconAlertTriangle size={14} /> Error
        </span>
      )
    case 'pending':
    default:
      return (
        <span className="flex items-center gap-1 rounded-full bg-slate-500/10 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
          Awaiting
        </span>
      )
  }
}

export const AgentExecutionTimeline: React.FC<AgentExecutionTimelineProps> = ({
  events,
}) => {
  if (!events || events.length === 0) return null

  const groupedSteps = groupEventsByStep(events)
    // Filter out steps that only contain action_selection events
    .filter(({ events: stepEvents }) => 
      stepEvents.some(event => event.type !== 'action_selection')
    )
  if (groupedSteps.length === 0) return null

  return (
    <div className="w-full rounded-lg border border-[--border] bg-[--background] px-3 py-3 text-sm shadow-sm sm:px-4">
      <div className="flex flex-col gap-3">
        {groupedSteps.map(({ stepNumber, events: stepEvents }) => {
          const status = getGroupStatus(stepEvents)
          const label = getGroupLabel(stepNumber, stepEvents)
          const timestamp = getGroupTimestamp(stepEvents)
          const metadataLines = buildMetadataLines(stepEvents)

          return (
            <div key={stepNumber} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[--background-faded] text-xs font-semibold text-[--message]">
                    {stepNumber}
                  </div>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate font-medium text-[--foreground]">{label}</span>
                    {timestamp ? (
                      <span className="text-[11px] text-[--message-faded]">{timestamp}</span>
                    ) : null}
                  </div>
                </div>
                {renderStatusBadge(status)}
              </div>
              {metadataLines.length > 0 ? (
                <div className="pl-10 text-xs text-[--message-faded]">
                  {metadataLines}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AgentExecutionTimeline

