import { Group, List, Title, Text, Flex } from '@mantine/core'
import { IconExternalLink } from '@tabler/icons-react'
import { NextPage } from 'next'
import Link from 'next/link'
import { MainPageBackground } from '../components/UIUC-Components/MainPageBackground'
import GlobalFooter from '../components/UIUC-Components/GlobalFooter'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const CropwizardLicenses: NextPage = () => {
  const { t } = useTranslation('common')
  return (
    <MainPageBackground>
      <Title order={2}>{t('cropwizard_licenses_title')}</Title>
      <Flex
        mih={50}
        // bg="rgba(0, 0, 0, .3)"
        gap="md"
        justify="flex-start"
        align="flex-start"
        direction="column"
        wrap="wrap"
      >
        <Text className="max-w-[600px]">
          {t('cropwizard_licenses_body')}
        </Text>
        <List className="pl-10">
          <List.Item>
            <Link
              href="https://creativecommons.org/licenses/by/4.0/"
              className="text-purple-600 hover:text-purple-800 active:text-purple-500"
              style={{ transition: 'color 0.2s' }}
            >
              CC BY
            </Link>
          </List.Item>
          <List.Item>
            <Link
              href="http://creativecommons.org/licenses/by-nc/4.0/"
              className="text-purple-600 hover:text-purple-800 active:text-purple-500"
              style={{ transition: 'color 0.2s' }}
            >
              CC BY-NC
            </Link>
          </List.Item>
          <List.Item>
            <Link
              href="http://creativecommons.org/licenses/by-nc-nd/4.0/"
              className="text-purple-600 hover:text-purple-800 active:text-purple-500"
              style={{ transition: 'color 0.2s' }}
            >
              CC BY-NC-ND
            </Link>
          </List.Item>
          <List.Item>
            <Link
              href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
              className="text-purple-600 hover:text-purple-800 active:text-purple-500"
              style={{ transition: 'color 0.2s' }}
            >
              CC BY-NC-SA
            </Link>
          </List.Item>
          <List.Item>
            <Link
              href="https://creativecommons.org/licenses/by-nd/4.0/"
              className="text-purple-600 hover:text-purple-800 active:text-purple-500"
              style={{ transition: 'color 0.2s' }}
            >
              CC BY-ND
            </Link>
          </List.Item>
          <List.Item>
            <Link
              href="https://creativecommons.org/licenses/by-sa/4.0/"
              className="text-purple-600 hover:text-purple-800 active:text-purple-500"
              style={{ transition: 'color 0.2s' }}
            >
              CC BY-SA
            </Link>
          </List.Item>
          <List.Item>
            <Link
              href="https://creativecommons.org/public-domain/cc0/"
              className="text-purple-600 hover:text-purple-800 active:text-purple-500"
              style={{ transition: 'color 0.2s' }}
            >
              CC0
            </Link>
          </List.Item>
          <List.Item>
            <Link
              href="https://www.springeropen.com/get-published/copyright"
              className="text-purple-600 hover:text-purple-800 active:text-purple-500"
              style={{ transition: 'color 0.2s' }}
            >
              Springer Open Access License
            </Link>
          </List.Item>
        </List>
      </Flex>
      <GlobalFooter />
    </MainPageBackground>
  )
}

export const getStaticProps = async ({ locale }: { locale: string }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
};

export const CropwizardLicenseDisclaimer = () => {
  const { t } = useTranslation('common')
  return (
    <span>
      <p>
        {t('cropwizard_license_disclaimer', {
          licenses: <Link className="text-purple-600 hover:text-purple-800 active:text-purple-500" href="/cropwizard-licenses" target="_blank" rel="noopener noreferrer">{t('licenses')}</Link>,
          terms: <Link className="text-purple-600 hover:text-purple-800 active:text-purple-500" href="https://www.vpaa.uillinois.edu/resources/terms_of_use" target="_blank" rel="noopener noreferrer">{t('terms')}</Link>,
          privacy_policy: <Link className="text-purple-600 hover:text-purple-800 active:text-purple-500" href="https://www.vpaa.uillinois.edu/resources/web_privacy" target="_blank" rel="noopener noreferrer">{t('privacy_policy')}</Link>,
          ai_policy: <Link className="text-purple-600 hover:text-purple-800 active:text-purple-500" href="https://www.vpaa.uillinois.edu/digital_risk_management/generative_ai/" target="_blank" rel="noopener noreferrer">{t('ai_policy')}</Link>,
        })}
      </p>
      <br />
    </span>
  )
}

export default CropwizardLicenses
