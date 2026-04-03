import {
  Button,
  Card,
  Flex,
  Group,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Badge,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconAlertCircle,
  IconCheck,
  IconExternalLink,
} from '@tabler/icons-react'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { Montserrat } from 'next/font/google'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useAuth } from 'react-oidc-context'
import SettingsLayout, {
  getInitialCollapsedState,
} from '~/components/Layout/SettingsLayout'
import { type CourseMetadata } from '~/types/courseMetadata'
import { fetchCourseMetadata } from '~/utils/apiUtils'
import { useFetchAllWorkflows } from '~/utils/functionCalling/handleFunctionCalling'
import { useResponsiveCardWidth } from '~/utils/responsiveGrid'
import { CannotEditCourse } from './CannotEditCourse'
import GlobalFooter from './GlobalFooter'
import { LoadingPlaceholderForAdminPages } from './MainPageBackground'

const STORAGE_KEY_API = 'sim_api_key'
const STORAGE_KEY_WORKSPACE = 'sim_workspace_id'

function maskKey(key: string): string {
  if (key.length <= 8) return '*'.repeat(key.length)
  return key.slice(0, 4) + '*'.repeat(key.length - 8) + key.slice(-4)
}

const SimPage = ({ course_name }: { course_name: string }) => {
  const router = useRouter()
  const auth = useAuth()

  const [courseMetadata, setCourseMetadata] = useState<CourseMetadata | null>(
    null,
  )
  const [currentEmail, setCurrentEmail] = useState('')
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [workspaceIdInput, setWorkspaceIdInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [hasSavedConfig, setHasSavedConfig] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    getInitialCollapsedState(),
  )
  const isSmallScreen = useMediaQuery('(max-width: 960px)')
  const cardWidthClasses = useResponsiveCardWidth(sidebarCollapsed)

  const {
    data: workflows,
    isSuccess,
    isError,
    refetch: refetchWorkflows,
  } = useFetchAllWorkflows(course_name)

  // Load saved config from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem(`${STORAGE_KEY_API}_${course_name}`)
    const savedWorkspace = localStorage.getItem(
      `${STORAGE_KEY_WORKSPACE}_${course_name}`,
    )
    if (savedKey) {
      setApiKeyInput(savedKey)
      setHasSavedConfig(true)
    }
    if (savedWorkspace) setWorkspaceIdInput(savedWorkspace)
  }, [course_name])

  // Fetch course metadata + auth
  useEffect(() => {
    const fetchData = async () => {
      setCurrentEmail(auth.user?.profile.email as string)
      try {
        const metadata = (await fetchCourseMetadata(
          course_name,
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
  }, [course_name, auth.isLoading, auth.user?.profile.email])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Save to localStorage for testing (no Supabase required)
      localStorage.setItem(`${STORAGE_KEY_API}_${course_name}`, apiKeyInput)
      localStorage.setItem(
        `${STORAGE_KEY_WORKSPACE}_${course_name}`,
        workspaceIdInput,
      )

      // Also try to persist to DB (will work once Supabase is connected)
      await fetch('/api/UIUC-api/tools/upsertSimConfig', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_name,
          sim_api_key: apiKeyInput || null,
          sim_workspace_id: workspaceIdInput || null,
        }),
      }).catch(() => {
        // DB not available — localStorage is the fallback
        console.debug('[SimPage] DB upsert failed, using localStorage only')
      })

      setHasSavedConfig(!!apiKeyInput)
      refetchWorkflows()

      notifications.show({
        id: 'sim-config-saved',
        title: 'Saved',
        message: 'Sim AI configuration saved successfully.',
        autoClose: 5000,
        color: 'green',
        icon: <IconCheck />,
        styles: notificationStyles(false),
      })
    } catch (error) {
      notifications.show({
        id: 'sim-config-error',
        title: 'Error',
        message: 'Failed to save Sim AI configuration.',
        autoClose: 10000,
        color: 'red',
        icon: <IconAlertCircle />,
        styles: notificationStyles(true),
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (auth.isLoading || !courseMetadata) {
    return <LoadingPlaceholderForAdminPages />
  }

  if (
    courseMetadata &&
    currentEmail !== (courseMetadata.course_owner as string) &&
    courseMetadata.course_admins.indexOf(currentEmail) === -1
  ) {
    router.replace(`/${course_name}/not_authorized`)
    return <CannotEditCourse course_name={course_name} />
  }

  return (
    <SettingsLayout
      course_name={course_name}
      sidebarCollapsed={sidebarCollapsed}
      setSidebarCollapsed={setSidebarCollapsed}
    >
      <Head>
        <title>{course_name} - Sim AI Tools</title>
        <meta
          name="description"
          content="Configure Sim AI tool calling for your project."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="course-page-main min-w-screen flex min-h-screen flex-col items-center">
        <div className="items-left flex w-full flex-col justify-center py-0">
          <Flex direction="column" align="center" w="100%">
            {/* Config card */}
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
              <Flex className="flex-col md:flex-row">
                <div
                  className="min-h-full flex-[1_1_100%] bg-[--background] md:flex-[1_1_60%]"
                  style={{ color: 'var(--foreground)' }}
                >
                  <Group spacing="lg" m="1rem">
                    <Title
                      order={2}
                      className={`${montserrat_heading.variable} ml-4 font-montserratHeading`}
                    >
                      LLM Tool Use &amp; Function Calling
                    </Title>
                    <Stack align="start" justify="start">
                      <Title
                        className={`${montserrat_heading.variable} flex-[1_1_50%] font-montserratHeading`}
                        order={5}
                        w="100%"
                        ml="md"
                        style={{ textAlign: 'left' }}
                      >
                        Connect your{' '}
                        <a
                          href="https://www.sim.ai"
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-[--dashboard-button] hover:text-[--dashboard-button-hover] ${montserrat_heading.variable} font-montserratHeading`}
                        >
                          Sim AI{' '}
                          <IconExternalLink
                            className="mr-2 inline-block"
                            style={{ position: 'relative', top: '-3px' }}
                          />
                        </a>
                        workspace to enable tool calling. Your deployed
                        workflows will be automatically discovered and available
                        as tools in the chat.
                      </Title>
                    </Stack>
                  </Group>
                </div>

                {/* Right side — config inputs */}
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
                  <div className="card flex h-full w-full flex-col justify-center">
                    <div className="card-body" style={{ padding: '.5rem' }}>
                      <div className="pb-4">
                        <Title
                          className={`label ${montserrat_heading.variable} mb-2 p-0 font-montserratHeading`}
                          order={3}
                        >
                          Sim AI Configuration
                        </Title>
                        <TextInput
                          type="password"
                          label="API Key"
                          description="Your Sim AI API key (sk-sim-...). Found in Settings → Sim Keys."
                          placeholder="sk-sim-..."
                          value={apiKeyInput}
                          onChange={(e) => setApiKeyInput(e.target.value)}
                          styles={{
                            input: {
                              color: 'var(--foreground)',
                              backgroundColor: 'var(--background)',
                              margin: '.5rem 0 .1rem 0',
                            },
                          }}
                          className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                        />
                        <div className="pt-2" />
                        <TextInput
                          label="Workspace ID"
                          description="Your Sim AI workspace ID. Found in your workspace URL or settings."
                          placeholder="Enter workspace ID"
                          value={workspaceIdInput}
                          onChange={(e) => setWorkspaceIdInput(e.target.value)}
                          styles={{
                            input: {
                              color: 'var(--foreground)',
                              backgroundColor: 'var(--background)',
                              margin: '.5rem 0 .1rem 0',
                            },
                          }}
                          className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                        />
                        <div className="pt-3" />
                        <Button
                          onClick={handleSave}
                          className="rounded-lg bg-[--dashboard-button] text-[--dashboard-button-foreground] hover:bg-[--dashboard-button-hover]"
                          disabled={isSaving}
                        >
                          {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                        {hasSavedConfig && apiKeyInput && (
                          <Text
                            size="xs"
                            mt="xs"
                            className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                            style={{ color: 'var(--foreground)', opacity: 0.6 }}
                          >
                            Stored key: {maskKey(apiKeyInput)}
                          </Text>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Flex>
            </Card>

            {/* Discovered workflows table */}
            <div
              className={`mx-auto mt-[2%] items-start rounded-2xl bg-[--background] text-[--foreground] ${cardWidthClasses}`}
              style={{ zIndex: 1 }}
            >
              <Flex direction="row" justify="space-between">
                <Title
                  order={3}
                  className={`pb-3 pt-3 ${montserrat_paragraph.variable} font-montserratParagraph`}
                >
                  Deployed Sim AI Workflows
                </Title>
              </Flex>
            </div>

            <Card
              withBorder
              radius="xl"
              className={`${cardWidthClasses}`}
              style={{
                backgroundColor: 'var(--background)',
                borderColor: 'var(--dashboard-border)',
              }}
            >
              {!hasSavedConfig && (
                <Text
                  className={`${montserrat_paragraph.variable} p-4 font-montserratParagraph`}
                  style={{ color: 'var(--foreground)', opacity: 0.7 }}
                >
                  Enter your Sim AI API Key and Workspace ID above to discover
                  deployed workflows.
                </Text>
              )}
              {hasSavedConfig && isError && (
                <Text
                  className={`${montserrat_paragraph.variable} p-4 font-montserratParagraph`}
                  color="red"
                >
                  Failed to load workflows. Check your API key and workspace ID.
                </Text>
              )}
              {hasSavedConfig &&
                isSuccess &&
                workflows &&
                workflows.length === 0 && (
                  <Text
                    className={`${montserrat_paragraph.variable} p-4 font-montserratParagraph`}
                    style={{ color: 'var(--foreground)', opacity: 0.7 }}
                  >
                    No deployed workflows found. Deploy a workflow in Sim AI to
                    see it here.
                  </Text>
                )}
              {hasSavedConfig &&
                isSuccess &&
                workflows &&
                workflows.length > 0 && (
                  <Table
                    striped
                    highlightOnHover
                    className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                  >
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Input Fields</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workflows.map((tool) => (
                        <tr key={tool.id}>
                          <td>
                            <Text weight={500}>{tool.readableName}</Text>
                          </td>
                          <td>
                            <Text size="sm" lineClamp={2}>
                              {tool.description}
                            </Text>
                          </td>
                          <td>
                            {tool.inputParameters?.required?.map((field) => (
                              <Badge
                                key={field}
                                size="sm"
                                variant="outline"
                                mr={4}
                              >
                                {field}
                              </Badge>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
            </Card>
          </Flex>
        </div>
      </main>
      <GlobalFooter />
    </SettingsLayout>
  )
}

function notificationStyles(isError: boolean) {
  return {
    root: {
      backgroundColor: 'var(--notification)',
      borderColor: isError ? '#E53935' : 'var(--notification-border)',
      borderWidth: '1px',
      borderStyle: 'solid' as const,
      borderRadius: '8px',
    },
    title: { color: 'var(--notification-title)', fontWeight: 600 },
    description: { color: 'var(--notification-message)' },
    closeButton: {
      color: 'var(--notification-title)',
      borderRadius: '4px',
    },
    icon: {
      backgroundColor: 'transparent',
      color: isError ? '#E53935' : 'var(--notification-title)',
    },
  }
}

export default SimPage
