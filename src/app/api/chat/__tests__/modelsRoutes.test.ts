import { describe, expect, it, vi } from 'vitest'

vi.mock('~/app/api/authorization', () => ({
  withCourseAccessFromRequest: () => (h: any) => h,
}))

import { GET as geminiGET } from '../gemini/route'
import { GET as bedrockGET } from '../bedrock/route'
import { GET as sambanovaGET } from '../sambanova/route'

describe('app/api/chat/* model list routes', () => {
  it('gemini GET returns 500 when missing key and 200 when present', async () => {
    const prev = process.env.GEMINI_API_KEY
    delete process.env.GEMINI_API_KEY
    const r1 = await geminiGET(new Request('http://localhost') as any)
    expect(r1.status).toBe(500)

    process.env.GEMINI_API_KEY = 'k'
    const r2 = await geminiGET(new Request('http://localhost') as any)
    expect(r2.status).toBe(200)
    const body = await r2.json()
    expect(body.provider).toBeTruthy()
    expect(Array.isArray(body.models)).toBe(true)
    process.env.GEMINI_API_KEY = prev
  })

  it('bedrock GET returns 500 when missing creds and 200 when present', async () => {
    const prevId = process.env.AWS_ACCESS_KEY_ID
    const prevSecret = process.env.AWS_SECRET_ACCESS_KEY
    const prevRegion = process.env.AWS_REGION

    delete process.env.AWS_ACCESS_KEY_ID
    delete process.env.AWS_SECRET_ACCESS_KEY
    delete process.env.AWS_REGION
    const r1 = await bedrockGET(new Request('http://localhost') as any)
    expect(r1.status).toBe(500)

    process.env.AWS_ACCESS_KEY_ID = 'id'
    process.env.AWS_SECRET_ACCESS_KEY = 'secret'
    process.env.AWS_REGION = 'us-east-1'
    const r2 = await bedrockGET(new Request('http://localhost') as any)
    expect(r2.status).toBe(200)
    const body = await r2.json()
    expect(body.provider).toBeTruthy()
    expect(Array.isArray(body.models)).toBe(true)

    process.env.AWS_ACCESS_KEY_ID = prevId
    process.env.AWS_SECRET_ACCESS_KEY = prevSecret
    process.env.AWS_REGION = prevRegion
  })

  it('sambanova GET returns provider and models', async () => {
    const r = await sambanovaGET(new Request('http://localhost') as any)
    expect(r.status).toBe(200)
    const body = await r.json()
    expect(body.provider).toBeTruthy()
    expect(Array.isArray(body.models)).toBe(true)
  })
})
