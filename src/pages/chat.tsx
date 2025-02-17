// This is uiuc.chat/chat - useful to everyone as a free alternative to ChatGPT.com and Claude.ai.

import { NextPage } from 'next'
import Home from '~/pages/api/home/home'

const ChatPage: NextPage = () => {
  const course_metadata = {
    is_private: false,
    course_owner: 'kvday2@illinois.edu',
    course_admins: ['kvday2@illinois.edu'],
    approved_emails_list: [],
    example_questions: [''],
    banner_image_s3: '',
    course_intro_message: `Welcome to UIUC.chat, a free & open source alternative to ChatGPT and Claude. 

We host the leading open source LLMs here at the University of Illinois' National Center for Supercomputing Applications (NCSA). 

At any time, you can customize your own by uploading documents or by using our web crawler at https://uiuc.chat/new

Supported by the Center for AI Innovation: https://ai.ncsa.illinois.edu`,
    system_prompt:
      "You are a helpful assistant. Follow the user's instructions carefully. Respond using markdown.",
    openai_api_key: '',
    guidedLearning: false,
    documentsOnly: false,
    systemPromptOnly: false,
    course_title: 'Chat',
    course_description: '',
    disabled_models: [],
    project_description: '',
    vector_search_rewrite_disabled: false,
  }

  return (
    <>
      <Home
        current_email={'kvday2@illinois.edu'}
        course_metadata={course_metadata}
        course_name={'chat'}
        document_count={0}
        link_parameters={{
          guidedLearning: false,
          documentsOnly: false,
          systemPromptOnly: false,
        }}
      />
    </>
  )
}

export default ChatPage
