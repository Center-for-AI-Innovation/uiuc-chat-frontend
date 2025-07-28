import Head from 'next/head'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
// import { DropzoneS3Upload } from '~/components/UIUC-Components/Upload_S3'
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
  type MantineTheme,
  Divider,
  // TextInput,
  // Tooltip,
  Select,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
// const rubik_puddles = Rubik_Puddles({ weight: '400', subsets: ['latin'] })
import React, { useEffect, useState } from 'react'
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
  IconTrendingUp,
  IconTrendingDown,
  IconChartBar,
  IconMessage2,
  IconMessageCircle2,
  IconUsers,
  IconMinus,
  IconCalendar,
} from '@tabler/icons-react'
import { getWeeklyTrends } from '../../pages/api/UIUC-api/getWeeklyTrends'
import ModelUsageChart from './ModelUsageChart'
import { getModelUsageCounts } from '../../pages/api/UIUC-api/getModelUsageCounts'
import { useTranslation } from 'next-i18next'

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

const createShowToastOnFileDeleted = (t: (key: string) => string) => (theme: MantineTheme, was_error = false) => {
  return notifications.show({
      id: 'file-deleted-from-materials',
      withCloseButton: true,
      onClose: () => console.log('unmounted'),
      onOpen: () => console.log('mounted'),
      autoClose: 5000,
      // position="top-center",
      title: was_error ? t('alerts.error_deleting_file') : t('alerts.deleting_file'),
      message: was_error
        ? t('alerts.error_deleting_file_message')
        : t('alerts.file_deleting_bg'),
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
  });
};

export const createShowToastOnUpdate = (t: (key: string) => string) => (
  theme: MantineTheme,
  was_error = false,
  isDelete = false,
  message?: string,
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
        {t('alerts.check_docs')}{' '}
        <Link
          href={
            'https://docs.uiuc.chat/features/bulk-export-documents-or-conversation-history'
          }
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'underline', color: 'lightpurple' }}
        >
          {t('alerts.our_docs')}
        </Link>{' '}
        {t('alerts.process_data')}
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

