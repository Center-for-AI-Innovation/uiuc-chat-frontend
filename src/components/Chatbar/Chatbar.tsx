import { useState, useCallback, useContext, useEffect, Suspense } from 'react'
import { useTranslation } from 'next-i18next'
import { useCreateReducer } from '@/hooks/useCreateReducer'
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const'
import { exportData } from '@/utils/app/importExport'
import { Conversation } from '@/types/chat'
import { LatestExportFormat, SupportedExportFormats } from '@/types/export'
import { OpenAIModels } from '~/utils/modelProviders/types/openai'
import { PluginKey } from '@/types/plugin'

import HomeContext from '~/pages/api/home/home.context'
import { ChatFolders } from './components/ChatFolders'
import { ChatbarSettings } from './components/ChatbarSettings'
import { Conversations } from './components/Conversations'
import Sidebar from '../Sidebar'
import ChatbarContext from './Chatbar.context'
import { ChatbarInitialState, initialState } from './Chatbar.state'
import { v4 as uuidv4 } from 'uuid'
import router from 'next/router'
import { useQueryClient } from '@tanstack/react-query'
import {
  useDeleteAllConversations,
  useDeleteConversation,
  useFetchConversationHistory,
  useUpdateConversation,
} from '~/hooks/conversationQueries'
import { AnimatePresence, motion } from 'framer-motion'
import { LoadingSpinner } from '../UIUC-Components/LoadingSpinner'
import { useDebouncedState } from '@mantine/hooks'
import posthog from 'posthog-js'
import { saveConversationToServer } from '~/utils/app/conversation'
import { downloadConversationHistoryUser } from '~/pages/api/UIUC-api/downloadConvoHistoryUser'

