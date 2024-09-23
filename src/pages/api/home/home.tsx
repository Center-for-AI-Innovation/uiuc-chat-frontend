// src/pages/home/home.tsx
import { useCallback, useEffect, useRef, useState } from 'react'

import { useTranslation } from 'next-i18next'
import Head from 'next/head'

import { useCreateReducer } from '@/hooks/useCreateReducer'

import useErrorService from '@/services/errorService'

import { cleanSelectedConversation } from '@/utils/app/clean'
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const'
import { getSettings } from '@/utils/app/settings'

import { type Conversation } from '@/types/chat'
import { type KeyValuePair } from '@/types/data'

import { Chat } from '@/components/Chat/Chat'
import { Chatbar } from '@/components/Chatbar/Chatbar'
import { Navbar } from '@/components/Mobile/Navbar'
import Promptbar from '@/components/Promptbar'

import HomeContext from './home.context'
import { type HomeInitialState, initialState } from './home.state'

import { v4 as uuidv4 } from 'uuid'
import { type CourseMetadata } from '~/types/courseMetadata'
import {
  selectBestModel,
  VisionCapableModels,
} from '~/utils/modelProviders/LLMProvider'
import { OpenAIModelID } from '~/utils/modelProviders/types/openai'
import {
  useDeleteFolder,
  useFetchFolders,
  useUpdateFolder,
} from '~/hooks/folderQueries'
import { useUpdateConversation } from '~/hooks/conversationQueries'
import { FolderType, FolderWithConversation } from '~/types/folder'
import { useQueryClient } from '@tanstack/react-query'
import { useCreateFolder } from '~/hooks/folderQueries'

