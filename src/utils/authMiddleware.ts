import { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import { verifyTokenAsync } from './keycloakClient'
import { ensureRedisConnected } from './redisClient'
import { CourseMetadata } from '~/types/courseMetadata'

function getTokenFromCookies(req: NextApiRequest): string | null {
  // Find oidc.user* cookie
  const names = Object.keys(req.cookies || {})
  const name = names.find((n) => n.startsWith('oidc.user'))
  if (!name) return null

  const raw = req.cookies[name]
  if (!raw) return null

  try {
    const decoded = decodeURIComponent(raw)
    const parsed = JSON.parse(decoded)
    return parsed.access_token || parsed.id_token || null
  } catch {
    return null
  }
}

function peekIssuer(token: string): string {
  const [, p] = token.split('.')
  if (!p) return ''
  const payload = JSON.parse(Buffer.from(p, 'base64url').toString('utf8'))
  return String(payload.iss || '').replace(/\/$/, '')
}

export interface AuthenticatedUser {
  sub: string
  email: string
  preferred_username: string
  given_name?: string
  family_name?: string
  realm_access?: {
    roles: string[]
  }
  resource_access?: {
    [key: string]: {
      roles: string[]
    }
  }
}

export interface AuthenticatedRequest extends NextApiRequest {
  user?: AuthenticatedUser
  courseName?: string
}

// Middleware to verify JWT token
export function withAuth(
  handler: (
    req: AuthenticatedRequest,
    res: NextApiResponse,
  ) => Promise<void> | void,
) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      const token = getTokenFromCookies(req)

      if (!token) {
        return res.status(401).json({ error: 'Missing token' })
      }

      // Verify JWT token using Keycloak's JWKS endpoint
      const decoded = (await verifyTokenAsync(token)) as AuthenticatedUser

      // Add user to request object
      req.user = decoded

      // Call the original handler
      return await handler(req, res)
    } catch (error) {
      console.error('JWT verification error:', error)

      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
          error: 'Token expired',
          message: 'Your session has expired. Please log in again.',
        })
      }

      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
          error: 'Invalid token',
          message: 'The provided token is invalid',
        })
      }

      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Unable to verify your identity',
      })
    }
  }
}

// Utility function to check if user has specific role
export function hasRole(user: AuthenticatedUser, role: string): boolean {
  return user.realm_access?.roles?.includes(role) || false
}

// Utility function to check if user has any of the specified roles
export function hasAnyRole(user: AuthenticatedUser, roles: string[]): boolean {
  return roles.some((role) => hasRole(user, role))
}

// Middleware for role-based access control
export function withRole(requiredRole: string) {
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

      if (!hasRole(req.user, requiredRole)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: `This action requires the '${requiredRole}' role`,
        })
      }

      return await handler(req, res)
    })
  }
}

// Middleware for multiple role access control
export function withAnyRole(requiredRoles: string[]) {
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

      if (!hasAnyRole(req.user, requiredRoles)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: `This action requires one of the following roles: ${requiredRoles.join(', ')}`,
        })
      }

      return await handler(req, res)
    })
  }
}

// Public endpoints that don't require authentication
export const PUBLIC_ENDPOINTS = [
  '/api/healthcheck',
  '/api/auth/callback',
  '/api/auth/logout',
  '/api/auth/refresh',
]

// Check if endpoint is public
export function isPublicEndpoint(pathname: string): boolean {
  return PUBLIC_ENDPOINTS.some((endpoint) => pathname.startsWith(endpoint))
}

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
