// src/pages/[course_name]/index.tsx
import { type NextPage } from 'next'
import { useAuth } from 'react-oidc-context'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import { get_user_permission } from '~/components/UIUC-Components/runAuthCheck'
import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'
import { useFetchCourseMetadata } from '~/hooks/queries/useFetchCourseMetadata'
import { PermissionGate } from '~/components/UIUC-Components/PermissionGate'

const AUTH_ROUTES = ['sign-in', 'sign-up']

const IfCourseExists: NextPage = () => {
  const router = useRouter()
  const auth = useAuth()
  const { course_name } = router.query
  const courseName = typeof course_name === 'string' ? course_name : undefined
  const [errorType, setErrorType] = useState<401 | 403 | 404 | null>(null)

  const shouldFetch =
    router.isReady &&
    !auth.isLoading &&
    typeof courseName === 'string' &&
    !AUTH_ROUTES.includes(courseName)

  const {
    data: courseMetadata,
    isLoading,
    error,
  } = useFetchCourseMetadata({
    courseName: courseName || '',
    enabled: shouldFetch,
  })

  // Handle error states from the hook
  useEffect(() => {
    if (error) {
      console.error('Error fetching course metadata:', error)
      const errorWithStatus = error as Error & { status?: number }
      const status = errorWithStatus.status
      if (status === 401 || status === 403 || status === 404) {
        setErrorType(status as 401 | 403 | 404)
      }
    }
  }, [error])

  // Handle redirect and auth logic
  useEffect(() => {
    if (!router.isReady || auth.isLoading || isLoading || !courseName) return
    if (errorType) return

    // If metadata is null/undefined after loading, treat as 404
    if (!courseMetadata && !isLoading && shouldFetch) {
      setErrorType(404)
      return
    }

    if (!courseMetadata) return

    // Public course -- redirect as quickly as possible!
    if (!courseMetadata.is_private) {
      router.replace(`/${courseName}/chat`)
      return
    }

    // Private course - check auth
    const permission_str = get_user_permission(courseMetadata, auth)

    if (permission_str === 'edit' || permission_str === 'view') {
      console.debug('Can view or edit')
      router.replace(`/${courseName}/chat`)
    } else {
      console.debug(
        'User does not have edit permissions, redirecting to not authorized page, permission: ',
        permission_str,
      )
      router.replace(`/${courseName}/not_authorized`)
    }
  }, [
    router.isReady,
    router,
    auth.isLoading,
    auth,
    courseMetadata,
    courseName,
    isLoading,
    errorType,
    shouldFetch,
  ])

  if (errorType !== null) {
    return (
      <PermissionGate course_name={courseName || 'new'} errorType={errorType} />
    )
  }

  return (
    <MainPageBackground>
      <LoadingSpinner />
    </MainPageBackground>
  )
}
export default IfCourseExists
