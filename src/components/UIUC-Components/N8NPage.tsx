import {
  Button,
  Title,
  Flex,
  List,
  Text,
  TextInput,
  Stack,
  Card,
  Group,
} from '@mantine/core'

import {
  IconAlertCircle,
  IconCheck,
  IconCircleCheck,
  IconCircleDashed,
  IconExternalLink,
} from '@tabler/icons-react'

import { CannotEditCourse } from './CannotEditCourse'
import { type CourseMetadata } from '~/types/courseMetadata'

import { LoadingPlaceholderForAdminPages } from './MainPageBackground'
import { extractEmailsFromClerk } from './clerkHelpers'
import { notifications } from '@mantine/notifications'
import GlobalFooter from './GlobalFooter'
import Navbar from './navbars/Navbar'
import { N8nWorkflowsTable } from './N8nWorkflowsTable'

import Head from 'next/head'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { fetchCourseMetadata } from '~/utils/apiUtils'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth, useUser } from '@clerk/nextjs'
import { Montserrat } from 'next/font/google'
import { useFetchAllWorkflows } from '~/utils/functionCalling/handleFunctionCalling'
import { IntermediateStateAccordion } from './IntermediateStateAccordion'

export const GetCurrentPageName = () => {
  // /CS-125/materials --> CS-125
  return useRouter().asPath.slice(1).split('/')[0] as string
}

const montserrat_med = Montserrat({
  weight: '500',
  subsets: ['latin'],
})

