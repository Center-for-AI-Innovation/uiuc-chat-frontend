import { type Dispatch, createContext } from 'react'

import { type ActionType } from '@/hooks/useCreateReducer'

import { type Conversation } from '@/types/chat'

import { type ChatbarInitialState } from './Chatbar.state'

export interface ChatbarContextProps {
  state: ChatbarInitialState
  dispatch: Dispatch<ActionType<ChatbarInitialState>>
  handleDeleteConversation: (conversation: Conversation) => void
  handleClearConversations: () => void
  handleExportData: () => void
  // handleImportConversations: (data: SupportedExportFormats) => void
  isExporting: boolean
}

const ChatbarContext = createContext<ChatbarContextProps>(undefined as any)

export default ChatbarContext
