import { Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from 'react-oidc-context'
import { Button } from '~/components/shadcn/ui/button'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'
import { ChatbotsGlobalNav } from '~/components/UIUC-Components/chatbots-hub/ChatbotsGlobalNav'
import { ChatbotsHeroSection } from '~/components/UIUC-Components/chatbots-hub/ChatbotsHeroSection'
import { ChatbotsSearchBar } from '~/components/UIUC-Components/chatbots-hub/ChatbotsSearchBar'
import { ChatbotsFilterPanel } from '~/components/UIUC-Components/chatbots-hub/ChatbotsFilterPanel'
import { ChatbotsSearchResults } from '~/components/UIUC-Components/chatbots-hub/ChatbotsSearchResults'
import { ChatbotsSection } from '~/components/UIUC-Components/chatbots-hub/ChatbotsSection'
import {
  type ChatbotSectionData,
  type SearchChatbotsParams,
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
import { useSearchChatbots } from '~/hooks/queries/useSearchChatbots'

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
      ? course.metadata.allow_logged_in_users
        ? ('unlisted' as const)
        : ('private' as const)
      : ('public' as const),
    bannerImageS3: course.metadata.banner_image_s3,
    metadata: course.metadata,
  }
}

function hasActiveSearch(params: SearchChatbotsParams): boolean {
  return Boolean(
    params.q || params.category || params.privacy || params.my_bots,
  )
}

const ChatbotsHubPage = () => {
  const router = useRouter()
  const auth = useAuth()
  const { course_name } = router.query
  const currentUserEmail = auth.user?.profile.email as string | undefined

  const [searchParams, setSearchParams] = useState<SearchChatbotsParams>({})

  const isSearchActive = hasActiveSearch(searchParams)

  const handleParamsChange = useCallback((next: SearchChatbotsParams) => {
    setSearchParams(next)
  }, [])

  // Server-side search (only fires when a search/filter is active)
  const {
    data: searchData,
    isLoading: isSearchLoading,
    isError: isSearchError,
  } = useSearchChatbots(searchParams, {
    enabled: auth.isAuthenticated && isSearchActive,
  })

  // Section-based data (default view when no search is active)
  const { data: courses, isLoading: isCoursesLoading } =
    useFetchAllCourseMetadata({
      enabled: auth.isAuthenticated && !isSearchActive,
    })

  const { data: accessibleChatbots, isLoading: isAccessibleLoading } =
    useFetchAccessibleChatbots({
      enabled: auth.isAuthenticated && !isSearchActive,
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
    if (isSearchActive) return []

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
        const projectType = bot.projectType as
          | keyof typeof PROJECT_TYPE_TO_SECTION
          | undefined
        const sectionTitle =
          (projectType && PROJECT_TYPE_TO_SECTION[projectType]) ??
          DEFAULT_ACCESSIBLE_SECTION

        let section = grouped.get(sectionTitle)
        if (!section) {
          section = { title: sectionTitle, cards: [] }
          grouped.set(sectionTitle, section)
        }

        section.cards.push(bot)
      }

      // Enforce Figma section ordering
      for (const title of ACCESSIBLE_SECTION_ORDER) {
        const section = grouped.get(title)
        if (section) result.push(section)
      }
    }

    return result
  }, [courses, accessibleChatbots, currentUserEmail, isSearchActive])

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

  const isSectionsLoading =
    !isSearchActive && (isCoursesLoading || isAccessibleLoading)

  return (
    <main className="min-h-screen bg-white dark:bg-[#081735]">
      <ChatbotsGlobalNav />
      <div className="mx-auto max-w-[1680px] pt-[72px]">
        <ChatbotsHeroSection />

        {/* Search & Filter Bar */}
        <div className="space-y-4 px-4 py-6 sm:px-8">
          <ChatbotsSearchBar
            params={searchParams}
            onParamsChange={handleParamsChange}
          />
          <ChatbotsFilterPanel
            params={searchParams}
            onParamsChange={handleParamsChange}
          />
        </div>

        <div className="pb-12 dark:bg-[#081735]">
          {isSearchActive ? (
            <div className="px-4 sm:px-8">
              <ChatbotsSearchResults
                results={searchData?.results ?? []}
                total={searchData?.total ?? 0}
                isLoading={isSearchLoading}
                isError={isSearchError}
              />
            </div>
          ) : isSectionsLoading ? (
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
