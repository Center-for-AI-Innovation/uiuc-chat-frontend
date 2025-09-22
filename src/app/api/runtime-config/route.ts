export async function GET() {
  const config = {
    // Default to in-cluster Keycloak service if env not set
    keycloakUrl: process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://uiuc-chat-keycloak:8080/',
    keycloakRealm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'illinois_chat_realm',
    keycloakClientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'uiuc-chat-client',
  }

  return new Response(JSON.stringify(config), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  })
}


