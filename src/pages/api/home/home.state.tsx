import {
  type Action,
  type Conversation,
  type Message,
  type UIUCTool,
} from '@/types/chat'
import {
  type FolderInterface,
  type FolderWithConversation,
} from '@/types/folder'
import { type OpenAIModelID } from '~/utils/modelProviders/types/openai'
import { type Prompt } from '@/types/prompt'

export interface HomeInitialState {
  apiKey: string
  loading: boolean
  messageIsStreaming: boolean
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
  isRunningTool: boolean | undefined //TODO(BG): can be removed react query dup
  isRetrievalLoading: boolean | undefined //TODO(BG): can be removed react query dup
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
  messageIsStreaming: false,
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
  isRunningTool: undefined,
  isRetrievalLoading: undefined,
  wasQueryRewritten: undefined,
  queryRewriteText: undefined,
  documentGroups: [],
  tools: [],
  webLLMModelIdLoading: { id: undefined, isLoading: undefined },
}
