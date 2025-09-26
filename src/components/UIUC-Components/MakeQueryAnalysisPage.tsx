import { montserrat_heading, montserrat_paragraph } from 'fonts'
import Head from 'next/head'
// import { DropzoneS3Upload } from '~/components/UIUC-Components/Upload_S3'
import {
  // Badge,
  // MantineProvider,
  Button,
  Flex,
  // TextInput,
  // Tooltip,
  Select,
  Text,
  // Group,
  // Stack,
  // createStyles,
  // FileInput,
  // rem,
  Title,
  createStyles,
  // Divider,
  type MantineTheme,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
// const rubik_puddles = Rubik_Puddles({ weight: '400', subsets: ['latin'] })
import {
  IconCalendar,
  IconChartBar,
  IconMessage2,
  IconMessageCircle2,
  IconMinus,
  IconTrendingDown,
  IconTrendingUp,
  IconUsers,
} from '@tabler/icons-react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import SettingsLayout, {
  getInitialCollapsedState,
} from '~/components/Layout/SettingsLayout'
import { GRID_CONFIGS, useResponsiveGrid } from '~/utils/responsiveGrid'
import downloadConversationHistory from '../../pages/util/downloadConversationHistory'
import { getProjectStats } from '../../pages/api/UIUC-api/getProjectStats'
import ConversationsHeatmapByHourChart from './ConversationsHeatmapByHourChart'
import ConversationsPerDayChart from './ConversationsPerDayChart'
import ConversationsPerDayOfWeekChart from './ConversationsPerDayOfWeekChart'
import ConversationsPerHourChart from './ConversationsPerHourChart'
import { LoadingSpinner } from './LoadingSpinner'
import ModelUsageChart from './ModelUsageChart'

