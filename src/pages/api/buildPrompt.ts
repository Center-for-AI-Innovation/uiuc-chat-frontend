import { type NextApiResponse } from 'next'
import { withAuth, type AuthenticatedRequest } from '~/utils/authMiddleware'
import { type ChatBody } from '@/types/chat'
import { buildPrompt } from '~/app/utils/buildPromptUtils'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const chatBody = req.body as ChatBody

    const { conversation, course_name, courseMetadata } = chatBody

    // **Add a nullish check for 'conversation'**
    if (!conversation) {
      console.error('Conversation is undefined.')
      return res.status(400).json({ error: 'Conversation is required.' })
    }

    // Ensure the handler is async and awaits buildPrompt
    const updatedConversation = await buildPrompt({
      conversation: conversation, // Now TypeScript knows 'conversation' is not undefined
      projectName: course_name,
      courseMetadata: courseMetadata,
    })

    return res.status(200).json(updatedConversation)
  } catch (error) {
    console.error('Error in buildPromptAPI:', error)

    return res.status(500).json({
      error: 'An error occurred in buildPromptAPI',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

export default withAuth(handler)
