// This is uiuc.chat/chat - useful to everyone as a free alternative to ChatGPT.com and Claude.ai.

import { montserrat_heading } from 'fonts'
import { type NextPage } from 'next'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import { useAuth } from 'react-oidc-context'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'
import { get_user_permission } from '~/components/UIUC-Components/runAuthCheck'
import Home from '~/pages/api/home/home'
import { type CourseMetadata } from '~/types/courseMetadata'
import { fetchCourseMetadata } from '~/utils/apiUtils'
import { PermissionGate } from '~/components/UIUC-Components/PermissionGate'
import { generateAnonymousUserId } from '~/utils/cryptoRandom'

const ChatPage: NextPage = () => {
  const [metadata, setMetadata] = useState<CourseMetadata | null>()
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const auth = useAuth()
  const email = auth.user?.profile.email
  const [currentEmail, setCurrentEmail] = useState('')
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [errorType, setErrorType] = useState<401 | 403 | 404 | null>(null)

  const course_metadata = metadata
  const getCurrentPageName = () => {
    const raw = router.query.course_name
    return typeof raw === 'string'
        ? raw
        : Array.isArray(raw)
          ? raw[0]
          : undefined
  }
  const courseName = getCurrentPageName() as string

  useEffect(() => {
    if (!router.isReady) return
    const fetchCourseData = async () => {
      try {
        const local_metadata: CourseMetadata = (await fetchCourseMetadata(
          'chat',
        )) as CourseMetadata

        if (local_metadata === null) {
          setErrorType(404)
          return
        }

        if (local_metadata && local_metadata.is_private) {
          local_metadata.is_private = JSON.parse(
            local_metadata.is_private as unknown as string,
          )
        }
        setMetadata(local_metadata)
      } catch (error) {
        console.error(error)

        const errorWithStatus = error as Error & { status?: number }
        const status = errorWithStatus.status
        if (status === 401 || status === 403 || status === 404) {
          setErrorType(status as 401 | 403 | 404)
        }
      }
    }
    fetchCourseData()
  }, [router.isReady])

  useEffect(() => {
    if (!router.isReady) return
    if (!metadata) return
    if (metadata == null) return

    // Everything is loaded
    setIsLoading(false)
  }, [router.isReady, metadata])

  useEffect(() => {
    if (auth.isLoading) return
    if (email) {
      setCurrentEmail(email)
    } else {
      const key = process.env.NEXT_PUBLIC_POSTHOG_KEY as string
      const postHogUserObj = localStorage.getItem('ph_' + key + '_posthog')
      if (postHogUserObj) {
        const postHogUser = JSON.parse(postHogUserObj)
        setCurrentEmail(postHogUser.distinct_id)
      } else if (!metadata?.is_private) {
        // Generate a unique identifier for unauthenticated users on public courses
        let anonymousId = localStorage.getItem('anonymous_user_id')
        if (!anonymousId) {
          anonymousId = generateAnonymousUserId()
          localStorage.setItem('anonymous_user_id', anonymousId)
        }
        setCurrentEmail(anonymousId)
      }
    }
  }, [auth.isLoading, email, metadata?.is_private])

  // Enforce permissions similar to /[course_name]/chat
  useEffect(() => {
    const checkAuthorization = async () => {
      if (auth.isLoading || !router.isReady || !metadata || !auth) {
        return
      }

      try {
        // If course metadata is missing
        if (!metadata) {
          await router.replace(`/new?course_name=chat`)
          return
        }

        // Public courses: allow
        if (!metadata.is_private) {
          setIsAuthorized(true)
          return
        } else {
          // Private courses must be authenticated
          if (!auth.isAuthenticated) {
            await router.replace(`/chat/not_authorized`)
            return
          }

          // Ensure authenticated users have an email
          if (auth.user?.profile.email) {
            setCurrentEmail(auth.user.profile.email)
          } else {
            await router.replace(`/chat/not_authorized`)
            return
          }
        }

        const permission = get_user_permission(metadata, auth)
        if (permission === 'no_permission') {
          await router.replace(`/chat/not_authorized`)
          return
        }

        setIsAuthorized(true)
      } catch (error) {
        console.error('Authorization check failed:', error)
        setIsAuthorized(false)
      }
    }

    checkAuthorization()
  }, [
    auth.isLoading,
    auth.isAuthenticated,
    router.isReady,
    metadata,
    auth,
    router,
  ])

  if (auth.isLoading) {
    return (
      <MainPageBackground>
        <LoadingSpinner />
      </MainPageBackground>
    )
  }

  // redirect to login page if needed (only for private courses)
  if (!auth.isAuthenticated && metadata?.is_private) {
    console.log(
      'User not logged in',
      auth.isAuthenticated,
      auth.isLoading,
      'NewCoursePage',
    )
    return (
      <PermissionGate
        course_name={courseName ? (courseName as string) : 'new'}
      />
    )
  }

   if (errorType !== null) {
    return (
      <PermissionGate
        course_name={courseName ? (courseName as string) : 'new'}
        errorType={errorType}
      />
    )
  }

  return (
    <>
      {!isLoading &&
        !auth.isLoading &&
        router.isReady &&
        (currentEmail !== undefined || !course_metadata?.is_private) &&
        course_metadata &&
        isAuthorized && (
          <Home
            current_email={currentEmail}
            course_metadata={course_metadata}
            course_name={'chat'}
            document_count={0}
            link_parameters={{
              guidedLearning: false,
              documentsOnly: false,
              systemPromptOnly: false,
            }}
          />
        )}
      {isLoading ||
      (!currentEmail && metadata?.is_private) ||
      (currentEmail === '' && metadata?.is_private) ? (
        <MainPageBackground>
          <div
            className={`flex items-center justify-center font-montserratHeading text-white ${montserrat_heading.variable}`}
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
