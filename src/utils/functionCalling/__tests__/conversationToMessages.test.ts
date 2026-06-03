import { describe, expect, it } from 'vitest'
import { conversationToMessages } from '~/utils/functionCalling/conversationToMessages'

describe('conversationToMessages', () => {
  it('converts conversation messages to OpenAI message params', () => {
    const out = conversationToMessages({
      id: 'c1',
      name: 'Test',
      messages: [
        { id: 'm1', role: 'user', content: 'hello' },
        {
          id: 'm2',
          role: 'assistant',
          content: [{ type: 'text', text: 'hi there' }],
        },
      ],
      model: { id: 'gpt-4o-mini', name: 'GPT-4o mini' },
      prompt: '',
      temperature: 0.2,
      folderId: null,
    } as any)

    expect(out).toEqual([
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'hi there' },
    ])
  })

  it('appends tool_calls and tool result messages for executed tools on the last message', () => {
    const out = conversationToMessages({
      id: 'c1',
      name: 'Test',
      messages: [
        { id: 'm1', role: 'user', content: 'q' },
        {
          id: 'm2',
          role: 'assistant',
          content: 'final',
          tools: [
            {
              invocationId: 'id1',
              name: 't1',
              aiGeneratedArgumentValues: { a: 1 },
              output: { text: 'ok' },
            },
            {
              invocationId: 'id2',
              name: 't2',
              aiGeneratedArgumentValues: {},
              error: 'boom',
            },
            {
              invocationId: 'id3',
              name: 't3',
              aiGeneratedArgumentValues: { x: true },
              output: { data: { x: 1 } },
            },
            {
              invocationId: 'id4',
              name: 't4',
              aiGeneratedArgumentValues: { n: 2 },
              output: { imageUrls: ['u1', 'u2'] },
            },
            {
              invocationId: 'id5',
              name: 't5',
              aiGeneratedArgumentValues: { ignored: true },
              output: {},
            },
            {
              invocationId: '',
              name: 'tEmpty',
              aiGeneratedArgumentValues: {},
              output: { text: 'skip' },
            },
            {
              name: 'tNoInv',
              aiGeneratedArgumentValues: {},
              output: { text: 'skip' },
            },
          ],
        },
      ],
      model: { id: 'gpt-4o-mini', name: 'GPT-4o mini' },
      prompt: '',
      temperature: 0.2,
      folderId: null,
    } as any)

    expect(out[0]).toEqual({ role: 'user', content: 'q' })
    expect(out[1]).toEqual({ role: 'assistant', content: 'final' })

    const toolCallsMsg = out.find(
      (m: any) => m.role === 'assistant' && Array.isArray(m.tool_calls),
    ) as any
    expect(toolCallsMsg?.tool_calls?.length).toBe(5)

    const toolMsgs = out.filter((m: any) => m.role === 'tool') as any[]
    expect(toolMsgs.map((m) => m.tool_call_id)).toEqual([
      'id1',
      'id2',
      'id3',
      'id4',
    ])
    expect(toolMsgs.map((m) => m.content)).toEqual([
      'ok',
      'Error: boom',
      JSON.stringify({ x: 1 }),
      'Images generated: u1, u2',
    ])
  })

  it('does not append tool calls when no valid tool_call ids exist', () => {
    const out = conversationToMessages({
      id: 'c1',
      name: 'Test',
      messages: [
        {
          id: 'm1',
          role: 'assistant',
          content: 'final',
          tools: [
            {
              invocationId: '',
              name: 't',
              aiGeneratedArgumentValues: {},
              output: { text: 'ignored' },
            },
          ],
        },
      ],
      model: { id: 'gpt-4o-mini', name: 'GPT-4o mini' },
      prompt: '',
      temperature: 0.2,
      folderId: null,
    } as any)

    expect(out).toEqual([{ role: 'assistant', content: 'final' }])
  })
})