const MakeToolsPage = ({ course_name }: { course_name: string }) => {
  // Check auth - https://clerk.com/docs/nextjs/read-session-and-user-data
  const { isLoaded, userId, sessionId, getToken } = useAuth() // Clerk Auth
  // const { isSignedIn, user } = useUser()
  const router = useRouter()
  const currentPageName = GetCurrentPageName()
  const clerk_user = useUser()
  const [courseMetadata, setCourseMetadata] = useState<CourseMetadata | null>(
    null,
  )
  const [currentEmail, setCurrentEmail] = useState('')
  const [n8nApiKeyTextbox, setN8nApiKeyTextbox] = useState('')
  const [n8nApiKey, setN8nApiKey] = useState('')
  const [isEmptyWorkflowTable, setIsEmptyWorkflowTable] =
    useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    data: flows_table,
    isSuccess: isSuccess,
    // isLoading: isLoadingTools,
    isError: isErrorTools,
    refetch: refetchWorkflows,
  } = useFetchAllWorkflows(GetCurrentPageName())

  const handleSaveApiKey = async () => {
    console.log('IN handleSaveApiKey w/ key: ', n8nApiKeyTextbox)

    // TEST KEY TO SEE IF VALID (unless it's empty, that's fine.)
    if (n8nApiKeyTextbox) {
      const keyTestResponse = await fetch(`/api/UIUC-api/tools/testN8nAPI`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          n8nApiKey: n8nApiKeyTextbox,
        }),
      })
      console.log('keyTestResponse: ', await keyTestResponse.json())

      if (!keyTestResponse.ok) {
        notifications.show({
          id: 'error-notification-bad-key',
          title: 'Key appears invalid',
          message:
            'This API key cannot fetch any workflows. Please check your key and try again.',
          autoClose: 15000,
          color: 'red',
          radius: 'lg',
          icon: <IconAlertCircle />,
          className: 'my-notification-class',
          style: { backgroundColor: '#15162c' },
          loading: false,
        })
        // Key invalid - exit early
        return
      }

      setIsEmptyWorkflowTable(false)
    } else {
      setIsEmptyWorkflowTable(true)
      console.log('KEY IS EMPTY: ', n8nApiKeyTextbox)
    }

    console.log('Saving n8n API Key:', n8nApiKeyTextbox)
    const response = await fetch(`/api/UIUC-api/tools/upsertN8nAPIKey`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        course_name: currentPageName,
        n8n_api_key: n8nApiKeyTextbox,
      }),
    })
    setN8nApiKey(n8nApiKeyTextbox)
    refetchWorkflows()

    if (isErrorTools) {
      errorFetchingWorkflowsToast()
      return
    }

    if (!flows_table) {
      notifications.show({
        id: 'error-notification',
        title: 'Error',
        message: 'Failed to fetch workflows. Please try again later.',
        autoClose: 10000,
        color: 'red',
        radius: 'lg',
        icon: <IconAlertCircle />,
        className: 'my-notification-class',
        style: { backgroundColor: '#15162c' },
        loading: false,
      })
      return
    }

    if (response.ok) {
      notifications.show({
        id: 'n8n-api-key-saved',
        title: 'Success',
        message: 'n8n API Key saved successfully!',
        autoClose: 10000,
        color: 'green',
        radius: 'lg',
        icon: <IconCheck />,
        className: 'my-notification-class',
        style: { backgroundColor: '#15162c' },
        loading: false,
      })
    } else {
      notifications.show({
        id: 'error-notification',
        title: 'Error',
        message: 'Failed to save n8n API Key. Please try again later.',
        autoClose: 10000,
        color: 'red',
        radius: 'lg',
        icon: <IconAlertCircle />,
        className: 'my-notification-class',
        style: { backgroundColor: '#15162c' },
        loading: false,
      })
    }
    setIsLoading(false)
  }

  useEffect(() => {
    const getApiFromSupabase = async () => {
      try {
        const response = await fetch(`/api/UIUC-api/getN8NapiFromSupabase`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            course_name: currentPageName,
          }),
        })
        const data = await response.json()
        // console.log('data!!!', data)
        setN8nApiKeyTextbox(data.api_key[0].n8n_api_key)
        setN8nApiKey(data.api_key[0].n8n_api_key)
        // return data.success
      } catch (error) {
        console.error('Error getting course data:', error)
        // return false
      }
    }
    getApiFromSupabase()
  }, [course_name])

  // TODO: use react query hook?
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

  const errorFetchingWorkflowsToast = () => {
    notifications.show({
      id: 'error-notification',
      withCloseButton: true,
      closeButtonProps: { color: 'red' },
      onClose: () => console.log('error unmounted'),
      onOpen: () => console.log('error mounted'),
      autoClose: 12000,
      title: (
        <Text size={'lg'} className={`${montserrat_med.className}`}>
          Error fetching workflows
        </Text>
      ),
      message: (
        <Text className={`${montserrat_med.className} text-neutral-200`}>
          No records found. Please check your API key and try again.
        </Text>
      ),
      color: 'red',
      radius: 'lg',
      icon: <IconAlertCircle />,
      className: 'my-notification-class',
      style: {
        backgroundColor: 'rgba(42,42,64,0.3)',
        backdropFilter: 'blur(10px)',
        borderLeft: '5px solid red',
      },
      withBorder: true,
      loading: false,
    })
  }

  if (!isLoaded || !courseMetadata) {
    return <LoadingPlaceholderForAdminPages />
  }

  // Check auth
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
  console.log('n8n api key:', n8nApiKey)
  console.log(
    'setup instructions default value:',
    n8nApiKey ? undefined : 'setup-instructions',
  )
  console.log(
    'usage instructions default value:',
    n8nApiKey && !isEmptyWorkflowTable ? 'usage-instruction' : undefined,
  )

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
            <Card
              shadow="xs"
              padding="none"
              radius="xl"
              style={{ maxWidth: '85%', width: '100%', marginTop: '2%' }}
            >
              <Flex className="flex-col md:flex-row">
                {/* // direction={isSmallScreen ? 'column' : 'row'}> */}
                <div
                  style={{
                    // flex: isSmallScreen ? '1 1 100%' : '1 1 60%',
                    border: 'None',
                    color: 'white',
                  }}
                  className="min-h-full flex-[1_1_100%] bg-gradient-to-r from-purple-900 via-indigo-800 to-blue-800 md:flex-[1_1_60%]"
                >
                  <Group
                    spacing="lg"
                    m="3rem"
                    // align="center"
                    // style={{ justifyContent: 'center' }}
                  >
                    <Title
                      order={2}
                      variant="gradient"
                      align="center"
                      gradient={{ from: 'gold', to: 'white', deg: 50 }}
                      className={`${montserrat_heading.variable} font-montserratHeading`}
                    >
                      LLM Tool Use &amp; Function Calling
                    </Title>
                    <Stack align="start" justify="start">
                      <div className="flex flex-col lg:flex-row">
                        <Title
                          className={`${montserrat_heading.variable} flex-[1_1_50%] font-montserratHeading`}
                          order={5}
                          w={'100%'}
                          ml={'md'}
                          style={{ textAlign: 'left' }}
                        >
                          Use{' '}
                          <a
                            href="https://n8n.io"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-purple-500 hover:underline ${montserrat_heading.variable} font-montserratHeading`}
                          >
                            n8n.io&apos;s{' '}
                            <IconExternalLink
                              className="mr-2 inline-block"
                              style={{ position: 'relative', top: '-3px' }}
                            />
                          </a>
                          beautiful visual workflow editor to create custom
                          functions for your project.
                        </Title>
                        <Button
                          onClick={(event) =>
                            window.open(
                              `https://tools.uiuc.chat/workflows`,
                              '_blank',
                            )
                          }
                          className="mx-[8%] mt-2 max-w-[50%] rounded-lg bg-purple-700 hover:border-indigo-600 hover:bg-indigo-600 lg:flex-[1_1_50%] lg:self-center"
                          type="submit"
                          disabled={!n8nApiKey}
                        >
                          {'Create/Edit Workflows'}
                        </Button>
                      </div>

                      <IntermediateStateAccordion
                        accordionKey="setup-instructions"
                        chevron={
                          n8nApiKey ? <IconCircleCheck /> : <IconCircleDashed />
                        }
                        disableChevronRotation
                        title={
                          <Title
                            style={{ margin: '0 auto', textAlign: 'left' }}
                            order={4}
                            size={'xl'}
                            className={`pb-3 pt-3 ${montserrat_paragraph.variable} font-montserratParagraph`}
                          >
                            Setup Instructions 🤠
                          </Title>
                        }
                        isLoading={false}
                        error={false}
                        defaultValue={
                          !n8nApiKey ? 'setup-instructions' : undefined
                        }
                        content={
                          <List
                            w={'80%'}
                            type="ordered"
                            withPadding
                            className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                          >
                            <List.Item>
                              Tool use via LLMs is invite-only to prevent abuse.
                              Please shoot me an email for access:
                              kvday2@illinois.edu
                            </List.Item>
                            <List.Item>
                              Once you have access, please{' '}
                              <b>
                                <a
                                  href="https://tools.uiuc.chat/setup"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    color: '#8B5CF6',
                                    textDecoration: 'underline',
                                  }}
                                >
                                  login with this link
                                </a>
                                .
                              </b>
                            </List.Item>
                            <List.Item>
                              Inside n8n,{' '}
                              <b>create an n8n API key and save it here</b>.
                            </List.Item>
                          </List>
                        }
                      />
                      {n8nApiKey && (
                        <IntermediateStateAccordion
                          accordionKey="usage-instructions"
                          chevron={
                            n8nApiKey && isEmptyWorkflowTable ? (
                              <IconCircleDashed />
                            ) : (
                              <IconCircleCheck />
                            )
                          }
                          disableChevronRotation
                          title={
                            <Title
                              style={{ margin: '0 auto', textAlign: 'left' }}
                              order={4}
                              size={'xl'}
                              className={`pb-3 pt-3 ${montserrat_paragraph.variable} font-montserratParagraph`}
                            >
                              Usage Instructions 🛠️
                            </Title>
                          }
                          isLoading={false}
                          error={false}
                          defaultValue={
                            n8nApiKey && isEmptyWorkflowTable
                              ? 'usage-instructions'
                              : undefined
                          }
                          content={
                            <>
                              {/* <Title w={'80%'} order={6} pl={'md'} pb={'md'}
                              className={`${montserrat_paragraph.variable} font-montserratParagraph text-gray-300`}>
                            Now that you have API Key set
                            </Title> */}
                              <List
                                w={'80%'}
                                type="ordered"
                                withPadding
                                className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                              >
                                <List.Item>
                                  Start by creating your first workflow on{' '}
                                  <a
                                    href="https://tools.uiuc.chat/workflows"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-purple-500 hover:underline"
                                  >
                                    N8N
                                  </a>
                                </List.Item>
                                <List.Item>
                                  Ensure you have the correct trigger node for
                                  your workflow, check docs for details
                                </List.Item>
                                <List.Item>
                                  Add the necessary nodes for your workflow
                                </List.Item>
                                <List.Item>Save your workflow</List.Item>
                                <List.Item>
                                  Make sure your workflow is active
                                </List.Item>
                                <List.Item>
                                  Test your workflow to complete usage
                                  onboarding
                                </List.Item>
                                <Title
                                  order={5}
                                  className={`${montserrat_heading.variable} ps-5 text-center font-montserratHeading font-semibold`}
                                >
                                  If your workflow is working as expected,
                                  Congrats! 🚀
                                  <br></br>
                                  Your users can now start using it on the{' '}
                                  <a
                                    href={`/${course_name}/chat`}
                                    // target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      color: '#8B5CF6',
                                      textDecoration: 'underline',
                                    }}
                                  >
                                    Chat Page
                                  </a>
                                  !
                                </Title>
                              </List>
                            </>
                          }
                        />
                      )}
                    </Stack>
                  </Group>
                </div>
                <div
                  className="flex flex-[1_1_100%] md:flex-[1_1_40%]"
                  style={{
                    // flex: isSmallScreen ? '1 1 100%' : '1 1 40%',
                    padding: '1rem',
                    backgroundColor: '#15162c',
                    color: 'white',
                  }}
                >
                  <div className="card flex h-full flex-col justify-center">
                    <div className="card-body">
                      <div className="pb-4">
                        <Title
                          // className={`label ${montserrat.className}`}
                          className={`label ${montserrat_heading.variable} font-montserratHeading`}
                          variant="gradient"
                          gradient={{ from: 'gold', to: 'white', deg: 170 }}
                          order={3}
                        >
                          Your n8n API Key
                        </Title>
                        <TextInput
                          // label="n8n API Key"
                          type="password"
                          description="We use this to run your workflows. You can find your n8n API Key in your n8n account settings."
                          placeholder="Enter your n8n API Key here"
                          value={n8nApiKeyTextbox}
                          onChange={(event) =>
                            setN8nApiKeyTextbox(event.target.value)
                          }
                          className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                        />
                        <div className="pt-2" />
                        <Button
                          onClick={(event) => handleSaveApiKey()}
                          className="rounded-lg bg-purple-700 hover:border-indigo-600 hover:bg-indigo-600"
                          type="submit"
                          disabled={isLoading}
                        >
                          {isLoading ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Flex>
            </Card>

            <div
              // Course files header/background
              className="mx-auto mt-[2%] w-[90%] items-start rounded-2xl shadow-md shadow-purple-600"
              style={{ zIndex: 1, background: '#15162c' }}
            >
              <Flex direction="row" justify="space-between">
                <div className="flex flex-col items-start justify-start">
                  <Title
                    className={`${montserrat_heading.variable} font-montserratHeading`}
                    variant="gradient"
                    gradient={{
                      from: 'hsl(280,100%,70%)',
                      to: 'white',
                      deg: 185,
                    }}
                    order={3}
                    p="xl"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Title
                      order={3}
                      // w={}
                      // size={'xl'}
                      className={`pb-3 pt-3 ${montserrat_paragraph.variable} font-montserratParagraph`}
                    >
                      Your n8n tools
                    </Title>
                  </Title>
                </div>
                <div className=" flex flex-col items-end justify-center">
                  {/* Can add more buttons here */}
                  {/* <Button className={`${montserrat_paragraph.variable} font-montserratParagraph ${classes.downloadButton}`} rightIcon={isLoading ? <LoadingSpinner size="sm" /> : <IconCloudDownload />}
                    onClick={() => downloadConversationHistory(course_name)}>
                    Download Conversation History
                  </Button> */}
                </div>
              </Flex>
            </div>

            <div className="pt-5"></div>

            <N8nWorkflowsTable
              n8nApiKey={n8nApiKey}
              course_name={course_name}
              isEmptyWorkflowTable={isEmptyWorkflowTable}
            />
          </Flex>
        </div>
        <GlobalFooter />
      </main>
    </>
  )
}

export default MakeToolsPage
