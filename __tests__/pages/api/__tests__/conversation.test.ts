/* @vitest-environment node */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { v4 as uuidv4 } from 'uuid'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => {
  const insertOnConflictDoUpdate = vi.fn().mockResolvedValue(undefined)
  const insertValues = vi.fn(() => ({ onConflictDoUpdate: insertOnConflictDoUpdate }))
  const insert = vi.fn(() => ({ values: insertValues }))

  const selectWhere = vi.fn()
  const selectFrom = vi.fn(() => ({ where: selectWhere }))
  const select = vi.fn(() => ({ from: selectFrom }))

  const deleteReturning = vi.fn()
  const deleteWhere = vi.fn(() => ({ returning: deleteReturning }))
  const del = vi.fn(() => ({ where: deleteWhere }))

  const execute = vi.fn()

  const messages = {
    id: { name: 'id' },
    conversation_id: { name: 'conversation_id' },
    created_at: { name: 'created_at' },
  }
  const conversations = {
    id: { name: 'id' },
    user_email: { name: 'user_email' },
    project_name: { name: 'project_name' },
    folder_id: { name: 'folder_id' },
  }

  return {
    db: { insert, select, delete: del, execute },
    messages,
    conversations,
    insert,
    insertValues,
    insertOnConflictDoUpdate,
    selectWhere,
    deleteWhere,
    deleteReturning,
    execute,
  }
})

vi.mock('~/pages/api/authorization', () => ({
  withCourseAccessFromRequest: () => (h: any) => h,
}))

vi.mock('~/db/dbClient', () => ({
  db: hoisted.db,
  messages: hoisted.messages,
  conversations: hoisted.conversations,
}))

vi.mock('drizzle-orm', () => ({
  inArray: () => ({}),
  eq: () => ({}),
  and: () => ({}),
  isNull: () => ({}),
  gt: () => ({}),
  sql: (strings: any, ...values: any[]) => ({ strings, values }),
}))

import handler, {
  convertChatToDBConversation,
  convertChatToDBMessage,
  convertDBToChatConversation,
  persistMessageServer,
} from '~/pages/api/conversation'

