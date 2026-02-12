import { useFetchCourseExists } from '~/hooks/queries/useFetchCourseExists'
import { useFetchAllCourseData } from '~/hooks/queries/useFetchAllCourseData'

import { type NextPage } from 'next'
import React, { useEffect } from 'react'
import { Montserrat } from 'next/font/google'
import { useRouter } from 'next/router'

import { CannotEditGPT4Page } from '~/components/UIUC-Components/CannotEditGPT4'
import {
  LoadingPlaceholderForAdminPages,
  MainPageBackground,
} from '~/components/UIUC-Components/MainPageBackground'
import { PermissionGate } from '~/components/UIUC-Components/PermissionGate'
import { Title } from '@mantine/core'

import MakeToolsPage from '~/components/UIUC-Components/N8NPage'
import posthog from 'posthog-js'
import { useAuth } from 'react-oidc-context'

const montserrat = Montserrat({
  weight: '700',
  subsets: ['latin'],
})

const ToolsPage: NextPage = () => {
  const router = useRouter()
  const auth = useAuth()

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
    data: courseExists,
    isLoading: isCheckingExists,
    isError: isExistsError,
  } = useFetchCourseExists({
    courseName,
    enabled: router.isReady && !auth.isLoading && Boolean(courseName),
  })

  const {
    data: courseDataResponse,
    isLoading: isLoadingCourseData,
    isError: isCourseDataError,
  } = useFetchAllCourseData({
    courseName,
    enabled: courseExists === true && !isCheckingExists && !isExistsError,
  })

  useEffect(() => {
    if (courseDataResponse) {
      posthog.capture('tool_page_visited', {
        course_name: courseName,
      })
    }
  }, [courseDataResponse, courseName])

  const errorType: 401 | 403 | 404 | null =
    isExistsError || (courseExists !== undefined && !courseExists)
      ? 404
      : isCourseDataError
        ? 404
        : null

  if (
    auth.isLoading ||
    isCheckingExists ||
    isLoadingCourseData ||
    courseName === undefined
  ) {
    return <LoadingPlaceholderForAdminPages />
  }

  if (!auth.isAuthenticated) {
    return <PermissionGate course_name={courseName as string} />
  }

  const user_emails = auth.user?.profile?.email ? [auth.user.profile.email] : []

  // if their account is somehow broken (with no email address)
  // Don't edit certain special pages (no context allowed)
  if (
    courseName &&
    (courseName.toLowerCase() == 'gpt4' ||
      courseName.toLowerCase() == 'global' ||
      courseName.toLowerCase() == 'extreme')
  ) {
    return <CannotEditGPT4Page course_name={courseName as string} />
  }

  if (user_emails.length == 0) {
    return (
      <MainPageBackground>
        <Title
          className={montserrat.className}
          variant="gradient"
          gradient={{ from: 'gold', to: 'white', deg: 50 }}
          order={3}
          p="xl"
          style={{ marginTop: '4rem' }}
        >
          You&apos;ve encountered a software bug!<br></br>Your account has no
          email address. Please shoot me an email so I can fix it for you:{' '}
          <a className="goldUnderline" href="mailto:rohan13@illinois.edu">
            rohan13@illinois.edu
          </a>
        </Title>
      </MainPageBackground>
    )
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
      <MakeToolsPage course_name={courseName as string} />
    </>
  )
}
export default ToolsPage
