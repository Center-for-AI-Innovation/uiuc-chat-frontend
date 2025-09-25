import {
  Button,
  Card,
  Flex,
  Group,
  List,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'

import {
  IconAlertCircle,
  IconCheck,
  IconCircleCheck,
  IconCircleDashed,
  IconExternalLink,
} from '@tabler/icons-react'

import { type CourseMetadata } from '~/types/courseMetadata'
import { CannotEditCourse } from './CannotEditCourse'

import { notifications } from '@mantine/notifications'
import SettingsLayout, {
  getInitialCollapsedState,
} from '~/components/Layout/SettingsLayout'
import { useResponsiveCardWidth } from '~/utils/responsiveGrid'
import GlobalFooter from './GlobalFooter'
import { LoadingPlaceholderForAdminPages } from './MainPageBackground'
import { N8nWorkflowsTable } from './N8nWorkflowsTable'

import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { Montserrat } from 'next/font/google'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from 'react-oidc-context'
import { fetchCourseMetadata } from '~/utils/apiUtils'
import { useFetchAllWorkflows } from '~/utils/functionCalling/handleFunctionCalling'
import { IntermediateStateAccordion } from './IntermediateStateAccordion'

// Utility function for responsive card widths based on sidebar state

export const GetCurrentPageName = () => {
  // /CS-125/dashboard --> CS-125
  return useRouter().asPath.slice(1).split('/')[0] as string
}

const montserrat_med = Montserrat({
  weight: '500',
  subsets: ['latin'],
})

const MakeToolsPage = ({ course_name }: { course_name: string }) => {
  const router = useRouter()
  const currentPageName = GetCurrentPageName()
  const auth = useAuth()

  const useIllinoisChatConfig = useMemo(() => {
    return process.env.NEXT_PUBLIC_USE_ILLINOIS_CHAT_CONFIG === 'True'
  }, [])

  const [courseMetadata, setCourseMetadata] = useState<CourseMetadata | null>(
    null,
  )
  const [currentEmail, setCurrentEmail] = useState('')
  const [n8nApiKeyTextbox, setN8nApiKeyTextbox] = useState('')
  const [n8nApiKey, setN8nApiKey] = useState('')
  const [isEmptyWorkflowTable, setIsEmptyWorkflowTable] =
    useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    getInitialCollapsedState(),
  )
  const isSmallScreen = useMediaQuery('(max-width: 960px)')

  // Get responsive card width classes
  const cardWidthClasses = useResponsiveCardWidth(sidebarCollapsed)

  const {
    data: flows_table,
    isSuccess: isSuccess,
    // isLoading: isLoadingTools,
    isError: isErrorTools,
    refetch: refetchWorkflows,
  } = useFetchAllWorkflows(GetCurrentPageName())

  const notificationStyles = (isError = false) => {
    return {
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
    }
  }

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
          styles: notificationStyles(true),
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
        styles: notificationStyles(true),
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
        styles: notificationStyles(false),
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
        styles: notificationStyles(true),
        loading: false,
      })
    }
    setIsLoading(false)
  }

  useEffect(() => {
    const getApiKey = async () => {
      try {
        const response = await fetch('/api/UIUC-api/getN8Napikey', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ course_name: currentPageName }),
        })

        const data = await response.json()
        const apiKey = data.api_key?.[0]?.n8n_api_key

        if (apiKey) {
          setN8nApiKeyTextbox(apiKey)
          setN8nApiKey(apiKey)
        } else {
          console.warn('API key not found in response:', data)
        }
      } catch (error) {
        console.error('Error getting course data:', error)
      }
    }

    getApiKey()
  }, [currentPageName])

  useEffect(() => {
    const fetchData = async () => {
      const userEmail = auth.user?.profile.email
      setCurrentEmail(userEmail as string)

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
  }, [currentPageName, !auth.isLoading])

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
      styles: notificationStyles(true),
      withBorder: true,
      loading: false,
    })
  }

  if (auth.isLoading || !courseMetadata) {
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
  // console.log('n8n api key:', n8nApiKey)
  // console.log(
  //   'setup instructions default value:',
  //   n8nApiKey ? undefined : 'setup-instructions',
  // )
  // console.log(
  //   'usage instructions default value:',
  //   n8nApiKey && !isEmptyWorkflowTable ? 'usage-instruction' : undefined,
  // )

  return (
    <SettingsLayout
      course_name={course_name}
      sidebarCollapsed={sidebarCollapsed}
      setSidebarCollapsed={setSidebarCollapsed}
    >
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
            {useIllinoisChatConfig && (
              <Card
                padding="none"
                style={{
                  color: 'var(--foreground)',
                  margin: '5%',
                  backgroundColor: 'var(--background)',
                }}
              >
                <Title
                  className={`${montserrat_heading.variable} ml-4 font-montserratHeading`}
                  order={2}
                >
                  Coming soon!
                </Title>
              </Card>
            )}
            <Card
              withBorder
              padding="none"
              radius="xl"
              className={`mt-[2%] ${cardWidthClasses}`}
              style={{
                // maxWidth: '90%',
                // width: '100%',
                marginTop: '2%',
                backgroundColor: 'var(--background)',
                borderColor: 'var(--dashboard-border)',
              }}
            >
              <Flex className="flex-col md:flex-row">
                {/* // direction={isSmallScreen ? 'column' : 'row'}> */}
                <div
                  style={{
                    // flex: isSmallScreen ? '1 1 100%' : '1 1 60%',
                    border: 'None',
                    color: 'var(--foreground)',
                  }}
                  className="min-h-full flex-[1_1_100%] bg-[--background] md:flex-[1_1_60%]"
                >
                  <Group
                    spacing="lg"
                    m="1rem"
                    // align="center"
                    // style={{ justifyContent: 'center' }}
                  >
                    <Title
                      order={2}
                      className={`${montserrat_heading.variable} ml-4 font-montserratHeading`}
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
                          style={{
                            textAlign: 'left',
                            ...(useIllinoisChatConfig && {
                              color: 'var(--illinois-storm-dark)',
                            }),
                          }}
                        >
                          Use{' '}
                          <a
                            href="https://n8n.io"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-[--dashboard-button] hover:text-[--dashboard-button-hover] ${montserrat_heading.variable} font-montserratHeading`}
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
                          className="mx-[8%] mt-2 max-w-[50%] rounded-lg bg-[--dashboard-button] hover:bg-[--dashboard-button-hover] disabled:bg-[--button-disabled] disabled:text-[--button-disabled-text-color] lg:flex-[1_1_50%] lg:self-center"
                          type="submit"
                          disabled={!n8nApiKey}
                        >
                          {'Create/Edit Workflows'}
                        </Button>
                      </div>
                      {useIllinoisChatConfig ? (
                        <div />
                      ) : (
                        <IntermediateStateAccordion
                          accordionKey="setup-instructions"
                          chevron={
                            n8nApiKey ? (
                              <IconCircleCheck />
                            ) : (
                              <IconCircleDashed />
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
                              type="ordered"
                              withPadding
                              className={`${montserrat_paragraph.variable} font-montserratParagraph text-[--foreground]`}
                            >
                              <List.Item>
                                Tool use via LLMs is invite-only to prevent
                                abuse. Please shoot our admin an email for
                                access:{' '}
                                <a
                                  href="mailto:rohan13@illinois.edu"
                                  style={{
                                    color: 'var(--link)',
                                    textDecoration: 'underline',
                                  }}
                                >
                                  rohan13@illinois.edu
                                </a>
                              </List.Item>
                              <List.Item>
                                Once you have access, please{' '}
                                <b>
                                  <a
                                    href="https://tools.uiuc.chat/setup"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[--dashboard-button] hover:text-[--dashboard-button-hover]"
                                    style={{
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
                      )}
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
                                className={`${montserrat_paragraph.variable} font-montserratParagraph text-[--foreground]`}
                              >
                                <List.Item>
                                  Start by creating your first workflow on{' '}
                                  <a
                                    href="https://tools.uiuc.chat/workflows"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[--dashboard-button] hover:text-[--dashboard-button-hover] hover:underline"
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
                                    className="text-[--dashboard-button] hover:text-[--dashboard-button-hover]"
                                    style={{
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
                    backgroundColor: 'var(--dashboard-sidebar-background)',
                    color: 'var(--dashboard-foreground)',
                    borderLeft: isSmallScreen
                      ? ''
                      : '1px solid var(--dashboard-border)',
                  }}
                >
                  <div className="card flex h-full flex-col justify-center">
                    <div className="card-body" style={{ padding: '.5rem' }}>
                      <div className="pb-4">
                        <Title
                          // className={`label ${montserrat.className}`}
                          className={`label ${montserrat_heading.variable} mb-2 p-0 font-montserratHeading`}
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
                          styles={{
                            input: {
                              color: 'var(--foreground)',
                              backgroundColor: 'var(--background)',
                              margin: '1rem 0rem .1rem 0rem',
                            },
                          }}
                          className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                        />
                        <div className="pt-2" />
                        <Button
                          onClick={(event) => handleSaveApiKey()}
                          className="rounded-lg bg-[--dashboard-button] text-[--dashboard-button-foreground] hover:bg-[--dashboard-button-hover]"
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
              className={`mx-auto mt-[2%] items-start rounded-2xl bg-[--background] text-[--foreground] ${cardWidthClasses}`}
              style={{ zIndex: 1 }}
            >
              <Flex direction="row" justify="space-between">
                <div className="flex flex-col items-start justify-start">
                  <Title
                    className={`${montserrat_heading.variable} font-montserratHeading`}
                    order={3}
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

            <N8nWorkflowsTable
              n8nApiKey={n8nApiKey}
              course_name={course_name}
              isEmptyWorkflowTable={isEmptyWorkflowTable}
              sidebarCollapsed={sidebarCollapsed}
            />
          </Flex>
        </div>
        <GlobalFooter />
      </main>
    </SettingsLayout>
  )
}

export default MakeToolsPage
