// src/pages/home/home.tsx
import { useEffect, useRef, useState } from 'react'

import { useTranslation } from 'next-i18next'
import Head from 'next/head'

import { useCreateReducer } from '@/hooks/useCreateReducer'

import useErrorService from '@/services/errorService'
import useApiService from '@/services/useApiService'

import {
  cleanConversationHistory,
  cleanSelectedConversation,
} from '@/utils/app/clean'
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const'
import {
  saveConversation,
  saveConversations,
  updateConversation,
} from '@/utils/app/conversation'
import { saveFolders } from '@/utils/app/folders'
import { savePrompts } from '@/utils/app/prompts'
import { getSettings } from '@/utils/app/settings'

import { type Conversation } from '@/types/chat'
import { type KeyValuePair } from '@/types/data'
import { type FolderInterface, type FolderType } from '@/types/folder'
import {
  OpenAIModel,
  OpenAIModelID,
  VisionCapableModels,
  selectBestModel,
} from '@/types/openai'
import { type Prompt } from '@/types/prompt'

import { Chat } from '@/components/Chat/Chat'
import { Chatbar } from '@/components/Chatbar/Chatbar'
import { Navbar } from '@/components/Mobile/Navbar'
import Promptbar from '@/components/Promptbar'

import HomeContext from './home.context'
import { type HomeInitialState, initialState } from './home.state'

import { v4 as uuidv4 } from 'uuid'
import { type CourseMetadata } from '~/types/courseMetadata'
import { useUser } from '@clerk/nextjs'
import { get_user_permission } from '~/components/UIUC-Components/runAuthCheck'
import { useRouter } from 'next/router'

