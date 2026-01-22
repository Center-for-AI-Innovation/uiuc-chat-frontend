/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest'
import chat from '../chat'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'
import { ProviderNames } from '~/utils/modelProviders/LLMProvider'

const hoisted = vi.hoisted(() => ({
  validateRequestBody: vi.fn(async () => {}),
  validateApiKeyAndRetrieveData: vi.fn(async () => ({
    isValidApiKey: true,
    authContext: { user: { profile: { email: 'u@example.com' } } },
  })),
  fetchCourseMetadataServer: vi.fn(async () => ({ is_private: true })),
  determineAndValidateModelServer: vi.fn(async () => ({
    activeModel: { id: 'gpt-4o', name: 'm', tokenLimit: 1, enabled: true },
    modelsWithProviders: {
      [ProviderNames.OpenAI]: { enabled: true, apiKey: 'sk-test', models: [] },
      [ProviderNames.OpenAICompatible]: {
        enabled: false,
        apiKey: 'compat',
        models: [],
      },
    } as any,
  })),
  get_user_permission: vi.fn(() => 'edit'),
  fetchTools: vi.fn(async () => []),
  handleToolsServer: vi.fn(async (_last, _tools, _urls, _imgDesc, convo) => convo),
  constructSearchQuery: vi.fn(() => 'q'),
  handleImageContent: vi.fn(async () => ({ searchQuery: 'q2', imgDesc: 'img' })),
  handleContextSearch: vi.fn(async () => [{ id: 1 }]),
  attachContextsToLastMessage: vi.fn(),
  buildPrompt: vi.fn(async ({ conversation }: any) => conversation),
  routeModelRequest: vi.fn(async () => new Response('ok', { status: 200 })),
  handleStreamingResponse: vi.fn(async () => {}),
  handleNonStreamingResponse: vi.fn(async () => {}),
  getBaseUrl: vi.fn(() => 'http://localhost'),
}))

vi.mock('~/pages/api/chat-api/util/fetchCourseMetadataServer', () => ({
  default: hoisted.fetchCourseMetadataServer,
}))
vi.mock('~/pages/api/chat-api/util/determineAndValidateModelServer', () => ({
  determineAndValidateModelServer: hoisted.determineAndValidateModelServer,
}))
vi.mock('../keys/validate', () => ({
  validateApiKeyAndRetrieveData: hoisted.validateApiKeyAndRetrieveData,
}))
vi.mock('~/components/UIUC-Components/runAuthCheck', () => ({
  get_user_permission: hoisted.get_user_permission,
}))
vi.mock('~/utils/functionCalling/handleFunctionCalling', () => ({
  fetchTools: hoisted.fetchTools,
  handleToolsServer: hoisted.handleToolsServer,
}))
vi.mock('~/app/utils/buildPromptUtils', () => ({
  buildPrompt: hoisted.buildPrompt,
}))
vi.mock('~/utils/apiUtils', async (importOriginal) => {
  const actual = await importOriginal<any>()
  return {
    ...actual,
    getBaseUrl: hoisted.getBaseUrl,
  }
})
vi.mock('~/utils/streamProcessing', async (importOriginal) => {
  const actual = await importOriginal<any>()
  return {
    ...actual,
    validateRequestBody: hoisted.validateRequestBody,
    constructSearchQuery: hoisted.constructSearchQuery,
    handleImageContent: hoisted.handleImageContent,
    handleContextSearch: hoisted.handleContextSearch,
    attachContextsToLastMessage: hoisted.attachContextsToLastMessage,
    routeModelRequest: hoisted.routeModelRequest,
    handleStreamingResponse: hoisted.handleStreamingResponse,
    handleNonStreamingResponse: hoisted.handleNonStreamingResponse,
  }
})

