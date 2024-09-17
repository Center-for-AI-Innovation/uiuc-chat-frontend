import { supabase } from '@/utils/supabaseClient'
import { Content, Conversation } from '~/types/chat'
import { RunTree } from 'langsmith'

const logConversationToSupabase = async (req: any, res: any) => {
  const { course_name, conversation } = req.body as {
    course_name: string
    conversation: Conversation
  }

  const { data, error } = await supabase.from('llm-convo-monitor').upsert(
    [
      {
        convo: conversation,
        convo_id: conversation.id,
        course_name: course_name,
        user_email: conversation.userEmail,
      },
    ],
    {
      onConflict: 'convo_id',
    },
  )
  if (error) {
    console.log('error form supabase:', error)
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
    // inputs: { "Messages": conversation.messages },
    inputs: {
      'User input': (
        conversation.messages[conversation.messages.length - 2]
          ?.content[0] as Content
      ).text,
      'System message':
        conversation.messages[conversation.messages.length - 2]!
          .latestSystemMessage,
      'Engineered prompt':
        conversation.messages[conversation.messages.length - 2]!
          .finalPromtEngineeredMessage,
    },
    outputs: {
      Assistant:
        conversation.messages[conversation.messages.length - 1]?.content,
    },
    project_name: 'uiuc-chat-production',
    metadata: {
      projectName: course_name,
      conversation_id: conversation.id,
      tools: conversation.messages[conversation.messages.length - 2]?.tools,
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
