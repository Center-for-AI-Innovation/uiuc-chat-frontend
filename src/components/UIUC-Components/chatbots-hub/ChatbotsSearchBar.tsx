import { Search, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Input } from '~/components/shadcn/ui/input'
import { Badge } from '~/components/shadcn/ui/badge'
import { Button } from '~/components/shadcn/ui/button'
import type { SearchChatbotsParams } from './chatbots.types'

const DEBOUNCE_MS = 300

type ActiveFilter = {
  key: keyof Omit<SearchChatbotsParams, 'q'>
  label: string
}

function getActiveFilters(params: SearchChatbotsParams): ActiveFilter[] {
  const filters: ActiveFilter[] = []
  if (params.category) {
    filters.push({ key: 'category', label: params.category })
  }
  if (params.privacy) {
    const labels: Record<string, string> = {
      public: 'Public',
      private: 'Private',
      logged_in: 'Logged-in Users',
    }
    filters.push({
      key: 'privacy',
      label: labels[params.privacy] ?? params.privacy,
    })
  }
  if (params.my_bots) {
    filters.push({ key: 'my_bots', label: 'My Bots' })
  }
  return filters
}

type ChatbotsSearchBarProps = {
  params: SearchChatbotsParams
  onParamsChange: (params: SearchChatbotsParams) => void
}

export function ChatbotsSearchBar({
  params,
  onParamsChange,
}: ChatbotsSearchBarProps) {
  const [localQuery, setLocalQuery] = useState(params.q ?? '')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync external params.q changes into local state
  useEffect(() => {
    setLocalQuery(params.q ?? '')
  }, [params.q])

  const emitChange = useCallback(
    (nextQuery: string) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      // Capture the spread now so filter changes during the debounce window aren't lost
      const nextParams = { ...params, q: nextQuery || undefined }
      timerRef.current = setTimeout(() => {
        onParamsChange(nextParams)
      }, DEBOUNCE_MS)
    },
    [params, onParamsChange],
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalQuery(value)
    emitChange(value)
  }

  const handleClear = () => {
    setLocalQuery('')
    onParamsChange({ ...params, q: undefined })
  }

  const handleRemoveFilter = (key: keyof Omit<SearchChatbotsParams, 'q'>) => {
    const next = { ...params }
    if (key === 'my_bots') {
      next.my_bots = undefined
    } else {
      next[key] = undefined
    }
    onParamsChange(next)
  }

  const activeFilters = getActiveFilters(params)

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search
          aria-hidden="true"
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[--illinois-storm-medium] dark:text-[#94a3b8]"
        />
        <Input
          type="search"
          placeholder="Search chatbots..."
          value={localQuery}
          onChange={handleInputChange}
          aria-label="Search chatbots"
          className="h-11 rounded-xl border-[#e5e7eb] bg-white pl-10 pr-10 text-sm text-[--illinois-blue] placeholder:text-[--illinois-storm-medium] focus-visible:ring-[--illinois-blue] dark:border-[#32517a] dark:bg-[#13294b] dark:text-white dark:placeholder:text-[#94a3b8] dark:focus-visible:ring-white/30"
        />
        {localQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <X className="h-4 w-4 text-[--illinois-storm-medium] dark:text-[#94a3b8]" />
          </Button>
        )}
      </div>

      {activeFilters.length > 0 && (
        <div
          className="flex flex-wrap gap-2"
          role="list"
          aria-label="Active filters"
        >
          {activeFilters.map((filter) => (
            <Badge
              key={filter.key}
              variant="secondary"
              className="bg-[--illinois-blue]/10 gap-1 text-[--illinois-blue] dark:bg-white/10 dark:text-white"
            >
              {filter.label}
              <button
                onClick={() => handleRemoveFilter(filter.key)}
                className="hover:bg-[--illinois-blue]/20 ml-0.5 rounded-full p-0.5 dark:hover:bg-white/20"
                aria-label={`Remove ${filter.label} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
