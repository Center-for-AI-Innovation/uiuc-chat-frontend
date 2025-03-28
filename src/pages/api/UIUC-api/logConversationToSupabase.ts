import { supabase } from '@/utils/supabaseClient'
import { Content, Conversation } from '~/types/chat'
import { RunTree } from 'langsmith'
import { sanitizeForLogging } from '@/utils/sanitization'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
}

const logConversationToSupabase = async (req: any, res: any) => {
  const { course_name, conversation } = req.body as {
    course_name: string
    conversation: Conversation
  }

  // Sanitize the entire conversation object
  const sanitizedConversation = sanitizeForLogging(conversation)

  const { data, error } = await supabase.from('llm-convo-monitor').upsert(
    [
      {
        convo: sanitizedConversation,
        convo_id: await sanitizedConversation.id.toString(),
        course_name: course_name,
        user_email: sanitizedConversation.userEmail,
        summary: sanitizedConversation.summary,
      },
    ],
    {
      onConflict: 'convo_id',
    },
  )
  if (error) {
    console.log('new error form supabase in logConversationToSupabase:', error)
  }

  // Send to our custom monitor
  try {
    const response = await fetch(
      process.env.RAILWAY_URL + '/llm-monitor-message',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // messages: sanitizedConversation.messages, // we get these from Supabase on the backend.
          course_name: course_name,
          conversation_id: conversation.id,
          model_name: conversation.model.name,
          user_email: sanitizedConversation.userEmail,
        }),
      },
    )

    if (!response.ok) {
      console.error('Error sending to AI TA backend:', response.statusText)
    }
  } catch (error) {
    console.error('Error sending to AI TA backend:', error)
  }

  // console.log('👇👇👇👇👇👇👇👇👇👇👇👇👇')
  // console.log(
  //   '2nd Latest message object (user)',
  //   conversation.messages[conversation.messages.length - 2],
  // )
  // console.log(
  //   'Latest message object (assistant)',
  //   conversation.messages[conversation.messages.length - 1],
  // )
  // console.log('full convo id', conversation.id)
  // console.log(
  //   'User message',
  //   (
  //     conversation.messages[conversation.messages.length - 2]
  //       ?.content[0] as Content
  //   ).text,
  // )
  // console.log(
  //   'Assistant message',
  //   conversation.messages[conversation.messages.length - 2]?.content,
  // )
  // console.log(
  //   'Engineered prompt',
  //   conversation.messages[conversation.messages.length - 2]!
  //     .finalPromtEngineeredMessage,
  // )
  // console.log(
  //   'System message',
  //   conversation.messages[conversation.messages.length - 2]!
  //     .latestSystemMessage,
  // )
  // console.log('👆👆👆👆👆👆👆👆👆👆👆👆👆')

  // Log to Langsmith
  const rt = new RunTree({
    run_type: 'llm',
    name: 'Final Response Log',
    inputs: {
      'User input': sanitizeForLogging(
        (
          conversation.messages[conversation.messages.length - 2]
            ?.content[0] as Content
        )?.text,
      ),
      'System message': sanitizeForLogging(
        conversation.messages[conversation.messages.length - 2]!
          .latestSystemMessage,
      ),
      'Engineered prompt': sanitizeForLogging(
        conversation.messages[conversation.messages.length - 2]!
          .finalPromtEngineeredMessage,
      ),
    },
    outputs: {
      Assistant: sanitizeForLogging(
        conversation.messages[conversation.messages.length - 1]?.content,
      ),
    },
    project_name: 'uiuc-chat-production',
    metadata: {
      projectName: course_name,
      conversation_id: conversation.id,
      tools: sanitizeForLogging(
        conversation.messages[conversation.messages.length - 2]?.tools,
      ),
    }, // "conversation_id" is a SPECIAL KEYWORD. CANNOT BE ALTERED: https://docs.smith.langchain.com/old/monitoring/faq/threads
    // id: conversation.id, // DON'T USE - breaks the threading support
  })

  // End and submit the run
  rt.end()
  await rt.postRun()
  // console.log('✅✅✅✅✅✅✅✅ AFTER ALL LANGSMITH CALLS')

  return res.status(200).json({ success: true })
}

export default logConversationToSupabase
