import { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'


export function realmB64ToPem(b64: string): string {
  return `-----BEGIN PUBLIC KEY-----\n${b64}\n-----END PUBLIC KEY-----\n`
}

// TODO could get the key dynamically from the Keycloak server's JWKS endpoint
const REALM_PUBKEY_B64 = process.env.KEYCLOAK_REALM_PUBLIC_KEY_B64!
const KEYCLOAK_PUBLIC_KEY = realmB64ToPem(REALM_PUBKEY_B64)

function getTokenFromCookies(req: NextApiRequest): string | null {
  // Find oidc.user* cookie
  const names = Object.keys(req.cookies || {});
  const name = names.find((n) => n.startsWith("oidc.user"));
  if (!name) return null;

  const raw = req.cookies[name];
  if (!raw) return null;

  try {
    const decoded = decodeURIComponent(raw);
    const parsed = JSON.parse(decoded);
    return parsed.access_token || parsed.id_token || null;
  } catch {
    return null;
  }
}

function peekIssuer(token: string): string {
  const [, p] = token.split(".")
  const payload = JSON.parse(Buffer.from(p, "base64url").toString("utf8"))
  return String(payload.iss || "").replace(/\/$/, "")
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
      const token = getTokenFromCookies(req);

      if (!token) {
        return res.status(401).json({ error: "Missing token" });
      }

      // Verify JWT token
      const decoded = jwt.verify(token, KEYCLOAK_PUBLIC_KEY, {
        issuer: peekIssuer(token),
        algorithms: ['RS256'],
      }) as AuthenticatedUser


      // Add user to request object
      req.user = decoded

      // Call the original handler
      return await handler(req, res)
    }
    catch (error) {
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
