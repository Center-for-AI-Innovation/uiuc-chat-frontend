import { Text } from '@mantine/core'
import { useTranslation } from 'react-i18next'

const StuffMessageWithContext = ({ course_name }: { course_name: string }) => {
  const { t } = useTranslation('common')
  return (
    <>
      <Text size="lg" weight={600}>
        {t('hi')}
      </Text>
    </>
  )
}
export default StuffMessageWithContext
