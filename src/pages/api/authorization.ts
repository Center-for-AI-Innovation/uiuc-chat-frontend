import { CourseMetadata } from '~/types/courseMetadata'
import { AuthenticatedUser, AuthenticatedRequest } from '~/utils/authMiddleware'
import { NextApiResponse } from 'next'
import { withAuth } from '~/utils/authMiddleware'
import { ensureRedisConnected } from '~/utils/redisClient'

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
    isApprovedUser(user, courseMetadata)
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
      res: NextApiResponse,
    ) => Promise<void> | void,
  ) {
    return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' })
      }

      // Get course metadata
      const courseMetadata = await getCourseMetadata(courseName)
      if (!courseMetadata) {
        return res.status(404).json({
          error: 'Course not found',
          message: `Course '${courseName}' does not exist`,
        })
      }

      // Check if user has access to the course
      if (!hasCourseAccess(req.user, courseMetadata)) {
        return res.status(403).json({
          error: 'Access denied',
          message: `You don't have access to course '${courseName}'`,
        })
      }

      // Add course context to request
      req.courseName = courseName

      return await handler(req, res)
    })
  }
}

// Middleware for course admin access only
export function withCourseAdminAccess(courseName: string) {
  return function (
    handler: (
      req: AuthenticatedRequest,
      res: NextApiResponse,
    ) => Promise<void> | void,
  ) {
    return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' })
      }

      // Get course metadata
      const courseMetadata = await getCourseMetadata(courseName)
      if (!courseMetadata) {
        return res.status(404).json({
          error: 'Course not found',
          message: `Course '${courseName}' does not exist`,
        })
      }

      // Check if user is course admin or owner
      if (
        !isCourseOwner(req.user, courseMetadata) &&
        !isCourseAdmin(req.user, courseMetadata)
      ) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: `This action requires admin access to course '${courseName}'`,
        })
      }

      // Add course context to request
      req.courseName = courseName

      return await handler(req, res)
    })
  }
}

// Middleware for course owner access only
export function withCourseOwnerAccess(courseName: string) {
  return function (
    handler: (
      req: AuthenticatedRequest,
      res: NextApiResponse,
    ) => Promise<void> | void,
  ) {
    return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' })
      }

      // Get course metadata
      const courseMetadata = await getCourseMetadata(courseName)
      if (!courseMetadata) {
        return res.status(404).json({
          error: 'Course not found',
          message: `Course '${courseName}' does not exist`,
        })
      }

      // Check if user is course owner
      if (!isCourseOwner(req.user, courseMetadata)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: `This action requires owner access to course '${courseName}'`,
        })
      }

      // Add course context to request
      req.courseName = courseName

      return await handler(req, res)
    })
  }
}

export function withCourseOwnerOrAdminAccess() {
  return function (
    handler: (
      req: AuthenticatedRequest,
      res: NextApiResponse,
    ) => Promise<void> | void,
  ) {
    return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' })
      }

      const courseName = extractCourseName(req)
      if (!courseName) {
        return res.status(400).json({
          error: 'Course name required',
          message:
            'Course name must be provided in query params, body, or headers',
        })
      }

      // Get course metadata
      const courseMetadata = await getCourseMetadata(courseName)
      if (!courseMetadata) {
        return res.status(404).json({
          error: 'Course not found',
          message: `Course '${courseName}' does not exist`,
        })
      }

      // Check if user has access to the course
      if (
        !isCourseAdmin(req.user, courseMetadata) &&
        !isCourseOwner(req.user, courseMetadata)
      ) {
        return res.status(403).json({
          error: 'Access denied',
          message: `You don't have access to course '${courseName}'`,
        })
      }

      // Add course context to request
      req.courseName = courseName

      return await handler(req, res)
    })
  }
}

// Utility function to extract course name from request (query params, body, or headers)
export function extractCourseName(req: NextApiRequest): string | null {
  // Try to get course name from various sources
  const courseName =
    (req.query.courseName as string) ||
    (req.query.course_name as string) ||
    req.body?.courseName ||
    req.body?.course_name ||
    (req.headers['x-course-name'] as string) ||
    null

  return courseName
}

// Middleware that automatically extracts course name and applies access control
export function withCourseAccessFromRequest(
  accessLevel: 'any' | 'admin' | 'owner' = 'any',
) {
  return function (
    handler: (
      req: AuthenticatedRequest,
      res: NextApiResponse,
    ) => Promise<void> | void,
  ) {
    return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' })
      }

      // Extract course name from request
      const courseName = extractCourseName(req)
      if (!courseName) {
        return res.status(400).json({
          error: 'Course name required',
          message:
            'Course name must be provided in query params, body, or headers',
        })
      }

      // Get course metadata
      const courseMetadata = await getCourseMetadata(courseName)
      if (!courseMetadata) {
        return res.status(404).json({
          error: 'Course not found',
          message: `Course '${courseName}' does not exist`,
        })
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
        return res.status(403).json({
          error: 'Access denied',
          message: `This action requires ${accessLevelText} access to course '${courseName}'`,
        })
      }

      // Add course context to request
      req.courseName = courseName

      return await handler(req, res)
    })
  }
}