const MakeQueryAnalysisPage = ({ course_name }: { course_name: string }) => {
  const { t } = useTranslation('common')
  const { classes, theme } = useStyles()
  const auth = useAuth()
  const showToastOnFileDeleted = createShowToastOnFileDeleted(t)
  const showToastOnUpdate = createShowToastOnUpdate(t)
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

        const response = await getConversationStats(
          course_name,
          from_date,
          to_date,
        )
        if (response.status === 200) {
          setFilteredConversationStats(response.data)
          setTotalCount(response.data.total_count || 0)
          setHasConversationData(Object.keys(response.data.per_day).length > 0)
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
        const response = await getConversationStats(course_name)
        if (response.status === 200) {
          setConversationStats(response.data)
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
        const response = await getProjectStats(course_name)

        if (response.status === 200) {
          const mappedData = {
            total_conversations: response.data.total_conversations,
            total_messages: response.data.total_messages,
            total_users: response.data.unique_users,
            avg_conversations_per_user:
              response.data.avg_conversations_per_user,
            avg_messages_per_user: response.data.avg_messages_per_user,
            avg_messages_per_conversation:
              response.data.avg_messages_per_conversation,
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
        const response = await getWeeklyTrends(course_name)
        if (response.status === 200) {
          setWeeklyTrends(response.data)
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
        const response = await getModelUsageCounts(course_name)
        if (response.status === 200) {
          setModelUsageData(response.data)
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
      <Navbar course_name={course_name} />

      <Head>
        <title>{course_name}</title>
        <meta
          name="description"
          content={t('analysis.metaDescription', 'The AI teaching assistant built for students at UIUC.') || 'The AI teaching assistant built for students at UIUC.'}
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
                  {t('analysis.usageOverview', 'Usage Overview')}
                </Title>
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
                    {t('analysis.downloadConversationHistory', 'Download Conversation History')}
                  </span>
                  <span className="sm:hidden">{t('analysis.downloadHistory', 'Download History')}</span>
                </Button>
              </div>

              <Divider className="w-full" color="gray.4" size="sm" />

              {/* Project Analytics Dashboard - Using all-time stats */}
              <div className="my-6 w-[95%] rounded-xl bg-[#1a1b30] p-6 shadow-lg shadow-purple-900/20">
                <div className="mb-6">
                  <Title
                    order={4}
                    className={`${montserrat_heading.variable} font-montserratHeading text-white`}
                  >
                    {t('analysis.projectAnalytics', 'Project Analytics')}
                  </Title>
                  <Text size="sm" color="dimmed" mt={2}>
                    {t('analysis.projectAnalyticsDesc', 'Overview of project engagement and usage statistics')}
                  </Text>
                </div>

                {/* Main Stats Grid with Integrated Weekly Trends */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {/* Conversations Card */}
                  <div className="rounded-lg bg-[#232438] p-4 shadow-md transition-all duration-200 hover:shadow-lg hover:shadow-purple-900/30">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <Text size="sm" color="dimmed" weight={500} mb={1}>
                          {t('analysis.totalConversations', 'Total Conversations')}
                        </Text>
                        <Text size="xs" color="dimmed" opacity={0.7}>
                          {t('analysis.allTimeChatSessions', 'All-time chat sessions')}
                        </Text>
                      </div>
                      <div className="rounded-full bg-purple-400/10 p-2">
                        <IconMessageCircle2
                          size={24}
                          className="text-purple-400"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center gap-3">
                        <Text
                          size="xl"
                          weight={700}
                          className="text-purple-400"
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
                              className={`flex items-center gap-2 rounded-md px-2 py-1 ${
                                trend.percentage_change > 0
                                  ? 'bg-green-400/10'
                                  : trend.percentage_change < 0
                                    ? 'bg-red-400/10'
                                    : 'bg-gray-400/10'
                              }`}
                            >
                              {trend.percentage_change > 0 ? (
                                <IconTrendingUp
                                  size={18}
                                  className="text-green-400"
                                />
                              ) : trend.percentage_change < 0 ? (
                                <IconTrendingDown
                                  size={18}
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
                  <div className="rounded-lg bg-[#232438] p-4 shadow-md transition-all duration-200 hover:shadow-lg hover:shadow-purple-900/30">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <Text size="sm" color="dimmed" weight={500} mb={1}>
                          {t('analysis.totalUsers', 'Total Users')}
                        </Text>
                        <Text size="xs" color="dimmed" opacity={0.7}>
                          {t('analysis.allTimeUniqueParticipants', 'All-time unique participants')}
                        </Text>
                      </div>
                      <div className="rounded-full bg-purple-400/10 p-2">
                        <IconUsers size={24} className="text-purple-400" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center gap-3">
                        <Text
                          size="xl"
                          weight={700}
                          className="text-purple-400"
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
                              className={`flex items-center gap-2 rounded-md px-2 py-1 ${
                                trend.percentage_change > 0
                                  ? 'bg-green-400/10'
                                  : trend.percentage_change < 0
                                    ? 'bg-red-400/10'
                                    : 'bg-gray-400/10'
                              }`}
                            >
                              {trend.percentage_change > 0 ? (
                                <IconTrendingUp
                                  size={18}
                                  className="text-green-400"
                                />
                              ) : trend.percentage_change < 0 ? (
                                <IconTrendingDown
                                  size={18}
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
                  <div className="rounded-lg bg-[#232438] p-4 shadow-md transition-all duration-200 hover:shadow-lg hover:shadow-purple-900/30">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <Text size="sm" color="dimmed" weight={500} mb={1}>
                          {t('analysis.messages', 'Messages')}
                        </Text>
                        <Text size="xs" color="dimmed" opacity={0.7}>
                          {t('analysis.totalExchanges', 'Total exchanges')}
                        </Text>
                      </div>
                      <div className="rounded-full bg-purple-400/10 p-2">
                        <IconMessage2 size={24} className="text-purple-400" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center gap-3">
                        <Text
                          size="xl"
                          weight={700}
                          className="text-purple-400"
                        >
                          {courseStats?.total_messages?.toLocaleString() || '0'}
                        </Text>
                        {(() => {
                          const trend = weeklyTrends.find(
                            (t) => t.metric_name === 'Total Messages',
                          )
                          if (!trend) return null

                          return (
                            <div
                              className={`flex items-center gap-2 rounded-md px-2 py-1 ${
                                trend.percentage_change > 0
                                  ? 'bg-green-400/10'
                                  : trend.percentage_change < 0
                                    ? 'bg-red-400/10'
                                    : 'bg-gray-400/10'
                              }`}
                            >
                              {trend.percentage_change > 0 ? (
                                <IconTrendingUp
                                  size={18}
                                  className="text-green-400"
                                />
                              ) : trend.percentage_change < 0 ? (
                                <IconTrendingDown
                                  size={18}
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
                        {t('analysis.userEngagementMetrics', 'User Engagement Metrics')}
                      </Text>
                      <Text size="sm" color="dimmed" mt={1}>
                        {t('analysis.userEngagementDesc', 'Detailed breakdown of user interaction patterns')}
                      </Text>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {/* Average Conversations per User */}
                    <div className="rounded-lg bg-[#232438] p-4 shadow-md transition-all duration-200 hover:shadow-lg hover:shadow-purple-900/30">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <Text size="sm" color="dimmed" weight={500} mb={1}>
                            {t('analysis.conversationsPerUser', 'Conversations per User')}
                          </Text>
                          <Text size="xs" color="dimmed" opacity={0.7}>
                            {t('analysis.avgEngagementFrequency', 'Average engagement frequency')}
                          </Text>
                        </div>
                        <div className="rounded-full bg-purple-400/10 p-2">
                          <IconMessageCircle2
                            size={24}
                            className="text-purple-400"
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex items-baseline gap-2">
                        <Text
                          size="xl"
                          weight={700}
                          className="text-purple-400"
                        >
                          {courseStats?.avg_conversations_per_user?.toFixed(
                            1,
                          ) || '0'}
                        </Text>
                        <Text size="sm" color="dimmed">
                          {t('analysis.conversationsPerUserUnit', 'conversations / user')}
                        </Text>
                      </div>
                    </div>

                    {/* Average Messages per User */}
                    <div className="rounded-lg bg-[#232438] p-4 shadow-md transition-all duration-200 hover:shadow-lg hover:shadow-purple-900/30">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <Text size="sm" color="dimmed" weight={500} mb={1}>
                            {t('analysis.messagesPerUser', 'Messages per User')}
                          </Text>
                          <Text size="xs" color="dimmed" opacity={0.7}>
                            {t('analysis.avgInteractionDepth', 'Average interaction depth')}
                          </Text>
                        </div>
                        <div className="rounded-full bg-purple-400/10 p-2">
                          <IconMessage2 size={24} className="text-purple-400" />
                        </div>
                      </div>
                      <div className="mt-4 flex items-baseline gap-2">
                        <Text
                          size="xl"
                          weight={700}
                          className="text-purple-400"
                        >
                          {courseStats?.avg_messages_per_user?.toFixed(1) ||
                            '0'}
                        </Text>
                        <Text size="sm" color="dimmed">
                          {t('analysis.messagesPerUserUnit', 'messages / user')}
                        </Text>
                      </div>
                    </div>

                    {/* Average Messages per Conversation */}
                    <div className="rounded-lg bg-[#232438] p-4 shadow-md transition-all duration-200 hover:shadow-lg hover:shadow-purple-900/30">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <Text size="sm" color="dimmed" weight={500} mb={1}>
                            {t('analysis.messagesPerConversation', 'Messages per Conversation')}
                          </Text>
                          <Text size="xs" color="dimmed" opacity={0.7}>
                            {t('analysis.avgConversationLength', 'Average conversation length')}
                          </Text>
                        </div>
                        <div className="rounded-full bg-purple-400/10 p-2">
                          <IconChartBar size={24} className="text-purple-400" />
                        </div>
                      </div>
                      <div className="mt-4 flex items-baseline gap-2">
                        <Text
                          size="xl"
                          weight={700}
                          className="text-purple-400"
                        >
                          {courseStats?.avg_messages_per_conversation?.toFixed(
                            1,
                          ) || '0'}
                        </Text>
                        <Text size="sm" color="dimmed">
                          {t('analysis.messagesPerConversationUnit', 'messages / conversation')}
                        </Text>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Section - Using filtered stats */}
              <div className="grid w-[95%] grid-cols-1 gap-6 pb-10 lg:grid-cols-2">
                {/* Date Range Selector - Always visible */}
                <div className="rounded-xl bg-[#1a1b30] p-6 shadow-lg shadow-purple-900/20 lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Title order={4} className="text-white">
                        {t('analysis.conversationVisualizations', 'Conversation Visualizations')}
                      </Title>
                      <Text size="sm" color="dimmed" mt={1}>
                        {t('analysis.selectTimeRange', 'Select a time range to filter the visualizations below')}
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
                          { value: 'all', label: t('analysis.allTime', 'All Time') || 'All Time' },
                          { value: 'last_week', label: t('analysis.lastWeek', 'Last Week') || 'Last Week' },
                          { value: 'last_month', label: t('analysis.lastMonth', 'Last Month') || 'Last Month' },
                          { value: 'last_year', label: t('analysis.lastYear', 'Last Year') || 'Last Year' },
                          { value: 'custom', label: t('analysis.customRange', 'Custom Range') || 'Custom Range' },
                        ]}
                        styles={(theme: MantineTheme) => ({
                          input: {
                            backgroundColor: '#232438',
                            borderColor: theme.colors.grape[8],
                            color: theme.white,
                            '&:hover': {
                              borderColor: theme.colors.grape[7],
                            },
                          },
                          item: {
                            backgroundColor: '#232438',
                            color: theme.white,
                            '&:hover': {
                              backgroundColor: theme.colors.grape[8],
                            },
                          },
                          dropdown: {
                            backgroundColor: '#232438',
                            borderColor: theme.colors.grape[8],
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
                          placeholder="Pick date range"
                          styles={(theme: MantineTheme) => ({
                            input: {
                              backgroundColor: '#232438',
                              borderColor: theme.colors.grape[8],
                              color: theme.white,
                              '&:selected': {
                                backgroundColor: theme.colors.grape[8],
                                borderColor: theme.colors.grape[8],
                              },
                              '&:hover': {
                                borderColor: theme.colors.grape[7],
                              },
                              '&:focus': {
                                borderColor: theme.colors.grape[8],
                              },
                            },
                            calendarHeader: {
                              borderColor: theme.colors.grape[8],
                              color: theme.white,
                            },
                            calendarHeaderControl: {
                              color: theme.white,
                              '&:hover': {
                                backgroundColor: theme.colors.grape[8],
                              },
                            },
                            monthPickerControl: {
                              color: theme.white,
                              '&:hover': {
                                backgroundColor: theme.colors.grape[8],
                              },
                            },
                            yearPickerControl: {
                              color: theme.white,
                              '&:hover': {
                                backgroundColor: theme.colors.grape[8],
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
                          {t('analysis.conversationsInSelectedRange', { count: totalCount, defaultValue: '{{count}} conversations in selected range' })}
                        </Text>
                      )}
                    </div>
                  </div>
                </div>

                {!hasConversationData ? (
                  <div className="rounded-xl bg-[#1a1b30] p-6 text-center shadow-lg shadow-purple-900/20 lg:col-span-2">
                    <Title
                      order={4}
                      className={`${montserrat_heading.variable} font-montserratHeading`}
                    >
                      {t('analysis.noConversationData', 'No conversation data available for selected time range')}
                    </Title>
                    <Text size="lg" color="dimmed" mt="md">
                      {t('analysis.tryDifferentTimeRange', 'Try selecting a different time range to view the visualizations')}
                    </Text>
                  </div>
                ) : (
                  <>
                    {/* Model Usage Chart */}
                    <div className="rounded-xl bg-[#1a1b30] p-6 shadow-lg shadow-purple-900/20">
                      <Title
                        order={4}
                        mb="md"
                        align="left"
                        className="text-white"
                      >
                        {t('analysis.modelUsageDistribution', 'Model Usage Distribution')}
                      </Title>
                      <Text size="sm" color="dimmed" mb="xl">
                        {t('analysis.aiModelsUsed', 'Distribution of AI models used across all conversations')}
                      </Text>
                      <ModelUsageChart
                        data={modelUsageData}
                        isLoading={modelUsageLoading}
                        error={modelUsageError}
                      />
                    </div>

                    {/* Conversations Per Day Chart */}
                    <div className="rounded-xl bg-[#1a1b30] p-6 shadow-lg shadow-purple-900/20">
                      <Title
                        order={4}
                        mb="md"
                        align="left"
                        className="text-white"
                      >
                        {t('analysis.conversationsPerDay', 'Conversations Per Day')}
                      </Title>
                      <Text size="sm" color="dimmed" mb="xl">
                        {t('analysis.showsTotalConversations', 'Shows the total number of conversations that occurred on each calendar day')}
                      </Text>
                      <ConversationsPerDayChart
                        data={filteredConversationStats?.per_day}
                        isLoading={filteredStatsLoading}
                        error={filteredStatsError}
                      />
                    </div>

                    {/* Combined Hour/Weekday Chart */}
                    <div className="rounded-xl bg-[#1a1b30] p-6 shadow-lg shadow-purple-900/20">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <Title order={4} className="text-white">
                            {t('analysis.aggregatedConversationBreakdown', 'Aggregated Conversation Breakdown')}
                          </Title>
                          <Text size="sm" color="dimmed" mt={1}>
                            {t('analysis.viewConversationPatterns', 'View conversation patterns by hour of day or day of week')}
                          </Text>
                        </div>
                        <Select
                          value={view}
                          onChange={(value) => setView(value || 'hour')}
                          data={[
                            { value: 'hour', label: t('analysis.byHour', 'By Hour') || 'By Hour' },
                            { value: 'weekday', label: t('analysis.byDayOfWeek', 'By Day of Week') || 'By Day of Week' },
                          ]}
                          className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                          styles={(theme) => ({
                            input: {
                              backgroundColor: '#232438',
                              borderColor: theme.colors.grape[8],
                              color: theme.white,
                              '&:hover': {
                                borderColor: theme.colors.grape[7],
                              },
                            },
                            item: {
                              backgroundColor: '#232438',
                              color: theme.white,
                              '&:hover': {
                                backgroundColor: theme.colors.grape[8],
                              },
                            },
                            dropdown: {
                              backgroundColor: '#232438',
                              borderColor: theme.colors.grape[8],
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
                    <div className="rounded-xl bg-[#1a1b30] p-6 shadow-lg shadow-purple-900/20">
                      <Title
                        order={4}
                        mb="md"
                        align="left"
                        className="text-white"
                      >
                        {t('analysis.conversationsPerDayAndHour', 'Conversations Per Day and Hour')}
                      </Title>
                      <Text size="sm" color="dimmed" mb="xl">
                        {t('analysis.heatmapConversationDensity', 'A heatmap showing conversation density across both days and hours')}
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

        <NomicDocumentMap course_name={course_name as string} />
        <GlobalFooter />
      </main>
    </>
  )
}

import {
  IconCheck,
  IconCloudDownload,
} from '@tabler/icons-react'

import { CannotEditCourse } from './CannotEditCourse'
import { type CourseMetadata } from '~/types/courseMetadata'
import { notifications } from '@mantine/notifications'
import GlobalFooter from './GlobalFooter'
import Navbar from './navbars/Navbar'
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

export default MakeQueryAnalysisPage
