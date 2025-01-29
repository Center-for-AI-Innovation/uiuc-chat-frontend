const keycloakConfig = {
  realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'illinois-chat-realm',
  clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'illinois-chat',
  url: process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'https://login.uiuc.chat/',
}

export default keycloakConfig