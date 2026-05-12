import { cva, type VariantProps } from 'class-variance-authority'
import { Sparkles } from 'lucide-react'
import { cn } from '~/components/shadcn/lib/utils'
import { Badge } from '~/components/shadcn/ui/badge'
import type { ChatbotTagCategory } from '~/types/chatbotTags'

const chatbotTagBadgeVariants = cva('gap-1 rounded-[8px] font-medium', {
  variants: {
    category: {
      organization:
        'border border-[#d4d4d8] bg-white text-[--illinois-blue] dark:border-[#32517a] dark:bg-[#13294b] dark:text-[#e2e8f0]',
      projectType:
        'border border-[--illinois-prairie]/40 bg-[--illinois-prairie]/10 text-[--illinois-prairie] dark:border-[--illinois-prairie]/60 dark:bg-[--illinois-prairie]/15 dark:text-[--illinois-prairie]',
    },
  },
  defaultVariants: { category: 'organization' },
})

type ChatbotOrganizationBadgeProps = VariantProps<
  typeof chatbotTagBadgeVariants
> & {
  label: string
  className?: string
  category?: ChatbotTagCategory
}

export function ChatbotOrganizationBadge({
  label,
  className,
  category = 'organization',
}: ChatbotOrganizationBadgeProps) {
  const isSpecial = category === 'projectType'
  return (
    <Badge
      variant="outline"
      className={cn(chatbotTagBadgeVariants({ category }), className)}
    >
      {isSpecial && <Sparkles className="h-3 w-3" aria-hidden="true" />}
      {label}
    </Badge>
  )
}
