// src/pages/[course_name]/prompt.tsx
'use client'
import { type NextPage } from 'next'
import MakeNewCoursePage from '~/components/UIUC-Components/MakeNewCoursePage'
import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Montserrat } from 'next/font/google'
import { useRouter } from 'next/router'
import { useUser } from '@clerk/nextjs'
import { CannotEditGPT4Page } from '~/components/UIUC-Components/CannotEditGPT4'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import {
  LoadingPlaceholderForAdminPages,
  MainPageBackground,
} from '~/components/UIUC-Components/MainPageBackground'
import { AuthComponent } from '~/components/UIUC-Components/AuthToEditCourse'
import {
  Button,
  Card,
  Collapse,
  Flex,
  Group,
  Indicator,
  List,
  MantineTheme,
  Modal,
  Paper,
  Text,
  Textarea,
  Title,
  Tooltip,
  useMantineTheme,
  Divider,
} from '@mantine/core'
import { extractEmailsFromClerk } from '~/components/UIUC-Components/clerkHelpers'
import { DEFAULT_SYSTEM_PROMPT, GUIDED_LEARNING_PROMPT } from '~/utils/app/const'
import { type CourseMetadata } from '~/types/courseMetadata'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { callSetCourseMetadata } from '~/utils/apiUtils'
import Navbar from '~/components/UIUC-Components/navbars/Navbar'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'
import {
  IconAlertTriangle,
  IconCheck,
  IconExternalLink,
  IconLayoutSidebarRight,
  IconLayoutSidebarRightExpand,
  IconSparkles,
  IconInfoCircle,
  IconCopy,
  IconChevronDown,
  IconChevronUp,
  IconBook,
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useChat } from 'ai/react'
import GlobalFooter from '../../components/UIUC-Components/GlobalFooter'
import { debounce } from 'lodash'
import CustomSwitch from '~/components/Switches/CustomSwitch' // Import the CustomSwitch component
import CustomCopyButton from '~/components/Buttons/CustomCopyButton' // Import the CustomCopyButton component
import { useDebouncedCallback } from 'use-debounce';

const montserrat = Montserrat({
  weight: '700',
  subsets: ['latin'],
})

const DOCUMENT_FOCUS_PROMPT = `

You must strictly adhere to the following rules:

1. Use ONLY information from the provided documents.
2. If the answer isn't in the documents, state: "The provided documents don't contain this information."
3. Do not use external knowledge, make assumptions, or infer beyond the documents' content.
4. Do not answer questions outside the documents' scope.

Your responses must be based solely on the content of the provided documents.
`

// Add this type to handle partial updates
type PartialCourseMetadata = {
  [K in keyof CourseMetadata]?: CourseMetadata[K];
};

