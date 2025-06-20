// export { default } from '~/pages/api/home'

import { useAuth } from 'react-oidc-context'
import { type NextPage } from 'next'
import { useEffect, useState } from 'react'
import Home from '../api/home/home'
import { useRouter } from 'next/router'
import { v4 as uuidv4 } from 'uuid'

import { type CourseMetadata, type CustomSystemPrompt } from '~/types/courseMetadata'
import { get_user_permission } from '~/components/UIUC-Components/runAuthCheck'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import { montserrat_heading } from 'fonts'
import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'
import { fetchCourseMetadata } from '~/utils/apiUtils'
import { OpenAIModels, OpenAIModelID } from '~/utils/modelProviders/types/openai'
import { DEFAULT_TEMPERATURE } from '~/utils/app/const'

const ChatPage: NextPage = () => {
  const auth = useAuth()
  const router = useRouter()
  const getCurrentPageName = () => {
    return router.query.course_name as string
  }
  const courseName = getCurrentPageName() as string
  const [currentEmail, setCurrentEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [courseMetadata, setCourseMetadata] = useState<CourseMetadata | null>(null)
  const [isCourseMetadataLoading, setIsCourseMetadataLoading] = useState(true)
  const [urlGuidedLearning, setUrlGuidedLearning] = useState(false)
  const [urlDocumentsOnly, setUrlDocumentsOnly] = useState(false)
  const [urlSystemPromptOnly, setUrlSystemPromptOnly] = useState(false)
  const [urlActivePrompt, setUrlActivePrompt] = useState<string | null>(null)
  const [documentCount, setDocumentCount] = useState<number | null>(null)
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [sharedConversationId, setSharedConversationId] = useState<string | null>(null)
  const [isReadOnly, setIsReadOnly] = useState(false)

  // UseEffect to check URL parameters and fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      if (!router.isReady) return

      setIsLoading(true)
      setIsCourseMetadataLoading(true)

      // Get URL parameters
      const urlParams = new URLSearchParams(window.location.search)
      const guidedLearning = urlParams.get('guidedLearning') === 'true'
      const documentsOnly = urlParams.get('documentsOnly') === 'true'
      const systemPromptOnly = urlParams.get('systemPromptOnly') === 'true'
      const gptId = urlParams.get('gpt')
      const conversationId = urlParams.get('conversation')

      // Update the state with boolean URL parameters
      setUrlGuidedLearning(guidedLearning)
      setUrlDocumentsOnly(documentsOnly)
      setUrlSystemPromptOnly(systemPromptOnly)
      setUrlActivePrompt(gptId)
      setSharedConversationId(conversationId)

      // Special case: Cropwizard redirect
      if (['cropwizard', 'cropwizard-1.0', 'cropwizard-1'].includes(courseName.toLowerCase())) {
        await router.push(`/cropwizard-1.5`)
        setIsLoading(false)
        setIsCourseMetadataLoading(false)
        return
      }

      // Fetch course metadata from Redis using course name
      const metadataResponse = await fetch(`/api/UIUC-api/getCourseMetadata?course_name=${courseName}`)
      const metadataData = await metadataResponse.json()
      let fetchedCourseMetadata: CourseMetadata | null = metadataData.course_metadata

      if (fetchedCourseMetadata) {
        console.log('Course metadata from Redis:', {
          courseName,
          guidedLearning: fetchedCourseMetadata.guidedLearning,
          documentsOnly: fetchedCourseMetadata.documentsOnly,
          systemPromptOnly: fetchedCourseMetadata.systemPromptOnly,
          system_prompt: fetchedCourseMetadata.system_prompt,
          custom_system_prompts_count: fetchedCourseMetadata.custom_system_prompts?.length ?? 0
        })

        // Override system prompt if gptId is present and valid
        if (gptId && fetchedCourseMetadata.custom_system_prompts) {
          // First try to find by gpt_id, then fall back to id
          const customPrompt = fetchedCourseMetadata.custom_system_prompts.find(
            (p: CustomSystemPrompt) => p.gpt_id === gptId || p.id === gptId
          )
          
          if (customPrompt) {
            console.log('Found custom prompt in Redis for course:', courseName, customPrompt)
            fetchedCourseMetadata = {
              ...fetchedCourseMetadata,
              system_prompt: customPrompt.promptText,
              document_group: customPrompt.documentGroups?.[0] || undefined,
              tool: customPrompt.tools?.[0] || undefined,
            }
          }
        }

        // If there's a shared conversation ID, determine read-only mode based on user permissions
        if (conversationId && fetchedCourseMetadata) {
          try {
            // Use get_user_permission to determine if user has edit access to the course
            const permission = get_user_permission(fetchedCourseMetadata, auth)
            
            // Set read-only mode if user doesn't have edit permission
            // Only course owners and admins can edit shared conversations
            setIsReadOnly(permission !== 'edit')
          } catch (error) {
            console.error('Error checking user permissions for shared conversation:', error)
            setIsReadOnly(true) // Default to read-only if there's an error
          }
        }
      }

      setCourseMetadata(fetchedCourseMetadata)
      setIsCourseMetadataLoading(false)
      setIsLoading(false)
    }
    fetchData()
  }, [courseName, router.isReady, auth.user?.profile.email])

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
      // console.log('Starting authorization check', {
      //   isAuthLoading: auth.isLoading,
      //   isRouterReady: router.isReady,
      //   authUser: auth.user?.profile.email || 'No user email',
      // })

      if (!auth.isLoading && router.isReady) {
        const courseName = router.query.course_name as string
        try {
          // Fetch course metadata
          const metadata = await fetchCourseMetadata(courseName)

          if (!metadata) {
            router.replace(`/new?course_name=${courseName}`)
            return
          }

          // Check if course is public
          if (!metadata.is_private) {
            setIsAuthorized(true)

            // Set email for public access
            if (auth.user?.profile.email) {
              setCurrentEmail(auth.user.profile.email)
            } else {
              // Use PostHog ID when user is not logged in for public courses
              const key = process.env.NEXT_PUBLIC_POSTHOG_KEY as string
              const postHogUserObj = localStorage.getItem(
                'ph_' + key + '_posthog',
              )

              if (postHogUserObj) {
                const postHogUser = JSON.parse(postHogUserObj)
                setCurrentEmail(postHogUser.distinct_id)
              } else {
                // When user is not logged in and posthog user is not found
                setCurrentEmail('')
              }
            }
            return
          } else {
            // For private courses, user must be authenticated
            if (!auth.isAuthenticated) {
              router.replace(`/${courseName}/not_authorized`)
              return
            }

            // Set email for authenticated users
            if (auth.user?.profile.email) {
              setCurrentEmail(auth.user.profile.email)
            } else {
              console.error('Authenticated user has no email')
              router.replace(`/${courseName}/not_authorized`)
              return
            }
          }

          const permission = get_user_permission(metadata, auth)

          if (permission === 'no_permission') {
            router.replace(`/${courseName}/not_authorized`)
            return
          }

          setIsAuthorized(true)
        } catch (error) {
          console.error('Authorization check failed:', error)
          setIsAuthorized(false)
        }
      }
    }

    checkAuthorization()
  }, [auth.isLoading, auth.isAuthenticated, router.isReady, auth, router])

  return (
    <>
      {!isLoading &&
        !auth.isLoading &&
        router.isReady &&
        ((currentEmail && currentEmail !== '') ||
          !courseMetadata?.is_private) &&
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
            isReadOnly={isReadOnly}
            sharedConversationId={sharedConversationId}
          />
        )}
      {isLoading ||
        !currentEmail ||
        (currentEmail === '' && (
          <MainPageBackground>
            <div
              className={`flex items-center justify-center font-montserratHeading ${montserrat_heading.variable}`}
            >
              <span className="mr-2">Warming up the knowledge engines...</span>
              <LoadingSpinner size="sm" />
            </div>
          </MainPageBackground>
        ))}
    </>
  )
}

export default ChatPage
