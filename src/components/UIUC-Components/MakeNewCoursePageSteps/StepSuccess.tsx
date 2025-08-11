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

            <div className="mt-4">{project_name}</div>
          </div>
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

export default StepSuccess
