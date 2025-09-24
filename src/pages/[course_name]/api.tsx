// src/pages/[course_name]/api.tsx
import { Flex } from '@mantine/core'
import { type NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useAuth } from 'react-oidc-context'
import SettingsLayout, {
  getInitialCollapsedState,
} from '~/components/Layout/SettingsLayout'
import ApiKeyManagement from '~/components/UIUC-Components/ApiKeyManagament'
import GlobalFooter from '~/components/UIUC-Components/GlobalFooter'
import { LoadingPlaceholderForAdminPages } from '~/components/UIUC-Components/MainPageBackground'
import { get_user_permission } from '~/components/UIUC-Components/runAuthCheck'
import { type CourseMetadata } from '~/types/courseMetadata'
import { fetchCourseMetadata } from '~/utils/apiUtils'
import { initiateSignIn } from '~/utils/authHelpers'

const ApiPage: NextPage = () => {
  const router = useRouter()
  const auth = useAuth()
  const [courseMetadata, setCourseMetadata] = useState<CourseMetadata | null>(
    null,
  )
  const [isLoading, setIsLoading] = useState(true)
  const [courseName, setCourseName] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    getInitialCollapsedState(),
  )
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
      setCourseMetadata(metadata)
      setIsLoading(false)
    }
    fetchCourseData()
  }, [router.isReady])

  // Second useEffect to handle permissions and other dependent data
  useEffect(() => {
    if (auth.isLoading || !auth.isAuthenticated || courseName == null) {
      // Do not proceed if we are still loading or if the user data is not loaded yet.
      return
    }

    const handlePermissionsAndData = async () => {
      try {
        if (!courseMetadata || !auth.isAuthenticated) {
          return
        }

        const permission_str = get_user_permission(courseMetadata, auth)

        if (permission_str !== 'edit') {
          console.debug(
            'User does not have edit permissions, redirecting to not authorized page, permission: ',
            permission_str,
          )
          await router.replace(`/${courseName}/not_authorized`)
          return
        }
      } catch (error) {
        console.error('Error handling permissions and data: ', error)
      }
    }
    handlePermissionsAndData()
  }, [courseMetadata, auth.isAuthenticated])

  if (isLoading || courseName == null) {
    return <LoadingPlaceholderForAdminPages />
  }

  if (!auth.user || !auth.isAuthenticated) {
    void router.push(`/new?course_name=${courseName}`)
    void initiateSignIn(auth, router.asPath)
    return null
  }

  return (
    <SettingsLayout
      course_name={router.query.course_name as string}
      sidebarCollapsed={sidebarCollapsed}
      setSidebarCollapsed={setSidebarCollapsed}
    >
      <main className="course-page-main min-w-screen flex min-h-screen flex-col items-center">
        <div className="items-left flex w-full flex-col justify-center py-0">
          <Flex direction="column" align="center" w="100%">
            <ApiKeyManagement
              course_name={router.query.course_name as string}
              auth={auth}
              sidebarCollapsed={sidebarCollapsed}
            />
          </Flex>
        </div>
        <GlobalFooter />
      </main>
    </SettingsLayout>
  )
}

export default ApiPage
