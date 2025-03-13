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
    const branchName = process.env.VERCEL_GIT_COMMIT_REF // Gets the branch name
    const teamSlug = 'caiis-projects' // Your team slug
    
    // List of all projects
    const projects = ['illinois-chat', 'uiuc-chat-frontend', 'hpc-gpt']
    
    // Determine which project we're currently deploying
    let currentProject = null
    
    // Check if this is HPC-GPT based on environment variable
    if (process.env.IS_HPC_GPT === 'true') {
      currentProject = 'hpc-gpt'
      console.log('Detected HPC-GPT project from IS_HPC_GPT environment variable')
    } else if (process.env.VERCEL_PROJECT_NAME) {
      currentProject = process.env.VERCEL_PROJECT_NAME
      console.log(`Detected project from VERCEL_PROJECT_NAME: ${currentProject}`)
    } else {
      // Try to determine from VERCEL_URL if project name not available
      for (const project of projects) {
        if (process.env.VERCEL_URL && process.env.VERCEL_URL.includes(project)) {
          currentProject = project
          console.log(`Detected project from VERCEL_URL: ${currentProject}`)
          break
        }
      }
      
      if (!currentProject) {
        console.log('Could not determine project name from environment variables')
      }
    }

    // Ensure redirectUris and webOrigins are arrays before creating Sets
    const currentRedirectUris = new Set(client.redirectUris || [])
    const currentWebOrigins = new Set(client.webOrigins || [])
    
    // Track all URLs we're adding for logging
    const addedUrls = {
      redirectUris: {},
      webOrigins: {}
    }

    // If we have a branch name and project name, add branch-specific URLs
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
      
      console.log(`Adding branch URL: ${branchUrl}`)
    } 
    // If we have the project but no branch name, try to use VERCEL_URL
    else if (currentProject && process.env.VERCEL_URL) {
      const vercelUrl = `https://${process.env.VERCEL_URL}`
      
      // Add to redirect URIs
      currentRedirectUris.add(vercelUrl)
      currentRedirectUris.add(`${vercelUrl}/*`)
      
      // Add to web origins
      currentWebOrigins.add(vercelUrl)
      
      // Add to tracking
      addedUrls.redirectUris.vercelUrl = vercelUrl
      addedUrls.redirectUris.vercelUrlWildcard = `${vercelUrl}/*`
      addedUrls.webOrigins.vercelUrl = vercelUrl
      
      console.log(`No branch name available, adding Vercel URL: ${vercelUrl}`)
    } else {
      console.log('No URLs to add - missing required information')
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
      branchName: branchName || 'unknown',
      vercelUrl: process.env.VERCEL_URL || 'unknown',
      addedUrls
    })
  } catch (error) {
    console.error('Error updating Keycloak client configuration:', error)
    process.exit(1)
  }
}

updateKeycloakRedirectURIs()
