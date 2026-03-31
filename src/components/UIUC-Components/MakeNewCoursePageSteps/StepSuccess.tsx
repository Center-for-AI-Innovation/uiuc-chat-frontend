import {
  MessageSquare,
  Settings,
  FileSpreadsheet,
  Settings2,
  TextSelect,
  PaintbrushVertical,
  ArrowRight,
} from 'lucide-react'
import Image from 'next/image'
import router from 'next/router'

import { Button } from '@/components/shadcn/ui/button'

const StepSuccess = ({
  project_name,
  onContinueDesigning,
}: {
  project_name: string
  onContinueDesigning: () => void
}) => {
  const safeName = encodeURIComponent(project_name)

  return (
    <div className="step">
      <div className="step_content">
        <div className="flex flex-col items-center px-4 pb-4 pt-2">
          <h2 className="text-center text-2xl font-semibold text-[--foreground]">
            Success! Your chatbot is live!
          </h2>

          <div className="mt-6 flex w-full items-stretch justify-center gap-4">
            {/* Left Card - Dive Right In */}
            <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-[--dashboard-border] bg-[--background]">
              <div className="flex flex-1 flex-col">
                <div className="flex items-center gap-3 px-5 pb-3 pt-4">
                  <MessageSquare
                    size={24}
                    className="shrink-0 text-[--foreground]"
                  />
                  <span className="text-lg font-semibold text-[--foreground]">
                    Dive Right In!
                  </span>
                </div>

                <div className="px-5 pb-3">
                  <p className="text-sm leading-relaxed text-[--foreground-faded]">
                    Start a conversation with the bot you just created! You can
                    always add more data later.
                  </p>
                </div>

                <div className="px-5 pb-4">
                  <div className="flex items-center justify-center rounded-md bg-[--background-faded] py-4">
                    <Image
                      src="/media/robot_hatching.svg"
                      alt="Robot hatching from an egg"
                      width={80}
                      height={100}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-[--dashboard-border]" />

              <Button
                variant="dashboard"
                size="lg"
                className="w-full rounded-none"
                onClick={() => router.push(`/${safeName}/chat`)}
              >
                Start Chatting Now!
                <ArrowRight size={18} />
              </Button>
            </div>

            {/* "or" badge */}
            <div className="flex items-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-[--background-faded]">
                <span className="text-sm font-medium text-[--foreground-faded]">
                  or
                </span>
              </div>
            </div>

            {/* Right Card - Fine Tune */}
            <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-[--dashboard-border] bg-[--background]">
              <div className="flex items-center gap-3 px-5 pb-3 pt-4">
                <Settings size={24} className="shrink-0 text-[--foreground]" />
                <span className="text-lg font-semibold text-[--foreground]">
                  Fine Tune
                </span>
              </div>

              <div className="px-5 pb-3">
                <p className="text-sm leading-relaxed text-[--foreground-faded]">
                  Make it your own! Illinois Chat makes it easy to create highly
                  customized chatbots that suit your needs.
                </p>
              </div>

              <div className="flex flex-col gap-2 px-5 py-2">
                <FeatureItem
                  icon={<FileSpreadsheet size={18} />}
                  label="Bring your own data!"
                />
                <FeatureItem
                  icon={<Settings2 size={18} />}
                  label="Configure AI Models"
                />
                <FeatureItem
                  icon={<TextSelect size={18} />}
                  label="Custom Prompting"
                />
                <FeatureItem
                  icon={<PaintbrushVertical size={18} />}
                  label="Chat Identity and Branding"
                />
              </div>

              <div className="mt-auto border-t border-[--dashboard-border]" />

              <Button
                variant="outline"
                size="lg"
                className="hover:bg-[--background-faded]/80 w-full rounded-none border-0 bg-[--background-faded]"
                onClick={onContinueDesigning}
              >
                Continue Designing
                <ArrowRight size={18} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const FeatureItem = ({
  icon,
  label,
}: {
  icon: React.ReactNode
  label: string
}) => (
  <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5">
    <span className="shrink-0 text-[--foreground]">{icon}</span>
    <span className="text-sm font-medium text-[--foreground]">{label}</span>
  </div>
)

export default StepSuccess
