const fetch = require('node-fetch');

async function updateKeycloakRedirectURIs() {
  const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL;
  const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM;
  const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID;
  const adminUser = process.env.KEYCLOAK_ADMIN_USERNAME;
  const adminPass = process.env.KEYCLOAK_ADMIN_PASSWORD;

  // Check if required environment variables are set
  if (!keycloakUrl || !realm || !clientId || !adminUser || !adminPass) {
    console.error('Missing required environment variables.');
    process.exit(1);
  }

  // Ensure keycloakUrl is a valid absolute URL
  if (!/^https?:\/\//.test(keycloakUrl)) {
    console.error('Invalid Keycloak URL:', keycloakUrl);
    process.exit(1);
  }

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

    // Add both root and wildcard URLs for Vercel preview
    const vercelBaseUrl = `https://${process.env.VERCEL_URL}`;
    const currentRedirectUris = new Set(client.redirectUris);
    const currentWebOrigins = new Set(client.webOrigins || []);

    // Add to redirect URIs
    currentRedirectUris.add(vercelBaseUrl); // Add root URL
    currentRedirectUris.add(`${vercelBaseUrl}/*`); // Add wildcard path

    // Add to web origins
    currentWebOrigins.add(vercelBaseUrl);

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
        root: vercelBaseUrl,
        wildcard: `${vercelBaseUrl}/*`
      },
      webOrigins: {
        root: vercelBaseUrl
      }
    });
  } catch (error) {
    console.error('Error updating Keycloak client configuration:', error);
    process.exit(1);
  }
}

updateKeycloakRedirectURIs(); 