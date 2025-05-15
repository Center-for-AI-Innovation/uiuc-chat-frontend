// src/pages/[course_name]/prompt.tsx
'use client'
import { type NextPage } from 'next'
import MakeNewCoursePage from '~/components/UIUC-Components/MakeNewCoursePage'
import React, { useEffect, useState, useRef } from 'react'
import { Montserrat } from 'next/font/google'
import { useRouter } from 'next/router'

import { useAuth } from 'react-oidc-context'
import { CannotEditGPT4Page } from '~/components/UIUC-Components/CannotEditGPT4'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import {
  LoadingPlaceholderForAdminPages,
  MainPageBackground,
} from '~/components/UIUC-Components/MainPageBackground'
import { AuthComponent } from '~/components/UIUC-Components/AuthToEditCourse'
import {
  Card,
  Flex,
  Group,
  type MantineTheme,
  Text,
  Title,
  useMantineTheme,
} from '@mantine/core'

import {
  DEFAULT_SYSTEM_PROMPT,
  GUIDED_LEARNING_PROMPT,
  DOCUMENT_FOCUS_PROMPT,
} from '~/utils/app/const'
import { type CourseMetadata } from '~/types/courseMetadata'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { callSetCourseMetadata } from '~/utils/apiUtils'
import Navbar from '~/components/UIUC-Components/navbars/Navbar'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'
import {
  IconAlertTriangle,
  IconCheck,
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import GlobalFooter from '../../components/UIUC-Components/GlobalFooter'
import { useDebouncedCallback } from 'use-debounce'
import { findDefaultModel } from '~/components/UIUC-Components/api-inputs/LLMsApiKeyInputForm'
import {
  ReasoningCapableModels,
  type AllLLMProviders,
  ProviderNames,
  LLM_PROVIDER_ORDER,
  type AnySupportedModel,
} from '~/utils/modelProviders/LLMProvider'
import { type AnthropicModel } from '~/utils/modelProviders/types/anthropic'
import { v4 as uuidv4 } from 'uuid'
import { type ChatBody } from '~/types/chat'
import CustomPromptsTable from '~/components/Course/CustomPromptsTable'
import PromptEngineeringGuide from '~/components/Course/PromptEngineeringGuide';
import SystemPromptControls from '~/components/Course/SystemPromptControls';
import BehaviorSettingsPanel from '~/components/Course/BehaviorSettingsPanel';
import CustomPromptModal from '~/components/Modals/CustomPromptModal';
import DeleteCustomPromptModal from '~/components/Modals/DeleteCustomPromptModal';

// Moved utility functions before the component that uses them
const showToastNotification = (
  theme: MantineTheme,
  title: string,
  message: string,
  isError = false,
  icon?: React.ReactNode,
) => {
  const baseDuration = 5000
  const durationPerChar = 50
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
        backgroundColor: '#1A1B1E',
        borderColor: isError ? '#E53935' : '#6D28D9',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderRadius: '8px',
      },
      title: {
        color: '#FFFFFF',
        fontWeight: 600,
      },
      description: {
        color: '#D1D1D1',
      },
      closeButton: {
        color: '#FFFFFF',
        borderRadius: '4px',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        },
      },
      icon: {
        backgroundColor: 'transparent',
        color: isError ? '#E53935' : '#6D28D9',
      },
    },
  })
}

