/*
 * This file makes Preview deploys on Vercel work with Keycloak auth.
 * We will have an ever growing list of redirectURIs and WebOrigins to enable keycloak on each unique preview deploy URI.
 */

const fetch = require('node-fetch')

async function updateKeycloakRedirectURIs() {
  const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL
  const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM
  const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID
  const adminUser = process.env.KEYCLOAK_ADMIN_USERNAME
  const adminPass = process.env.KEYCLOAK_ADMIN_PASSWORD
  const branchURL = process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL}` : null

  // Log the branch URL for debugging purposes
  console.log(`TEST Branch URL: ${branchURL}`)
  try {
    // Get access token
    const tokenResponse = await fetch(
      `${keycloakUrl}realms/master/protocol/openid-connect/token`,
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

    const { access_token } = await tokenResponse.json()

    // Get current client config
    const clientResponse = await fetch(
      `${keycloakUrl}admin/realms/${realm}/clients?clientId=${clientId}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      },
    )

    const [client] = await clientResponse.json()

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
    await fetch(`${keycloakUrl}admin/realms/${realm}/clients/${client.id}`, {
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

    console.log('Successfully updated Keycloak client configuration:', {
      branchURL: branchURL || 'not available',
      addedUrls
    })
  } catch (error) {
    console.error('Error updating Keycloak client configuration:', error)
    process.exit(1)
  }
}

updateKeycloakRedirectURIs()
