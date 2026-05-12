import { cn } from '~/components/shadcn/lib/utils'
import { Badge } from '~/components/shadcn/ui/badge'

type ChatbotOrganizationBadgeProps = {
  label: string
  className?: string
}

export function ChatbotOrganizationBadge({
  label,
  className,
}: ChatbotOrganizationBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'rounded-[8px] border-[#d4d4d8] bg-white font-medium text-[--illinois-blue] dark:border-[#32517a] dark:bg-[#13294b] dark:text-[#e2e8f0]',
        className,
      )}
    >
      {label}
    </Badge>
  )
}
