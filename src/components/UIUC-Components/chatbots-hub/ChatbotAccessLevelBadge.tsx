import { cva } from 'class-variance-authority'
import { EyeOff, Globe, LockKeyhole } from 'lucide-react'
import { cn } from '~/components/shadcn/lib/utils'
import { Badge } from '~/components/shadcn/ui/badge'
import { type ChatbotAccessLevel } from './chatbots.types'

type ChatbotAccessLevelBadgeProps = {
  level: ChatbotAccessLevel
  className?: string
}

const accessLevelBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-[8px]',
  {
    variants: {
      level: {
        private:
          'border-transparent bg-[#f9ecec] text-[#b3261e] hover:bg-[#f9ecec] dark:bg-[#3b1f2b] dark:text-[#fda4af] dark:hover:bg-[#3b1f2b]',
        unlisted:
          'border-transparent bg-[#f2efde] text-[#a16207] hover:bg-[#f2efde] dark:bg-[#3a2f1f] dark:text-[#facc15] dark:hover:bg-[#3a2f1f]',
        public:
          'border-transparent bg-[#ddece3] text-[#15803d] hover:bg-[#ddece3] dark:bg-[#1f3a2e] dark:text-[#86efac] dark:hover:bg-[#1f3a2e]',
      },
    },
  },
)

const accessLevelLabels: Record<ChatbotAccessLevel, string> = {
  private: 'Private',
  unlisted: 'Unlisted',
  public: 'Public',
}

export function ChatbotAccessLevelBadge({
  level,
  className,
}: ChatbotAccessLevelBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(accessLevelBadgeVariants({ level }), className)}
    >
      {level === 'private' && <LockKeyhole className="h-4 w-4" />}
      {level === 'unlisted' && <EyeOff className="h-4 w-4" />}
      {level === 'public' && <Globe className="h-4 w-4" />}
      {accessLevelLabels[level]}
    </Badge>
  )
}
