import { type Action, type Conversation, type UIUCTool } from '@/types/chat'
import { type FolderInterface } from '@/types/folder'
import { type OpenAIModelID } from '~/utils/modelProviders/types/openai'

export interface HomeInitialState {
  apiKey: string
  loading: boolean
  messageIsStreaming: boolean
  conversations: Conversation[]
  selectedConversation: Conversation | undefined
  showChatbar: boolean
  currentFolder: FolderInterface | undefined
  defaultModelId: OpenAIModelID | undefined
  serverSideApiKeyIsSet: boolean
  showModelSettings: boolean
  documentGroups: Action[]
  tools: UIUCTool[]
  webLLMModelIdLoading: {
    id: string | undefined
    isLoading: boolean | undefined
  }
}

export const initialState: HomeInitialState = {
  apiKey: '',
  loading: false,
  messageIsStreaming: false,
  conversations: [],
  selectedConversation: undefined,
  showChatbar: true,
  currentFolder: undefined,
  defaultModelId: undefined,
  serverSideApiKeyIsSet: false,
  showModelSettings: false,
  documentGroups: [],
  tools: [],
  webLLMModelIdLoading: { id: undefined, isLoading: undefined },
}
