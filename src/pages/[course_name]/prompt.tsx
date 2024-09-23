// src/pages/[course_name]/api.tsx
'use client'
import { type NextPage } from 'next'
import MakeNewCoursePage from '~/components/UIUC-Components/MakeNewCoursePage'
import React, { useEffect, useState } from 'react'
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
  Checkbox,
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
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useChat } from 'ai/react'
import GlobalFooter from '../../components/UIUC-Components/GlobalFooter'

const montserrat = Montserrat({
  weight: '700',
  subsets: ['latin'],
})

const LATEX_PROMPT = '\n\nContent includes equations; LaTeX notation preferred.';

const DOCUMENT_FOCUS_PROMPT = '\n\nFocus exclusively on document-based references—avoid incorporating knowledge from outside sources. Essential for legal and similar fields to maintain response quality.';

const INTRO_PROMPT_IDENTIFIER = 'If the user asks an introductory question or greeting';

const getIntroMessage = (courseMetadata: CourseMetadata | null, course_name: string) => 
  courseMetadata?.course_intro_message
    ? `\n\n${courseMetadata.course_intro_message} ${INTRO_PROMPT_IDENTIFIER} along the lines of 'hello' or 'what can you do?' or 'What's in here ?' or 'what is ${course_name}?' or similar, then please respond with a warm welcome to ${course_name}, the AI ${course_name} assistant chatbot. Tell them that you can answer questions using the entire knowledge base of Extension. Feel free to ask!`
    : `\n\n${INTRO_PROMPT_IDENTIFIER} along the lines of 'hello' or 'what can you do?' or 'What's in here ?' or 'what is ${course_name}?' or similar, then please respond with a warm welcome to ${course_name}, the AI ${course_name} assistant chatbot. Tell them that you can answer questions using the entire knowledge base of the project: ${course_name}. Feel free to ask!`;