const Home = () => {
  const { t } = useTranslation('chat')
  const { getModels } = useApiService()
  const { getModelsError } = useErrorService()
  const [isLoading, setIsLoading] = useState<boolean>(true) // Add a new state for loading

  const serverSidePluginKeysSet = true

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
    },
    dispatch,
  } = contextValue

  const stopConversationRef = useRef<boolean>(false)

  const router = useRouter()
  const course_name = router.query.course_name as string
  const curr_route_path = router.asPath as string

  const [isInitialSetupDone, setIsInitialSetupDone] = useState(false)
  const [isCourseMetadataLoading, setIsCourseMetadataLoading] = useState(true)
  const [course_metadata, setCourseMetadata] = useState<CourseMetadata | null>(
    null,
  )

  useEffect(() => {
    // Set model after we fetch available models
    if (!llmProviders || Object.keys(llmProviders).length === 0) return
    const model = selectBestModel(llmProviders, selectedConversation)

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

  useEffect(() => {
    if (!course_name && curr_route_path != '/gpt4') return
    const courseMetadata = async () => {
      setIsLoading(true) // Set loading to true before fetching data

      // Handle /gpt4 page (special non-course page)
      let curr_course_name = course_name
      if (curr_route_path == '/gpt4') {
        curr_course_name = 'gpt4'
      }

      const response = await fetch(
        `/api/UIUC-api/getCourseMetadata?course_name=${curr_course_name}`,
      )
      const data = await response.json()
      setCourseMetadata(data.course_metadata)
      // console.log("Course Metadata in home: ", data.course_metadata)
      setIsCourseMetadataLoading(false)
      // setIsLoading(false) // Set loading to false after fetching data
    }
    courseMetadata()
  }, [course_name])

  const [hasMadeNewConvoAlready, setHasMadeNewConvoAlready] = useState(false)
  useEffect(() => {
    // console.log("In useEffect for selectedConversation, home.tsx, selectedConversation: ", selectedConversation)
    // ALWAYS make a new convo if current one isn't empty
    if (!selectedConversation) return
    if (hasMadeNewConvoAlready) return
    setHasMadeNewConvoAlready(true)

    if (selectedConversation?.messages.length > 0) {
      handleNewConversation()
    }
  }, [selectedConversation, conversations])

  const clerk_user_outer = useUser()

  useEffect(() => {
    if (!clerk_user_outer.isLoaded || isCourseMetadataLoading) {
      return
    }
    if (clerk_user_outer.isLoaded || isCourseMetadataLoading) {
      if (course_metadata != null) {
        const permission_str = get_user_permission(
          course_metadata,
          clerk_user_outer,
          router,
        )

        if (permission_str == 'edit' || permission_str == 'view') {
        } else {
          router.replace(`/${course_name}/not_authorized`)
        }
      } else {
        // 🆕 MAKE A NEW COURSE
        console.log('Course does not exist, redirecting to materials page')
        router.push(`/${course_name}/materials`)
      }
    }
  }, [clerk_user_outer.isLoaded, isCourseMetadataLoading])
  // ------------------- 👆 MOST BASIC AUTH CHECK 👆 -------------------

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
          openAIApiKey: key || undefined,
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

  // FOLDER OPERATIONS  --------------------------------------------

  const handleSelectConversation = (conversation: Conversation) => {
    dispatch({
      field: 'selectedConversation',
      value: conversation,
    })

    saveConversation(conversation)
  }

  const handleCreateFolder = (name: string, type: FolderType) => {
    const newFolder: FolderInterface = {
      id: uuidv4(),
      name,
      type,
    }

    const updatedFolders = [...folders, newFolder]

    dispatch({ field: 'folders', value: updatedFolders })
    saveFolders(updatedFolders)
  }

  const handleDeleteFolder = (folderId: string) => {
    const updatedFolders = folders.filter((f) => f.id !== folderId)
    dispatch({ field: 'folders', value: updatedFolders })
    saveFolders(updatedFolders)

    const updatedConversations: Conversation[] = conversations.map((c) => {
      if (c.folderId === folderId) {
        return {
          ...c,
          folderId: null,
        }
      }

      return c
    })

    dispatch({ field: 'conversations', value: updatedConversations })
    saveConversations(updatedConversations)

    const updatedPrompts: Prompt[] = prompts.map((p) => {
      if (p.folderId === folderId) {
        return {
          ...p,
          folderId: null,
        }
      }

      return p
    })

    dispatch({ field: 'prompts', value: updatedPrompts })
    savePrompts(updatedPrompts)
  }

  const handleUpdateFolder = (folderId: string, name: string) => {
    const updatedFolders = folders.map((f) => {
      if (f.id === folderId) {
        return {
          ...f,
          name,
        }
      }

      return f
    })

    dispatch({ field: 'folders', value: updatedFolders })

    saveFolders(updatedFolders)
  }

  // CONVERSATION OPERATIONS  --------------------------------------------

  const handleNewConversation = () => {
    const lastConversation = conversations[conversations.length - 1]

    // Determine the model to use for the new conversation
    const model = selectBestModel(llmProviders, lastConversation)

    const newConversation: Conversation = {
      id: uuidv4(),
      name: t('New Conversation'),
      messages: [],
      model: model,
      prompt: DEFAULT_SYSTEM_PROMPT,
      temperature: lastConversation?.temperature ?? DEFAULT_TEMPERATURE,
      folderId: null,
    }

    const updatedConversations = [...conversations, newConversation]

    dispatch({ field: 'selectedConversation', value: newConversation })
    dispatch({ field: 'conversations', value: updatedConversations })

    saveConversation(newConversation)
    saveConversations(updatedConversations)

    dispatch({ field: 'loading', value: false })
  }

  const handleUpdateConversation = (
    conversation: Conversation,
    data: KeyValuePair,
  ) => {
    const updatedConversation = {
      ...conversation,
      [data.key]: data.value,
    }

    const { single, all } = updateConversation(
      updatedConversation,
      conversations,
    )

    dispatch({ field: 'selectedConversation', value: single })
    dispatch({ field: 'conversations', value: all })
  }

  // Image to Text
  const setIsImg2TextLoading = (isImg2TextLoading: boolean) => {
    dispatch({ field: 'isImg2TextLoading', value: isImg2TextLoading })
  }

  // Routing
  const setIsRouting = (isRouting: boolean) => {
    dispatch({ field: 'isRouting', value: isRouting })
  }

  // Routing Response
  // const setRoutingResponse = (routingResponse: RoutingResponse) => {
  //   dispatch({ field: 'routingResponse', value: routingResponse })
  // }

  // Pest Detection
  // const setIsRunningTool = (isRunningTool: boolean) => {
  //   dispatch({ field: 'isRunningTool', value: isRunningTool })
  // }

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

  // EFFECTS  --------------------------------------------
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

    const folders = localStorage.getItem('folders')
    if (folders) {
      dispatch({ field: 'folders', value: JSON.parse(folders) })
    }

    const prompts = localStorage.getItem('prompts')
    if (prompts) {
      dispatch({ field: 'prompts', value: JSON.parse(prompts) })
    }

    const conversationHistory = localStorage.getItem('conversationHistory')
    if (conversationHistory) {
      const parsedConversationHistory: Conversation[] =
        JSON.parse(conversationHistory)
      const cleanedConversationHistory = cleanConversationHistory(
        parsedConversationHistory,
      )

      dispatch({ field: 'conversations', value: cleanedConversationHistory })
    }

    const selectedConversation = localStorage.getItem('selectedConversation')
    // console.log('selectedConversation in localStorage', selectedConversation)
    if (selectedConversation) {
      const parsedSelectedConversation: Conversation =
        JSON.parse(selectedConversation)
      const cleanedSelectedConversation = cleanSelectedConversation(
        parsedSelectedConversation,
      )

      dispatch({
        field: 'selectedConversation',
        value: cleanedSelectedConversation,
      })
    } else {
      const lastConversation = conversations[conversations.length - 1]
      if (!llmProviders || Object.keys(llmProviders).length === 0) return
      const bestModel = selectBestModel(llmProviders, lastConversation)
      dispatch({
        field: 'selectedConversation',
        value: {
          id: uuidv4(),
          name: t('New Conversation'),
          messages: [],
          model: bestModel,
          prompt: DEFAULT_SYSTEM_PROMPT,
          temperature: lastConversation?.temperature ?? DEFAULT_TEMPERATURE,
          folderId: null,
        },
      })
    }
    setIsInitialSetupDone(true)
  }, [dispatch, llmProviders, conversations, isInitialSetupDone]) // ! serverSidePluginKeysSet, removed
  // }, [defaultModelId, dispatch, serverSidePluginKeysSet, models, conversations]) // original!

  if (isLoading) {
    // show blank page during loading
    return <></>
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
                onNewConversation={handleNewConversation}
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
              <Chatbar />

              <div className="flex max-w-full flex-1 overflow-x-hidden">
                {course_metadata && (
                  <Chat
                    stopConversationRef={stopConversationRef}
                    courseMetadata={course_metadata}
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
