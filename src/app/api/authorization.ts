import { CourseMetadata } from '~/types/courseMetadata'
import { AuthenticatedRequest } from '~/utils/appRouterAuth'
import { NextRequest, NextResponse } from 'next/server'
import { withAppRouterAuth } from '~/utils/appRouterAuth'
import { ensureRedisConnected } from '~/utils/redisClient'
import { AuthenticatedUser } from '~/middleware'

// Helper function to get course metadata from Redis
export async function getCourseMetadata(
  courseName: string,
): Promise<CourseMetadata | null> {
  try {
    const redisClient = await ensureRedisConnected()
    const rawMetadata = await redisClient.hGet('course_metadatas', courseName)
    const course_metadata: CourseMetadata | null = rawMetadata
      ? JSON.parse(rawMetadata)
      : null

    // Use value as-is; Redis-stored JSON should already have correct boolean
    return course_metadata
  } catch (error) {
    console.error('Error occurred while fetching courseMetadata', error)
    return null
  }
}

// Helper function to check if user has access to a course
export function hasCourseAccess(
  user: AuthenticatedUser,
  courseMetadata: CourseMetadata,
): boolean {
  // Check if user is admin
  if (courseMetadata.course_admins?.includes(user.email)) {
    return true
  }

  // Check if user is course owner
  if (user.email === courseMetadata.course_owner) {
    return true
  }

  // Check if user is in the course's allowed users list
  if (courseMetadata.approved_emails_list?.includes(user.email)) {
    return true
  }

  // check if all logged in users have access
  if (courseMetadata.allow_logged_in_users) {
    return true
  }

  return false
}

// Utility function to extract course name from request (query params, body, or headers)
export async function extractCourseName(
  req: NextRequest,
): Promise<string | null> {
  // Try to get course name from various sources
  const url = new URL(req.url)
  let courseName =
    url.searchParams.get('courseName') ||
    url.searchParams.get('course_name') ||
    url.searchParams.get('projectName') ||
    url.searchParams.get('project_name') ||
    req.headers.get('x-course-name') ||
    req.headers.get('x-project_name') ||
    null

  // If not found in query params or headers, try to extract from body
  if (!courseName && req.method === 'POST') {
    try {
      const body = await req.clone().json()
      courseName =
        body.course_name ||
        body.courseName ||
        body.project_name ||
        body.projectName ||
        null
    } catch (error) {
      // Ignore body parsing errors
    }
  }

  return courseName
}

// Middleware that automatically extracts course name and applies access control
export function withCourseAccessFromRequest(
  access:
    | 'any'
    | 'admin'
    | 'owner'
    | Partial<
        Record<
          'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS',
          'any' | 'admin' | 'owner'
        >
      >,
) {
  return function (
    handler: (
      req: AuthenticatedRequest,
    ) => Promise<NextResponse> | NextResponse,
  ) {
    return async (req: AuthenticatedRequest) => {
      const courseName = await extractCourseName(req)
      if (!courseName) {
        return new NextResponse(
          JSON.stringify({
            error: 'Course name required',
            message:
              'Course name must be provided in query params, body, or headers',
          }),
          { status: 400 },
        )
      }

      // Get course metadata
      const courseMetadata = await getCourseMetadata(courseName)
      if (!courseMetadata) {
        return NextResponse.json(
          {
            error: 'Project not found',
            message: `Project '${courseName}' does not exist`,
          },
          { status: 404 },
        )
      }

      // Check if course is frozen/archived
      if (courseMetadata.is_frozen === true) {
        return NextResponse.json(
          {
            error: 'Project is temporarily frozen by the administrator',
            message: `Project '${courseName}' has been temporarily frozen by the administrator`,
          },
          { status: 403 },
        )
      }

      // Determine required access level for this request
      const method = req.method as
        | 'GET'
        | 'POST'
        | 'PUT'
        | 'PATCH'
        | 'DELETE'
        | 'HEAD'
        | 'OPTIONS'
      const requiredAccess =
        typeof access === 'string' ? access : access[method] || 'any'

      // For public courses, allow unauthenticated access if access level is 'any'
      if (!courseMetadata.is_private && requiredAccess === 'any') {
        // Add course context to request
        ;(req as any).courseName = courseName
        return await handler(req)
      }

      // For private courses or higher access levels, require authentication
      return withAppRouterAuth(async (req: AuthenticatedRequest) => {
        if (!req.user) {
          return new NextResponse(
            JSON.stringify({ error: 'User not authenticated' }),
            { status: 401 },
          )
        }

        // Check course access for private courses
        if (
          courseMetadata.is_private &&
          !hasCourseAccess(req.user, courseMetadata)
        ) {
          return new NextResponse(
            JSON.stringify({
              error: 'Access denied',
              message: `You don't have access to course '${courseName}'`,
            }),
            { status: 403 },
          )
        }

        // Check specific access level
        if (
          requiredAccess === 'admin' &&
          !courseMetadata.course_admins?.includes(req.user.email)
        ) {
          return new NextResponse(
            JSON.stringify({
              error: 'Access denied',
              message: 'This action requires admin access',
            }),
            { status: 403 },
          )
        }

        if (
          requiredAccess === 'owner' &&
          req.user.email !== courseMetadata.course_owner
        ) {
          return new NextResponse(
            JSON.stringify({
              error: 'Access denied',
              message: 'This action requires course owner access',
            }),
            { status: 403 },
          )
        }

        // Add course context to request
        ;(req as any).courseName = courseName

        return await handler(req)
      })(req)
    }
  }
}
