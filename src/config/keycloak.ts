import { getKeycloakBaseUrl } from '~/utils/authHelpers'

const keycloakConfig = {
  realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'illinois-chat-realm',
  clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'illinois-chat',
  url: getKeycloakBaseUrl(),
}

export default keycloakConfig
