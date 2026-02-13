import type { HomeContextProps } from '~/pages/api/home/home.context'
import { initialState } from '~/pages/api/home/home.state'
import type { HomeInitialState } from '~/pages/api/home/home.state'

export function makeHomeContext(
  overrides: Partial<HomeContextProps> = {},
): HomeContextProps {
  return {
    state: initialState,
    dispatch: () => undefined,
    handleNewConversation: () => undefined,
    handleCreateFolder: () => undefined,
    handleDeleteFolder: () => undefined,
    handleUpdateFolder: () => undefined,
    handleSelectConversation: () => undefined,
    handleUpdateConversation: () => undefined,
    handleFeedbackUpdate: () => undefined,
    setIsImg2TextLoading: () => undefined,
    setIsRouting: () => undefined,
    setIsRetrievalLoading: () => undefined,
    handleUpdateDocumentGroups: () => undefined,
    handleUpdateTools: () => undefined,
    setIsQueryRewriting: () => undefined,
    setQueryRewriteResult: () => undefined,
    ...overrides,
  }
}

export function makeHomeState(
  overrides: Partial<HomeInitialState> = {},
): HomeInitialState {
  return { ...initialState, ...overrides }
}
