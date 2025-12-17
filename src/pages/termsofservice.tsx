import { type NextPage } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

const TermsOfService: NextPage = (props) => {
  const { t } = useTranslation('common')
  return (
    <div>
      <h1>{t('terms_of_service')}</h1>
      <p>{t('these_are_terms_of_service')}</p>
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

export default TermsOfService