const useStyles = createStyles((theme: MantineTheme) => ({
  downloadButton: {
    fontFamily: 'var(--font-montserratHeading)',
    outline: 'none',
    color: 'var(--dashboard-button-foreground)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    borderRadius: theme.radius.xl,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease-in-out',
    height: '48px',
    /* border-1 border-[--dashboard-button] hover:bg-[--dashboard-button-hover] hover:border-[--dashboard-button-hover] */

    '&:hover': {
      color: 'var(--dashboard-button-foreground)',
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

import { useAuth } from 'react-oidc-context'

export const GetCurrentPageName = () => {
  // /CS-125/dashboard --> CS-125
  return useRouter().asPath.slice(1).split('/')[0] as string
}

interface ModelUsage {
  model_name: string
  count: number
  percentage: number
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
  avg_conversations_per_user: number
  avg_messages_per_user: number
  avg_messages_per_conversation: number
}

interface WeeklyTrend {
  current_week_value: number
  metric_name: string
  percentage_change: number
  previous_week_value: number
}

const formatPercentageChange = (value: number | null | undefined) => {
  if (value == null) return '0'
  return value.toFixed(1)
}

const MakeQueryAnalysisPage = ({ course_name }: { course_name: string }) => {
  const { classes, theme } = useStyles()
  const auth = useAuth()
  const [courseMetadata, setCourseMetadata] = useState<CourseMetadata | null>(
    null,
  )
  const [currentEmail, setCurrentEmail] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    getInitialCollapsedState(),
  )
  const router = useRouter()

  // Get responsive grid classes based on sidebar state
  const statsGridClasses = useResponsiveGrid(
    GRID_CONFIGS.STATS_CARDS,
    sidebarCollapsed,
  )
  const chartsGridClasses = useResponsiveGrid(
    GRID_CONFIGS.CHARTS,
    sidebarCollapsed,
  )

  const currentPageName = GetCurrentPageName()

  const [isLoading, setIsLoading] = useState(false)

  const [conversationStats, setConversationStats] =
    useState<ConversationStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)

  const [courseStatsLoading, setCourseStatsLoading] = useState(true)
  const [courseStats, setCourseStats] = useState<CourseStats | null>(null)
  const [courseStatsError, setCourseStatsError] = useState<string | null>(null)

  // Update the state to use an array of WeeklyTrend
  const [weeklyTrends, setWeeklyTrends] = useState<WeeklyTrend[]>([])
  const [trendsLoading, setTrendsLoading] = useState(true)
  const [trendsError, setTrendsError] = useState<string | null>(null)

  const [modelUsageData, setModelUsageData] = useState<ModelUsage[]>([])
  const [modelUsageLoading, setModelUsageLoading] = useState(true)
  const [modelUsageError, setModelUsageError] = useState<string | null>(null)

  const [dateRangeType, setDateRangeType] = useState<string>('last_month')
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ])
  const [totalCount, setTotalCount] = useState<number>(0)

  // Separate state for filtered conversation stats
  const [filteredConversationStats, setFilteredConversationStats] =
    useState<ConversationStats | null>(null)
  const [filteredStatsLoading, setFilteredStatsLoading] = useState(true)
  const [filteredStatsError, setFilteredStatsError] = useState<string | null>(
    null,
  )

  // TODO: remove this hook... we should already have this from the /materials props???
  useEffect(() => {
    const fetchData = async () => {
      setCurrentEmail(auth.user?.profile.email as string)

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
  }, [currentPageName, !auth.isLoading, auth.user])

  const [hasConversationData, setHasConversationData] = useState<boolean>(true)

  const getDateRange = () => {
    const today = new Date()
    switch (dateRangeType) {
      case 'last_week':
        const lastWeek = new Date(today)
        lastWeek.setDate(today.getDate() - 7)
        return {
          from_date: lastWeek.toISOString().split('T')[0],
          to_date: today.toISOString().split('T')[0],
        }
      case 'last_month':
        const lastMonth = new Date(today)
        lastMonth.setMonth(today.getMonth() - 1)
        return {
          from_date: lastMonth.toISOString().split('T')[0],
          to_date: today.toISOString().split('T')[0],
        }
      case 'last_year':
        const lastYear = new Date(today)
        lastYear.setFullYear(today.getFullYear() - 1)
        return {
          from_date: lastYear.toISOString().split('T')[0],
          to_date: today.toISOString().split('T')[0],
        }
      case 'custom':
        return {
          from_date: dateRange[0]
            ? dateRange[0].toISOString().split('T')[0]
            : undefined,
          to_date: dateRange[1]
            ? dateRange[1].toISOString().split('T')[0]
            : undefined,
        }
      default:
        return { from_date: undefined, to_date: undefined }
    }
  }

  useEffect(() => {
    const fetchFilteredConversationStats = async () => {
      try {
        const { from_date, to_date } = getDateRange()

        if (dateRangeType === 'custom' && (!dateRange[0] || !dateRange[1])) {
          setHasConversationData(false)
          return
        }

        // TODO: Change this to a fetch request
        const response = await fetch('/api/UIUC-api/getConversationStats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ course_name, from_date, to_date }),
        })
        if (response.status === 200) {
          const data = await response.json()
          setFilteredConversationStats(data)
          setTotalCount(data.total_count || 0)
          setHasConversationData(Object.keys(data.per_day).length > 0)
        }
      } catch (error) {
        console.error('Error fetching filtered conversation stats:', error)
        setFilteredStatsError('Failed to fetch conversation statistics')
        setHasConversationData(false)
      } finally {
        setFilteredStatsLoading(false)
      }
    }

    fetchFilteredConversationStats()
  }, [course_name, dateRangeType, dateRange])

  useEffect(() => {
    const fetchAllTimeConversationStats = async () => {
      try {
        const response = await fetch('/api/UIUC-api/getConversationStats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ course_name }),
        })
        if (response.status === 200) {
          const data = await response.json()
          setConversationStats(data)
        }
      } catch (error) {
        console.error('Error fetching all-time conversation stats:', error)
        setStatsError('Failed to fetch conversation statistics')
      } finally {
        setStatsLoading(false)
      }
    }

    fetchAllTimeConversationStats()
  }, [course_name])

  useEffect(() => {
    const fetchCourseStats = async () => {
      setCourseStatsLoading(true)
      setCourseStatsError(null)
      try {
        const response = await fetch('/api/UIUC-api/getProjectStats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ course_name, project_name: course_name }),
        })
        if (response.status === 200) {
          const data = await response.json()
          const mappedData = {
            total_conversations: data.total_conversations,
            total_messages: data.total_messages,
            total_users: data.unique_users,
            avg_conversations_per_user: data.avg_conversations_per_user,
            avg_messages_per_user: data.avg_messages_per_user,
            avg_messages_per_conversation: data.avg_messages_per_conversation,
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

  useEffect(() => {
    const fetchWeeklyTrends = async () => {
      setTrendsLoading(true)
      setTrendsError(null)
      try {
        const response = await fetch('/api/UIUC-api/getWeeklyTrends', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ course_name, project_name: course_name }),
        })
        if (response.status === 200) {
          const data = await response.json()
          setWeeklyTrends(data)
        } else {
          throw new Error('Failed to fetch weekly trends')
        }
      } catch (error) {
        setTrendsError('Failed to load trends')
      } finally {
        setTrendsLoading(false)
      }
    }

    fetchWeeklyTrends()
  }, [course_name])

  useEffect(() => {
    const fetchModelUsage = async () => {
      setModelUsageLoading(true)
      setModelUsageError(null)
      try {
        const response = await fetch('/api/UIUC-api/getModelUsageCounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ course_name, project_name: course_name }),
        })
        if (response.status === 200) {
          const data = await response.json()
          setModelUsageData(data)
        } else {
          throw new Error('Failed to fetch model usage data')
        }
      } catch (error) {
        setModelUsageError('Failed to load model usage data')
      } finally {
        setModelUsageLoading(false)
      }
    }

    fetchModelUsage()
  }, [course_name])

  const [view, setView] = useState('hour')

  if (auth.isLoading || !courseMetadata) {
    return <LoadingSpinner />
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
              <div className="pt-5"></div>
              <div
                className="w-[96%] rounded-3xl bg-[--background] md:w-full 2xl:w-[95%]"
                style={{
                  // width: '98%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  paddingTop: '1rem',
                }}
              >
                <div
                  style={{
                    width: '95%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: '1rem',
                  }}
                >
                  <Title
                    order={3}
                    align="left"
                    className={`px-4 text-[--dashboard-foreground] ${montserrat_heading.variable} font-montserratHeading`}
                    style={{ flexGrow: 2 }}
                  >
                    Usage Overview
                  </Title>
                  <Button
                    className={`${montserrat_paragraph.variable} font-montserratParagraph ${classes.downloadButton} w-full bg-[--dashboard-button] px-2 text-sm hover:bg-[--dashboard-button-hover] sm:w-auto sm:px-4 sm:text-base`}
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

                {/* Project Analytics Dashboard - Using all-time stats */}
                <div className="my-6 w-[95%] rounded-xl bg-[--dashboard-background-faded] p-6 text-[--dashboard-foreground]">
                  <div className="mb-6">
                    <Title
                      order={4}
                      className={`${montserrat_heading.variable} font-montserratHeading`}
                    >
                      Project Analytics
                    </Title>
                    <Text
                      size="sm"
                      color="var(--dashboard-foreground-faded)"
                      mt={2}
                    >
                      Overview of project engagement and usage statistics
                    </Text>
                  </div>

                  {/* Main Stats Grid with Integrated Weekly Trends */}
                  <div className={`grid gap-6 ${statsGridClasses}`}>
                    {/* Conversations Card */}
                    <div className="rounded-lg bg-[--dashboard-background] p-4 text-[--dashboard-foreground] transition-all duration-200">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <Text size="sm" weight={500} mb={1}>
                            Total Conversations
                          </Text>
                          <Text size="xs" opacity={0.7}>
                            All-time chat sessions
                          </Text>
                        </div>
                        <div className="rounded-full bg-[--dashboard-background-dark] p-2">
                          <IconMessageCircle2
                            size={24}
                            className="text-[--dashboard-stat]"
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center gap-3">
                          <Text
                            size="xl"
                            weight={700}
                            className="flex min-h-[3rem] min-w-[3rem] items-center justify-center rounded-full bg-[--dashboard-stat] text-white"
                          >
                            {courseStats?.total_conversations?.toLocaleString() ||
                              '0'}
                          </Text>

                          {(() => {
                            const trend = weeklyTrends.find(
                              (t) => t.metric_name === 'Total Conversations',
                            )
                            if (!trend) return null

                            return (
                              <div
                                className={`flex items-center gap-2 rounded-md ${
                                  trend.percentage_change > 0
                                    ? 'bg-green-400/10'
                                    : trend.percentage_change < 0
                                      ? 'bg-red-400/10'
                                      : 'bg-gray-400/10'
                                }`}
                              >
                                {trend.percentage_change > 0 ? (
                                  <IconTrendingUp
                                    size={32}
                                    className="text-green-400"
                                  />
                                ) : trend.percentage_change < 0 ? (
                                  <IconTrendingDown
                                    size={32}
                                    className="text-red-400"
                                  />
                                ) : (
                                  <IconMinus
                                    size={18}
                                    className="text-gray-400"
                                  />
                                )}
                                <Text
                                  size="sm"
                                  weight={500}
                                  className={
                                    trend.percentage_change > 0
                                      ? 'text-green-400'
                                      : trend.percentage_change < 0
                                        ? 'text-red-400'
                                        : 'text-gray-400'
                                  }
                                >
                                  {trend.percentage_change > 0 ? '+' : ''}
                                  {formatPercentageChange(
                                    trend.percentage_change,
                                  )}
                                  % vs last week
                                </Text>
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Users Card */}
                    <div className="rounded-lg bg-[--dashboard-background] p-4 text-[--dashboard-foreground] transition-all duration-200">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <Text size="sm" weight={500} mb={1}>
                            Total Users
                          </Text>
                          <Text size="xs" opacity={0.7}>
                            All-time unique participants
                          </Text>
                        </div>
                        <div className="rounded-full bg-[--dashboard-background-dark] p-2">
                          <IconUsers
                            size={24}
                            className="text-[--dashboard-stat]"
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center gap-3">
                          <Text
                            size="xl"
                            weight={700}
                            className="flex min-h-[3rem] min-w-[3rem] items-center justify-center rounded-full bg-[--dashboard-stat] text-white"
                          >
                            {courseStats?.total_users?.toLocaleString() || '0'}
                          </Text>
                          {(() => {
                            const trend = weeklyTrends.find(
                              (t) => t.metric_name === 'Unique Users',
                            )
                            if (!trend) return null

                            return (
                              <div
                                className={`flex items-center gap-2 rounded-md ${
                                  trend.percentage_change > 0
                                    ? 'bg-green-400/10'
                                    : trend.percentage_change < 0
                                      ? 'bg-red-400/10'
                                      : 'bg-gray-400/10'
                                }`}
                              >
                                {trend.percentage_change > 0 ? (
                                  <IconTrendingUp
                                    size={32}
                                    className="text-green-400"
                                  />
                                ) : trend.percentage_change < 0 ? (
                                  <IconTrendingDown
                                    size={32}
                                    className="text-red-400"
                                  />
                                ) : (
                                  <IconMinus
                                    size={18}
                                    className="text-gray-400"
                                  />
                                )}
                                <Text
                                  size="sm"
                                  weight={500}
                                  className={
                                    trend.percentage_change > 0
                                      ? 'text-green-400'
                                      : trend.percentage_change < 0
                                        ? 'text-red-400'
                                        : 'text-gray-400'
                                  }
                                >
                                  {trend.percentage_change > 0 ? '+' : ''}
                                  {formatPercentageChange(
                                    trend.percentage_change,
                                  )}
                                  % vs last week
                                </Text>
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Messages Card */}
                    <div className="rounded-lg bg-[--dashboard-background] p-4 text-[--dashboard-foreground] transition-all duration-200">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <Text size="sm" weight={500} mb={1}>
                            Messages
                          </Text>
                          <Text size="xs" opacity={0.7}>
                            Total exchanges
                          </Text>
                        </div>
                        <div className="rounded-full bg-[--dashboard-background-dark] p-2">
                          <IconMessage2
                            size={24}
                            className="text-[--dashboard-stat]"
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center gap-3">
                          <Text
                            size="xl"
                            weight={700}
                            className="inline-flex min-h-[3rem] min-w-[3rem] items-center justify-center rounded-full bg-[--dashboard-stat] text-white"
                          >
                            {courseStats?.total_messages?.toLocaleString() ||
                              '0'}
                          </Text>

                          {(() => {
                            const trend = weeklyTrends.find(
                              (t) => t.metric_name === 'Total Messages',
                            )
                            if (!trend) return null

                            return (
                              <div
                                className={`flex items-center gap-2 rounded-md ${
                                  trend.percentage_change > 0
                                    ? 'bg-green-400/10'
                                    : trend.percentage_change < 0
                                      ? 'bg-red-400/10'
                                      : 'bg-gray-400/10'
                                }`}
                              >
                                {trend.percentage_change > 0 ? (
                                  <IconTrendingUp
                                    size={32}
                                    className="text-green-400"
                                  />
                                ) : trend.percentage_change < 0 ? (
                                  <IconTrendingDown
                                    size={32}
                                    className="text-red-400"
                                  />
                                ) : (
                                  <IconMinus
                                    size={18}
                                    className="text-gray-400"
                                  />
                                )}
                                <Text
                                  size="sm"
                                  weight={500}
                                  className={
                                    trend.percentage_change > 0
                                      ? 'text-green-400'
                                      : trend.percentage_change < 0
                                        ? 'text-red-400'
                                        : 'text-gray-400'
                                  }
                                >
                                  {trend.percentage_change > 0 ? '+' : ''}
                                  {formatPercentageChange(
                                    trend.percentage_change,
                                  )}
                                  % vs last week
                                </Text>
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* User Engagement Metrics Section */}
                  <div className="mt-8">
                    <div className="mb-4 flex items-center">
                      <div className="flex-1">
                        <Text
                          size="lg"
                          weight={600}
                          className={`${montserrat_heading.variable} font-montserratHeading`}
                        >
                          User Engagement Metrics
                        </Text>
                        <Text
                          size="sm"
                          color="var(--dashboard-foreground-faded)"
                          mt={1}
                        >
                          Detailed breakdown of user interaction patterns
                        </Text>
                      </div>
                    </div>

                    <div className={`grid gap-6 ${statsGridClasses}`}>
                      {/* Average Conversations per User */}
                      <div className="rounded-lg bg-[--dashboard-background] p-4 text-[--dashboard-foreground] transition-all duration-200">
                        <div className="mb-3 flex items-center justify-between">
                          <div>
                            <Text size="sm" weight={500} mb={1}>
                              Conversations per User
                            </Text>
                            <Text size="xs" opacity={0.7}>
                              Average engagement frequency
                            </Text>
                          </div>
                          <div className="rounded-full bg-[--dashboard-background-dark] p-2">
                            <IconMessageCircle2
                              size={24}
                              className="text-[--dashboard-stat]"
                            />
                          </div>
                        </div>
                        <div className="mt-4 flex items-baseline gap-2">
                          <Text
                            size="xl"
                            weight={700}
                            className="inline-flex min-h-[3rem] min-w-[3rem] items-center justify-center rounded-full bg-[--dashboard-stat] text-white"
                          >
                            {courseStats?.avg_conversations_per_user?.toFixed(
                              1,
                            ) || '0'}
                          </Text>
                          <Text size="sm" color="dimmed">
                            conversations / user
                          </Text>
                        </div>
                      </div>

                      {/* Average Messages per User */}
                      <div className="rounded-lg bg-[--dashboard-background] p-4 text-[--dashboard-foreground] transition-all duration-200">
                        <div className="mb-3 flex items-center justify-between">
                          <div>
                            <Text size="sm" weight={500} mb={1}>
                              Messages per User
                            </Text>
                            <Text size="xs" opacity={0.7}>
                              Average interaction depth
                            </Text>
                          </div>
                          <div className="rounded-full bg-[--dashboard-background-dark] p-2">
                            <IconMessage2
                              size={24}
                              className="text-[--dashboard-stat]"
                            />
                          </div>
                        </div>
                        <div className="mt-4 flex items-baseline gap-2">
                          <Text
                            size="xl"
                            weight={700}
                            className="inline-flex min-h-[3rem] min-w-[3rem] items-center justify-center rounded-full bg-[--dashboard-stat] text-white"
                          >
                            {courseStats?.avg_messages_per_user?.toFixed(1) ||
                              '0'}
                          </Text>
                          <Text size="sm" color="dimmed">
                            messages / user
                          </Text>
                        </div>
                      </div>

                      {/* Average Messages per Conversation */}
                      <div className="rounded-lg bg-[--dashboard-background] p-4 text-[--dashboard-foreground] transition-all duration-200">
                        <div className="mb-3 flex items-center justify-between">
                          <div>
                            <Text size="sm" weight={500} mb={1}>
                              Messages per Conversation
                            </Text>
                            <Text size="xs" opacity={0.7}>
                              Average conversation length
                            </Text>
                          </div>
                          <div className="rounded-full bg-[--dashboard-background-dark] p-2">
                            <IconChartBar
                              size={24}
                              className="text-[--dashboard-stat]"
                            />
                          </div>
                        </div>
                        <div className="mt-4 flex items-baseline gap-2">
                          <Text
                            size="xl"
                            weight={700}
                            className="inline-flex min-h-[3rem] min-w-[3rem] items-center justify-center rounded-full bg-[--dashboard-stat] text-white"
                          >
                            {courseStats?.avg_messages_per_conversation?.toFixed(
                              1,
                            ) || '0'}
                          </Text>
                          <Text size="sm" color="dimmed">
                            messages / conversation
                          </Text>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts Section - Using filtered stats */}
                <div className="grid w-[95%] grid-cols-1 gap-6 pb-10 lg:grid-cols-2">
                  {/* Date Range Selector - Always visible */}
                  <div className="rounded-xl bg-[--dashboard-background-faded] p-6 text-[--dashboard-foreground] transition-all duration-200 lg:col-span-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <Title order={4}>Conversation Visualizations</Title>
                        <Text size="sm" mt={1}>
                          Select a time range to filter the visualizations below
                        </Text>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Select
                          size="sm"
                          w={200}
                          value={dateRangeType}
                          onChange={(value) => {
                            setDateRangeType(value || 'all')
                            if (value !== 'custom') {
                              setDateRange([null, null])
                            }
                          }}
                          data={[
                            { value: 'all', label: 'All Time' },
                            { value: 'last_week', label: 'Last Week' },
                            { value: 'last_month', label: 'Last Month' },
                            { value: 'last_year', label: 'Last Year' },
                            { value: 'custom', label: 'Custom Range' },
                          ]}
                          className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                          styles={(theme) => ({
                            input: {
                              '&:focus': {
                                borderColor: 'var(--dashboard-button)',
                              },
                              color: 'var(--foreground)',
                              backgroundColor: 'var(--background)',
                              fontFamily: `var(--font-montserratParagraph), ${theme.fontFamily}`,
                            },
                            dropdown: {
                              backgroundColor: 'var(--background)',
                              border: '1px solid var(--background-dark)',
                            },
                            item: {
                              color: 'var(--foreground)',
                              backgroundColor: 'var(--background)',
                              borderRadius: theme.radius.md,
                              margin: '2px',
                              '&[data-selected]': {
                                '&': {
                                  color: 'var(--foreground)',
                                  backgroundColor: 'transparent',
                                },
                                '&:hover': {
                                  color: 'var(--foreground)',
                                  backgroundColor: 'var(--foreground-faded)',
                                },
                              },
                              '&[data-hovered]': {
                                color: 'var(--foreground)',
                                backgroundColor: 'var(--foreground-faded)',
                              },
                            },
                          })}
                        />
                        {dateRangeType === 'custom' && (
                          <DatePickerInput
                            firstDayOfWeek={0}
                            icon={<IconCalendar size="1.1rem" stroke={1.5} />}
                            type="range"
                            size="sm"
                            w={200}
                            value={dateRange}
                            onChange={setDateRange}
                            // TODO fix me type error complaining placeholder doesn't exist for mantine/date v6
                            // placeholder="Pick date range"
                            className="date_picker"
                            styles={(theme: MantineTheme) => ({
                              icon: {
                                color: 'var(--foreground)',
                              },
                              input: {
                                backgroundColor: 'var(--background)',
                                borderColor: 'var(--foreground-faded)',
                                color: 'var(--foreground)',
                                '&:selected': {
                                  color: 'var(--button-text-color)',
                                  backgroundColor: 'var(--button)',
                                  borderColor: 'var(--button)',
                                },
                                '&:hover': {
                                  borderColor: 'var(--dashboard-button)',
                                },
                                '&:focus': {
                                  borderColor: 'var(--button)',
                                },
                              },
                              calendarHeader: {
                                borderColor: 'var(--button)',
                                color: theme.white,
                              },
                              calendarHeaderControl: {
                                color: theme.white,
                                '&:hover': {
                                  color: theme.white,
                                },
                              },
                              monthPickerControl: {
                                color: theme.white,
                                '&:hover': {
                                  backgroundColor: 'var(--button-hover)',
                                },
                              },
                              yearPickerControl: {
                                color: theme.white,
                                '&:hover': {
                                  backgroundColor: 'var(--button-hover)',
                                },
                              },
                              day: {
                                color: theme.white,
                                // '&:hover': {
                                //   backgroundColor: theme.colors.grape[8],
                                // },
                              },
                            })}
                          />
                        )}
                        {totalCount > 0 && (
                          <Text size="sm" color="dimmed">
                            {totalCount} conversations in selected range
                          </Text>
                        )}
                      </div>
                    </div>
                  </div>

                  {!hasConversationData ? (
                    <div className="rounded-xl bg-[--dashboard-background-faded] p-6 text-[--dashboard-foreground] transition-all duration-200">
                      <Title
                        order={4}
                        className={`${montserrat_heading.variable} font-montserratHeading`}
                      >
                        No conversation data available for selected time range
                      </Title>
                      <Text size="lg" mt="md">
                        Try selecting a different time range to view the
                        visualizations
                      </Text>
                    </div>
                  ) : (
                    <>
                      {/* Model Usage Chart */}
                      <div className="rounded-xl bg-[--dashboard-background-faded] p-6 text-[--dashboard-foreground] transition-all duration-200">
                        <Title order={4} mb="md" align="left">
                          Model Usage Distribution
                        </Title>
                        <Text size="sm" mb="xl">
                          Distribution of AI models used across all
                          conversations
                        </Text>
                        <ModelUsageChart
                          data={modelUsageData}
                          isLoading={modelUsageLoading}
                          error={modelUsageError}
                        />
                      </div>

                      {/* Conversations Per Day Chart */}
                      <div className="rounded-xl bg-[--dashboard-background-faded] p-6 text-[--dashboard-foreground] transition-all duration-200">
                        <Title order={4} mb="md" align="left">
                          Conversations Per Day
                        </Title>
                        <Text size="sm" mb="xl">
                          Shows the total number of conversations that occurred
                          on each calendar day
                        </Text>
                        <ConversationsPerDayChart
                          data={filteredConversationStats?.per_day}
                          isLoading={filteredStatsLoading}
                          error={filteredStatsError}
                        />
                      </div>

                      {/* Combined Hour/Weekday Chart */}
                      <div className="rounded-xl bg-[--dashboard-background-faded] p-6 text-[--dashboard-foreground] transition-all duration-200">
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <Title order={4}>
                              Aggregated Conversation Breakdown
                            </Title>
                            <Text size="sm" mt={1}>
                              View conversation patterns by hour of day or day
                              of week
                            </Text>
                          </div>
                          <Select
                            value={view}
                            onChange={(value) => setView(value || 'hour')}
                            data={[
                              { value: 'hour', label: 'By Hour' },
                              { value: 'weekday', label: 'By Day of Week' },
                            ]}
                            className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                            styles={(theme) => ({
                              input: {
                                '&:focus': {
                                  borderColor: 'var(--dashboard-button)',
                                },
                                color: 'var(--foreground)',
                                backgroundColor: 'var(--background)',
                                fontFamily: `var(--font-montserratParagraph), ${theme.fontFamily}`,
                              },
                              dropdown: {
                                backgroundColor: 'var(--background)',
                                border: '1px solid var(--background-dark)',
                              },
                              item: {
                                color: 'var(--foreground)',
                                backgroundColor: 'var(--background)',
                                borderRadius: theme.radius.md,
                                margin: '2px',
                                '&[data-selected]': {
                                  '&': {
                                    color: 'var(--foreground)',
                                    backgroundColor: 'transparent',
                                  },
                                  '&:hover': {
                                    color: 'var(--foreground)',
                                    backgroundColor: 'var(--foreground-faded)',
                                  },
                                },
                                '&[data-hovered]': {
                                  color: 'var(--foreground)',
                                  backgroundColor: 'var(--foreground-faded)',
                                },
                              },
                            })}
                            size="xs"
                            w={150}
                          />
                        </div>
                        {view === 'hour' ? (
                          <ConversationsPerHourChart
                            data={filteredConversationStats?.per_hour}
                            isLoading={filteredStatsLoading}
                            error={filteredStatsError}
                          />
                        ) : (
                          <ConversationsPerDayOfWeekChart
                            data={filteredConversationStats?.per_weekday}
                            isLoading={filteredStatsLoading}
                            error={filteredStatsError}
                          />
                        )}
                      </div>

                      {/* Heatmap Chart */}
                      <div className="rounded-xl bg-[--dashboard-background-faded] p-6 text-[--dashboard-foreground] transition-all duration-200">
                        <Title order={4} mb="md" align="left">
                          Conversations Per Day and Hour
                        </Title>
                        <Text size="sm" mb="xl">
                          A heatmap showing conversation density across both
                          days and hours
                        </Text>
                        <ConversationsHeatmapByHourChart
                          data={filteredConversationStats?.heatmap}
                          isLoading={filteredStatsLoading}
                          error={filteredStatsError}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Flex>
          </div>

          {/*<NomicDocumentMap course_name={course_name as string} />*/}
          <GlobalFooter />
        </main>
      </SettingsLayout>
    </>
  )
}

import { IconCheck, IconCloudDownload } from '@tabler/icons-react'

import { notifications } from '@mantine/notifications'
import { type CourseMetadata } from '~/types/courseMetadata'
import { CannotEditCourse } from './CannotEditCourse'
import GlobalFooter from './GlobalFooter'

import Link from 'next/link'
import NomicDocumentMap from './NomicDocumentsMap'

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
        ? "An error occurred while deleting the file. Please try again and I'd be so grateful if you email rohan13@illinois.edu to report this bug."
        : 'The file is being deleted in the background.',
      icon: <IconCheck />,
      // className: 'my-notification-class',
      styles: {
        root: {
          backgroundColor: was_error ? 'var(--error)' : 'var(--notification)',
          borderColor: was_error
            ? 'var(--error)'
            : 'var(--notification-border)',
        },
        title: {
          color: 'var(--notification-title)',
        },
        description: {
          color: 'var(--notification-message)',
        },
        closeButton: {
          color: 'var(--text-foreground-faded)',
          '&:hover': {
            color: 'var(--text-foreground)',
            backgroundColor: 'var(--text-background-faded)',
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
          style={{
            textDecoration: 'underline',
            color: 'var(--dashboard-button)',
          }}
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
