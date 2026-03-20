import { useQuery } from '@tanstack/react-query'
import { type CourseMetadata } from '~/types/courseMetadata'

export type CourseWithMetadata = {
  course_name: string
  metadata: CourseMetadata
}

// MOCK DATA — Injected as fallback so "My Chatbots" is never empty during development.
const MOCK_MY_COURSES: CourseWithMetadata[] = [
  {
    course_name: 'cs201-study-buddy',
    metadata: {
      is_private: true,
      course_owner: 'bingjig2@illinois.edu',
      course_admins: [
        'bingjig2@illinois.edu',
        'emma.thompson@illinois.edu',
        'alex.rivera@illinois.edu',
      ],
      approved_emails_list: [],
      example_questions: [
        'Explain the difference between a stack and a queue',
        'How does a hash table handle collisions?',
        "Walk me through Dijkstra's algorithm",
      ],
      banner_image_s3: undefined,
      course_intro_message: 'Welcome! Ask me anything about data structures.',
      system_prompt: undefined,
      openai_api_key: undefined,
      disabled_models: undefined,
      project_description:
        'This personalized study assistant is trained on CS201 course materials, including lecture notes, textbook excerpts, and practice problems. It provides step-by-step explanations for complex data structures concepts like trees, graphs, and hash tables, and helps you prepare for exams with customized quizzes based on your learning progress.',
      documentsOnly: undefined,
      guidedLearning: undefined,
      systemPromptOnly: undefined,
      vector_search_rewrite_disabled: undefined,
      allow_logged_in_users: undefined,
      is_frozen: undefined,
    },
  },
  {
    course_name: 'research-assistant',
    metadata: {
      is_private: false,
      course_owner: 'bingjig2@illinois.edu',
      course_admins: ['bingjig2@illinois.edu', 'prof.zhang@illinois.edu'],
      approved_emails_list: [],
      example_questions: [
        'Summarize the key findings from the latest uploaded paper',
        'What are the main methodologies used in our dataset?',
      ],
      banner_image_s3: undefined,
      course_intro_message: undefined,
      system_prompt: undefined,
      openai_api_key: undefined,
      disabled_models: undefined,
      project_description:
        'A research companion for the AI Innovation lab. Indexes uploaded papers, grant proposals, and meeting notes to help you quickly find relevant prior work, generate literature review summaries, and draft methodology sections.',
      documentsOnly: undefined,
      guidedLearning: undefined,
      systemPromptOnly: undefined,
      vector_search_rewrite_disabled: undefined,
      allow_logged_in_users: true,
      is_frozen: undefined,
    },
  },
]

async function fetchAllCourseMetadata(): Promise<CourseWithMetadata[]> {
  const response = await fetch('/api/UIUC-api/getAllCourseMetadata')

  if (!response.ok) {
    throw new Error(`Error fetching course metadata: ${response.status}`)
  }

  const data: { [key: string]: CourseMetadata }[] = await response.json()

  const courses = data.map((entry) => {
    const courseName = Object.keys(entry)[0]!
    const metadata = entry[courseName]!

    // Ensure is_private is boolean (may come as string from Redis)
    if (typeof metadata.is_private === 'string') {
      metadata.is_private =
        (metadata.is_private as unknown as string).toLowerCase() === 'true'
    }

    return { course_name: courseName, metadata }
  })

  // MOCK FALLBACK — Append mock courses so "My Chatbots" is populated during dev.
  // Remove this block when real data is sufficient.
  return [...courses, ...MOCK_MY_COURSES]
}

export function useFetchAllCourseMetadata({ enabled = true } = {}) {
  return useQuery({
    queryKey: ['allCourseMetadata'],
    queryFn: fetchAllCourseMetadata,
    retry: 1,
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}
