const fetch = require('node-fetch');

async function updateKeycloakRedirectURIs() {
  const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL;
  const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM;
  const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID;
  const adminUser = process.env.KEYCLOAK_ADMIN_USERNAME;
  const adminPass = process.env.KEYCLOAK_ADMIN_PASSWORD;

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
      }
    );

    const { access_token } = await tokenResponse.json();

    // Get current client config
    const clientResponse = await fetch(
      `${keycloakUrl}admin/realms/${realm}/clients?clientId=${clientId}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const [client] = await clientResponse.json();

    // Get Vercel deployment URLs
    const vercelBaseUrl = `https://${process.env.VERCEL_URL}`;
    const branchName = process.env.VERCEL_GIT_COMMIT_REF; // Gets the branch name
    const projectName = 'uiuc-chat-frontend'; // Your project name
    const teamSlug = 'caiis-projects'; // Your team slug
    
    // Construct branch-specific URL
    const branchUrl = branchName ? 
      `https://${projectName}-git-${branchName}-${teamSlug}.vercel.app` : 
      vercelBaseUrl;

    const currentRedirectUris = new Set(client.redirectUris);
    const currentWebOrigins = new Set(client.webOrigins || []);

    // Add to redirect URIs
    currentRedirectUris.add(vercelBaseUrl); // Add deployment-specific URL
    currentRedirectUris.add(`${vercelBaseUrl}/*`);
    currentRedirectUris.add(branchUrl); // Add branch URL
    currentRedirectUris.add(`${branchUrl}/*`);

    // Add to web origins
    currentWebOrigins.add(vercelBaseUrl);
    currentWebOrigins.add(branchUrl);

    // Update client
    await fetch(
      `${keycloakUrl}admin/realms/${realm}/clients/${client.id}`,
      {
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
      }
    );

    console.log('Successfully updated Keycloak client configuration:', {
      redirectUris: {
        deploymentUrl: vercelBaseUrl,
        deploymentUrlWildcard: `${vercelBaseUrl}/*`,
        branchUrl,
        branchUrlWildcard: `${branchUrl}/*`
      },
      webOrigins: {
        deploymentUrl: vercelBaseUrl,
        branchUrl
      }
    });
  } catch (error) {
    console.error('Error updating Keycloak client configuration:', error);
    process.exit(1);
  }
}

updateKeycloakRedirectURIs(); 