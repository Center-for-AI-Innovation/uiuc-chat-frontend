import { Loader2Icon } from 'lucide-react'

import { cn } from '@/components/shadcn/lib/utils'
import { useTranslation } from 'react-i18next'

function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
  const { t } = useTranslation('common')
  return (
    <Loader2Icon
      role="status"
      aria-label={t('settings.sections.model.model_item.loading') ?? 'Loading'}
      className={cn('size-4 animate-spin', className)}
      {...props}
    />
  )
}

export { Spinner }
