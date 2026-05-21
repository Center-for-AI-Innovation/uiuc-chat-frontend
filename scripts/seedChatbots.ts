/**
 * Seed chatbots for local/dev testing.
 *
 * Covers the full test matrix:
 *   - All 5 project types (Course, Department, Research, Student Org., Entertainment)
 *   - All 3 access levels (private, unlisted = logged-in-only, public)
 *   - Both user roles (owner via course_owner; member via course_admins / approved_emails_list)
 *   - Tag edge cases (no tags, only projectType, projectType + org, max-tag overflow)
 *   - Description edge cases (empty, very long)
 *   - is_frozen true/false
 *   - With and without bannerImageS3
 *
 * Writes go through the same dual-write helper production uses
 * (`writeCourseMetadata`), so Postgres `course_metadata` and Redis
 * `course_metadatas` stay in sync.
 *
 * Usage:
 *   pnpm tsx scripts/seedChatbots.ts                     # owner=alpacaking77@gmail.com (default)
 *   pnpm tsx scripts/seedChatbots.ts --email you@x.com   # custom owner email
 *   pnpm tsx scripts/seedChatbots.ts --dry-run           # print plan, no writes
 */
import 'dotenv/config'
import { writeCourseMetadata } from '../src/utils/courseMetadataStore'
import type { CourseMetadata } from '../src/types/courseMetadata'
import type { ChatbotTag } from '../src/types/chatbotTags'

const DEFAULT_EMAIL = 'bingjiguo@icloud.com'
const OTHER_OWNER = 'someone-else@example.com'
const OTHER_ADMIN = 'colleague@example.com'
// Distinct third-party owners used for the "discovery" bots — the current
// user has no owner/admin/approved relationship with these, so they should
// land in the public Course/Department/Public Bots sections via the
// featured-chatbots endpoint.
const DISCOVERY_OWNER_PROF = 'prof.discovery@example.edu'
const DISCOVERY_OWNER_DEPT = 'dept.head@example.edu'
const DISCOVERY_OWNER_STUDENT = 'student.lead@example.edu'

function parseArgs(): { email: string; dryRun: boolean } {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const emailIdx = args.indexOf('--email')
  const email =
    emailIdx >= 0 && args[emailIdx + 1]
      ? (args[emailIdx + 1] as string)
      : DEFAULT_EMAIL
  return { email, dryRun }
}

type SeedSpec = {
  course_name: string
  /** Human-readable scenario label (printed in the run log). */
  scenario: string
  metadata: CourseMetadata
}

function tags(parts: {
  projectType?: ChatbotTag['value']
  organization?: string
  general?: string[]
}): ChatbotTag[] {
  const out: ChatbotTag[] = []
  if (parts.projectType) {
    out.push({ category: 'projectType', value: parts.projectType })
  }
  if (parts.organization) {
    out.push({ category: 'organization', value: parts.organization })
  }
  for (const g of parts.general ?? []) {
    out.push({ category: 'general', value: g })
  }
  return out
}

