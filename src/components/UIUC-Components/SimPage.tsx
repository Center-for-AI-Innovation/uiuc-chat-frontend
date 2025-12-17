import {
  Button,
  Card,
  Flex,
  Group,
  List,
  Stack,
  Text,
  TextInput,
  Textarea,
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
import { SimWorkflowsTable } from './SimWorkflowsTable'
import { WorkflowMetadataEditor } from './WorkflowMetadataEditor'

import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { Montserrat } from 'next/font/google'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from 'react-oidc-context'
import { fetchCourseMetadata } from '~/utils/apiUtils'
import { IntermediateStateAccordion } from './IntermediateStateAccordion'
import { useQueryClient } from '@tanstack/react-query'

const montserrat_med = Montserrat({
  weight: '500',
  subsets: ['latin'],
})

export const GetCurrentPageName = () => {
  // /CS-125/dashboard --> CS-125
  return useRouter().asPath.slice(1).split('/')[0] as string
}

const SimToolsPage = ({ course_name }: { course_name: string }) => {
  const router = useRouter()
  const currentPageName = GetCurrentPageName()
  const auth = useAuth()
  const queryClient = useQueryClient()

  const [courseMetadata, setCourseMetadata] = useState<CourseMetadata | null>(
    null,
  )
  const [currentEmail, setCurrentEmail] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    getInitialCollapsedState(),
  )
  const isSmallScreen = useMediaQuery('(max-width: 960px)')

  // Sim configuration state
  const simBaseUrl = process.env.NEXT_PUBLIC_SIM_BASE_URL || 'http://localhost:3100'
  const [simApiKeyInput, setSimApiKeyInput] = useState('')
  const [simWorkflowIdsInput, setSimWorkflowIdsInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Get responsive card width classes
  const cardWidthClasses = useResponsiveCardWidth(sidebarCollapsed)

  // Check if Sim is configured
  const isSimConfigured = Boolean(simApiKeyInput) && Boolean(simWorkflowIdsInput)

  const notificationStyles = (isError = false) => {
    return {
      root: {
        backgroundColor: 'var(--notification)',
        borderColor: isError ? '#E53935' : 'var(--notification-border)',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderRadius: '8px',
      },
      title: {
        color: 'var(--notification-title)',
        fontWeight: 600,
      },
      description: {
        color: 'var(--notification-message)',
      },
      closeButton: {
        color: 'var(--notification-title)',
        borderRadius: '4px',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        },
      },
      icon: {
        backgroundColor: 'transparent',
        color: isError ? '#E53935' : 'var(--notification-title)',
      },
    }
  }

  // Load Sim config from localStorage
  useEffect(() => {
    const storedApiKey = localStorage.getItem(`sim_api_key_${currentPageName}`)
    const storedWorkflowIds = localStorage.getItem(`sim_workflow_ids_${currentPageName}`)
    
    if (storedApiKey) setSimApiKeyInput(storedApiKey)
    if (storedWorkflowIds) setSimWorkflowIdsInput(storedWorkflowIds)
  }, [currentPageName])

  const handleSaveConfig = () => {
    setIsSaving(true)
    try {
      // Save to localStorage
      localStorage.setItem(`sim_api_key_${currentPageName}`, simApiKeyInput)
      localStorage.setItem(`sim_workflow_ids_${currentPageName}`, simWorkflowIdsInput)

      notifications.show({
        id: 'sim-config-saved',
        title: 'Success',
        message: 'Sim configuration saved successfully!',
        autoClose: 5000,
        color: 'green',
        radius: 'lg',
        icon: <IconCheck />,
        styles: notificationStyles(false),
      })
      // Refetch workflows
      queryClient.invalidateQueries({ queryKey: ['sim-workflows'] })
    } catch (error) {
      notifications.show({
        id: 'sim-config-error',
        title: 'Error',
        message: 'Failed to save Sim configuration. Please try again.',
        autoClose: 5000,
        color: 'red',
        radius: 'lg',
        icon: <IconAlertCircle />,
        styles: notificationStyles(true),
      })
    } finally {
      setIsSaving(false)
    }
  }

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
      }
    }

    fetchData()
  }, [currentPageName, !auth.isLoading])

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
      />
    )
  }

  return (
    <SettingsLayout
      course_name={course_name}
      sidebarCollapsed={sidebarCollapsed}
      setSidebarCollapsed={setSidebarCollapsed}
    >
      <Head>
        <title>{course_name} - Sim Tools</title>
        <meta
          name="description"
          content="Sim AI workflow tools for your project."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="course-page-main min-w-screen flex min-h-screen flex-col items-center">
        <div className="items-left flex w-full flex-col justify-center py-0">
          <Flex direction="column" align="center" w="100%">
            <Card
              withBorder
              padding="none"
              radius="xl"
              className={`mt-[2%] ${cardWidthClasses}`}
              style={{
                marginTop: '2%',
                backgroundColor: 'var(--background)',
                borderColor: 'var(--dashboard-border)',
              }}
            >
              <Flex className="flex-col md:flex-row">
                <div
                  style={{
                    border: 'None',
                    color: 'var(--foreground)',
                  }}
                  className="min-h-full flex-[1_1_100%] bg-[--background] md:flex-[1_1_60%]"
                >
                  <Group
                    spacing="lg"
                    m="1rem"
                  >
                    <Title
                      order={2}
                      className={`${montserrat_heading.variable} ml-4 font-montserratHeading`}
                    >
                      Sim AI Workflow Tools
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
                          }}
                        >
                          Use{' '}
                          <a
                            href="https://sim.ai"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-[--dashboard-button] hover:text-[--dashboard-button-hover] ${montserrat_heading.variable} font-montserratHeading`}
                          >
                            Sim.ai&apos;s{' '}
                            <IconExternalLink
                              className="mr-2 inline-block"
                              style={{ position: 'relative', top: '-3px' }}
                            />
                          </a>
                          visual workflow builder to create AI-powered automation workflows for your project.
                        </Title>
                        <Button
                          onClick={() =>
                            window.open(simBaseUrl, '_blank')
                          }
                          className="mx-[8%] mt-2 max-w-[50%] rounded-lg bg-[--dashboard-button] hover:bg-[--dashboard-button-hover] disabled:bg-[--button-disabled] disabled:text-[--button-disabled-text-color] lg:flex-[1_1_50%] lg:self-center"
                          type="submit"
                          disabled={!isSimConfigured}
                        >
                          {'Open Sim Dashboard'}
                        </Button>
                      </div>
                      {!isSimConfigured && (
                        <IntermediateStateAccordion
                          accordionKey="setup-instructions"
                          chevron={<IconCircleDashed />}
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
                          defaultValue="setup-instructions"
                          content={
                            <List
                              type="ordered"
                              withPadding
                              className={`${montserrat_paragraph.variable} font-montserratParagraph text-[--foreground]`}
                            >
                              <List.Item>
                                Set up Sim by visiting{' '}
                                <a
                                  href="https://sim.ai"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    color: 'var(--link)',
                                    textDecoration: 'underline',
                                  }}
                                >
                                  sim.ai
                                </a>{' '}
                                or self-host using Docker.
                              </List.Item>
                              <List.Item>
                                Configure the following environment variables:
                                <List withPadding className="mt-2">
                                  <List.Item><code>NEXT_PUBLIC_SIM_BASE_URL</code> - The URL of your Sim instance</List.Item>
                                  <List.Item><code>NEXT_PUBLIC_SIM_API_KEY</code> - Your Sim API key</List.Item>
                                </List>
                              </List.Item>
                              <List.Item>
                                Restart the application for changes to take effect.
                              </List.Item>
                            </List>
                          }
                        />
                      )}
                      {isSimConfigured && (
                        <IntermediateStateAccordion
                          accordionKey="usage-instructions"
                          chevron={<IconCircleCheck />}
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
                          defaultValue="usage-instructions"
                          content={
                            <>
                              <List
                                w={'80%'}
                                type="ordered"
                                withPadding
                                className={`${montserrat_paragraph.variable} font-montserratParagraph text-[--foreground]`}
                              >
                                <List.Item>
                                  Create workflows in your{' '}
                                  <a
                                    href={simBaseUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[--dashboard-button] hover:text-[--dashboard-button-hover] hover:underline"
                                  >
                                    Sim Dashboard
                                  </a>
                                </List.Item>
                                <List.Item>
                                  Deploy your workflow to make it available via API
                                </List.Item>
                                <List.Item>
                                  Your deployed workflows will appear in the table below
                                </List.Item>
                                <List.Item>
                                  Users can trigger workflows from the chat by mentioning workflow-related keywords
                                </List.Item>
                                <Title
                                  order={5}
                                  className={`${montserrat_heading.variable} ps-5 pt-4 text-center font-montserratHeading font-semibold`}
                                >
                                  Once your workflow is deployed,{' '}
                                  <a
                                    href={`/${course_name}/chat`}
                                    rel="noopener noreferrer"
                                    className="text-[--dashboard-button] hover:text-[--dashboard-button-hover]"
                                    style={{
                                      textDecoration: 'underline',
                                    }}
                                  >
                                    try it in Chat
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
                    padding: '1rem',
                    backgroundColor: 'var(--dashboard-sidebar-background)',
                    color: 'var(--dashboard-foreground)',
                    borderLeft: isSmallScreen
                      ? ''
                      : '1px solid var(--dashboard-border)',
                  }}
                >
                  <div className="card flex h-full w-full flex-col">
                    <div className="card-body" style={{ padding: '.5rem' }}>
                      <div className="pb-4">
                        <Title
                          className={`label ${montserrat_heading.variable} mb-2 p-0 font-montserratHeading`}
                          order={3}
                        >
                          Sim Configuration
                        </Title>
                        <Text
                          className={`${montserrat_paragraph.variable} mb-4 font-montserratParagraph text-[--foreground]`}
                          size="sm"
                        >
                          Status:{' '}
                          {isSimConfigured ? (
                            <span className="font-semibold text-green-500">configured ✓</span>
                          ) : (
                            <span className="font-semibold text-yellow-500">needs configuration</span>
                          )}
                        </Text>
                        
                        <Text
                          className={`${montserrat_paragraph.variable} mb-2 font-montserratParagraph text-[--foreground]`}
                          size="xs"
                        >
                          <strong>Base URL:</strong> {simBaseUrl}
                        </Text>

                        <TextInput
                          label="API Key"
                          placeholder="Enter your Sim API key"
                          value={simApiKeyInput}
                          onChange={(e) => setSimApiKeyInput(e.target.value)}
                          className={`${montserrat_paragraph.variable} mb-3 font-montserratParagraph`}
                          type="password"
                          styles={{
                            input: {
                              backgroundColor: 'var(--input-background)',
                              borderColor: 'var(--input-border)',
                              color: 'var(--foreground)',
                            },
                            label: {
                              color: 'var(--foreground)',
                              marginBottom: '4px',
                            },
                          }}
                        />

                        <Textarea
                          label="Workflow IDs"
                          placeholder="Enter workflow IDs (comma-separated)"
                          description="e.g., abc123, def456, ghi789"
                          value={simWorkflowIdsInput}
                          onChange={(e) => setSimWorkflowIdsInput(e.target.value)}
                          className={`${montserrat_paragraph.variable} mb-4 font-montserratParagraph`}
                          minRows={2}
                          styles={{
                            input: {
                              backgroundColor: 'var(--input-background)',
                              borderColor: 'var(--input-border)',
                              color: 'var(--foreground)',
                            },
                            label: {
                              color: 'var(--foreground)',
                              marginBottom: '4px',
                            },
                            description: {
                              color: 'var(--muted-foreground)',
                            },
                          }}
                        />

                        <Button
                          onClick={handleSaveConfig}
                          loading={isSaving}
                          className="w-full rounded-lg bg-[--dashboard-button] hover:bg-[--dashboard-button-hover]"
                        >
                          Save Configuration
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Flex>
            </Card>

            <div
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
                      className={`pb-3 pt-3 ${montserrat_paragraph.variable} font-montserratParagraph`}
                    >
                      Your Sim Workflows
                    </Title>
                  </Title>
                </div>
              </Flex>
            </div>

            {isSimConfigured && simWorkflowIdsInput && (
              <div
                className={`mx-auto mt-[2%] items-start rounded-2xl bg-[--background] text-[--foreground] ${cardWidthClasses}`}
                style={{ zIndex: 1 }}
              >
                <WorkflowMetadataEditor
                  course_name={course_name}
                  workflowIds={simWorkflowIdsInput.split(',').map(id => id.trim()).filter(Boolean)}
                  onSave={() => {
                    queryClient.invalidateQueries({ queryKey: ['sim-workflows'] })
                  }}
                />
              </div>
            )}

            <SimWorkflowsTable
              course_name={course_name}
              isSimConfigured={isSimConfigured}
              sidebarCollapsed={sidebarCollapsed}
            />
          </Flex>
        </div>
        <GlobalFooter />
      </main>
    </SettingsLayout>
  )
}

export default SimToolsPage
