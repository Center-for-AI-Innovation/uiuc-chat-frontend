// export { default } from '~/pages/api/home'

// import { useUser } from '@clerk/nextjs'
import { useAuth } from 'react-oidc-context'
import { NextPage } from 'next'
import { useEffect, useState } from 'react'
import Home from '../api/home/home'
import { useRouter } from 'next/router'
// import { extractEmailsFromClerk } from '~/components/UIUC-Components/clerkHelpers'
import { CourseMetadata } from '~/types/courseMetadata'
import { get_user_permission } from '~/components/UIUC-Components/runAuthCheck'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import { montserrat_heading } from 'fonts'
import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'
import Head from 'next/head'
import { GUIDED_LEARNING_PROMPT } from '~/utils/app/const'

const ChatPage: NextPage = () => {
  // const clerk_user_outer = useUser()
  // const { user, isLoaded, isSignedIn } = clerk_user_outer
  const auth = useAuth()
  const user = auth.user
  const isLoaded = !auth.isLoading
  const isSignedIn = auth.isAuthenticated
  const router = useRouter()
  const curr_route_path = router.asPath as string
  const getCurrentPageName = () => {
    return router.query.course_name as string
  }
  const courseName = getCurrentPageName() as string
  const [currentEmail, setCurrentEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [courseMetadata, setCourseMetadata] = useState<CourseMetadata | null>(
    null,
  )
  const [isCourseMetadataLoading, setIsCourseMetadataLoading] = useState(true)
  const [urlGuidedLearning, setUrlGuidedLearning] = useState(false)

  // UseEffect to check URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const guidedLearningParam = urlParams.get('guided_learning')
    console.log('Guided learning param:', guidedLearningParam)
    setUrlGuidedLearning(guidedLearningParam === 'true')
  }, [router.query])

  // UseEffect to fetch course metadata
  useEffect(() => {
    if (!courseName && curr_route_path != '/gpt4') return
    const courseMetadata = async () => {
      console.log('Fetching course metadata for:', courseName)
      setIsLoading(true) // Set loading to true before fetching data

      // Handle /gpt4 page (special non-course page)
      let curr_course_name = courseName
      if (courseName == '/gpt4') {
        curr_course_name = 'gpt4'
      }

      const response = await fetch(
        `/api/UIUC-api/getCourseMetadata?course_name=${curr_course_name}`,
      )
      const data = await response.json()
      console.log('Received course metadata:', data)
      
      // If URL guided learning is enabled and course-wide guided learning is not,
      // append the GUIDED_LEARNING_PROMPT to the system prompt if it's not already there
      if (data.course_metadata && !data.course_metadata.guidedLearning) {
        const urlParams = new URLSearchParams(window.location.search)
        const guidedLearningParam = urlParams.get('guided_learning')
        if (guidedLearningParam === 'true' && 
            data.course_metadata.system_prompt && 
            !data.course_metadata.system_prompt.includes(GUIDED_LEARNING_PROMPT)) {
          console.log('Adding guided learning prompt to system prompt')
          data.course_metadata.system_prompt = data.course_metadata.system_prompt + GUIDED_LEARNING_PROMPT
        }
      }
      
      setCourseMetadata(data.course_metadata)
      // console.log("Course Metadata in home: ", data.course_metadata)
      setIsCourseMetadataLoading(false)
      setIsLoading(false) // Set loading to false after fetching data
    }
    courseMetadata()
  }, [courseName, urlGuidedLearning])

  // UseEffect to check user permissions and fetch user email
  useEffect(() => {
    console.log('Checking user permissions. Auth loaded:', !auth.isLoading, 'Metadata loading:', isCourseMetadataLoading)
    if (!isLoaded || isCourseMetadataLoading) {
      return
    }
    // if (clerk_user_outer.isLoaded || isCourseMetadataLoading) {
      if (courseMetadata != null) {
        // const permission_str = get_user_permission(
        //   courseMetadata,
        //   clerk_user_outer,
        //   router,
        // )
        const permission_str = get_user_permission(
          courseMetadata,
          auth,
        )
        console.log('User permission:', permission_str)
        if (auth.user?.profile.email) {
          setCurrentEmail(auth.user.profile.email)
        }
        if (permission_str == 'edit' || permission_str == 'view') {
        } else {
          console.log('User not authorized, redirecting')
          router.replace(`/${courseName}/not_authorized`)
        }
      } else {
        // 🆕 MAKE A NEW COURSE
        console.log('Course does not exist, redirecting to materials page')
        router.push(`/${courseName}/dashboard`)
      }
      // console.log(
      //   'Changing user email to: ',
      //   extractEmailsFromClerk(clerk_user_outer.user)[0],
      // )
      // This will not work because setUserEmail is async
      // setUserEmail(extractEmailsFromClerk(clerk_user_outer.user)[0] as string)
      // const email = extractEmailsFromClerk(user)[0]
      // if (email) {
      //   setCurrentEmail(email)
      //   // console.log('setting user email: ', user)
      //   // console.log('type of user: ', typeof user)
      // } else {
      //   const key = process.env.NEXT_PUBLIC_POSTHOG_KEY as string
      //   // console.log('key: ', key)
      //   const postHogUserObj = localStorage.getItem('ph_' + key + '_posthog')
      //   // console.log('posthog user obj: ', postHogUserObj)
      //   if (postHogUserObj) {
      //     const postHogUser = JSON.parse(postHogUserObj)
      //     setCurrentEmail(postHogUser.distinct_id)
      //     console.log(
      //       'setting user email as posthog user: ',
      //       postHogUser.distinct_id,
      //     )
      //   } else {
      //     // When user is not logged in and posthog user is not found, what to do?
      //     // This is where page will not load
      //   }
      //}
    //}
  }, [auth.isLoading, isCourseMetadataLoading, auth.user, auth.isAuthenticated])

  return (
    <>
      {!isLoading && currentEmail && courseMetadata && (
        <Home
          current_email={currentEmail}
          course_metadata={courseMetadata}
          course_name={courseName}
        />
      )}
      {isLoading && !currentEmail && (
        <MainPageBackground>
          <div
            className={`flex items-center justify-center font-montserratHeading ${montserrat_heading.variable}`}
          >
            <span className="mr-2">Warming up the knowledge engines...</span>
            <LoadingSpinner size="sm" />
          </div>
        </MainPageBackground>
      )}
    </>
  )
}

export default ChatPage
