// import { NextRequest, NextResponse } from 'next/server';
// import { get, getAll } from '@vercel/edge-config';
// const configItems = await getAll();

// export const config = { matcher: '/*' };

// export async function middleware() {
//   const greeting = await get('greeting');
//   return NextResponse.json(greeting);
// }

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Private by default, public routes are defined below (regex)
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api(.*)',
  '/', // landing page
  '/:singleLevel([^/]+)', // single level path
  '/:singleLevel([^/]+)/chat', // course chat pages
])

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth().protect()
  }
})

// export default authMiddleware({
//   publicRoutes: (req) => {
//     if (req.nextUrl.pathname.startsWith('/api/chat-api/keys')) {
//       return false
//     }
//     // Check if the URL path starts with /api/chat-api/stream or is exactly '/'
//     if (
//       req.nextUrl.pathname.startsWith('/api/chat-api/stream') ||
//       req.nextUrl.pathname === '/' ||
//       req.nextUrl.pathname.startsWith('/api')
//     ) {
//       return true
//     }

//     // Check if the URL path matches the dynamic route pattern for course chat pages
//     const courseChatRegex = /^\/[^\/]+\/chat$/
//     if (courseChatRegex.test(req.nextUrl.pathname)) {
//       return true
//     }
//     const courseGPT4Regex = /^\/[^\/]+\/gpt4$/
//     if (courseGPT4Regex.test(req.nextUrl.pathname)) {
//       return true
//     }

//     // Check if the URL path has a single level
//     const singleLevelPathRegex = /^\/[^\/]+$/
//     if (singleLevelPathRegex.test(req.nextUrl.pathname)) {
//       return true
//     }

//     // Default to not public
//     return false
//   },
// })

// Stop Middleware from running on static files
export const config = {
  matcher: [
    '/((?!.*\\..*|_next).*)',
    '/',
    '/(api|trpc)/(.*)',
    '/\\[course_name\\]/gpt4', // Add this line to match the route
  ],
}
