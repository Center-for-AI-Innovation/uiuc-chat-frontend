import { useEffect, useState } from 'react'

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

import router from 'next/router'

//import { montserrat_heading, montserrat_paragraph } from 'fonts'

//import HeaderStepNavigation from './HeaderStepNavigation'

const StepSuccess = ({ project_name }: { project_name: string }) => {
  return (
    <>
      <div className="step">
        {/* step content - core step information */}
        <div className="step_content">
          <div className="flex flex-col items-center justify-center p-16">
            <h2 className="text-xl font-bold">
              Success! Your chatbot is live!
            </h2>

            <Button
              size="sm"
              radius="sm"
              classNames={componentClasses.button}
              className="mt-4"
              onClick={(e) => {
                router.push(`/${project_name}/dashboard`)
              }}
            >
              Fine tune your settings
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

const componentClasses = {
  button: {
    root: `
      !text-[--foreground-faded]
      bg-transparent
      border-[--background-faded]

      hover:!text-[--dashboard-button]
      hover:hover:bg-transparent
      hover:hover:border-[--dashboard-button]

      disabled:bg-transparent
      disabled:border-[--button-disabled]
      disabled:!text-[--button-disabled-text-color]
    `,
  },
}

export default StepSuccess
