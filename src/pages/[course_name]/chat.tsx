// export { default } from '~/pages/api/home'

import { useAuth } from 'react-oidc-context'
import { NextPage } from 'next'
import { useEffect, useState } from 'react'
import Home from '../api/home/home'
import { useRouter } from 'next/router'

import { CourseMetadata } from '~/types/courseMetadata'
import { get_user_permission } from '~/components/UIUC-Components/runAuthCheck'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import { montserrat_heading } from 'fonts'
import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'
import Head from 'next/head'
import { GUIDED_LEARNING_PROMPT } from '~/utils/app/const'
import { fetchCourseMetadata } from '~/utils/apiUtils'

const ChatPage: NextPage = () => {
  const auth = useAuth()
  const router = useRouter()
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
  const [urlDocumentsOnly, setUrlDocumentsOnly] = useState(false)
  const [urlSystemPromptOnly, setUrlSystemPromptOnly] = useState(false)
  const [documentCount, setDocumentCount] = useState<number | null>(null)
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  // UseEffect to check URL parameters
  useEffect(() => {
    const fetchData = async () => {
      if (!router.isReady) return

      // Get URL parameters
      const urlParams = new URLSearchParams(window.location.search)
      const guidedLearning = urlParams.get('guidedLearning') === 'true'
      const documentsOnly = urlParams.get('documentsOnly') === 'true'
      const systemPromptOnly = urlParams.get('systemPromptOnly') === 'true'

      // Update the state with URL parameters
      setUrlGuidedLearning(guidedLearning)
      setUrlDocumentsOnly(documentsOnly)
      setUrlSystemPromptOnly(systemPromptOnly)

      setIsLoading(true)
      setIsCourseMetadataLoading(true)

      // Special case: Cropwizard redirect
      if (
        ['cropwizard', 'cropwizard-1.0', 'cropwizard-1'].includes(
          courseName.toLowerCase(),
        )
      ) {
        await router.push(`/cropwizard-1.5/chat`)
      }

      // Fetch course metadata
      const metadataResponse = await fetch(
        `/api/UIUC-api/getCourseMetadata?course_name=${courseName}`,
      )
      const metadataData = await metadataResponse.json()

      // Log original course metadata settings without modifying them
      if (metadataData.course_metadata) {
        console.log('Course metadata settings:', {
          guidedLearning: metadataData.course_metadata.guidedLearning,
          documentsOnly: metadataData.course_metadata.documentsOnly,
          systemPromptOnly: metadataData.course_metadata.systemPromptOnly,
          system_prompt: metadataData.course_metadata.system_prompt,
        })
      }

      setCourseMetadata(metadataData.course_metadata)
      setIsCourseMetadataLoading(false)
      setIsLoading(false)
    }
    fetchData()
  }, [courseName, urlGuidedLearning, urlDocumentsOnly, urlSystemPromptOnly])

  // UseEffect to fetch document count in the background
  useEffect(() => {
    if (!courseName) return
    const fetchDocumentCount = async () => {
      try {
        const documentsResponse = await fetch(
          `/api/materialsTable/fetchProjectMaterials?from=0&to=0&course_name=${courseName}`,
        )
        const documentsData = await documentsResponse.json()
        setDocumentCount(documentsData.total_count || 0)
      } catch (error) {
        console.error('Error fetching document count:', error)
        setDocumentCount(0)
      }
    }
    fetchDocumentCount()
  }, [courseName])

  // UseEffect to check user permissions and fetch user email
  useEffect(() => {
    const checkAuthorization = async () => {
      if (!auth.isLoading && router.isReady) {
        const courseName = router.query.course_name as string

        try {
          // Fetch course metadata
          const metadata = await fetchCourseMetadata(courseName)
          console.log(metadata)
          if (!metadata) {
            router.replace(`/new?course_name=${courseName}`)
            return
          }

          // Check if course is public
          if (!metadata.is_private) {
            setIsAuthorized(true)
            // Set a default email for public access
            setCurrentEmail('')
            return
          }

          // If course is not public, proceed with normal auth flow
          if (!auth.isAuthenticated) {
            const currentPath = encodeURIComponent(router.asPath)
            router.push(`/sign-in?redirect=${currentPath}`)
            return
          }

          const permission = get_user_permission(metadata, auth)

          if (permission === 'no_permission') {
            router.replace(`/${courseName}/not_authorized`)
            return
          }

          setIsAuthorized(true)
          if (auth.user?.profile.email) {
            setCurrentEmail(auth.user.profile.email)
          }
        } catch (error) {
          console.error('Authorization check failed:', error)
          setIsAuthorized(false)
        }
      }
    }

    checkAuthorization()
  }, [auth.isLoading, auth.isAuthenticated, router.isReady])

  return (
    <>
      {!isLoading &&
        (currentEmail || !courseMetadata?.is_private) &&
        courseMetadata && (
          <Home
            current_email={currentEmail || ''}
            course_metadata={courseMetadata}
            course_name={courseName}
            document_count={documentCount}
            link_parameters={{
              guidedLearning: urlGuidedLearning,
              documentsOnly: urlDocumentsOnly,
              systemPromptOnly: urlSystemPromptOnly,
            }}
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
