import {
  IconArrowRight,
  IconChartBar,
  IconCode,
  IconCopy,
  IconDatabase,
  IconMessage2,
  IconMessageCircle2,
  IconPalette,
  IconUsers,
} from '@tabler/icons-react'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from 'react-oidc-context'
import { Brain, ReportAnalytics } from 'tabler-icons-react'
import { useProjectStats } from '~/hooks/useProjectStats'
import { type CourseMetadata } from '~/types/courseMetadata'
import { callSetCourseMetadata, fetchPresignedUrl } from '~/utils/apiUtils'
import { GRID_CONFIGS, useResponsiveGrid } from '~/utils/responsiveGrid'
import SettingsLayout, {
  getInitialCollapsedState,
} from '../Layout/SettingsLayout'
import GlobalFooter from './GlobalFooter'
import { CannotEditCourse } from './CannotEditCourse'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../shadcn/ui/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle } from '../shadcn/ui/card'
import CustomSwitch from '../Switches/CustomSwitch'
import { LargeDropzone } from './LargeDropzone'
import { type FileUpload } from './UploadNotification'

interface DashboardContentProps {
  course_name: string
  metadata: CourseMetadata
  current_email: string
}

const STAT_CARDS = [
  {
    key: 'total_conversations' as const,
    title: 'Total Conversations',
    subtitle: 'All time chat sessions',
    icon: (
      <IconMessageCircle2 size={18} className="text-[--foreground-faded]" />
    ),
  },
  {
    key: 'total_users' as const,
    title: 'Total Users',
    subtitle: 'All time unique participants',
    icon: <IconUsers size={18} className="text-[--foreground-faded]" />,
  },
  {
    key: 'total_messages' as const,
    title: 'Messages',
    subtitle: 'Total messages',
    icon: <IconMessage2 size={18} className="text-[--foreground-faded]" />,
  },
  {
    key: 'avg_conversations_per_user' as const,
    title: 'Conversations per User',
    subtitle: 'Average engagement frequency',
    icon: (
      <IconMessageCircle2 size={18} className="text-[--foreground-faded]" />
    ),
  },
  {
    key: 'avg_messages_per_user' as const,
    title: 'Messages per User',
    subtitle: 'Average interaction depth',
    icon: <IconChartBar size={18} className="text-[--foreground-faded]" />,
  },
  {
    key: 'avg_messages_per_conversation' as const,
    title: 'Messages / Conversation',
    subtitle: 'Average interaction depth',
    icon: <IconMessage2 size={18} className="text-[--foreground-faded]" />,
  },
]

const NAV_CARDS = [
  {
    title: 'Project Data',
    description: 'Choose what your bot knows.',
    detail: 'Upload your own documents and connect platforms to your Bot.',
    icon: <IconDatabase size={22} />,
    href: 'dashboard#document-upload',
    hasExplore: true,
  },
  {
    title: 'Project Identity',
    description: 'Choose how your bot appears in the world.',
    detail: 'Set name, description, sample questions, and more.',
    icon: <IconPalette size={22} />,
    href: 'dashboard#branding',
  },
  {
    title: 'User Access',
    description: 'Choose who gets to use your project.',
    detail: 'Control access, ownership, and privacy settings.',
    icon: <IconUsers size={22} />,
    href: 'dashboard#access-settings',
  },
  {
    title: 'AI Models (LLMs)',
    description: 'Choose which platforms your project has access to and more.',
    detail: '',
    icon: <Brain size={22} />,
    href: 'llms',
  },
  {
    title: 'Usage Analysis',
    description: 'View analytics and data insights.',
    detail: '',
    icon: <ReportAnalytics size={22} />,
    href: 'analysis',
  },
  {
    title: 'API',
    description: 'Configure API.',
    detail: '',
    icon: <IconCode size={22} />,
    href: 'api',
  },
]

