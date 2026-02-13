import { Button } from '@mantine/core'
import { IconMessage, IconSettings } from '@tabler/icons-react'
import router from 'next/router'

const StepSuccess = ({ project_name }: { project_name: string }) => {
  return (
    <>
      <div className="step">
        {/* step content - core step information */}
        <div className="step_content">
          <div className="flex flex-col items-center justify-center p-16">
            <h2 className="text-2xl font-bold text-[--foreground]">
              Success! Your chatbot is live!
            </h2>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button
                size="md"
                radius="sm"
                classNames={componentClasses.buttonPrimary}
                leftIcon={<IconMessage size={18} />}
                onClick={() => {
                  router.push(`/${project_name}/chat`)
                }}
              >
                Start chatting now
              </Button>

              <Button
                size="md"
                radius="sm"
                classNames={componentClasses.button}
                leftIcon={<IconSettings size={18} />}
                onClick={() => {
                  router.push(`/${project_name}/dashboard`)
                }}
              >
                Fine-tune in settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const componentClasses = {
  button: {
    root: `
      !text-[--foreground]
      bg-transparent
      border-[--foreground-faded]

      hover:!text-[#13294B]
      hover:bg-transparent
      hover:border-[#13294B]

      disabled:bg-transparent
      disabled:border-[--button-disabled]
      disabled:!text-[--button-disabled-text-color]
    `,
  },
  buttonPrimary: {
    root: `
      !text-white
      bg-[#13294B]

      hover:!text-white
      hover:bg-[#13294B]/90

      disabled:bg-[#13294B]/50
      disabled:!text-white/50
    `,
  },
}

export default StepSuccess
