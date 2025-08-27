import {
  type Action,
  type Conversation,
  type Message,
  type UIUCTool,
} from '@/types/chat'
import { type ErrorMessage } from '@/types/error'
import {
  type FolderInterface,
  type FolderWithConversation,
} from '@/types/folder'
import { type OpenAIModelID } from '~/utils/modelProviders/types/openai'
import { type PluginKey } from '@/types/plugin'
import { type Prompt } from '@/types/prompt'
import {
  type AnySupportedModel,
  type AllLLMProviders,
} from '~/utils/modelProviders/LLMProvider'

export interface HomeInitialState {
  apiKey: string
  pluginKeys: PluginKey[]
  loading: boolean
  messageIsStreaming: boolean
  modelError: ErrorMessage | null
  llmProviders: AllLLMProviders
  selectedModel: AnySupportedModel | null
  folders: FolderWithConversation[]
  conversations: Conversation[]
  selectedConversation: Conversation | undefined
  currentMessage: Message | undefined
  prompts: Prompt[]
  temperature: number
  showChatbar: boolean
  currentFolder: FolderInterface | undefined
  messageError: boolean
  searchTerm: string
  defaultModelId: OpenAIModelID | undefined
  serverSideApiKeyIsSet: boolean
  serverSidePluginKeysSet: boolean
  cooldown: number
  showModelSettings: boolean
  isImg2TextLoading: boolean
  isRouting: boolean | undefined
  isRunningTool: boolean | undefined
  isRetrievalLoading: boolean | undefined
  isQueryRewriting: boolean | undefined
  wasQueryRewritten: boolean | undefined
  queryRewriteText: string | undefined
  documentGroups: Action[]
  tools: UIUCTool[]
  webLLMModelIdLoading: {
    id: string | undefined
    isLoading: boolean | undefined
  }
  agentMode: boolean
}

export const initialState: HomeInitialState = {
  apiKey: '',
  loading: false,
  pluginKeys: [],
  messageIsStreaming: false,
  modelError: null,
  llmProviders: {} as AllLLMProviders,
  selectedModel: null,
  folders: [],
  conversations: [],
  selectedConversation: undefined,
  currentMessage: undefined,
  prompts: [], // TODO: Add default prompts here :)
  temperature: 0.3,
  showChatbar: true,
  currentFolder: undefined,
  messageError: false,
  searchTerm: '',
  defaultModelId: undefined,
  serverSideApiKeyIsSet: false,
  serverSidePluginKeysSet: false,
  cooldown: 0,
  showModelSettings: false,
  isRouting: undefined,
  isRunningTool: undefined,
  isRetrievalLoading: undefined,
  isQueryRewriting: undefined,
  wasQueryRewritten: undefined,
  queryRewriteText: undefined,
  isImg2TextLoading: false,
  documentGroups: [],
  tools: [],
  webLLMModelIdLoading: { id: undefined, isLoading: undefined },
  agentMode: false,
}
