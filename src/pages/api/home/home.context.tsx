import { type Dispatch, createContext } from 'react'

import { type ActionType } from '@/hooks/useCreateReducer'

import { Action, type Conversation } from '@/types/chat'
import { type KeyValuePair } from '@/types/data'
import { type FolderType } from '@/types/folder'

import { type HomeInitialState } from './home.state'

export interface HomeContextProps {
  state: HomeInitialState
  dispatch: Dispatch<ActionType<HomeInitialState>>
  handleNewConversation: () => void
  handleCreateFolder: (name: string, type: FolderType) => void
  handleDeleteFolder: (folderId: string) => void
  handleUpdateFolder: (folderId: string, name: string) => void
  handleSelectConversation: (conversation: Conversation) => void
  handleUpdateConversation: (
    conversation: Conversation,
    data: KeyValuePair,
  ) => void
  handleFeedbackUpdate: (conversation: Conversation, data: KeyValuePair) => void
  setIsImg2TextLoading: (isImg2TextLoading: boolean) => void
  setIsRouting: (isRouting: boolean) => void
  // setRoutingResponse: (routingResponse: RoutingResponse) => void
  // setRunningTool: (isRunningTool: boolean) => void
  setIsRetrievalLoading: (isRetrievalLoading: boolean) => void
  handleUpdateDocumentGroups: (id: string) => void
  handleUpdateTools: (id: string) => void
  setIsQueryRewriting: (isQueryRewriting: boolean) => void
  setQueryRewriteResult: (queryText: string) => void
}

const HomeContext = createContext<HomeContextProps>(undefined!)

export default HomeContext
