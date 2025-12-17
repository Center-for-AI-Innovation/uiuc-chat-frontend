import { type NextPage } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

const PrivacyStatement: NextPage = (props) => {
  const { t } = useTranslation('common')
  return (
    <div>
      <h1>{t('privacy_statement')}</h1>
      <p>{t('this_is_privacy_statement')}</p>
    </div>
  )
}

export const getStaticProps = async ({ locale }: { locale: string }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
};

export default PrivacyStatement
