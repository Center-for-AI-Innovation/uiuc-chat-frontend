import { type NextPage } from 'next'
import MakeOldCoursePage from '~/components/UIUC-Components/MakeOldCoursePage'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useUser } from '@clerk/nextjs'
import { CannotEditGPT4Page } from '~/components/UIUC-Components/CannotEditGPT4'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import {
  LoadingPlaceholderForAdminPages,
  MainPageBackground,
} from '~/components/UIUC-Components/MainPageBackground'
import { AuthComponent } from '~/components/UIUC-Components/AuthToEditCourse'
import { extractEmailsFromClerk } from '~/components/UIUC-Components/clerkHelpers'
import { CourseMetadata } from '~/types/courseMetadata'
import { fetchCourseMetadata } from '~/utils/apiUtils'
import Navbar from '~/components/UIUC-Components/navbars/Navbar'

const CourseMain: NextPage = () => {
  const router = useRouter()

  const getCurrentPageName = () => {
    return router.query.course_name as string
  }

  const courseName = getCurrentPageName() as string
  const { user, isLoaded, isSignedIn } = useUser()
  const [currentEmail, setCurrentEmail] = useState('')
  const [metadata, setMetadata] = useState<CourseMetadata | null>()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!router.isReady) return
    const fetchCourseData = async () => {
      const userEmail = extractEmailsFromClerk(user)
      setCurrentEmail(userEmail[0] as string)

      try {
        const local_metadata: CourseMetadata = (await fetchCourseMetadata(
          courseName,
        )) as CourseMetadata

        if (local_metadata == null) {
          await router.push('/new?course_name=' + courseName)
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
        // alert('An error occurred while fetching course metadata. Please try again later.')
      }
    }
    fetchCourseData()
  }, [router.isReady, courseName, isLoaded])

  useEffect(() => {
    if (!router.isReady) return
    if (!isLoaded) return
    if (!metadata) return
    if (metadata == null) return

    // Everything is loaded
    setIsLoading(false)
  }, [router.isReady, isLoaded, metadata])

  // Check auth - https://clerk.com/docs/nextjs/read-session-and-user-data
  if (isLoading) {
    return <LoadingPlaceholderForAdminPages />
  }

  if (!isSignedIn && courseName) {
    console.debug('User not logged in', isSignedIn, isLoaded, courseName)
    return <AuthComponent course_name={courseName} />
  }

  if (
    courseName.toLowerCase() == 'gpt4' ||
    courseName.toLowerCase() == 'global' ||
    courseName.toLowerCase() == 'extreme'
  ) {
    // Don't edit certain special pages (no context allowed)
    return <CannotEditGPT4Page course_name={courseName as string} />
  }

  return (
    <>
      <MakeOldCoursePage
        course_name={courseName as string}
        metadata={metadata as CourseMetadata}
        current_email={currentEmail}
      />
    </>
  )
}
export default CourseMain
