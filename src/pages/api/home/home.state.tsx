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
  pluginKeys: PluginKey[] //TODO(BG): can be removed since the value is never set
  loading: boolean
  messageIsStreaming: boolean
  modelError: ErrorMessage | null //TODO(BG): can be replaced by React Query Hook
  llmProviders: AllLLMProviders //TODO(BG): can be replaced by React Query Hook
  selectedModel: AnySupportedModel | null //TODO(BG): can be removed since the value is never set
  folders: FolderWithConversation[] //TODO(BG): can be removed since the value is never set (even through createFolderFunction)
  conversations: Conversation[]
  selectedConversation: Conversation | undefined
  currentMessage: Message | undefined //TODO(BG): can be removed since the value is never set
  prompts: Prompt[] //TODO(BG): can be removed since the value is never set
  temperature: number //TODO(BG): can be removed since the value is never set
  showChatbar: boolean
  currentFolder: FolderInterface | undefined
  messageError: boolean //TODO(BG): can be removed since the value is never set
  searchTerm: string //TODO(BG): can be removed since the value is never set (a similar variable exists in ChatbarContext)
  defaultModelId: OpenAIModelID | undefined
  serverSideApiKeyIsSet: boolean
  serverSidePluginKeysSet: boolean //TODO(BG): maybe removed since the value only used in two places?
  cooldown: number //TODO(BG): can be removed since the value is never used
  showModelSettings: boolean
  isImg2TextLoading: boolean //TODO(BG): can be removed react query dup
  isRouting: boolean | undefined //TODO(BG): can be removed react query dup
  isRunningTool: boolean | undefined //TODO(BG): can be removed react query dup
  isRetrievalLoading: boolean | undefined //TODO(BG): can be removed react query dup
  isQueryRewriting: boolean | undefined //TODO(BG): can be removed react query dup
  wasQueryRewritten: boolean | undefined //TODO(BG): can be removed not used anywhere
  queryRewriteText: string | undefined //TODO(BG): can be removed not used anywhere
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
}
