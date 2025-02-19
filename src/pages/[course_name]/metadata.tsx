import { type NextPage } from 'next'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useUser } from '@clerk/nextjs'
import { CannotEditGPT4Page } from '~/components/UIUC-Components/CannotEditGPT4'
import { LoadingPlaceholderForAdminPages } from '~/components/UIUC-Components/MainPageBackground'
import { AuthComponent } from '~/components/UIUC-Components/AuthToEditCourse'
import { fetchCourseMetadata } from '~/utils/apiUtils'
import { type CourseMetadata } from '~/types/courseMetadata'
import Navbar from '~/components/UIUC-Components/navbars/Navbar'
import MetadataGenerationPage from '~/components/UIUC-Components/MetadataGenerationPage'
import { Flex } from '@mantine/core'

const MetadataPage: NextPage = () => {
  const router = useRouter()
  const [courseName, setCourseName] = useState<string | null>(null)
  const { isLoaded, isSignedIn } = useUser()
  const [isLoading, setIsLoading] = useState(true)
  const [metadata, setMetadata] = useState<CourseMetadata | null>(null)

  const getCurrentPageName = router.query.course_name as string

  useEffect(() => {
    if (!router.isReady) return
    const fetchCourseData = async () => {
      const local_course_name = getCurrentPageName

      // Check exists
      const metadata: CourseMetadata =
        await fetchCourseMetadata(local_course_name)
      if (metadata === null) {
        await router.push('/new?course_name=' + local_course_name)
        return
      }
      setCourseName(local_course_name)
      setMetadata(metadata)
      setIsLoading(false)
    }
    fetchCourseData()
  }, [router, router.isReady, getCurrentPageName])

  // Check auth - https://clerk.com/docs/nextjs/read-session-and-user-data
  if (!isLoaded || isLoading || courseName == null) {
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
      <Navbar course_name={courseName} />
      <main className="course-page-main min-w-screen flex min-h-screen flex-col items-center">
        <div className="items-left flex w-full flex-col justify-center py-0">
          <Flex direction="column" align="center" w="100%">
            <MetadataGenerationPage
              course_name={courseName}
              metadata={metadata}
            />
          </Flex>
        </div>
      </main>
    </>
  )
}

export default MetadataPage
