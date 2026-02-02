import { describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => {
  const selectLimit = vi.fn()
  const selectWhere = vi.fn(() => ({ limit: selectLimit }))
  const selectFrom = vi.fn(() => ({ where: selectWhere }))
  const select = vi.fn(() => ({ from: selectFrom }))

  const insertOnConflictDoUpdate = vi.fn().mockResolvedValue(undefined)
  const insertValues = vi.fn(() => ({ onConflictDoUpdate: insertOnConflictDoUpdate }))
  const insert = vi.fn(() => ({ values: insertValues }))

  return {
    db: { select, insert },
    llmConvoMonitor: { convo_id: {}, convo: {} },
    selectLimit,
    insertValues,
    insertOnConflictDoUpdate,
  }
})

vi.mock('~/pages/api/authorization', () => ({
  withCourseAccessFromRequest: () => (h: any) => h,
}))

vi.mock('~/db/dbClient', () => ({
  db: hoisted.db,
}))

vi.mock('~/db/schema', () => ({
  llmConvoMonitor: hoisted.llmConvoMonitor,
}))

vi.mock('drizzle-orm', () => ({
  eq: () => ({}),
}))

vi.mock('~/utils/apiUtils', () => ({
  getBackendUrl: () => 'http://backend',
}))

vi.mock('@/utils/sanitization', () => ({
  sanitizeForLogging: (v: any) => v,
}))

const runTreeInstances: any[] = []
vi.mock('langsmith', () => ({
  RunTree: class {
    args: any
    constructor(args: any) {
      this.args = args
      runTreeInstances.push(this)
    }
    end = vi.fn()
    postRun = vi.fn(async () => undefined)
  },
}))

import handler from '~/pages/api/UIUC-api/logConversation'

describe('UIUC-api/logConversation', () => {
  it('returns 400 for missing course_name or missing payload', async () => {
    const res1 = createMockRes()
    await handler(
      createMockReq({ method: 'POST', body: {} }) as any,
      res1 as any,
    )
    expect(res1.status).toHaveBeenCalledWith(400)

    const res2 = createMockRes()
    await handler(
      createMockReq({ method: 'POST', body: { course_name: 'CS101' } }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(400)
  })

  it('logs a full conversation and returns 200', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('ok', { status: 200 }))

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: {
          course_name: 'CS101',
          conversation: {
            id: 'c1',
            name: 'n',
            model: { id: 'gpt-4o', name: 'GPT-4o' },
            prompt: 'p',
            temperature: 0.2,
            userEmail: 'u@example.com',
            projectName: 'CS101',
            messages: [
              {
                id: 'm1',
                role: 'user',
                content: [{ type: 'text', text: 'hi' }],
                latestSystemMessage: 'sys',
                finalPromtEngineeredMessage: 'final',
              },
              { id: 'm2', role: 'assistant', content: [{ type: 'text', text: 'ok' }] },
            ],
          },
        },
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(200)
    expect(hoisted.insertValues).toHaveBeenCalled()
    expect(fetchSpy).toHaveBeenCalledWith(
      'http://backend/llm-monitor-message',
      expect.any(Object),
    )
    expect(runTreeInstances.length).toBeGreaterThan(0)
    fetchSpy.mockRestore()
  })

  it('merges delta with existing conversation (including edit truncation)', async () => {
    hoisted.selectLimit.mockResolvedValueOnce([
      {
        convo: {
          id: 'c1',
          name: 'n',
          model: { id: 'gpt-4o', name: 'GPT-4o' },
          prompt: 'p',
          temperature: 0.2,
          userEmail: 'u@example.com',
          projectName: 'CS101',
          messages: [
            { id: 'a', role: 'user', content: 'old-1' },
            { id: 'b', role: 'assistant', content: 'old-2' },
            { id: 'c', role: 'user', content: 'old-3' },
          ],
        },
      },
    ])

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('ok', { status: 200 }))

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: {
          course_name: 'CS101',
          delta: {
            conversation: {
              id: 'c1',
              name: 'n',
              modelId: 'gpt-4o',
              prompt: 'p',
              temperature: 0.2,
              userEmail: 'u@example.com',
              projectName: 'CS101',
              folderId: null,
            },
            messagesDelta: [
              { id: 'c', role: 'user', content: 'replacement' },
              { id: 'd', role: 'assistant', content: 'new' },
            ],
            earliestEditedMessageId: 'c',
          },
        },
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(200)
    const insertArg = hoisted.insertValues.mock.calls.at(-1)?.[0] as any
    expect(insertArg?.convo?.messages?.map((m: any) => m.id)).toEqual([
      'a',
      'b',
      'c',
      'd',
    ])
    fetchSpy.mockRestore()
  })
})
