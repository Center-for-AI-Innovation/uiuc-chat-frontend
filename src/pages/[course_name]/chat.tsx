// export { default } from '~/pages/api/home'

import { useAuth } from 'react-oidc-context'
import { type NextPage } from 'next'
import React, { useEffect, useState } from 'react'
import Home from '../api/home/home'
import { useRouter } from 'next/router'

import { type CourseMetadata } from '~/types/courseMetadata'
import { get_user_permission } from '~/components/UIUC-Components/runAuthCheck'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import { montserrat_heading } from 'fonts'
import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'
import { fetchCourseMetadata } from '~/utils/apiUtils'
import { AuthComponent } from '~/components/UIUC-Components/AuthToEditCourse'
import { generateAnonymousUserId } from '~/utils/cryptoRandom'

const ChatPage: NextPage = () => {
  const auth = useAuth()
  const router = useRouter()
  const getCurrentPageName = () => {
    return router.query.course_name as string
  }
  const courseName = getCurrentPageName() as string
  const [currentEmail, setCurrentEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [courseMetadata, setCourseMetadata] = useState<CourseMetadata | null>(
    null,
  )
  const [isCourseMetadataLoading, setIsCourseMetadataLoading] = useState(true)
  const [urlGuidedLearning, setUrlGuidedLearning] = useState(false)
  const [urlDocumentsOnly, setUrlDocumentsOnly] = useState(false)
  const [urlSystemPromptOnly, setUrlSystemPromptOnly] = useState(false)
  const [documentCount, setDocumentCount] = useState<number | null>(null)
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const { course_name } = router.query

  // UseEffect to check URL parameters
  useEffect(() => {
    const fetchData = async () => {
      if (!router.isReady) return

      // Get URL parameters
      const urlParams = new URLSearchParams(window.location.search)
      const guidedLearning = urlParams.get('guidedLearning') === 'true'
      const documentsOnly = urlParams.get('documentsOnly') === 'true'
      const systemPromptOnly = urlParams.get('systemPromptOnly') === 'true'

      // Update the state with URL parameters
      setUrlGuidedLearning(guidedLearning)
      setUrlDocumentsOnly(documentsOnly)
      setUrlSystemPromptOnly(systemPromptOnly)

      setIsLoading(true)
      setIsCourseMetadataLoading(true)

      // Special case: Cropwizard redirect
      if (
        ['cropwizard', 'cropwizard-1.0', 'cropwizard-1'].includes(
          courseName.toLowerCase(),
        )
      ) {
        await router.push(`/cropwizard-1.5`)
      }

      // Fetch course metadata
      const metadataResponse = await fetch(
        `/api/UIUC-api/getCourseMetadata?course_name=${courseName}`,
      )
      const metadataData = await metadataResponse.json()

      // Log original course metadata settings without modifying them
      if (metadataData.course_metadata) {
        console.log('Course metadata settings:', {
          guidedLearning: metadataData.course_metadata.guidedLearning,
          documentsOnly: metadataData.course_metadata.documentsOnly,
          systemPromptOnly: metadataData.course_metadata.systemPromptOnly,
          system_prompt: metadataData.course_metadata.system_prompt,
        })
      }

      setCourseMetadata(metadataData.course_metadata)
      setIsCourseMetadataLoading(false)
      setIsLoading(false)
    }
    fetchData()
  }, [courseName, urlGuidedLearning, urlDocumentsOnly, urlSystemPromptOnly])

  // UseEffect to fetch document count in the background
  useEffect(() => {
    if (!courseName) return
    const fetchDocumentCount = async () => {
      try {
        const documentsResponse = await fetch(
          `/api/materialsTable/fetchProjectMaterials?from=0&to=0&course_name=${courseName}`,
        )
        const documentsData = await documentsResponse.json()
        setDocumentCount(documentsData.total_count || 0)
      } catch (error) {
        console.error('Error fetching document count:', error)
        setDocumentCount(0)
      }
    }
    fetchDocumentCount()
  }, [courseName])

  // UseEffect to check user permissions and fetch user email
  useEffect(() => {
    const checkAuthorization = async () => {
      // console.log('Starting authorization check', {
      //   isAuthLoading: auth.isLoading,
      //   isRouterReady: router.isReady,
      //   authUser: auth.user?.profile.email || 'No user email',
      // })

      if (!auth.isLoading && router.isReady) {
        const courseName = router.query.course_name as string
        try {
          // Fetch course metadata
          const metadata = await fetchCourseMetadata(courseName)

          if (!metadata) {
            router.replace(`/new?course_name=${courseName}`)
            return
          }

          // Check if course is public
          if (!metadata.is_private) {
            setIsAuthorized(true)

            // Set email for public access
            if (auth.user?.profile.email) {
              setCurrentEmail(auth.user.profile.email)
            } else {
              // Use PostHog ID when user is not logged in for public courses
              const key = process.env.NEXT_PUBLIC_POSTHOG_KEY as string
              const postHogUserObj = localStorage.getItem(
                'ph_' + key + '_posthog',
              )

              if (postHogUserObj) {
                const postHogUser = JSON.parse(postHogUserObj)
                setCurrentEmail(postHogUser.distinct_id)
              } else {
                // Generate a unique identifier for unauthenticated users
                let anonymousId = localStorage.getItem('anonymous_user_id')
                if (!anonymousId) {
                  anonymousId = generateAnonymousUserId()
                  localStorage.setItem('anonymous_user_id', anonymousId)
                }
                setCurrentEmail(anonymousId)
              }
            }
            return
          } else {
            // For private courses, user must be authenticated
            if (!auth.isAuthenticated) {
              router.replace(`/${courseName}/not_authorized`)
              return
            }

            // Set email for authenticated users
            if (auth.user?.profile.email) {
              setCurrentEmail(auth.user.profile.email)
            } else {
              console.error('Authenticated user has no email')
              router.replace(`/${courseName}/not_authorized`)
              return
            }
          }

          const permission = get_user_permission(metadata, auth)

          if (permission === 'no_permission') {
            router.replace(`/${courseName}/not_authorized`)
            return
          }

          setIsAuthorized(true)
        } catch (error) {
          console.error('Authorization check failed:', error)
          setIsAuthorized(false)
        }
      }
    }

    checkAuthorization()
  }, [auth.isLoading, auth.isAuthenticated, router.isReady, auth, router])

  if (auth.isLoading) {
    return (
      <MainPageBackground>
        <LoadingSpinner />
      </MainPageBackground>
    )
  }

  // Show login only for private courses
  if (!auth.isAuthenticated && courseMetadata?.is_private) {
    console.log(
      'User not logged in',
      auth.isAuthenticated,
      auth.isLoading,
      'NewCoursePage',
    )
    return (
      <AuthComponent
        course_name={course_name ? (course_name as string) : 'new'}
      />
    )
  }

  return (
    <>
      {!isLoading &&
        !auth.isLoading &&
        router.isReady &&
        (currentEmail !== undefined || !courseMetadata?.is_private) &&
        courseMetadata && (
          <Home
            current_email={currentEmail || ''}
            course_metadata={courseMetadata}
            course_name={courseName}
            document_count={documentCount}
            link_parameters={{
              guidedLearning: urlGuidedLearning,
              documentsOnly: urlDocumentsOnly,
              systemPromptOnly: urlSystemPromptOnly,
            }}
          />
        )}
      {isLoading ||
      (!currentEmail && courseMetadata?.is_private) ||
      (currentEmail === '' && courseMetadata?.is_private) ? (
        <MainPageBackground>
          <div
            className={`flex items-center justify-center font-montserratHeading ${montserrat_heading.variable}`}
          >
            <span className="mr-2">Warming up the knowledge engines...</span>
            <LoadingSpinner size="sm" />
          </div>
        </MainPageBackground>
      ) : null}
    </>
  )
}

export default ChatPage
