import Head from 'next/head'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
// import { DropzoneS3Upload } from '~/components/UIUC-Components/Upload_S3'
import { fetchPresignedUrl } from '~/utils/apiUtils'
import {
  // Badge,
  // MantineProvider,
  Button,
  // Group,
  // Stack,
  // createStyles,
  // FileInput,
  // rem,
  Title,
  Text,
  Flex,
  createStyles,
  // Divider,
  MantineTheme,
  Divider,
  ActionIcon,
  // TextInput,
  // Tooltip,
} from '@mantine/core'
// const rubik_puddles = Rubik_Puddles({ weight: '400', subsets: ['latin'] })
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/router'
import { LoadingSpinner } from './LoadingSpinner'
import { downloadConversationHistory } from '../../pages/api/UIUC-api/downloadConvoHistory'
import { getConversationStats } from '../../pages/api/UIUC-api/getConversationStats'
import { getProjectStats } from '../../pages/api/UIUC-api/getProjectStats'
import ConversationsPerDayChart from './ConversationsPerDayChart'
import ConversationsPerHourChart from './ConversationsPerHourChart'
import ConversationsPerDayOfWeekChart from './ConversationsPerDayOfWeekChart'
import ConversationsHeatmapByHourChart from './ConversationsHeatmapByHourChart'
import {
  IconMessage2,
  IconUsers,
  IconMessageCircle2,
  IconInfoCircle,
} from '@tabler/icons-react'

const useStyles = createStyles((theme: MantineTheme) => ({
  downloadButton: {
    fontFamily: 'var(--font-montserratHeading)',
    outline: 'none',
    border: 'solid 1.5px',
    borderColor: theme.colors.grape[8],
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    borderRadius: theme.radius.xl,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease-in-out',
    height: '48px',
    backgroundColor: '#0E1116',

    '&:hover': {
      backgroundColor: theme.colors.grape[8],
    },
    '@media (max-width: 768px)': {
      fontSize: theme.fontSizes.xs,
      padding: '10px',
      width: '70%',
    },
    '@media (min-width: 769px) and (max-width: 1024px)': {
      fontSize: theme.fontSizes.xs,
      padding: '12px',
      width: '90%',
    },
    '@media (min-width: 1025px)': {
      fontSize: theme.fontSizes.sm,
      padding: '15px',
      width: '100%',
    },
  },
}))

import { useAuth, useUser } from '@clerk/nextjs'

export const GetCurrentPageName = () => {
  // /CS-125/dashboard --> CS-125
  return useRouter().asPath.slice(1).split('/')[0] as string
}

interface ConversationStats {
  per_day: { [date: string]: number }
  per_hour: { [hour: string]: number }
  per_weekday: { [day: string]: number }
  heatmap: { [day: string]: { [hour: string]: number } }
}

interface CourseStats {
  total_conversations: number
  total_users: number
  total_messages: number
}

