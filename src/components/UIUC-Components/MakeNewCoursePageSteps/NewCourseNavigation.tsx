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
//import { useMediaQuery } from '@mantine/hooks'
//import { montserrat_heading, montserrat_paragraph } from 'fonts'

const NewCourseNavigation = ({
  currentStep,
  allSteps,
  project_name,

  canCreateProject = false,
  onCreateProject,

  onSetCreated,
  onSetStep,
}: {
  currentStep: Number
  allSteps: []
  project_name: string

  canCreateProject: boolean
  onCreateProject: Function

  onSetCreated: Function
  onSetStep: Function
}) => {
  //  const isSmallScreen = useMediaQuery('(max-width: 960px)')

  return (
    <>
      <div
        className={`
        fixed bottom-0 left-0 right-0 z-40
        flex w-full items-center
        justify-center 
        border-t
        border-[--dashboard-border] p-4
        backdrop-blur-md
      `}
      >
        <div
          className={`
          step_navigation
          relative
          flex items-center
        `}
        >
          <div className="left_controls z-4 absolute right-full top-[50%] translate-y-[-50%]">
            {currentStep > 0 && (
              <Button
                size="sm"
                radius="sm"
                classNames={componentClasses.button}
                onClick={(e) => {
                  onSetStep(currentStep - 1)
                }}
              >
                previous
              </Button>
            )}
          </div>

          {/* calculate the width of this section by multiplying the number of items x width + ((items - 1) x gap) to get width */}
          <div className="min-h-8 mx-6 flex items-center justify-center gap-3">
            {allSteps.map((item, index) => (
              <div
                className={`
                h-2 w-2
                rounded-full

                ${currentStep === index ? 'bg-[--dashboard-button]' : 'bg-[--background-faded]'}
              `}
              ></div>
            ))}
          </div>

          <div className="right_controls z-4 absolute left-full top-[50%] translate-y-[-50%]">
            {currentStep == 0 && (
              <Button
                size="sm"
                radius="sm"
                classNames={componentClasses.button}
                disabled={!canCreateProject && true == false}
                onClick={(e) => {
                  onSetStep(currentStep + 1)
                }}
              >
                Create
              </Button>
            )}

            {currentStep > 0 && currentStep < allSteps.length - 1 && (
              <Button
                size="sm"
                radius="sm"
                classNames={componentClasses.button}
                onClick={(e) => {
                  onSetStep(currentStep + 1)
                }}
              >
                Skip
              </Button>
            )}

            {currentStep >= allSteps.length - 1 && (
              <Button
                size="sm"
                radius="sm"
                classNames={componentClasses.buttonPrimary}
                onClick={(e) => {
                  //redirect to /chat/ page for this project
                }}
              >
                Start chatting now
              </Button>
            )}
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

  buttonPrimary: {
    root: `
      !text-[--dashboard-button-foreground]
      bg-[--dashboard-button]
      border-[--dashboard-button]

      hover:!text-[--dashboard-button-foreground]
      hover:bg-[--dashboard-button-hover]
      hover:border-[--dashboard-button-hover]

      disabled:bg-transparent
      disabled:border-[--button-disabled]
      disabled:!text-[--button-disabled-text-color]
    `,
  },
}

export default NewCourseNavigation
