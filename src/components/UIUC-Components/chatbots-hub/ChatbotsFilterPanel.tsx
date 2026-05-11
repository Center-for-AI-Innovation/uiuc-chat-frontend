import { Button } from '~/components/shadcn/ui/button'
import type { ChatbotProjectType, SearchChatbotsParams } from './chatbots.types'

const CATEGORY_OPTIONS: { value: ChatbotProjectType; label: string }[] = [
  { value: 'Course', label: 'Course' },
  { value: 'Department', label: 'Department' },
  { value: 'Student Org.', label: 'Student Org.' },
  { value: 'Entertainment', label: 'Entertainment' },
]

const PRIVACY_OPTIONS: {
  value: 'public' | 'private'
  label: string
}[] = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
]

type ChatbotsFilterPanelProps = {
  params: SearchChatbotsParams
  onParamsChange: (params: SearchChatbotsParams) => void
  open: boolean
}

type PillProps = {
  label: string
  active: boolean
  onClick: () => void
  ariaLabel?: string
}

function FilterPill({ label, active, onClick, ariaLabel }: PillProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      aria-pressed={active}
      aria-label={ariaLabel}
      className={`h-9 rounded-lg px-4 text-sm font-semibold transition-colors ${
        active
          ? 'border-[--illinois-blue] bg-[--illinois-blue] text-white hover:bg-[--illinois-blue] hover:text-white dark:border-white dark:bg-white dark:text-[--illinois-blue] dark:hover:bg-white'
          : 'hover:bg-[--illinois-blue]/5 border-[#e5e7eb] bg-white text-[--illinois-blue] dark:border-[#32517a] dark:bg-[#13294b] dark:text-white dark:hover:bg-white/5'
      }`}
    >
      {label}
    </Button>
  )
}

export function ChatbotsFilterPanel({
  params,
  onParamsChange,
  open,
}: ChatbotsFilterPanelProps) {
  if (!open) return null

  const handleCategoryChange = (value: ChatbotProjectType | undefined) => {
    onParamsChange({ ...params, category: value })
  }

  const handlePrivacyChange = (value: 'public' | 'private' | undefined) => {
    onParamsChange({ ...params, privacy: value })
  }

  const handleMyBotsToggle = () => {
    onParamsChange({ ...params, my_bots: params.my_bots ? undefined : true })
  }

  return (
    <section
      id="chatbot-filters-panel"
      aria-label="Chatbot filters"
      className="rounded-2xl bg-[#f5f7fa] p-6 dark:bg-[#0c1f3f]"
    >
      <div className="space-y-5">
        <div>
          <h3 className="mb-3 text-sm font-bold text-[--illinois-blue] dark:text-white">
            Category
          </h3>
          <div className="flex flex-wrap gap-2">
            <FilterPill
              label="All"
              active={!params.category}
              onClick={() => handleCategoryChange(undefined)}
            />
            {CATEGORY_OPTIONS.map((opt) => (
              <FilterPill
                key={opt.value}
                label={opt.label}
                active={params.category === opt.value}
                onClick={() => handleCategoryChange(opt.value)}
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold text-[--illinois-blue] dark:text-white">
            Privacy
          </h3>
          <div className="flex flex-wrap gap-2">
            <FilterPill
              label="All"
              active={!params.privacy}
              onClick={() => handlePrivacyChange(undefined)}
            />
            {PRIVACY_OPTIONS.map((opt) => (
              <FilterPill
                key={opt.value}
                label={opt.label}
                active={params.privacy === opt.value}
                onClick={() => handlePrivacyChange(opt.value)}
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold text-[--illinois-blue] dark:text-white">
            My Bots
          </h3>
          <FilterPill
            label="Show My Bots"
            active={Boolean(params.my_bots)}
            onClick={handleMyBotsToggle}
          />
        </div>
      </div>
    </section>
  )
}
