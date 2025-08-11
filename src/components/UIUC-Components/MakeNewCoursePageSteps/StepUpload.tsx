import { useEffect, useState } from 'react'
import { useAuth } from 'react-oidc-context'

import {
  Button,
  Card,
  Flex,
  Group,
  Loader,
  Textarea,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core'
//import { montserrat_heading, montserrat_paragraph } from 'fonts'

//import { type CourseMetadata } from '~/types/courseMetadata'
//import UploadCard from '~/components/UIUC-Components/UploadCard'

import HeaderStepNavigation from './HeaderStepNavigation'

import LargeDropzone from '../LargeDropzone'

const StepUpload = ({ project_name }: { project_name: string }) => {
  const auth = useAuth()
  const [uploadFiles, setUploadFiles] = useState<FileUpload[]>([])

  const handleSetUploadFiles = (
    updateFn: React.SetStateAction<FileUpload[]>,
  ) => {
    setUploadFiles(updateFn)
  }

  return (
    <>
      <div className="step">
        <HeaderStepNavigation
          project_name={project_name}
          title="Add Documents"
          description="Choose what your bot knows. And don’t worry, you can always add more data later."
        />

        {/* step content - core step information */}
        <div className="step_content">
          {/* TODO: move this into a separate component so it can be shared in wizard and the project /dashboard/ page */}
          <LargeDropzone
            courseName={project_name}
            current_user_email="chado@illinois.edu"
            redirect_to_gpt_4={false}
            isDisabled={false}
            is_new_course={false}
            setUploadFiles={handleSetUploadFiles}
            auth={auth}
          />
        </div>
      </div>
    </>
  )
}

const componentClasses = {
  input: {
    label: 'font-semibold text-base text-[--foreground]',
    wrapper: '-ml-4',
    input: `
      mt-1

      placeholder:text-[--foreground-faded]
      text-[--foreground] bg-[--background]

      border-[--foreground-faded] focus:border-[--foreground]
      overflow-ellipsis
    `,
    description: 'text-sm text-[--foreground-faded]',
  },
}

export default StepUpload
