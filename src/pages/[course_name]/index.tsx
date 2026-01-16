// src/pages/[course_name]/index.tsx
import { type NextPage } from 'next'
import { useAuth } from 'react-oidc-context'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { type CourseMetadata } from '~/types/courseMetadata'

import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import { get_user_permission } from '~/components/UIUC-Components/runAuthCheck'
import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'
import { fetchCourseMetadata } from '~/utils/apiUtils'
import { PermissionGate } from '~/components/UIUC-Components/PermissionGate'

const AUTH_ROUTES = ['sign-in', 'sign-up']

const IfCourseExists: NextPage = () => {
  const router = useRouter()

  const auth = useAuth()
  const { course_name } = router.query
  const [courseName, setCourseName] = useState<string | null>(null)
  const [courseMetadataIsLoaded, setCourseMetadataIsLoaded] = useState(false)
  const [courseMetadata, setCourseMetadata] = useState<CourseMetadata | null>(
    null,
  )
  const [errorType, setErrorType] = useState<401 | 403 | 404 | null>(null)

  const getCurrentPageName = () => {
    return router.query.course_name as string
  }

  // Move all useEffect hooks before any conditional logic
  useEffect(() => {
    if (!router.isReady || auth.isLoading) return

    const fetchMetadata = async () => {
      const course_name = getCurrentPageName()
      try {
        const metadata: CourseMetadata = await fetchCourseMetadata(course_name)

        if (metadata === null) {
          setErrorType(404)
          return
        }

        if (!metadata.is_private) {
          // Public -- redirect as quickly as possible!
          await router.replace(`/${course_name}/chat`)
          return
        }
        setCourseName(course_name)
        setCourseMetadata(metadata)
        setCourseMetadataIsLoaded(true)
      } catch (error) {
        console.error('Error fetching course metadata:', error)
        // Check if error has a status code (401, 403, or 404)
        const errorWithStatus = error as Error & { status?: number }
        const status = errorWithStatus.status

        if (status === 401 || status === 403 || status === 404) {
          setErrorType(status as 401 | 403 | 404)
        }
      }
    }

    if (typeof course_name === 'string' && !AUTH_ROUTES.includes(course_name)) {
      fetchMetadata()
    }

    const checkAuth = async () => {
      // AUTH
      if (courseMetadata && !auth.isLoading) {
        const permission_str = get_user_permission(courseMetadata, auth)

        if (permission_str === 'edit' || permission_str === 'view') {
          console.debug('Can view or edit')
          await router.replace(`/${courseName}/chat`)
          return
        } else {
          console.debug(
            'User does not have edit permissions, redirecting to not authorized page, permission: ',
            permission_str,
          )
          await router.replace(`/${courseName}/not_authorized`)
          return
        }
      }
    }
    checkAuth()
  }, [
    router.isReady,
    router,
    course_name,
    getCurrentPageName,
    auth.isLoading,
    auth,
    courseMetadata,
    courseName,
  ])

  if (errorType !== null) {
    return (
      <PermissionGate
        course_name={course_name ? (course_name as string) : 'new'}
        errorType={errorType}
      />
    )
  }

  return (
    <MainPageBackground>
      <LoadingSpinner />
    </MainPageBackground>
  )
}
export default IfCourseExists
