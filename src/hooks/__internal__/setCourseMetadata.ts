import {
  type CourseMetadata,
  type CourseMetadataOptionalForUpsert,
} from '~/types/courseMetadata'

export async function callSetCourseMetadata(
  courseName: string,
  courseMetadata: CourseMetadata | CourseMetadataOptionalForUpsert,
): Promise<boolean> {
  try {
    const response = await fetch('/api/UIUC-api/upsertCourseMetadata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseName, courseMetadata }),
    })
    const data = await response.json()

    if (data.success) {
      return true
    } else {
      console.error('Error setting course metadata', {
        course_name: courseName,
        error: data.error,
      })
      return false
    }
  } catch (error) {
    console.error('Error setting course metadata', {
      course_name: courseName,
      error,
    })
    return false
  }
}
