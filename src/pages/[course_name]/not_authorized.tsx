import { useAuth } from 'react-oidc-context'
import { type NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { CanViewOnlyCourse } from '~/components/UIUC-Components/CanViewOnlyCourse'
import { CannotViewCourse } from '~/components/UIUC-Components/CannotViewCourse'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'
import { get_user_permission } from '~/components/UIUC-Components/runAuthCheck'
import { type CourseMetadata } from '~/types/courseMetadata'
import { initiateSignIn } from '~/utils/authHelpers'

import { IconArrowBackUp } from '@tabler/icons-react'
import { Button } from '@mantine/core'

const NotAuthorizedPage: NextPage = () => {
  const router = useRouter()
  const auth = useAuth()

  const [componentToRender, setComponentToRender] =
    useState<React.ReactNode | null>(null)

  const getCurrentPageName = () => {
    return router.asPath.slice(1).split('/')[0] as string
  }

  useEffect(() => {
    if (auth.isLoading || !router.isReady) {
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

      if (courseMetadata.is_private && !auth.isAuthenticated) {
        void initiateSignIn(auth, `/${course_name}`)
        return
      }

      if (auth.isLoading) {
        console.log(
          'in [course_name]/index.tsx -- keycloak_user loaded and working :)',
        )
        if (courseMetadata != null) {
          const permission_str = get_user_permission(courseMetadata, auth)

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
          'in [course_name]/index.tsx -- keycloak_user NOT LOADED yet...',
        )
      }
    })
  }, [!auth.isLoading, router.isReady])

  if (auth.isLoading || !componentToRender) {
    console.debug('not_authorized.tsx -- Loading spinner')
    return (
      <MainPageBackground>
        <div className="flex h-full min-h-[16rem] w-full flex-col items-center justify-center p-4 text-[--foreground]">
          <img src="/media/error_sad_bot_illini_blue.png"></img>

          <div className="mt-4 font-semibold">
            Sorry, you don’t have access to this chatbot.
          </div>
          <div className="mt-1">
            Contact the project administrator for access.
          </div>

          <Button
            className={`
                mt-8 h-auto border
                border-[--dashboard-border] bg-transparent
                p-2 text-sm
                text-[--foreground] opacity-70
        
                hover:border-[--dashboard-button]
                hover:bg-transparent
                hover:text-[--dashboard-button]
                hover:opacity-100
              `}
            onClick={() => {
              router.push(`/`)
            }}
          >
            <IconArrowBackUp className="mr-1 text-sm" />
            <div>Return to Illinois Chat Home</div>
          </Button>
        </div>

        {/*        <LoadingSpinner /> */}
      </MainPageBackground>
    )
  }

  return <>{componentToRender}</>
}

export default NotAuthorizedPage
