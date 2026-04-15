import { Filter } from 'lucide-react'
import { Button } from '~/components/shadcn/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/shadcn/ui/select'
import type { ChatbotProjectType, SearchChatbotsParams } from './chatbots.types'

const CATEGORY_OPTIONS: { value: ChatbotProjectType; label: string }[] = [
  { value: 'Course', label: 'Course' },
  { value: 'Department', label: 'Department' },
  { value: 'Student Org.', label: 'Student Org.' },
  { value: 'Entertainment', label: 'Entertainment' },
]

const PRIVACY_OPTIONS: {
  value: 'public' | 'private' | 'logged_in'
  label: string
}[] = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
  { value: 'logged_in', label: 'Logged-in Users' },
]

type ChatbotsFilterPanelProps = {
  params: SearchChatbotsParams
  onParamsChange: (params: SearchChatbotsParams) => void
}

export function ChatbotsFilterPanel({
  params,
  onParamsChange,
}: ChatbotsFilterPanelProps) {
  const hasFilters = params.category || params.privacy || params.my_bots

  const handleCategoryChange = (value: string) => {
    onParamsChange({
      ...params,
      category: value === '__all__' ? undefined : (value as ChatbotProjectType),
    })
  }

  const handlePrivacyChange = (value: string) => {
    onParamsChange({
      ...params,
      privacy:
        value === '__all__'
          ? undefined
          : (value as 'public' | 'private' | 'logged_in'),
    })
  }

  const handleMyBotsToggle = () => {
    onParamsChange({
      ...params,
      my_bots: params.my_bots ? undefined : true,
    })
  }

  const handleClearAll = () => {
    onParamsChange({
      ...params,
      category: undefined,
      privacy: undefined,
      my_bots: undefined,
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Filter
        aria-hidden="true"
        className="h-4 w-4 text-[--illinois-storm-medium] dark:text-[#94a3b8]"
      />

      <Select
        value={params.category ?? '__all__'}
        onValueChange={handleCategoryChange}
      >
        <SelectTrigger
          className="h-9 w-[140px] rounded-lg border-[#e5e7eb] bg-white text-xs dark:border-[#32517a] dark:bg-[#13294b] dark:text-white"
          aria-label="Filter by category"
        >
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All Categories</SelectItem>
          {CATEGORY_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={params.privacy ?? '__all__'}
        onValueChange={handlePrivacyChange}
      >
        <SelectTrigger
          className="h-9 w-[150px] rounded-lg border-[#e5e7eb] bg-white text-xs dark:border-[#32517a] dark:bg-[#13294b] dark:text-white"
          aria-label="Filter by privacy"
        >
          <SelectValue placeholder="Privacy" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All Privacy</SelectItem>
          {PRIVACY_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant={params.my_bots ? 'default' : 'outline'}
        size="sm"
        className={`h-9 rounded-lg text-xs ${
          params.my_bots
            ? 'bg-[--illinois-blue] text-white hover:bg-[--foreground-dark] dark:bg-white dark:text-[--illinois-blue] dark:hover:bg-[#e5e7eb]'
            : 'hover:bg-[--illinois-blue]/5 border-[#e5e7eb] text-[--illinois-storm-dark] dark:border-[#32517a] dark:text-[#c8d2e3] dark:hover:bg-white/5'
        }`}
        onClick={handleMyBotsToggle}
        aria-pressed={params.my_bots ?? false}
      >
        My Bots
      </Button>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 text-xs text-[--illinois-storm-medium] hover:text-[--illinois-blue] dark:text-[#94a3b8] dark:hover:text-white"
          onClick={handleClearAll}
        >
          Clear filters
        </Button>
      )}
    </div>
  )
}
