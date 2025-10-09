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
    return rawMetadata ? (JSON.parse(rawMetadata) as CourseMetadata) : null
  } catch (error) {
    console.error('Error fetching course metadata:', error)
    return null
  }
}

// Check if user is a course admin
export function isCourseAdmin(
  user: AuthenticatedUser,
  courseMetadata: CourseMetadata,
): boolean {
  if (!user.email) return false
  return courseMetadata.course_admins?.includes(user.email) || false
}

// Check if user is the course owner
export function isCourseOwner(
  user: AuthenticatedUser,
  courseMetadata: CourseMetadata,
): boolean {
  if (!user.email) return false
  return courseMetadata.course_owner === user.email
}

// Check if user is an approved user for the course
export function isApprovedUser(
  user: AuthenticatedUser,
  courseMetadata: CourseMetadata,
): boolean {
  if (!user.email) return false
  return courseMetadata.approved_emails_list?.includes(user.email) || false
}

// Check if user has any access to the course (admin, owner, or approved user)
export function hasCourseAccess(
  user: AuthenticatedUser,
  courseMetadata: CourseMetadata,
): boolean {
  return (
    isCourseOwner(user, courseMetadata) ||
    isCourseAdmin(user, courseMetadata) ||
    isApprovedUser(user, courseMetadata) ||
    courseMetadata.allow_logged_in_users === true
  )
}

// Check if user is a regular user (not admin or owner) but has course access
export function isCourseRegularUser(
  user: AuthenticatedUser,
  courseMetadata: CourseMetadata,
): boolean {
  return (
    hasCourseAccess(user, courseMetadata) &&
    !isCourseOwner(user, courseMetadata) &&
    !isCourseAdmin(user, courseMetadata)
  )
}

// Middleware for course-based access control
export function withCourseAccess(courseName: string) {
  return function (
    handler: (
      req: AuthenticatedRequest,
    ) => Promise<NextResponse> | NextResponse,
  ) {
    return withAppRouterAuth(async (req: AuthenticatedRequest) => {
      if (!req.user) {
        return NextResponse.json(
          { error: 'User not authenticated' },
          { status: 401 },
        )
      }
      // Get course metadata
      const courseMetadata = await getCourseMetadata(courseName)
      if (!courseMetadata) {
        return NextResponse.json(
          {
            error: 'Course not found',
            message: `Course '${courseName}' does not exist`,
          },
          { status: 404 },
        )
      }

      if (!hasCourseAccess(req.user, courseMetadata)) {
        return NextResponse.json(
          {
            error: 'Access denied',
            message: `You don't have access to course '${courseName}'`,
          },
          { status: 403 },
        )
      }

      // Attach course context for downstream handler
      ;(req as any).courseName = courseName

      return handler(req)
    })
  }
}

// Middleware for course admin access only
export function withCourseAdminAccess(courseName: string) {
  return function (
    handler: (
      req: AuthenticatedRequest,
    ) => Promise<NextResponse> | NextResponse,
  ) {
    return withAppRouterAuth(async (req: AuthenticatedRequest) => {
      if (!req.user) {
        return NextResponse.json(
          { error: 'User not authenticated' },
          { status: 401 },
        )
      }
      // Get course metadata
      const courseMetadata = await getCourseMetadata(courseName)
      if (!courseMetadata) {
        return NextResponse.json(
          {
            error: 'Course not found',
            message: `Course '${courseName}' does not exist`,
          },
          { status: 404 },
        )
      }

      // Check if user is course admin or owner or if logged-in users are allowed
      if (
        !isCourseOwner(req.user, courseMetadata) &&
        !isCourseAdmin(req.user, courseMetadata)
      ) {
        return NextResponse.json(
          {
            error: 'Insufficient permissions',
            message: `This action requires admin access to course '${courseName}'`,
          },
          { status: 403 },
        )
      }

      // Attach course context for downstream handler
      ;(req as any).courseName = courseName

      return handler(req)
    })
  }
}

