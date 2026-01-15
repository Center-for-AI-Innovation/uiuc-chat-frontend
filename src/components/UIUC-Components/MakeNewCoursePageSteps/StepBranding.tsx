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
import BrandingForm from '../BrandingForm'

const StepBranding = ({
  project_name,
  user_id,
}: {
  project_name: string
  user_id: string
}) => {
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

          <BrandingForm
            project_name={project_name}
            user_id={user_id}
          ></BrandingForm>
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
