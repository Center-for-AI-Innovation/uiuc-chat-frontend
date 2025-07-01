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
import { AuthComponent } from '~/components/UIUC-Components/AuthToEditCourse'
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

  const GetCurrentPageName = () => {
    // return router.asPath.slice(1).split('/')[0]
    // Possible improvement.
    return router.query.course_name as string
  }
  const auth = useAuth()

  const course_name = GetCurrentPageName() as string

  const [courseData, setCourseData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCourseData = async () => {
      if (course_name == undefined) {
        return
      }
      const response = await fetch(
        `/api/UIUC-api/getCourseExists?course_name=${course_name}`,
      )
      const data = await response.json()
      if (data) {
        const response = await fetch(
          `/api/UIUC-api/getAllCourseData?course_name=${course_name}`,
        )
        const data = await response.json()
        const courseData = data.distinct_files
        setCourseData(courseData)
      }
      setIsLoading(false)

      posthog.capture('tool_page_visited', {
        course_name: course_name,
      })
    }
    fetchCourseData()
  }, [router.isReady])

  if (auth.isLoading) {
    return <LoadingPlaceholderForAdminPages />
  }

  if (!auth.isAuthenticated) {
    void router.push(`/new?course_name=${course_name}`)
    return (
      <ProtectedRoute>
        <AuthComponent course_name={course_name} />
      </ProtectedRoute>
    )
  }

  if (isLoading) {
    return <LoadingPlaceholderForAdminPages />
  }

  const user_emails = auth.user?.profile?.email ? [auth.user.profile.email] : []

  // if their account is somehow broken (with no email address)

  // Don't edit certain special pages (no context allowed)
  if (
    course_name &&
    (course_name.toLowerCase() == 'gpt4' ||
      course_name.toLowerCase() == 'global' ||
      course_name.toLowerCase() == 'extreme')
  ) {
    return <CannotEditGPT4Page course_name={course_name as string} />
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
        project_name={course_name as string}
        current_user_email={user_emails[0] as string}
      />
    )
  }

  return (
    <>
      <MakeToolsPage course_name={course_name as string} />
    </>
  )
}
export default ToolsPage
