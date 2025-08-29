import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getKeycloakBaseFromHost } from '~/utils/authHelpers'

// // Private by default, public routes are defined below (regex)
// const isPublicRoute = createRouteMatcher([
//   '/sign-in(.*)',
//   '/sign-up(.*)',
//   '/api(.*)',
//   '/', // landing page
//   '/:singleLevel([^/]+)', // single level path
//   '/:singleLevel([^/]+)', // course chat pages
// ])

// --- Secure Redirect Path Validation ---
const isValidRedirectPath = (path: string): boolean => {
  if (!path || typeof path !== 'string' || !path.startsWith('/')) return false
  const dangerousPatterns = [
    /^\/api\//,
    /^\/_next\//,
    /^\/admin\//,
    /^\/internal\//,
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /file:/i,
  ]
  return !dangerousPatterns.some((pattern) => pattern.test(path))
}

const PUBLIC_ROUTES = [
  '/',
  // '/sign-in',
  // '/sign-up',
  '/silent-renew',
  '/api/(.*)',
  '/:singleLevel([^/]+)',
  '/:singleLevel([^/]+)',
  '/:singleLevel([^/]+)/chat',
]

// Helper to check if this is a preview deployment
const isPreviewDeployment = () => {
  return process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'
}

// Helper to check if this is an auth-related path
const isAuthPath = (pathname: string, search: string) => {
  // Check if this is the initial auth request (not the callback)
  return (
    pathname === '/' && !search.includes('code=') && !search.includes('state=')
  )
}

// helper: store current safe path as cookie (used for post-login redirect)
function storeRedirectPathCookie(req: NextRequest, res: NextResponse) {
  const pathWithQuery = req.nextUrl.pathname + req.nextUrl.search
  if (isValidRedirectPath(pathWithQuery)) {
    res.cookies.set('auth_redirect_path', pathWithQuery, {
      httpOnly: true,
      sameSite: 'lax',
      secure: req.nextUrl.protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https',
      path: '/',
      // short TTL is fine; typical login completes quickly
      maxAge: 10 * 60 /* 10 minutes */,
    })
  }
}

// helper: compute final post-auth redirect
function computePostAuthRedirect(raw: string | undefined) {
  let redirectPath = raw && isValidRedirectPath(raw) ? raw : '/'

  // special case: root → /chat if enabled
  if (
    redirectPath === '/' &&
    process.env.NEXT_PUBLIC_USE_ILLINOIS_CHAT_CONFIG === 'True'
  ) {
    redirectPath = '/chat'
  }
  return redirectPath
}

// Create a middleware handler that runs before auth
function materialsRedirectMiddleware(request: NextRequest) {
  const url = request.nextUrl
  // Check if the URL matches the pattern /{project_name}/materials
  const materialsPattern = /^\/([^\/]+)\/materials$/
  const match = url.pathname.match(materialsPattern)

  if (match) {
    // Get the project_name from the URL
    const projectName = match[1]
    // Create the new URL for redirection
    const newUrl = new URL(`/${projectName}/dashboard`, url)
    return NextResponse.redirect(newUrl)
  }

  return null
}

// Combine the middlewares
export default async function middleware(request: NextRequest) {
  const { pathname, search, origin } = request.nextUrl

  // Case 0: handle OIDC callback: if code+state present, redirect using cookie
  const hasCode = request.nextUrl.searchParams.has('code')
  const hasState = request.nextUrl.searchParams.has('state')
  const hasSessionState = request.nextUrl.searchParams.has('session_state')
  if (hasCode && hasState && hasSessionState) {
    const cookieVal = request.cookies.get('auth_redirect_path')?.value
    const redirectTo = computePostAuthRedirect(cookieVal)
    const res = NextResponse.redirect(new URL(redirectTo, origin))
    // clear cookie
    res.cookies.delete('auth_redirect_path')
    return res
  }

  // Case 1:  materials redirect
  const materialsRedirect = materialsRedirectMiddleware(request)
  if (materialsRedirect) return materialsRedirect

  // Case 2: for preview deployments, redirect unauthenticated users to Keycloak
  if (isPreviewDeployment() && isAuthPath(pathname, search)) {
    const stateData = {
      redirect: origin,
      timestamp: Date.now(),
    }
    const encodedState = Buffer.from(JSON.stringify(stateData))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    // Redirect to Keycloak auth URL directly
    const hostname =
      request.headers.get('x-forwarded-host') ??
      request.headers.get('host') ??
      'localhost'

    const protocol =
      request.headers.get('x-forwarded-proto') ??
      request.nextUrl.protocol.replace(':', '') ??
      'http'

    const keycloakBaseUrl = getKeycloakBaseFromHost(hostname, protocol)
    const keycloakUrl = `${keycloakBaseUrl}realms/${process.env.NEXT_PUBLIC_KEYCLOAK_REALM}/protocol/openid-connect/auth`
    const authUrl = new URL(keycloakUrl)
    authUrl.searchParams.set(
      'client_id',
      process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'uiucchat',
    )
    authUrl.searchParams.set('redirect_uri', origin)
    authUrl.searchParams.set('state', encodedState)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', 'openid profile email')

    return NextResponse.redirect(authUrl)
  }

  // Case 3: allow public routes without blocking; but also keep our cookie fresh on normal GETs
  const isPublic = PUBLIC_ROUTES.some((route) => {
    if (route.endsWith('(.*)')) {
      const baseRoute = route.replace('(.*)', '')
      return pathname.startsWith(baseRoute)
    }
    return pathname === route
  })

  // let it through by default
  const res = NextResponse.next()

  // refresh redirect cookie on regular navigations so we always have a recent target
  const isCallbackLike = hasCode || hasState || hasSessionState
  const isAsset =
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname === '/favicon.ico'

  if (!isCallbackLike && !isAsset) {
    storeRedirectPathCookie(request, res)
  }

  if (isPublic) return res

  // case 4: course routes hint to client that auth is required
  const courseRoutePattern = /^\/[^\/]+\/.*$/
  if (courseRoutePattern.test(pathname)) {
    // Add auth check header for client-side handling
    const response = NextResponse.next()
    response.headers.set('x-auth-required', 'true')
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/auth).*)',
  ],
}
