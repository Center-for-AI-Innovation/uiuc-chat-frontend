import { useMemo } from 'react'

import { useTranslation } from 'next-i18next'

import { type ErrorMessage } from '@/types/error'

const useFriendlyErrorMessages = () => {
  const { t } = useTranslation('chat')

  return {
    getModelLoadError: useMemo(
      () => (error: any) => {
        return !error
          ? null
          : ({
              title: t('Error fetching models.'),
              code: error.status || 'unknown',
              messageLines: error.statusText
                ? [error.statusText]
                : [t('Server error. Please try again later.')],
            } as ErrorMessage)
      },
      [t],
    ),
  }
}

export default useFriendlyErrorMessages
