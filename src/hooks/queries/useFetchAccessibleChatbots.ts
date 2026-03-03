import { useQuery } from '@tanstack/react-query'
import { type AccessibleChatbotData } from '~/components/UIUC-Components/chatbots-hub/chatbots.types'

// MOCK DATA — Replace with real API call when the accessible-chatbots endpoint exists.
const MOCK_ACCESSIBLE_CHATBOTS: AccessibleChatbotData[] = [
  // Course Assistants (Course type, unlisted access)
  {
    course_name: 'cs-101-intro-to-programming',
    title: 'CS 101 – Intro to Programming',
    description:
      'Get help with Python fundamentals, debugging, and homework problems for CS 101.',
    owner: 'prof.smith@illinois.edu',
    collaboratorCount: 2,
    projectType: 'Course',
    accessLevel: 'unlisted',
    organization: 'Computer Science',
  },
  {
    course_name: 'phys-211-mechanics',
    title: 'PHYS 211 – University Physics: Mechanics',
    description:
      'Ask questions about Newtonian mechanics, kinematics, and energy conservation.',
    owner: 'dr.jones@illinois.edu',
    collaboratorCount: 1,
    projectType: 'Course',
    accessLevel: 'unlisted',
    organization: 'Physics',
  },
  {
    course_name: 'math-241-calculus-iii',
    title: 'MATH 241 – Calculus III',
    description:
      'Multivariable calculus help: partial derivatives, multiple integrals, and vector fields.',
    owner: 'ta.williams@illinois.edu',
    collaboratorCount: 3,
    projectType: 'Course',
    accessLevel: 'unlisted',
    organization: 'Mathematics',
  },

  // Department Resources (Department type, public access)
  {
    course_name: 'grainger-engineering-advising',
    title: 'Grainger Engineering Advising',
    description:
      'Academic advising assistant for Grainger College of Engineering students.',
    owner: 'advising@grainger.illinois.edu',
    collaboratorCount: 4,
    projectType: 'Department',
    accessLevel: 'public',
    organization: 'Grainger Engineering',
  },
  {
    course_name: 'library-research-helper',
    title: 'Library Research Helper',
    description:
      'Find databases, journals, and citation resources across UIUC libraries.',
    owner: 'library@illinois.edu',
    collaboratorCount: 2,
    projectType: 'Department',
    accessLevel: 'public',
    organization: 'University Library',
  },

  // Public Bots (Student Org. / Entertainment types, public access)
  {
    course_name: 'acm-interview-prep',
    title: 'ACM Interview Prep',
    description:
      'Practice coding interview questions and get hints from the ACM chapter bot.',
    owner: 'acm@illinois.edu',
    collaboratorCount: 3,
    projectType: 'Student Org.',
    accessLevel: 'public',
    organization: 'ACM @ UIUC',
  },
  {
    course_name: 'illini-trivia',
    title: 'Illini Trivia',
    description:
      'Test your knowledge of UIUC history, traditions, and campus facts!',
    owner: 'trivia@illinois.edu',
    collaboratorCount: 0,
    projectType: 'Entertainment',
    accessLevel: 'public',
    organization: 'Entertainment',
  },
  {
    course_name: 'rso-event-finder',
    title: 'RSO Event Finder',
    description:
      'Discover upcoming student organization events, meetings, and socials on campus.',
    owner: 'student-affairs@illinois.edu',
    collaboratorCount: 1,
    projectType: 'Student Org.',
    accessLevel: 'public',
    organization: 'Student Affairs',
  },
]

// MOCK — Simulates an API call with a short delay.
async function fetchAccessibleChatbots(): Promise<AccessibleChatbotData[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return MOCK_ACCESSIBLE_CHATBOTS
}

export function useFetchAccessibleChatbots({ enabled = true } = {}) {
  return useQuery({
    queryKey: ['accessibleChatbots'],
    queryFn: fetchAccessibleChatbots,
    retry: 1,
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}
