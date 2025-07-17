import { useMemo } from 'react'

import { useTranslation } from 'next-i18next'

import { type ErrorMessage } from '@/types/error'

const useErrorService = () => {
  const { t } = useTranslation('chat')

  return {
    getModelsError: useMemo(
      () => (error: any) => {
        return !error
          ? null
          : ({
              title: t('error_fetching_models'),
              code: error.status || 'unknown',
              messageLines: error.statusText
                ? [error.statusText]
                : [
                    t(
                      'Please set your OpenAI API key in the bottom left of the sidebar.',
                    ),
                    t(
                      'If you completed this step, OpenAI may be experiencing issues.',
                    ),
                  ],
            } as ErrorMessage)
      },
      [t],
    ),
  }
}

export default useErrorService
