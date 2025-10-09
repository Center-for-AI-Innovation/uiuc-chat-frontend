# JWT Authentication for API Endpoints

This document describes the JWT authentication system implemented for securing Next.js API endpoints using Keycloak.

## Overview

All API endpoints in `/src/pages/api/` are now secured with JWT authentication middleware that validates tokens issued by Keycloak. The system automatically verifies JWT tokens and provides user information to protected endpoints.

## Architecture

### Components

1. **Auth Middleware** (`/src/utils/authMiddleware.ts`)

   - JWT token verification using Keycloak's JWKS endpoint
   - Role-based access control utilities
   - Request/response type definitions

2. **Keycloak Client** (`/src/utils/keycloakClient.ts`)

   - Dynamic public key fetching from Keycloak's JWKS endpoint
   - Keycloak Admin Client integration for advanced operations
   - Health checking and connectivity testing

3. **Protected Endpoints**

   - All API endpoints wrapped with `withAuth()` middleware
   - User information available via `req.user`

4. **Public Endpoints**
   - Health check and authentication-related endpoints remain public

## Configuration

### Environment Variables

```env
NEXT_PUBLIC_KEYCLOAK_REALM=illinois-chat-realm
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=illinois-chat
NEXT_PUBLIC_KEYCLOAK_BASE_URL=https://auth.illinois.edu
KEYCLOAK_CLIENT_SECRET=your-client-secret  # Optional, for admin operations
```

### Keycloak Setup

The middleware automatically fetches signing keys from:

```
{KEYCLOAK_BASE_URL}/realms/{REALM}/protocol/openid-connect/certs
```

### Keycloak Client Features

The new Keycloak client provides:

- **Dynamic Key Fetching**: Automatically retrieves public keys from Keycloak's JWKS endpoint
- **Admin Operations**: User management, role checking, and realm information
- **Health Monitoring**: Connectivity testing and status checking
- **Caching**: Efficient key caching with automatic rotation support

#### Available Functions

```typescript
import {
  checkKeycloakHealth,
  getOpenIdConfig,
  fetchRealmPublicKey,
  getUserInfo,
  getUserRoles,
  userHasRole,
} from '~/utils/keycloakClient'

// Check Keycloak connectivity
const health = await checkKeycloakHealth(keycloakBaseUrl)

// Get OpenID Connect configuration
const config = await getOpenIdConfig(keycloakBaseUrl)

// Fetch realm public key directly
const publicKey = await fetchRealmPublicKey(keycloakBaseUrl)

// Get user information
const user = await getUserInfo(keycloakBaseUrl, userId)

// Check user roles
const hasAdminRole = await userHasRole(keycloakBaseUrl, userId, 'admin')
```

## Usage

### Basic Authentication

```typescript
import { withAuth, AuthenticatedRequest } from '~/utils/authMiddleware'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // User information is available in req.user
  const userEmail = req.user?.email
  const userId = req.user?.sub

  // Your endpoint logic here
  res.status(200).json({ message: 'Success' })
}

export default withAuth(handler)
```

### Role-Based Access Control

```typescript
import { withRole, withAnyRole } from '~/utils/authMiddleware'

// Require specific role
export default withRole('admin')(handler)

// Require any of multiple roles
export default withAnyRole(['admin', 'moderator'])(handler)
```

### User Information

The `req.user` object contains:

```typescript
interface AuthenticatedUser {
  sub: string // User ID
  email: string // User email
  preferred_username: string // Username
  given_name?: string // First name
  family_name?: string // Last name
  realm_access?: {
    roles: string[] // User roles
  }
  resource_access?: {
    [key: string]: {
      roles: string[]
    }
  }
}
```

## Public Endpoints

The following endpoints remain public (no authentication required):

- `/api/healthcheck` - Health check endpoint
- `/api/UIUC-api/isSignedIn` - Authentication status check
- `/api/auth/*` - Authentication callback endpoints

## Error Handling

The middleware returns appropriate HTTP status codes:

- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions (role-based)
- `500 Internal Server Error` - JWT verification errors

### Error Response Format

```json
{
  "error": "Token expired",
  "message": "Your session has expired. Please log in again."
}
```

## Testing

### Test Endpoints

#### Authentication Test

A test endpoint is available at `/api/test-auth` to verify authentication:

```bash
# Test with valid token
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/test-auth

# Test without token (should return 401)
curl http://localhost:3000/api/test-auth
```

#### Keycloak Connectivity Test

A comprehensive Keycloak test endpoint is available at `/api/keycloak-test`:

```bash
# Test Keycloak connectivity and configuration
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/keycloak-test
```

#### Health Check

The health check endpoint now includes Keycloak status:

```bash
# Check overall system health including Keycloak
curl http://localhost:3000/api/healthcheck
```

#### Manual Keycloak Testing

Use the provided test script to verify Keycloak connectivity:

```bash
# Run Keycloak connectivity test
node scripts/test-keycloak.js
```

### Expected Response

```json
{
  "message": "Authentication successful!",
  "user": {
    "sub": "user-id",
    "email": "user@example.com",
    "preferred_username": "username"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Security Considerations

1. **Token Validation**: All tokens are validated against Keycloak's public keys
2. **Token Expiration**: Expired tokens are automatically rejected
3. **Role Verification**: Role-based access control is enforced
4. **Error Handling**: Sensitive information is not exposed in error messages

## Troubleshooting

### Common Issues

1. **401 Unauthorized**

   - Check if Authorization header is present
   - Verify token format: `Bearer <token>`
   - Ensure token is not expired

2. **403 Forbidden**

   - User lacks required role
   - Check user's role assignments in Keycloak

3. **500 Internal Server Error**
   - Keycloak configuration issues
   - Network connectivity problems
   - Invalid JWT format

### Debugging

Enable debug logging by checking the console for JWT verification errors:

```typescript
console.error('JWT verification error:', error)
```

## Migration Notes

- All existing API endpoints have been automatically secured
- Existing API key-based authentication in `/chat-api/keys/` remains unchanged
- Frontend code should include JWT tokens in Authorization headers
- Public endpoints are explicitly excluded from authentication

## Dependencies

- `jsonwebtoken` - JWT token verification
- `jwks-rsa` - Keycloak JWKS client
- `@types/jsonwebtoken` - TypeScript definitions
