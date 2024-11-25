import { CourseMetadata } from './courseMetadata'
import { N8NParameter } from './tools'
import {
  AnySupportedModel,
  BaseLLMProvider,
  AllLLMProviders,
} from '../utils/modelProviders/LLMProvider'

export interface ConversationPage {
  conversations: Conversation[]
  nextCursor: number | null
}

export interface Conversation {
  // NO KEY
  id: string
  name: string
  messages: Message[]
  model: AnySupportedModel
  prompt: string
  temperature: number
  folderId: string | null
  userEmail?: string
  projectName?: string
  createdAt?: string
  updatedAt?: string
}

export interface Message {
  id: string
  role: Role
  content: string | Content[]
  contexts?: ContextWithMetadata[]
  tools?: UIUCTool[]
  latestSystemMessage?: string
  finalPromtEngineeredMessage?: string // after all prompt enginering, to generate final response.
  responseTimeSec?: number
  conversation_id?: string
  created_at?: string
  updated_at?: string
  feedback?: MessageFeedback
  wasQueryRewritten?: boolean
  queryRewriteText?: string
}

export type MessageFeedback = {
  isPositive: boolean | null
  category: string | null
  details: string | null
}

export interface UIUCTool {
  id: string
  name: string // Openai uses this
  readableName: string // N8N uses this
  description: string
  inputParameters?: {
    type: 'object'
    properties: Record<string, N8NParameter>
    required: string[]
  }
  aiGeneratedArgumentValues?: Record<string, string>
  courseName?: string
  enabled?: boolean
  createdAt?: string
  updatedAt?: string
  output?: ToolOutput // Use a unified output type
  error?: string
  tags?: { name: string }[]
  contexts?: ContextWithMetadata[]
}

export interface ToolOutput {
  text?: string // For plain text outputs
  imageUrls?: string[] // For image URLs
  s3Paths?: string[] // For S3 paths of uploaded files
  data?: Record<string, unknown> // For any other structured data
}

// tool_image_url is for images returned by tools
export type MessageType = 'text' | 'image_url' | 'tool_image_url'

export interface Content {
  type: MessageType
  text?: string
  image_url?: {
    url: string
  }
}

export interface OpenAIChatMessage {
  role: Role
  content: Content[]
}

export interface ContextWithMetadata {
  id: number
  text: string
  readable_filename: string
  course_name: string
  'course_name ': string
  s3_path: string
  pagenumber: string
  url: string
  base_url: string
}

// These are only internal
export type Role = 'assistant' | 'user' | 'system'

export interface ChatBody {
  model?: AnySupportedModel
  messages?: Message[]
  prompt?: string
  temperature?: number
  conversation?: Conversation
  key: string
  course_name: string
  stream: boolean
  isImage?: boolean
  courseMetadata?: CourseMetadata
  // provider?: BaseLLMProvider // TODO: make mandatory
  llmProviders?: AllLLMProviders
  // NO FOLDER ID
}

export interface ImageBody {
  conversation: Conversation
  course_name: string
  llmProviders: AllLLMProviders
}

export interface ChatApiBody {
  model: string
  messages: Message[]
  openai_key?: string
  temperature?: number
  course_name: string
  stream?: boolean
  api_key: string
}

export interface Action {
  id: string
  name: string
  checked: boolean
}
