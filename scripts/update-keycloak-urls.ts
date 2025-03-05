import fetch from 'node-fetch';

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
          username: adminUser!,
          password: adminPass!,
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

    // Add Vercel preview URL to redirect URIs
    const vercelPreviewUrl = `https://${process.env.VERCEL_URL}/*`;
    const currentRedirectUris = new Set(client.redirectUris);
    currentRedirectUris.add(vercelPreviewUrl);

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
        }),
      }
    );

    console.log('Successfully added Vercel preview URL to Keycloak redirect URIs');
  } catch (error) {
    console.error('Error updating Keycloak redirect URIs:', error);
    process.exit(1);
  }
}

updateKeycloakRedirectURIs(); 