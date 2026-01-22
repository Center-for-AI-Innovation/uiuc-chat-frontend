import type { NextApiRequest, NextApiResponse } from 'next'
import { vi } from 'vitest'

export type MockNextApiRequest = Partial<NextApiRequest> & {
  method?: string
  query?: Record<string, any>
  body?: any
  headers?: Record<string, any>
  user?: any
}

export function createMockReq(overrides: MockNextApiRequest = {}) {
  return {
    method: 'GET',
    query: {},
    body: undefined,
    headers: {},
    ...overrides,
  } as any
}

export function createMockRes() {
  const res: Partial<NextApiResponse> & {
    status: ReturnType<typeof vi.fn>
    json: ReturnType<typeof vi.fn>
    send: ReturnType<typeof vi.fn>
    end: ReturnType<typeof vi.fn>
    setHeader: ReturnType<typeof vi.fn>
  } = {}

  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  res.send = vi.fn().mockReturnValue(res)
  res.end = vi.fn().mockReturnValue(res)
  res.setHeader = vi.fn().mockReturnValue(res)

  return res as any
}

