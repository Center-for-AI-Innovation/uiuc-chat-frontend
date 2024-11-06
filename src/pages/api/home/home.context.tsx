import { Dispatch, createContext } from 'react'

import { ActionType } from '@/hooks/useCreateReducer'

import { Action, Conversation } from '@/types/chat'
import { KeyValuePair } from '@/types/data'
import { FolderType } from '@/types/folder'

import { HomeInitialState } from './home.state'

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
  handleFeedbackUpdate: (
    conversation: Conversation,
    data: KeyValuePair,
  ) => void
  setIsImg2TextLoading: (isImg2TextLoading: boolean) => void
  setIsRouting: (isRouting: boolean) => void
  // setRoutingResponse: (routingResponse: RoutingResponse) => void
  // setRunningTool: (isRunningTool: boolean) => void
  setIsRetrievalLoading: (isRetrievalLoading: boolean) => void
  handleUpdateDocumentGroups: (id: string) => void
  handleUpdateTools: (id: string) => void
}

const HomeContext = createContext<HomeContextProps>(undefined!)

export default HomeContext
