import { type NextPage } from 'next'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import { useAuth } from 'react-oidc-context'
import { CannotEditGPT4Page } from '~/components/UIUC-Components/CannotEditGPT4'
import { LoadingPlaceholderForAdminPages } from '~/components/UIUC-Components/MainPageBackground'
import { PermissionGate } from '~/components/UIUC-Components/PermissionGate'
import { useFetchCourseMetadata } from '~/hooks/queries/useFetchCourseMetadata'
import APIKeyInputForm from '~/components/UIUC-Components/api-inputs/LLMsApiKeyInputForm'

const CourseMain: NextPage = () => {
  const router = useRouter()

  const auth = useAuth()
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

  const {
    data: metadata,
    isLoading: isFetchingCourseMetadata,
    error,
  } = useFetchCourseMetadata({
    courseName,
    enabled: router.isReady && !auth.isLoading && !!courseName,
  })

  useEffect(() => {
    if (error) {
      console.error(error)
      const errorWithStatus = error as Error & { status?: number }
      const status = errorWithStatus.status
      if (status === 401 || status === 403 || status === 404) {
        setErrorType(status as 401 | 403 | 404)
      }
    } else if (metadata === null) {
      setErrorType(404)
    }
  }, [error, metadata])

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
    return <PermissionGate course_name={courseName as string} />
  }

  // Don't edit certain special pages (no context allowed)
  if (
    courseName.toLowerCase() == 'gpt4' ||
    courseName.toLowerCase() == 'global' ||
    courseName.toLowerCase() == 'extreme'
  ) {
    return <CannotEditGPT4Page course_name={courseName as string} />
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
    <>
      <APIKeyInputForm />
    </>
  )
}
export default CourseMain
