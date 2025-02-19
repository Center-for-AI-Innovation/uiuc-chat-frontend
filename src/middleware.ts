import { NextResponse } from 'next/server'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import type { NextRequest } from 'next/server'
import { type NextFetchEvent } from 'next/server'

// Private by default, public routes are defined below (regex)
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api(.*)',
  '/', // landing page
  '/:singleLevel([^/]+)', // single level path
  '/:singleLevel([^/]+)/chat', // course chat pages
])

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
  // First check for materials redirect
  const redirectResponse = materialsRedirectMiddleware(request)
  if (redirectResponse) return redirectResponse

  // Then proceed with Clerk middleware
  const authMiddleware = clerkMiddleware((auth) => {
    if (!isPublicRoute(request)) {
      auth().protect()
    }
  })

  // Pass both request and event arguments
  return authMiddleware(request, {} as NextFetchEvent)
}

// Update the matcher to include the materials routes
export const config = {
  matcher: [
    '/((?!.*\\..*|_next).*)',
    '/',
    '/(api|trpc)/(.*)',
    '/\\[course_name\\]/gpt4',
    '/:path*/materials', // Add this line to match materials routes
  ],
}