function StatCard({
  title,
  value,
  subtitle,
  icon,
  isLoading,
}: {
  title: string
  value: number | undefined
  subtitle: string
  icon: React.ReactElement
  isLoading: boolean
}) {
  const formatted =
    value !== undefined
      ? Number.isInteger(value)
        ? value.toLocaleString()
        : value.toFixed(1)
      : '—'

  return (
    <Card className="border-[--dashboard-border] bg-[--background]">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <p
            className={`text-sm text-[--foreground-faded] ${montserrat_paragraph.variable} font-montserratParagraph`}
          >
            {title}
          </p>
          {icon}
        </div>
        <div className="mt-1">
          {isLoading ? (
            <div className="h-8 w-16 animate-pulse rounded bg-[--dashboard-border]" />
          ) : (
            <p
              className={`text-2xl font-bold text-[--foreground] ${montserrat_heading.variable} font-montserratHeading`}
            >
              {formatted}
            </p>
          )}
        </div>
        <p
          className={`mt-1 text-xs text-[--foreground-faded] ${montserrat_paragraph.variable} font-montserratParagraph`}
        >
          {subtitle}
        </p>
      </CardContent>
    </Card>
  )
}

function NavCard({
  title,
  description,
  detail,
  icon,
  href,
  hasExplore,
  courseName,
}: {
  title: string
  description: string
  detail: string
  icon: React.ReactElement
  href: string
  hasExplore?: boolean
  courseName: string
}) {
  const fullHref = `/${courseName}/${href}`
  return (
    <Link href={fullHref} className="no-underline">
      <Card className="h-full cursor-pointer border-[--dashboard-border] bg-[--background] transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[--foreground]">
              {icon}
              <CardTitle
                className={`text-base font-semibold ${montserrat_heading.variable} font-montserratHeading`}
              >
                {title}
              </CardTitle>
            </div>
            {hasExplore && (
              <span className="flex items-center gap-1 text-sm text-[--dashboard-button]">
                Explore <IconArrowRight size={14} />
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p
            className={`text-sm text-[--foreground-faded] ${montserrat_paragraph.variable} font-montserratParagraph`}
          >
            {description}
          </p>
          {detail && (
            <p
              className={`mt-1 text-sm text-[--foreground-faded] ${montserrat_paragraph.variable} font-montserratParagraph`}
            >
              {detail}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

export default function DashboardContent({
  course_name,
  metadata,
  current_email,
}: DashboardContentProps) {
  const router = useRouter()
  const auth = useAuth()
  const [bannerUrl, setBannerUrl] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    getInitialCollapsedState,
  )
  const [guidedLearning, setGuidedLearning] = useState(
    metadata.guidedLearning ?? false,
  )
  const [documentsOnly, setDocumentsOnly] = useState(
    metadata.documentsOnly ?? false,
  )
  const [uploadFiles, setUploadFiles] = useState<FileUpload[]>([])

  const { courseStats, isLoading: statsLoading } = useProjectStats(course_name)

  const statsGridClasses = useResponsiveGrid(
    GRID_CONFIGS.STATS_CARDS,
    sidebarCollapsed,
  )
  const cardsGridClasses = useResponsiveGrid(
    GRID_CONFIGS.STATS_CARDS,
    sidebarCollapsed,
  )

  useEffect(() => {
    const fetchBanner = async () => {
      if (metadata?.banner_image_s3 && metadata.banner_image_s3 !== '') {
        try {
          const url = await fetchPresignedUrl(
            metadata.banner_image_s3,
            course_name,
          )
          setBannerUrl(url as string)
        } catch (error) {
          console.error('Error fetching banner image:', error)
        }
      }
    }
    fetchBanner()
  }, [metadata, course_name])

  const handleToggleGuidedLearning = useCallback(
    async (checked: boolean) => {
      setGuidedLearning(checked)
      const success = await callSetCourseMetadata(course_name, {
        ...metadata,
        guidedLearning: checked,
      })
      if (!success) setGuidedLearning(!checked)
    },
    [course_name, metadata],
  )

  const handleToggleDocumentsOnly = useCallback(
    async (checked: boolean) => {
      setDocumentsOnly(checked)
      const success = await callSetCourseMetadata(course_name, {
        ...metadata,
        documentsOnly: checked,
      })
      if (!success) setDocumentsOnly(!checked)
    },
    [course_name, metadata],
  )

  if (
    metadata &&
    current_email !== metadata.course_owner &&
    metadata.course_admins.indexOf(current_email) === -1
  ) {
    router.replace(`/${course_name}/not_authorized`)
    return <CannotEditCourse course_name={course_name} />
  }

  return (
    <SettingsLayout
      course_name={course_name}
      bannerUrl={bannerUrl}
      sidebarCollapsed={sidebarCollapsed}
      setSidebarCollapsed={setSidebarCollapsed}
    >
      <Head>
        <title>{course_name} — Dashboard — Illinois Chat</title>
        <meta
          name="description"
          content="The AI teaching assistant built for students at UIUC."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main
        id="main-content"
        tabIndex={-1}
        className="flex min-h-screen flex-col"
      >
        <h1 className="sr-only">{course_name} Dashboard</h1>

        <div className="w-full px-4 py-4 md:px-6 lg:px-8">
          {/* Breadcrumb */}
          <Breadcrumb
            className={`mb-4 ${montserrat_paragraph.variable} font-montserratParagraph`}
          >
            <BreadcrumbList className="text-sm font-normal text-[--foreground-faded]">
              <BreadcrumbItem>
                <BreadcrumbLink
                  href={`/${course_name}/dashboard`}
                  className="flex items-center gap-1.5 text-[--foreground-faded] no-underline"
                >
                  <IconCopy size={14} strokeWidth={1.5} />
                  Admin Settings
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-[--foreground]">
                  Dashboard
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Hero Section */}
          <section className="relative mb-8 overflow-hidden rounded-xl border border-[--dashboard-border]">
            <div
              className="h-36 bg-cover bg-center"
              style={{
                backgroundImage: bannerUrl
                  ? `url(${bannerUrl})`
                  : 'linear-gradient(135deg, var(--dashboard-button) 0%, var(--background-faded) 100%)',
              }}
            />
            <div className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[--illinois-orange] text-white">
                  <span
                    className={`text-2xl font-bold ${montserrat_heading.variable} font-montserratHeading`}
                  >
                    I
                  </span>
                </div>
                <div>
                  <h2
                    className={`text-xl font-bold text-[--foreground] ${montserrat_heading.variable} font-montserratHeading`}
                  >
                    {course_name}
                  </h2>
                  <p
                    className={`text-sm text-[--foreground-faded] ${montserrat_paragraph.variable} font-montserratParagraph`}
                  >
                    {metadata.project_description || 'Your chatbot project'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center">
                <CustomSwitch
                  label="Guided Learning"
                  tooltip="When enabled, the AI will guide students through learning rather than giving direct answers."
                  checked={guidedLearning}
                  onChange={handleToggleGuidedLearning}
                />
                <div className="mx-4 hidden h-8 w-px bg-[--dashboard-border] md:block" />
                <CustomSwitch
                  label="Document-Based References Only"
                  tooltip="When enabled, the AI will only use uploaded documents as references, not its general knowledge."
                  checked={documentsOnly}
                  onChange={handleToggleDocumentsOnly}
                />
              </div>
            </div>
          </section>

          {/* Usage Analysis + Quick Upload */}
          <section className="mb-8">
            <div className="flex flex-col gap-6 lg:flex-row">
              {/* Stats Grid */}
              <div className="flex-1">
                <h3
                  className={`mb-4 text-lg font-semibold text-[--foreground] ${montserrat_heading.variable} font-montserratHeading`}
                >
                  Usage Analysis
                </h3>
                <div className={`grid gap-4 ${statsGridClasses}`}>
                  {STAT_CARDS.map((card) => (
                    <StatCard
                      key={card.key}
                      title={card.title}
                      value={courseStats ? courseStats[card.key] : undefined}
                      subtitle={card.subtitle}
                      icon={card.icon}
                      isLoading={statsLoading}
                    />
                  ))}
                </div>
              </div>

              {/* Quick Upload */}
              <div
                id="document-upload"
                className="w-full shrink-0 lg:w-80 xl:w-96"
              >
                <h3
                  className={`mb-4 text-lg font-semibold text-[--foreground] ${montserrat_heading.variable} font-montserratHeading`}
                >
                  Project Data Quick-add
                </h3>
                <LargeDropzone
                  courseName={course_name}
                  current_user_email={current_email}
                  redirect_to_gpt_4={false}
                  isDisabled={false}
                  courseMetadata={metadata}
                  is_new_course={false}
                  setUploadFiles={setUploadFiles}
                  auth={auth}
                />
              </div>
            </div>
          </section>

          {/* Navigation Cards */}
          <section className="mb-8">
            <div className={`grid gap-4 ${cardsGridClasses}`}>
              {NAV_CARDS.map((card) => (
                <NavCard
                  key={card.title}
                  title={card.title}
                  description={card.description}
                  detail={card.detail}
                  icon={card.icon}
                  href={card.href}
                  hasExplore={card.hasExplore}
                  courseName={course_name}
                />
              ))}
            </div>
          </section>
        </div>

        <GlobalFooter />
      </main>
    </SettingsLayout>
  )
}
