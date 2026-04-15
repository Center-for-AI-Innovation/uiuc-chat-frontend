import { db, projects, documents } from '~/db/dbClient'
import { eq, max, inArray } from 'drizzle-orm'

export interface ProjectTimestamps {
  created_at: string | null
  last_updated_at: string | null
}

/**
 * Fetches created_at from the projects table and derives last_updated_at
 * from MAX(documents.created_at) for a single course.
 * Falls back to projects.created_at when no documents exist.
 */
export async function getProjectTimestamps(
  courseName: string,
): Promise<ProjectTimestamps> {
  try {
    const [projectRow] = await db
      .select({ created_at: projects.created_at })
      .from(projects)
      .where(eq(projects.course_name, courseName))
      .limit(1)

    const [docRow] = await db
      .select({ last_updated_at: max(documents.created_at) })
      .from(documents)
      .where(eq(documents.course_name, courseName))

    const createdAt = projectRow?.created_at?.toISOString() ?? null
    const lastDocUpdate = docRow?.last_updated_at?.toISOString() ?? null

    return {
      created_at: createdAt,
      last_updated_at: lastDocUpdate ?? createdAt,
    }
  } catch (error) {
    console.error(`Error fetching timestamps for project ${courseName}:`, error)
    return { created_at: null, last_updated_at: null }
  }
}

/**
 * Batch-fetches timestamps for multiple courses at once.
 * Returns a map of course_name -> ProjectTimestamps.
 */
export async function getBatchProjectTimestamps(
  courseNames: string[],
): Promise<Map<string, ProjectTimestamps>> {
  const result = new Map<string, ProjectTimestamps>()

  if (courseNames.length === 0) return result

  try {
    const [projectRows, docRows] = await Promise.all([
      db
        .select({
          course_name: projects.course_name,
          created_at: projects.created_at,
        })
        .from(projects)
        .where(inArray(projects.course_name, courseNames)),
      db
        .select({
          course_name: documents.course_name,
          last_updated_at: max(documents.created_at),
        })
        .from(documents)
        .where(inArray(documents.course_name, courseNames))
        .groupBy(documents.course_name),
    ])

    const projectMap = new Map(
      projectRows.map((r) => [
        r.course_name,
        r.created_at?.toISOString() ?? null,
      ]),
    )

    const docMap = new Map(
      docRows.map((r) => [
        r.course_name,
        r.last_updated_at?.toISOString() ?? null,
      ]),
    )

    for (const name of courseNames) {
      const createdAt = projectMap.get(name) ?? null
      const lastDocUpdate = docMap.get(name) ?? null
      result.set(name, {
        created_at: createdAt,
        last_updated_at: lastDocUpdate ?? createdAt,
      })
    }
  } catch (error) {
    console.error('Error fetching batch project timestamps:', error)
  }

  return result
}
