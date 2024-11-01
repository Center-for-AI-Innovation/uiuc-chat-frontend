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
  // TextInput,
  // Tooltip,
} from '@mantine/core'
// const rubik_puddles = Rubik_Puddles({ weight: '400', subsets: ['latin'] })
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/router'
import { LoadingSpinner } from './LoadingSpinner'
import { downloadConversationHistory } from '../../pages/api/UIUC-api/downloadConvoHistory'
import ConversationsPerDayChart from './ConversationsPerDayChart'
import ConversationsPerHourChart from './ConversationsPerHourChart'
import ConversationsPerDayOfWeekChart from './ConversationsPerDayOfWeekChart'
import ConversationsHeatmapByHourChart from './ConversationsHeatmapByHourChart'

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
  // /CS-125/materials --> CS-125
  return useRouter().asPath.slice(1).split('/')[0] as string
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

  // TODO: remove this hook... we should already have this from the /materials props???
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

  const [nomicMapData, setNomicMapData] = useState<NomicMapData | null>(null)
  const [nomicIsLoading, setNomicIsLoading] = useState(true)

  // fetch nomicMapData
  useEffect(() => {
    const fetchNomicMapData = async () => {
      try {
        console.log('Trying to fetch nomic!!')
        const response = await fetch(
          `/api/getNomicMapForQueries?course_name=${course_name}`,
        )
        const data = await response.json()
        const parsedData: NomicMapData = {
          map_id: data.map_id,
          map_link: data.map_link,
        }
        setNomicMapData(parsedData)
        setNomicIsLoading(false)
      } catch (error) {
        console.error('Error fetching nomic map:', error)
        setNomicIsLoading(false) // Set nomicIsLoading to false even if there is an error
      }
    }

    fetchNomicMapData()
  }, [course_name])

  const [hasConversationData, setHasConversationData] = useState<boolean>(true)

  // Add this effect to check for conversation data
  useEffect(() => {
    const checkConversationData = async () => {
      try {
        const response = await axios.get(
          `/api/UIUC-api/getConversationStats?course_name=${course_name}`,
        )
        if (response.status === 200) {
          const { per_day } = response.data
          setHasConversationData(Object.keys(per_day).length > 0)
        }
      } catch (error) {
        console.error('Error checking conversation data:', error)
        setHasConversationData(false)
      }
    }

    checkConversationData()
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
              className="w-full md:w-[98%]"
              style={{
                // width: '98%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: '#15162c',
                paddingTop: '1rem',
                borderRadius: '1rem',
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
                  className="px-2 text-[hsl(280,100%,70%)] "
                  style={{ flexGrow: 2 }}
                >
                  Analyze Conversations
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

              <div className="grid w-[95%] grid-cols-1 gap-6 pb-10 pt-10 lg:grid-cols-2">
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
                      <ConversationsPerDayChart course_name={course_name} />
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
                      <ConversationsPerHourChart course_name={course_name} />
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
                        course_name={course_name}
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
                        course_name={course_name}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </Flex>
        </div>
        {/* NOMIC VISUALIZATION  */}
        {/* {false ? ( */}
        {/* {true ? ( */}
        {/* {nomicIsLoading ? (
              <>
                <span className="nomic-iframe skeleton-box pl-7 pr-7 pt-4"></span>
              </>
            ) : nomicMapData && nomicMapData.map_id ? (
              <>
                <iframe
                  className="nomic-iframe pl-7 pr-7 pt-4 pt-4"
                  id={nomicMapData.map_id}
                  allow="clipboard-read; clipboard-write"
                  src={nomicMapData.map_link}
                />
                <Title
                  order={6}
                  className={`w-full text-center ${montserrat_heading.variable} mt-2 font-montserratHeading`}
                >
                  A conceptual map of the questions asked by users on this page.
                  <br></br>
                  Read more about{' '}
                  <a
                    className={'text-purple-600'}
                    href="https://atlas.nomic.ai/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'underline', paddingRight: '5px' }}
                  >
                    semantic similarity visualizations
                  </a>
                </Title>
              </>
            ) : (
              <>
                <Title
                  order={6}
                  className={`w-full text-center ${montserrat_heading.variable} mt-2 font-montserratHeading`}
                >
                  Query visualization requires at least 20 queries to be made...
                  go ask some questions and check back later :)
                  <br></br>
                  Read more about{' '}
                  <a
                    className={'text-purple-600'}
                    href="https://atlas.nomic.ai/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'underline', paddingRight: '5px' }}
                  >
                    semantic similarity visualizations
                  </a> */}
        {/* </Title> */}
        {/* </> */}
        {/* )}  */}
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
// import { CannotViewCourse } from './CannotViewCourse'

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
    console.log('REsponse received while fetching metadata:', response)
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