const CourseMain: NextPage = () => {
  const theme = useMantineTheme()
  const router = useRouter()

  const GetCurrentPageName = () => {
    return router.query.course_name as string // Change this line
  }
  const isSmallScreen = useMediaQuery('(max-width: 1280px)')
  const course_name = GetCurrentPageName() as string
  const { user, isLoaded, isSignedIn } = useUser()
  const [courseExists, setCourseExists] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [courseMetadata, setCourseMetadata] = useState<CourseMetadata | null>(
    null,
  )
  const [baseSystemPrompt, setBaseSystemPrompt] = useState('')
  const [opened, { close, open }] = useDisclosure(false)
  const [resetModalOpened, { close: closeResetModal, open: openResetModal }] = useDisclosure(false)
  const [apiKey, setApiKey] = useState<string | undefined>(undefined)
  const { messages, input, handleInputChange, reload, setMessages, setInput } =
    useChat({
      api: '/api/chat/openAI',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })
  const [optimizedSystemPrompt, setOptimizedSystemPrompt] = useState('')
  const [isRightSideVisible, setIsRightSideVisible] = useState(true)

  // Updated state variables for checkboxes
  const [guidedLearning, setGuidedLearning] = useState(false)
  const [documentsOnly, setDocumentsOnly] = useState(false)
  const [systemPromptOnly, setSystemPromptOnly] = useState(false)
  const [vectorSearchRewrite, setVectorSearchRewrite] = useState(false)
  const [insightsOpen, setInsightsOpen] = useState(false)

  const courseMetadataRef = useRef<CourseMetadata | null>(null);

  useEffect(() => {
    courseMetadataRef.current = courseMetadata;
  }, [courseMetadata]);

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
        fetchedMetadata.system_prompt ?? DEFAULT_SYSTEM_PROMPT ?? ''
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
  }, [baseSystemPrompt, setInput])

  const handleSystemPromptSubmit = async (newSystemPrompt: string | undefined) => {
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
        system_prompt: null,  // Explicitly set to undefined
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
    guidedLearning: boolean;
    documentsOnly: boolean;
    systemPromptOnly: boolean;
    vectorSearchRewrite: boolean;
  }>({
    guidedLearning: false,
    documentsOnly: false,
    systemPromptOnly: false,
    vectorSearchRewrite: false,
  });

  useEffect(() => {
    if (courseMetadata) {
      initialSwitchStateRef.current = {
        guidedLearning: courseMetadata.guidedLearning || false,
        documentsOnly: courseMetadata.documentsOnly || false,
        systemPromptOnly: courseMetadata.systemPromptOnly || false,
        vectorSearchRewrite: !courseMetadata.vector_search_rewrite_disabled,
      };
    }
  }, [courseMetadata]);

  const saveSettings = async () => {
    if (!courseMetadataRef.current || !course_name) return;

    const currentSwitchState = {
      guidedLearning,
      documentsOnly,
      systemPromptOnly,
      vectorSearchRewrite,
    };

    const initialSwitchState = initialSwitchStateRef.current;

    const hasChanges = (Object.keys(currentSwitchState) as Array<keyof typeof currentSwitchState>).some(
      (key) => currentSwitchState[key] !== initialSwitchState[key]
    );

    if (!hasChanges) {
      return;
    }

    const updatedMetadata = {
      ...courseMetadataRef.current,
      guidedLearning,
      documentsOnly,
      systemPromptOnly,
      vector_search_rewrite_disabled: !vectorSearchRewrite,
    } as CourseMetadata;

    try {
      const success = await callSetCourseMetadata(course_name, updatedMetadata);
      if (!success) {
        showToastNotification(theme, 'Error', 'Failed to update settings', true);
        return;
      }

      setCourseMetadata(updatedMetadata);
      initialSwitchStateRef.current = currentSwitchState;

      const changes: string[] = [];
      if (initialSwitchState.vectorSearchRewrite !== currentSwitchState.vectorSearchRewrite) {
        changes.push(`Smart Document Search ${currentSwitchState.vectorSearchRewrite ? 'enabled' : 'disabled'}`);
      }
      if (initialSwitchState.guidedLearning !== currentSwitchState.guidedLearning) {
        changes.push(`Guided Learning ${currentSwitchState.guidedLearning ? 'enabled' : 'disabled'}`);
      }
      if (initialSwitchState.documentsOnly !== currentSwitchState.documentsOnly) {
        changes.push(`Document-Based References Only ${currentSwitchState.documentsOnly ? 'enabled' : 'disabled'}`);
      }
      if (initialSwitchState.systemPromptOnly !== currentSwitchState.systemPromptOnly) {
        changes.push(`Bypass UIUC.chat's internal prompting ${currentSwitchState.systemPromptOnly ? 'enabled' : 'disabled'}`);
      }

      if (changes.length > 0) {
        showToastNotification(
          theme,
          changes.join(' & '),
          'Settings have been saved successfully',
          false
        );
      }
    } catch (error) {
      console.error('Error updating course settings:', error);
      showToastNotification(theme, 'Error', 'Failed to update settings', true);
    }
  };

  const debouncedSaveSettings = useDebouncedCallback(saveSettings, 500);

  const handleSettingChange = (updates: PartialCourseMetadata) => {
    if (!courseMetadata) return;

    if ('vector_search_rewrite_disabled' in updates) {
      setVectorSearchRewrite(!updates.vector_search_rewrite_disabled);
    }

    courseMetadataRef.current = {
      ...courseMetadataRef.current!,
      ...updates,
    } as CourseMetadata;

    debouncedSaveSettings();
  };

  const handleCheckboxChange = async (updatedFields: PartialCourseMetadata) => {
    if (!courseMetadata || !course_name) {
      showToastNotification(theme, 'Error', 'Failed to update settings', true);
      return;
    }

    if ('guidedLearning' in updatedFields) setGuidedLearning(updatedFields.guidedLearning!);
    if ('documentsOnly' in updatedFields) setDocumentsOnly(updatedFields.documentsOnly!);
    if ('systemPromptOnly' in updatedFields) setSystemPromptOnly(updatedFields.systemPromptOnly!);

    const newSystemPrompt = updateSystemPrompt(updatedFields);
    setBaseSystemPrompt(newSystemPrompt);

    courseMetadataRef.current = {
      ...courseMetadataRef.current!,
      ...updatedFields,
      system_prompt: newSystemPrompt,
    } as CourseMetadata;

    debouncedSaveSettings();
  };

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

  // Check auth - https://clerk.com/docs/nextjs/read-session-and-user-data
  if (!isLoaded || isLoading) {
    return <LoadingPlaceholderForAdminPages />
  }

  if (!isSignedIn) {
    console.log('User not logged in', isSignedIn, isLoaded, course_name)
    return <AuthComponent course_name={course_name} />
  }

  const user_emails = extractEmailsFromClerk(user)

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
          <a className="goldUnderline" href="mailto:kvday2@illinois.edu">
            kvday2@illinois.edu
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

  const handleSubmitPromptOptimization = async (
    e: any,
    reload: any,
    setMessages: any,
  ) => {
    let newApiKey
    if (courseMetadata?.openai_api_key) {
      newApiKey = courseMetadata.openai_api_key
    }
    setApiKey(newApiKey)

    // console.log('apikey set to', apiKey)
    e.preventDefault()

    const systemPrompt = `Understand the Task: Grasp the main objective, goals, requirements, constraints, and expected output.

- Minimal Changes: If an existing prompt is provided, improve it only if it's simple. For complex prompts, enhance clarity and add missing elements without altering the original structure.

- Reasoning Before Conclusions: Encourage reasoning steps before any conclusions are reached. ATTENTION! If the user provides examples where the reasoning happens afterward, REVERSE the order! NEVER START EXAMPLES WITH CONCLUSIONS!
  - Reasoning Order: Call out reasoning portions of the prompt and conclusion parts (specific fields by name). For each, determine the ORDER in which this is done, and whether it needs to be reversed.
  - Conclusion, classifications, or results should ALWAYS appear last.

- Examples: Include high-quality examples if helpful, using placeholders [in brackets] for complex elements.
  - What kinds of examples may need to be included, how many, and whether they are complex enough to benefit from placeholders.

- Clarity and Conciseness: Use clear, specific language. Avoid unnecessary instructions or bland statements.

- Formatting: Use markdown features for readability. DO NOT USE \`\`\` CODE BLOCKS UNLESS SPECIFICALLY REQUESTED.

- Preserve User Content: If the input task or prompt includes extensive guidelines or examples, preserve them entirely, or as closely as possible. If they are vague, consider breaking down into sub-steps. Keep any details, guidelines, examples, variables, or placeholders provided by the user.

- Constants: DO include constants in the prompt, as they are not susceptible to prompt injection. Such as guides, rubrics, and examples.

- Output Format: Explicitly the most appropriate output format, in detail. This should include length and syntax (e.g. short sentence, paragraph, JSON, etc.)
  - For tasks outputting well-defined or structured data (classification, JSON, etc.) bias toward outputting a JSON.
  - JSON should never be wrapped in code blocks (\`\`\`) unless explicitly requested.

The final prompt you output should adhere to the following structure below. Do not include any additional commentary, only output the completed system prompt. SPECIFICALLY, do not include any additional messages at the start or end of the prompt. (e.g. no "---")

[Concise instruction describing the task - this should be the first line in the prompt, no section header]

[Additional details as needed.]

[Optional sections with headings or bullet points for detailed steps.]

# Steps [optional]

[optional: a detailed breakdown of the steps necessary to accomplish the task]

# Output Format

[Specifically call out how the output should be formatted, be it response length, structure e.g. JSON, markdown, etc]

# Examples [optional]

[Optional: 1-3 well-defined examples with placeholders if necessary. Clearly mark where examples start and end, and what the input and output are. User placeholders as necessary.]
[If the examples are shorter than what a realistic example is expected to be, make a reference with () explaining how real examples should be longer / shorter / different. AND USE PLACEHOLDERS! ]

# Notes [optional]

[optional: edge cases, details, and an area to call or repeat out specific important considerations]`

    setMessages([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: e.target[0].value },
    ])
    reload()
  }

  return (
    <>
      <Navbar course_name={router.query.course_name as string} />
      <main className="course-page-main min-w-screen flex min-h-screen flex-col items-center pb-4">
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
                          className={`${montserrat_heading.variable} min-w-0 font-montserratHeading text-base sm:text-xl ${course_name.length > 40
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
                        <Paper
                          className="rounded-xl w-full px-4 sm:px-6 md:px-8"
                          shadow="xs"
                          p="md"
                          sx={{
                            backgroundColor: '#15162c',
                            border: '1px solid rgba(147, 51, 234, 0.3)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: '#1a1b34',
                              borderColor: 'rgba(147, 51, 234, 0.5)',
                              transform: 'translateY(-1px)',
                            },
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
                                  color: 'hsl(280,100%,70%)',
                                }}
                              />
                              <Text
                                size="md"
                                weight={600}
                                className={`${montserrat_paragraph.variable} select-text font-montserratParagraph`}
                                variant="gradient"
                                gradient={{ from: 'gold', to: 'white', deg: 50 }}
                              >
                                Prompt Engineering Guide
                              </Text>
                            </Flex>
                            <div
                              className="transition-transform duration-200"
                              style={{
                                transform: insightsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                color: 'hsl(280,100%,70%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <IconChevronDown size={24} />
                            </div>
                          </Flex>

                          <Collapse in={insightsOpen} transitionDuration={200}>
                            <div className="mt-4 px-2">
                              <Text
                                size="md"
                                className={`${montserrat_paragraph.variable} select-text font-montserratParagraph`}
                              >
                                For additional insights and best practices on prompt creation, please review:
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
                                        backgroundColor: 'hsl(280,100%,70%)',
                                        marginTop: '8px'
                                      }}
                                    />
                                  }
                                >
                                  <List.Item>
                                    <a
                                      className={`text-sm hover:text-purple-400 transition-colors duration-200 ${montserrat_paragraph.variable} font-montserratParagraph`}
                                      style={{ color: 'hsl(280,100%,70%)' }}
                                      href="https://platform.openai.com/docs/guides/prompt-engineering"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      The Official OpenAI Prompt Engineering Guide
                                      <IconExternalLink
                                        size={18}
                                        className="inline-block pl-1"
                                        style={{ position: 'relative', top: '-2px' }}
                                      />
                                    </a>
                                  </List.Item>
                                  <List.Item>
                                    <a
                                      className={`text-sm hover:text-purple-400 transition-colors duration-200 ${montserrat_paragraph.variable} font-montserratParagraph`}
                                      style={{ color: 'hsl(280,100%,70%)' }}
                                      href="https://docs.anthropic.com/claude/prompt-library"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      The Official Anthropic Prompt Library
                                      <IconExternalLink
                                        size={18}
                                        className="inline-block pl-1"
                                        style={{ position: 'relative', top: '-2px' }}
                                      />
                                    </a>
                                  </List.Item>
                                </List>

                                <Text
                                  className={`label ${montserrat_paragraph.variable} inline-block select-text font-montserratParagraph`}
                                  size="md"
                                  style={{ marginTop: '1.5rem' }}
                                >
                                  The System Prompt provides the foundation for every conversation in this project. It defines the model&apos;s role, tone, and behavior. Consider including:
                                  <List
                                    withPadding
                                    className="mt-2"
                                    spacing="xs"
                                    icon={
                                      <div
                                        style={{
                                          width: '6px',
                                          height: '6px',
                                          borderRadius: '50%',
                                          backgroundColor: 'hsl(280,100%,70%)',
                                          marginTop: '8px'
                                        }}
                                      />
                                    }
                                  >
                                    <List.Item>Key instructions or examples</List.Item>
                                    <List.Item>A warm welcome message</List.Item>
                                    <List.Item>Helpful links for further learning</List.Item>
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
                            background: '#15162c',
                          }}
                          className="rounded-xl px-4 py-6 sm:px-6 sm:py-6 md:px-8"
                        >
                          <div
                            style={{
                              width: '100%',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              background: '#15162c',
                            }}
                          >
                            <Flex justify="space-between" align="center">
                              <Title
                                className={`label ${montserrat_heading.variable} pl-3 font-montserratHeading md:pl-0`}
                                variant="gradient"
                                gradient={{ from: 'gold', to: 'white', deg: 170 }}
                                order={4}
                              >
                                System Prompt
                              </Title>
                              {isRightSideVisible ? (
                                <Tooltip label="Close Prompt Builder" key="close">
                                  <div className="cursor-pointer p-4 hover:opacity-75 md:p-0">
                                    <IconLayoutSidebarRight
                                      stroke={2}
                                      onClick={() =>
                                        setIsRightSideVisible(!isRightSideVisible)
                                      }
                                    />
                                  </div>
                                </Tooltip>
                              ) : (
                                <Tooltip label="Open Prompt Builder" key="open">
                                  <div className="cursor-pointer p-4 hover:opacity-75 md:p-0">
                                    <IconLayoutSidebarRightExpand
                                      stroke={2}
                                      onClick={() =>
                                        setIsRightSideVisible(!isRightSideVisible)
                                      }
                                    />
                                  </div>
                                </Tooltip>
                              )}{' '}
                            </Flex>
                            <form
                              className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                              onSubmit={(e) =>
                                handleSubmitPromptOptimization(
                                  e,
                                  reload,
                                  setMessages,
                                )
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
                                    fontFamily: 'var(--font-montserratParagraph)',
                                    '&:focus': {
                                      borderColor: '#8441ba',
                                      boxShadow: '0 0 0 1px #8441ba'
                                    }
                                  }
                                }}
                              />
                              <Group mt="md" spacing="sm">
                                <Button
                                  className={`relative bg-purple-800 text-white hover:border-indigo-600 hover:bg-indigo-600 ${montserrat_paragraph.variable} font-montserratParagraph`}
                                  type="button"
                                  onClick={() => {
                                    handleSystemPromptSubmit(baseSystemPrompt)
                                  }}
                                  style={{ minWidth: 'fit-content' }}
                                >
                                  Update System Prompt
                                </Button>
                                <Button
                                  type="submit"
                                  onClick={open}
                                  style={{
                                    minWidth: 'fit-content',
                                    background:
                                      'linear-gradient(90deg, #6d28d9 0%, #4f46e5 50%, #2563eb 100%)',
                                    transition: 'background 0.3s ease-in-out',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '0 8px',
                                    backgroundSize: '100% 100%',
                                    backgroundRepeat: 'no-repeat',
                                    boxSizing: 'border-box',
                                    border: 'none',
                                    outline: 'none',
                                    backgroundOrigin: 'border-box',
                                    backgroundClip: 'border-box',
                                  }}
                                  className={`relative text-white ${montserrat_paragraph.variable} font-montserratParagraph`}
                                  onMouseEnter={(e) =>
                                  (e.currentTarget.style.background =
                                    'linear-gradient(90deg, #4f46e5 0%, #2563eb 50%, #6d28d9 100%)')
                                  }
                                  onMouseLeave={(e) =>
                                  (e.currentTarget.style.background =
                                    'linear-gradient(90deg, #6d28d9 0%, #4f46e5 50%, #2563eb 100%)')
                                  }
                                >
                                  <IconSparkles
                                    stroke={1}
                                    style={{ marginRight: '4px' }}
                                  />
                                  Optimize System Prompt
                                </Button>
                              </Group>

                              <Modal
                                opened={opened}
                                onClose={close}
                                size="xl"
                                title="Optimized System Prompt"
                                className={`${montserrat_heading.variable} rounded-xl font-montserratHeading`}
                                centered
                                radius={'lg'}
                                styles={{
                                  title: { marginTop: '1rem' },
                                  header: { backgroundColor: '#15162c' },
                                  content: { backgroundColor: '#15162c' },
                                }}
                              >
                                <Group mt="md">
                                  {messages.map((message, i, { length }) => {
                                    if (
                                      length - 1 === i &&
                                      message.role === 'assistant'
                                    ) {
                                      return (
                                        <div
                                          key={i}
                                          style={{
                                            border: '1px solid #6D28D9',
                                            padding: '10px',
                                            borderRadius: '5px',
                                            whiteSpace: 'pre-wrap',
                                          }}
                                          className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                                        >
                                          {message.content}
                                        </div>
                                      )
                                    }
                                  }, null)}

                                  {/* TODO: add the return value if there is no message found
                                    double confirm the handleSystemPromptSubmit */}
                                  <Button
                                    className="relative m-1 self-end bg-purple-800 text-white hover:border-indigo-600 hover:bg-indigo-600"
                                    type="button"
                                    onClick={() => {
                                      const lastMessage =
                                        messages[messages.length - 1]
                                      if (
                                        lastMessage &&
                                        lastMessage.role === 'assistant'
                                      ) {
                                        const newSystemPrompt =
                                          lastMessage.content
                                        setOptimizedSystemPrompt(newSystemPrompt)
                                        setBaseSystemPrompt(newSystemPrompt)
                                        handleSystemPromptSubmit(newSystemPrompt)
                                        console.log(
                                          'system prompt',
                                          newSystemPrompt,
                                        )
                                      }
                                      close()
                                    }}
                                    style={{ minWidth: 'fit-content' }}
                                  >
                                    Update System Prompt
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="relative m-1 self-end bg-red-500 text-white hover:border-red-600 hover:bg-red-600"
                                    onClick={close}
                                  >
                                    Cancel
                                  </Button>
                                </Group>
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
                        backgroundColor: '#15162c',
                        color: 'white',
                      }}
                    >
                      <div className="card flex h-full flex-col">
                        <Flex direction="column" m="3rem" gap="md">
                          <Flex align="center">
                            <Title
                              className={`${montserrat_heading.variable} font-montserratHeading`}
                              variant="gradient"
                              gradient={{ from: 'gold', to: 'white', deg: 170 }}
                              order={3}
                              pl={'md'}
                              pr={'md'}
                              pt={'sm'}
                              pb={'xs'}
                              style={{ alignSelf: 'left', marginLeft: '-11px' }}
                            >
                              Document Search Optimization
                            </Title>
                            <Indicator
                              label={
                                <Text className={`${montserrat_heading.variable} font-montserratHeading`}>
                                  New
                                </Text>
                              }
                              color="hsl(280,100%,70%)"
                              size={13}
                              styles={{
                                indicator: {
                                  top: '-17px !important',
                                  right: '7px !important',
                                },
                              }}
                            >
                              <span className={`${montserrat_heading.variable} font-montserratHeading`}></span>
                            </Indicator>
                          </Flex>

                          <CustomSwitch
                            label="Smart Document Search"
                            tooltip="When enabled, UIUC.chat optimizes your queries to better search through course materials and find relevant content. Note: This only affects how documents are searched - your chat messages remain exactly as you write them."
                            checked={vectorSearchRewrite}
                            onChange={(value: boolean) => {
                              handleSettingChange({ vector_search_rewrite_disabled: !value })
                            }}
                          />

                          <Divider />

                          <Flex align="center" style={{ paddingTop: '15px' }}>
                            <Title
                              className={`label ${montserrat_heading.variable} mr-[8px] font-montserratHeading`}
                              variant="gradient"
                              gradient={{ from: 'gold', to: 'white', deg: 170 }}
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
                              color="hsl(280,100%,70%)"
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
                                  handleCheckboxChange({ guidedLearning: value })
                                }
                              />

                              {/* Add Guided Learning URL Copy Button - only show when guided learning is off */}
                              {!guidedLearning && (
                                <div className="ml-[82px] mt-2">
                                  <CustomCopyButton
                                    label="Share Guided Learning Link"
                                    tooltip="Share this URL with students who would benefit from a guided learning experience. When students use this link, the AI will encourage problem-solving through questions and hints while providing relevant course materials and citations. Students can return to standard mode by using the regular course URL."
                                    onClick={() => {
                                      const currentUrl = window.location.origin;
                                      const chatUrl = `${currentUrl}/${course_name}/chat?guided_learning=true`;
                                      navigator.clipboard.writeText(chatUrl).then(() => {
                                        showToastNotification(
                                          theme,
                                          'Copied',
                                          'Guided Learning URL copied to clipboard',
                                        );
                                      }).catch((err) => {
                                        console.error('Could not copy URL: ', err);
                                        showToastNotification(
                                          theme,
                                          'Error Copying',
                                          'Could not copy URL to clipboard',
                                          true,
                                        );
                                      });
                                    }}
                                  />
                                </div>
                              )}
                            </div>

                            <CustomSwitch
                              label="Document-Based References Only"
                              tooltip="Restricts the AI to use only information from the provided documents. Useful for maintaining accuracy in fields like legal research where external knowledge could be problematic."
                              checked={documentsOnly}
                              onChange={(value: boolean) =>
                                handleCheckboxChange({ documentsOnly: value })
                              }
                            />

                            <CustomSwitch
                              label="Bypass UIUC.chat&apos;s internal prompting"
                              tooltip="Internally, we prompt the model to (1) add citations and (2) always be as helpful as possible. You can bypass this for full un-modified control over your bot."
                              checked={systemPromptOnly}
                              onChange={(value: boolean) =>
                                handleCheckboxChange({ systemPromptOnly: value })
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
                                  label="Copy UIUC.chat&apos;s internal prompt"
                                  tooltip="You can use and customize our default internal prompting to suit your needs. Note, only the specific citation formatting described will work with our citation &apos;find and replace&apos; system. This provides a solid starting point for defining AI behavior in raw prompt mode."
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
                                  gradient={{ from: 'red', to: 'white', deg: 45 }}
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
                                  marginBottom: '16px'
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
                                  marginTop: '4px'
                                }
                              }}
                            >
                              <Flex direction="column" gap="xl" style={{ marginTop: '8px' }}>
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
                                    style={{ color: 'white', lineHeight: 1.5 }}
                                  >
                                    Are you sure you want to reset your system prompt and all behavior settings to their default values?
                                  </Text>
                                </Flex>

                                <Divider style={{ borderColor: 'rgba(255,255,255,0.1)' }} />

                                <div>
                                  <Text
                                    size="sm"
                                    className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                                    weight={600}
                                    style={{ color: '#D1D1D1', marginBottom: '12px' }}
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
                                          marginTop: '8px'
                                        }}
                                      />
                                    }
                                  >
                                    <List.Item>Restore the system prompt to the default template</List.Item>
                                    <List.Item>Disable Guided Learning, Document-Only mode, and other custom settings</List.Item>
                                  </List>
                                </div>

                                <Text
                                  size="sm"
                                  style={{ color: '#D1D1D1' }}
                                  className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                                >
                                  This cannot be undone. Please confirm you wish to proceed.
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
                                          backgroundColor: theme.colors.gray[8],
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
                                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                                      transition: 'all 0.2s ease',
                                      '&:hover': {
                                        backgroundColor: `${theme.colors.red[9]} !important`,
                                        transform: 'translateY(-1px)',
                                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                                      },
                                      '&:active': {
                                        transform: 'translateY(0)',
                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                                      },
                                    })}
                                    onClick={() => {
                                      resetSystemPrompt();
                                      closeResetModal();
                                    }}
                                  >
                                    Confirm
                                  </Button>
                                </Group>
                              </Flex>
                            </Modal>

                            <Flex mt="md" justify="flex-start">
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
                                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                                  transition: 'all 0.2s ease',
                                  '&:hover': {
                                    backgroundColor: `${theme.colors.red[9]} !important`,
                                    transform: 'translateY(-1px)',
                                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                                  },
                                  '&:active': {
                                    transform: 'translateY(0)',
                                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                                  },
                                })}
                                onClick={openResetModal}
                              >
                                Reset Prompting Settings
                              </Button>
                            </Flex>
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
    </>
  )
}

export const showToastNotification = (
  theme: MantineTheme,
  title: string,
  message: string,
  isError = false,
  icon?: React.ReactNode,
) => {
  notifications.show({
    withCloseButton: true,
    autoClose: 5000,
    title: title,
    message: message,
    icon: icon || (isError ? <IconAlertTriangle /> : <IconCheck />),
    styles: {
      root: {
        backgroundColor: '#1A1B1E', // Dark background to match the page
        borderColor: isError ? '#E53935' : '#6D28D9', // Red for errors, purple for success
        borderWidth: '1px',
        borderStyle: 'solid',
        borderRadius: '8px', // Added rounded corners
      },
      title: {
        color: '#FFFFFF', // White text for the title
        fontWeight: 600,
      },
      description: {
        color: '#D1D1D1', // Light gray text for the message
      },
      closeButton: {
        color: '#FFFFFF', // White color for the close button
        borderRadius: '4px', // Added rounded corners to close button
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.1)', // Subtle hover effect
        },
      },
      icon: {
        backgroundColor: 'transparent', // Transparent background for the icon
        color: isError ? '#E53935' : '#6D28D9', // Icon color matches the border
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