import { NextResponse } from 'next/server'
// import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import type { NextRequest } from 'next/server'
// import { type NextFetchEvent } from 'next/server'

// // Private by default, public routes are defined below (regex)
// const isPublicRoute = createRouteMatcher([
//   '/sign-in(.*)',
//   '/sign-up(.*)',
//   '/api(.*)',
//   '/', // landing page
//   '/:singleLevel([^/]+)', // single level path
//   '/:singleLevel([^/]+)', // course chat pages
// ])

const PUBLIC_ROUTES = [
  '/',
  '/sign-in',
  '/sign-up',
  '/silent-renew',
  '/api/(.*)',
  '/:singleLevel([^/]+)',
  '/:singleLevel([^/]+)',
]

const AUTH_CALLBACK_ROUTES = [
  '/sign-in',
  '/sign-up',
  '/silent-renew'
]

// Create a middleware handler that runs before Clerk
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
  // // First check for materials redirect
  // const redirectResponse = materialsRedirectMiddleware(request)
  // if (redirectResponse) return redirectResponse

  // // Then proceed with Clerk middleware
  // const authMiddleware = clerkMiddleware((auth) => {
  //   if (!isPublicRoute(request)) {
  //     auth().protect()
  //   }
  // })

  // // Pass both request and event arguments
  // return authMiddleware(request, {} as NextFetchEvent)
  const { pathname } = request.nextUrl

  // Add specific handling for maintenance mode API endpoint
  if (pathname === '/api/UIUC-api/getMaintenanceModeFast') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Check if this is an auth callback URL
  const hasAuthCallbackParams = request.nextUrl.searchParams.has('state') &&
    request.nextUrl.searchParams.has('session_state') &&
    request.nextUrl.searchParams.has('code')

  // IMPORTANT: Allow ALL auth callback requests to proceed without interference
  if (hasAuthCallbackParams) {
    console.log('[Middleware] Allowing auth callback to proceed:', pathname)
    return NextResponse.next()
  }

  // Materials Redirect
  const redirectResponse = materialsRedirectMiddleware(request)
  if (redirectResponse) return redirectResponse

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => {
    if (route.endsWith('(.*)')) {
      const baseRoute = route.replace('(.*)', '')
      return pathname.startsWith(baseRoute)
    }
    return pathname === route
  })) {
    return NextResponse.next()
  }

  // For all other routes, treat as protected course routes
  const course_name = pathname.split('/')[1]
  if (course_name === 'sign-in' || course_name === 'sign-up') {
    // Redirect auth routes to proper auth pages
    return NextResponse.redirect(new URL(`/${course_name}`, request.url))
  }

  return NextResponse.next()
}

// // Update the matcher to include the materials routes
// export const config = {
//   matcher: [
//     '/((?!.*\\..*|_next).*)',
//     '/',
//     '/(api|trpc)/(.*)',
//     '/\\[course_name\\]/gpt4',
//     '/:path*/materials', // Add this line to match materials routes
//   ],
// }

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