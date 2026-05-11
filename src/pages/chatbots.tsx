import { Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo } from 'react'
import { useAuth } from 'react-oidc-context'
import { Button } from '~/components/shadcn/ui/button'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'
import { ChatbotsGlobalNav } from '~/components/UIUC-Components/chatbots-hub/ChatbotsGlobalNav'
import { ChatbotsHeroSection } from '~/components/UIUC-Components/chatbots-hub/ChatbotsHeroSection'
import { ChatbotsSection } from '~/components/UIUC-Components/chatbots-hub/ChatbotsSection'
import {
  type ChatbotSectionData,
  PROJECT_TYPE_TO_SECTION,
  DEFAULT_ACCESSIBLE_SECTION,
  ACCESSIBLE_SECTION_ORDER,
} from '~/components/UIUC-Components/chatbots-hub/chatbots.types'
import { PermissionGate } from '~/components/UIUC-Components/PermissionGate'
import {
  useFetchAllCourseMetadata,
  type CourseWithMetadata,
} from '~/hooks/queries/useFetchAllCourseMetadata'
import { useFetchAccessibleChatbots } from '~/hooks/queries/useFetchAccessibleChatbots'

function transformToCardData(
  course: CourseWithMetadata,
  currentUserEmail: string | undefined,
) {
  const isOwner = course.metadata.course_owner === currentUserEmail
  const otherAdmins = (course.metadata.course_admins || []).filter(
    (a) =>
      a !== course.metadata.course_owner &&
      !(isOwner && a === currentUserEmail),
  )

  return {
    course_name: course.course_name,
    title: course.course_name,
    description: course.metadata.project_description || '',
    owner: isOwner ? 'You' : course.metadata.course_owner,
    collaboratorCount: otherAdmins.length,
    userRole: isOwner ? ('owner' as const) : ('member' as const),
    accessLevel: course.metadata.is_private
      ? ('private' as const)
      : ('public' as const),
    bannerImageS3: course.metadata.banner_image_s3,
    metadata: course.metadata,
  }
}

const ChatbotsHubPage = () => {
  const router = useRouter()
  const auth = useAuth()
  const { course_name } = router.query
  const currentUserEmail = auth.user?.profile.email as string | undefined

  const { data: courses, isLoading: isCoursesLoading } =
    useFetchAllCourseMetadata({
      enabled: auth.isAuthenticated,
    })

  const { data: accessibleChatbots, isLoading: isAccessibleLoading } =
    useFetchAccessibleChatbots({
      enabled: auth.isAuthenticated,
    })

  // Set page-specific dark background on body (darker than global --illinois-blue)
  useEffect(() => {
    const updateBg = () => {
      const isDark = document.documentElement.classList.contains('dark')
      document.body.style.backgroundColor = isDark ? '#081735' : ''
    }
    updateBg()
    const obs = new MutationObserver(updateBg)
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => {
      obs.disconnect()
      document.body.style.backgroundColor = ''
    }
  }, [])

  const sections = useMemo(() => {
    const result: ChatbotSectionData[] = []

    if (courses) {
      const myCourses = courses.filter(
        (c) => c.metadata.course_owner === currentUserEmail,
      )
      const sharedCourses = courses.filter(
        (c) => c.metadata.course_owner !== currentUserEmail,
      )

      if (myCourses.length > 0) {
        result.push({
          title: 'My Chatbots',
          cards: myCourses.map((c) => transformToCardData(c, currentUserEmail)),
        })
      }

      if (sharedCourses.length > 0) {
        result.push({
          title: 'Shared With Me',
          cards: sharedCourses.map((c) =>
            transformToCardData(c, currentUserEmail),
          ),
        })
      }
    }

    // Accessible chatbots grouped by project type into Figma sections
    if (accessibleChatbots && accessibleChatbots.length > 0) {
      const grouped = new Map<string, ChatbotSectionData>()

      for (const bot of accessibleChatbots) {
        const sectionTitle =
          PROJECT_TYPE_TO_SECTION[bot.projectType] ?? DEFAULT_ACCESSIBLE_SECTION

        let section = grouped.get(sectionTitle)
        if (!section) {
          section = { title: sectionTitle, cards: [] }
          grouped.set(sectionTitle, section)
        }

        section.cards.push({
          course_name: bot.course_name,
          title: bot.title,
          description: bot.description,
          owner: bot.owner,
          collaboratorCount: bot.collaboratorCount,
          projectType: bot.projectType,
          accessLevel: bot.accessLevel,
          organization: bot.organization,
          bannerImageS3: bot.bannerImageS3,
          metadata: bot.metadata,
          knowledgeSources: bot.knowledgeSources,
        })
      }

      // Enforce Figma section ordering
      for (const title of ACCESSIBLE_SECTION_ORDER) {
        const section = grouped.get(title)
        if (section) result.push(section)
      }
    }

    return result
  }, [courses, accessibleChatbots, currentUserEmail])

  if (auth.isLoading) {
    return (
      <MainPageBackground>
        <LoadingSpinner />
      </MainPageBackground>
    )
  }

  if (!auth.isAuthenticated) {
    return (
      <PermissionGate
        course_name={course_name ? (course_name as string) : 'new'}
      />
    )
  }

  return (
    <main className="min-h-screen bg-white dark:bg-[#081735]">
      <ChatbotsGlobalNav />
      <div className="mx-auto max-w-[1680px] pt-[72px]">
        <ChatbotsHeroSection />
        <div className="pb-12 dark:bg-[#081735]">
          {isCoursesLoading || isAccessibleLoading ? (
            <div className="flex justify-center py-20">
              <LoadingSpinner />
            </div>
          ) : sections.length > 0 ? (
            sections.map((section) => (
              <ChatbotsSection key={section.title} {...section} />
            ))
          ) : (
            <div className="flex flex-col items-center gap-6 px-4 py-20 text-center">
              <p className="text-lg text-[--illinois-storm-dark] dark:text-[#c8d2e3]">
                You don&apos;t have any chatbots yet.
              </p>
              <Link href="/new">
                <Button className="h-10 gap-2 bg-[--illinois-blue] px-8 text-sm text-white hover:bg-[--foreground-dark] dark:bg-white dark:text-[--illinois-blue] dark:hover:bg-[#e5e7eb]">
                  <Sparkles className="h-4 w-4" />
                  Create Your First Chatbot
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default ChatbotsHubPage
