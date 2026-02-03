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
import { useFetchCourseMetadata } from '~/hooks/queries/useFetchCourseMetadata'
import { PermissionGate } from '~/components/UIUC-Components/PermissionGate'
import { generateAnonymousUserId } from '~/utils/cryptoRandom'

const ChatPage: NextPage = () => {
  const auth = useAuth()
  const router = useRouter()
  const getCurrentPageName = () => {
    const raw = router.query.course_name
    return typeof raw === 'string'
      ? raw
      : Array.isArray(raw)
        ? raw[0]
        : undefined
  }
  const courseName = getCurrentPageName() as string
  const [currentEmail, setCurrentEmail] = useState('')
  const [urlGuidedLearning, setUrlGuidedLearning] = useState(false)
  const [urlDocumentsOnly, setUrlDocumentsOnly] = useState(false)
  const [urlSystemPromptOnly, setUrlSystemPromptOnly] = useState(false)
  const [documentCount, setDocumentCount] = useState<number | null>(null)
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [errorType, setErrorType] = useState<401 | 403 | 404 | null>(null)
  const { course_name } = router.query

  // Use React Query hook to fetch course metadata
  const {
    data: courseMetadata,
    isLoading: isCourseMetadataLoading,
    error: courseMetadataError,
  } = useFetchCourseMetadata({
    courseName,
    enabled: router.isReady && Boolean(courseName),
  })

  // UseEffect to check URL parameters and handle redirects
  useEffect(() => {
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

    // Special case: Cropwizard redirect
    if (
      courseName &&
      ['cropwizard', 'cropwizard-1.0', 'cropwizard-1'].includes(
        courseName.toLowerCase(),
      )
    ) {
      router.push(`/cropwizard-1.5`)
    }
  }, [router.isReady, courseName])

  // Handle course metadata error states
  useEffect(() => {
    if (courseMetadataError) {
      console.error('Error fetching course metadata:', courseMetadataError)
      // Check if error has a status code (401, 403, or 404)
      const errorWithStatus = courseMetadataError as Error & { status?: number }
      const status = errorWithStatus.status
      if (status === 401 || status === 403 || status === 404) {
        setErrorType(status as 401 | 403 | 404)
      }
    }
  }, [courseMetadataError])

  // Log course metadata settings when loaded
  useEffect(() => {
    if (courseMetadata) {
      console.log('Course metadata settings:', {
        guidedLearning: courseMetadata.guidedLearning,
        documentsOnly: courseMetadata.documentsOnly,
        systemPromptOnly: courseMetadata.systemPromptOnly,
        system_prompt: courseMetadata.system_prompt,
      })
    }
  }, [courseMetadata])

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

  // UseEffect to check user permissions and set user email
  useEffect(() => {
    // Wait for auth and course metadata to be ready
    if (auth.isLoading || isCourseMetadataLoading || !router.isReady) {
      return
    }

    // If no metadata, redirect to new course page
    if (!courseMetadata && !courseMetadataError) {
      router.replace(`/new?course_name=${courseName}`)
      return
    }

    // If there was an error fetching metadata, it's handled in the error useEffect
    if (courseMetadataError) {
      setIsAuthorized(false)
      return
    }

    if (!courseMetadata) {
      return
    }

    // Check if course is frozen/archived
    if (courseMetadata.is_frozen === true) {
      router.replace(`/${courseName}/not_authorized`)
      return
    }

    // Check if course is public
    if (!courseMetadata.is_private) {
      setIsAuthorized(true)

      // Set email for public access
      if (auth.user?.profile.email) {
        setCurrentEmail(auth.user.profile.email)
      } else {
        // Use PostHog ID when user is not logged in for public courses
        const key = process.env.NEXT_PUBLIC_POSTHOG_KEY as string
        const postHogUserObj = localStorage.getItem('ph_' + key + '_posthog')

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

    const permission = get_user_permission(courseMetadata, auth)

    if (permission === 'no_permission') {
      router.replace(`/${courseName}/not_authorized`)
      return
    }

    setIsAuthorized(true)
  }, [
    auth.isLoading,
    auth.isAuthenticated,
    auth.user?.profile.email,
    router.isReady,
    courseMetadata,
    isCourseMetadataLoading,
    courseMetadataError,
    courseName,
  ])

  if (auth.isLoading) {
    return (
      <MainPageBackground>
        <LoadingSpinner />
      </MainPageBackground>
    )
  }

  if (errorType !== null) {
    return (
      <PermissionGate
        course_name={course_name ? (course_name as string) : 'new'}
        errorType={errorType}
      />
    )
  }

  // redirect to login page if needed
  if (!auth.isAuthenticated && courseMetadata?.is_private) {
    console.log(
      'User not logged in',
      auth.isAuthenticated,
      auth.isLoading,
      'NewCoursePage',
    )
    return (
      <PermissionGate
        course_name={course_name ? (course_name as string) : 'new'}
      />
    )
  }

  return (
    <>
      {!isCourseMetadataLoading &&
        !auth.isLoading &&
        router.isReady &&
        // Only render once we have a valid identifier (email or posthog id)
        !!currentEmail &&
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
      {isCourseMetadataLoading ||
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
