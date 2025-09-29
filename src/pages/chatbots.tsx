import { useRouter } from 'next/router'
import React, { useEffect } from 'react'
import Dashboard from '~/components/UIUC-Components/Dashboard'

import { useAuth } from 'react-oidc-context'
import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import { AuthComponent } from '~/components/UIUC-Components/AuthToEditCourse'

const DashboardPage = () => {
  const router = useRouter()

  const auth = useAuth()
  const { course_name } = router.query

  if (auth.isLoading) {
    return (
      <MainPageBackground>
        <LoadingSpinner />
      </MainPageBackground>
    )
  }

  if (!auth.isAuthenticated) {
    console.log(
      'User not logged in',
      auth.isAuthenticated,
      auth.isLoading,
      'NewCoursePage',
    )
    return (
      <AuthComponent
        course_name={course_name ? (course_name as string) : 'new'}
      />
    )
  }

  const user_email = auth.user?.profile.email

  return (
    <Dashboard
      project_name={course_name as string}
      current_user_email={user_email as string}
    />
  )
}

export default DashboardPage