describe('conversation API', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('convertChatToDBMessage handles string content', () => {
    const id = uuidv4()
    const out = convertChatToDBMessage(
      { id, role: 'user', content: 'hello' } as any,
      'conv-1',
    )
    expect(out.id).toBe(id)
    expect(out.content_text).toContain('hello')
  })

  it('convertChatToDBMessage handles array content, image urls, and context indices', () => {
    const out = convertChatToDBMessage(
      {
        id: uuidv4(),
        role: 'user',
        content: [
          { type: 'text', text: 'Image description: a cat' },
          { type: 'text', text: 'hello' },
          { type: 'image_url', image_url: { url: 'http://img' } },
        ],
        contexts: [
          { readable_filename: 'f', pagenumber: '1', s3_path: 's3://x', text: 't' },
          { readable_filename: 'u', pagenumber: '2', url: 'http://x', text: 't2' },
          { readable_filename: 'n', pagenumber: '3', text: 't3' },
        ],
        tools: [{ id: 't1' }],
        latestSystemMessage: 'sys',
        finalPromtEngineeredMessage: 'final',
        feedback: { isPositive: true, category: 'c', details: 'd' },
        wasQueryRewritten: true,
        queryRewriteText: 'rw',
      } as any,
      'conv-1',
    )

    expect(out.image_description).toBe('a cat')
    expect(out.content_image_url).toEqual(['http://img'])
    expect(out.contexts?.[0]?.chunk_index).toContain('s3://x_0')
    expect(out.contexts?.[1]?.url_chunk_index).toContain('http://x_1')
    expect(out.tools).toEqual([{ id: 't1' }])
    expect(out.latest_system_message).toContain('sys')
    expect(out.final_prompt_engineered_message).toContain('final')
  })

  it('convertChatToDBMessage wraps a single context object into an array', () => {
    const out = convertChatToDBMessage(
      {
        id: uuidv4(),
        role: 'user',
        content: 'hi',
        contexts: { readable_filename: 'f', pagenumber: '1', s3_path: 's3://x', text: 't' },
      } as any,
      'conv-1',
    )
    expect(Array.isArray(out.contexts)).toBe(true)
    expect(out.contexts?.[0]?.chunk_index).toContain('s3://x_0')
  })

  it('convertChatToDBMessage truncates long context text and defaults missing text', () => {
    const out = convertChatToDBMessage(
      {
        id: uuidv4(),
        role: 'user',
        content: 'hi',
        contexts: [
          {
            readable_filename: 'f',
            pagenumber: '1',
            s3_path: 's3://x',
            text: 'a'.repeat(200),
          },
          {
            readable_filename: 'u',
            pagenumber: '2',
            url: 'http://x',
          },
        ],
      } as any,
      'conv-1',
    )

    expect(out.contexts?.[0]?.text).toMatch(/\.\.\.$/)
    expect(out.contexts?.[0]?.text?.length).toBeGreaterThan(100)
    expect(out.contexts?.[1]?.text).toBe('')
  })

  it('convertDBToChatConversation sorts messages and preserves feedback and contexts', () => {
    const conv = convertDBToChatConversation(
      {
        id: 'c1',
        name: 'Conversation',
        model: 'gpt-4o',
        prompt: '',
        temperature: 0.1,
        user_email: 'u@example.com',
        project_name: 'CS101',
        folder_id: null,
        created_at: new Date('2024-01-01T00:00:00Z').toISOString(),
        updated_at: new Date('2024-01-02T00:00:00Z').toISOString(),
      } as any,
      [
        {
          id: uuidv4(),
          role: 'assistant',
          content_text: 'later',
          image_description: 'a cat',
          content_image_url: ['http://img'],
          contexts: [{ id: 1, pagenumber: null, pagenumber_or_timestamp: null } as any],
          tools: null,
          latest_system_message: 'sys',
          final_prompt_engineered_message: 'final',
          response_time_sec: 1,
          created_at: new Date('2024-01-02T00:00:00Z').toISOString(),
          feedback: {
            feedback_is_positive: true,
            feedback_category: 'c',
            feedback_details: 'd',
          },
        },
        {
          id: uuidv4(),
          role: 'user',
          content_text: 'earlier',
          content_image_url: [],
          contexts: [],
          tools: [],
          created_at: new Date('2024-01-01T00:00:00Z').toISOString(),
        },
      ] as any,
    )

    expect(conv.messages[0]?.role).toBe('user')
    const assistant = conv.messages[1] as any
    expect(assistant.feedback).toMatchObject({ isPositive: true, category: 'c', details: 'd' })
    expect(assistant.content).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'text' }),
        expect.objectContaining({ type: 'image_url' }),
      ]),
    )
    expect(assistant.contexts?.[0]?.pagenumber).toBe('')
  })

  it('convertDBToChatConversation warns when first message is missing metadata', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    convertDBToChatConversation(
      {
        id: 'c1',
        name: 'Conversation',
        model: 'gpt-4o',
        prompt: '',
        temperature: 0.1,
        user_email: 'u@example.com',
        project_name: 'CS101',
        folder_id: null,
        created_at: null,
        updated_at: null,
      } as any,
      [
        {
          id: uuidv4(),
          role: 'user',
          content_text: 'hi',
          content_image_url: [],
          contexts: [],
          tools: [],
          created_at: null,
        },
      ] as any,
    )

    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('convertChatToDBConversation fills created_at when missing', () => {
    const out = convertChatToDBConversation({
      id: 'c1',
      name: 'n',
      model: { id: 'gpt-4o' },
      prompt: '',
      temperature: 0.1,
      messages: [],
    } as any)
    expect(out.created_at).toBeTruthy()
    expect(out.updated_at).toBeTruthy()
  })

  it('persistMessageServer throws when userIdentifier is missing', async () => {
    await expect(
      persistMessageServer({
        conversation: { id: 'c1', name: 'n', model: { id: 'gpt-4o' } } as any,
        message: { id: uuidv4(), role: 'user', content: 'hi' } as any,
        courseName: 'CS101',
        userIdentifier: ' ',
      }),
    ).rejects.toThrow(/User identifier is required/)
  })

  it('persistMessageServer upserts conversation and deletes subsequent messages on edits', async () => {
    const messageId = uuidv4()
    hoisted.selectWhere.mockResolvedValueOnce([
      {
        id: messageId,
        content_text: 'old',
        contexts: [],
        tools: [],
        latest_system_message: null,
        final_prompt_engineered_message: null,
        created_at: new Date('2024-01-01T00:00:00Z'),
      },
    ])

    await persistMessageServer({
      conversation: {
        id: 'c1',
        name: 'n',
        model: { id: 'gpt-4o' },
        prompt: '',
        temperature: 0.1,
        folderId: 'not-a-uuid',
      } as any,
      message: { id: messageId, role: 'user', content: 'new' } as any,
      courseName: 'CS101',
      userIdentifier: 'u@example.com',
    })

    expect(hoisted.db.insert).toHaveBeenCalled()
    expect(hoisted.db.delete).toHaveBeenCalled()
  })

  it('POST (delta) returns 400 when user identifier is missing', async () => {
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: {
          delta: {
            conversation: { id: 'c1', name: 'Conversation', modelId: 'gpt-4o', prompt: '', temperature: 0.1 },
            messagesDelta: [{ id: uuidv4(), role: 'user', content: 'hi' }],
          },
        },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('POST (delta) saves conversation + messages and returns 200', async () => {
    hoisted.selectWhere.mockResolvedValueOnce([])

    const messageId = uuidv4()
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        user: { email: 'u@example.com' },
        body: {
          delta: {
            conversation: {
              id: 'c1',
              name: 'Conversation',
              modelId: 'gpt-4o',
              prompt: '',
              temperature: 0.1,
              projectName: 'CS101',
              folderId: null,
              userEmail: 'u@example.com',
            },
            messagesDelta: [{ id: messageId, role: 'user', content: 'hi' }],
          },
        },
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(200)
    expect(hoisted.insert).toHaveBeenCalled()
  })

  it('POST (delta) saves multiple messages and sorts them by created_at', async () => {
    hoisted.selectWhere.mockResolvedValueOnce([])

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        user: { email: 'u@example.com' },
        body: {
          delta: {
            conversation: {
              id: 'c1',
              name: 'Conversation',
              modelId: 'gpt-4o',
              prompt: '',
              temperature: 0.1,
              projectName: 'CS101',
              folderId: null,
              userEmail: 'u@example.com',
            },
            messagesDelta: [
              { id: uuidv4(), role: 'user', content: 'first' },
              { id: uuidv4(), role: 'assistant', content: 'second' },
            ],
          },
        },
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('POST (delta) returns 500 when conversation upsert fails', async () => {
    hoisted.insertOnConflictDoUpdate.mockRejectedValueOnce(new Error('boom'))

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        user: { email: 'u@example.com' },
        body: {
          delta: {
            conversation: {
              id: 'c1',
              name: 'Conversation',
              modelId: 'gpt-4o',
              prompt: '',
              temperature: 0.1,
              projectName: 'CS101',
              folderId: null,
              userEmail: 'u@example.com',
            },
            messagesDelta: [{ id: uuidv4(), role: 'user', content: 'hi' }],
          },
        },
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('POST (delta) deletes subsequent messages when edits are detected', async () => {
    const messageId = uuidv4()
    hoisted.selectWhere.mockResolvedValueOnce([
      {
        id: messageId,
        content_text: 'old',
        contexts: [],
        created_at: new Date('2024-01-01T00:00:00Z'),
      },
    ])

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        user: { email: 'u@example.com' },
        body: {
          delta: {
            conversation: {
              id: 'c1',
              name: 'Conversation',
              modelId: 'gpt-4o',
              prompt: '',
              temperature: 0.1,
              projectName: 'CS101',
              folderId: null,
              userEmail: 'u@example.com',
            },
            messagesDelta: [{ id: messageId, role: 'user', content: 'new' }],
          },
        },
      }) as any,
      res as any,
    )

    expect(hoisted.deleteWhere).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('POST (delta) returns 500 when a message id is not a UUID', async () => {
    hoisted.selectWhere.mockResolvedValueOnce([])

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        user: { email: 'u@example.com' },
        body: {
          delta: {
            conversation: {
              id: 'c1',
              name: 'Conversation',
              modelId: 'gpt-4o',
              prompt: '',
              temperature: 0.1,
              projectName: 'CS101',
              folderId: null,
              userEmail: 'u@example.com',
            },
            messagesDelta: [{ id: 'not-a-uuid', role: 'user', content: 'hi' }],
          },
        },
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('POST (legacy) returns 400 when conversation is missing', async () => {
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        user: { email: 'u@example.com' },
        body: {},
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('POST (legacy) returns 200 when there are no messages to save', async () => {
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        user: { email: 'u@example.com' },
        body: {
          conversation: {
            id: 'c1',
            name: 'Conversation',
            model: { id: 'gpt-4o' },
            prompt: '',
            temperature: 0.1,
            folderId: null,
            projectName: 'CS101',
            messages: [],
          },
        },
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'No messages to save' })
  })

  it('POST (legacy) returns 500 when a message id is not a UUID', async () => {
    hoisted.selectWhere.mockResolvedValueOnce([])
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        user: { email: 'u@example.com' },
        body: {
          conversation: {
            id: 'c1',
            name: 'Conversation',
            model: { id: 'gpt-4o' },
            prompt: '',
            temperature: 0.1,
            folderId: null,
            projectName: 'CS101',
            messages: [{ id: 'not-a-uuid', role: 'user', content: 'hi' }],
          },
        },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('POST (legacy) saves conversation + messages and deletes subsequent messages when edited', async () => {
    const editedId = uuidv4()
    hoisted.selectWhere.mockResolvedValueOnce([
      {
        id: editedId,
        role: 'user',
        content_text: 'old',
        content_image_url: [],
        contexts: [],
        tools: [],
        created_at: new Date('2024-01-01T00:00:00Z').toISOString(),
      },
    ])

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        user: { email: 'u@example.com' },
        body: {
          conversation: {
            id: 'c1',
            name: 'Conversation',
            model: { id: 'gpt-4o' },
            prompt: '',
            temperature: 0.1,
            folderId: uuidv4(),
            projectName: 'CS101',
            messages: [
              { id: editedId, role: 'user', content: 'new' },
              { id: uuidv4(), role: 'assistant', content: 'ok' },
            ],
          },
        },
      }) as any,
      res as any,
    )

    expect(hoisted.db.delete).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('GET returns 400 when query params are invalid', async () => {
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        user: { email: 'u@example.com' },
        query: { courseName: 'CS101' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('GET returns conversation history and nextCursor', async () => {
    hoisted.execute.mockResolvedValueOnce([
      {
        search_conversations_v3: JSON.stringify({
          conversations: [
            {
              id: 'c1',
              name: 'Conversation',
              model: 'gpt-4o',
              prompt: '',
              temperature: 0.1,
              user_email: 'u@example.com',
              project_name: 'CS101',
              folder_id: null,
              created_at: new Date('2024-01-01T00:00:00Z').toISOString(),
              updated_at: new Date('2024-01-02T00:00:00Z').toISOString(),
              messages: [
                {
                  id: uuidv4(),
                  role: 'user',
                  content_text: 'hi',
                  content_image_url: [],
                  contexts: [],
                  tools: [],
                  created_at: new Date('2024-01-01T00:00:00Z').toISOString(),
                },
              ],
            },
          ],
          total_count: 100,
        }),
      },
    ])

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        user: { email: 'u@example.com' },
        query: { searchTerm: '', courseName: 'CS101', pageParam: '0' },
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(200)
    const body = (res.json as any).mock.calls[0]?.[0]
    expect(body.nextCursor).toBe(1)
    expect(body.conversations[0]?.id).toBe('c1')
  })

  it('GET handles non-string SQL results and returns 200', async () => {
    hoisted.execute.mockResolvedValueOnce([
      {
        search_conversations_v3: {
          conversations: [],
          total_count: 0,
        },
      },
    ])

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        user: { email: 'u@example.com' },
        query: { searchTerm: '', courseName: 'CS101', pageParam: '0' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('GET returns 500 when db.execute throws', async () => {
    hoisted.execute.mockRejectedValueOnce(new Error('boom'))
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        user: { email: 'u@example.com' },
        query: { searchTerm: '', courseName: 'CS101', pageParam: '0' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('DELETE returns 403 when nothing was deleted', async () => {
    hoisted.deleteReturning.mockResolvedValueOnce([])

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'DELETE',
        user: { email: 'u@example.com' },
        body: { id: 'c1' },
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('DELETE returns 200 when a single conversation is deleted', async () => {
    hoisted.deleteReturning.mockResolvedValueOnce([{ id: 'c1' }])

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'DELETE',
        user: { email: 'u@example.com' },
        body: { id: 'c1' },
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('DELETE returns 200 when deleting all conversations for a course', async () => {
    hoisted.deleteReturning.mockResolvedValueOnce([{ id: 'c1' }])
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'DELETE',
        user: { email: 'u@example.com' },
        body: { course_name: 'CS101' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('DELETE returns 403 when deleting all conversations but nothing was deleted', async () => {
    hoisted.deleteReturning.mockResolvedValueOnce([])

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'DELETE',
        user: { email: 'u@example.com' },
        body: { course_name: 'CS101' },
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('DELETE returns 400 when request parameters are invalid', async () => {
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'DELETE',
        user: { email: 'u@example.com' },
        body: {},
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 405 for unsupported methods', async () => {
    const res = createMockRes()
    await handler(
      createMockReq({ method: 'PUT', user: { email: 'u@example.com' } }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(405)
  })
})
