/**
 * Create a new project
 * @param project_name - The name of the project
 * @param project_description - Optional description of the project
 * @param project_owner_email - Email of the project owner
 * @param is_private - Whether the project is private (default: false)
 * @returns Promise<boolean> - true if successful, throws error on failure
 */
export const createProject = async (
  project_name: string,
  project_description: string | undefined,
  project_owner_email: string,
  is_private = false,
): Promise<boolean> => {
  try {
    const response = await fetch('/api/UIUC-api/createProject', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        project_name,
        project_description,
        project_owner_email,
        is_private,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'Unknown error',
        message: `Failed to create the project. Status: ${response.status}`,
      }))

      // Throw error with status code and message for better error handling
      const error = new Error(errorData.message || errorData.error) as Error & {
        status?: number
        error?: string
      }
      error.status = response.status
      error.error = errorData.error
      throw error
    }

    return true
  } catch (error) {
    console.error(error)
    throw error
  }
}