const GUIDED_LEARNING_PROMPT = '\n\nYou are an AI tutor dedicated to helping students discover the joy of learning by guiding them to find answers on their own. Your role is not just to teach but to spark curiosity and excitement in each subject. You never provide direct answers or detailed step-by-step solutions, no matter the problem. Instead, with limitless patience and enthusiasm, you ask insightful questions and offer hints that inspire critical thinking and problem-solving. Your goal is to help learners experience the thrill of discovery and build confidence in their ability to find solutions independently—like a great teaching assistant who makes learning fun and rewarding.\n\n' +
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
  const [checked1, setChecked1] = useState(false)
  const [checked2, setChecked2] = useState(false)
  const [checked3, setChecked3] = useState(false)
  const [checked4, setChecked4] = useState(false)
  const [checked5, setChecked5] = useState(false)


  const theme = useMantineTheme()
  const router = useRouter()

  const GetCurrentPageName = () => {
    // return router.asPath.slice(1).split('/')[0]
    // Possible improvement.
    return router.query.course_name as string // Change this line
  }
  const isSmallScreen = useMediaQuery('(max-width: 1280px)')
  const course_name = GetCurrentPageName() as string
  const { user, isLoaded, isSignedIn } = useUser()
  const [courseData, setCourseData] = useState(null)
  const [courseExists, setCourseExists] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [systemPrompt, setSystemPrompt] = useState('')
  const [courseMetadata, setCourseMetadata] = useState<CourseMetadata | null>(
    null,
  )
  const clerk_user = useUser()
  // const emails = extractEmailsFromClerk(clerk_user.user)
  // const currUserEmail = emails[0]
  const [baseSystemPrompt, setBaseSystemPrompt] = useState('')
  const [thingsToDo, setThingsToDo] = useState('')
  const [thingsNotToDo, setThingsNotToDo] = useState('')
  // const [originalSystemPrompt, setOriginalSystemPrompt] = useState('')
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
  // const [isSystemPromptSaved, setIsSystemPromptSaved] = useState(false)
  const [isRightSideVisible, setIsRightSideVisible] = useState(false)

  useEffect(() => {
    const fetchCourseData = async () => {
      if (course_name == undefined) {
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
      const courseMetadata = (await response_metadata.json()).course_metadata
      setCourseMetadata(courseMetadata)
      setSystemPrompt(courseMetadata.system_prompt || DEFAULT_SYSTEM_PROMPT)
      setBaseSystemPrompt(courseMetadata.system_prompt || DEFAULT_SYSTEM_PROMPT)
      setIsLoading(false)
    }
    fetchCourseData()
  }, [router.isReady])

  // useEffect(() => {
  //   let newApiKey
  //   if (courseMetadata?.openai_api_key) {
  //     newApiKey = courseMetadata.openai_api_key
  //   }
  //   setApiKey(newApiKey)
  // }, [courseMetadata])

  useEffect(() => {
    // Just for testing
    if (systemPrompt) {
      setInput(systemPrompt)
      console.log('system prompt in ueseffected', systemPrompt)
      console.log('input in useeffect', input)
    }
  }, [systemPrompt])

  useEffect(() => {
    let newSystemPrompt = baseSystemPrompt

    const addIfNotIncluded = (content: string) => {
      if (!newSystemPrompt.includes(content)) {
        newSystemPrompt += content
      }
    }

    if (checked1) {
      addIfNotIncluded(
        '\n\nContent includes equations; LaTeX notation preferred.',
      )
    }

    if (checked2) {
      addIfNotIncluded(
        '\n\nFocus exclusively on document-based references—avoid incorporating knowledge from outside sources. Essential for legal and similar fields to maintain response quality.',
      )
    }

    const introMessage =
      checked3 && courseMetadata?.course_intro_message
        ? `\n\n${courseMetadata.course_intro_message} If the user asks an introductory question or greeting along the lines of 'hello' or 'what can you do?' or 'What's in here ?' or 'what is ${course_name}?' or similar, then please respond with a warm welcome to ${course_name}, the AI ${course_name} assistant chatbot. Tell them that you can answer questions using the entire knowledge base of Extension. Feel free to ask!`
        : `\n\nIf the user asks an introductory question or greeting along the lines of 'hello' or 'what can you do?' or 'What's in here ?' or 'what is ${course_name}?' or similar, then please respond with a warm welcome to ${course_name}, the AI ${course_name} assistant chatbot. Tell them that you can answer questions using the entire knowledge base of the project: ${course_name}. Feel free to ask!`

    if (checked3) {
      addIfNotIncluded(introMessage)
    }

    if (checked4) {
      addIfNotIncluded(
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
      )
    }

    if (thingsToDo) {
      addIfNotIncluded('\nThings to do: ' + thingsToDo)
    }
    if (thingsNotToDo) {
      addIfNotIncluded('\nThings NOT to do: ' + thingsNotToDo)
    }

    setSystemPrompt(newSystemPrompt)
  }, [
    checked1,
    checked2,
    checked3,
    checked4,
    thingsToDo,
    thingsNotToDo,
    courseMetadata,
    baseSystemPrompt,
  ])

  const handleSystemPromptSubmit = async (newSystemPrompt: string) => {
    let success = false
    if (courseMetadata && course_name && newSystemPrompt) {
      courseMetadata.system_prompt = newSystemPrompt
      success = await callSetCourseMetadata(course_name, courseMetadata)
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
      courseMetadata.system_prompt = DEFAULT_SYSTEM_PROMPT
      const success = await callSetCourseMetadata(course_name, courseMetadata)
      if (!success) {
        alert('Error resetting system prompt')
        showToastOnPromptUpdate(theme, true)
      } else {
        showToastOnPromptUpdate(theme, false, true)
      }
    } else {
      alert('Error resetting system prompt')
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

    const systemPrompt = `
    Today, you will be optimizing instructions for an eager, helpful, but inexperienced and unworldly AI assistant. This assistant requires careful instruction and clear examples to understand how to behave effectively. Follow the steps below to write precise and thorough instructions that will guide the assistant to accomplish tasks consistently, accurately, and correctly.

    In addition to the specific instructions provided, keep the following guidelines in mind:

    Task Explanation:
    Begin with a detailed explanation of the task at hand. Clearly outline the objectives and the desired outcome.

    Step-by-Step Guidance:
    Break down the task into clear, sequential steps.
    Provide specific actions the assistant should take at each step.

    Examples and Clarifications:
    Include examples to illustrate each step.
    Clarify any potential ambiguities with additional explanations or scenarios.

    Handling Subject-Related Questions:
    If the question is related to the subject in ANY WAY, ensure the assistant always provides an answer, even if the available documents are not directly helpful.
    Encourage the assistant to give the most helpful response possible, drawing from general knowledge if specific information is lacking.

    Always Provide Help:
    Instruct the assistant to always give a reasonable answer to the user's question.
    If there is limited information, suggest an array of potential helpful answers or solutions.

    Citations and Sources:
    When relevant, provide citations to support the information given.
    Avoid stacking too many citations together; use them judiciously to maintain clarity.

    Professional Tailoring:
    Ensure the final instructions are professionally tailored to meet the project's needs.
    The instructions should be clear, concise, and directly usable.
    Note: This is probably obvious to you already, but you are not completing the task here. You are writing instructions for an AI to complete the task.
    Here are the instructions you need to optimize:
    `

    setMessages([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: e.target[0].value },
    ])
    // setFinalSystemPrompt(finalMessage)
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
                      // spacing="lg"
                      m="3rem"
                      align="center"
                      variant="column"
                      className="w-[100%] md:w-[90%] lg:w-[80%]"
                      style={{
                        justifyContent: 'center',
                        // width: '97%',
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
                        // radius="lg"
                        p="md"
                        style={{
                          // width: isRightSideVisible ? '90%' : '100%',
                          width: '100%',
                          // margin: 'auto',
                          // marginTop: '8px',
                          backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        }}
                      >
                        <Text
                          size={'md'}
                          // w={'100%'}
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
                          // variant="gradient"
                          // gradient={{ from: 'gold', to: 'white', deg: 170 }}
                          // order={4}
                          size={'md'}
                        >
                          The System Prompt is used during <i>all</i>{' '}
                          conversations on this project. It is the most powerful
                          form of instructions to the model.
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
                            {/* <Title
                              className={`label ${montserrat_heading.variable} font - montserratHeading`}
                              variant="gradient"
                              gradient={{ from: 'gold', to: 'white', deg: 170 }}
                              order={4}
                            >
                              System Prompt
                            </Title>
                            <p>This system prompt is used on ALL messages in this project. Read more...</p> */}
                            <Textarea
                              autosize
                              minRows={3}
                              maxRows={20}
                              placeholder="Enter the system prompt..."
                              className="px-1 pt-3 md:px-0"
                              value={input}
                              onChange={(e) => {
                                setBaseSystemPrompt(e.target.value)
                                setSystemPrompt(e.target.value)
                                handleInputChange(e)
                              }}
                              style={{ width: '100%' }}
                              styles={{
                                input: {
                                  fontFamily: 'var(--font-montserratParagraph)',
                                },
                              }}
                            />
                            <div className="flex w-full flex-col items-center pl-2 pt-4 md:flex-row md:items-start md:justify-between md:pl-0">
                              <Button
                                type="submit"
                                onClick={open}
                                style={{
                                  minWidth: 'fit-content',
                                  // marginTop: '15px',
                                  paddingLeft: '8px',
                                  background:
                                    'linear-gradient(to right, #6d28d9, #4f46e5, #2563eb)',
                                  transition: 'background 0.3s ease-in-out',
                                }}
                                className={`relative m-1 text-white hover:border-indigo-600 md:mr-2 ${montserrat_paragraph.variable} font-montserratParagraph`}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.background =
                                    'linear-gradient(to right, #4f46e5, #2563eb, #6d28d9)')
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.background =
                                    'linear-gradient(to right, #6d28d9, #4f46e5, #2563eb)')
                                }
                              >
                                <IconSparkles stroke={1} />
                                Optimize System Prompt
                              </Button>

                              <Button
                                className={`relative m-1 bg-purple-800 text-white hover:border-indigo-600 hover:bg-indigo-600 ${montserrat_paragraph.variable} font-montserratParagraph`}
                                type="submit"
                                onClick={() => {
                                  handleSystemPromptSubmit(systemPrompt)
                                }}
                                style={{ minWidth: 'fit-content' }}
                              >
                                Update System Prompt
                              </Button>
                            </div>

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
                                  type="submit"
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
                                      setSystemPrompt(newSystemPrompt)
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
                {isRightSideVisible && (
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
                          Add Instructions to System Prompt
                        </Title>
                        <Checkbox
                          label={`Add greetings at the beginning of the conversation.`}
                          // wrapperProps={{}}
                          // description="Course is private by default."
                          className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                          // style={{ marginTop: '4rem' }}
                          size="md"
                          // bg='#020307'
                          color="grape"
                          // icon={CheckboxIcon}
                          checked={checked3}
                          onChange={(event) =>
                            setChecked3(event.currentTarget.checked)
                          }
                        />
                        <Checkbox
                          label={`Content includes equations; LaTeX notation preferred.`}
                          // wrapperProps={{}}
                          // description="Course is private by default."
                          className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                          // style={{ marginTop: '4rem' }}
                          size="md"
                          // bg='#020307'
                          color="grape"
                          // icon={CheckboxIcon}
                          checked={checked1}
                          onChange={(event) =>
                            setChecked1(event.currentTarget.checked)
                          }
                        />
                        <Checkbox
                          label={`Focus exclusively on document - based references—avoid incorporating knowledge from outside sources.Essential for legal and similar fields to maintain response quality.`}
                          // wrapperProps={{}}
                          // description="Course is private by default."
                          className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                          // style={{ marginTop: '4rem' }}
                          size="md"
                          // bg='#020307'
                          color="grape"
                          // icon={CheckboxIcon}
                          checked={checked2}
                          onChange={(event) =>
                            setChecked2(event.currentTarget.checked)
                          }
                        />
                        <Checkbox
                          label={
                            <span>
                              Guided Learning (No Direct Answers).
                              <Tooltip label="This option ensures that the system provides guidance and learning opportunities without giving direct answers.">
                                <span style={{ marginLeft: '5px', cursor: 'pointer' }}>▼</span>
                              </Tooltip>
                            </span>
                          }
                          className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                          size="md"
                          color="grape"
                          checked={checked4}
                          onChange={(event) =>
                            setChecked4(event.currentTarget.checked)
                          }
                        />
                        <Checkbox
                          label={
                            <span>
                              Raw System Prompt Only.
                              <Tooltip label="This option will provide the raw system prompt without any additional formatting or instructions.">
                                <span style={{ marginLeft: '5px', cursor: 'pointer' }}>▼</span>
                              </Tooltip>
                            </span>
                          }
                          className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                          size="md"
                          color="grape"
                          checked={checked5}
                          onChange={(event) =>
                            setChecked5(event.currentTarget.checked)
                          }
                        />
                        <Title
                          className={`label ${montserrat_heading.variable} font-montserratHeading`}
                          variant="gradient"
                          gradient={{ from: 'gold', to: 'white', deg: 170 }}
                          order={4}
                        >
                          Things to do
                        </Title>
                        <Textarea
                          // label={<strong>Things to do</strong>}
                          autosize
                          minRows={3}
                          maxRows={20}
                          style={{ width: '100%', paddingTop: '0px' }}
                          placeholder="Enter guidelines that the chat response should adhere to..."
                          className={`pt-3 ${montserrat_paragraph.variable} font-montserratParagraph`}
                          value={thingsToDo}
                          onChange={(e) => {
                            setThingsToDo(e.target.value)
                          }}
                        />
                        <Title
                          className={`label ${montserrat_heading.variable} font-montserratHeading`}
                          variant="gradient"
                          gradient={{ from: 'gold', to: 'white', deg: 170 }}
                          order={4}
                        >
                          Things NOT to do
                        </Title>
                        <Textarea
                          // label={<strong>Things NOT to do</strong>}
                          autosize
                          minRows={3}
                          maxRows={20}
                          style={{ width: '100%', paddingTop: '0px' }}
                          placeholder="Edit the guidelines that the chat response should not adhere to..."
                          className={`pt-3 ${montserrat_paragraph.variable} font-montserratParagraph`}
                          value={thingsNotToDo}
                          onChange={(e) => {
                            setThingsNotToDo(e.target.value)
                          }}
                        />
                        <div style={{ paddingTop: '10px', width: '100%' }}>
                          <div
                            style={{
                              paddingTop: '10px',
                              width: '100%',
                              display: 'flex',
                              justifyContent: 'space-between',
                            }}
                          >
                            <Button
                              className="relative m-1 self-end bg-red-500 text-white hover:border-red-600 hover:bg-red-600"
                              onClick={() => {
                                setSystemPrompt(DEFAULT_SYSTEM_PROMPT)
                                resetSystemPrompt()
                              }}
                              style={{ minWidth: 'fit-content' }}
                            >
                              Reset
                            </Button>
                          </div>
                        </div>
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
export const showToastOnPromptUpdate = (
  theme: MantineTheme,
  was_error = false,
  isReset = false,
) => {
  return notifications.show({
    id: 'prompt-updated',
    withCloseButton: true,
    onClose: () => console.log('unmounted'),
    onOpen: () => console.log('mounted'),
    autoClose: 12000,
    title: was_error
      ? 'Error updating prompt'
      : isReset
        ? 'Resetting prompt...'
        : 'Updating prompt...',
    message: was_error
      ? 'An error occurred while updating the prompt. Please try again.'
      : isReset
        ? 'The prompt has been reset to default.'
        : 'The prompt has been updated successfully.',
    icon: was_error ? <IconAlertTriangle /> : <IconCheck />,
    styles: {
      root: {
        backgroundColor: theme.colors.nearlyWhite,
        borderColor: was_error
          ? theme.colors.errorBorder
          : theme.colors.aiPurple,
      },
      title: {
        color: theme.colors.nearlyBlack,
      },
      description: {
        color: theme.colors.nearlyBlack,
      },
      closeButton: {
        color: theme.colors.nearlyBlack,
        '&:hover': {
          backgroundColor: theme.colors.dark[1],
        },
      },
      icon: {
        backgroundColor: was_error
          ? theme.colors.errorBackground
          : theme.colors.successBackground,
        padding: '4px',
      },
    },
    loading: false,
  })
}
export default CourseMain
