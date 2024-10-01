import { type NextPage } from 'next'
import MakeNomicVisualizationPage from '~/components/UIUC-Components/MakeQueryAnalysisPage'
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
import { fetchCourseMetadata } from '~/utils/apiUtils'
import { CourseMetadata } from '~/types/courseMetadata'
import APIKeyInputForm from '~/components/UIUC-Components/api-inputs/LLMsApiKeyInputForm'
import IngestLinkForm from '~/components/UIUC-Components/IngestCards'

const CourseMain: NextPage = () => {
  const router = useRouter()
  const [courseName, setCourseName] = useState<string | null>(null)
  const { user, isLoaded, isSignedIn } = useUser()
  const [isFetchingCourseMetadata, setIsFetchingCourseMetadata] = useState(true)

  const getCurrentPageName = () => {
    return router.query.course_name as string
  }

  useEffect(() => {
    if (!router.isReady) return
    const fetchCourseData = async () => {
      const local_course_name = getCurrentPageName()

      // Check exists
      const metadata: CourseMetadata =
        await fetchCourseMetadata(local_course_name)
      if (metadata === null) {
        await router.push('/new?course_name=' + local_course_name)
        return
      }
      setCourseName(local_course_name)
      setIsFetchingCourseMetadata(false)
    }
    fetchCourseData()
  }, [router.isReady])

  // Check auth - https://clerk.com/docs/nextjs/read-session-and-user-data
  if (!isLoaded || isFetchingCourseMetadata || courseName == null) {
    return <LoadingPlaceholderForAdminPages />
  }

  if (!isSignedIn) {
    console.log('User not logged in', isSignedIn, isLoaded, courseName)
    return <AuthComponent course_name={courseName as string} />
  }

  // Don't edit certain special pages (no context allowed)
  if (
    courseName.toLowerCase() == 'gpt4' ||
    courseName.toLowerCase() == 'global' ||
    courseName.toLowerCase() == 'extreme'
  ) {
    return <CannotEditGPT4Page course_name={courseName as string} />
  }

  return (
    <>
      <IngestLinkForm />
    </>
  )
}
export default CourseMain

