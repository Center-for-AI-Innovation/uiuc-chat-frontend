import React from 'react'
import { useAuth } from 'react-oidc-context'
import { useQueryClient } from '@tanstack/react-query'
import { SimpleGrid, Text } from '@mantine/core'

import HeaderStepNavigation from './HeaderStepNavigation'

import LargeDropzone from '../LargeDropzone'
import CanvasIngestForm from '../CanvasIngestForm'
import CourseraIngestForm from '../CourseraIngestForm'
import GitHubIngestForm from '../GitHubIngestForm'
import MITIngestForm from '../MITIngestForm'
import WebsiteIngestForm from '../WebsiteIngestForm'
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
  const queryClient = useQueryClient()

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
          title="Add Content"
          description="Choose what your bot knows. You can always add more data later."
        />

        {/* step content - core step information */}
        <div className="step_content">
          {/* Import section */}
          <Text fw={600} size="md" className="mb-2 mt-4 text-[--foreground]">
            Import from URLs & Platforms
          </Text>
          <SimpleGrid
            cols={3}
            spacing="lg"
            breakpoints={[
              { maxWidth: 1192, cols: 2, spacing: 'md' },
              { maxWidth: 768, cols: 1, spacing: 'sm' },
            ]}
          >
            <CanvasIngestForm
              project_name={project_name}
              setUploadFiles={setUploadFiles}
              queryClient={queryClient}
            />

            <WebsiteIngestForm
              project_name={project_name}
              setUploadFiles={setUploadFiles}
              queryClient={queryClient}
            />

            <GitHubIngestForm
              project_name={project_name}
              setUploadFiles={setUploadFiles}
              queryClient={queryClient}
            />

            <MITIngestForm
              project_name={project_name}
              setUploadFiles={setUploadFiles}
              queryClient={queryClient}
            />

            <CourseraIngestForm />
          </SimpleGrid>

          {/* Upload section */}
          <Text fw={600} size="md" className="mb-2 mt-8 text-[--foreground]">
            Upload Files
          </Text>
          <LargeDropzone
            courseName={project_name}
            current_user_email={auth.user?.profile.email || ''}
            redirect_to_gpt_4={false}
            isDisabled={false}
            is_new_course={false}
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
