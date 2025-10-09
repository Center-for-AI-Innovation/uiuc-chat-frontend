# Course-Based Role Authentication

This document explains how to use the course-based role checking functionality added to `authMiddleware.ts` to secure API endpoints based on user roles within specific courses.

## Overview

The system supports three levels of course access:

- **Course Owner**: The user who created the course (highest privileges)
- **Course Admin**: Users with administrative privileges for the course
- **Course Regular User**: Users with basic access to the course

## Available Functions

### Role Checking Functions

```typescript
// Check if user is a course admin
isCourseAdmin(user: AuthenticatedUser, courseMetadata: CourseMetadata): boolean

// Check if user is the course owner
isCourseOwner(user: AuthenticatedUser, courseMetadata: CourseMetadata): boolean

// Check if user is an approved user for the course
isApprovedUser(user: AuthenticatedUser, courseMetadata: CourseMetadata): boolean

// Check if user has any access to the course (admin, owner, or approved user)
hasCourseAccess(user: AuthenticatedUser, courseMetadata: CourseMetadata): boolean

// Check if user is a regular user (not admin or owner) but has course access
isCourseRegularUser(user: AuthenticatedUser, courseMetadata: CourseMetadata): boolean
```

### Helper Functions

```typescript
// Get course metadata from Redis
getCourseMetadata(courseName: string): Promise<CourseMetadata | null>

// Extract course name from request (query params, body, or headers)
extractCourseName(req: NextApiRequest): string | null
```

## Middleware Functions

### 1. `withCourseAccess(courseName: string)`

Requires any level of access to the specified course.

```typescript
import { withCourseAccess } from '~/utils/authMiddleware'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Handler logic here
  // req.courseName will be set to the course name
}

export default withCourseAccess('my-course')(handler)
```

### 2. `withCourseAdminAccess(courseName: string)`

Requires admin or owner access to the specified course.

```typescript
import { withCourseAdminAccess } from '~/utils/authMiddleware'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Handler logic here
  // req.courseName will be set to the course name
}

export default withCourseAdminAccess('my-course')(handler)
```

### 3. `withCourseOwnerAccess(courseName: string)`

Requires owner access to the specified course.

```typescript
import { withCourseOwnerAccess } from '~/utils/authMiddleware'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Handler logic here
  // req.courseName will be set to the course name
}

export default withCourseOwnerAccess('my-course')(handler)
```

### 4. `withCourseAccessFromRequest(accessLevel: 'any' | 'admin' | 'owner')`

Automatically extracts course name from the request and applies the specified access level.

```typescript
import { withCourseAccessFromRequest } from '~/utils/authMiddleware'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Handler logic here
  // req.courseName will be set to the extracted course name
}

// For any course access
export default withCourseAccessFromRequest('any')(handler)

// For admin access
export default withCourseAccessFromRequest('admin')(handler)

// For owner access
export default withCourseAccessFromRequest('owner')(handler)
```

## Course Name Extraction

The `withCourseAccessFromRequest` middleware automatically looks for course names in the following order:

1. Query parameter: `?courseName=my-course`
2. Query parameter: `?course_name=my-course`
3. Request body: `{ "courseName": "my-course" }`
4. Request body: `{ "course_name": "my-course" }`
5. Header: `X-Course-Name: my-course`

## Usage Examples

### Example 1: Basic Course Access

```typescript
// pages/api/course-materials.ts
import { withCourseAccess, AuthenticatedRequest } from '~/utils/authMiddleware'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // This endpoint is accessible to any user with access to the course
  return res.status(200).json({
    message: 'Course materials retrieved',
    courseName: req.courseName,
    user: req.user?.email,
  })
}

export default withCourseAccess('cs101')(handler)
```

### Example 2: Admin-Only Course Management

```typescript
// pages/api/course-settings.ts
import {
  withCourseAdminAccess,
  AuthenticatedRequest,
} from '~/utils/authMiddleware'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // This endpoint is only accessible to course admins and owners
  return res.status(200).json({
    message: 'Course settings updated',
    courseName: req.courseName,
    admin: req.user?.email,
  })
}

export default withCourseAdminAccess('cs101')(handler)
```

### Example 3: Dynamic Course Access

```typescript
// pages/api/course-data.ts
import {
  withCourseAccessFromRequest,
  AuthenticatedRequest,
} from '~/utils/authMiddleware'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Course name is extracted from the request automatically
  return res.status(200).json({
    message: 'Course data retrieved',
    courseName: req.courseName,
    user: req.user?.email,
  })
}

// Accessible via: GET /api/course-data?courseName=cs101
export default withCourseAccessFromRequest('any')(handler)
```

### Example 4: Owner-Only Operations

```typescript
// pages/api/delete-course.ts
import {
  withCourseOwnerAccess,
  AuthenticatedRequest,
} from '~/utils/authMiddleware'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Only the course owner can delete the course
  return res.status(200).json({
    message: 'Course deleted',
    courseName: req.courseName,
    owner: req.user?.email,
  })
}

export default withCourseOwnerAccess('cs101')(handler)
```

## Error Responses

The middleware returns appropriate HTTP status codes:

- **401 Unauthorized**: User not authenticated
- **403 Forbidden**: User doesn't have required access level
- **404 Not Found**: Course doesn't exist
- **400 Bad Request**: Course name not provided (for dynamic access)

## Course Metadata Structure

The system expects course metadata stored in Redis with the following structure:

```typescript
interface CourseMetadata {
  is_private: boolean
  course_owner: string // Email of course owner
  course_admins: string[] // Array of admin emails
  approved_emails_list: string[] // Array of approved user emails
  // ... other course properties
}
```

## Best Practices

1. **Use specific access levels**: Choose the most restrictive access level that still allows the functionality to work.

2. **Handle errors gracefully**: The middleware handles authentication and authorization errors, but you should handle business logic errors in your handlers.

3. **Log access attempts**: Consider logging access attempts for security auditing.

4. **Cache course metadata**: For high-traffic endpoints, consider caching course metadata to reduce Redis calls.

5. **Validate course names**: Ensure course names are properly validated and sanitized.

## Migration Guide

To migrate existing endpoints to use course-based authentication:

1. Import the appropriate middleware function
2. Wrap your handler with the middleware
3. Update your handler to use `req.courseName` if needed
4. Test with different user roles to ensure proper access control

```typescript
// Before
export default withAuth(handler)

// After
export default withCourseAccess('my-course')(handler)
// or
export default withCourseAccessFromRequest('admin')(handler)
```
