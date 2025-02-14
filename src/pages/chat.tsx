// export { default } from '~/pages/api/home'

import { NextPage } from 'next'
import Home from '~/pages/api/home/home'

const ChatPage: NextPage = () => {
  const course_metadata = {
    is_private: false,
    course_owner: 'kvday2@illinois.edu',
    course_admins: ['kvday2@illinois.edu'],
    approved_emails_list: [],
    example_questions: [],
    banner_image_s3: '',
    course_intro_message: `Welcome to UIUC.chat. Use this page as a free alternative to ChatGPT.com and Claude.ai. 

There's free and unlimited access to all the leading open source LLMs that we host here at UIUC's National Center for Supercomputing Applications (NCSA). 

Learn more at ai.ncsa.illinois.edu`,
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