const showToastOnPromptUpdate = (
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

const montserrat = Montserrat({
  weight: '700',
  subsets: ['latin'],
})

// Define the new interface for custom system prompts
interface CustomSystemPrompt {
  id: string // Unique identifier for the prompt
  name: string // A user-friendly name for the prompt
  urlSuffix: string // The suffix for the shareable URL
  promptText: string // The actual system prompt text
  isFavorite?: boolean // Optional favorite status
}

export type { CustomSystemPrompt };

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
  const [isOptimizing, setIsOptimizing] = useState(false)

  // State for custom system prompts
  const [customSystemPrompts, setCustomSystemPrompts] = useState<
    CustomSystemPrompt[]
  >([])
  const [
    customPromptModalOpened,
    { open: openCustomPromptModal, close: closeCustomPromptModal },
  ] = useDisclosure(false)
  const [editingCustomPromptId, setEditingCustomPromptId] = useState<
    string | null
  >(null)
  const [customPromptForm, setCustomPromptForm] = useState<{
    name: string
    urlSuffix: string
    promptText: string
  }>({
    name: '',
    urlSuffix: '',
    promptText: '',
  })
  // For delete confirmation
  const [
    deleteConfirmModalOpened,
    { open: openDeleteConfirmModal, close: closeDeleteConfirmModal },
  ] = useDisclosure(false)
  const [promptToDelete, setPromptToDelete] = useState<CustomSystemPrompt | null>(
    null,
  )
  // New state for the initial prompt suffix for the link generator modal
  const [linkGenInitialPromptSuffix, setLinkGenInitialPromptSuffix] = useState<string | undefined>(undefined);

  // New handler for toggling favorite status
  const handleToggleFavoritePrompt = async (promptId: string, newFavoriteStatus: boolean) => {
    const updatedPrompts = customSystemPrompts.map((p) =>
      p.id === promptId ? { ...p, isFavorite: newFavoriteStatus } : p,
    );
    setCustomSystemPrompts(updatedPrompts);

    if (courseMetadataRef.current && course_name) {
      const updatedMetadata = {
        ...courseMetadataRef.current,
        custom_system_prompts: updatedPrompts,
      } as CourseMetadata;

      const success = await callSetCourseMetadata(course_name, updatedMetadata);
      if (success) {
        // Optionally, show a success notification
        showToastNotification(
          theme,
          'Favorite Status Updated',
          `Prompt marked as ${newFavoriteStatus ? 'favorite' : 'not favorite'}.`,
        );
        // Ensure main courseMetadata state is also updated to reflect the change immediately if not already covered by setCustomSystemPrompts
        // In this case, setCourseMetadata is called by handleSaveCustomPrompt and handleConfirmDeleteCustomPrompt
        // We should also call it here to ensure consistency, or ensure courseMetadataRef is always up-to-date.
        setCourseMetadata(updatedMetadata); 
      } else {
        // Revert UI change on failure and show error
        setCustomSystemPrompts(customSystemPrompts);
        showToastNotification(
          theme,
          'Error',
          'Failed to update favorite status.',
          true,
        );
      }
    } else {
      showToastNotification(theme, 'Error', 'Course data not available for updating favorite status.', true);
      // Revert UI change if course data is not available
      setCustomSystemPrompts(customSystemPrompts);
    }
  };

  // New handler for copying to clipboard
  const handleCopyToClipboard = (promptText: string) => {
    navigator.clipboard
      .writeText(promptText)
      .then(() => {
        showToastNotification(
          theme,
          'Copied to Clipboard',
          'Custom prompt text has been copied to your clipboard.',
        );
      })
      .catch((err) => {
        console.error('Could not copy text: ', err);
        showToastNotification(
          theme,
          'Error Copying',
          'Could not copy text to clipboard.',
          true,
        );
      });
  };

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
      // Initialize custom system prompts
      setCustomSystemPrompts(fetchedMetadata.custom_system_prompts || [])

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
    setBaseSystemPrompt(baseSystemPrompt)
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

  // Handler functions for custom system prompts
  const handleOpenCustomPromptModal = (prompt?: CustomSystemPrompt) => {
    if (prompt) {
      setEditingCustomPromptId(prompt.id)
      setCustomPromptForm({
        name: prompt.name,
        urlSuffix: prompt.urlSuffix,
        promptText: prompt.promptText,
      })
    } else {
      setEditingCustomPromptId(null)
      setCustomPromptForm({ name: '', urlSuffix: '', promptText: '' })
    }
    openCustomPromptModal()
  }

  const handleCloseCustomPromptModal = () => {
    setEditingCustomPromptId(null)
    setCustomPromptForm({ name: '', urlSuffix: '', promptText: '' })
    closeCustomPromptModal()
  }

  const handleCustomPromptFormChange = (
    field: keyof typeof customPromptForm,
    value: string,
  ) => {
    setCustomPromptForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveCustomPrompt = async () => {
    const { name, urlSuffix, promptText } = customPromptForm;

    if (!name.trim()) {
      showToastNotification(theme, 'Validation Error', 'Prompt Name is required.', true);
      return;
    }
    if (!editingCustomPromptId && !urlSuffix.trim()) {
      showToastNotification(theme, 'Validation Error', 'Link Identifier is required.', true);
      return;
    }
    if (editingCustomPromptId && customSystemPrompts.find(p => p.id === editingCustomPromptId)?.urlSuffix !== urlSuffix && !urlSuffix.trim()){
      showToastNotification(theme, 'Validation Error', 'Link Identifier cannot be empty if changed.', true);
      return;
    }
    if (urlSuffix.trim() && !/^[a-zA-Z0-9_-]+$/.test(urlSuffix.trim())) {
      showToastNotification(
        theme,
        'Validation Error',
        'Link Identifier can only contain letters, numbers, underscores, and hyphens.',
        true,
      );
      return;
    }
    if (!promptText.trim()) {
      showToastNotification(theme, 'Validation Error', 'Prompt Text is required.', true);
      return;
    }

    if (urlSuffix.trim()) {
      const isSuffixUnique = customSystemPrompts.every(
        (p) =>
          p.id === editingCustomPromptId || p.urlSuffix !== urlSuffix.trim(),
      );
      if (!isSuffixUnique) {
        showToastNotification(
          theme,
          'Duplicate Identifier',
          'This Link Identifier is already in use. Please choose a unique one.',
          true,
        );
        return;
      }
    }

    if (!editingCustomPromptId && customSystemPrompts.length >= 100) {
      showToastNotification(
        theme,
        'Limit Reached',
        'You have reached the maximum limit of 100 custom system prompts per course.',
        true, // Assuming orange/warning maps to isError: true for styling
      );
      return;
    }

    let updatedPrompts: CustomSystemPrompt[];
    if (editingCustomPromptId) {
      updatedPrompts = customSystemPrompts.map((p) =>
        p.id === editingCustomPromptId
          ? { ...p, ...customPromptForm, urlSuffix: customPromptForm.urlSuffix.trim() }
          : p,
      )
    } else {
      const newPrompt: CustomSystemPrompt = {
        id: uuidv4(),
        ...customPromptForm,
        urlSuffix: customPromptForm.urlSuffix.trim(),
      }
      updatedPrompts = [...customSystemPrompts, newPrompt]
    }

    if (courseMetadataRef.current && course_name) {
      const updatedMetadata = {
        ...courseMetadataRef.current,
        custom_system_prompts: updatedPrompts,
      } as CourseMetadata

      const success = await callSetCourseMetadata(course_name, updatedMetadata)
      if (success) {
        setCustomSystemPrompts(updatedPrompts)
        setCourseMetadata(updatedMetadata) // Ensure main courseMetadata state is also updated
        showToastNotification(
          theme,
          'Success',
          `Custom prompt ${editingCustomPromptId ? 'updated' : 'saved'} successfully.`,
        )
        handleCloseCustomPromptModal()
      } else {
        showToastNotification(
          theme,
          'Error',
          `Failed to ${editingCustomPromptId ? 'update' : 'save'} custom prompt.`,
          true,
        )
      }
    } else {
      showToastNotification(theme, 'Error', 'Course data not available.', true)
    }
  }

  const handleInitiateDeleteCustomPrompt = (prompt: CustomSystemPrompt) => {
    setPromptToDelete(prompt)
    openDeleteConfirmModal()
  }

  const handleConfirmDeleteCustomPrompt = async () => {
    if (!promptToDelete || !courseMetadataRef.current || !course_name) return

    const updatedPrompts = customSystemPrompts.filter(
      (p) => p.id !== promptToDelete.id,
    )

    const updatedMetadata = {
      ...courseMetadataRef.current,
      custom_system_prompts: updatedPrompts,
    } as CourseMetadata

    const success = await callSetCourseMetadata(course_name, updatedMetadata)
    if (success) {
      setCustomSystemPrompts(updatedPrompts)
      setCourseMetadata(updatedMetadata)
      showToastNotification(theme, 'Success', 'Custom prompt deleted successfully.')
      closeDeleteConfirmModal()
      setPromptToDelete(null)
    } else {
      showToastNotification(theme, 'Error', 'Failed to delete custom prompt.', true)
      closeDeleteConfirmModal()
      setPromptToDelete(null)
    }
  }

  // New handler to open link generator with a specific prompt
  const handleOpenLinkGeneratorModal = (urlSuffix: string) => {
    setLinkGenInitialPromptSuffix(urlSuffix);
    openLinkGenerator();
  };

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
    <>
      <Navbar course_name={router.query.course_name as string} />
      <main className="course-page-main min-w-screen flex min-h-screen flex-col items-center">
        <div className="items-left flex w-full flex-col justify-center py-0">
          <Flex direction="column" align="center" w="100%">
            <Card
              shadow="xs"
              padding="none"
              radius="xl"
              className="mt-[2%] w-[96%] md:w-[90%] 2xl:w-[90%]"
            >
              <Flex direction={isSmallScreen ? 'column' : 'row'}>
                <div
                  style={{
                    flex: isSmallScreen ? '1 1 100%' : '1 1 60%',
                    border: 'None',
                    color: 'white',
                  }}
                  className="min-h-full bg-gradient-to-r from-purple-900 via-indigo-800 to-blue-800"
                >
                  <div className="w-full border-b border-white/10 bg-black/20 px-4 py-3 sm:px-6 sm:py-4 md:px-8">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <Title
                          order={2}
                          className={`${montserrat_heading.variable} font-montserratHeading text-lg text-white/90 sm:text-2xl`}
                        >
                          Prompting
                        </Title>
                        <Text className="text-white/60">/</Text>
                        <Title
                          order={3}
                          variant="gradient"
                          gradient={{ from: 'gold', to: 'white', deg: 50 }}
                          className={`${montserrat_heading.variable} min-w-0 font-montserratHeading text-base sm:text-xl ${
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
                        m="2rem"
                        align="center"
                        variant="column"
                        className="w-[100%] md:w-[95%] lg:w-[95%]"
                        style={{
                          justifyContent: 'center',
                          alignSelf: 'center',
                          overflow: 'hidden',
                        }}
                      >
                        {/* Prompt Engineering Guide */}
                        <PromptEngineeringGuide 
                          insightsOpen={insightsOpen} 
                          setInsightsOpen={setInsightsOpen} 
                          theme={theme} 
                        />

                        {/* SYSTEM PROMPT INPUT BOX - Replaced by SystemPromptControls */}
                        <SystemPromptControls
                          theme={theme}
                          baseSystemPrompt={baseSystemPrompt}
                          setBaseSystemPrompt={setBaseSystemPrompt}
                          selectedModel={selectedModel}
                          setSelectedModel={setSelectedModel}
                          modelOptions={modelOptions}
                          llmProviders={llmProviders}
                          isOptimizing={isOptimizing}
                          handleSubmitPromptOptimization={handleSubmitPromptOptimization}
                          handleSystemPromptSubmit={handleSystemPromptSubmit}
                          isRightSideVisible={isRightSideVisible}
                          setIsRightSideVisible={setIsRightSideVisible}
                          optimizationModalOpened={opened} // Pass Mantine disclosure state
                          closeOptimizationModal={close} // Pass Mantine disclosure close
                          optimizedMessages={messages} // Pass messages for modal display
                          setOptimizedSystemPrompt={setBaseSystemPrompt} // To update the main prompt
                          isSmallScreen={isSmallScreen}
                        />
                      </Group>
                      {/* <Alert icon={<IconAlertCircle size="1rem" />} title="Attention!" color="pink" style={{ width: isRightSideVisible ? '90%' : '73%', margin: 'auto', marginTop: '0px', color: 'pink' }}>
                        <span style={{ color: 'pink' }}>Remember to save and update the system prompt before you leave this page.</span>
                      </Alert> */}
                    </div>
                  </div>
                </div>
                {/* RIGHT SIDE OF CARD */}
                {isRightSideVisible && courseMetadata && (
                  <div
                    style={{
                      flex: isSmallScreen ? '1 1 100%' : '1 1 40%',
                      // The BehaviorSettingsPanel's internal styles will handle its height and background.
                      // This div ensures that the space allocated for the right panel stretches correctly.
                    }}
                  >
                    <BehaviorSettingsPanel
                      theme={theme}
                      courseMetadata={courseMetadata}
                      vectorSearchRewrite={vectorSearchRewrite}
                      handleSettingChange={handleSettingChange}
                      guidedLearning={guidedLearning}
                      documentsOnly={documentsOnly}
                      systemPromptOnly={systemPromptOnly}
                      handleCheckboxChange={handleCheckboxChange}
                      handleCopyDefaultPrompt={handleCopyDefaultPrompt}
                      resetModalOpened={resetModalOpened}
                      openResetModal={openResetModal}
                      closeResetModal={closeResetModal}
                      resetSystemPrompt={resetSystemPrompt}
                      linkGeneratorOpened={linkGeneratorOpened}
                      openLinkGenerator={openLinkGenerator}
                      closeLinkGenerator={() => {
                        closeLinkGenerator();
                        setLinkGenInitialPromptSuffix(undefined); // Reset suffix on close
                      }}
                      course_name={course_name}
                      customSystemPrompts={customSystemPrompts}
                      initialActivePromptForLink={linkGenInitialPromptSuffix} // Pass new state
                    />
                  </div>
                )}

                {/* End of right side of Card */}
              </Flex>
            </Card>

            {/* Custom System Prompts Section */}
            <CustomPromptsTable
              customSystemPrompts={customSystemPrompts}
              theme={theme}
              montserrat_heading={montserrat_heading}
              montserrat_paragraph={montserrat_paragraph}
              onOpenAddEditModal={handleOpenCustomPromptModal} // This handles both add (no arg) and edit (with arg)
              onCopyToClipboard={handleCopyToClipboard} 
              onDeletePrompt={handleInitiateDeleteCustomPrompt}
              onToggleFavorite={handleToggleFavoritePrompt}
              onOpenLinkGeneratorModal={handleOpenLinkGeneratorModal} // Pass the new handler
            />

            {/* Modal for Adding/Editing Custom System Prompts */}
            <CustomPromptModal
              opened={customPromptModalOpened}
              onClose={handleCloseCustomPromptModal}
              editingCustomPromptId={editingCustomPromptId}
              customPromptForm={customPromptForm}
              handleCustomPromptFormChange={handleCustomPromptFormChange}
              handleSaveCustomPrompt={handleSaveCustomPrompt}
              theme={theme}
              montserrat_heading={montserrat_heading}
              montserrat_paragraph={montserrat_paragraph}
            />

            {/* Delete Confirmation Modal */}
            <DeleteCustomPromptModal
              opened={deleteConfirmModalOpened}
              onClose={closeDeleteConfirmModal}
              onConfirm={handleConfirmDeleteCustomPrompt}
              promptName={promptToDelete?.name}
              theme={theme}
              montserrat_heading={montserrat_heading}
              montserrat_paragraph={montserrat_paragraph}
            />

            {/* End of Custom System Prompts Section */}
          </Flex>
        </div>
        <GlobalFooter />
      </main>
    </>
  )
}

export default CourseMain
