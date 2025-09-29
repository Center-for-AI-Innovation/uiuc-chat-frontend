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
import { AuthComponent } from '~/components/UIUC-Components/AuthToEditCourse'

const ChatPage: NextPage = () => {
  const [metadata, setMetadata] = useState<CourseMetadata | null>()
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const auth = useAuth()
  const email = auth.user?.profile.email
  const [currentEmail, setCurrentEmail] = useState('')
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const course_metadata = metadata
  const { course_name } = router.query

  useEffect(() => {
    if (!router.isReady) return
    const fetchCourseData = async () => {
      try {
        const local_metadata: CourseMetadata = (await fetchCourseMetadata(
          'chat',
        )) as CourseMetadata

        if (local_metadata && local_metadata.is_private) {
          local_metadata.is_private = JSON.parse(
            local_metadata.is_private as unknown as string,
          )
        }
        setMetadata(local_metadata)
      } catch (error) {
        console.error(error)
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
      }
    }
  }, [auth.isLoading, email])

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

  // redirect to login page if needed
  if (!auth.isAuthenticated) {
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
        ((currentEmail && currentEmail !== '') ||
          !course_metadata?.is_private) &&
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
        !currentEmail ||
        (currentEmail === '' && (
          <MainPageBackground>
            <div
              className={`flex items-center justify-center font-montserratHeading text-white ${montserrat_heading.variable}`}
            >
              <span className="mr-2">Warming up the knowledge engines...</span>
              <LoadingSpinner size="sm" />
            </div>
          </MainPageBackground>
        ))}
    </>
  )
}

export default ChatPage
