import {
  OpenAIModelID,
  OpenAIModels,
} from '~/utils/modelProviders/types/openai'
import type { ContextWithMetadata, Conversation, Message } from '~/types/chat'

export function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'msg-1',
    role: 'user',
    content: 'Hello',
    ...overrides,
  }
}

export function makeConversation(
  overrides: Partial<Conversation> = {},
): Conversation {
  return {
    id: 'conv-1',
    name: 'Test Conversation',
    messages: [],
    model: OpenAIModels[OpenAIModelID.GPT_4o_mini],
    prompt: 'You are a helpful assistant.',
    temperature: 0.3,
    folderId: null,
    ...overrides,
  }
}

export function makeContextWithMetadata(
  overrides: Partial<ContextWithMetadata> = {},
): ContextWithMetadata {
  return {
    id: 1,
    text: 'Context snippet',
    readable_filename: 'Document.pdf',
    course_name: 'TEST101',
    'course_name ': 'TEST101',
    s3_path: 's3://bucket/key',
    pagenumber: '1',
    url: 'https://example.com/doc.pdf',
    base_url: 'https://example.com',
    ...overrides,
  }
}
