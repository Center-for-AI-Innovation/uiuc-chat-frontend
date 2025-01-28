const keycloakConfig = {
  realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'myrealm',
  clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'UIUCchat_vercel',
  url: process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'uiucchat-keycloak.up.railway.app',
}

export default keycloakConfig