const MakeQueryAnalysisPage = ({ course_name }: { course_name: string }) => {
  // Check auth - https://clerk.com/docs/nextjs/read-session-and-user-data
  const { classes, theme } = useStyles()
  const { isLoaded, userId, sessionId, getToken } = useAuth() // Clerk Auth
  // const { isSignedIn, user } = useUser()
  const clerk_user = useUser()
  const [courseMetadata, setCourseMetadata] = useState<CourseMetadata | null>(
    null,
  )
  const [currentEmail, setCurrentEmail] = useState('')

  const router = useRouter()

  const currentPageName = GetCurrentPageName()

  const [isLoading, setIsLoading] = useState(false)

  const [conversationStats, setConversationStats] =
    useState<ConversationStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)

  const [courseStatsLoading, setCourseStatsLoading] = useState(true)
  const [courseStats, setCourseStats] = useState<CourseStats | null>(null)
  const [courseStatsError, setCourseStatsError] = useState<string | null>(null)

  // TODO: remove this hook... we should already have this from the /dashboard props???
  useEffect(() => {
    const fetchData = async () => {
      const userEmail = extractEmailsFromClerk(clerk_user.user)
      setCurrentEmail(userEmail[0] as string)

      try {
        const metadata: CourseMetadata = (await fetchCourseMetadata(
          currentPageName,
        )) as CourseMetadata

        if (metadata && metadata.is_private) {
          metadata.is_private = JSON.parse(
            metadata.is_private as unknown as string,
          )
        }
        setCourseMetadata(metadata)
      } catch (error) {
        console.error(error)
        // alert('An error occurred while fetching course metadata. Please try again later.')
      }
    }

    fetchData()
  }, [currentPageName, clerk_user.isLoaded])

  const [hasConversationData, setHasConversationData] = useState<boolean>(true)

  useEffect(() => {
    const fetchConversationStats = async () => {
      try {
        const response = await getConversationStats(course_name)
        if (response.status === 200) {
          setConversationStats(response.data)
          setHasConversationData(Object.keys(response.data.per_day).length > 0)
        }
      } catch (error) {
        console.error('Error fetching conversation stats:', error)
        setStatsError('Failed to fetch conversation statistics')
        setHasConversationData(false)
      } finally {
        setStatsLoading(false)
      }
    }

    fetchConversationStats()
  }, [course_name])

  useEffect(() => {
    const fetchCourseStats = async () => {
      setCourseStatsLoading(true)
      setCourseStatsError(null)
      try {
        const response = await getProjectStats(course_name)

        if (response.status === 200) {
          const mappedData = {
            total_conversations: response.data.total_conversations,
            total_messages: response.data.total_messages,
            total_users: response.data.unique_users,
          }

          setCourseStats(mappedData)
        } else {
          throw new Error('Failed to fetch course stats')
        }
      } catch (error) {
        setCourseStatsError('Failed to load stats')
      } finally {
        setCourseStatsLoading(false)
      }
    }

    fetchCourseStats()
  }, [course_name])

  if (!isLoaded || !courseMetadata) {
    return (
      <MainPageBackground>
        <LoadingSpinner />
      </MainPageBackground>
    )
  }

  if (
    courseMetadata &&
    currentEmail !== (courseMetadata.course_owner as string) &&
    courseMetadata.course_admins.indexOf(currentEmail) === -1
  ) {
    router.replace(`/${course_name}/not_authorized`)

    return (
      <CannotEditCourse
        course_name={currentPageName as string}
        // current_email={currentEmail as string}
      />
    )
  }

  const handleDownload = async (courseName: string) => {
    setIsLoading(true)
    try {
      const result = await downloadConversationHistory(courseName)
      showToastOnUpdate(theme, false, false, result.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Navbar course_name={course_name} />

      <Head>
        <title>{course_name}</title>
        <meta
          name="description"
          content="The AI teaching assistant built for students at UIUC."
        />
        <link rel="icon" href="/favicon.ico" />
        {/* <Header /> */}
      </Head>
      <main className="course-page-main min-w-screen flex min-h-screen flex-col items-center">
        <div className="items-left flex w-full flex-col justify-center py-0">
          <Flex direction="column" align="center" w="100%">
            <div className="pt-5"></div>
            <div
              className="w-[98%] rounded-3xl"
              style={{
                // width: '98%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: '#15162c',
                paddingTop: '1rem',
              }}
            >
              <div
                style={{
                  width: '95%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#15162c',
                  paddingBottom: '1rem',
                }}
              >
                <Title
                  order={3}
                  align="left"
                  className={`px-4 text-[hsl(280,100%,70%)] ${montserrat_heading.variable} font-montserratHeading`}
                  style={{ flexGrow: 2 }}
                >
                  Usage Overview
                </Title>
                <div className="flex flex-row items-center justify-end">
                  {/* Can add more buttons here */}
                  <Button
                    className={`${montserrat_paragraph.variable} font-montserratParagraph ${classes.downloadButton} w-full px-2 text-sm sm:w-auto sm:px-4 sm:text-base`}
                    rightIcon={
                      isLoading ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <IconCloudDownload className="hidden sm:block" />
                      )
                    }
                    onClick={() => handleDownload(course_name)}
                  >
                    <span className="hidden sm:inline">
                      Download Conversation History
                    </span>
                    <span className="sm:hidden">Download History</span>
                  </Button>
                </div>
              </div>

              <Divider className="w-full" color="gray.4" size="sm" />

              {/* Usage Overview Banner */}
              <div className="my-6 w-[95%] rounded-xl bg-[#1a1b30] p-6 shadow-lg shadow-purple-900/20">
                <div className="mb-6">
                  <Title
                    order={4}
                    className={`${montserrat_heading.variable} font-montserratHeading text-white`}
                  >
                    Project Analytics
                  </Title>
                  <Text size="sm" color="dimmed" mt={2}>
                    Overview of project engagement and usage statistics
                  </Text>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {/* Total Conversations */}
                  <div className="rounded-lg bg-[#232438] p-4 shadow-md transition-all duration-200 hover:shadow-lg hover:shadow-purple-900/30">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <Text size="sm" color="dimmed" weight={500} mb={1}>
                          Conversations
                        </Text>
                        <Text size="xs" color="dimmed" opacity={0.7}>
                          Total chat sessions
                        </Text>
                      </div>
                      <IconMessageCircle2
                        size={24}
                        className="text-purple-400 opacity-80"
                      />
                    </div>
                    <div className="flex items-center justify-start">
                      {courseStatsLoading ? (
                        <LoadingSpinner size="sm" />
                      ) : courseStatsError ? (
                        <Text
                          size="sm"
                          color="red"
                          className="flex items-center"
                        >
                          <IconAlertTriangle size={16} className="mr-1" />
                          Error
                        </Text>
                      ) : (
                        <Text
                          size="xl"
                          weight={700}
                          className="text-purple-400"
                        >
                          {courseStats?.total_conversations?.toLocaleString() ||
                            0}
                        </Text>
                      )}
                    </div>
                  </div>

                  {/* Total Messages */}
                  <div className="rounded-lg bg-[#232438] p-4 shadow-md transition-all duration-200 hover:shadow-lg hover:shadow-purple-900/30">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <Text size="sm" color="dimmed" weight={500} mb={1}>
                          Messages
                        </Text>
                        <Text size="xs" color="dimmed" opacity={0.7}>
                          Total exchanges
                        </Text>
                      </div>
                      <IconMessage2
                        size={24}
                        className="text-purple-400 opacity-80"
                      />
                    </div>
                    <div className="flex items-center justify-start">
                      {courseStatsLoading ? (
                        <LoadingSpinner size="sm" />
                      ) : courseStatsError ? (
                        <Text
                          size="sm"
                          color="red"
                          className="flex items-center"
                        >
                          <IconAlertTriangle size={16} className="mr-1" />
                          Error
                        </Text>
                      ) : (
                        <Text
                          size="xl"
                          weight={700}
                          className="text-purple-400"
                        >
                          {courseStats?.total_messages?.toLocaleString() || 0}
                        </Text>
                      )}
                    </div>
                  </div>

                  {/* Unique Users */}
                  <div className="rounded-lg bg-[#232438] p-4 shadow-md transition-all duration-200 hover:shadow-lg hover:shadow-purple-900/30">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <Text size="sm" color="dimmed" weight={500} mb={1}>
                          Users
                        </Text>
                        <Text size="xs" color="dimmed" opacity={0.7}>
                          Unique participants
                        </Text>
                      </div>
                      <IconUsers
                        size={24}
                        className="text-purple-400 opacity-80"
                      />
                    </div>
                    <div className="flex items-center justify-start">
                      {courseStatsLoading ? (
                        <LoadingSpinner size="sm" />
                      ) : courseStatsError ? (
                        <Text
                          size="sm"
                          color="red"
                          className="flex items-center"
                        >
                          <IconAlertTriangle size={16} className="mr-1" />
                          Error
                        </Text>
                      ) : (
                        <Text
                          size="xl"
                          weight={700}
                          className="text-purple-400"
                        >
                          {courseStats?.total_users?.toLocaleString() || 0}
                        </Text>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid w-[95%] grid-cols-1 gap-6 pb-10 lg:grid-cols-2">
                {!hasConversationData ? (
                  <div className="rounded-xl bg-[#1a1b30] p-6 text-center shadow-lg shadow-purple-900/20 lg:col-span-2">
                    <Title
                      order={4}
                      className={`${montserrat_heading.variable} font-montserratHeading`}
                    >
                      No conversation data available yet
                    </Title>
                    <Text size="lg" color="dimmed" mt="md">
                      Start some conversations to see analytics and
                      visualizations!
                    </Text>
                  </div>
                ) : (
                  <>
                    {/* Chart 1 */}
                    <div className="rounded-xl bg-[#1a1b30] p-6 shadow-lg shadow-purple-900/20">
                      <Title
                        order={4}
                        mb="md"
                        align="left"
                        className="text-white"
                      >
                        Conversations Per Day
                      </Title>
                      <Text size="sm" color="dimmed" mb="xl">
                        Shows the total number of conversations that occurred on
                        each calendar day
                      </Text>
                      <ConversationsPerDayChart
                        data={conversationStats?.per_day}
                        isLoading={statsLoading}
                        error={statsError}
                      />
                    </div>

                    {/* Chart 2 */}
                    <div className="rounded-xl bg-[#1a1b30] p-6 shadow-lg shadow-purple-900/20">
                      <Title
                        order={4}
                        mb="md"
                        align="left"
                        className="text-white"
                      >
                        Conversations Per Hour
                      </Title>
                      <Text size="sm" color="dimmed" mb="xl">
                        Displays the total number of conversations that occurred
                        during each hour of the day (24-hour format), aggregated
                        across all days
                      </Text>
                      <ConversationsPerHourChart
                        data={conversationStats?.per_hour}
                        isLoading={statsLoading}
                        error={statsError}
                      />
                    </div>

                    {/* Chart 3 */}
                    <div className="rounded-xl bg-[#1a1b30] p-6 shadow-lg shadow-purple-900/20">
                      <Title
                        order={4}
                        mb="md"
                        align="left"
                        className="text-white"
                      >
                        Conversations Per Day of the Week
                      </Title>
                      <Text size="sm" color="dimmed" mb="xl">
                        Shows the total number of conversations that occurred on
                        each day of the week, helping identify which days are
                        most active
                      </Text>
                      <ConversationsPerDayOfWeekChart
                        data={conversationStats?.per_weekday}
                        isLoading={statsLoading}
                        error={statsError}
                      />
                    </div>

                    {/* Chart 4 */}
                    <div className="rounded-xl bg-[#1a1b30] p-6 shadow-lg shadow-purple-900/20">
                      <Title
                        order={4}
                        mb="md"
                        align="left"
                        className="text-white"
                      >
                        Conversations Per Day and Hour
                      </Title>
                      <Text size="sm" color="dimmed" mb="xl">
                        A heatmap showing conversation density across both days
                        and hours, with darker colors indicating higher activity
                        during those time periods
                      </Text>
                      <ConversationsHeatmapByHourChart
                        data={conversationStats?.heatmap}
                        isLoading={statsLoading}
                        error={statsError}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </Flex>
        </div>

        <NomicDocumentMap course_name={course_name as string} />
        <GlobalFooter />
      </main>
    </>
  )
}

import {
  IconAlertCircle,
  IconAlertTriangle,
  IconCheck,
  IconCloudDownload,
  IconDownload,
} from '@tabler/icons-react'

import { CannotEditCourse } from './CannotEditCourse'
import { type CourseMetadata } from '~/types/courseMetadata'
// import {CannotViewCourse} from './CannotViewCourse'

interface CourseFile {
  name: string
  s3_path: string
  course_name: string
  readable_filename: string
  type: string
  url: string
  base_url: string
}

interface CourseFilesListProps {
  files: CourseFile[]
}
import { IconTrash } from '@tabler/icons-react'
import { MainPageBackground } from './MainPageBackground'
import { extractEmailsFromClerk } from './clerkHelpers'
import { notifications } from '@mantine/notifications'
import GlobalFooter from './GlobalFooter'
import Navbar from './navbars/Navbar'
import Link from 'next/link'
import { Separator } from 'tabler-icons-react'
import { AnimatePresence, motion } from 'framer-motion'
import NomicDocumentMap from './NomicDocumentsMap'

const CourseFilesList = ({ files }: CourseFilesListProps) => {
  const router = useRouter()
  const { classes, theme } = useStyles()
  const handleDelete = async (s3_path: string, course_name: string) => {
    try {
      const response = await axios.delete(
        `https://flask-production-751b.up.railway.app/delete`,
        {
          params: { s3_path, course_name },
        },
      )
      // Handle successful deletion, show a success message
      showToastOnFileDeleted(theme)
      // Refresh the page
      await router.push(router.asPath)
    } catch (error) {
      console.error(error)
      // Show error message
      showToastOnFileDeleted(theme, true)
    }
  }

  return (
    <div
      className="mx-auto w-full justify-center rounded-md  bg-violet-100 p-5 shadow-md" // bg-violet-100
      style={{ marginTop: '-1rem', backgroundColor: '#0F1116' }}
    >
      <ul role="list" className="grid grid-cols-2 gap-4">
        {files.map((file, index) => (
          <li
            key={file.s3_path}
            className="hover:shadow-xs flex items-center justify-between gap-x-6 rounded-xl bg-violet-300 py-4 pl-4 pr-1 transition duration-200 ease-in-out hover:bg-violet-200 hover:shadow-violet-200"
            onMouseEnter={(e) => {
              // Removed this because it causes the UI to jump around on mouse enter.
              // e.currentTarget.style.border = 'solid 1.5px'
              e.currentTarget.style.borderColor = theme.colors.violet[8]
            }}
            onMouseLeave={(e) => {
              // e.currentTarget.style.border = 'solid 1.5px'
            }}
          >
            {/* Conditionally show link in small text if exists */}
            {file.url ? (
              <div
                className="min-w-0 flex-auto"
                style={{
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                <a href={file.url} target="_blank" rel="noopener noreferrer">
                  <p className="truncate text-xl font-semibold leading-6 text-gray-800">
                    {file.readable_filename}
                  </p>
                  <p className="mt-1 truncate text-xs leading-5 text-gray-600">
                    {file.url || ''}
                  </p>
                </a>
              </div>
            ) : (
              <div
                className="min-w-0 flex-auto"
                style={{
                  maxWidth: '80%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                <p className="text-xl font-semibold leading-6 text-gray-800">
                  {file.readable_filename}
                </p>
                {/* SMALL LOWER TEXT FOR FILES IN LIST */}
                {/* <p className="mt-1 truncate text-xs leading-5 text-gray-600">
                  {file.course_name}
                </p> */}
              </div>
            )}
            <div className="me-4 flex justify-end space-x-2">
              {/* Download button */}
              <button
                onClick={() =>
                  fetchPresignedUrl(file.s3_path).then((url) => {
                    window.open(url as string, '_blank')
                  })
                }
                className="btn-circle btn cursor-pointer items-center justify-center border-0 bg-transparent transition duration-200 ease-in-out"
                // style={{ outline: 'solid 1px', outlineColor: 'white' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.grape[8]
                  ;(e.currentTarget.children[0] as HTMLElement).style.color =
                    theme.colorScheme === 'dark'
                      ? theme.colors.gray[2]
                      : theme.colors.gray[1]
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  ;(e.currentTarget.children[0] as HTMLElement).style.color =
                    theme.colors.gray[8]
                }}
              >
                <IconDownload className="h-5 w-5 text-gray-800" />
              </button>
              {/* Delete button */}
              <button
                onClick={() =>
                  handleDelete(
                    file.s3_path as string,
                    file.course_name as string,
                  )
                }
                className="btn-circle btn cursor-pointer items-center justify-center border-0 bg-transparent transition duration-200 ease-in-out"
                // style={{ outline: 'solid 1px', outlineColor: theme.white }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.grape[8]
                  ;(e.currentTarget.children[0] as HTMLElement).style.color =
                    theme.colorScheme === 'dark'
                      ? theme.colors.gray[2]
                      : theme.colors.gray[1]
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  ;(e.currentTarget.children[0] as HTMLElement).style.color =
                    theme.colors.red[6]
                }}
              >
                <IconTrash className="h-5 w-5 text-red-600" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

async function fetchCourseMetadata(course_name: string) {
  try {
    const response = await fetch(
      `/api/UIUC-api/getCourseMetadata?course_name=${course_name}`,
    )
    if (response.ok) {
      const data = await response.json()
      if (data.success === false) {
        throw new Error(
          data.message || 'An error occurred while fetching course metadata',
        )
      }
      // Parse is_private field from string to boolean
      if (
        data.course_metadata &&
        typeof data.course_metadata.is_private === 'string'
      ) {
        data.course_metadata.is_private =
          data.course_metadata.is_private.toLowerCase() === 'true'
      }
      return data.course_metadata
    } else {
      throw new Error(
        `Error fetching course metadata: ${
          response.statusText || response.status
        }`,
      )
    }
  } catch (error) {
    console.error('Error fetching course metadata:', error)
    throw error
  }
}

const showToastOnFileDeleted = (theme: MantineTheme, was_error = false) => {
  return (
    // docs: https://mantine.dev/others/notifications/

    notifications.show({
      id: 'file-deleted-from-materials',
      withCloseButton: true,
      onClose: () => console.log('unmounted'),
      onOpen: () => console.log('mounted'),
      autoClose: 5000,
      // position="top-center",
      title: was_error ? 'Error deleting file' : 'Deleting file...',
      message: was_error
        ? "An error occurred while deleting the file. Please try again and I'd be so grateful if you email kvday2@illinois.edu to report this bug."
        : 'The file is being deleted in the background.',
      icon: <IconCheck />,
      // className: 'my-notification-class',
      styles: {
        root: {
          backgroundColor: was_error
            ? theme.colors.errorBackground
            : theme.colors.nearlyWhite,
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
      },
      loading: false,
    })
  )
}

export default MakeQueryAnalysisPage

export const showToastOnUpdate = (
  theme: MantineTheme,
  was_error = false,
  isReset = false,
  message: string,
) => {
  return notifications.show({
    id: 'convo-or-documents-export',
    withCloseButton: true,
    closeButtonProps: { color: 'green' },
    onClose: () => console.log('error unmounted'),
    onOpen: () => console.log('error mounted'),
    autoClose: 30000,
    title: (
      <Text size={'lg'} className={`${montserrat_heading.className}`}>
        {message}
      </Text>
    ),
    message: (
      <Text className={`${montserrat_paragraph.className}`}>
        Check{' '}
        <Link
          href={
            'https://docs.uiuc.chat/features/bulk-export-documents-or-conversation-history'
          }
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'underline', color: 'lightpurple' }}
        >
          our docs
        </Link>{' '}
        for example code to process this data.
      </Text>
    ),
    color: 'green',
    radius: 'lg',
    icon: <IconCheck />,
    className: 'my-notification-class',
    style: {
      backgroundColor: 'rgba(42,42,64,0.6)',
      backdropFilter: 'blur(10px)',
      borderLeft: '5px solid green',
    },
    withBorder: true,
    loading: false,
  })
}
