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

import HeaderStepNavigation from './HeaderStepNavigation'

const StepBranding = ({ project_name }: { project_name: string }) => {
  return (
    <>
      <div className="step">
        <HeaderStepNavigation
          project_name={project_name}
          title="Chat Identity and Branding"
          description="Choose how your bot appears to the world."
        />

        {/* step content - core step information */}
        <div className="step_content">
          {/* TODO: move this into a separate component so it can be shared in wizard and the project /dashboard/ page */}

          <div className="flex justify-center p-16">
            [[ chat identity / branding ]]
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

export default StepBranding
