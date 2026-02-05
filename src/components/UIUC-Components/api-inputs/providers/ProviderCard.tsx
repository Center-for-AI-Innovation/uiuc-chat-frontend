import React, { type ReactNode } from 'react'
import { Alert, AlertDescription } from '@/components/shadcn/ui/alert'
import { Skeleton } from '@/components/shadcn/ui/skeleton'
import { Switch } from '@/components/shadcn/ui/switch'
import { IconExternalLink } from '@tabler/icons-react'
import {
  type LLMProvider,
  type ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import { motion, AnimatePresence } from 'framer-motion'

interface ProviderCardProps {
  providerName: string
  providerKey: ProviderNames
  provider: LLMProvider
  form: any
  isLoading: boolean
  externalUrl?: string
  description?: ReactNode
  children: ReactNode
}

export default function ProviderCard({
  providerName,
  providerKey,
  provider,
  form,
  isLoading,
  externalUrl,
  description,
  children,
}: ProviderCardProps) {
  const bgClass =
    'w-full min-w-[min(330px,100%)] flex-[1_1_calc(50%_-_0.5rem)] rounded-md border-0 bg-[--dashboard-background-faded] p-5 text-[--dashboard-foreground] shadow-none'

  if (isLoading || !provider) {
    return <Skeleton className={`${bgClass} min-h-[200px]`} />
  }

  return (
    <div className={bgClass}>
      <div className="mb-3 flex items-center justify-between">
        <ProviderTitle name={providerName} externalUrl={externalUrl} />
        <form.Field className="mb-1" name={`providers.${providerKey}.enabled`}>
          {(field: any) => (
            <ProviderSwitch
              checked={field.state.value}
              onCheckedChange={(checked: boolean) => {
                field.handleChange(checked)
                form.handleSubmit()
              }}
              providerName={providerName}
            />
          )}
        </form.Field>
      </div>

      {description && (
        <p className="mb-2 text-sm text-[--dashboard-foreground-faded]">
          {description}
        </p>
      )}

      <ProviderError
        error={provider?.error}
        enabled={
          form.state.values?.providers?.[providerKey]?.enabled ||
          provider.enabled
        }
      />

      <form.Field name={`providers.${providerKey}.enabled`}>
        {(field: any) => (
          <AnimatePresence>
            {field.state.value && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </form.Field>
    </div>
  )
}

function ProviderTitle({
  name,
  externalUrl,
}: {
  name: string
  externalUrl?: string
}) {
  if (externalUrl) {
    return (
      <a href={externalUrl} target="_blank" rel="noopener noreferrer">
        <div className="flex items-center">
          <span className="pr-2 text-lg font-medium">{name}</span>
          <IconExternalLink size={16} />
        </div>
      </a>
    )
  }

  return <span className="mb-1 pr-2 text-lg font-medium">{name}</span>
}

function ProviderSwitch({
  checked,
  onCheckedChange,
  providerName,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  providerName: string
}) {
  return (
    <Switch
      variant="labeled"
      showLabels
      showThumbIcon
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label={`Enable ${providerName} provider`}
    />
  )
}

function ProviderError({
  error,
  enabled,
}: {
  error?: string
  enabled?: boolean
}) {
  if (!error || !enabled) return null

  return (
    <Alert
      variant="destructive"
      className="mb-3 border-red-500/20 bg-red-500/10"
    >
      <AlertDescription className="text-sm text-red-500">
        {error}
      </AlertDescription>
    </Alert>
  )
}
