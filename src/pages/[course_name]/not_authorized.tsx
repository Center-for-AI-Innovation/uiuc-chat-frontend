import { useUser } from '@clerk/nextjs'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { CanViewOnlyCourse } from '~/components/UIUC-Components/CanViewOnlyCourse'
import { CannotViewCourse } from '~/components/UIUC-Components/CannotViewCourse'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'
import { get_user_permission } from '~/components/UIUC-Components/runAuthCheck'
import { CourseMetadata } from '~/types/courseMetadata'

const NotAuthorizedPage: NextPage = () => {
  const router = useRouter()
  const clerk_user = useUser()
  const [componentToRender, setComponentToRender] =
    useState<React.ReactNode | null>(null)

  const getCurrentPageName = () => {
    return router.asPath.slice(1).split('/')[0] as string
  }

  useEffect(() => {
    if (!clerk_user.isLoaded || !router.isReady) {
      return
    }
    const course_name = getCurrentPageName()

    async function fetchCourseMetadata(course_name: string) {
      try {
        const response = await fetch(
          `/api/UIUC-api/getCourseMetadata?course_name=${course_name}`,
        )

        // TODO: replace this with the util functions for fetchCourseMetadata() and with get_user_permission()
        if (response.ok) {
          const data = await response.json()
          if (data.success === false) {
            console.error(
              'not_authorized.tsx -- An error occurred while fetching course metadata',
            )
            return null
          }
          return data.course_metadata
        } else {
          console.error(`Error fetching course metadata: ${response.status}`)
          return null
        }
      } catch (error) {
        console.error('Error fetching course metadata:', error)
        return null
      }
    }

    fetchCourseMetadata(course_name).then((courseMetadata) => {
      if (courseMetadata == null) {
        console.log('Course does not exist, redirecting to materials page')
        router.replace(`/${course_name}/dashboard`)
        return
      }

      if (courseMetadata.is_private && !clerk_user.isSignedIn) {
        console.log(
          'User not logged in',
          clerk_user.isSignedIn,
          clerk_user.isLoaded,
          course_name,
        )
        router.replace(`/sign-in?${course_name}`)
        return
      }

      if (clerk_user.isLoaded) {
        console.log(
          'in [course_name]/index.tsx -- clerk_user loaded and working :)',
        )
        if (courseMetadata != null) {
          const permission_str = get_user_permission(
            courseMetadata,
            clerk_user,
            router,
          )

          console.log(
            'in [course_name]/index.tsx -- permission_str',
            permission_str,
          )

          if (permission_str == 'edit') {
            console.log(
              'in [course_name]/index.tsx - Course exists & user is properly authed, CanViewOnlyCourse',
            )
            router.push(`/${course_name}/dashboard`)
          } else if (permission_str == 'view') {
            setComponentToRender(
              <CanViewOnlyCourse
                course_name={course_name}
                course_metadata={courseMetadata as CourseMetadata}
              />,
            )
          } else {
            setComponentToRender(<CannotViewCourse course_name={course_name} />)
          }
        } else {
          console.log('Course does not exist, redirecting to materials page')
          router.push(`/${course_name}/dashboard`)
        }
      } else {
        console.log(
          'in [course_name]/index.tsx -- clerk_user NOT LOADED yet...',
        )
      }
    })
  }, [clerk_user.isLoaded, router.isReady])

  if (!clerk_user.isLoaded || !componentToRender) {
    console.debug('not_authorized.tsx -- Loading spinner')
    return (
      <MainPageBackground>
        <LoadingSpinner />
      </MainPageBackground>
    )
  }

  return <>{componentToRender}</>
}

export default NotAuthorizedPage
