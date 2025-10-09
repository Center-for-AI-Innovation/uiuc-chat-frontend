import { useState, useCallback, useContext, useEffect, Suspense } from 'react'
import { useTranslation } from 'next-i18next'
import { useCreateReducer } from '@/hooks/useCreateReducer'
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const'
import { type Conversation } from '@/types/chat'
import { OpenAIModels } from '~/utils/modelProviders/types/openai'

import HomeContext from '~/pages/api/home/home.context'
import { ChatFolders } from './components/ChatFolders'
import { ChatbarSettings } from './components/ChatbarSettings'
import { Conversations } from './components/Conversations'
import Sidebar from '../Sidebar'
import ChatbarContext from './Chatbar.context'
import { type ChatbarInitialState, initialState } from './Chatbar.state'
import { v4 as uuidv4 } from 'uuid'
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

import { type CourseMetadata } from '~/types/courseMetadata'

interface DownloadResult {
  message: string
}

export const Chatbar = ({
                          current_email,
                          courseName,
                          courseMetadata,
                        }: {
  current_email: string | undefined
  courseName: string | undefined
  courseMetadata?: CourseMetadata | null
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
    current_email as string,
    queryClient,
    courseName as string,
    searchTerm,
  )

  const deleteAllConversationMutation = useDeleteAllConversations(
    queryClient,
    current_email as string,
    courseName as string,
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
    courseName as string,
  )

  const [convoMigrationLoading, setConvoMigrationLoading] =
    useState<boolean>(false)

  useEffect(() => {
    if (!current_email || !courseName) {
      return
    }
    setDebouncedSearchTerm(searchTerm)
  }, [searchTerm, current_email, courseName])

  async function updateConversations(conversationHistory: Conversation[]) {
    if (!current_email || !courseName) {
      console.warn('Cannot update conversations: missing email or course name')
      return
    }

    try {
      await Promise.all(
        conversationHistory.map(async (conversation: Conversation) => {
          conversation.userEmail = current_email
          conversation.projectName = courseName
          try {
            const response = await saveConversationToServer(conversation, courseName)
            console.log('Response from saveConversationToServer: ', response)
          } catch (error: any) {
            if (error?.details?.includes('already exists')) {
              console.log('Conversation already exists, skipping')
              return
            }
            throw error
          }
        }),
      )
    } catch (error) {
      console.error('Error updating conversations:', error)
    }
  }

  const downloadConversationHistoryUser = async (
    userEmail: string,
    projectName: string,
  ): Promise<DownloadResult> => {
    // Input validation on client side
    if (!userEmail || !projectName) {
      return { message: 'Missing email or project name.' }
    }

    console.log(
      `Starting download for user: ${userEmail}, project: ${projectName}`,
    )

    try {
      const response = await fetch(
        `/api/UIUC-api/downloadConvoHistoryUser?projectName=${encodeURIComponent(projectName)}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/zip, application/json, */*',
          },
        },
      )

      console.log('Received response:', response.status, response.statusText)

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `Server error (${response.status})`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // If response isn't JSON, use status text
          errorMessage = response.statusText || errorMessage
        }

        console.error('Server error:', errorMessage)
        return { message: `Error: ${errorMessage}` }
      }

      const contentType = response.headers.get('content-type') || ''

      if (contentType.includes('application/json')) {
        console.log('Response is JSON')
        const jsonData = await response.json()
        console.log('Parsed JSON data:', jsonData)

        if (jsonData.response === 'Download from S3') {
          console.log(
            'Large conversation history, sending email with download link',
          )
          return {
            message:
              "We are gathering your large conversation history, you'll receive an email with a download link shortly.",
          }
        } else if (jsonData.error) {
          return { message: `Error: ${jsonData.error}` }
        } else {
          console.log('Conversation history ready for download')
          return {
            message: 'Your conversation history is ready for download.',
          }
        }
      } else if (contentType.includes('application/zip')) {
        console.log('Response is a ZIP file')
        const blob = await response.blob()

        // Validate blob size (basic sanity check)
        if (blob.size === 0) {
          return { message: 'Error: Received empty file.' }
        }

        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url

        // Sanitize filename for security
        const sanitizedProjectName = projectName
          .replace(/[^a-zA-Z0-9\-_]/g, '_')
          .substring(0, 10)
        link.setAttribute('download', `${sanitizedProjectName}-convos.zip`)

        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        console.log('Download started, check your downloads')
        return { message: 'Downloading now, check your downloads.' }
      } else {
        console.warn('Unexpected content type:', contentType)
        return { message: 'Unexpected response format from server.' }
      }
    } catch (error) {
      console.error('Error exporting documents:', error)

      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          message: 'Network error. Please check your connection and try again.',
        }
      }

      return { message: 'Error exporting documents. Please try again.' }
    }
  }

  useEffect(() => {
    try {
      if (
        isConversationHistoryFetched &&
        !isConversationHistoryLoading &&
        conversationHistory
      ) {
        // console.log('Raw conversation history:', conversationHistory)
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
              'Migrating conversations from local storage to database',
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
    homeDispatch({ field: 'conversations', value: [] })
    chatDispatch({ field: 'searchTerm', value: '' })
    handleNewConversation()
    deleteAllConversationMutation.mutate()
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

  if (!current_email || !courseName) {
    return (
      <div className="flex-1 overflow-hidden">
        <div className="h-full p-4">
          <div className="text-center text-neutral-300">
            <LoadingSpinner />
            <div className="mt-2">Loading...</div>
          </div>
        </div>
      </div>
    )
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
        courseName={courseName}
        courseMetadata={courseMetadata || null}
      />
    </ChatbarContext.Provider>
  )
}
