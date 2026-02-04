import { type NextPage } from 'next'
import MakeQueryAnalysisPage from '~/components/UIUC-Components/MakeQueryAnalysisPage'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { CannotEditGPT4Page } from '~/components/UIUC-Components/CannotEditGPT4'
import { LoadingPlaceholderForAdminPages } from '~/components/UIUC-Components/MainPageBackground'
import { PermissionGate } from '~/components/UIUC-Components/PermissionGate'
import { useAuth } from 'react-oidc-context'
import { useFetchCourseMetadata } from '~/hooks/queries/useFetchCourseMetadata'

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
    isLoading: isFetchingMetadata,
    error,
  } = useFetchCourseMetadata({
    courseName: courseName || '',
    enabled: router.isReady && !auth.isLoading && Boolean(courseName),
  })

  // Handle error states from the hook
  useEffect(() => {
    if (error) {
      console.error(error)
      const errorWithStatus = error as Error & { status?: number }
      const status = errorWithStatus.status
      if (status === 401 || status === 403 || status === 404) {
        setErrorType(status as 401 | 403 | 404)
      }
    }
  }, [error])

  // Check for 404 when metadata is null after loading completes
  useEffect(() => {
    if (
      !isFetchingMetadata &&
      router.isReady &&
      !auth.isLoading &&
      courseName &&
      metadata === undefined &&
      !error
    ) {
      setErrorType(404)
    }
  }, [
    isFetchingMetadata,
    router.isReady,
    auth.isLoading,
    courseName,
    metadata,
    error,
  ])

  const isLoading = auth.isLoading || isFetchingMetadata

  if (isLoading || courseName == null) {
    return <LoadingPlaceholderForAdminPages />
  }

  if ((!auth.user || !auth.isAuthenticated) && courseName) {
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
      <MakeQueryAnalysisPage course_name={courseName as string} />
    </>
  )
}
export default CourseMain
