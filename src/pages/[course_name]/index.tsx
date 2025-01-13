// src/pages/[course_name]/index.tsx
import { type NextPage } from 'next'
import { useAuth } from 'react-oidc-context'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { type CourseMetadata } from '~/types/courseMetadata'
// import { useUser } from '@clerk/nextjs'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import { get_user_permission } from '~/components/UIUC-Components/runAuthCheck'
import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'
import { fetchCourseMetadata } from '~/utils/apiUtils'

const AUTH_ROUTES = ['sign-in', 'sign-up']

const IfCourseExists: NextPage = () => {
  const router = useRouter()
  // const user = useUser()
  const auth = useAuth()
  const { course_name } = router.query
  console.log("!!", course_name)
  if (typeof course_name === 'string' && AUTH_ROUTES.includes(course_name)) {
    if (auth.isAuthenticated) {
      void router.replace('/')
    } else {
      void auth.signinRedirect(
        course_name === 'sign-up' 
          ? { extraQueryParams: { kc_action: 'register' }}
          : undefined
      )
    }
    return null
  }
  const [courseName, setCourseName] = useState<string | null>(null)
  const [courseMetadataIsLoaded, setCourseMetadataIsLoaded] = useState(false)
  const [courseMetadata, setCourseMetadata] = useState<CourseMetadata | null>(
    null,
  )
  const getCurrentPageName = () => {
    return router.query.course_name as string
  }

  useEffect(() => {
    if (!router.isReady) return

    const fetchMetadata = async () => {
      const course_name = getCurrentPageName()
      const metadata: CourseMetadata = await fetchCourseMetadata(course_name)

      if (metadata === null) {
        await router.replace('/new?course_name=' + course_name)
        return
      }

      if (!metadata.is_private) {
        // Public -- redirect as quickly as possible!
        await router.replace(`/${course_name}/chat`)
        return
      }
      setCourseName(course_name)
      setCourseMetadata(metadata)
      setCourseMetadataIsLoaded(true)
    }
    fetchMetadata()
  }, [router.isReady])

  useEffect(() => {
    const checkAuth = async () => {
      // AUTH
      // if (courseMetadata && user.isLoaded) {
      if (courseMetadata && !auth.isLoading) {
        // const permission_str = get_user_permission(courseMetadata, user, router)
        const permission_str = get_user_permission(
          courseMetadata,
          {
            isAuthenticated: auth.isAuthenticated,
            user: {
              email: auth.user?.profile.email,
            },
          },
          router
        )

        if (permission_str === 'edit' || permission_str === 'view') {
          console.debug('Can view or edit')
          await router.replace(`/${courseName}/chat`)
          return
        } else {
          console.debug(
            'User does not have edit permissions, redirecting to not authorized page, permission: ',
            permission_str,
          )
          await router.replace(`/${courseName}/not_authorized`)
          return
        }
      }
    }
    checkAuth()
      // }, [user.isLoaded, courseMetadata, courseMetadataIsLoaded])
  }, [auth.isLoading, auth.isAuthenticated, courseMetadata, courseMetadataIsLoaded])


  return (
    <MainPageBackground>
      <LoadingSpinner />
    </MainPageBackground>
  )
}
export default IfCourseExists