// Middleware for course owner access only
export function withCourseOwnerAccess(courseName: string) {
  return function (
    handler: (
      req: AuthenticatedRequest,
    ) => Promise<NextResponse> | NextResponse,
  ) {
    return withAppRouterAuth(async (req: AuthenticatedRequest) => {
      if (!req.user) {
        return NextResponse.json(
          { error: 'User not authenticated' },
          { status: 401 },
        )
      }

      // Get course metadata
      const courseMetadata = await getCourseMetadata(courseName)
      if (!courseMetadata) {
        return NextResponse.json(
          {
            error: 'Course not found',
            message: `Course '${courseName}' does not exist`,
          },
          { status: 404 },
        )
      }

      // Check if user is course owner
      if (!isCourseOwner(req.user, courseMetadata)) {
        return NextResponse.json(
          {
            error: 'Insufficient permissions',
            message: `This action requires admin access to course '${courseName}'`,
          },
          { status: 403 },
        )
      }

      // Attach course context for downstream handler
      ;(req as any).courseName = courseName

      return handler(req)
    })
  }
}

// Utility function to extract course name from request (query params, body, or headers)
export async function extractCourseName(
  req: NextRequest,
  parsedBody?: any,
): Promise<string | null> {
  // 1) From query params
  const fromQuery =
    req.nextUrl.searchParams.get('courseName') ??
    req.nextUrl.searchParams.get('course_name') ??
    req.nextUrl.searchParams.get('projectName') ??
    req.nextUrl.searchParams.get('project_name')
  if (fromQuery) return fromQuery

  // 2) From headers
  const fromHeader =
    req.headers.get('x-course-name') || req.headers.get('x-project-name')
  if (fromHeader) return fromHeader

  // 3) body only if we were given it
  if (parsedBody && typeof parsedBody === 'object') {
    return (
      parsedBody.courseName ??
      parsedBody.course_name ??
      parsedBody.projectName ??
      parsedBody.project_name ??
      null
    )
  }

  return null
}

// Middleware that automatically extracts course name and applies access control
export function withCourseAccessFromRequest(
  accessLevel: 'any' | 'admin' | 'owner' = 'any',
) {
  return function (
    handler: (
      req: AuthenticatedRequest,
    ) => Promise<NextResponse> | NextResponse,
  ) {
    return withAppRouterAuth(async (req: AuthenticatedRequest) => {
      if (!req.user) {
        return NextResponse.json(
          { error: 'User not authenticated' },
          { status: 401 },
        )
      }

      // Parse once (if JSON) and stash for downstream
      let parsedForAuth: any | undefined
      const ct = req.headers.get('content-type') ?? ''
      if (ct.includes('application/json')) {
        parsedForAuth = await req.clone().json()
        ;(req as any).__parsedBody = parsedForAuth
      }

      // Extract course name from request
      const courseName = await extractCourseName(req, parsedForAuth)
      if (!courseName) {
        return NextResponse.json(
          {
            error: 'Course name required',
            message:
              'Course name must be provided in query params, body, or headers',
          },
          { status: 400 },
        )
      }

      // Get course metadata
      const courseMetadata = await getCourseMetadata(courseName)
      if (!courseMetadata) {
        return NextResponse.json(
          {
            error: 'Course not found',
            message: `Course '${courseName}' does not exist`,
          },
          { status: 404 },
        )
      }

      // Check access based on level
      let hasAccess = false
      switch (accessLevel) {
        case 'owner':
          hasAccess = isCourseOwner(req.user, courseMetadata)
          break
        case 'admin':
          hasAccess =
            isCourseOwner(req.user, courseMetadata) ||
            isCourseAdmin(req.user, courseMetadata)
          break
        case 'any':
        default:
          hasAccess = hasCourseAccess(req.user, courseMetadata)
          break
      }

      if (!hasAccess) {
        const accessLevelText =
          accessLevel === 'owner'
            ? 'owner'
            : accessLevel === 'admin'
              ? 'admin'
              : 'user'
        return NextResponse.json(
          {
            error: 'Access denied',
            message: `This action requires ${accessLevelText} access to course '${courseName}'`,
          },
          { status: 403 },
        )
      }

      // Attach course context for downstream handler
      ;(req as any).courseName = courseName

      return handler(req)
    })
  }
}
