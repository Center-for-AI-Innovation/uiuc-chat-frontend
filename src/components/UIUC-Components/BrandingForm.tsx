import { useEffect, useState } from 'react'

import { FileInput } from '@mantine/core'

import { Button } from '@/components/shadcn/ui/button'
import { IconFileUpload } from '@tabler/icons-react'

import { FormInput } from '@/components/shadcn/ui/form-input'

import SetExampleQuestions from './SetExampleQuestions'

import { useQueryClient } from '@tanstack/react-query'
import {
  type CourseMetadata,
  type CourseMetadataOptionalForUpsert,
} from '~/types/courseMetadata'
import { callSetCourseMetadata, uploadToS3 } from '~/utils/apiUtils'

const BrandingForm = ({
  project_name,
  user_id,
}: {
  project_name: string
  user_id: string
}) => {
  const queryClient = useQueryClient()
  const [introMessage, setIntroMessage] = useState('')
  const [isIntroMessageUpdated, setIsIntroMessageUpdated] = useState(false)
  const [metadata, setMetadata] = useState<CourseMetadata | null>(null)

  // Update local state when query data changes
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      const latestData = queryClient.getQueryData([
        'courseMetadata',
        project_name,
      ]) as CourseMetadata | undefined
      if (latestData) {
        setMetadata(latestData)
        setIntroMessage(latestData.course_intro_message || '')
      }
    })

    return () => {
      unsubscribe()
    }
  }, [project_name, queryClient])

  const onUploadLogo = async (logo: File | null) => {
    /*
      lastModified: 1755022505000
      name: "logo.png"
      size: 9399
      type: "image/png"
      webkitRelativePath: ""
      File Prototype
    */

    // Assuming the file is converted to a URL somewhere else
    if (logo) {
      console.log('Uploading to s3')

      const banner_s3_image = await uploadToS3(
        logo ?? null,
        user_id,
        project_name,
      )

      if (banner_s3_image && metadata) {
        metadata.banner_image_s3 = banner_s3_image
        await callSetCourseMetadata(project_name, metadata)
      }
    }
  }

  return (
    <>
      <div className="branding_form">
        <div className="set_greeting form-control relative">
          <div className="mb-3 font-semibold">Greeting</div>

          <div className="flex flex-col gap-2">
            <FormInput
              as="textarea"
              minRows={2}
              maxRows={5}
              placeholder="Enter a greeting to help users get started with your bot, shown before they start chatting."
              className="w-full"
              value={introMessage}
              onChange={(e) => {
                setIntroMessage(e.target.value)
                setIsIntroMessageUpdated(true)
              }}
            />

            <div>
              <Button
                type="submit"
                variant="dashboard"
                size="sm"
                disabled={!isIntroMessageUpdated}
                onClick={async () => {
                  setIsIntroMessageUpdated(false)

                  if (metadata) {
                    metadata.course_intro_message = introMessage
                    // Update the courseMetadata object

                    const resp = await callSetCourseMetadata(
                      project_name,
                      metadata,
                    )

                    if (!resp) {
                      console.log(
                        'Error upserting course metadata for course: ',
                        project_name,
                      )
                    }
                  }
                }}
              >
                Update
              </Button>
            </div>
          </div>

          {isIntroMessageUpdated && (
            <>
              <Button
                type="submit"
                variant="dashboard"
                className="relative m-1 hidden w-[30%] self-end"
                onClick={async () => {
                  setIsIntroMessageUpdated(false)

                  if (metadata) {
                    metadata.course_intro_message = introMessage
                    // Update the courseMetadata object

                    const resp = await callSetCourseMetadata(
                      project_name,
                      metadata,
                    )

                    if (!resp) {
                      console.log(
                        'Error upserting course metadata for course: ',
                        project_name,
                      )
                    }
                  }
                }}
              >
                Update
              </Button>
            </>
          )}
        </div>

        <div className="set_example_questions">
          <div className="mb-3 mt-6 font-semibold">Example questions</div>

          <div>
            <SetExampleQuestions
              course_name={project_name}
              course_metadata={metadata as CourseMetadataOptionalForUpsert}
            />
          </div>
        </div>

        <div className="upload_logo form-control">
          <div className="mt-6 font-semibold">Add a logo</div>
          <div className="mb-3 text-sm text-[--foreground-faded]">
            This logo will appear in the header of the chat window.
          </div>

          <div>
            {/* TODO: maybe change this to a button to trigger the upload like the other inputs? */}
            {/* TODO: show current logo and ability to remove logo */}
            <FileInput
              fileInputProps={{
                accept: 'image/png,image/jpg,image/gif',
                placeholder: 'Select the logo to upload (.png, .jpg, or .gif)',
              }}
              classNames={{
                input:
                  'text-[--foreground] border-[--dashboard-border] bg-[--background] focus:text-[#f00] hover:border-[--background-darker]',
              }}
              rightSection={
                <IconFileUpload
                  stroke={1}
                  className="text-[--foreground-faded]"
                />
              }
              onChange={onUploadLogo}
            />
          </div>
        </div>
      </div>
    </>
  )
}

export default BrandingForm
