import { IconMessage, IconSettings } from '@tabler/icons-react'
import router from 'next/router'

import { Button } from '@/components/shadcn/ui/button'

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
                variant="dashboard"
                size="default"
                onClick={() => {
                  router.push(`/${project_name}/chat`)
                }}
              >
                <IconMessage size={18} />
                Start chatting now
              </Button>

              <Button
                variant="outline"
                size="default"
                onClick={() => {
                  router.push(`/${project_name}/dashboard`)
                }}
              >
                <IconSettings size={18} />
                Fine-tune in settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default StepSuccess
