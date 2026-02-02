import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Conversation, Message } from '@/types/chat'

import {
  createLogConversationPayload,
  createSaveDeltaPayload,
  deleteAllConversationsFromServer,
  deleteConversationFromServer,
  fetchConversationHistory,
  fetchLastConversation,
  reconstructConversation,
  saveConversationToLocalStorage,
  saveConversationToServer,
  saveConversations,
} from '../conversation'

function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: 'c1',
    name: 'Conversation',
    model: { id: 'm1', name: 'Model', tokenLimit: 100, enabled: true } as any,
    prompt: '',
    temperature: 0.5,
    folderId: null,
    messages: [],
    ...overrides,
  }
}

describe('conversation utils', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('createSaveDeltaPayload builds meta + messagesDelta', () => {
    const conversation = makeConversation({ projectName: 'p' })
    const msg = { id: 'm1', role: 'user', content: 'hi' } as any
    const delta = createSaveDeltaPayload(conversation, msg, 'm0')
    expect(delta.conversation).toMatchObject({
      id: 'c1',
      modelId: 'm1',
      projectName: 'p',
    })
    expect(delta.messagesDelta).toEqual([msg])
    expect(delta.earliestEditedMessageId).toBe('m0')
  })

  it('createLogConversationPayload includes user+assistant pair when available', () => {
    const conversation = makeConversation({
      messages: [
        { id: 'u', role: 'user', content: 'q' } as any,
        { id: 'a', role: 'assistant', content: 'r' } as any,
      ],
    })

    const payload = createLogConversationPayload('CS101', conversation, conversation.messages[1] as any)
    expect(payload).toMatchObject({
      course_name: 'CS101',
      delta: {
        messagesDelta: [
          { id: 'u', role: 'user' },
          { id: 'a', role: 'assistant' },
        ],
      },
    })
  })

  it('createLogConversationPayload includes messages from earliestEditedMessageId when present', () => {
    const conversation = makeConversation({
      messages: [
        { id: 'm0', role: 'user', content: 'old' } as any,
        { id: 'm1', role: 'user', content: 'edit' } as any,
        { id: 'm2', role: 'assistant', content: 'new' } as any,
      ],
    })

    const payload = createLogConversationPayload(
      'CS101',
      conversation,
      conversation.messages[2] as any,
      'm1',
    )

    expect(payload).toMatchObject({
      course_name: 'CS101',
      delta: {
        earliestEditedMessageId: 'm1',
        messagesDelta: [
          { id: 'm1', role: 'user' },
          { id: 'm2', role: 'assistant' },
        ],
      },
    })
  })

  it('createLogConversationPayload falls back to provided message when no user->assistant pair exists', () => {
    const conversation = makeConversation({
      messages: [
        { id: 'a', role: 'assistant', content: 'x' } as any,
        { id: 'b', role: 'assistant', content: 'y' } as any,
      ],
    })

    const payload = createLogConversationPayload('CS101', conversation, conversation.messages[1] as any)
    expect((payload as any).delta.messagesDelta).toEqual([conversation.messages[1]])
  })

  it('createLogConversationPayload returns full conversation when message is null', () => {
    const conversation = makeConversation({ id: 'c9' })
    expect(createLogConversationPayload('CS101', conversation, null as any)).toEqual({
      course_name: 'CS101',
      conversation,
    })
  })

  it('reconstructConversation removes null contexts from messages and tools', () => {
    const conversation = makeConversation({
      messages: [
        {
          id: 'm1',
          role: 'assistant',
          content: 'x',
          contexts: [null, { id: 1 } as any],
          tools: [{ id: 't1', name: 't', readableName: 't', description: 'd', contexts: [null, { id: 2 } as any] }] as any,
        } as any,
      ],
    })

    const rebuilt = reconstructConversation(conversation)!
    expect(rebuilt.messages[0]?.contexts).toEqual([{ id: 1 }])
    expect((rebuilt.messages[0] as any).tools[0].contexts).toEqual([{ id: 2 }])
  })

  it('reconstructConversation falls back and normalizes missing messages', () => {
    const fallback = makeConversation({ id: 'fallback', messages: undefined as any })
    const rebuilt = reconstructConversation(undefined, fallback)!
    expect(rebuilt.id).toBe('fallback')
    expect(rebuilt.messages).toEqual([])
  })

  it('saveConversationToLocalStorage stores selectedConversation and returns true', () => {
    const conversation = makeConversation({
      messages: [{ id: 'm1', role: 'user', content: 'hi' } as any],
    })

    const ok = saveConversationToLocalStorage(conversation)
    expect(ok).toBe(true)
    expect(JSON.parse(localStorage.getItem('selectedConversation') || '{}').id).toBe('c1')
  })

  it('saveConversationToLocalStorage preserves feedback on the last message', () => {
    const conversation = makeConversation({
      messages: [
        { id: 'm1', role: 'user', content: 'hi' } as any,
        {
          id: 'm2',
          role: 'assistant',
          content: 'ok',
          feedback: { isPositive: true, category: 'c', details: 'd' },
        } as any,
      ],
    })

    const ok = saveConversationToLocalStorage(conversation)
    expect(ok).toBe(true)
    const saved = JSON.parse(localStorage.getItem('selectedConversation') || '{}')
    expect(saved.messages[1]?.feedback).toEqual({ isPositive: true, category: 'c', details: 'd' })
  })

  it('saveConversationToLocalStorage returns false when there are no messages', () => {
    const conversation = makeConversation({ messages: [] })
    expect(saveConversationToLocalStorage(conversation)).toBe(false)
  })

  it('saveConversationToLocalStorage falls back to minimal payload on quota errors', () => {
    localStorage.setItem('conversationHistory', JSON.stringify([{ id: 'old' }, { id: 'older' }]))

    const originalSetItem = Storage.prototype.setItem
    let conversationHistoryWrites = 0
    let selectedConversationWrites = 0
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (key: string, value: string) {
      if (key === 'selectedConversation') {
        selectedConversationWrites += 1
        if (selectedConversationWrites === 1) {
          throw new DOMException('quota', 'QuotaExceededError')
        }
      }
      if (key === 'conversationHistory') {
        conversationHistoryWrites += 1
        if (conversationHistoryWrites === 1) {
          throw new DOMException('quota', 'QuotaExceededError')
        }
      }
      return originalSetItem.call(this, key, value)
    })

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const conversation = makeConversation({
      messages: [{ id: 'm1', role: 'user', content: 'hi', feedback: { isPositive: true, category: null, details: null } } as any],
    })

    const ok = saveConversationToLocalStorage(conversation)
    expect(ok).toBe(true)
    expect(warnSpy).toHaveBeenCalled()
  })

  it('saveConversationToLocalStorage treats DOMException code 1014 as a quota error (with feedback)', () => {
    const originalSetItem = Storage.prototype.setItem
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    setItemSpy.mockImplementationOnce(function () {
      const err = new DOMException('quota', 'Other')
      Object.defineProperty(err, 'code', { value: 1014 })
      throw err
    })
    setItemSpy.mockImplementation(function (key: string, value: string) {
      return originalSetItem.call(this, key, value)
    })

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const conversation = makeConversation({
      messages: [
        { id: 'm1', role: 'user', content: 'hi' } as any,
        {
          id: 'm2',
          role: 'assistant',
          content: 'ok',
          feedback: { isPositive: false, category: 'c', details: 'd' },
        } as any,
      ],
    })

    const ok = saveConversationToLocalStorage(conversation)
    expect(ok).toBe(true)
    expect(warnSpy).toHaveBeenCalled()
  })

  it('saveConversationToLocalStorage falls back to minimal payload when no feedback is present', () => {
    const originalSetItem = Storage.prototype.setItem
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    setItemSpy.mockImplementationOnce(() => {
      const err: any = new DOMException('quota', 'QuotaExceededError')
      throw err
    })
    setItemSpy.mockImplementation(function (key: string, value: string) {
      return originalSetItem.call(this, key, value)
    })

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const conversation = makeConversation({
      messages: [{ id: 'm1', role: 'user', content: 'hi' } as any],
    })

    const ok = saveConversationToLocalStorage(conversation)
    expect(ok).toBe(true)
    expect(warnSpy).toHaveBeenCalled()
  })

  it('saveConversationToLocalStorage treats DOMException code 1014 as a quota error (no feedback)', () => {
    const originalSetItem = Storage.prototype.setItem
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    setItemSpy.mockImplementationOnce(function () {
      const err = new DOMException('quota', 'Other')
      Object.defineProperty(err, 'code', { value: 1014 })
      throw err
    })
    setItemSpy.mockImplementation(function (key: string, value: string) {
      return originalSetItem.call(this, key, value)
    })

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const conversation = makeConversation({
      messages: [{ id: 'm1', role: 'user', content: 'hi' } as any],
    })

    const ok = saveConversationToLocalStorage(conversation)
    expect(ok).toBe(true)
    expect(warnSpy).toHaveBeenCalled()
  })

  it('saveConversationToLocalStorage logs when minimal quota fallback also fails', () => {
    const originalSetItem = Storage.prototype.setItem
    let selectedConversationWrites = 0
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (key: string, value: string) {
      if (key === 'selectedConversation') {
        selectedConversationWrites += 1
        if (selectedConversationWrites <= 2) {
          throw new DOMException('quota', 'QuotaExceededError')
        }
      }
      return originalSetItem.call(this, key, value)
    })

    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const conversation = makeConversation({
      messages: [{ id: 'm1', role: 'user', content: 'hi', feedback: { isPositive: true } } as any],
    })

    expect(saveConversationToLocalStorage(conversation)).toBe(true)
    expect(warnSpy).toHaveBeenCalled()
    expect(errSpy).toHaveBeenCalled()
  })

  it('saveConversationToLocalStorage logs when minimal quota fallback also fails without feedback', () => {
    const originalSetItem = Storage.prototype.setItem
    let selectedConversationWrites = 0
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (key: string, value: string) {
      if (key === 'selectedConversation') {
        selectedConversationWrites += 1
        if (selectedConversationWrites <= 2) {
          throw new DOMException('quota', 'QuotaExceededError')
        }
      }
      return originalSetItem.call(this, key, value)
    })

    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const conversation = makeConversation({
      messages: [{ id: 'm1', role: 'user', content: 'hi' } as any],
    })

    expect(saveConversationToLocalStorage(conversation)).toBe(true)
    expect(warnSpy).toHaveBeenCalled()
    expect(errSpy).toHaveBeenCalled()
  })

  it('saveConversationToLocalStorage logs non-quota errors from localStorage.setItem', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('boom')
    })
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const conversation = makeConversation({
      messages: [{ id: 'm1', role: 'user', content: 'hi', feedback: { isPositive: true } } as any],
    })

    expect(saveConversationToLocalStorage(conversation)).toBe(true)
    expect(errSpy).toHaveBeenCalled()
  })

  it('saveConversationToLocalStorage logs non-quota errors without feedback', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('boom')
    })
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const conversation = makeConversation({
      messages: [{ id: 'm1', role: 'user', content: 'hi' } as any],
    })

    expect(saveConversationToLocalStorage(conversation)).toBe(true)
    expect(errSpy).toHaveBeenCalled()
  })

  it('saveConversationToLocalStorage logs unexpected errors in the outer try/catch', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const messages: any = {
      length: 1,
      0: { id: 'm1', role: 'user', content: 'hi', feedback: { isPositive: true } },
      map: () => {
        throw new Error('boom')
      },
    }

    const conversation = makeConversation({ messages } as any)
    expect(saveConversationToLocalStorage(conversation)).toBe(false)
    expect(errSpy).toHaveBeenCalled()
  })

  it('saveConversationToServer posts a delta payload when message provided', async () => {
    const conversation = makeConversation({ userEmail: 'u@example.com' })
    const message = { id: 'm1', role: 'user', content: 'hi' } as any

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    )

    await expect(saveConversationToServer(conversation, 'CS101', message)).resolves.toEqual({ ok: true })
    const init = fetchSpy.mock.calls[0]?.[1] as any
    expect(JSON.parse(init.body)).toMatchObject({ course_name: 'CS101', delta: expect.any(Object) })
  })

  it('saveConversationToServer throws when the server responds non-ok', async () => {
    const conversation = makeConversation({ userEmail: 'u@example.com' })
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('nope', { status: 500 }))

    await expect(saveConversationToServer(conversation, 'CS101', null)).rejects.toThrow(
      /Failed to save conversation to server/,
    )
  })

  it('saveConversationToServer posts full conversation when forceFullPayload=true', async () => {
    const conversation = makeConversation({ userEmail: 'u@example.com' })

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    )

    await saveConversationToServer(conversation, 'CS101', null, { forceFullPayload: true })
    const init = fetchSpy.mock.calls[0]?.[1] as any
    expect(JSON.parse(init.body)).toMatchObject({ conversation: expect.any(Object) })
  })

  it('deleteConversationFromServer and deleteAllConversationsFromServer send DELETE requests', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('', { status: 200 }),
    )

    await deleteConversationFromServer('c1', 'CS101')
    await deleteAllConversationsFromServer('CS101')
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/conversation',
      expect.objectContaining({ method: 'DELETE' }),
    )
  })

  it('deleteConversationFromServer logs errors when response is non-ok', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('no', { status: 500 }))

    await deleteConversationFromServer('c1', 'CS101')
    expect(errSpy).toHaveBeenCalled()
  })

  it('deleteAllConversationsFromServer logs errors when fetch rejects', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('boom'))

    await deleteAllConversationsFromServer('CS101')
    expect(errSpy).toHaveBeenCalled()
  })

  it('deleteAllConversationsFromServer logs errors when response is non-ok', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('no', { status: 500 }))

    await deleteAllConversationsFromServer('CS101')
    expect(errSpy).toHaveBeenCalled()
  })

  it('fetchConversationHistory sorts messages by created_at and syncs selectedConversation', async () => {
    const unsorted = {
      id: 'c1',
      name: 'n',
      model: { id: 'm1' },
      prompt: '',
      temperature: 0.5,
      folderId: null,
      messages: [
        { id: 'b', role: 'user', content: '2', created_at: '2024-01-02T00:00:00Z' },
        { id: 'a', role: 'user', content: '1', created_at: '2024-01-01T00:00:00Z' },
      ],
    }

    localStorage.setItem('selectedConversation', JSON.stringify({ id: 'c1' }))

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ conversations: [unsorted], nextCursor: 1 }), { status: 200 }),
    )

    const result = await fetchConversationHistory('', 'CS101', 0)
    expect(result.nextCursor).toBe(1)
    expect(result.conversations[0]?.messages?.[0]?.id).toBe('a')
    expect(JSON.parse(localStorage.getItem('selectedConversation') || '{}').messages[0].id).toBe('a')
  })

  it('fetchConversationHistory returns empty response when server returns non-ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('no', { status: 500 }))

    const out = await fetchConversationHistory('', 'CS101', 0)
    expect(out).toEqual({ conversations: [], nextCursor: null })
  })

  it('fetchConversationHistory does not sync selectedConversation when not found', async () => {
    localStorage.setItem('selectedConversation', JSON.stringify({ id: 'missing' }))
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ conversations: [makeConversation()], nextCursor: null }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    await fetchConversationHistory('', 'CS101', 0)
    expect(JSON.parse(localStorage.getItem('selectedConversation') || '{}').id).toBe('missing')
  })

  it('fetchLastConversation returns null when no conversations exist', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ conversations: [] }), { status: 200 }),
    )

    await expect(fetchLastConversation('CS101')).resolves.toBeNull()
  })

  it('fetchLastConversation returns the first conversation on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ conversations: [makeConversation({ id: 'c-first' })] }), { status: 200 }),
    )

    await expect(fetchLastConversation('CS101')).resolves.toMatchObject({ id: 'c-first' })
  })

  it('fetchLastConversation returns null when response is non-ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('no', { status: 500 }))
    await expect(fetchLastConversation('CS101')).resolves.toBeNull()
  })

  it('saveConversations writes to localStorage', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    saveConversations([makeConversation()])
    expect(localStorage.getItem('conversationHistory')).toContain('c1')
    errSpy.mockRestore()
  })

  it('saveConversations logs when localStorage.setItem throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('boom')
    })
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    saveConversations([makeConversation()])
    expect(errSpy).toHaveBeenCalled()
  })

  it('createLogConversationPayload falls back when earliestEditedMessageId is not found', () => {
    const conversation = makeConversation({
      messages: [{ id: 'm1', role: 'user', content: 'hi' } as any],
    })

    const payload = createLogConversationPayload('CS101', conversation, conversation.messages[0] as any, 'missing')
    expect((payload as any).delta.messagesDelta).toEqual([conversation.messages[0]])
  })
})
