import { type NextPage } from 'next'
import MakeNewCoursePage from '~/components/UIUC-Components/MakeNewCoursePage'
import React, { useEffect, useState } from 'react'
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
import { ProtectedRoute } from '~/components/ProtectedRoute'

const montserrat = Montserrat({
  weight: '700',
  subsets: ['latin'],
})

const ToolsPage: NextPage = () => {
  const router = useRouter()
  const auth = useAuth()

  const [courseData, setCourseData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorType, setErrorType] = useState<401 | 403 | 404 | null>(null)

  const getCurrentPageName = () => {
    const raw = router.query.course_name
    return typeof raw === 'string'
        ? raw
        : Array.isArray(raw)
          ? raw[0]
          : undefined
  }
  const courseName = (getCurrentPageName() ?? '') as string

  useEffect(() => {
    if (!router.isReady || auth.isLoading) return

    const fetchCourseData = async () => {
      setIsLoading(true)
      try {
        if (courseName == undefined) {
          return
        }
        const response = await fetch(
          `/api/UIUC-api/getCourseExists?course_name=${courseName}`,
        )
        const data = await response.json()
        if (data) {
          const response = await fetch(
            `/api/UIUC-api/getAllCourseData?course_name=${courseName}`,
          )
          const data = await response.json()
          const courseData = data.distinct_files
          setCourseData(courseData)
        }
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

      posthog.capture('tool_page_visited', {
        course_name: courseName,
      })
    }
    fetchCourseData()
  }, [router.isReady, auth.isLoading, courseName])

  if (auth.isLoading) {
    return <LoadingPlaceholderForAdminPages />
  }

  if (!auth.isAuthenticated) {
    return <PermissionGate course_name={courseName as string} />
  }

  if (isLoading) {
    return <LoadingPlaceholderForAdminPages />
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

  if (courseData === null) {
    return (
      <MakeNewCoursePage
        project_name={courseName as string}
        current_user_email={user_emails[0] as string}
      />
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
