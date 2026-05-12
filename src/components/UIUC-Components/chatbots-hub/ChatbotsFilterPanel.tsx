import { Sparkles } from 'lucide-react'
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
  /** When true, the pill is rendered with the "special tag" treatment (Sparkles + prairie accent). */
  special?: boolean
}

function FilterPill({ label, active, onClick, ariaLabel, special }: PillProps) {
  let stateClass: string
  if (active) {
    stateClass = special
      ? 'border-[--illinois-prairie] bg-[--illinois-prairie] text-white hover:bg-[--illinois-prairie] hover:text-white'
      : 'border-[--illinois-blue] bg-[--illinois-blue] text-white hover:bg-[--illinois-blue] hover:text-white dark:border-white dark:bg-white dark:text-[--illinois-blue] dark:hover:bg-white'
  } else if (special) {
    stateClass =
      'border-[--illinois-prairie]/40 bg-[--illinois-prairie]/10 text-[--illinois-prairie] hover:bg-[--illinois-prairie]/15 dark:border-[--illinois-prairie]/60 dark:bg-[--illinois-prairie]/15 dark:text-[--illinois-prairie]'
  } else {
    stateClass =
      'hover:bg-[--illinois-blue]/5 border-[#e5e7eb] bg-white text-[--illinois-blue] dark:border-[#32517a] dark:bg-[#13294b] dark:text-white dark:hover:bg-white/5'
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      aria-pressed={active}
      aria-label={ariaLabel}
      className={`h-9 gap-1.5 rounded-lg px-4 text-sm font-semibold transition-colors ${stateClass}`}
    >
      {special && <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />}
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
          <h3 className="mb-1 text-sm font-bold text-[--illinois-blue] dark:text-white">
            Category
          </h3>
          <p className="mb-3 text-xs text-[--illinois-storm-medium] dark:text-[#94a3b8]">
            Project-type tags from the chatbot editor.
          </p>
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
                special
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
