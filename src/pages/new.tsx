import { useRouter } from 'next/router'
import React, { useEffect } from 'react'
import MakeNewCoursePage from '~/components/UIUC-Components/MakeNewCoursePage'
// import { extractEmailsFromClerk } from '~/components/UIUC-Components/clerkHelpers'
// import { useUser } from '@clerk/nextjs'
import { useAuth } from 'react-oidc-context'
import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import { AuthComponent } from '~/components/UIUC-Components/AuthToEditCourse'

const NewCoursePage = () => {
  const router = useRouter()
  // const { user, isLoaded, isSignedIn } = useUser()
  const auth = useAuth()
  const { course_name } = router.query

  useEffect(() => {
    // You can add any additional logic you need here, such as fetching data based on the course_name
  }, [course_name])

  // if (!isLoaded) {
  if (auth.isLoading) {
    return (
      <MainPageBackground>
        <LoadingSpinner />
      </MainPageBackground>
    )
  }

  // if (!isSignedIn) {
  if (!auth.isAuthenticated) {
    // console.log('User not logged in', isSignedIn, isLoaded, 'NewCoursePage')
    console.log('User not logged in', auth.isAuthenticated, auth.isLoading, 'NewCoursePage')
    return (
      <AuthComponent
        course_name={course_name ? (course_name as string) : 'new'}
      />
    )
  }

  // const user_emails = extractEmailsFromClerk(user)
  const user_email = auth.user?.profile.email

  return (
    <MakeNewCoursePage
      project_name={course_name as string}
      current_user_email={user_email as string}
      is_new_course={true}
    />
  )
}

export default NewCoursePage
