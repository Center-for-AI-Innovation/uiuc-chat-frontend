import { type NextPage } from 'next'
import MakeQueryAnalysisPage from '~/components/UIUC-Components/MakeQueryAnalysisPage'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { CannotEditGPT4Page } from '~/components/UIUC-Components/CannotEditGPT4'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import {
  LoadingPlaceholderForAdminPages,
  MainPageBackground,
} from '~/components/UIUC-Components/MainPageBackground'
import { AuthComponent } from '~/components/UIUC-Components/AuthToEditCourse'
import { fetchCourseMetadata } from '~/utils/apiUtils'
import { type CourseMetadata } from '~/types/courseMetadata'
import NomicDocumentMap from '~/components/UIUC-Components/NomicDocumentsMap'
import GlobalFooter from '~/components/UIUC-Components/GlobalFooter'
import { useAuth } from 'react-oidc-context'
import { initiateSignIn } from '~/utils/authHelpers'

const CourseMain: NextPage = () => {
  const router = useRouter()
  const [courseName, setCourseName] = useState<string | null>(null)
  const auth = useAuth()
  const [isLoading, setIsLoading] = useState(true)

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
      setIsLoading(false)
    }
    fetchCourseData()
  }, [router.isReady])

  if (
    auth.isLoading ||
    isLoading ||
    !auth.isAuthenticated ||
    courseName == null
  ) {
    return <LoadingPlaceholderForAdminPages />
  }

  if (!auth.user || !auth.isAuthenticated) {
    void initiateSignIn(auth, router.asPath)
    return null
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
      <MakeQueryAnalysisPage course_name={courseName as string} />
    </>
  )
}
export default CourseMain
