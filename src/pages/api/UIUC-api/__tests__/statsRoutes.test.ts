import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

vi.mock('~/pages/api/authorization', () => ({
  withCourseOwnerOrAdminAccess: () => (h: any) => h,
}))

vi.mock('~/utils/apiUtils', () => ({
  getBackendUrl: () => 'http://backend',
}))

import getProjectStatsHandler, {
  getProjectStats,
} from '../getProjectStats'
import getModelUsageCountsHandler, {
  getModelUsageCounts,
} from '../getModelUsageCounts'
import getWeeklyTrendsHandler, { getWeeklyTrends } from '../getWeeklyTrends'
import getConversationStatsHandler, {
  getConversationStats,
} from '../getConversationStats'

describe('UIUC-api stats routes', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('handlers validate required params', async () => {
    const res1 = createMockRes()
    await getProjectStatsHandler(
      createMockReq({ method: 'POST', body: {} }) as any,
      res1 as any,
    )
    expect(res1.status).toHaveBeenCalledWith(400)

    const res2 = createMockRes()
    await getModelUsageCountsHandler(
      createMockReq({ method: 'POST', body: {} }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(400)

    const res3 = createMockRes()
    await getWeeklyTrendsHandler(
      createMockReq({ method: 'POST', body: {} }) as any,
      res3 as any,
    )
    expect(res3.status).toHaveBeenCalledWith(400)

    const res4 = createMockRes()
    await getConversationStatsHandler(
      createMockReq({ method: 'POST', body: {} }) as any,
      res4 as any,
    )
    expect(res4.status).toHaveBeenCalledWith(400)
  })

  it('handlers propagate backend errors', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('bad', { status: 500 }))

    const res1 = createMockRes()
    await getProjectStatsHandler(
      createMockReq({ method: 'POST', body: { project_name: 'CS101' } }) as any,
      res1 as any,
    )
    expect(res1.status).toHaveBeenCalledWith(500)

    const res2 = createMockRes()
    await getModelUsageCountsHandler(
      createMockReq({ method: 'POST', body: { project_name: 'CS101' } }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(500)

    const res3 = createMockRes()
    await getWeeklyTrendsHandler(
      createMockReq({ method: 'POST', body: { project_name: 'CS101' } }) as any,
      res3 as any,
    )
    expect(res3.status).toHaveBeenCalledWith(500)

    const res4 = createMockRes()
    await getConversationStatsHandler(
      createMockReq({ method: 'POST', body: { course_name: 'CS101' } }) as any,
      res4 as any,
    )
    expect(res4.status).toHaveBeenCalledWith(500)

    fetchSpy.mockRestore()
  })

  it('handlers return data on success', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: any) => {
      const url = typeof input === 'string' ? input : input?.url ?? String(input)
      if (String(url).includes('getModelUsageCounts')) {
        return new Response(JSON.stringify([{ model_name: 'gpt', count: 1, percentage: 100 }]), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      }
      if (String(url).includes('getWeeklyTrends')) {
        return new Response(
          JSON.stringify([
            {
              current_week_value: 2,
              metric_name: 'messages',
              percentage_change: 100,
              previous_week_value: 1,
            },
          ]),
          { status: 200, headers: { 'content-type': 'application/json' } },
        )
      }
      if (String(url).includes('getConversationStats')) {
        return new Response(JSON.stringify({ points: [] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      }
      if (String(url).includes('getProjectStats')) {
        return new Response(
          JSON.stringify({
            total_conversations: 10,
            total_messages: 30,
            unique_users: 5,
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        )
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    })

    const res1 = createMockRes()
    await getProjectStatsHandler(
      createMockReq({ method: 'POST', body: { project_name: 'CS101' } }) as any,
      res1 as any,
    )
    expect(res1.status).toHaveBeenCalledWith(200)

    const res2 = createMockRes()
    await getModelUsageCountsHandler(
      createMockReq({ method: 'POST', body: { project_name: 'CS101' } }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(200)

    const res3 = createMockRes()
    await getWeeklyTrendsHandler(
      createMockReq({ method: 'POST', body: { project_name: 'CS101' } }) as any,
      res3 as any,
    )
    expect(res3.status).toHaveBeenCalledWith(200)

    const res4 = createMockRes()
    await getConversationStatsHandler(
      createMockReq({ method: 'POST', body: { course_name: 'CS101' } }) as any,
      res4 as any,
    )
    expect(res4.status).toHaveBeenCalledWith(200)

    fetchSpy.mockRestore()
  })

  it('handlers return 500 when fetch throws', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new Error('boom'))

    const res = createMockRes()
    await getProjectStatsHandler(
      createMockReq({ method: 'POST', body: { project_name: 'CS101' } }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(500)

    fetchSpy.mockRestore()
  })

  it('client helpers return defaults on non-ok and compute derived fields on ok', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    fetchSpy.mockResolvedValueOnce(new Response('nope', { status: 500 }))
    const p1 = await getProjectStats('CS101')
    expect(p1.status).toBe(500)

    fetchSpy.mockResolvedValueOnce(new Response('nope', { status: 500 }))
    const m1 = await getModelUsageCounts('CS101')
    expect(m1.status).toBe(500)

    fetchSpy.mockResolvedValueOnce(new Response('nope', { status: 500 }))
    const w1 = await getWeeklyTrends('CS101')
    expect(w1.status).toBe(500)

    fetchSpy.mockResolvedValueOnce(new Response('nope', { status: 500 }))
    await expect(getConversationStats('CS101')).rejects.toThrow()

    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          total_conversations: 10,
          total_messages: 30,
          unique_users: 5,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )
    const p2 = await getProjectStats('CS101')
    expect(p2.status).toBe(200)
    expect(p2.data.avg_conversations_per_user).toBe(2)
    expect(p2.data.avg_messages_per_conversation).toBe(3)

    fetchSpy.mockRestore()
  })

  it('client helpers return data on success and handle thrown errors', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify([{ model_name: 'gpt', count: 1, percentage: 100 }]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    const m2 = await getModelUsageCounts('CS101')
    expect(m2.status).toBe(200)
    expect(m2.data[0]?.model_name).toBe('gpt')

    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          {
            current_week_value: 2,
            metric_name: 'messages',
            percentage_change: 100,
            previous_week_value: 1,
          },
        ]),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )
    const w2 = await getWeeklyTrends('CS101')
    expect(w2.status).toBe(200)
    expect(w2.data[0]?.metric_name).toBe('messages')

    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          total_conversations: 0,
          total_messages: 0,
          unique_users: 0,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )
    const p3 = await getProjectStats('CS101')
    expect(p3.status).toBe(200)
    expect(p3.data.avg_conversations_per_user).toBe(0)
    expect(p3.data.avg_messages_per_conversation).toBe(0)

    fetchSpy.mockRejectedValueOnce(new Error('boom'))
    const m3 = await getModelUsageCounts('CS101')
    expect(m3.status).toBe(500)

    fetchSpy.mockRejectedValueOnce(new Error('boom'))
    const w3 = await getWeeklyTrends('CS101')
    expect(w3.status).toBe(500)

    fetchSpy.mockRejectedValueOnce(new Error('boom'))
    const p4 = await getProjectStats('CS101')
    expect(p4.status).toBe(500)

    fetchSpy.mockRestore()
  })
})
