import { CourseMetadata } from '~/types/courseMetadata'
import { extractEmailsFromClerk } from './clerkHelpers'
// import { extractEmailsFromClerk } from './clerkHelpers'
import type { AuthContextProps } from 'react-oidc-context'

export const get_user_permission = (
  course_metadata: CourseMetadata,
  // clerk_user: any,
  // router: any,
  auth: AuthContextProps
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

    // if private && not signed in, redirect
    // if (course_metadata.is_private && !clerk_user.isSignedIn) {
      if (course_metadata.is_private && !auth.isAuthenticated) {
      console.log('private && not signed in, redirect ', auth.user)
      return 'no_permission'
    }

    // const curr_user_email_addresses = extractEmailsFromClerk(clerk_user.user)
    // Get user email from OIDC profile
    const userEmail = auth.user?.profile.email

    if (!course_metadata.is_private) {
      // Course is public
      // if (!clerk_user.isSignedIn) {
      if (!auth.isAuthenticated) {
        return 'view'
      }

      // if (
      //   // clerk_user must be be signed in now.
      //   curr_user_email_addresses.includes(course_metadata.course_owner) ||
      //   course_metadata.course_admins.some((email) =>
      //     curr_user_email_addresses.includes(email),
      //   )
      // ) {
      if (
        userEmail && (
          userEmail === course_metadata.course_owner ||
          course_metadata.course_admins.includes(userEmail)
        )
      ) {
        // owner or admin
        return 'edit'
      } else {
        // course is public, so return view to non-admins.
        return 'view'
      }
    } else {
      // Course is Private
      // if (!clerk_user.isSignedIn) {
      if (!auth.isAuthenticated) {
        console.log(
          'User is not signed in. Course is private. Auth: no_permission.',
        )
        return 'no_permission'
      }

      // if (
      //   curr_user_email_addresses.includes(course_metadata.course_owner) ||
      //   course_metadata.course_admins.some((email) =>
      //     curr_user_email_addresses.includes(email),
      //   )
      // ) {
        if (
          userEmail && (
          userEmail === course_metadata.course_owner ||
          course_metadata.course_admins.includes(userEmail)
          )
        ) {
        // You are the course owner or an admin
        // Can edit and view.
        return 'edit'
      // } else if (
      //   course_metadata.approved_emails_list.some((email) =>
      //     curr_user_email_addresses.includes(email),
      //   )
      // ) {
      } else if ( userEmail && course_metadata.approved_emails_list.includes(userEmail)) {
        // Not owner or admin, can't edit. But is USER so CAN VIEW
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