const Home = ({
  current_email,
  course_metadata,
  course_name,
}: {
  current_email: string
  course_metadata: CourseMetadata | null
  course_name: string
}) => {
  // States
  const [isInitialSetupDone, setIsInitialSetupDone] = useState(false)

  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Make a new conversation if the current one isn't empty
  const [hasMadeNewConvoAlready, setHasMadeNewConvoAlready] = useState(false)

  // Hooks
  const { t } = useTranslation('chat')
  const { getModelsError } = useErrorService()

  const queryClient = useQueryClient()
  // const queryCache = queryClient.getQueryCache()

  const createFolderMutation = useCreateFolder(
    current_email as string,
    queryClient,
    course_name,
  )
  const updateFolderMutation = useUpdateFolder(
    current_email as string,
    queryClient,
    course_name,
  )
  const deleteFolderMutation = useDeleteFolder(
    current_email as string,
    queryClient,
    course_name,
  )

  // const {
  //   data: conversationHistory,
  //   isFetched: isConversationHistoryFetched,
  //   isLoading: isLoadingConversationHistory,
  //   error: errorConversationHistory,
  //   refetch: refetchConversationHistory,
  // } = useFetchConversationHistory(current_email as string)

  const {
    data: foldersData,
    isFetched: isFoldersFetched,
    isLoading: isLoadingFolders,
    error: errorFolders,
    refetch: refetchFolders,
  } = useFetchFolders(current_email as string)

  const stopConversationRef = useRef<boolean>(false)
  const getModels = useCallback(
    async (params: { projectName: string }, signal?: AbortSignal) => {
      const response = await fetch(`/api/models`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal,
        body: JSON.stringify({
          projectName: params.projectName,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch models')
      }

      return response.json()
    },
    [],
  )

  const serverSidePluginKeysSet = true

  // Context with initial state
  const contextValue = useCreateReducer<HomeInitialState>({
    initialState,
  })

  const {
    state: {
      apiKey,
      lightMode,
      folders,
      conversations,
      selectedConversation,
      prompts,
      temperature,
      llmProviders,
      documentGroups,
      tools,
      searchTerm,
    },
    dispatch,
  } = contextValue

  const updateConversationMutation = useUpdateConversation(
    current_email as string,
    queryClient,
    course_name,
  )
  // Use effects for setting up the course metadata and models depending on the course/project
  useEffect(() => {
    // Set model after we fetch available models
    if (!llmProviders || Object.keys(llmProviders).length === 0) return
    const model = selectBestModel(llmProviders)

    dispatch({
      field: 'defaultModelId',
      value: model.id,
    })

    // Ensure current convo has a valid model
    if (selectedConversation) {
      const convo_with_valid_model = selectedConversation
      convo_with_valid_model.model = model
      dispatch({
        field: 'selectedConversation',
        value: convo_with_valid_model,
      })
    }
  }, [llmProviders])

  // ---- Set OpenAI API Key (either course-wide or from storage) ----
  useEffect(() => {
    // console.log("In useEffect for apiKey, home.tsx, apiKey: ", apiKey)
    if (!course_metadata) return
    const local_api_key = localStorage.getItem('apiKey')
    let key = ''

    if (course_metadata && course_metadata.openai_api_key) {
      // console.log(
      //   'Using key from course_metadata',
      //   course_metadata.openai_api_key,
      // )
      key = course_metadata.openai_api_key
      // setServerSideApiKeyIsSet(true)
      dispatch({
        field: 'serverSideApiKeyIsSet',
        value: true,
      })
      dispatch({ field: 'apiKey', value: '' })
      // TODO: add logging for axiom, after merging with main (to get the axiom code)
      // log.debug('Using Course-Wide OpenAI API Key', { course_metadata: { course_metadata } })
    } else if (local_api_key) {
      if (local_api_key.startsWith('sk-')) {
        console.log(
          'No openai_api_key found in course_metadata, but found one in client localStorage',
        )
        key = local_api_key

        dispatch({ field: 'apiKey', value: local_api_key })
      } else {
        console.error(
          "you have entered an API key that does not start with 'sk-', which indicates it's invalid. Please enter just the key from OpenAI starting with 'sk-'. You entered",
          apiKey,
        )
      }
    }

    const setOpenaiModel = async () => {
      // Get models available to users
      try {
        if (!course_metadata) return

        const models = await getModels({
          projectName: course_name,
        })
        dispatch({ field: 'llmProviders', value: models })
      } catch (error) {
        console.error('Error fetching models user has access to: ', error)
        dispatch({ field: 'modelError', value: getModelsError(error) })
      }
    }

    setOpenaiModel()
    setIsLoading(false)
  }, [course_metadata, apiKey])

  // ---- Set up conversations and folders ----
  // useEffect(() => {
  //   // console.log("In useEffect for selectedConversation, home.tsx, selectedConversation: ", selectedConversation)
  //   // ALWAYS make a new convo if current one isn't empty
  //   if (!selectedConversation) return
  //   if (hasMadeNewConvoAlready) return
  //   setHasMadeNewConvoAlready(true)

  //   // if (selectedConversation?.messages.length > 0) {
  //   handleNewConversation()
  //   // }
  // }, [selectedConversation, conversations])

  // useEffect(() => {
  //   if (isConversationHistoryFetched && !isLoadingConversationHistory) {
  //     // fetchData()
  //     console.log(
  //       'conversationHistory storing in react context: ',
  //       conversationHistory,
  //     )
  //     dispatch({ field: 'conversations', value: conversationHistory })
  //     // Should we save the conversation history to local storage? This usually exceeds the limit.
  //     // localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory))
  //   }
  // }, [conversationHistory])

  useEffect(() => {
    if (isFoldersFetched && !isLoadingFolders) {
      // console.log('foldersData: ', foldersData)
      dispatch({ field: 'folders', value: foldersData })
      // localStorage.setItem('folders', JSON.stringify(foldersData))
    }
  }, [foldersData])

  // FOLDER OPERATIONS  --------------------------------------------
  const handleCreateFolder = (name: string, type: FolderType) => {
    if (current_email == undefined) {
      console.error('current_email is undefined')
      return
    }

    const newFolder: FolderWithConversation = {
      id: uuidv4(),
      name,
      type,
    }

    createFolderMutation.mutate(newFolder)
  }

  const handleDeleteFolder = (folderId: string) => {
    if (current_email == undefined) {
      console.error('current_email is undefined')
      return
    }
    const deletedFolder = folders.find(
      (f) => f.id === folderId,
    ) as FolderWithConversation

    deleteFolderMutation.mutate(deletedFolder)
  }

  const handleUpdateFolder = (folderId: string, name: string) => {
    if (current_email == undefined) {
      console.error('current_email is undefined')
      return
    }

    const updatedFolder = folders.find(
      (f) => f.id === folderId,
    ) as FolderWithConversation
    updatedFolder.name = name

    updateFolderMutation.mutate(updatedFolder)
  }

  // CONVERSATION OPERATIONS  --------------------------------------------
  const handleSelectConversation = async (conversation: Conversation) => {
    dispatch({
      field: 'selectedConversation',
      value: conversation,
    })
    localStorage.setItem('selectedConversation', JSON.stringify(conversation))
    // await saveConversationToServer(conversation)
  }

  // This will ONLY update the react context and not the server
  const handleDuplicateRequest = () => {
    if (selectedConversation?.messages.length === 0) return
  }

  const handleNewConversation = () => {
    const lastConversation = conversations[conversations.length - 1]

    // Determine the model to use for the new conversation
    const model = selectBestModel(llmProviders)

    const newConversation: Conversation = {
      id: uuidv4(),
      name: t('New Conversation'),
      messages: [],
      model: model,
      prompt: DEFAULT_SYSTEM_PROMPT,
      temperature: lastConversation?.temperature ?? DEFAULT_TEMPERATURE,
      folderId: null,
      userEmail: current_email || undefined,
      projectName: course_name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const updatedConversations = [newConversation, ...conversations]

    dispatch({ field: 'selectedConversation', value: newConversation })
    dispatch({ field: 'conversations', value: updatedConversations })

    // saveConversation(newConversation)
    // saveConversations(updatedConversations)
    // saveConversationToServer(newConversation).catch((error) => {
    //   console.error('Error saving updated conversation to server:', error)
    // })

    dispatch({ field: 'loading', value: false })
  }

  const handleUpdateConversation = (
    conversation: Conversation,
    data: KeyValuePair,
  ) => {
    // If there is data that means only update selectedConversation and local storage, irrespective of user email
    // If there is no data, update the selectedConversation, local storage if user email is not set, and selectedConversation, local storage and server if user email is set

    let updatedConversation = conversation
    console.log('updating conversation with data: ', data)
    updatedConversation = {
      ...conversation,
      [data.key]: data.value,
    }

    console.log('updating conversation in local storage: ', updatedConversation)
    localStorage.setItem(
      'selectedConversation',
      JSON.stringify(updatedConversation),
    )

    dispatch({ field: 'selectedConversation', value: updatedConversation })

    const updatedConversations = conversations.map((c) => {
      if (c.id === updatedConversation.id) {
        return updatedConversation
      }

      return c
    })
    dispatch({ field: 'conversations', value: updatedConversations })
    // localStorage.setItem(
    //   'conversationHistory',
    //   JSON.stringify(updatedConversations),
    // )

    // if (data) {
    //   updatedConversation = {
    //     ...conversation,
    //     [data.key]: data.value,
    //   }

    //   localStorage.setItem(
    //     'selectedConversation',
    //     JSON.stringify(updatedConversation),
    //   )
    //   const updatedConversations = conversations.map((c) => {
    //     if (c.id === updatedConversation.id) {
    //       return updatedConversation
    //     }
    //   }
    //   )
    //   localStorage.setItem('conversations', JSON.stringify(updatedConversations))
    //   dispatch({ field: 'conversations', value: updatedConversations })
    // } else if() {

    // }
    // updateConversationMutation.mutate(updatedConversation)
    // updateConversation(updatedConversation)
    // dispatch({ field: 'selectedConversation', value: updatedConversation })
  }

  // Other context actions --------------------------------------------

  // Image to Text
  const setIsImg2TextLoading = (isImg2TextLoading: boolean) => {
    dispatch({ field: 'isImg2TextLoading', value: isImg2TextLoading })
  }

  // Routing
  const setIsRouting = (isRouting: boolean) => {
    dispatch({ field: 'isRouting', value: isRouting })
  }

  // Retrieval
  const setIsRetrievalLoading = (isRetrievalLoading: boolean) => {
    dispatch({ field: 'isRetrievalLoading', value: isRetrievalLoading })
  }

  // Update actions for a prompt
  const handleUpdateDocumentGroups = (id: string) => {
    documentGroups.map((documentGroup) =>
      documentGroup.id === id
        ? { ...documentGroup, checked: !documentGroup.checked }
        : documentGroup,
    )
    dispatch({ field: 'documentGroups', value: documentGroups })
  }

  // Update actions for a prompt
  // Fetch n8nWorkflow instead of OpenAI Compatible tools.
  const handleUpdateTools = (id: string) => {
    tools.map((tool) =>
      tool.id === id ? { ...tool, checked: !tool.enabled } : tool,
    )
    dispatch({ field: 'tools', value: tools })
  }
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [dragEnterCounter, setDragEnterCounter] = useState(0)

  const GradientIconPhoto = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="icon icon-tabler icon-tabler-photo"
      width="256"
      height="256"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="url(#gradient)"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <linearGradient id="gradient" x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#8A3FFC" />
          <stop offset="100%" stopColor="#E94057" />
        </linearGradient>
      </defs>
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <line x1="15" y1="8" x2="15.01" y2="8" />
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M4 15l4 -4a3 5 0 0 1 3 0l 4 4" />
      <path d="M14 14l1 -1a3 5 0 0 1 3 0l2 2" />
    </svg>
  )

  // EFFECTS for file drag and drop --------------------------------------------
  useEffect(() => {
    const handleDocumentDragOver = (e: DragEvent) => {
      e.preventDefault()
    }

    const handleDocumentDragEnter = (e: DragEvent) => {
      setDragEnterCounter((prev) => prev + 1)
      setIsDragging(true)
    }

    const handleDocumentDragLeave = (e: DragEvent) => {
      e.preventDefault()
      setDragEnterCounter((prev) => prev - 1)
      if (dragEnterCounter === 1 || e.relatedTarget === null) {
        setIsDragging(false)
      }
    }

    const handleDocumentDrop = (e: DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      setDragEnterCounter(0)
    }

    const handleDocumentKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDragging(false)
        setDragEnterCounter(0)
      }
    }

    const handleMouseOut = (e: MouseEvent) => {
      if (!e.relatedTarget) {
        setIsDragging(false)
        setDragEnterCounter(0)
      }
    }

    document.addEventListener('dragover', handleDocumentDragOver)
    document.addEventListener('dragenter', handleDocumentDragEnter)
    document.addEventListener('dragleave', handleDocumentDragLeave)
    document.addEventListener('drop', handleDocumentDrop)
    document.addEventListener('keydown', handleDocumentKeyDown)
    window.addEventListener('mouseout', handleMouseOut)

    return () => {
      document.removeEventListener('dragover', handleDocumentDragOver)
      document.removeEventListener('dragenter', handleDocumentDragEnter)
      document.removeEventListener('dragleave', handleDocumentDragLeave)
      document.removeEventListener('drop', handleDocumentDrop)
      document.removeEventListener('keydown', handleDocumentKeyDown)
      window.removeEventListener('mouseout', handleMouseOut)
    }
  }, [])

  useEffect(() => {
    if (window.innerWidth < 640) {
      dispatch({ field: 'showChatbar', value: false })
    }
  }, [selectedConversation])

  useEffect(() => {
    // defaultModelId &&
    //   dispatch({ field: 'defaultModelId', value: defaultModelId })
    serverSidePluginKeysSet &&
      dispatch({
        field: 'serverSidePluginKeysSet',
        value: serverSidePluginKeysSet,
      })
  }, [serverSidePluginKeysSet]) // defaultModelId,

  // ON LOAD --------------------------------------------

  useEffect(() => {
    const initialSetup = async () => {
      // console.log('current_email: ', current_email)
      console.log('isInitialSetupDone: ', isInitialSetupDone)
      if (isInitialSetupDone) return
      const settings = getSettings()
      if (settings.theme) {
        dispatch({
          field: 'lightMode',
          value: settings.theme,
        })
      }

      if (window.innerWidth < 640) {
        dispatch({ field: 'showChatbar', value: false })
        dispatch({ field: 'showPromptbar', value: false })
      }

      const showChatbar = localStorage.getItem('showChatbar')
      if (showChatbar) {
        dispatch({ field: 'showChatbar', value: showChatbar === 'true' })
      }

      const showPromptbar = localStorage.getItem('showPromptbar')
      if (showPromptbar) {
        dispatch({ field: 'showPromptbar', value: showPromptbar === 'true' })
      }

      const prompts = localStorage.getItem('prompts')
      if (prompts) {
        dispatch({ field: 'prompts', value: JSON.parse(prompts) })
      }

      const selectedConversation = localStorage.getItem('selectedConversation')
      if (selectedConversation) {
        const parsedSelectedConversation: Conversation =
          JSON.parse(selectedConversation)
        if (parsedSelectedConversation.projectName === course_name) {
          const cleanedSelectedConversation = cleanSelectedConversation(
            parsedSelectedConversation,
          )
          dispatch({
            field: 'selectedConversation',
            value: cleanedSelectedConversation,
          })
        } else {
          handleNewConversation()
        }
      } else {
        if (!llmProviders || Object.keys(llmProviders).length === 0) return
        handleNewConversation()
      }
      // handleNewConversation()
      setIsInitialSetupDone(true)
    }

    if (!isInitialSetupDone) {
      initialSetup()
    }
  }, [dispatch, llmProviders, current_email]) // ! serverSidePluginKeysSet, removed
  // }, [defaultModelId, dispatch, serverSidePluginKeysSet, models, conversations]) // original!

  if (isLoading) {
    // show blank page during loading
    return <>Loading</>
  }
  return (
    <div>
      <HomeContext.Provider
        value={{
          ...contextValue,
          handleNewConversation,
          handleCreateFolder,
          handleDeleteFolder,
          handleUpdateFolder,
          handleSelectConversation,
          handleUpdateConversation,
          setIsImg2TextLoading,
          setIsRouting,
          // setRoutingResponse,
          // setIsRunningTool,
          setIsRetrievalLoading,
          handleUpdateDocumentGroups,
          handleUpdateTools,
        }}
      >
        <Head>
          <title>UIUC.chat</title>
          <meta name="description" content="ChatGPT but better." />
          <meta
            name="viewport"
            content="height=device-height ,width=device-width, initial-scale=1, user-scalable=no"
          />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        {selectedConversation && (
          <main
            className={`flex h-screen w-screen flex-col text-sm text-white dark:text-white ${lightMode}`}
          >
            <div className="fixed top-0 w-full sm:hidden">
              <Navbar
                selectedConversation={selectedConversation}
                onNewConversation={handleDuplicateRequest}
              />
            </div>

            <div className="flex h-full w-full pt-[48px] sm:pt-0">
              {isDragging &&
                VisionCapableModels.has(
                  selectedConversation?.model.id as OpenAIModelID,
                ) && (
                  <div className="absolute inset-0 z-10 flex h-full w-full flex-col items-center justify-center bg-black opacity-75">
                    <GradientIconPhoto />
                    <span className="text-3xl font-extrabold text-white">
                      Drop your image here!
                    </span>
                  </div>
                )}
              <Chatbar current_email={current_email} courseName={course_name} />

              <div className="flex max-w-full flex-1 overflow-x-hidden">
                {course_metadata && (
                  <Chat
                    stopConversationRef={stopConversationRef}
                    courseMetadata={course_metadata}
                    courseName={course_name}
                    currentEmail={current_email}
                  />
                )}
              </div>

              <Promptbar />
            </div>
          </main>
        )}
      </HomeContext.Provider>
    </div>
  )
}
export default Home
