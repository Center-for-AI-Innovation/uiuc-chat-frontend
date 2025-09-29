import { type CourseMetadata } from '~/types/courseMetadata'
import type { AuthContextProps } from 'react-oidc-context'

export const get_user_permission = (
  course_metadata: CourseMetadata,
  auth: AuthContextProps,
) => {
  // const router = useRouter()

  if (course_metadata && Object.keys(course_metadata).length > 0) {
    // If loading or error, return no_permission temporarily
    if (auth.isLoading) {
      return 'no_permission'
    }

    if (auth.error) {
      console.error('Auth error:', auth.error)
      return 'no_permission'
    }

    // Get user email from OIDC profile
    const userEmail = auth.user?.profile.email

    if (!course_metadata.is_private) {
      // Course is public

      if (!auth.isAuthenticated) {
        return 'view'
      }

      if (
        userEmail &&
        (userEmail === course_metadata.course_owner ||
          course_metadata.course_admins.includes(userEmail))
      ) {
        // owner or admin
        return 'edit'
      } else {
        // course is public, so return view to non-admins.
        return 'view'
      }
    } else {
      if (!auth.isAuthenticated) {
        console.log(
          'User is not signed in. Course is private. Auth: no_permission.',
        )
        return 'no_permission'
      }

      if (
        userEmail &&
        (userEmail === course_metadata.course_owner ||
          course_metadata.course_admins.includes(userEmail))
      ) {
        // You are the course owner or an admin
        // Can edit and view.
        return 'edit'
      } else if (
        userEmail &&
        course_metadata.approved_emails_list?.includes(userEmail)
      ) {
        // Not owner or admin, can't edit. But is USER so CAN VIEW
        return 'view'
      } else if (course_metadata.allow_logged_in_users) {
        // special case for private courses with allow_logged_in_users
        console.log('private && allow_logged_in_users. Auth: view.')
        return 'view'
      } else {
        // Cannot edit or view
        console.log(
          'User is not an admin, owner, or approved user. Course is private. Auth: no_permission.',
        )
        return 'no_permission'
      }
    }
  } else {
    // no course_metadata
    throw new Error(
      `No course metadata provided. Course_metadata: ${course_metadata}`,
    )
  }
}
