// src/pages/[course_name]/api.tsx
import { Flex } from '@mantine/core'
import { type NextPage } from 'next'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
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
import { PermissionGate } from '~/components/UIUC-Components/PermissionGate'

const ApiPage: NextPage = () => {
  const router = useRouter()
  const auth = useAuth()
  const [courseMetadata, setCourseMetadata] = useState<CourseMetadata | null>(
    null,
  )
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    getInitialCollapsedState(),
  )
  const [errorType, setErrorType] = useState<401 | 403 | 404 | null>(null)

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
    if (!router.isReady || auth.isLoading) return

    const fetchCourseData = async () => {
      setIsLoading(true)
      try {
        // Check exists
        const metadata: CourseMetadata =
          await fetchCourseMetadata(courseName)
        if (metadata === null) {
          setErrorType(404)
          return
        }
        setCourseMetadata(metadata)
      } catch (error) {
        console.error(error)

        const errorWithStatus = error as Error & { status?: number }
        const status = errorWithStatus.status
        if (status === 401 || status === 403 || status === 404) {
          setErrorType(status as 401 | 403 | 404)
        }
      } finally {
      setIsLoading(false)
      }
    }
    fetchCourseData()
  }, [router.isReady, auth.isLoading, courseName])

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

  if ((!auth.user || !auth.isAuthenticated) && courseName) {
    return <PermissionGate course_name={courseName as string} />
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
