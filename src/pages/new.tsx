import { useRouter } from 'next/router'
import React, { useEffect } from 'react'
import MakeNewCoursePage from '~/components/UIUC-Components/MakeNewCoursePage'
import { extractEmailsFromClerk } from '~/components/UIUC-Components/clerkHelpers'
import { useUser } from '@clerk/nextjs'
import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import { AuthComponent } from '~/components/UIUC-Components/AuthToEditCourse'

const NewCoursePage = () => {
  const router = useRouter()
  const { user, isLoaded, isSignedIn } = useUser()
  const { course_name } = router.query

  useEffect(() => {
    // You can add any additional logic you need here, such as fetching data based on the course_name
  }, [course_name])

  if (!isLoaded) {
    return (
      <MainPageBackground>
        <LoadingSpinner />
      </MainPageBackground>
    )
  }

  if (!isSignedIn) {
    console.log('User not logged in', isSignedIn, isLoaded, 'NewCoursePage')
    return (
      <AuthComponent
        course_name={course_name ? (course_name as string) : 'new'}
      />
    )
  }

  const user_emails = extractEmailsFromClerk(user)

  return (
    <MakeNewCoursePage
      project_name={course_name as string}
      current_user_email={user_emails[0] as string}
      is_new_course={true}
    />
  )
}

export default NewCoursePage
