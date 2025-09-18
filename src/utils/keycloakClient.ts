import KcAdminClient from '@keycloak/keycloak-admin-client'
import jwksClient from 'jwks-rsa'
import jwt from 'jsonwebtoken'

// Keycloak configuration
const KEYCLOAK_REALM =
  process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'illinois_chat_realm'
const KEYCLOAK_BASE_URL =
  process.env.NEXT_PUBLIC_KEYCLOAK_BASE_URL || 'http://localhost:8080'
const KEYCLOAK_CLIENT_ID =
  process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'illinois_chat'
const KEYCLOAK_CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET

// JWKS client for fetching public keys
const jwksClientInstance = jwksClient({
  jwksUri: `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/certs`,
  cache: true,
  cacheMaxAge: 600000, // 10 minutes
  rateLimit: true,
  jwksRequestsPerMinute: 5,
})

// Keycloak Admin Client instance
let kcAdminClient: KcAdminClient | null = null

/**
 * Initialize Keycloak Admin Client
 */
export async function initializeKeycloakAdmin(): Promise<KcAdminClient> {
  if (kcAdminClient) {
    return kcAdminClient
  }

  kcAdminClient = new KcAdminClient({
    baseUrl: KEYCLOAK_BASE_URL,
    realmName: KEYCLOAK_REALM,
  })

  // Authenticate with client credentials
  if (KEYCLOAK_CLIENT_SECRET) {
    await kcAdminClient.auth({
      grantType: 'client_credentials',
      clientId: KEYCLOAK_CLIENT_ID,
      clientSecret: KEYCLOAK_CLIENT_SECRET,
    })
  }

  return kcAdminClient
}

/**
 * Get signing key from Keycloak's JWKS endpoint
 */
export function getSigningKey(header: any, callback: any) {
  jwksClientInstance.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err)
      return
    }
    const signingKey = key?.getPublicKey()
    callback(null, signingKey)
  })
}

/**
 * Fetch realm public key directly from Keycloak Admin API
 * Note: This requires admin access and may not be available in all Keycloak versions
 */
export async function fetchRealmPublicKey(): Promise<string | null> {
  try {
    // Try to get the public key from the JWKS endpoint instead
    const jwksResponse = await fetch(getJwksUri())
    if (!jwksResponse.ok) {
      throw new Error(`Failed to fetch JWKS: ${jwksResponse.statusText}`)
    }

    const jwks = await jwksResponse.json()
    if (jwks.keys && jwks.keys.length > 0) {
      // Return the first key's x5c or n/e values if available
      const firstKey = jwks.keys[0]
      if (firstKey.x5c && firstKey.x5c.length > 0) {
        return `-----BEGIN CERTIFICATE-----\n${firstKey.x5c[0]}\n-----END CERTIFICATE-----`
      }
    }

    return null
  } catch (error) {
    console.error('Error fetching realm public key:', error)
    return null
  }
}

/**
 * Get JWKS endpoint URL
 */
export function getJwksUri(): string {
  return `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/certs`
}

/**
 * Get OpenID Connect configuration
 */
export async function getOpenIdConfig(): Promise<any> {
  try {
    const response = await fetch(
      `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/.well-known/openid_configuration`,
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch OpenID config: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching OpenID configuration:', error)
    throw error
  }
}

/**
 * Verify token using JWKS (recommended approach)
 */
export function createTokenVerifier() {
  return {
    getKey: getSigningKey,
    options: {
      issuer: `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}`,
      algorithms: ['RS256'] as jwt.Algorithm[],
    },
  }
}

/**
 * Async wrapper for JWT verification
 */
export function verifyTokenAsync(token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const verifier = createTokenVerifier()
    jwt.verify(
      token,
      verifier.getKey,
      verifier.options,
      (err: any, decoded: any) => {
        if (err) {
          reject(err)
        } else {
          resolve(decoded)
        }
      },
    )
  })
}

/**
 * Get user information from Keycloak Admin API
 */
export async function getUserInfo(userId: string): Promise<any> {
  try {
    const adminClient = await initializeKeycloakAdmin()
    const user = await adminClient.users.findOne({ id: userId })
    return user
  } catch (error) {
    console.error('Error fetching user info:', error)
    throw error
  }
}

/**
 * Get user roles from Keycloak Admin API
 */
export async function getUserRoles(userId: string): Promise<any> {
  try {
    const adminClient = await initializeKeycloakAdmin()
    const roles = await adminClient.users.listRoleMappings({ id: userId })
    return roles
  } catch (error) {
    console.error('Error fetching user roles:', error)
    throw error
  }
}

/**
 * Check if user has specific role
 */
export async function userHasRole(
  userId: string,
  roleName: string,
): Promise<boolean> {
  try {
    const roles = await getUserRoles(userId)
    return roles.some((role: any) => role.name === roleName)
  } catch (error) {
    console.error('Error checking user role:', error)
    return false
  }
}

/**
 * Get realm information
 */
export async function getRealmInfo(): Promise<any> {
  try {
    const adminClient = await initializeKeycloakAdmin()
    const realm = await adminClient.realms.findOne({ realm: KEYCLOAK_REALM })
    return realm
  } catch (error) {
    console.error('Error fetching realm info:', error)
    throw error
  }
}

/**
 * Health check for Keycloak connectivity
 */
export async function checkKeycloakHealth(): Promise<{
  status: 'healthy' | 'unhealthy'
  error?: string
  details?: any
}> {
  try {
    const config = await getOpenIdConfig()
    return {
      status: 'healthy',
      details: {
        issuer: config.issuer,
        jwks_uri: config.jwks_uri,
        realm: KEYCLOAK_REALM,
      },
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
