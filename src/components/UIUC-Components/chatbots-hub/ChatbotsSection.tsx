import { ChatbotHubCard } from './ChatbotHubCard'
import { type ChatbotSectionData } from './chatbots.types'

export function ChatbotsSection({ title, cards }: ChatbotSectionData) {
  return (
    <section className="px-4 py-10 sm:px-8">
      <h2 className="mb-6 text-2xl font-bold text-[--illinois-blue] dark:text-white">
        {title}
      </h2>
      <div className="scrollbar-thin-auto flex gap-5 overflow-x-auto pb-2">
        {cards.map((card) => (
          <ChatbotHubCard key={`${title}-${card.course_name}`} {...card} />
        ))}
      </div>
    </section>
  )
}