describe('chat-api/chat', () => {
  it('returns 405 for non-POST methods', async () => {
    const res = createMockRes()
    await chat(
      createMockReq({ method: 'GET', socket: { remoteAddress: '127.0.0.1' } as any }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(405)
  })

  it('returns 400 when validateRequestBody throws', async () => {
    hoisted.validateRequestBody.mockRejectedValueOnce(new Error('bad'))
    const res = createMockRes()
    await chat(
      createMockReq({
        method: 'POST',
        body: { foo: 'bar' },
        socket: { remoteAddress: '127.0.0.1' } as any,
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 403 for invalid API key', async () => {
    hoisted.validateApiKeyAndRetrieveData.mockResolvedValueOnce({
      isValidApiKey: false,
      authContext: { user: { profile: { email: 'u@example.com' } } },
    })

    const res = createMockRes()
    await chat(
      createMockReq({
        method: 'POST',
        body: {
          model: 'gpt-4o',
          messages: [{ id: 'm1', role: 'user', content: 'hi' }],
          temperature: 0.1,
          course_name: 'CS101',
          stream: false,
          api_key: 'bad',
          retrieval_only: false,
        },
        socket: { remoteAddress: '127.0.0.1' } as any,
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('returns 404 when course metadata is missing', async () => {
    hoisted.fetchCourseMetadataServer.mockResolvedValueOnce(null)
    const res = createMockRes()
    await chat(
      createMockReq({
        method: 'POST',
        body: {
          model: 'gpt-4o',
          messages: [{ id: 'm1', role: 'user', content: 'hi' }],
          temperature: 0.1,
          course_name: 'CS101',
          stream: false,
          api_key: 'k',
          retrieval_only: false,
        },
        socket: { remoteAddress: '127.0.0.1' } as any,
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('returns 400 when model validation fails', async () => {
    hoisted.determineAndValidateModelServer.mockRejectedValueOnce(new Error('no model'))
    const res = createMockRes()
    await chat(
      createMockReq({
        method: 'POST',
        body: {
          model: 'bad',
          messages: [{ id: 'm1', role: 'user', content: 'hi' }],
          temperature: 0.1,
          course_name: 'CS101',
          stream: false,
          api_key: 'k',
          retrieval_only: false,
        },
        socket: { remoteAddress: '127.0.0.1' } as any,
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 403 when user permission is not edit', async () => {
    hoisted.get_user_permission.mockReturnValueOnce('view')
    const res = createMockRes()
    await chat(
      createMockReq({
        method: 'POST',
        body: {
          model: 'gpt-4o',
          messages: [{ id: 'm1', role: 'user', content: 'hi' }],
          temperature: 0.1,
          course_name: 'CS101',
          stream: false,
          api_key: 'k',
          retrieval_only: false,
        },
        socket: { remoteAddress: '127.0.0.1' } as any,
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('returns 400 when messages are empty', async () => {
    const res = createMockRes()
    await chat(
      createMockReq({
        method: 'POST',
        body: {
          model: 'gpt-4o',
          messages: [],
          temperature: 0.1,
          course_name: 'CS101',
          stream: false,
          api_key: 'k',
          retrieval_only: false,
        },
        socket: { remoteAddress: '127.0.0.1' } as any,
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns contexts and exits early when retrieval_only=true', async () => {
    const res = createMockRes()
    await chat(
      createMockReq({
        method: 'POST',
        body: {
          model: 'gpt-4o',
          messages: [{ id: 'm1', role: 'user', content: 'hi' }],
          temperature: 0.1,
          course_name: 'CS101',
          stream: false,
          api_key: 'k',
          retrieval_only: true,
        },
        socket: { remoteAddress: '127.0.0.1' } as any,
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(hoisted.routeModelRequest).not.toHaveBeenCalled()
  })

  it('returns 500 when fetchTools throws', async () => {
    hoisted.fetchTools.mockRejectedValueOnce(new Error('tools down'))
    const res = createMockRes()
    await chat(
      createMockReq({
        method: 'POST',
        body: {
          model: 'gpt-4o',
          messages: [{ id: 'm1', role: 'user', content: 'hi' }],
          temperature: 0.1,
          course_name: 'CS101',
          stream: false,
          api_key: 'k',
          retrieval_only: false,
        },
        socket: { remoteAddress: '127.0.0.1' } as any,
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('returns API error when routeModelRequest is not ok', async () => {
    hoisted.routeModelRequest.mockResolvedValueOnce(
      new Response('no', { status: 500, statusText: 'fail' }),
    )
    const res = createMockRes()
    await chat(
      createMockReq({
        method: 'POST',
        body: {
          model: 'gpt-4o',
          messages: [{ id: 'm1', role: 'user', content: 'hi' }],
          temperature: 0.1,
          course_name: 'CS101',
          stream: false,
          api_key: 'k',
          retrieval_only: false,
        },
        socket: { remoteAddress: '127.0.0.1' } as any,
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('calls handleNonStreamingResponse when stream=false', async () => {
    const res = createMockRes()
    await chat(
      createMockReq({
        method: 'POST',
        body: {
          model: 'gpt-4o',
          messages: [{ id: 'm1', role: 'user', content: 'hi' }],
          temperature: undefined,
          course_name: 'CS101',
          stream: false,
          api_key: 'k',
          retrieval_only: false,
        },
        socket: { remoteAddress: '127.0.0.1' } as any,
      }) as any,
      res as any,
    )
    expect(hoisted.handleNonStreamingResponse).toHaveBeenCalled()
  })

  it('calls handleStreamingResponse when stream=true', async () => {
    const res = createMockRes()
    await chat(
      createMockReq({
        method: 'POST',
        body: {
          model: 'gpt-4o',
          messages: [{ id: 'm1', role: 'user', content: 'hi' }],
          temperature: 0.1,
          course_name: 'CS101',
          stream: true,
          api_key: 'k',
          retrieval_only: false,
        },
        socket: { remoteAddress: '127.0.0.1' } as any,
      }) as any,
      res as any,
    )
    expect(hoisted.handleStreamingResponse).toHaveBeenCalled()
  })

  it('invokes handleImageContent and handleToolsServer when image content and tools are present', async () => {
    hoisted.fetchTools.mockResolvedValueOnce([{ id: 't1' }])
    hoisted.handleContextSearch.mockResolvedValueOnce([{ id: 1 }])
    const res = createMockRes()

    await chat(
      createMockReq({
        method: 'POST',
        body: {
          model: 'gpt-4o',
          messages: [
            {
              id: 'm1',
              role: 'user',
              content: [
                { type: 'image_url', image_url: { url: 'http://img' } },
                { type: 'text', text: 'hi' },
              ],
            },
          ],
          temperature: 0.1,
          course_name: 'CS101',
          stream: false,
          api_key: 'k',
          retrieval_only: false,
        },
        socket: { remoteAddress: '127.0.0.1' } as any,
      }) as any,
      res as any,
    )

    expect(hoisted.handleImageContent).toHaveBeenCalled()
    expect(hoisted.handleToolsServer).toHaveBeenCalled()
    expect(hoisted.handleNonStreamingResponse).toHaveBeenCalled()
  })
})

