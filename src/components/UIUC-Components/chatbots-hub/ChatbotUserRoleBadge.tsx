import { cva } from 'class-variance-authority'
import { cn } from '~/components/shadcn/lib/utils'
import { Badge } from '~/components/shadcn/ui/badge'
import { type ChatbotUserRole } from './chatbots.types'

type ChatbotUserRoleBadgeProps = {
  role: ChatbotUserRole
  className?: string
}

const userRoleBadgeVariants = cva('rounded-[8px]', {
  variants: {
    role: {
      owner:
        'border-[#ff5f05] bg-white text-[#c2410c] hover:bg-white dark:border-[#32517a] dark:bg-[#081735] dark:text-white dark:hover:bg-[#081735]',
      member:
        'border-[#d4d4d8] bg-white text-[--illinois-blue] hover:bg-white dark:border-[#32517a] dark:bg-[#081735] dark:text-[#e2e8f0] dark:hover:bg-[#081735]',
    },
  },
})

const userRoleLabel: Record<ChatbotUserRole, string> = {
  owner: 'Owner',
  member: 'Member',
}

export function ChatbotUserRoleBadge({
  role,
  className,
}: ChatbotUserRoleBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(userRoleBadgeVariants({ role }), className)}
    >
      {userRoleLabel[role]}
    </Badge>
  )
}