function buildSpecs(userEmail: string): SeedSpec[] {
  // Base template — every CourseMetadata field must be present, even if undefined,
  // so the Redis JSON projection round-trips cleanly.
  const base = (overrides: Partial<CourseMetadata>): CourseMetadata => ({
    is_private: false,
    course_owner: userEmail,
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
    allow_logged_in_users: false,
    is_frozen: false,
    tags: [],
    ...overrides,
  })

  return [
    // ─── OWNER × all project types × varied access levels ──────────────────────
    {
      course_name: 'seed-course-cs225',
      scenario: 'Owner / Course / Public / org+general tags',
      metadata: base({
        course_owner: userEmail,
        project_description:
          'Course assistant for CS 225: Data Structures. Covers linked lists, trees, hashing, and graph algorithms.',
        is_private: false,
        allow_logged_in_users: false,
        tags: tags({
          projectType: 'Course',
          organization: 'Computer Science',
          general: ['algorithms', 'data-structures'],
        }),
      }),
    },
    {
      course_name: 'seed-dept-grainger-helpdesk',
      scenario: 'Owner / Department / Unlisted (logged-in only) / banner',
      metadata: base({
        course_owner: userEmail,
        project_description:
          'Internal Grainger Engineering helpdesk. Login required.',
        is_private: true,
        allow_logged_in_users: true,
        banner_image_s3: 'banners/seed-grainger-helpdesk.png',
        tags: tags({
          projectType: 'Department',
          organization: 'Grainger Engineering',
          general: ['helpdesk'],
        }),
      }),
    },
    {
      course_name: 'seed-research-quantum-lab',
      scenario: 'Owner / Research / Private / max (5) tags',
      metadata: base({
        course_owner: userEmail,
        project_description:
          'Private knowledge base for the Quantum Information Lab.',
        is_private: true,
        allow_logged_in_users: false,
        tags: tags({
          projectType: 'Research',
          organization: 'Grainger Engineering',
          general: ['quantum', 'physics', 'lab-notes'],
        }),
      }),
    },
    {
      course_name: 'seed-studentorg-acm',
      scenario: 'Owner / Student Org. / Public / no description',
      metadata: base({
        course_owner: userEmail,
        project_description: undefined,
        is_private: false,
        allow_logged_in_users: false,
        tags: tags({
          projectType: 'Student Org.',
          organization: 'ACM @ UIUC',
        }),
      }),
    },
    {
      course_name: 'seed-entertainment-dadjokes',
      scenario:
        'Owner / Entertainment / Public / NO tags, NO description (bare card)',
      metadata: base({
        course_owner: userEmail,
        is_private: false,
        allow_logged_in_users: false,
        tags: [],
      }),
    },

    // ─── MEMBER (admin) cases ─────────────────────────────────────────────────
    {
      course_name: 'seed-course-phys101-member-admin',
      scenario: 'Member (admin) / Course / Public',
      metadata: base({
        course_owner: OTHER_OWNER,
        course_admins: [userEmail],
        project_description:
          'PHYS 101 — intro mechanics & thermodynamics. You are an admin here.',
        is_private: false,
        allow_logged_in_users: false,
        tags: tags({
          projectType: 'Course',
          organization: 'Grainger Engineering',
        }),
      }),
    },
    {
      course_name: 'seed-research-fusion-member-admin-frozen',
      scenario: 'Member (admin) / Research / Private / FROZEN',
      metadata: base({
        course_owner: OTHER_OWNER,
        course_admins: [userEmail, OTHER_ADMIN],
        project_description:
          'Fusion energy research archive. Read-only — frozen.',
        is_private: true,
        allow_logged_in_users: false,
        is_frozen: true,
        tags: tags({
          projectType: 'Research',
          organization: 'Grainger Engineering',
          general: ['archived'],
        }),
      }),
    },

    // ─── MEMBER (approved_emails) cases ───────────────────────────────────────
    {
      course_name: 'seed-dept-library-member-approved',
      scenario: 'Member (approved_emails) / Department / Unlisted',
      metadata: base({
        course_owner: OTHER_OWNER,
        approved_emails_list: [userEmail],
        project_description:
          'University Library research assistant. Logged-in only.',
        is_private: true,
        allow_logged_in_users: true,
        tags: tags({
          projectType: 'Department',
          organization: 'University Library',
        }),
      }),
    },
    {
      course_name: 'seed-studentorg-chess-member-approved',
      scenario: 'Member (approved_emails) / Student Org. / Public / no org',
      metadata: base({
        course_owner: OTHER_OWNER,
        approved_emails_list: [userEmail],
        project_description: 'Chess Club @ UIUC — openings, tactics, puzzles.',
        is_private: false,
        allow_logged_in_users: false,
        tags: tags({
          projectType: 'Student Org.',
          general: ['chess', 'puzzles'],
        }),
      }),
    },
    {
      course_name: 'seed-entertainment-trivia-member-admin',
      scenario:
        'Member (admin) / Entertainment / Public / overflow general tags',
      metadata: base({
        course_owner: OTHER_OWNER,
        course_admins: [userEmail],
        project_description: 'Trivia bot — pop culture, sports, history.',
        is_private: false,
        allow_logged_in_users: false,
        tags: tags({
          projectType: 'Entertainment',
          organization: 'Gies College of Business',
          general: ['trivia', 'fun', 'games'],
        }),
      }),
    },

    // ─── Edge cases ───────────────────────────────────────────────────────────
    {
      course_name: 'seed-edge-long-description',
      scenario:
        'Owner / Course / Public / very long description (line-clamp test)',
      metadata: base({
        course_owner: userEmail,
        project_description:
          'This is an intentionally long description meant to exercise the card line-clamp and the detail dialog wrapping behavior. It mentions several concepts: data structures, retrieval-augmented generation, vector embeddings, evaluation pipelines, prompt caching, model routing, and many other topics that should easily overflow two lines on a 320px-wide card so the truncation styles are validated.',
        is_private: false,
        allow_logged_in_users: false,
        tags: tags({ projectType: 'Course', organization: 'Computer Science' }),
      }),
    },
    {
      course_name: 'seed-edge-projecttype-only',
      scenario: 'Owner / projectType tag ONLY (no org, no general)',
      metadata: base({
        course_owner: userEmail,
        project_description: 'Has only a projectType tag — no org, no general.',
        is_private: false,
        allow_logged_in_users: false,
        tags: tags({ projectType: 'Department' }),
      }),
    },
    {
      course_name: 'seed-edge-owner-private-frozen',
      scenario: 'Owner / Private / FROZEN',
      metadata: base({
        course_owner: userEmail,
        project_description: 'Owner-frozen private bot.',
        is_private: true,
        allow_logged_in_users: false,
        is_frozen: true,
        tags: tags({ projectType: 'Course', organization: 'Computer Science' }),
      }),
    },
    {
      course_name: 'seed-edge-many-collaborators',
      scenario: 'Owner / Public / many collaborators (+N more byline)',
      metadata: base({
        course_owner: userEmail,
        course_admins: ['a@x.edu', 'b@x.edu', 'c@x.edu'],
        approved_emails_list: ['d@x.edu', 'e@x.edu', 'f@x.edu', 'g@x.edu'],
        project_description:
          'Many collaborators to exercise the "+N more" byline.',
        is_private: false,
        allow_logged_in_users: false,
        tags: tags({
          projectType: 'Research',
          organization: 'Grainger Engineering',
        }),
      }),
    },
    {
      course_name: 'seed-edge-banner-no-tags',
      scenario: 'Owner / Public / banner but NO tags',
      metadata: base({
        course_owner: userEmail,
        project_description:
          'Banner present, no tags — checks icon fallback removal.',
        is_private: false,
        allow_logged_in_users: false,
        banner_image_s3: 'banners/seed-banner-no-tags.png',
        tags: [],
      }),
    },

    // ─── Discovery bots (no relationship to current user) ─────────────────────
    // These land in Course Assistants / Department Resources / Public Bots
    // via the featured-chatbots endpoint. Owner is someone else, no admin/
    // approved entry for the current user, all public + non-frozen.
    {
      course_name: 'seed-discover-course-econ101',
      scenario: 'Discovery / Course / Public / Gies',
      metadata: base({
        course_owner: DISCOVERY_OWNER_PROF,
        project_description:
          'ECON 101 — Principles of Microeconomics. Supply, demand, market structures.',
        is_private: false,
        allow_logged_in_users: false,
        tags: tags({
          projectType: 'Course',
          organization: 'Gies College of Business',
          general: ['economics'],
        }),
      }),
    },
    {
      course_name: 'seed-discover-course-eng215',
      scenario: 'Discovery / Course / Public / LAS',
      metadata: base({
        course_owner: DISCOVERY_OWNER_PROF,
        project_description:
          'ENG 215 — Introduction to American Literature. Reading guides, themes, study tools.',
        is_private: false,
        allow_logged_in_users: false,
        tags: tags({
          projectType: 'Course',
          organization: 'College of Liberal Arts & Sciences',
        }),
      }),
    },
    {
      course_name: 'seed-discover-dept-cs-advising',
      scenario: 'Discovery / Department / Public',
      metadata: base({
        course_owner: DISCOVERY_OWNER_DEPT,
        project_description:
          'CS Department advising assistant — degree requirements, course planning, FAQs.',
        is_private: false,
        allow_logged_in_users: false,
        tags: tags({
          projectType: 'Department',
          organization: 'Computer Science',
        }),
      }),
    },
    {
      course_name: 'seed-discover-research-nlp-group',
      scenario: 'Discovery / Research / Public',
      metadata: base({
        course_owner: DISCOVERY_OWNER_PROF,
        project_description:
          'Public knowledge base for the NLP Research Group. Papers, datasets, demos.',
        is_private: false,
        allow_logged_in_users: false,
        tags: tags({
          projectType: 'Research',
          organization: 'Computer Science',
          general: ['nlp', 'papers'],
        }),
      }),
    },
    {
      course_name: 'seed-discover-studentorg-debate',
      scenario: 'Discovery / Student Org. / Public',
      metadata: base({
        course_owner: DISCOVERY_OWNER_STUDENT,
        project_description:
          'Debate Team @ UIUC — argument frameworks, case prep, tournament logistics.',
        is_private: false,
        allow_logged_in_users: false,
        tags: tags({
          projectType: 'Student Org.',
          general: ['debate'],
        }),
      }),
    },
    {
      course_name: 'seed-discover-entertainment-movie-buff',
      scenario: 'Discovery / Entertainment / Public / banner',
      metadata: base({
        course_owner: DISCOVERY_OWNER_STUDENT,
        project_description:
          'Movie recommendations and trivia. Knows your taste across genres.',
        is_private: false,
        allow_logged_in_users: false,
        banner_image_s3: 'banners/seed-discover-movies.png',
        tags: tags({
          projectType: 'Entertainment',
          general: ['movies', 'reviews'],
        }),
      }),
    },
  ]
}

