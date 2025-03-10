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

    // Get Vercel deployment URLs
    const vercelBaseUrl = `https://${process.env.VERCEL_URL}`
    const branchName = process.env.VERCEL_GIT_COMMIT_REF // Gets the branch name
    const teamSlug = 'caiis-projects' // Your team slug
    
    // List of all projects
    const projects = ['illinois-chat', 'uiuc-chat-frontend', 'hpc-gpt']
    
    // Determine which project we're currently deploying
    let currentProject = null
    if (process.env.VERCEL_PROJECT_NAME) {
      currentProject = process.env.VERCEL_PROJECT_NAME
    } else {
      // Try to determine from VERCEL_URL if project name not available
      for (const project of projects) {
        if (process.env.VERCEL_URL && process.env.VERCEL_URL.includes(project)) {
          currentProject = project
          break
        }
      }
      
      // Default to the vercel base URL if we can't determine the project
      if (!currentProject) {
        console.log('Could not determine project name, using vercelBaseUrl only')
      }
    }

    // Ensure redirectUris and webOrigins are arrays before creating Sets
    const currentRedirectUris = new Set(client.redirectUris || [])
    const currentWebOrigins = new Set(client.webOrigins || [])
    
    // Add the base Vercel URL
    currentRedirectUris.add(vercelBaseUrl)
    currentRedirectUris.add(`${vercelBaseUrl}/*`)
    currentWebOrigins.add(vercelBaseUrl)
    
    // Track all URLs we're adding for logging
    const addedUrls = {
      redirectUris: {},
      webOrigins: {}
    }
    
    // Add base URL to tracking
    addedUrls.redirectUris.vercelBaseUrl = vercelBaseUrl
    addedUrls.redirectUris.vercelBaseUrlWildcard = `${vercelBaseUrl}/*`
    addedUrls.webOrigins.vercelBaseUrl = vercelBaseUrl

    // If we have a branch name, add branch-specific URLs for the current project
    if (branchName && currentProject) {
      const branchUrl = `https://${currentProject}-git-${branchName}-${teamSlug}.vercel.app`
      
      // Add to redirect URIs
      currentRedirectUris.add(branchUrl)
      currentRedirectUris.add(`${branchUrl}/*`)
      
      // Add to web origins
      currentWebOrigins.add(branchUrl)
      
      // Add to tracking
      addedUrls.redirectUris.branchUrl = branchUrl
      addedUrls.redirectUris.branchUrlWildcard = `${branchUrl}/*`
      addedUrls.webOrigins.branchUrl = branchUrl
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
      project: currentProject || 'unknown',
      addedUrls
    })
  } catch (error) {
    console.error('Error updating Keycloak client configuration:', error)
    process.exit(1)
  }
}

updateKeycloakRedirectURIs()
