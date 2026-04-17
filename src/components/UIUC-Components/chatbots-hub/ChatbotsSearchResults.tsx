import { SearchX } from 'lucide-react'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import { ChatbotHubCard } from './ChatbotHubCard'
import type { ChatbotCardData } from './chatbots.types'

type ChatbotsSearchResultsProps = {
  results: ChatbotCardData[]
  total: number
  isLoading: boolean
  isError: boolean
}

export function ChatbotsSearchResults({
  results,
  total,
  isLoading,
  isError,
}: ChatbotsSearchResultsProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-red-500 dark:text-red-400">
          Something went wrong while searching. Please try again.
        </p>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <SearchX className="h-10 w-10 text-[--illinois-storm-medium] dark:text-[#94a3b8]" />
        <p className="text-sm text-[--illinois-storm-dark] dark:text-[#c8d2e3]">
          No chatbots found matching your search.
        </p>
        <p className="text-xs text-[--illinois-storm-medium] dark:text-[#94a3b8]">
          Try adjusting your filters or search terms.
        </p>
      </div>
    )
  }

  return (
    <div>
      <p className="mb-4 text-sm text-[--illinois-storm-medium] dark:text-[#94a3b8]">
        {total} {total === 1 ? 'result' : 'results'}
      </p>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {results.map((card) => (
          <ChatbotHubCard key={card.course_name} {...card} />
        ))}
      </div>
    </div>
  )
}
