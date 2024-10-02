// src/pages/[course_name]/prompt.tsx
'use client'
import { type NextPage } from 'next'
import MakeNewCoursePage from '~/components/UIUC-Components/MakeNewCoursePage'
import React, { useEffect, useState, useCallback } from 'react'
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
  Flex,
  Group,
  List,
  MantineTheme,
  Modal,
  Paper,
  Text,
  Textarea,
  Title,
  Tooltip,
  useMantineTheme,
} from '@mantine/core'
import { extractEmailsFromClerk } from '~/components/UIUC-Components/clerkHelpers'
import { DEFAULT_SYSTEM_PROMPT } from '~/utils/app/const'
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
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useChat } from 'ai/react'
import GlobalFooter from '../../components/UIUC-Components/GlobalFooter'
import { debounce } from 'lodash'
import CustomSwitch from '~/components/Switches/CustomSwitch' // Import the CustomSwitch component

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

const GUIDED_LEARNING_PROMPT =
  '\n\nYou are an AI tutor dedicated to helping students discover the joy of learning by guiding them to find answers on their own. Your role is not just to teach but to spark curiosity and excitement in each subject. You never provide direct answers or detailed step-by-step solutions, no matter the problem. Instead, with limitless patience and enthusiasm, you ask insightful questions and offer hints that inspire critical thinking and problem-solving. Your goal is to help learners experience the thrill of discovery and build confidence in their ability to find solutions independently—like a great teaching assistant who makes learning fun and rewarding.\n\n' +
  'Key approaches:\n\n' +
  '1. **Ask Open-Ended Questions**: Lead students with questions that encourage exploration, making problem-solving feel like an exciting challenge.\n' +
  '2. **Guide Without Giving Specific Steps**: Offer general insights and hints that keep students thinking creatively without giving direct solutions.\n' +
  '3. **Explain Concepts Without Revealing Answers**: Provide engaging explanations of concepts that deepen understanding while leaving the solution for the student to uncover.\n\n' +
  'Strict guidelines:\n\n' +
  '- **Never Provide Solutions**: Avoid any form of direct or partial solutions. Always redirect learners to approach the problem with fresh questions and ideas.\n' +
  '- **Resist Workarounds**: If a student seeks the answer, gently steer them back to thoughtful reflection, keeping the excitement alive in the process of discovery.\n' +
  '- **Encourage Independent Thinking**: Use probing questions to spark analysis and creative thinking, helping students feel empowered by their own problem-solving skills.\n' +
  '- **Support, Motivate, and Inspire**: Keep a warm, encouraging tone, showing genuine excitement about the learning journey. Celebrate their persistence and successes, no matter how small, to make learning enjoyable and fulfilling.'

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
        fetchedMetadata.system_prompt || DEFAULT_SYSTEM_PROMPT,
      )

      // Initialize checkbox states
      setGuidedLearning(fetchedMetadata.guidedLearning || false)
      setDocumentsOnly(fetchedMetadata.documentsOnly || false)
      setSystemPromptOnly(fetchedMetadata.systemPromptOnly || false)

      setIsLoading(false)
    }
    fetchCourseData()
  }, [router.isReady, course_name])

  useEffect(() => {
    setInput(baseSystemPrompt)
  }, [baseSystemPrompt, setInput])

  const handleSystemPromptSubmit = async (newSystemPrompt: string) => {
    let success = false
    if (courseMetadata && course_name && newSystemPrompt) {
      const updatedCourseMetadata = {
        ...courseMetadata,
        system_prompt: newSystemPrompt,
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
        system_prompt: DEFAULT_SYSTEM_PROMPT,
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
        // Reset the base system prompt and checkbox states
        setBaseSystemPrompt(DEFAULT_SYSTEM_PROMPT)
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

  const handleCheckboxChange = async (
    updatedFields: Partial<CourseMetadata>,
  ) => {
    if (!courseMetadata || !course_name) {
      showToastOnPromptUpdate(theme, true)
      return
    }

    // Immediately update local state
    const newCourseMetadata = { ...courseMetadata, ...updatedFields }
    const newSystemPrompt = updateSystemPrompt(updatedFields)

    setCourseMetadata(newCourseMetadata)
    setBaseSystemPrompt(newSystemPrompt)

    if (updatedFields.guidedLearning !== undefined) {
      setGuidedLearning(updatedFields.guidedLearning)
    }
    if (updatedFields.documentsOnly !== undefined) {
      setDocumentsOnly(updatedFields.documentsOnly)
    }
    if (updatedFields.systemPromptOnly !== undefined) {
      setSystemPromptOnly(updatedFields.systemPromptOnly)
    }

    // Debounced API call
    debouncedSave({ ...newCourseMetadata, system_prompt: newSystemPrompt })
  }

  const debouncedSave = useCallback(
    debounce(async (updatedMetadata: CourseMetadata) => {
      const success = await callSetCourseMetadata(course_name, updatedMetadata)
      if (!success) {
        showToastOnPromptUpdate(theme, true)
      } else {
        showToastOnPromptUpdate(theme)
      }
    }, 500),
    [course_name, theme],
  )

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

    console.log('apikey set to', apiKey)
    e.preventDefault()

    const systemPrompt = `You are an expert at optimizing system prompts for AI assistants to ensure they perform tasks consistently, accurately, and effectively. Your task is to rewrite the following system prompt to make it clear, precise, and actionable for the AI assistant. The optimized prompt should:

      1. **Detailed Task Explanation**: Start with a clear description of the assistant's role, objectives, and desired outcomes.

      2. **Step-by-Step Guidance**: Provide sequential instructions with specific actions the assistant should take at each step.

      3. **Examples and Clarifications**: Include examples to illustrate key points and clarify any potential ambiguities.

      4. **Professional Tailoring**: Ensure the final instructions are professionally tailored, clear, concise, and directly usable.

      **Additional Guidelines:**

      - **Clarity and Conciseness**: Use straightforward language to avoid confusion and keep instructions brief.

      - **Avoid Redundancy**: Eliminate unnecessary repetition to maintain focus on key instructions.

      - **User-Centric Focus**: Emphasize understanding and fulfilling the user's needs and questions.

      - **Positive and Professional Tone**: Encourage responses that are friendly, respectful, and professional.

      - **Flexibility**: Allow the assistant to adapt its responses based on the context and the user's intent.

      **Note**: Avoid unnecessary verbosity or repetition that could obscure important instructions.

      Please optimize the following system prompt accordingly:`

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
              className="mt-[2%] w-[96%] md:w-[90%]"
            >
              <Flex
                direction={isSmallScreen ? 'column' : 'row'}
                style={{ height: '100%' }}
              >
                <div
                  style={{
                    flex: isSmallScreen ? '1 1 100%' : '1 1 60%',
                    padding: '1rem',
                    color: 'white',
                    alignItems: 'center',
                  }}
                  className="min-h-full justify-center bg-gradient-to-r from-purple-900 via-indigo-800 to-blue-800"
                >
                  <div className="card flex h-full flex-col">
                    <Group
                      m="3rem"
                      align="center"
                      variant="column"
                      className="w-[100%] md:w-[90%] lg:w-[80%]"
                      style={{
                        justifyContent: 'center',
                        alignSelf: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      <Title
                        order={2}
                        variant="gradient"
                        gradient={{ from: 'gold', to: 'white', deg: 50 }}
                        style={{ marginBottom: '0.5rem' }}
                        className={`label ${montserrat_heading.variable} font-montserratHeading`}
                      >
                        Customize System Prompt
                      </Title>
                      <Paper
                        className="rounded-xl"
                        shadow="xs"
                        p="md"
                        style={{
                          width: '100%',
                          backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        }}
                      >
                        <Text
                          size={'md'}
                          className={`${montserrat_paragraph.variable} select-text font-montserratParagraph`}
                        >
                          For guidance on crafting prompts, consult
                          <br />
                          <List withPadding>
                            <List.Item>
                              the
                              <a
                                className={`pl-1 text-sm text-purple-600 ${montserrat_paragraph.variable} font-montserratParagraph`}
                                href="https://platform.openai.com/docs/guides/prompt-engineering"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                official OpenAI prompt engineering guide
                                <IconExternalLink
                                  size={18}
                                  className="inline-block pl-1"
                                  style={{ position: 'relative', top: '-2px' }}
                                />
                              </a>
                            </List.Item>

                            <List.Item>
                              the
                              <a
                                className={`pl-1 text-sm text-purple-600 ${montserrat_paragraph.variable} font-montserratParagraph`}
                                href="https://docs.anthropic.com/claude/prompt-library"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                official Anthropic Prompt Library
                                <IconExternalLink
                                  size={18}
                                  className="inline-block pl-1"
                                  style={{ position: 'relative', top: '-2px' }}
                                />
                              </a>
                            </List.Item>
                          </List>
                        </Text>

                        <Text
                          className={`label ${montserrat_paragraph.variable} inline-block select-text font-montserratParagraph`}
                          size={'md'}
                        >
                          The System Prompt is used during <i>all</i>{' '}
                          conversations on this project. It is the most powerful
                          form of instructions to the model. It is the most
                          powerful form of instructions to the model.
                          <br></br>
                          Include the most salient information possible, like
                          good examples, welcome greetings and links to where
                          users can learn more about your work.
                        </Text>
                      </Paper>

                      <div
                        style={{
                          width: isRightSideVisible ? '100%' : '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          background: '#15162c',
                        }}
                        className="rounded-xl px-3 py-6 md:px-10 md:py-8"
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
                                },
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
                {/* RIGHT SIDE OF CARD */}
                {isRightSideVisible && courseMetadata && (
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
                        <Title
                          className={`label ${montserrat_heading.variable} font-montserratHeading`}
                          variant="gradient"
                          gradient={{ from: 'gold', to: 'white', deg: 170 }}
                          order={3}
                          style={{ paddingTop: '18px' }}
                        >
                          AI Behavior Settings
                        </Title>

                        {/* Enhanced Switches */}
                        <CustomSwitch
                          label="Guided Learning"
                          tooltip="Enables a tutoring mode where the AI encourages independent problem-solving. It provides hints and asks questions instead of giving direct answers, promoting critical thinking and discovery."
                          checked={guidedLearning}
                          onChange={(value: boolean) =>
                            handleCheckboxChange({ guidedLearning: value })
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
                            handleCheckboxChange({ systemPromptOnly: value })
                          }
                        />

                        {/* Conditional Button */}
                        {systemPromptOnly && (
                          <Flex
                            mt="sm"
                            direction="column"
                            gap="xs"
                            className="mt-[-4px] pl-12"
                          >
                            <Flex align="center" gap="xs">
                              <Button
                                className={`
                                  relative flex items-center 
                                  justify-center bg-purple-800 
                                  px-3 py-2
                                  text-center text-white transition-colors
                                  duration-200
                                  hover:bg-purple-700 active:bg-purple-900 
                                  ${montserrat_paragraph.variable} font-montserratParagraph
                                `}
                                onClick={handleCopyDefaultPrompt}
                                styles={(theme) => ({
                                  root: {
                                    height: 'auto',
                                    minHeight: 36,
                                  },
                                  inner: {
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexWrap: 'nowrap',
                                    gap: '4px',
                                  },
                                  label: {
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    '@media (max-width: 480px)': {
                                      whiteSpace: 'normal',
                                    },
                                  },
                                })}
                              >
                                <IconCopy size={18} className="mr-2" />
                                Copy UIUC.chat&apos;s internal prompt
                              </Button>
                              <Tooltip
                                label={
                                  <Text size="sm" color="gray.1">
                                    You can use and customize our default
                                    internal prompting to suit your needs. Note,
                                    only the specific citation formatting
                                    described will work with our citation
                                    &apos;find and replace&apos; system. This
                                    provides a solid starting point for defining
                                    AI behavior in raw prompt mode.
                                  </Text>
                                }
                                position="right"
                                withArrow
                                multiline
                                width={220}
                                styles={{
                                  tooltip: {
                                    backgroundColor: '#1A1B1E',
                                    color: theme.colors.gray[2],
                                    borderRadius: '4px',
                                    wordWrap: 'break-word',
                                  },
                                  arrow: {
                                    backgroundColor: '#1A1B1E',
                                  },
                                }}
                              >
                                <span
                                  aria-label="More information"
                                  style={{ cursor: 'pointer' }}
                                >
                                  <IconInfoCircle
                                    size={16}
                                    className={'text-gray-400'}
                                    style={{
                                      transition: 'all 0.2s ease-in-out',
                                    }}
                                  />
                                </span>
                              </Tooltip>
                            </Flex>
                          </Flex>
                        )}

                        {/* Reset Button */}
                        <Flex mt="md" justify="flex-start">
                          <Button
                            className="relative bg-red-500 text-white hover:border-red-600 hover:bg-red-600"
                            onClick={resetSystemPrompt}
                            style={{ minWidth: 'fit-content' }}
                          >
                            Reset
                          </Button>
                        </Flex>
                      </Flex>
                    </div>
                  </div>
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
