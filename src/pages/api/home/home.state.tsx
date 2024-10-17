import { Action, Conversation, Message, UIUCTool } from '@/types/chat'
import { ErrorMessage } from '@/types/error'
import { FolderInterface, FolderWithConversation } from '@/types/folder'
import { OpenAIModelID } from '~/utils/modelProviders/types/openai'
import { PluginKey } from '@/types/plugin'
import { Prompt } from '@/types/prompt'
import {
  AnySupportedModel,
  AllLLMProviders,
  ProjectWideLLMProviders,
} from '~/utils/modelProviders/LLMProvider'

export interface HomeInitialState {
  apiKey: string
  pluginKeys: PluginKey[]
  loading: boolean
  lightMode: 'light' | 'dark'
  messageIsStreaming: boolean
  modelError: ErrorMessage | null
  // llmProviders: AllLLMProviders
  projectLLMProviders: ProjectWideLLMProviders
  selectedModel: AnySupportedModel | null
  folders: FolderWithConversation[]
  conversations: Conversation[]
  selectedConversation: Conversation | undefined
  currentMessage: Message | undefined
  prompts: Prompt[]
  temperature: number
  showChatbar: boolean
  showPromptbar: boolean
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
  pluginKeys: [],
  lightMode: 'dark',
  messageIsStreaming: false,
  modelError: null,
  // llmProviders: {} as AllLLMProviders,
  projectLLMProviders: {} as ProjectWideLLMProviders,
  selectedModel: null,
  folders: [],
  conversations: [],
  selectedConversation: undefined,
  currentMessage: undefined,
  prompts: [], // TODO: Add default prompts here :)
  temperature: 0.3,
  showPromptbar: false,
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
  isImg2TextLoading: false,
  documentGroups: [],
  tools: [],
  webLLMModelIdLoading: { id: undefined, isLoading: undefined },
}
