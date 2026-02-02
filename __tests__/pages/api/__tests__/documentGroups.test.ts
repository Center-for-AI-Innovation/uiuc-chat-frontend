/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => ({
  addDocumentsToDocGroup: vi.fn(),
  fetchDocumentGroups: vi.fn(),
  fetchEnabledDocGroups: vi.fn(),
  removeDocGroup: vi.fn(),
  updateDocGroupStatus: vi.fn(),
  addDocumentsToDocGroupQdrant: vi.fn(),
  capture: vi.fn(),
}))

vi.mock('~/pages/api/authorization', () => ({
  withCourseAccessFromRequest: () => (h: any) => h,
}))

vi.mock('posthog-js', () => ({
  default: { capture: hoisted.capture },
}))

vi.mock('~/db/dbHelpers', () => ({
  addDocumentsToDocGroup: hoisted.addDocumentsToDocGroup,
  fetchDocumentGroups: hoisted.fetchDocumentGroups,
  fetchEnabledDocGroups: hoisted.fetchEnabledDocGroups,
  removeDocGroup: hoisted.removeDocGroup,
  updateDocGroupStatus: hoisted.updateDocGroupStatus,
}))

vi.mock('~/utils/qdrantUtils', () => ({
  addDocumentsToDocGroupQdrant: hoisted.addDocumentsToDocGroupQdrant,
}))

import handler from '~/pages/api/documentGroups'

describe('documentGroups API', () => {
  it('rejects non-POST methods', async () => {
    const res = createMockRes()
    await handler(createMockReq({ method: 'GET' }) as any, res as any)
    expect(res.status).toHaveBeenCalledWith(405)
  })

  it('handles addDocumentsToDocGroup success', async () => {
    hoisted.addDocumentsToDocGroup.mockResolvedValueOnce(true)
    hoisted.addDocumentsToDocGroupQdrant.mockResolvedValueOnce({ status: 'completed' })

    const doc: any = { readable_filename: 'f', url: '', s3_path: 's3', doc_groups: ['a'] }
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: { action: 'addDocumentsToDocGroup', courseName: 'CS101', doc, userId: 'u' },
        headers: {},
        socket: { remoteAddress: '127.0.0.1' } as any,
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ success: true })
  })

  it('rolls back SQL when Qdrant update fails in addDocumentsToDocGroup', async () => {
    hoisted.addDocumentsToDocGroup.mockResolvedValueOnce(true)
    hoisted.addDocumentsToDocGroupQdrant.mockResolvedValueOnce({ status: 'failed' })

    const doc: any = { readable_filename: 'f', url: '', s3_path: 's3', doc_groups: ['a'] }
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: { action: 'addDocumentsToDocGroup', courseName: 'CS101', doc, docGroup: 'a' },
        headers: {},
        socket: { remoteAddress: '127.0.0.1' } as any,
      }) as any,
      res as any,
    )

    expect(hoisted.removeDocGroup).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('returns 500 when SQL update fails in addDocumentsToDocGroup', async () => {
    hoisted.addDocumentsToDocGroup.mockResolvedValueOnce(false)
    const doc: any = { readable_filename: 'f', url: '', s3_path: 's3', doc_groups: ['a'] }
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: { action: 'addDocumentsToDocGroup', courseName: 'CS101', doc },
        headers: {},
        socket: { remoteAddress: '127.0.0.1' } as any,
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('handles appendDocGroup and initializes doc_groups when missing', async () => {
    hoisted.addDocumentsToDocGroup.mockResolvedValueOnce(true)
    hoisted.addDocumentsToDocGroupQdrant.mockResolvedValueOnce({ status: 'completed' })

    const doc: any = { readable_filename: 'f', url: 'http://x', doc_groups: undefined }
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: { action: 'appendDocGroup', courseName: 'CS101', doc, docGroup: 'g1' },
        headers: {},
        socket: { remoteAddress: '127.0.0.1' } as any,
      }) as any,
      res as any,
    )

    expect(doc.doc_groups).toContain('g1')
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('rolls back SQL when Qdrant update fails in appendDocGroup', async () => {
    hoisted.addDocumentsToDocGroup.mockResolvedValueOnce(true)
    hoisted.addDocumentsToDocGroupQdrant.mockResolvedValueOnce({ status: 'failed' })

    const doc: any = { readable_filename: 'f', url: 'http://x', doc_groups: [] }
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: { action: 'appendDocGroup', courseName: 'CS101', doc, docGroup: 'g1' },
        headers: {},
        socket: { remoteAddress: '127.0.0.1' } as any,
      }) as any,
      res as any,
    )

    expect(hoisted.removeDocGroup).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('returns 500 when SQL update fails in appendDocGroup', async () => {
    hoisted.addDocumentsToDocGroup.mockResolvedValueOnce(false)
    const doc: any = { readable_filename: 'f', url: 'http://x', doc_groups: [] }
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: { action: 'appendDocGroup', courseName: 'CS101', doc, docGroup: 'g1' },
        headers: {},
        socket: { remoteAddress: '127.0.0.1' } as any,
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('handles removeDocGroup', async () => {
    const doc: any = { readable_filename: 'f', url: 'http://x', doc_groups: ['g1', 'g2'] }
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: { action: 'removeDocGroup', courseName: 'CS101', doc, docGroup: 'g1' },
        headers: {},
        socket: { remoteAddress: '127.0.0.1' } as any,
      }) as any,
      res as any,
    )

    expect(doc.doc_groups).toEqual(['g2'])
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('handles removeDocGroup when doc_groups is missing', async () => {
    const doc: any = { readable_filename: 'f', url: 'http://x', doc_groups: undefined }
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: { action: 'removeDocGroup', courseName: 'CS101', doc, docGroup: 'g1' },
        headers: {},
        socket: { remoteAddress: '127.0.0.1' } as any,
      }) as any,
      res as any,
    )

    expect(Array.isArray(doc.doc_groups)).toBe(true)
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('handles getDocumentGroups', async () => {
    hoisted.fetchDocumentGroups.mockResolvedValueOnce([{ id: 1 }])
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: { action: 'getDocumentGroups', courseName: 'CS101' },
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('returns 500 when an operation throws', async () => {
    hoisted.fetchDocumentGroups.mockRejectedValueOnce(new Error('boom'))
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: { action: 'getDocumentGroups', courseName: 'CS101' },
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('handles updateDocGroupStatus', async () => {
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: { action: 'updateDocGroupStatus', courseName: 'CS101', docGroup: 'g', enabled: true },
      }) as any,
      res as any,
    )

    expect(hoisted.updateDocGroupStatus).toHaveBeenCalledWith('CS101', 'g', true)
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('handles fetchEnabledDocGroups', async () => {
    hoisted.fetchEnabledDocGroups.mockResolvedValueOnce([{ id: 1 }])
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: { action: 'fetchEnabledDocGroups', courseName: 'CS101' },
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('returns 400 for invalid action', async () => {
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: { action: 'nope', courseName: 'CS101' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(400)
  })
})
