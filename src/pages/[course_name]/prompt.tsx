// src/pages/[course_name]/prompt.tsx
'use client'
import { type NextPage } from 'next'
import { Montserrat } from 'next/font/google'
import { useRouter } from 'next/router'
import React, { useEffect, useRef, useState } from 'react'
import MakeNewCoursePage from '~/components/UIUC-Components/MakeNewCoursePage'

import {
  Button,
  Card,
  Collapse,
  Divider,
  Flex,
  Group,
  Image,
  Indicator,
  List,
  Modal,
  Paper,
  Select,
  Text,
  Textarea,
  Title,
  Tooltip,
  useMantineTheme,
  type MantineTheme,
} from '@mantine/core'
import { useAuth } from 'react-oidc-context'
import { AuthComponent } from '~/components/UIUC-Components/AuthToEditCourse'
import { CannotEditGPT4Page } from '~/components/UIUC-Components/CannotEditGPT4'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import {
  LoadingPlaceholderForAdminPages,
  MainPageBackground,
} from '~/components/UIUC-Components/MainPageBackground'

import { useDisclosure, useMediaQuery } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconAlertTriangle,
  IconAlertTriangleFilled,
  IconBook,
  IconCheck,
  IconChevronDown,
  IconExternalLink,
  IconInfoCircle,
  IconLayoutSidebarRight,
  IconLayoutSidebarRightExpand,
  IconLink,
  IconSparkles,
} from '@tabler/icons-react'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { useDebouncedCallback } from 'use-debounce'
import { v4 as uuidv4 } from 'uuid'
import CustomCopyButton from '~/components/Buttons/CustomCopyButton'
import { getModelLogo } from '~/components/Chat/ModelSelect'
import SettingsLayout, {
  getInitialCollapsedState,
} from '~/components/Layout/SettingsLayout'
import { LinkGeneratorModal } from '~/components/Modals/LinkGeneratorModal'
import CustomSwitch from '~/components/Switches/CustomSwitch'
import { findDefaultModel } from '~/components/UIUC-Components/api-inputs/LLMsApiKeyInputForm'
import { type ChatBody } from '~/types/chat'
import { type CourseMetadata } from '~/types/courseMetadata'
import { callSetCourseMetadata } from '~/utils/apiUtils'
import {
  DEFAULT_SYSTEM_PROMPT,
  DOCUMENT_FOCUS_PROMPT,
  GUIDED_LEARNING_PROMPT,
} from '~/utils/app/const'
import {
  recommendedModelIds,
  warningLargeModelIds,
} from '~/utils/modelProviders/ConfigWebLLM'
import {
  LLM_PROVIDER_ORDER,
  ProviderNames,
  ReasoningCapableModels,
  type AllLLMProviders,
  type AnySupportedModel,
} from '~/utils/modelProviders/LLMProvider'
import { type AnthropicModel } from '~/utils/modelProviders/types/anthropic'
import { useResponsiveCardWidth } from '~/utils/responsiveGrid'
import GlobalFooter from '../../components/UIUC-Components/GlobalFooter'

const montserrat = Montserrat({
  weight: '700',
  subsets: ['latin'],
})

type PartialCourseMetadata = {
  [K in keyof CourseMetadata]?: CourseMetadata[K]
}

interface LLMModel {
  id: string
  name: string
  enabled: boolean
}

interface LLMConfig {
  enabled: boolean
  apiKey?: string
  models?: LLMModel[]
}

interface LLMProviders {
  [key: string]: LLMConfig
}

interface ModelOption {
  group: ProviderNames
  value: string
  label: string
}

const getProviderFromModel = (
  modelId: string,
  modelOptions: ModelOption[],
): ProviderNames => {
  if (!modelId || !modelOptions.length) return ProviderNames.OpenAI // default fallback

  const selectedOption = modelOptions.find((option) => option.value === modelId)
  return selectedOption?.group || ProviderNames.OpenAI
}

const isApiKeyRequired = (provider: ProviderNames): boolean => {
  const providersRequiringApiKey = [
    ProviderNames.OpenAI,
    ProviderNames.Anthropic,
    ProviderNames.Azure,
    ProviderNames.Gemini,
    ProviderNames.Bedrock,
  ]
  return providersRequiringApiKey.includes(provider)
}

