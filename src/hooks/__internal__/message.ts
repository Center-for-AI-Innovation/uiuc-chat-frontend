import { type Message } from '@/types/chat'

export async function upsertMessageToServer(
  message: Message,
  conversationId: string,
  user_email: string,
  course_name: string,
) {
  const MAX_RETRIES = 3
  let retryCount = 0

  while (retryCount < MAX_RETRIES) {
    try {
      console.log('In upsertMessageToServer')
      const response = await fetch('/api/messages/upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationId,
          user_email,
          course_name,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const errorMessage = errorData?.error || response.statusText
        throw new Error(`Error upserting message: ${errorMessage}`)
      }

      return response.json()
    } catch (error: any) {
      console.error(
        `Error upserting message (attempt ${retryCount + 1}/${MAX_RETRIES}):`,
        error,
      )
      if (error.code === 'ECONNRESET' && retryCount < MAX_RETRIES - 1) {
        retryCount++
        await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount)) // Exponential backoff
        continue
      }
      throw error
    }
  }
}

// Keep the delete function but mark it as deprecated
/** @deprecated Use upsertMessageToServer instead */
export async function deleteMessagesFromServer(
  messageIds: string[],
  course_name: string,
) {
  console.warn(
    'deleteMessagesFromServer is deprecated. Use upsertMessageToServer instead',
  )
  const MAX_RETRIES = 3
  let retryCount = 0

  while (retryCount < MAX_RETRIES) {
    try {
      console.log('In deleteMessagesFromServer')
      const response = await fetch(`/api/deleteMessages`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageIds, course_name }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const errorMessage = errorData?.error || response.statusText
        throw new Error(`Error deleting messages: ${errorMessage}`)
      }

      return // Success
    } catch (error: any) {
      console.error(
        `Error deleting messages (attempt ${retryCount + 1}/${MAX_RETRIES}):`,
        error,
      )
      if (error.code === 'ECONNRESET' && retryCount < MAX_RETRIES - 1) {
        retryCount++
        await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount)) // Exponential backoff
        continue
      }
      throw error
    }
  }
}
