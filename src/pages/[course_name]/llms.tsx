import { type NextPage } from 'next'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import { useAuth } from 'react-oidc-context'
import { CannotEditGPT4Page } from '~/components/UIUC-Components/CannotEditGPT4'
import { LoadingPlaceholderForAdminPages } from '~/components/UIUC-Components/MainPageBackground'
import { AuthComponent } from '~/components/UIUC-Components/AuthToEditCourse'
import { fetchCourseMetadata } from '~/utils/apiUtils'
import { type CourseMetadata } from '~/types/courseMetadata'
import APIKeyInputForm from '~/components/UIUC-Components/api-inputs/LLMsApiKeyInputForm'

const CourseMain: NextPage = () => {
  const router = useRouter()
  const [courseName, setCourseName] = useState<string | null>(null)

  const auth = useAuth()
  const [isFetchingCourseMetadata, setIsFetchingCourseMetadata] = useState(true)

  const getCurrentPageName = () => {
    return router.query.course_name as string
  }

  useEffect(() => {
    if (!router.isReady) return
    const fetchCourseData = async () => {
      const local_course_name = getCurrentPageName()

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

  if (auth.isLoading || isFetchingCourseMetadata || courseName == null) {
    return <LoadingPlaceholderForAdminPages />
  }

  if (!auth.isAuthenticated) {
    console.log(
      'User not logged in',
      auth.isAuthenticated,
      auth.isLoading,
      courseName,
    )
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
      <APIKeyInputForm />
    </>
  )
}
export default CourseMain