const CourseMain: NextPage = () => {
  const theme = useMantineTheme()
  const router = useRouter()

  const GetCurrentPageName = () => {
    return router.query.course_name as string
  }
  const isSmallScreen = useMediaQuery('(max-width: 1280px)')
  const course_name = GetCurrentPageName() as string

  const auth = useAuth()
  const isLoaded = !auth.isLoading
  const isSignedIn = auth.isAuthenticated
  const user = auth.user
  const [courseExists, setCourseExists] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [courseMetadata, setCourseMetadata] = useState<CourseMetadata | null>(
    null,
  )
  const [baseSystemPrompt, setBaseSystemPrompt] = useState('')
  const [optimizedSystemPrompt, setOptimizedSystemPrompt] = useState('')
  const [isRightSideVisible, setIsRightSideVisible] = useState(true)
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [opened, { close, open }] = useDisclosure(false)
  const [resetModalOpened, { close: closeResetModal, open: openResetModal }] =
    useDisclosure(false)
  const [llmProviders, setLLMProviders] = useState<any>(null)
  const [
    linkGeneratorOpened,
    { open: openLinkGenerator, close: closeLinkGenerator },
  ] = useDisclosure(false)
  const [messages, setMessages] = useState<
    Array<{ role: string; content: string }>
  >([])
  const [input, setInput] = useState(baseSystemPrompt)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    getInitialCollapsedState(),
  )

  // Get responsive card width classes based on sidebar state
  const cardWidthClasses = useResponsiveCardWidth(sidebarCollapsed)

  const removeThinkSections = (text: string): string => {
    const cleanedText = text.replace(/<think>[\s\S]*?<\/think>/g, '')

    return cleanedText.replace(/<\/?think>/g, '').trim()
  }

  const modelOptions = llmProviders
    ? Object.entries(llmProviders as AllLLMProviders)
        // Sort by LLM_PROVIDER_ORDER
        .sort(([providerA], [providerB]) => {
          const indexA = LLM_PROVIDER_ORDER.indexOf(providerA as ProviderNames)
          const indexB = LLM_PROVIDER_ORDER.indexOf(providerB as ProviderNames)
          // Providers not in the order list will be placed at the end
          if (indexA === -1) return 1
          if (indexB === -1) return -1
          return indexA - indexB
        })
        .flatMap(([provider, config]) =>
          config.enabled && config.models && provider !== 'WebLLM'
            ? config.models
                .filter((model) => model.enabled)
                .filter((model) => model.id !== 'learnlm-1.5-pro-experimental')
                .map((model: AnySupportedModel) => ({
                  group: provider as ProviderNames,
                  value: model.id,
                  label: model.name,
                  modelId: model.id,
                  selectedModelId: selectedModel,
                  modelType: provider,
                  // @ts-ignore -- this being missing is fine
                  downloadSize: model?.downloadSize,
                  // @ts-ignore -- this being missing is fine
                  vram_required_MB: model?.vram_required_MB,
                  extendedThinking:
                    (model as AnthropicModel)?.extendedThinking || false,
                }))
            : [],
        )
    : []

  const handleSubmitPromptOptimization = async (e: any) => {
    e.preventDefault()
    setIsOptimizing(true)
    setMessages([])

    try {
      if (!llmProviders) {
        showToastNotification(
          theme,
          'Configuration Error',
          'The Optimize System Prompt feature requires provider configuration to be loaded. Please refresh the page and try again.',
          true,
        )
        return
      }

      const provider = getProviderFromModel(selectedModel, modelOptions)
      if (!llmProviders[provider]?.enabled) {
        showToastNotification(
          theme,
          `${provider} Required`,
          `The Optimize System Prompt feature requires ${provider} to be enabled. Please enable ${provider} on the LLM page in your course settings to use this feature.`,
          true,
        )
        return
      }

      if (isApiKeyRequired(provider)) {
        if (provider === 'Bedrock') {
          if (
            !llmProviders[provider]?.accessKeyId ||
            !llmProviders[provider]?.secretAccessKey ||
            !llmProviders[provider]?.region
          ) {
            showToastNotification(
              theme,
              `${provider} Credentials Required`,
              `The Optimize System Prompt feature requires AWS credentials (Access Key ID, Secret Access Key, and Region). Please add your AWS credentials on the LLM page in your course settings to use this feature.`,
              true,
            )
            return
          }
        } else if (!llmProviders[provider]?.apiKey) {
          showToastNotification(
            theme,
            `${provider} API Key Required`,
            `The Optimize System Prompt feature requires a ${provider} API key. Please add your ${provider} API key on the LLM page in your course settings to use this feature.`,
            true,
          )
          return
        }
      }
      const systemPrompt = `You are an expert prompt engineer specializing in optimizing prompts with the ability to handle various different use cases. Your task is to analyze and enhance the provided system prompt while preserving its core functionality and improving its effectiveness.

Key Objectives:

1. Core Functionality Analysis:
   - Identify the primary purpose and key behaviors specified in the prompt
   - Determine if the prompt involves document/RAG interactions
   - Recognize any special modes (e.g., guided learning, document-only)
   - Map out any specific output format requirements

2. Educational Enhancement:
   - Strengthen pedagogical elements if present
   - Add clear reasoning steps where appropriate
   - Ensure explanations precede conclusions
   - Maintain academic integrity guidelines if specified

3. RAG Integration (OPTIONAL, ONLY IF APPLICABLE):
   - Optimize document reference and citation patterns
   - Enhance context retrieval instructions
   - Improve document summarization guidelines
   - Add safeguards against hallucination

4. Prompt Structure Optimization:
   - Organize instructions in a clear, logical flow
   - Remove redundancy while preserving distinct requirements
   - Add explicit step-by-step breakdowns where helpful
   - Create smooth transitions between different behaviors

5. Output Quality Assurance:
   - Specify clear formatting requirements
   - Add validation steps for responses
   - Include error handling guidelines
   - Define success criteria

6. Behavioral Calibration:
   - Adjust tone and formality to match educational context
   - Balance helpfulness with academic integrity
   - Maintain consistent personality throughout interactions
   - Preserve any specific behavioral constraints

7. Technical Requirements:
   - Keep all special syntax and formatting intact
   - Preserve any API-specific formatting
   - Maintain compatibility with UIUC.chat's citation system (OPTIONAL, ONLY IF APPLICABLE and mentioned in the original prompt)
   - Ensure proper handling of code blocks and markdown

Output Format:
Return ONLY the optimized system prompt with no additional commentary. The prompt should follow this structure:
1. Core role and purpose statement
2. Primary behavioral guidelines
3. Document interaction rules (OPTIONAL, ONLY IF APPLICABLE)
4. Step-by-step instruction flow
5. Output format requirements
6. Special mode handling (OPTIONAL, ONLY IF APPLICABLE)

CRITICAL: The optimized prompt must:
- Preserve ALL core functionality from the original
- Enhance clarity and effectiveness
- Maintain compatibility with UIUC.chat's features (OPTIONAL, ONLY IF APPLICABLE and mentioned in the original prompt)
- Support both RAG and non-RAG interactions appropriately
- Keep any existing citation or formatting requirements
- SHOULD NOT MENTION SPECIAL MODE HANDLING OR OPTIONAL SECTIONS IF THEY ARE NOT EXPLICITLY PRESENT IN THE ORIGINAL PROMPT
- be concise and NOT include any special mode handling or optional sections unless they are explicitly present in the original prompt`

      const chatBody: ChatBody = {
        conversation: {
          id: uuidv4(),
          name: 'Prompt Optimization',
          messages: [
            {
              id: uuidv4(),
              role: 'system',
              content: systemPrompt,
            },
            {
              id: uuidv4(),
              role: 'user',
              content: baseSystemPrompt,
            },
          ],
          model: {
            id: selectedModel || 'gpt-4',
            name:
              modelOptions.find((opt) => opt.value === selectedModel)?.label ||
              'GPT-4',
            tokenLimit: 8192,
            enabled: true,
            extendedThinking:
              modelOptions.find((opt) => opt.value === selectedModel)
                ?.extendedThinking || false,
          },
          prompt: baseSystemPrompt,
          temperature: 0.1,
          folderId: null,
          userEmail: user?.profile?.email,
        },
        llmProviders: llmProviders,
        course_name: course_name,
        mode: 'optimize_prompt',
        stream: true,
        key: '',
      }

      const response = await fetch('/api/allNewRoutingChat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chatBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        showToastNotification(
          theme,
          'Error',
          errorData.error || 'Failed to optimize prompt',
          true,
        )
        return
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No reader available')
      }

      let optimizedPrompt = ''
      const decoder = new TextDecoder()
      let isFirstChunk = true

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        optimizedPrompt += chunk

        // Open modal and update UI state on first chunk of content
        if (isFirstChunk && chunk.trim()) {
          isFirstChunk = false
          open()
          setIsOptimizing(false)
        }

        // Check if we're using a model that supports thinking tags
        // Process the optimized prompt to remove <think> sections if using DeepSeek
        const processedPrompt = ReasoningCapableModels.has(selectedModel as any)
          ? removeThinkSections(optimizedPrompt)
          : optimizedPrompt

        // Update messages state for real-time display
        setMessages([{ role: 'assistant', content: processedPrompt }])
      }
    } catch (error) {
      console.error('Error optimizing prompt:', error)
      showToastNotification(
        theme,
        'Error',
        'Failed to optimize prompt. Please try again.',
        true,
      )
      setIsOptimizing(false) // Keep this here for error cases
    }
  }

  useEffect(() => {
    if (llmProviders) {
      const defaultModel = findDefaultModel(llmProviders as AllLLMProviders)
      if (defaultModel) {
        setSelectedModel(defaultModel.id)
      }
    }
  }, [llmProviders])

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await fetch('/api/models', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ projectName: course_name }),
        })
        if (!response.ok) throw new Error('Failed to fetch providers')
        const providers = await response.json()
        setLLMProviders(providers)
      } catch (error) {
        console.error('Error fetching LLM providers:', error)
      }
    }
    if (course_name) {
      fetchProviders()
    }
  }, [course_name])
  // Updated state variables for checkboxes
  const [guidedLearning, setGuidedLearning] = useState(false)
  const [documentsOnly, setDocumentsOnly] = useState(false)
  const [systemPromptOnly, setSystemPromptOnly] = useState(false)
  const [vectorSearchRewrite, setVectorSearchRewrite] = useState(false)
  const [insightsOpen, setInsightsOpen] = useState(false)

  const courseMetadataRef = useRef<CourseMetadata | null>(null)

  useEffect(() => {
    courseMetadataRef.current = courseMetadata
  }, [courseMetadata])

  useEffect(() => {
    const fetchCourseData = async () => {
      if (course_name === undefined) {
        return
      }
      const response = await fetch(
        `/api/UIUC-api/getCourseExists?course_name=${course_name}`,
      )
      const data = await response.json()
      setCourseExists(data)
      const response_metadata = await fetch(
        `/api/UIUC-api/getCourseMetadata?course_name=${course_name}`,
      )
      const fetchedMetadata = (await response_metadata.json()).course_metadata
      setCourseMetadata(fetchedMetadata)
      setBaseSystemPrompt(
        fetchedMetadata.system_prompt ?? DEFAULT_SYSTEM_PROMPT ?? '',
      )

      // Initialize all state variables
      setGuidedLearning(fetchedMetadata.guidedLearning || false)
      setDocumentsOnly(fetchedMetadata.documentsOnly || false)
      setSystemPromptOnly(fetchedMetadata.systemPromptOnly || false)
      setVectorSearchRewrite(!fetchedMetadata.vector_search_rewrite_disabled)

      setIsLoading(false)
    }
    fetchCourseData()
  }, [router.isReady, course_name])

  useEffect(() => {
    setInput(baseSystemPrompt)
  }, [baseSystemPrompt])

  const handleSystemPromptSubmit = async (
    newSystemPrompt: string | undefined,
  ) => {
    let success = false
    if (courseMetadata && course_name) {
      const updatedCourseMetadata = {
        ...courseMetadata,
        system_prompt: newSystemPrompt, // Keep as is, whether it's an empty string or undefined
        guidedLearning,
        documentsOnly,
        systemPromptOnly,
      }
      success = await callSetCourseMetadata(course_name, updatedCourseMetadata)
      if (success) {
        setCourseMetadata(updatedCourseMetadata)
      }
    }
    if (!success) {
      console.log('Error updating course metadata')
      showToastOnPromptUpdate(theme, true)
    } else {
      showToastOnPromptUpdate(theme)
    }
  }

  const resetSystemPrompt = async () => {
    if (courseMetadata && course_name) {
      const updatedCourseMetadata = {
        ...courseMetadata,
        system_prompt: null, // Explicitly set to undefined
        guidedLearning: false,
        documentsOnly: false,
        systemPromptOnly: false,
      }
      const success = await callSetCourseMetadata(
        course_name,
        updatedCourseMetadata,
      )
      if (!success) {
        alert('Error resetting system prompt')
        showToastOnPromptUpdate(theme, true, true)
      } else {
        setBaseSystemPrompt(DEFAULT_SYSTEM_PROMPT ?? '')
        setCourseMetadata(updatedCourseMetadata)
        setGuidedLearning(false)
        setDocumentsOnly(false)
        setSystemPromptOnly(false)
        showToastOnPromptUpdate(theme, false, true)
      }
    } else {
      alert('Error resetting system prompt')
    }
  }

  const updateSystemPrompt = (updatedFields: Partial<CourseMetadata>) => {
    let newPrompt = baseSystemPrompt

    // Handle Guided Learning prompt
    if (updatedFields.guidedLearning !== undefined) {
      if (updatedFields.guidedLearning) {
        if (!newPrompt.includes(GUIDED_LEARNING_PROMPT)) {
          newPrompt += GUIDED_LEARNING_PROMPT
        }
      } else {
        newPrompt = newPrompt.replace(GUIDED_LEARNING_PROMPT, '')
      }
    }

    // Handle Documents Only prompt
    if (updatedFields.documentsOnly !== undefined) {
      if (updatedFields.documentsOnly) {
        if (!newPrompt.includes(DOCUMENT_FOCUS_PROMPT)) {
          newPrompt += DOCUMENT_FOCUS_PROMPT
        }
      } else {
        newPrompt = newPrompt.replace(DOCUMENT_FOCUS_PROMPT, '')
      }
    }

    return newPrompt
  }

  // Track initial state of switches
  const initialSwitchStateRef = useRef<{
    guidedLearning: boolean
    documentsOnly: boolean
    systemPromptOnly: boolean
    vectorSearchRewrite: boolean
  }>({
    guidedLearning: false,
    documentsOnly: false,
    systemPromptOnly: false,
    vectorSearchRewrite: false,
  })

  useEffect(() => {
    if (courseMetadata) {
      initialSwitchStateRef.current = {
        guidedLearning: courseMetadata.guidedLearning || false,
        documentsOnly: courseMetadata.documentsOnly || false,
        systemPromptOnly: courseMetadata.systemPromptOnly || false,
        vectorSearchRewrite: !courseMetadata.vector_search_rewrite_disabled,
      }
    }
  }, [courseMetadata])

  const saveSettings = async () => {
    if (!courseMetadataRef.current || !course_name) return

    const currentSwitchState = {
      guidedLearning,
      documentsOnly,
      systemPromptOnly,
      vectorSearchRewrite,
    }

    const initialSwitchState = initialSwitchStateRef.current

    const hasChanges = (
      Object.keys(currentSwitchState) as Array<keyof typeof currentSwitchState>
    ).some((key) => currentSwitchState[key] !== initialSwitchState[key])

    if (!hasChanges) {
      return
    }

    const updatedMetadata = {
      ...courseMetadataRef.current,
      guidedLearning,
      documentsOnly,
      systemPromptOnly,
      vector_search_rewrite_disabled: !vectorSearchRewrite,
    } as CourseMetadata

    try {
      const success = await callSetCourseMetadata(course_name, updatedMetadata)
      if (!success) {
        showToastNotification(theme, 'Error', 'Failed to update settings', true)
        return
      }

      setCourseMetadata(updatedMetadata)
      initialSwitchStateRef.current = currentSwitchState

      const changes: string[] = []
      if (
        initialSwitchState.vectorSearchRewrite !==
        currentSwitchState.vectorSearchRewrite
      ) {
        changes.push(
          `Smart Document Search ${currentSwitchState.vectorSearchRewrite ? 'enabled' : 'disabled'}`,
        )
      }
      if (
        initialSwitchState.guidedLearning !== currentSwitchState.guidedLearning
      ) {
        changes.push(
          `Guided Learning ${currentSwitchState.guidedLearning ? 'enabled' : 'disabled'}`,
        )
      }
      if (
        initialSwitchState.documentsOnly !== currentSwitchState.documentsOnly
      ) {
        changes.push(
          `Document-Based References Only ${currentSwitchState.documentsOnly ? 'enabled' : 'disabled'}`,
        )
      }
      if (
        initialSwitchState.systemPromptOnly !==
        currentSwitchState.systemPromptOnly
      ) {
        changes.push(
          `Bypass UIUC.chat's internal prompting ${currentSwitchState.systemPromptOnly ? 'enabled' : 'disabled'}`,
        )
      }

      if (changes.length > 0) {
        showToastNotification(
          theme,
          changes.join(' & '),
          'Settings have been saved successfully',
          false,
        )
      }
    } catch (error) {
      console.error('Error updating course settings:', error)
      showToastNotification(theme, 'Error', 'Failed to update settings', true)
    }
  }

  const debouncedSaveSettings = useDebouncedCallback(saveSettings, 500)

  const handleSettingChange = (updates: PartialCourseMetadata) => {
    if (!courseMetadata) return

    if ('vector_search_rewrite_disabled' in updates) {
      setVectorSearchRewrite(!updates.vector_search_rewrite_disabled)
    }

    courseMetadataRef.current = {
      ...courseMetadataRef.current!,
      ...updates,
    } as CourseMetadata

    debouncedSaveSettings()
  }

  const handleCheckboxChange = async (updatedFields: PartialCourseMetadata) => {
    if (!courseMetadata || !course_name) {
      showToastNotification(theme, 'Error', 'Failed to update settings', true)
      return
    }

    if ('guidedLearning' in updatedFields)
      setGuidedLearning(updatedFields.guidedLearning!)
    if ('documentsOnly' in updatedFields)
      setDocumentsOnly(updatedFields.documentsOnly!)
    if ('systemPromptOnly' in updatedFields)
      setSystemPromptOnly(updatedFields.systemPromptOnly!)

    const newSystemPrompt = updateSystemPrompt(updatedFields)
    setBaseSystemPrompt(newSystemPrompt)

    courseMetadataRef.current = {
      ...courseMetadataRef.current!,
      ...updatedFields,
      system_prompt: newSystemPrompt,
    } as CourseMetadata

    debouncedSaveSettings()
  }

  const handleCopyDefaultPrompt = async () => {
    try {
      const response = await fetch('/api/getDefaultPostPrompt')
      if (!response.ok) {
        const errorMessage = `Failed to fetch default prompt: ${response.status} ${response.statusText}`
        console.error(errorMessage)
        throw new Error(errorMessage)
      }
      const data = await response.json()
      const defaultPostPrompt = data.prompt

      navigator.clipboard
        .writeText(defaultPostPrompt)
        .then(() => {
          showToastNotification(
            theme,
            'Copied',
            'Default post prompt system prompt copied to clipboard',
          )
        })
        .catch((err) => {
          console.error('Could not copy text: ', err)
          showToastNotification(
            theme,
            'Error Copying',
            'Could not copy text to clipboard',
            true,
          )
        })
    } catch (error) {
      console.error('Error fetching default prompt:', error)
      showToastNotification(
        theme,
        'Error Fetching',
        'Could not fetch default prompt',
        true,
      )
    }
  }

  if (!isLoaded || isLoading) {
    return <LoadingPlaceholderForAdminPages />
  }

  if (!isSignedIn) {
    console.log('User not logged in', isSignedIn, isLoaded, course_name)
    return <AuthComponent course_name={course_name} />
  }

  const user_emails = user?.profile?.email ? [user.profile.email] : []

  // if their account is somehow broken (with no email address)
  if (user_emails.length == 0) {
    return (
      <MainPageBackground>
        <Title
          className={montserrat.className}
          variant="gradient"
          gradient={{ from: 'gold', to: 'white', deg: 50 }}
          order={3}
          p="xl"
          style={{ marginTop: '4rem' }}
        >
          You&apos;ve encountered a software bug!<br></br>Your account has no
          email address. Please shoot me an email so I can fix it for you:{' '}
          <a className="goldUnderline" href="mailto:rohan13@illinois.edu">
            rohan13@illinois.edu
          </a>
        </Title>
      </MainPageBackground>
    )
  }

  // Don't edit certain special pages (no context allowed)
  if (
    course_name.toLowerCase() == 'gpt4' ||
    course_name.toLowerCase() == 'global' ||
    course_name.toLowerCase() == 'extreme'
  ) {
    return <CannotEditGPT4Page course_name={course_name as string} />
  }

  if (courseExists === null) {
    return (
      <MainPageBackground>
        <LoadingSpinner />
      </MainPageBackground>
    )
  }

  if (courseExists === false) {
    return (
      <MakeNewCoursePage
        project_name={course_name as string}
        current_user_email={user_emails[0] as string}
      />
    )
  }

  return (
    <SettingsLayout
      course_name={course_name}
      sidebarCollapsed={sidebarCollapsed}
      setSidebarCollapsed={setSidebarCollapsed}
    >
      <main className="course-page-main min-w-screen flex min-h-screen flex-col items-center">
        <div className="items-left flex w-full flex-col justify-center py-0">
          <Flex direction="column" align="center" w="100%">
            <Card
              withBorder
              padding="none"
              radius="xl"
              className={`mt-[2%] ${cardWidthClasses}`}
              style={{
                backgroundColor: 'var(--background)',
                borderColor: 'var(--dashboard-border)',
              }}
            >
              <Flex direction={isSmallScreen ? 'column' : 'row'}>
                <div
                  style={{
                    flex: isSmallScreen ? '1 1 100%' : '1 1 60%',
                    border: 'None',
                    color: 'white',
                  }}
                  className="min-h-full bg-[--background]"
                >
                  <div className="w-full px-4 py-3 sm:px-6 sm:py-4 md:px-8">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <Title
                          order={2}
                          className={`${montserrat_heading.variable} font-montserratHeading text-lg text-[--foreground] sm:text-2xl`}
                        >
                          Prompting
                        </Title>
                        <Text className="text-[--foreground]">/</Text>
                        <Title
                          order={3}
                          className={`${montserrat_heading.variable} min-w-0 font-montserratHeading text-base text-[--illinois-orange] sm:text-xl ${
                            course_name.length > 40
                              ? 'max-w-[120px] truncate sm:max-w-[300px] lg:max-w-[400px]'
                              : ''
                          }`}
                        >
                          {course_name}
                        </Title>
                      </div>
                    </div>
                  </div>
                  {/* Left Section Content */}
                  <div
                    style={{
                      padding: '1rem',
                      color: 'white',
                      alignItems: 'center',
                    }}
                    className="min-h-full justify-center"
                  >
                    <div className="card flex h-full flex-col">
                      <Group
                        m="0rem"
                        align="center"
                        variant="column"
                        className={cardWidthClasses}
                        style={{
                          justifyContent: 'center',
                          alignSelf: 'center',
                          overflow: 'hidden',
                        }}
                      >
                        {/* Prompt Engineering Guide */}
                        <Paper
                          className="w-full rounded-xl bg-[--dashboard-background-faded] px-4 sm:px-6 md:px-8"
                          p="md"
                          sx={{
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          onClick={() => setInsightsOpen(!insightsOpen)}
                        >
                          <Flex
                            align="center"
                            justify="space-between"
                            sx={{
                              padding: '4px 8px',
                              borderRadius: '8px',
                            }}
                          >
                            <Flex align="center" gap="md">
                              <IconBook
                                size={24}
                                style={{
                                  color: 'var(--dashboard-button)',
                                }}
                              />
                              <Text
                                size="md"
                                weight={600}
                                className={`${montserrat_paragraph.variable} select-text font-montserratParagraph text-[--dashboard-foreground]`}
                              >
                                Prompt Engineering Guide
                              </Text>
                            </Flex>
                            <div
                              className="transition-transform duration-200"
                              style={{
                                transform: insightsOpen
                                  ? 'rotate(180deg)'
                                  : 'rotate(0deg)',
                                color: 'var(--dashboard-foreground)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <IconChevronDown size={24} />
                            </div>
                          </Flex>

                          <Collapse in={insightsOpen} transitionDuration={200}>
                            <div className="mt-4 px-2 text-[--dashboard-foreground]">
                              <Text
                                size="md"
                                className={`${montserrat_paragraph.variable} select-text font-montserratParagraph`}
                              >
                                For additional insights and best practices on
                                prompt creation, please review:
                                <List
                                  withPadding
                                  className="mt-2"
                                  spacing="sm"
                                  icon={
                                    <div
                                      style={{
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        backgroundColor:
                                          'var(--dashboard-foreground)',
                                        marginTop: '8px',
                                      }}
                                    />
                                  }
                                >
                                  <List.Item>
                                    <a
                                      className={`text-sm text-[--dashboard-button] transition-colors duration-200 hover:text-[--dashboard-button-hover] ${montserrat_paragraph.variable} font-montserratParagraph`}
                                      href="https://platform.openai.com/docs/guides/prompt-engineering"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      The Official OpenAI Prompt Engineering
                                      Guide
                                      <IconExternalLink
                                        size={18}
                                        className="inline-block pl-1"
                                        style={{
                                          position: 'relative',
                                          top: '-2px',
                                        }}
                                      />
                                    </a>
                                  </List.Item>
                                  <List.Item>
                                    <a
                                      className={`text-sm text-[--dashboard-button] transition-colors duration-200 hover:text-[--dashboard-button-hover] ${montserrat_paragraph.variable} font-montserratParagraph`}
                                      href="https://docs.anthropic.com/claude/prompt-library"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      The Official Anthropic Prompt Library
                                      <IconExternalLink
                                        size={18}
                                        className="inline-block pl-1"
                                        style={{
                                          position: 'relative',
                                          top: '-2px',
                                        }}
                                      />
                                    </a>
                                  </List.Item>
                                </List>
                                <Text
                                  className={`label ${montserrat_paragraph.variable} inline-block select-text font-montserratParagraph`}
                                  size="md"
                                  style={{ marginTop: '1.5rem' }}
                                >
                                  The System Prompt provides the foundation for
                                  every conversation in this project. It defines
                                  the model&apos;s role, tone, and behavior.
                                  Consider including:
                                  <List
                                    withPadding
                                    className="mt-2 text-[--dashboard-foreground]"
                                    spacing="xs"
                                    icon={
                                      <div
                                        style={{
                                          width: '6px',
                                          height: '6px',
                                          borderRadius: '50%',
                                          backgroundColor:
                                            'var(--dashboard-foreground)',
                                          marginTop: '8px',
                                        }}
                                      />
                                    }
                                  >
                                    <List.Item>
                                      Key instructions or examples
                                    </List.Item>
                                    <List.Item>
                                      A warm welcome message
                                    </List.Item>
                                    <List.Item>
                                      Helpful links for further learning
                                    </List.Item>
                                  </List>
                                </Text>
                              </Text>
                            </div>
                          </Collapse>
                        </Paper>

                        {/* SYSTEM PROMPT INPUT BOX */}
                        <div
                          style={{
                            width: isRightSideVisible ? '100%' : '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            background: 'var(--dashboard-background-faded)',
                          }}
                          className="rounded-xl px-4 py-6 sm:px-6 sm:py-6 md:px-8"
                        >
                          <div
                            style={{
                              width: '100%',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Flex
                              justify="space-between"
                              align="center"
                              mb="md"
                            >
                              <Flex align="center" className="gap-4">
                                <Title
                                  className={`label ${montserrat_heading.variable} pl-1 pr-0 font-montserratHeading text-[--dashboard-foreground] md:pl-0 md:pr-2`}
                                  order={4}
                                >
                                  System Prompt
                                </Title>
                                <Select
                                  placeholder="Select model"
                                  data={modelOptions}
                                  value={selectedModel}
                                  onChange={(value) =>
                                    setSelectedModel(value || '')
                                  }
                                  searchable
                                  radius={'md'}
                                  maxDropdownHeight={280}
                                  itemComponent={(props) => (
                                    <div {...props}>
                                      <Group
                                        noWrap
                                        style={{ overflow: 'visible' }}
                                      >
                                        <div
                                          style={{
                                            width: '100%',
                                            paddingLeft: '4px',
                                            overflow: 'visible',
                                          }}
                                        >
                                          <div
                                            style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              overflow: 'visible',
                                            }}
                                          >
                                            <Image
                                              src={getModelLogo(
                                                props.modelType,
                                              )}
                                              alt={`${props.modelType} logo`}
                                              width={20}
                                              height={20}
                                              style={{
                                                minWidth: '20px',
                                                borderRadius: '4px',
                                                overflow: 'hidden',
                                              }}
                                            />
                                            <Text
                                              size="sm"
                                              style={{ marginLeft: '12px' }}
                                            >
                                              {props.label}
                                            </Text>
                                          </div>
                                          {props.downloadSize && (
                                            <div
                                              style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                marginTop: '4px',
                                                marginLeft: '32px',
                                              }}
                                            >
                                              <Text size="xs" opacity={0.65}>
                                                {props.downloadSize}
                                              </Text>
                                              {recommendedModelIds.includes(
                                                props.label,
                                              ) && (
                                                <div
                                                  style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                  }}
                                                >
                                                  <IconSparkles
                                                    size="1rem"
                                                    style={{
                                                      marginLeft: '8px',
                                                    }}
                                                  />
                                                  <Text
                                                    size="xs"
                                                    opacity={0.65}
                                                    style={{
                                                      marginLeft: '4px',
                                                    }}
                                                  >
                                                    recommended
                                                  </Text>
                                                </div>
                                              )}
                                              {warningLargeModelIds.includes(
                                                props.label,
                                              ) && (
                                                <div
                                                  style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                  }}
                                                >
                                                  <IconAlertTriangleFilled
                                                    size="1rem"
                                                    style={{
                                                      marginLeft: '8px',
                                                    }}
                                                  />
                                                  <Text
                                                    size="xs"
                                                    opacity={0.65}
                                                    style={{
                                                      marginLeft: '4px',
                                                    }}
                                                  >
                                                    warning, requires large vRAM
                                                    GPU
                                                  </Text>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </Group>
                                    </div>
                                  )}
                                  styles={(theme) => ({
                                    root: {
                                      width: '320px',
                                      zIndex: 200,
                                      '@media (max-width: 768px)': {
                                        width: '240px',
                                      },
                                      '@media (max-width: 480px)': {
                                        width: '220px',
                                      },
                                    },
                                    input: {
                                      color: 'var(--foreground)',
                                      backgroundColor: 'var(--background)',
                                      border: 'none',
                                      '&:focus': {
                                        borderColor: '#6e56cf',
                                      },
                                      fontFamily: `var(--font-montserratParagraph), ${theme.fontFamily}`,
                                      cursor: 'pointer',
                                      minWidth: 0,
                                      flex: '1 1 auto',
                                      height: '36px',
                                      fontSize: '0.9rem',
                                      paddingRight: '30px',
                                      paddingLeft: '36px',
                                      overflow: 'visible',
                                      '@media (max-width: 768px)': {
                                        fontSize: '0.85rem',
                                        height: '34px',
                                      },
                                      '@media (max-width: 480px)': {
                                        fontSize: '0.8rem',
                                        height: '32px',
                                      },
                                    },
                                    dropdown: {
                                      backgroundColor: 'var(--background)',
                                      border:
                                        '1px solid var(--background-dark)',
                                      borderRadius: theme.radius.md,
                                      marginTop: '2px',
                                      boxShadow: theme.shadows.xs,
                                      width: '100%',
                                      maxWidth: '100%',
                                      position: 'absolute',
                                      zIndex: 200,
                                      overflow: 'visible',
                                      '@media (max-width: 768px)': {
                                        width: 'auto',
                                        minWidth: '240px',
                                      },
                                    },
                                    item: {
                                      color: 'var(--foreground)',
                                      backgroundColor: 'var(--background)',
                                      borderRadius: theme.radius.md,
                                      margin: '2px',
                                      overflow: 'visible',
                                      '&[data-selected]': {
                                        color: 'var(--foreground)',
                                        backgroundColor: 'transparent',
                                        '&:hover': {
                                          color: 'var(--foreground)',
                                          backgroundColor:
                                            'var(--foreground-faded)',
                                        },
                                      },
                                      '&[data-hovered]': {
                                        color: 'var(--foreground)',
                                        backgroundColor:
                                          'var(--foreground-faded)',
                                      },
                                      fontFamily: `var(--font-montserratParagraph), ${theme.fontFamily}`,
                                      cursor: 'pointer',
                                      whiteSpace: 'normal',
                                      lineHeight: 1.2,
                                      fontSize: '0.9rem',
                                      padding: '8px 12px',
                                      '@media (max-width: 768px)': {
                                        fontSize: '0.85rem',
                                        padding: '6px 10px',
                                      },
                                      '@media (max-width: 480px)': {
                                        fontSize: '0.8rem',
                                        padding: '6px 8px',
                                      },
                                    },
                                    rightSection: {
                                      pointerEvents: 'none',
                                      color: theme.colors.gray[5],
                                      width: '30px',
                                      '@media (max-width: 480px)': {
                                        width: '24px',
                                      },
                                    },
                                  })}
                                  rightSection={
                                    <IconChevronDown
                                      size={isSmallScreen ? 12 : 14}
                                      style={{ marginRight: '8px' }}
                                    />
                                  }
                                  icon={
                                    selectedModel ? (
                                      <Image
                                        src={getModelLogo(
                                          modelOptions.find(
                                            (opt) =>
                                              opt.value === selectedModel,
                                          )?.modelType || '',
                                        )}
                                        alt={`${modelOptions.find((opt) => opt.value === selectedModel)?.modelType || ''} logo`}
                                        width={20}
                                        height={20}
                                        style={{
                                          position: 'absolute',
                                          left: '8px',
                                          minWidth: '20px',
                                          borderRadius: '4px',
                                          overflow: 'hidden',
                                        }}
                                      />
                                    ) : null
                                  }
                                />
                                <Tooltip
                                  label="The selected model will be used when Optimizing System Prompt"
                                  position="top"
                                  multiline
                                  withArrow
                                  arrowSize={10}
                                  offset={20}
                                  styles={(theme) => ({
                                    tooltip: {
                                      backgroundColor: theme.colors.dark[7],
                                      color: theme.white,
                                      fontSize: '0.875rem',
                                      padding: '0.5rem 0.75rem',
                                      fontFamily:
                                        'var(--font-montserratParagraph)',
                                      maxWidth: '300px',
                                    },
                                    arrow: {
                                      backgroundColor: theme.colors.dark[7],
                                    },
                                  })}
                                >
                                  <div>
                                    <IconInfoCircle
                                      size={18}
                                      className="text-[--foreground-faded] transition-colors duration-200 hover:text-[--foreground]"
                                      style={{ cursor: 'pointer' }}
                                    />
                                  </div>
                                </Tooltip>
                              </Flex>
                              {isRightSideVisible ? (
                                <Tooltip
                                  label="Close Prompt Builder"
                                  key="close"
                                >
                                  <div
                                    className="cursor-pointer p-0 pl-2"
                                    data-right-sidebar-icon
                                  >
                                    <IconLayoutSidebarRight
                                      stroke={2}
                                      className="text-[--foreground-faded] transition-colors duration-200 hover:text-[--foreground]"
                                      onClick={() =>
                                        setIsRightSideVisible(false)
                                      }
                                    />
                                  </div>
                                </Tooltip>
                              ) : (
                                <Tooltip label="Open Prompt Builder" key="open">
                                  <div
                                    className="mr-2 cursor-pointer p-0"
                                    data-right-sidebar-icon
                                  >
                                    <IconLayoutSidebarRightExpand
                                      stroke={2}
                                      className="text-[--foreground-faded] transition-colors duration-200 hover:text-[--foreground]"
                                      onClick={() =>
                                        setIsRightSideVisible(true)
                                      }
                                    />
                                  </div>
                                </Tooltip>
                              )}
                            </Flex>
                            <form
                              className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                              onSubmit={(e) =>
                                handleSubmitPromptOptimization(e)
                              }
                            >
                              <Textarea
                                autosize
                                minRows={3}
                                maxRows={20}
                                placeholder="Enter the system prompt..."
                                className="px-1 pt-3 md:px-0"
                                value={baseSystemPrompt}
                                onChange={(e) => {
                                  setBaseSystemPrompt(e.target.value)
                                }}
                                style={{ width: '100%' }}
                                styles={{
                                  input: {
                                    color: 'var(--foreground)',
                                    backgroundColor: 'var(--background)',
                                    fontFamily:
                                      'var(--font-montserratParagraph)',
                                    '&:focus': {
                                      borderColor: 'var(--dashboard-button)',
                                    },
                                  },
                                }}
                              />
                              <Group mt="md" spacing="sm">
                                <Button
                                  variant="filled"
                                  radius="md"
                                  className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                                  type="button"
                                  onClick={(e) => {
                                    handleSystemPromptSubmit(baseSystemPrompt)
                                  }}
                                  sx={(theme) => ({
                                    backgroundColor: `var(--dashboard-button) !important`,
                                    border: 'none',
                                    color: '#fff',
                                    padding: '10px 20px',
                                    fontWeight: 600,
                                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                      backgroundColor: `var(--dashboard-button-hover) !important`,
                                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                                    },
                                    '&:active': {
                                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                                    },
                                  })}
                                  style={{ minWidth: 'fit-content' }}
                                >
                                  Update System Prompt
                                </Button>

                                <span
                                  style={
                                    {
                                      '--spinner': 'var(--dashboard-button)',
                                    } as React.CSSProperties
                                  }
                                >
                                  <Button
                                    onClick={handleSubmitPromptOptimization}
                                    disabled={!llmProviders || isOptimizing}
                                    variant="filled"
                                    radius="md"
                                    leftIcon={
                                      isOptimizing ? (
                                        <LoadingSpinner size="sm" />
                                      ) : (
                                        <IconSparkles
                                          stroke={1}
                                          color="var(--dashboard-button-foreground)"
                                        />
                                      )
                                    }
                                    className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                                    sx={(theme) => ({
                                      background:
                                        'var(--dashboard-button) !important',
                                      border: 'none',
                                      color:
                                        'var(--dashboard-button-foreground) !important',
                                      padding: '10px 20px',
                                      fontWeight: 600,
                                      transition: 'all 0.2s ease',
                                      '&:hover': {
                                        background:
                                          'var(--dashboard-button-hover) !important',
                                      },
                                      '&:active': {},
                                      '&:disabled': {
                                        opacity: 0.7,
                                        cursor: 'not-allowed',
                                        transform: 'none',
                                      },
                                    })}
                                    style={{ minWidth: 'fit-content' }}
                                  >
                                    {isOptimizing
                                      ? 'Optimizing...'
                                      : 'Optimize System Prompt'}
                                  </Button>
                                </span>
                              </Group>

                              <Modal
                                opened={opened}
                                onClose={close}
                                size="xl"
                                title={
                                  <Text
                                    className={`${montserrat_heading.variable} font-montserratHeading`}
                                    size="lg"
                                    weight={700}
                                  >
                                    Optimized System Prompt
                                  </Text>
                                }
                                className={`${montserrat_heading.variable} rounded-xl font-montserratHeading`}
                                centered
                                radius="lg"
                                styles={{
                                  title: { marginBottom: '0' },
                                  header: {
                                    backgroundColor: 'var(--modal)',
                                    borderBottom:
                                      '1px solid var(--modal-border)',
                                    padding: '20px 24px',
                                  },
                                  content: {
                                    color: 'var(--modal-text)',
                                    backgroundColor: 'var(--modal)',
                                    border: '1px solid #2D2F48',
                                  },
                                  body: {
                                    padding: '24px',
                                    marginTop: '2%',
                                    paddingTop: '4%',
                                    maxHeight: 'calc(85vh - 76px)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                  },
                                  close: {
                                    color: 'var(--modal-text)',
                                    border: '0px',

                                    '&:hover': {
                                      color: 'var(--modal)',
                                      backgroundColor:
                                        'var(--dashboard-button)',
                                    },
                                  },
                                }}
                              >
                                <div
                                  style={{
                                    flex: 1,
                                    minHeight: 0,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '24px',
                                  }}
                                >
                                  <Paper
                                    p="md"
                                    radius="md"
                                    style={{
                                      backgroundColor:
                                        'var(--background-faded)',
                                      flex: 1,
                                      overflow: 'auto',
                                      minHeight: '200px',
                                      maxHeight: 'calc(85vh - 200px)',
                                      marginTop: '4px',
                                    }}
                                  >
                                    {messages.map((message, i, { length }) => {
                                      if (
                                        length - 1 === i &&
                                        message.role === 'assistant'
                                      ) {
                                        return (
                                          <div
                                            key={i}
                                            style={{
                                              padding: '16px',
                                              borderRadius: '8px',
                                              whiteSpace: 'pre-wrap',
                                              color: 'var(--modal-text)',
                                              lineHeight: '1.6',
                                              fontSize: '0.95rem',
                                            }}
                                            className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                                          >
                                            {message.content}
                                          </div>
                                        )
                                      }
                                    }, null)}
                                  </Paper>

                                  <Group position="right" spacing="sm">
                                    <Button
                                      variant="outline"
                                      radius="md"
                                      onClick={close}
                                      className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                                      styles={(theme) => ({
                                        root: {
                                          color: 'var(--foreground)',
                                          borderColor:
                                            'var(--background-faded)',
                                          '&:hover': {
                                            backgroundColor:
                                              'var(--background-faded)',
                                          },
                                        },
                                      })}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      radius="md"
                                      className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                                      onClick={() => {
                                        const lastMessage =
                                          messages[messages.length - 1]
                                        if (
                                          lastMessage &&
                                          lastMessage.role === 'assistant'
                                        ) {
                                          const newSystemPrompt =
                                            lastMessage.content
                                          setOptimizedSystemPrompt(
                                            newSystemPrompt,
                                          )
                                          setBaseSystemPrompt(newSystemPrompt)
                                          handleSystemPromptSubmit(
                                            newSystemPrompt,
                                          )
                                        }
                                        close()
                                      }}
                                      sx={(theme) => ({
                                        color:
                                          'var(--dashboard-button-foreground)',
                                        background:
                                          'var(--dashboard-button) !important',
                                        border: 'none',
                                        padding: '10px 20px',
                                        fontWeight: 600,
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                          background:
                                            'var(--dashboard-button-hover) !important',
                                        },
                                        '&:active': {
                                          transform: 'translateY(0)',
                                        },
                                      })}
                                    >
                                      Update System Prompt
                                    </Button>
                                  </Group>
                                </div>
                              </Modal>
                            </form>
                          </div>
                        </div>
                      </Group>
                      {/* <Alert icon={<IconAlertCircle size="1rem" />} title="Attention!" color="pink" style={{ width: isRightSideVisible ? '90%' : '73%', margin: 'auto', marginTop: '0px', color: 'pink' }}>
                        <span style={{ color: 'pink' }}>Remember to save and update the system prompt before you leave this page.</span>
                      </Alert> */}
                    </div>
                  </div>
                </div>
                {/* RIGHT SIDE OF CARD */}
                {isRightSideVisible && courseMetadata && (
                  <>
                    <div
                      style={{
                        flex: isSmallScreen ? '1 1 100%' : '1 1 40%',
                        padding: '1rem',
                        color: 'var(--dashboard-foreground)',
                        backgroundColor: 'var(--dashboard-sidebar-background)',
                        borderLeft: '1px solid var(--dashboard-border)',
                      }}
                    >
                      <div className="card flex h-full flex-col">
                        <Flex direction="column" m="1rem" gap="md">
                          <Flex align="flex-start">
                            <Title
                              className={`${montserrat_heading.variable} font-montserratHeading`}
                              order={3}
                              pl={'md'}
                              pr={'md'}
                              pb={'xs'}
                              style={{ alignSelf: 'left', marginLeft: '-11px' }}
                            >
                              Document Search Optimization
                            </Title>
                            <Indicator
                              label={
                                <Text
                                  className={`${montserrat_heading.variable} font-montserratHeading`}
                                >
                                  New
                                </Text>
                              }
                              color="var(--dashboard-button)"
                              size={13}
                              styles={{
                                indicator: {
                                  top: '-1.1rem !important',
                                  right: '.25rem !important',
                                },
                              }}
                            >
                              <span
                                className={`${montserrat_heading.variable} font-montserratHeading`}
                              ></span>
                            </Indicator>
                          </Flex>

                          <CustomSwitch
                            label="Smart Document Search"
                            tooltip="When enabled, UIUC.chat optimizes your queries to better search through course materials and find relevant content. Note: This only affects how documents are searched - your chat messages remain exactly as you write them."
                            checked={vectorSearchRewrite}
                            onChange={(value: boolean) => {
                              handleSettingChange({
                                vector_search_rewrite_disabled: !value,
                              })
                            }}
                          />

                          <Divider />

                          <Flex align="center" style={{ paddingTop: '15px' }}>
                            <Title
                              className={`label ${montserrat_heading.variable} mr-[8px] font-montserratHeading`}
                              order={3}
                            >
                              AI Behavior Settings
                            </Title>
                            <Indicator
                              label={
                                <Text
                                  className={`${montserrat_heading.variable} font-montserratHeading`}
                                >
                                  New
                                </Text>
                              }
                              color="var(--dashboard-button)"
                              size={13}
                              // styles={{ indicator: { top: '-10px !important', right: '265px !important' } }}
                              styles={{
                                indicator: {
                                  top: '-17px !important',
                                  right: '7px !important',
                                },
                              }}
                            >
                              {' '}
                              <span
                                className={`${montserrat_heading.variable} font-montserratHeading`}
                              ></span>
                            </Indicator>
                          </Flex>

                          {/* Enhanced Switches */}
                          <Flex direction="column" gap="md">
                            <div className="flex flex-col gap-1">
                              <CustomSwitch
                                label="Guided Learning"
                                tooltip="When enabled course-wide, this setting applies to all students and cannot be disabled by them. The AI will encourage independent problem-solving by providing hints and questions instead of direct answers, while still finding and citing relevant course materials. This promotes critical thinking while ensuring students have access to proper resources."
                                checked={guidedLearning}
                                onChange={(value: boolean) =>
                                  handleCheckboxChange({
                                    guidedLearning: value,
                                  })
                                }
                              />

                              <CustomSwitch
                                label="Document-Based References Only"
                                tooltip="Restricts the AI to use only information from the provided documents. Useful for maintaining accuracy in fields like legal research where external knowledge could be problematic."
                                checked={documentsOnly}
                                onChange={(value: boolean) =>
                                  handleCheckboxChange({ documentsOnly: value })
                                }
                              />

                              <CustomSwitch
                                label="Bypass UIUC.chat's internal prompting"
                                tooltip="Internally, we prompt the model to (1) add citations and (2) always be as helpful as possible. You can bypass this for full un-modified control over your bot."
                                checked={systemPromptOnly}
                                onChange={(value: boolean) =>
                                  handleCheckboxChange({
                                    systemPromptOnly: value,
                                  })
                                }
                              />

                              {/* Conditional Button */}
                              {systemPromptOnly && (
                                <Flex
                                  mt="sm"
                                  direction="column"
                                  gap="xs"
                                  className="mt-[-4px] pl-[82px]"
                                >
                                  <CustomCopyButton
                                    label="Copy UIUC.chat's internal prompt"
                                    tooltip="You can use and customize our default internal prompting to suit your needs. Note, only the specific citation formatting described will work with our citation 'find and replace' system. This provides a solid starting point for defining AI behavior in raw prompt mode."
                                    onClick={handleCopyDefaultPrompt}
                                  />
                                </Flex>
                              )}

                              {/* Reset Button and Modal */}
                              <Modal
                                opened={resetModalOpened}
                                onClose={closeResetModal}
                                title={
                                  <Text
                                    className={`${montserrat_heading.variable} font-montserratHeading`}
                                    size="lg"
                                    weight={700}
                                    gradient={{
                                      from: 'red',
                                      to: 'white',
                                      deg: 45,
                                    }}
                                    variant="gradient"
                                  >
                                    Reset Prompting Settings
                                  </Text>
                                }
                                centered
                                radius="md"
                                size="md"
                                styles={{
                                  header: {
                                    backgroundColor: '#15162c',
                                    borderBottom: '1px solid #2D2F48',
                                    padding: '20px 24px',
                                    marginBottom: '16px',
                                  },
                                  content: {
                                    backgroundColor: '#15162c',
                                    border: '1px solid #2D2F48',
                                  },
                                  body: {
                                    padding: '0 24px 24px 24px',
                                  },
                                  title: {
                                    marginBottom: '0',
                                  },
                                  close: {
                                    marginTop: '4px',
                                  },
                                }}
                              >
                                <Flex
                                  direction="column"
                                  gap="xl"
                                  style={{ marginTop: '8px' }}
                                >
                                  <Flex align="flex-start" gap="md">
                                    <IconAlertTriangle
                                      size={24}
                                      color={theme.colors.red[5]}
                                      style={{ marginTop: '2px' }}
                                    />
                                    <Text
                                      className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                                      size="sm"
                                      weight={500}
                                      style={{
                                        color: 'white',
                                        lineHeight: 1.5,
                                      }}
                                    >
                                      Are you sure you want to reset your system
                                      prompt and all behavior settings to their
                                      default values?
                                    </Text>
                                  </Flex>

                                  <Divider
                                    style={{
                                      borderColor: 'rgba(255,255,255,0.1)',
                                    }}
                                  />

                                  <div>
                                    <Text
                                      size="sm"
                                      className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                                      weight={600}
                                      style={{
                                        color: '#D1D1D1',
                                        marginBottom: '12px',
                                      }}
                                    >
                                      This action will:
                                    </Text>
                                    <List
                                      size="sm"
                                      spacing="sm"
                                      style={{ color: '#D1D1D1' }}
                                      icon={
                                        <div
                                          style={{
                                            width: '6px',
                                            height: '6px',
                                            borderRadius: '50%',
                                            backgroundColor: 'hsl(0,100%,70%)',
                                            marginTop: '8px',
                                          }}
                                        />
                                      }
                                    >
                                      <List.Item>
                                        Restore the system prompt to the default
                                        template
                                      </List.Item>
                                      <List.Item>
                                        Disable Guided Learning, Document-Only
                                        mode, and other custom settings
                                      </List.Item>
                                    </List>
                                  </div>

                                  <Text
                                    size="sm"
                                    style={{ color: '#D1D1D1' }}
                                    className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                                  >
                                    This cannot be undone. Please confirm you
                                    wish to proceed.
                                  </Text>

                                  <Group position="right" mt="md">
                                    <Button
                                      variant="outline"
                                      color="gray"
                                      radius="md"
                                      onClick={closeResetModal}
                                      className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                                      styles={(theme) => ({
                                        root: {
                                          borderColor: theme.colors.gray[6],
                                          color: '#fff',
                                          '&:hover': {
                                            backgroundColor:
                                              theme.colors.gray[8],
                                          },
                                        },
                                      })}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      variant="filled"
                                      color="red"
                                      radius="md"
                                      className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                                      sx={(theme) => ({
                                        backgroundColor: `${theme.colors.red[8]} !important`,
                                        border: 'none',
                                        color: '#fff',
                                        padding: '10px 20px',
                                        fontWeight: 600,
                                        boxShadow:
                                          '0 2px 4px rgba(0, 0, 0, 0.2)',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                          backgroundColor: `${theme.colors.red[9]} !important`,
                                          transform: 'translateY(-1px)',
                                          boxShadow:
                                            '0 4px 8px rgba(0, 0, 0, 0.3)',
                                        },
                                        '&:active': {
                                          transform: 'translateY(0)',
                                          boxShadow:
                                            '0 2px 4px rgba(0, 0, 0, 0.2)',
                                        },
                                      })}
                                      onClick={() => {
                                        resetSystemPrompt()
                                        closeResetModal()
                                      }}
                                    >
                                      Confirm
                                    </Button>
                                  </Group>
                                </Flex>
                              </Modal>

                              {/* Reset and Share Link buttons */}
                              <Flex
                                direction="column"
                                mt="md"
                                justify="flex-start"
                                gap="md"
                              >
                                <Button
                                  variant="filled"
                                  color="red"
                                  radius="md"
                                  leftIcon={<IconAlertTriangle size={16} />}
                                  className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                                  sx={(theme) => ({
                                    backgroundColor: `${theme.colors.red[8]} !important`,
                                    border: 'none',
                                    color: '#fff',
                                    padding: '10px 20px',
                                    fontWeight: 600,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                      backgroundColor: `${theme.colors.red[9]} !important`,
                                    },
                                    '&:active': {},
                                  })}
                                  onClick={openResetModal}
                                >
                                  Reset Prompting Settings
                                </Button>

                                <Button
                                  variant="filled"
                                  radius="md"
                                  leftIcon={<IconLink size={16} />}
                                  onClick={openLinkGenerator}
                                  className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                                  sx={(theme) => ({
                                    background:
                                      'var(--dashboard-button) !important',
                                    border: 'none',
                                    color: '#fff',
                                    padding: '10px 20px',
                                    fontWeight: 600,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                      background:
                                        'var(--dashboard-button-hover) !important',
                                    },
                                    '&:active': {},
                                  })}
                                >
                                  Generate Share Link
                                </Button>
                              </Flex>

                              {/* Add the Link Generator Modal */}
                              <LinkGeneratorModal
                                opened={linkGeneratorOpened}
                                onClose={closeLinkGenerator}
                                course_name={course_name}
                                currentSettings={{
                                  guidedLearning,
                                  documentsOnly,
                                  systemPromptOnly,
                                }}
                              />
                            </div>
                          </Flex>
                        </Flex>
                      </div>
                    </div>
                  </>
                )}

                {/* End of right side of Card */}
              </Flex>
            </Card>
          </Flex>
        </div>
        <GlobalFooter />
      </main>
    </SettingsLayout>
  )
}