export const Chatbar = ({
  current_email,
  courseName,
}: {
  current_email: string
  courseName: string
}) => {
  const { t } = useTranslation('sidebar')
  const chatBarContextValue = useCreateReducer<ChatbarInitialState>({
    initialState,
  })
  const [isExporting, setIsExporting] = useState<boolean>(false)

  const {
    state: { conversations, showChatbar, defaultModelId, folders },
    dispatch: homeDispatch,
    handleCreateFolder,
    handleNewConversation,
    handleUpdateConversation,
  } = useContext(HomeContext)

  const {
    state: { searchTerm, filteredConversations },
    dispatch: chatDispatch,
  } = chatBarContextValue

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useDebouncedState(
    searchTerm,
    500,
  )

  const queryClient = useQueryClient()
  const deleteConversationMutation = useDeleteConversation(
    current_email,
    queryClient,
    courseName,
    searchTerm,
  )

  const deleteAllConversationMutation = useDeleteAllConversations(
    queryClient,
    current_email,
    courseName,
  )

  const handleApiKeyChange = useCallback(
    (apiKey: string) => {
      homeDispatch({ field: 'apiKey', value: apiKey })
      localStorage.setItem('apiKey', apiKey)
    },
    [homeDispatch],
  )

  const {
    data: conversationHistory,
    error: conversationHistoryError,
    isLoading: isConversationHistoryLoading,
    isFetched: isConversationHistoryFetched,
    fetchNextPage: fetchNextPageConversationHistory,
    hasNextPage: hasNextPageConversationHistory,
    isFetchingNextPage: isFetchingNextPageConversationHistory,
    refetch: refetchConversationHistory,
  } = useFetchConversationHistory(
    current_email,
    debouncedSearchTerm,
    courseName,
  )

  const updateConversationMutation = useUpdateConversation(
    current_email as string,
    queryClient,
    courseName,
  )

  const [convoMigrationLoading, setConvoMigrationLoading] =
    useState<boolean>(false)

  useEffect(() => {
    setDebouncedSearchTerm(searchTerm)
  }, [searchTerm])

  async function updateConversations(conversationHistory: Conversation[]) {
    await Promise.all(
      conversationHistory.map(async (conversation: Conversation) => {
        conversation.userEmail = current_email
        conversation.projectName = courseName
        const response = await saveConversationToServer(conversation)
        console.log('Response from saveConversationToServer: ', response)
      }),
    )
  }

  useEffect(() => {
    try {
      if (
        isConversationHistoryFetched &&
        !isConversationHistoryLoading &&
        conversationHistory
      ) {
        const allConversations = conversationHistory.pages
          .flatMap((page) => (Array.isArray(page) ? page : []))
          .filter((conversation) => conversation !== undefined)
        homeDispatch({ field: 'conversations', value: allConversations })
        // console.log('Dispatching conversations: ', allConversations)

        const convoMigrationComplete = localStorage.getItem(
          'convoMigrationComplete',
        )
        if (convoMigrationComplete === 'true') return

        if (
          convoMigrationComplete === null ||
          convoMigrationComplete === undefined ||
          convoMigrationComplete === 'false'
        ) {
          localStorage.setItem('convoMigrationComplete', 'false')
          setConvoMigrationLoading(true)

          if (
            isConversationHistoryFetched &&
            !isConversationHistoryLoading &&
            allConversations &&
            allConversations.length === 0 &&
            localStorage.getItem('conversationHistory') != null &&
            localStorage.getItem('conversationHistory') != undefined &&
            localStorage.getItem('conversationHistory') != '[]'
          ) {
            posthog.capture('migration_started', {
              distinctId: current_email,
            })
            console.log(
              'Migrating conversations from local storage to supabase',
            )
            const conversationHistory = JSON.parse(
              localStorage.getItem('conversationHistory') || '[]',
            )
            homeDispatch({ field: 'conversations', value: conversationHistory })
            updateConversations(conversationHistory)
            localStorage.setItem('convoMigrationComplete', 'true')
            setTimeout(() => refetchConversationHistory(), 100)
          } else {
            console.log('No need to migrate conversations')
          }
        }
      }
    } catch (error: any) {
      console.error('Error during conversation migration:', error)
      posthog.capture('migration_error', {
        distinctId: current_email,
        error: error.message,
      })
    } finally {
      setConvoMigrationLoading(false)
    }
  }, [
    conversationHistory,
    isConversationHistoryFetched,
    isConversationHistoryLoading,
    homeDispatch,
  ])

  const handleLoadMoreConversations = () => {
    if (
      hasNextPageConversationHistory &&
      !isFetchingNextPageConversationHistory
    ) {
      fetchNextPageConversationHistory()
    }
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const bottom =
      e.currentTarget.scrollHeight - e.currentTarget.scrollTop <=
      e.currentTarget.clientHeight + 100
    if (bottom) {
      handleLoadMoreConversations()
    }
  }

  const handleExportData = async () => {
    if (courseName && current_email) {
      setIsExporting(true)
      try {
        await downloadConversationHistoryUser(current_email, courseName)
      } finally {
        setIsExporting(false)
      }
    }
  }

  const handleClearConversations = () => {
    deleteAllConversationMutation.mutate()
    handleNewConversation()
  }

  const handleDeleteConversation = (conversation: Conversation) => {
    const updatedConversations = conversations.filter(
      (c) => c.id !== conversation.id,
    )
    homeDispatch({ field: 'conversations', value: updatedConversations })
    chatDispatch({ field: 'searchTerm', value: '' })

    deleteConversationMutation.mutate(conversation)

    if (updatedConversations.length > 0) {
      const lastConversation = updatedConversations[0]
      if (lastConversation) {
        homeDispatch({ field: 'selectedConversation', value: lastConversation })
      }
    } else {
      defaultModelId &&
        homeDispatch({
          field: 'selectedConversation',
          value: {
            id: uuidv4(),
            name: t('New Conversation'),
            messages: [],
            model: OpenAIModels[defaultModelId],
            prompt: DEFAULT_SYSTEM_PROMPT,
            temperature: DEFAULT_TEMPERATURE,
            folderId: null,
          },
        })
      localStorage.removeItem('selectedConversation')
    }
  }

  const handleToggleChatbar = () => {
    homeDispatch({ field: 'showChatbar', value: !showChatbar })
    localStorage.setItem('showChatbar', JSON.stringify(!showChatbar))
  }

  const handleDrop = (e: any) => {
    if (e.dataTransfer) {
      const conversation = JSON.parse(e.dataTransfer.getData('conversation'))
      handleUpdateConversation(conversation, { key: 'folderId', value: null })
      chatDispatch({ field: 'searchTerm', value: '' })
      e.target.style.background = 'none'
    }
  }

  return (
    <ChatbarContext.Provider
      value={{
        ...chatBarContextValue,
        handleDeleteConversation,
        handleClearConversations,
        handleExportData,
        handleApiKeyChange,
        isExporting,
      }}
    >
      <Sidebar<Conversation>
        side={'left'}
        isOpen={showChatbar}
        addItemButtonTitle={t('New chat')}
        itemComponent={
          <Suspense
            fallback={
              <div>
                Loading... <LoadingSpinner size="sm" />
              </div>
            }
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {convoMigrationLoading ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner size="sm" />
                </div>
              ) : (
                <>
                  <Conversations
                    conversations={conversations}
                    onLoadMore={handleLoadMoreConversations}
                  />
                  <AnimatePresence>
                    {isFetchingNextPageConversationHistory && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex justify-center py-4"
                      >
                        <LoadingSpinner size="sm" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </motion.div>
          </Suspense>
        }
        folderComponent={
          <ChatFolders
            searchTerm={searchTerm}
            currentEmail={current_email}
            courseName={courseName}
          />
        }
        folders={folders}
        items={conversations}
        searchTerm={searchTerm}
        handleSearchTerm={(searchTerm: string) =>
          chatDispatch({ field: 'searchTerm', value: searchTerm })
        }
        toggleOpen={handleToggleChatbar}
        handleCreateItem={handleNewConversation}
        handleCreateFolder={() => handleCreateFolder(t('New folder'), 'chat')}
        handleDrop={handleDrop}
        footerComponent={<ChatbarSettings />}
        onScroll={handleScroll}
      />
    </ChatbarContext.Provider>
  )
}
