import { type NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

import { Flex } from '@mantine/core'
import Head from 'next/head'
import { useAuth } from 'react-oidc-context'
import SettingsLayout, {
  getInitialCollapsedState,
} from '~/components/Layout/SettingsLayout'
import { AuthComponent } from '~/components/UIUC-Components/AuthToEditCourse'
import { CannotEditCourse } from '~/components/UIUC-Components/CannotEditCourse'
import { CannotEditGPT4Page } from '~/components/UIUC-Components/CannotEditGPT4'
import GlobalFooter from '~/components/UIUC-Components/GlobalFooter'
import { LoadingPlaceholderForAdminPages } from '~/components/UIUC-Components/MainPageBackground'
import { type CourseMetadata } from '~/types/courseMetadata'
import { fetchCourseMetadata } from '~/utils/apiUtils'

const CourseMain: NextPage = () => {
  const router = useRouter()
  const [projectName, setProjectName] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    getInitialCollapsedState(),
  )
  const [isFetchingCourseMetadata, setIsFetchingCourseMetadata] = useState(true)
  const auth = useAuth()
  const isLoaded = !auth.isLoading
  const isSignedIn = auth.isAuthenticated
  const user_email = auth.user?.profile.email
  const [metadata, setProjectMetadata] = useState<CourseMetadata | null>()
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
      setProjectName(local_course_name)
      setIsFetchingCourseMetadata(false)
      setProjectMetadata(metadata)
    }
    fetchCourseData()
  }, [router.isReady])

  if (
    metadata &&
    user_email !== (metadata.course_owner as string) &&
    metadata.course_admins.indexOf(getCurrentPageName()) === -1
  ) {
    void router.push(`/new?course_name=${projectName}`)

    return <CannotEditCourse course_name={getCurrentPageName() as string} />
  }
  if (!isLoaded || isFetchingCourseMetadata || projectName == null) {
    return <LoadingPlaceholderForAdminPages />
  }

  if (!isSignedIn) {
    console.log('User not logged in', isSignedIn, isLoaded, projectName)
    return <AuthComponent course_name={projectName as string} />
  }

  // Don't edit certain special pages (no context allowed)
  if (
    projectName.toLowerCase() == 'gpt4' ||
    projectName.toLowerCase() == 'global' ||
    projectName.toLowerCase() == 'extreme'
  ) {
    return <CannotEditGPT4Page course_name={projectName as string} />
  }

  return (
    <SettingsLayout
      course_name={projectName}
      sidebarCollapsed={sidebarCollapsed}
      setSidebarCollapsed={setSidebarCollapsed}
    >
      <Head>
        <title>{projectName}/upload</title>
        <meta
          name="UIUC.chat"
          content="The AI teaching assistant built for students at UIUC."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="course-page-main min-w-screen flex min-h-screen flex-col items-center">
        <div className="items-left flex w-full flex-col justify-center py-0">
          <Flex
            direction="column"
            align="center"
            w="100%"
            className="mt-8 lg:mt-4"
          ></Flex>
        </div>
        <GlobalFooter />
      </main>
    </SettingsLayout>
  )
}
export default CourseMain