export const showToastNotification = (
  theme: MantineTheme,
  title: string,
  message: string,
  isError = false,
  icon?: React.ReactNode,
) => {
  // Calculate duration based on message length (minimum 5 seconds, add 1 second for every 20 characters)
  const baseDuration = 5000
  const durationPerChar = 50 // 50ms per character
  const duration = Math.max(
    baseDuration,
    Math.min(15000, message.length * durationPerChar),
  )

  notifications.show({
    withCloseButton: true,
    autoClose: duration,
    title: title,
    message: message,
    icon: icon || (isError ? <IconAlertTriangle /> : <IconCheck />),
    styles: {
      root: {
        backgroundColor: 'var(--notification)', // Dark background to match the page
        borderColor: isError ? '#E53935' : 'var(--notification-border)', // Red for errors,  for success
        borderWidth: '1px',
        borderStyle: 'solid',
        borderRadius: '8px', // Added rounded corners
      },
      title: {
        color: 'var(--notification-title)', // White text for the title
        fontWeight: 600,
      },
      description: {
        color: 'var(--notification-message)', // Light gray text for the message
      },
      closeButton: {
        color: 'var(--notification-title)', // White color for the close button
        borderRadius: '4px', // Added rounded corners to close button
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.1)', // Subtle hover effect
        },
      },
      icon: {
        backgroundColor: 'transparent', // Transparent background for the icon
        color: isError ? '#E53935' : 'var(--notification-title)', // Icon color matches the border
      },
    },
  })
}

export const showToastOnPromptUpdate = (
  theme: MantineTheme,
  was_error = false,
  isReset = false,
) => {
  const title = was_error
    ? 'Error Updating Prompt'
    : isReset
      ? 'Prompt Reset to Default'
      : 'Prompt Updated Successfully'
  const message = was_error
    ? 'An error occurred while updating the prompt. Please try again.'
    : isReset
      ? 'The system prompt has been reset to default settings.'
      : 'The system prompt has been updated.'
  const isError = was_error

  showToastNotification(theme, title, message, isError)
}

export default CourseMain
