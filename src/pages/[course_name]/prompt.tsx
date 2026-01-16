// src/pages/[course_name]/prompt.tsx
'use client'
import { type NextPage } from 'next'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

import { Card, Flex, Title } from '@mantine/core'
import { useAuth } from 'react-oidc-context'
import { PermissionGate } from '~/components/UIUC-Components/PermissionGate'
import { CannotEditGPT4Page } from '~/components/UIUC-Components/CannotEditGPT4'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import {
  LoadingPlaceholderForAdminPages,
  MainPageBackground,
} from '~/components/UIUC-Components/MainPageBackground'

import { Montserrat } from 'next/font/google'
import SettingsLayout, {
  getInitialCollapsedState,
} from '~/components/Layout/SettingsLayout'
import PromptEditor from '~/components/UIUC-Components/PromptEditor'
import { useResponsiveCardWidth } from '~/utils/responsiveGrid'
import GlobalFooter from '../../components/UIUC-Components/GlobalFooter'
import { type CourseMetadata } from '~/types/courseMetadata'
import { fetchCourseMetadata } from '~/utils/apiUtils'

const montserrat = Montserrat({
  weight: '700',
  subsets: ['latin'],
})

const CourseMain: NextPage = () => {
  const router = useRouter()

  const getCurrentPageName = () => {
    const raw = router.query.course_name
    return typeof raw === 'string'
      ? raw
      : Array.isArray(raw)
        ? raw[0]
        : undefined
  }
  const courseName = getCurrentPageName() as string

  const auth = useAuth()
  const isLoaded = !auth.isLoading
  const isSignedIn = auth.isAuthenticated
  const user = auth.user
  const [courseExists, setCourseExists] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    getInitialCollapsedState(),
  )
  const [errorType, setErrorType] = useState<401 | 403 | 404 | null>(null)

  const cardWidthClasses = useResponsiveCardWidth(sidebarCollapsed)

  useEffect(() => {
    if (!router.isReady || auth.isLoading) return
    const fetchCourseData = async () => {
      setIsLoading(true)
      const response = await fetch(
        `/api/UIUC-api/getCourseExists?course_name=${courseName}`,
      )
      const data = await response.json()
      setCourseExists(data)
      try {
        const fetchedMetadata: CourseMetadata = (await fetchCourseMetadata(
          courseName,
        )) as CourseMetadata
        if (fetchedMetadata === null) {
          setErrorType(404)
          return
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
    }
    fetchCourseData()
  }, [router.isReady, auth.isLoading, courseName])

  if (!isLoaded || isLoading) {
    return <LoadingPlaceholderForAdminPages />
  }

  if (!isSignedIn) {
    console.log('User not logged in', isSignedIn, isLoaded, courseName)
    return <PermissionGate course_name={courseName} />
  }

  const user_emails = user?.profile?.email ? [user.profile.email] : []

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

  // Don't edit certain special pages (no context allowed)
  if (
    courseName &&
    (courseName.toLowerCase() == 'gpt4' ||
      courseName.toLowerCase() == 'global' ||
      courseName.toLowerCase() == 'extreme')
  ) {
    return <CannotEditGPT4Page course_name={courseName as string} />
  }

  if (courseExists === null) {
    return (
      <MainPageBackground>
        <LoadingSpinner />
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
    <SettingsLayout
      course_name={courseName}
      sidebarCollapsed={sidebarCollapsed}
      setSidebarCollapsed={setSidebarCollapsed}
    >
      <main className="course-page-main min-w-screen flex min-h-screen flex-col items-center">
        <div className="items-left flex w-full flex-col justify-center py-0">
          <Flex direction="column" align="center" w="100%">
            <Card
              withBorder
              padding="none"
              radius="xl"
              className={`mt-[2%] ${cardWidthClasses}`}
              style={{
                backgroundColor: 'var(--background)',
                borderColor: 'var(--dashboard-border)',
              }}
            >
              <PromptEditor
                project_name={courseName}
                isEmbedded={false}
                showHeader={true}
                userEmail={user?.profile?.email as string}
              />
            </Card>
          </Flex>
        </div>
      </main>

      <GlobalFooter />
    </SettingsLayout>
  )
}

export default CourseMain
