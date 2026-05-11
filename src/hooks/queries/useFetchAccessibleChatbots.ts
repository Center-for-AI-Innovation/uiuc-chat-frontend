import { useQuery } from '@tanstack/react-query'
import { type AccessibleChatbotData } from '~/components/UIUC-Components/chatbots-hub/chatbots.types'
import { type CourseMetadata } from '~/types/courseMetadata'

/** Shared base metadata so each mock entry only overrides what differs. */
const BASE_METADATA: CourseMetadata = {
  is_private: false,
  course_owner: '',
  course_admins: [],
  approved_emails_list: [],
  example_questions: undefined,
  banner_image_s3: undefined,
  course_intro_message: undefined,
  system_prompt: undefined,
  openai_api_key: undefined,
  disabled_models: undefined,
  project_description: undefined,
  documentsOnly: undefined,
  guidedLearning: undefined,
  systemPromptOnly: undefined,
  vector_search_rewrite_disabled: undefined,
  allow_logged_in_users: undefined,
  is_frozen: undefined,
}

// MOCK DATA — Replace with real API call when the accessible-chatbots endpoint exists.
const MOCK_ACCESSIBLE_CHATBOTS: AccessibleChatbotData[] = [
  // Course Assistants (Course type, unlisted access)
  {
    course_name: 'my bot',
    title: 'My Bot',
    description: 'Get help with your bot.',
    owner: 'bingjig2@illinois.edu',
    collaboratorCount: 0,
    projectType: 'Course',
    accessLevel: 'private',
    metadata: {
      ...BASE_METADATA,
      course_owner: 'bingjig2@illinois.edu',
      project_description:
        'My bot is a private bot that is only accessible to me.',
    },
    knowledgeSources: [
      {
        name: 'Lecture Slides',
        description: 'Weekly lecture slides covering Python basics through OOP',
        doc_count: 28,
      },
      {
        name: 'Homework Solutions',
        description: 'Reference solutions for homework assignments 1–12',
        doc_count: 12,
      },
      {
        name: 'Python Documentation',
        description: 'Official Python 3.12 standard library docs',
        doc_count: 45,
      },
    ],
  },
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
    metadata: {
      ...BASE_METADATA,
      course_owner: 'prof.smith@illinois.edu',
      course_admins: [
        'prof.smith@illinois.edu',
        'ta.chen@illinois.edu',
        'ta.patel@illinois.edu',
      ],
      project_description:
        'A comprehensive Python programming assistant for CS 101 students. Covers variables, loops, functions, data structures, and object-oriented programming. Provides step-by-step debugging guidance and explains common error messages in beginner-friendly language.',
    },
    knowledgeSources: [
      {
        name: 'Lecture Slides',
        description: 'Weekly lecture slides covering Python basics through OOP',
        doc_count: 28,
      },
      {
        name: 'Homework Solutions',
        description: 'Reference solutions for homework assignments 1–12',
        doc_count: 12,
      },
      {
        name: 'Python Documentation',
        description: 'Official Python 3.12 standard library docs',
        doc_count: 45,
      },
    ],
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
    metadata: {
      ...BASE_METADATA,
      course_owner: 'dr.jones@illinois.edu',
      course_admins: ['dr.jones@illinois.edu', 'grader.kim@illinois.edu'],
      project_description:
        "Your physics problem-solving companion for PHYS 211. Breaks down free-body diagrams, Newton's laws, work-energy theorem, and conservation of momentum into clear, step-by-step solutions. Includes dimensional analysis checks and common mistake warnings.",
    },
    knowledgeSources: [
      {
        name: 'Textbook Chapters',
        description: 'University Physics by Young & Freedman, chapters 1–14',
        doc_count: 14,
      },
      {
        name: 'Lab Manuals',
        description: 'Guided lab procedures and pre-lab questions',
        doc_count: 10,
      },
    ],
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
    metadata: {
      ...BASE_METADATA,
      course_owner: 'ta.williams@illinois.edu',
      course_admins: [
        'ta.williams@illinois.edu',
        'prof.garcia@illinois.edu',
        'ta.nguyen@illinois.edu',
        'ta.okafor@illinois.edu',
      ],
      project_description:
        'Your dedicated multivariable calculus companion that breaks down complex 3D visualization problems, partial derivatives, and triple integrals into manageable steps. Features interactive problem-solving with visual aids and detailed explanations of common mistakes.',
    },
    knowledgeSources: [
      {
        name: 'Calculus III Course Notes',
        description:
          'Comprehensive notes from Prof. Zhang covering vectors, partial derivatives, and multiple integrals',
        doc_count: 32,
      },
      {
        name: 'Practice Problem Sets',
        description:
          'Weekly homework assignments with detailed solution guides',
        doc_count: 24,
      },
      {
        name: 'Exam Review Packets',
        description:
          'Past midterm and final exam problems with worked solutions',
        doc_count: 8,
      },
    ],
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
    metadata: {
      ...BASE_METADATA,
      course_owner: 'advising@grainger.illinois.edu',
      course_admins: [
        'advising@grainger.illinois.edu',
        'dean.roberts@grainger.illinois.edu',
        'advisor.lee@grainger.illinois.edu',
        'advisor.martinez@grainger.illinois.edu',
        'advisor.thompson@grainger.illinois.edu',
      ],
      project_description:
        'An AI-powered advising assistant for Grainger College of Engineering students. Answers questions about degree requirements, course prerequisites, registration deadlines, minor/double-major options, and connects students with the right human advisor for complex situations.',
    },
    knowledgeSources: [
      {
        name: 'Degree Requirements',
        description:
          'Current degree audits and requirement sheets for all engineering majors',
        doc_count: 18,
      },
      {
        name: 'Course Catalog',
        description:
          'Full engineering course catalog with prerequisites and descriptions',
        doc_count: 156,
      },
      {
        name: 'Advising FAQs',
        description:
          'Commonly asked questions about registration, transfers, and graduation',
        doc_count: 42,
      },
      {
        name: 'Academic Policies',
        description: 'University and college-level academic policy documents',
        doc_count: 15,
      },
    ],
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
    metadata: {
      ...BASE_METADATA,
      course_owner: 'library@illinois.edu',
      course_admins: [
        'library@illinois.edu',
        'ref.desk@illinois.edu',
        'digital.services@illinois.edu',
      ],
      project_description:
        'Helps students and researchers navigate UIUC library resources. Find the right database for your field, learn citation formats (APA, MLA, Chicago), locate interlibrary loan services, and discover specialized research guides curated by subject librarians.',
    },
    knowledgeSources: [
      {
        name: 'Database Directory',
        description:
          'Index of 300+ research databases organized by subject area',
        doc_count: 64,
      },
      {
        name: 'Citation Guides',
        description: 'APA 7th, MLA 9th, and Chicago style formatting guides',
        doc_count: 9,
      },
      {
        name: 'Research Guides',
        description:
          'Subject-specific research guides maintained by librarians',
        doc_count: 87,
      },
    ],
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
    metadata: {
      ...BASE_METADATA,
      course_owner: 'acm@illinois.edu',
      course_admins: [
        'acm@illinois.edu',
        'president@acm.illinois.edu',
        'vp-tech@acm.illinois.edu',
        'events@acm.illinois.edu',
      ],
      project_description:
        'Sharpen your technical interview skills with the ACM @ UIUC interview prep bot. Practice data structures, algorithms, and system design questions with progressive hints. Covers LeetCode-style problems, behavioral interview tips, and company-specific prep guides.',
    },
    knowledgeSources: [
      {
        name: 'Algorithm Problems',
        description: 'Curated set of 200+ coding problems by difficulty',
        doc_count: 210,
      },
      {
        name: 'System Design Notes',
        description: 'Architecture patterns and scalability concepts',
        doc_count: 18,
      },
      {
        name: 'Company Prep Guides',
        description: 'Interview tips for FAANG and top tech companies',
        doc_count: 12,
      },
    ],
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
    metadata: {
      ...BASE_METADATA,
      course_owner: 'trivia@illinois.edu',
      course_admins: ['trivia@illinois.edu'],
      project_description:
        'A fun trivia bot that quizzes you on all things UIUC — from the founding of the university in 1867 to modern campus traditions. Covers Alma Mater history, famous alumni, Big Ten athletics, and hidden campus gems.',
    },
    knowledgeSources: [
      {
        name: 'UIUC History Archive',
        description: 'University history documents and timelines',
        doc_count: 34,
      },
      {
        name: 'Campus Facts',
        description:
          'Fun facts about buildings, traditions, and notable events',
        doc_count: 56,
      },
    ],
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
    metadata: {
      ...BASE_METADATA,
      course_owner: 'student-affairs@illinois.edu',
      course_admins: [
        'student-affairs@illinois.edu',
        'events-coordinator@illinois.edu',
      ],
      project_description:
        'Stay connected with campus life! Browse upcoming RSO events, club meetings, workshops, and social gatherings. Filter by interest area, date, or organization. Never miss a campus event again.',
    },
    knowledgeSources: [
      {
        name: 'RSO Directory',
        description:
          'Complete listing of 1,000+ registered student organizations',
        doc_count: 120,
      },
      {
        name: 'Event Calendar',
        description: 'Upcoming events, meetings, and social gatherings',
        doc_count: 78,
      },
    ],
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
