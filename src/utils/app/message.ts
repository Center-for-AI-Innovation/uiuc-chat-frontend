export async function deleteMessagesFromServer(
  messageIds: string[],
  user_email: string,
  course_name: string,
) {
  try {
    console.log('In deleteMessagesFromServer')
    const response = await fetch(`/api/deleteMessages`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messageIds, user_email, course_name }),
    })

    if (!response.ok) {
      throw new Error('Error deleting messages')
    }
  } catch (error) {
    console.error('Error deleting messages:', error)
  }
}
