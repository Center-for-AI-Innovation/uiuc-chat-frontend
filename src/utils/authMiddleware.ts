import { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'
import { CookieStorage } from '~/providers/cookie-storage'
import { getKeycloakBaseUrl } from '~/utils/authHelpers'

// Keycloak configuration
const KEYCLOAK_REALM =
  process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'illinois-chat-realm'
const KEYCLOAK_BASE_URL =
  process.env.NEXT_PUBLIC_KEYCLOAK_BASE_URL || 'https://auth.illinois.edu'

// JWKS client for Keycloak
const client = jwksClient({
  jwksUri: `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/certs`,
  cache: true,
  cacheMaxAge: 600000, // 10 minutes
  rateLimit: true,
  jwksRequestsPerMinute: 5,
})

// Get signing key from Keycloak
function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err)
      return
    }
    const signingKey = key?.getPublicKey()
    callback(null, signingKey)
  })
}

// JWT verification options
const verifyOptions: jwt.VerifyOptions = {
  audience: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'illinois-chat',
  issuer: `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}`,
  algorithms: ['RS256'],
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
      // Check for Authorization header
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Missing or invalid authorization header',
          message: 'Please provide a valid Bearer token',
        })
      }

      // Extract token
      // const token = authHeader.replace('Bearer ', '')

      const cookieStore = new CookieStorage({
        prefix: 'oidc.',
        expiresDays: 1,
        sameSite: 'lax', // if your IdP is on another domain AND you use iframe silent renew, use "none"
        secure: true,
      })
      const token = cookieStore.getItem(
        `oidc.user:${getKeycloakBaseUrl()}realms/${process.env.NEXT_PUBLIC_KEYCLOAK_REALM}:${process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID}`,
      )

      // Verify JWT token
      const decoded = jwt.verify(
        token,
        getKey,
        verifyOptions,
      ) as unknown as AuthenticatedUser

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
