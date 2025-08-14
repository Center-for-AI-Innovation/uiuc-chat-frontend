/*
 * This file makes Preview deploys on Vercel work with Keycloak auth.
 * We will have an ever growing list of redirectURIs and WebOrigins to enable keycloak on each unique preview deploy URI.
 */

const { getKeycloakBaseUrl } = require('./shared-utils')

async function updateKeycloakRedirectURIs() {
  const keycloakBaseUrl = getKeycloakBaseUrl();
  const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM
  const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID
  const adminUser = process.env.KEYCLOAK_ADMIN_USERNAME
  const adminPass = process.env.KEYCLOAK_ADMIN_PASSWORD
  const branchURL = process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL}` : null

  // Check if all required environment variables are present
  if (!keycloakBaseUrl || !realm || !clientId || !adminUser || !adminPass) {
    console.log('Skipping Keycloak configuration update - missing required environment variables')
    console.log('Required vars:', {
      keycloakBaseUrl: !!keycloakBaseUrl,
      realm: !!realm,
      clientId: !!clientId,
      adminUser: !!adminUser,
      adminPass: !!adminPass
    })
    return
  }

  // Log the branch URL for debugging purposes
  // console.log(`TEST Branch URL: ${branchURL}`)
  try {
    // Get access token
    const tokenResponse = await fetch(
      `${keycloakBaseUrl}realms/master/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: 'admin-cli',
          username: adminUser,
          password: adminPass,
        }),
      },
    )

    if (!tokenResponse.ok) {
      console.log('Failed to get Keycloak access token, skipping configuration update')
      return
    }

    const { access_token } = await tokenResponse.json()

    if (!access_token) {
      console.log('No access token received from Keycloak, skipping configuration update')
      return
    }

    // Get current client config
    const clientResponse = await fetch(
      `${keycloakBaseUrl}admin/realms/${realm}/clients?clientId=${clientId}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      },
    )

    if (!clientResponse.ok) {
      console.log('Failed to get Keycloak client configuration, skipping update')
      return
    }

    const clients = await clientResponse.json()
    if (!clients || clients.length === 0) {
      console.log('No Keycloak client found, skipping configuration update')
      return
    }

    const [client] = clients

    // Ensure redirectUris and webOrigins are arrays before creating Sets
    const currentRedirectUris = new Set(client.redirectUris || [])
    const currentWebOrigins = new Set(client.webOrigins || [])
    
    // Track all URLs we're adding for logging
    const addedUrls = {
      redirectUris: {},
      webOrigins: {}
    }

    // Use branchURL if available
    if (branchURL) {
      // Add to redirect URIs
      currentRedirectUris.add(branchURL)
      currentRedirectUris.add(`${branchURL}/*`)
      
      // Add to web origins
      currentWebOrigins.add(branchURL)
      
      // Add to tracking
      addedUrls.redirectUris.branchUrl = branchURL
      addedUrls.redirectUris.branchUrlWildcard = `${branchURL}/*`
      addedUrls.webOrigins.branchUrl = branchURL
      
      console.log(`Adding branch URL: ${branchURL}`)
    } else {
      console.log('No branch URL available - cannot add URLs')
    }

    // Update client
    const updateResponse = await fetch(`${keycloakBaseUrl}admin/realms/${realm}/clients/${client.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        ...client,
        redirectUris: Array.from(currentRedirectUris),
        webOrigins: Array.from(currentWebOrigins),
      }),
    })

    if (updateResponse.ok) {
      console.log('Successfully updated Keycloak client configuration:', {
        branchURL: branchURL || 'not available',
        addedUrls
      })
    } else {
      console.log('Failed to update Keycloak client configuration')
    }
  } catch (error) {
    console.log('Error updating Keycloak client configuration (non-fatal):', error.message)
    // Don't exit with error code - let the build continue
  }
}

updateKeycloakRedirectURIs()
