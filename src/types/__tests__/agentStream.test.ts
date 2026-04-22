/* @vitest-environment node */

import { describe, expect, it } from 'vitest'

import type { UIUCTool } from '../chat'
import {
  type AgentDoneEvent,
  type AgentInitializingEvent,
  type AgentStreamEvent,
  parseAgentStreamEvent,
  serializeAgentStreamEvent,
  toClientUIUCTool,
} from '../agentStream'

describe('serializeAgentStreamEvent', () => {
  it('serializes an event to SSE data format', () => {
    const event: AgentInitializingEvent = {
      type: 'initializing',
      messageId: 'msg-1',
      conversationId: 'conv-1',
      assistantMessageId: 'asst-1',
    }

    const result = serializeAgentStreamEvent(event)

    expect(result).toBe(`data: ${JSON.stringify(event)}\n\n`)
  })

  it('serializes a done event with summary', () => {
    const event: AgentDoneEvent = {
      type: 'done',
      conversationId: 'conv-1',
      finalMessageId: 'asst-1',
      summary: {
        totalContextsRetrieved: 3,
        toolsExecuted: [
          {
            name: 'search',
            readableName: 'Search',
            hasOutput: true,
            hasError: false,
          },
        ],
      },
    }

    const result = serializeAgentStreamEvent(event)
    const parsed = JSON.parse(result.replace('data: ', '').trim())

    expect(parsed.type).toBe('done')
    expect(parsed.summary.toolsExecuted).toHaveLength(1)
  })
})

describe('parseAgentStreamEvent', () => {
  it('parses a valid SSE data line with "data: " prefix', () => {
    const event: AgentStreamEvent = {
      type: 'initializing',
      messageId: 'msg-1',
      assistantMessageId: 'asst-1',
    }
    const dataLine = `data: ${JSON.stringify(event)}`

    const result = parseAgentStreamEvent(dataLine)

    expect(result).toEqual(event)
  })

  it('parses a valid JSON string without "data: " prefix', () => {
    const event: AgentStreamEvent = {
      type: 'error',
      message: 'something went wrong',
      recoverable: false,
    }
    const dataLine = JSON.stringify(event)

    const result = parseAgentStreamEvent(dataLine)

    expect(result).toEqual(event)
  })

  it('returns null for invalid JSON', () => {
    const result = parseAgentStreamEvent('data: {invalid json}')

    expect(result).toBeNull()
  })

  it('returns null for JSON without a type field', () => {
    const result = parseAgentStreamEvent('data: {"foo":"bar"}')

    expect(result).toBeNull()
  })

  it('returns null for JSON with non-string type field', () => {
    const result = parseAgentStreamEvent('data: {"type":123}')

    expect(result).toBeNull()
  })

  it('returns null for empty string', () => {
    const result = parseAgentStreamEvent('')

    expect(result).toBeNull()
  })
})

describe('toClientUIUCTool', () => {
  it('converts a UIUCTool with output to ClientUIUCTool', () => {
    const tool: UIUCTool = {
      id: 'tool-1',
      invocationId: 'inv-1',
      name: 'search_tool',
      readableName: 'Search Tool',
      description: 'Searches for things',
      aiGeneratedArgumentValues: { query: 'hello' },
      output: {
        text: 'Found results',
        imageUrls: ['https://example.com/img.png'],
        data: { key: 'value' },
      },
      error: undefined,
    }

    const result = toClientUIUCTool(tool)

    expect(result).toEqual({
      id: 'tool-1',
      invocationId: 'inv-1',
      name: 'search_tool',
      readableName: 'Search Tool',
      description: 'Searches for things',
      aiGeneratedArgumentValues: { query: 'hello' },
      output: {
        text: 'Found results',
        imageUrls: ['https://example.com/img.png'],
        hasData: true,
      },
      error: undefined,
    })
  })

  it('sets hasData to false when output.data is undefined', () => {
    const tool: UIUCTool = {
      id: 'tool-2',
      name: 'tool_name',
      readableName: 'Tool Name',
      description: 'A tool',
      output: {
        text: 'result',
      },
    }

    const result = toClientUIUCTool(tool)

    expect(result.output).toEqual({
      text: 'result',
      imageUrls: undefined,
      hasData: false,
    })
  })

  it('sets output to undefined when tool has no output', () => {
    const tool: UIUCTool = {
      id: 'tool-3',
      name: 'tool_name',
      readableName: 'Tool Name',
      description: 'A tool',
    }

    const result = toClientUIUCTool(tool)

    expect(result.output).toBeUndefined()
  })

  it('preserves the error field', () => {
    const tool: UIUCTool = {
      id: 'tool-4',
      name: 'tool_name',
      readableName: 'Tool Name',
      description: 'A tool',
      error: 'Something failed',
    }

    const result = toClientUIUCTool(tool)

    expect(result.error).toBe('Something failed')
  })
})
