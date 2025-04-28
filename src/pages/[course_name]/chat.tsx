// export { default } from '~/pages/api/home'

import { useAuth } from 'react-oidc-context'
import { NextPage } from 'next'
import { useEffect, useState } from 'react'
import Home from '../api/home/home'
import { useRouter } from 'next/router'

import { CourseMetadata } from '~/types/courseMetadata'
import { get_user_permission } from '~/components/UIUC-Components/runAuthCheck'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import { montserrat_heading } from 'fonts'
import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'
import Head from 'next/head'
import { GUIDED_LEARNING_PROMPT } from '~/utils/app/const'
import { fetchCourseMetadata } from '~/utils/apiUtils'

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
      console.log('Starting authorization check', {
        isAuthLoading: auth.isLoading,
        isRouterReady: router.isReady,
        authUser: auth.user?.profile.email || 'No user email',
      })

      if (!auth.isLoading && router.isReady) {
        const courseName = router.query.course_name as string
        console.log(`Checking authorization for course: ${courseName}`)

        try {
          // Fetch course metadata
          console.log('Fetching course metadata...')
          const metadata = await fetchCourseMetadata(courseName)
          console.log('Course metadata received:', metadata)

          if (!metadata) {
            console.log('No metadata found, redirecting to new course page')
            router.replace(`/new?course_name=${courseName}`)
            return
          }

          // Check if course is public
          console.log(
            `Course privacy status: ${metadata.is_private ? 'private' : 'public'}`,
          )
          if (!metadata.is_private) {
            console.log('Course is public, setting authorized to true')
            setIsAuthorized(true)

            // Set email for public access
            if (auth.user?.profile.email) {
              console.log(
                `Setting email for logged-in user: ${auth.user.profile.email}`,
              )
              setCurrentEmail(auth.user.profile.email)
            } else {
              // Use PostHog ID when user is not logged in for public courses
              console.log('No user email, attempting to use PostHog ID')
              const key = process.env.NEXT_PUBLIC_POSTHOG_KEY as string
              const postHogUserObj = localStorage.getItem(
                'ph_' + key + '_posthog',
              )

              if (postHogUserObj) {
                const postHogUser = JSON.parse(postHogUserObj)
                console.log(
                  `Using PostHog ID as email: ${postHogUser.distinct_id}`,
                )
                setCurrentEmail(postHogUser.distinct_id)
              } else {
                // When user is not logged in and posthog user is not found
                console.log('No PostHog ID found, setting empty email')
                setCurrentEmail('')
              }
            }
            return
          } else {
            // For private courses, user must be authenticated
            console.log('Course is private, checking authentication')
            if (!auth.isAuthenticated) {
              console.log(
                'User not authenticated, redirecting to not authorized page',
              )
              router.replace(`/${courseName}/not_authorized`)
              return
            }

            // Set email for authenticated users
            if (auth.user?.profile.email) {
              console.log(
                `Setting email for authenticated user: ${auth.user.profile.email}`,
              )
              setCurrentEmail(auth.user.profile.email)
            } else {
              console.error('Authenticated user has no email')
              router.replace(`/${courseName}/not_authorized`)
              return
            }
          }

          console.log('Checking user permission for private course')
          const permission = get_user_permission(metadata, auth)
          console.log(`User permission result: ${permission}`)

          if (permission === 'no_permission') {
            console.log(
              'User has no permission, redirecting to not authorized page',
            )
            router.replace(`/${courseName}/not_authorized`)
            return
          }

          console.log('User is authorized to access this course')
          setIsAuthorized(true)
        } catch (error) {
          console.error('Authorization check failed:', error)
          setIsAuthorized(false)
        }
      } else {
        console.log('Waiting for auth loading or router to be ready')
      }
    }

    checkAuthorization()
  }, [auth.isLoading, auth.isAuthenticated, router.isReady])

  return (
    <>
      {!isLoading &&
        !auth.isLoading &&
        router.isReady &&
        (currentEmail || !courseMetadata?.is_private) &&
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
      {isLoading && !currentEmail && (
        <MainPageBackground>
          <div
            className={`flex items-center justify-center font-montserratHeading ${montserrat_heading.variable}`}
          >
            <span className="mr-2">Warming up the knowledge engines...</span>
            <LoadingSpinner size="sm" />
          </div>
        </MainPageBackground>
      )}
    </>
  )
}

export default ChatPage
