import React from 'react'
import { useAuth } from 'react-oidc-context'

import HeaderStepNavigation from './HeaderStepNavigation'

import LargeDropzone from '../LargeDropzone'
import { type FileUpload } from '../UploadNotification'
import { type CourseMetadata } from '~/types/courseMetadata'

interface StepUploadProps {
  project_name: string
  setUploadFiles: React.Dispatch<React.SetStateAction<FileUpload[]>>
  courseMetadata?: CourseMetadata
}

const StepUpload = ({
  project_name,
  setUploadFiles,
  courseMetadata,
}: StepUploadProps) => {
  const auth = useAuth()

  // Default metadata for new courses when none is provided
  const defaultMetadata: CourseMetadata = {
    course_owner: auth.user?.profile.email || '',
    course_admins: [],
    approved_emails_list: [],
    is_private: false,
    banner_image_s3: undefined,
    course_intro_message: undefined,
    system_prompt: undefined,
    openai_api_key: undefined,
    disabled_models: undefined,
    project_description: undefined,
    documentsOnly: undefined,
    guidedLearning: undefined,
    systemPromptOnly: undefined,
    vector_search_rewrite_disabled: undefined,
    allow_logged_in_users: undefined,
    example_questions: undefined,
  }

  return (
    <>
      <div className="step">
        <HeaderStepNavigation
          project_name={project_name}
          title="Add Documents"
          description="Choose what your bot knows. And don't worry, you can always add more data later."
        />

        {/* step content - core step information */}
        <div className="step_content">
          {/* TODO: move this into a separate component so it can be shared in wizard and the project /dashboard/ page */}
          <LargeDropzone
            courseName={project_name}
            current_user_email={auth.user?.profile.email || ''}
            redirect_to_gpt_4={false}
            isDisabled={false}
            is_new_course={true}
            setUploadFiles={setUploadFiles}
            courseMetadata={courseMetadata || defaultMetadata}
            auth={auth}
          />
        </div>
      </div>
    </>
  )
}

export default StepUpload