async function main() {
  const { email, dryRun } = parseArgs()
  const specs = buildSpecs(email)

  console.log(
    `Seeding ${specs.length} chatbots for owner/member email "${email}"` +
      (dryRun ? ' (DRY RUN — no writes)' : ''),
  )

  let succeeded = 0
  let failed = 0
  const failures: { course_name: string; error: string }[] = []

  for (const spec of specs) {
    if (dryRun) {
      console.log(`  [dry] ${spec.course_name} — ${spec.scenario}`)
      succeeded += 1
      continue
    }

    try {
      await writeCourseMetadata(spec.course_name, spec.metadata)
      succeeded += 1
      console.log(`  ✓ ${spec.course_name} — ${spec.scenario}`)
    } catch (err) {
      failed += 1
      const message = err instanceof Error ? err.message : String(err)
      const cause =
        err && typeof err === 'object' && 'cause' in err
          ? (err as { cause?: unknown }).cause
          : undefined
      const causeMsg =
        cause instanceof Error ? cause.message : cause ? String(cause) : ''
      const full = causeMsg ? `${message} :: ${causeMsg}` : message
      failures.push({ course_name: spec.course_name, error: full })
      console.error(`  ✗ ${spec.course_name} — ${full}`)
    }
  }

  console.log(
    `\nDone. Succeeded: ${succeeded}, Failed: ${failed}, Total: ${specs.length}`,
  )
  if (failures.length > 0) {
    console.log('\nFailures:')
    for (const f of failures) {
      console.log(`  - ${f.course_name}: ${f.error}`)
    }
  }

  process.exit(failed > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Seed crashed:', err)
  process.exit(1)
})
