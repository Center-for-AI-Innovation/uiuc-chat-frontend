import React from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { SimpleGrid } from '@mantine/core'

import HeaderStepNavigation from './HeaderStepNavigation'

import CanvasIngestForm from '../CanvasIngestForm'
import CourseraIngestForm from '../CourseraIngestForm'
import GitHubIngestForm from '../GitHubIngestForm'
import MITIngestForm from '../MITIngestForm'
import WebsiteIngestForm from '../WebsiteIngestForm'
import { type FileUpload } from '../UploadNotification'

interface StepImportProps {
  project_name: string
  setUploadFiles: React.Dispatch<React.SetStateAction<FileUpload[]>>
}

const StepImport = ({ project_name, setUploadFiles }: StepImportProps) => {
  const queryClient = useQueryClient()

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
        </div>
      </div>
    </>
  )
}

export default StepImport
