import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { SimpleGrid } from '@mantine/core'
//import { montserrat_heading, montserrat_paragraph } from 'fonts'

import HeaderStepNavigation from './HeaderStepNavigation'

import CanvasIngestForm from '../CanvasIngestForm'
import CourseraIngestForm from '../CourseraIngestForm'
import GitHubIngestForm from '../GitHubIngestForm'
import MITIngestForm from '../MITIngestForm'
import WebsiteIngestForm from '../WebsiteIngestForm'

const StepImport = ({ project_name }: { project_name: string }) => {
  const queryClient = useQueryClient()
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
          title="Import Websites and Connect Platform Data"
          description="Use URLs to connect more data to your bot."
        />

        {/* step content - core step information */}
        <div className="step_content">
          {/* TODO: move this into a separate component so it can be shared in wizard and the project /dashboard/ page */}
          <SimpleGrid
            cols={3}
            spacing="lg"
            breakpoints={[
              { maxWidth: 1192, cols: 2, spacing: 'md' },
              { maxWidth: 768, cols: 1, spacing: 'sm' },
            ]}
            className="mt-4"
          >
            <CanvasIngestForm
              project_name={project_name}
              setUploadFiles={handleSetUploadFiles}
              queryClient={queryClient}
            />

            <WebsiteIngestForm
              project_name={project_name}
              setUploadFiles={handleSetUploadFiles}
              queryClient={queryClient}
            />

            <GitHubIngestForm
              project_name={project_name}
              setUploadFiles={handleSetUploadFiles}
              queryClient={queryClient}
            />

            <MITIngestForm
              project_name={project_name}
              setUploadFiles={handleSetUploadFiles}
              queryClient={queryClient}
            />

            <CourseraIngestForm />
          </SimpleGrid>
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

export default StepImport
