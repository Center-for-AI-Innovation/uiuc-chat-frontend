import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/shadcn/ui/button'
import { Spinner } from '@/components/shadcn/ui/spinner'
import { Check, AlertCircle } from 'lucide-react'
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

  // Read initial cached data synchronously so child components mount with it
  const cachedMetadata = queryClient.getQueryData([
    'courseMetadata',
    project_name,
  ]) as CourseMetadata | undefined

  const [introMessage, setIntroMessage] = useState(
    cachedMetadata?.course_intro_message || '',
  )
  const [isIntroMessageUpdated, setIsIntroMessageUpdated] = useState(false)
  const [greetingSaved, setGreetingSaved] = useState(
    !!cachedMetadata?.course_intro_message,
  )
  const [metadata, setMetadata] = useState<CourseMetadata | null>(
    cachedMetadata ?? null,
  )
  const [logoFileName, setLogoFileName] = useState<string | null>(
    cachedMetadata?.banner_image_s3 ? 'Logo uploaded' : null,
  )
  const [logoStatus, setLogoStatus] = useState<
    'idle' | 'uploading' | 'success' | 'error'
  >(cachedMetadata?.banner_image_s3 ? 'success' : 'idle')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Subscribe to future query cache changes
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
    if (!logo) return

    setLogoFileName(logo.name)
    setLogoStatus('uploading')

    const banner_s3_image = await uploadToS3(logo, user_id, project_name)

    if (banner_s3_image && metadata) {
      const updatedMetadata = {
        ...metadata,
        banner_image_s3: banner_s3_image,
      }
      // Only update local state and cache — the S3 key will be
      // persisted to the server on the next metadata save
      // (greeting update, question save, etc.)
      setMetadata(updatedMetadata)
      queryClient.setQueryData(
        ['courseMetadata', project_name],
        updatedMetadata,
      )
      setLogoStatus('success')
    } else {
      setLogoStatus('error')
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
              rightSlot={
                greetingSaved && !isIntroMessageUpdated ? (
                  <Check className="size-4 text-[--illinois-prairie]" />
                ) : null
              }
              onChange={(e) => {
                setIntroMessage(e.target.value)
                setIsIntroMessageUpdated(true)
                setGreetingSaved(false)
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
                    const updatedMetadata = {
                      ...metadata,
                      course_intro_message: introMessage,
                    }

                    const resp = await callSetCourseMetadata(
                      project_name,
                      updatedMetadata,
                    )

                    if (resp) {
                      setMetadata(updatedMetadata)
                      queryClient.setQueryData(
                        ['courseMetadata', project_name],
                        updatedMetadata,
                      )
                      setGreetingSaved(true)
                    } else {
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
        </div>

        <div className="set_example_questions">
          <div className="mb-3 mt-6 font-semibold">Example questions</div>

          <div>
            {metadata && (
              <SetExampleQuestions
                course_name={project_name}
                course_metadata={metadata as CourseMetadataOptionalForUpsert}
              />
            )}
          </div>
        </div>

        <div className="upload_logo form-control">
          <div className="mt-6 font-semibold">Add a logo</div>
          <div className="mb-3 text-sm text-[--foreground-faded]">
            This logo will appear in the header of the chat window.
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpg,image/gif"
              className="hidden"
              aria-label="Upload logo"
              onChange={(e) => {
                onUploadLogo(e.target.files?.[0] ?? null)
                e.target.value = ''
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={logoStatus === 'uploading'}
              className={`flex w-full items-center rounded-md border bg-[--background] px-3 py-2 text-sm transition-colors disabled:pointer-events-none disabled:opacity-50 ${
                logoStatus === 'error'
                  ? 'border-[--error]'
                  : 'border-[--dashboard-border] hover:border-[--foreground-faded]'
              }`}
            >
              <span
                className={
                  logoStatus === 'error'
                    ? 'text-[--error]'
                    : logoFileName
                      ? logoStatus === 'success'
                        ? 'text-[--illinois-prairie]'
                        : 'text-[--foreground]'
                      : 'text-[--foreground-faded]'
                }
              >
                {logoStatus === 'error'
                  ? 'Upload failed — click to retry'
                  : logoFileName ||
                    'Select the logo to upload (.png, .jpg, or .gif)'}
              </span>
              <div className="ml-auto flex shrink-0 items-center pl-3">
                {logoStatus === 'uploading' ? (
                  <Spinner className="size-4 text-[--foreground-faded]" />
                ) : logoStatus === 'success' ? (
                  <Check className="size-4 text-[--illinois-prairie]" />
                ) : logoStatus === 'error' ? (
                  <AlertCircle className="size-4 text-[--error]" />
                ) : (
                  <IconFileUpload
                    size={20}
                    stroke={1}
                    className="text-[--foreground-faded]"
                  />
                )}
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default BrandingForm
