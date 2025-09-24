import { Group, List, Title, Text, Flex } from '@mantine/core'
import { IconExternalLink } from '@tabler/icons-react'
import { type NextPage } from 'next'
import Link from 'next/link'
import { MainPageBackground } from '../components/UIUC-Components/MainPageBackground'
import GlobalFooter from '../components/UIUC-Components/GlobalFooter'

const CropwizardLicenses: NextPage = () => {
  return (
    <MainPageBackground>
      <Title order={2}>CropWizard Document Licenses</Title>
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
          The documents in CropWizard are collected from many different sources,
          and each document is subject to its respective license, including the
          following. Any downstream use of CropWizard&apos;s results must
          respect the license of the documents that were used.
        </Text>
        <List className="pl-10">
          <List.Item>
            <Link
              href="https://creativecommons.org/licenses/by/4.0/"
              className="hover:[--dashboard-button-hover] text-[--dashboard-button] active:text-[--dashboard-button]"
              style={{ transition: 'color 0.2s' }}
            >
              CC BY
            </Link>
          </List.Item>
          <List.Item>
            <Link
              href="http://creativecommons.org/licenses/by-nc/4.0/"
              className="hover:[--dashboard-button-hover] text-[--dashboard-button] active:text-[--dashboard-button]"
              style={{ transition: 'color 0.2s' }}
            >
              CC BY-NC
            </Link>
          </List.Item>
          <List.Item>
            <Link
              href="http://creativecommons.org/licenses/by-nc-nd/4.0/"
              className="hover:[--dashboard-button-hover] text-[--dashboard-button] active:text-[--dashboard-button]"
              style={{ transition: 'color 0.2s' }}
            >
              CC BY-NC-ND
            </Link>
          </List.Item>
          <List.Item>
            <Link
              href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
              className="hover:[--dashboard-button-hover] text-[--dashboard-button] active:text-[--dashboard-button]"
              style={{ transition: 'color 0.2s' }}
            >
              CC BY-NC-SA
            </Link>
          </List.Item>
          <List.Item>
            <Link
              href="https://creativecommons.org/licenses/by-nd/4.0/"
              className="hover:[--dashboard-button-hover] text-[--dashboard-button] active:text-[--dashboard-button]"
              style={{ transition: 'color 0.2s' }}
            >
              CC BY-ND
            </Link>
          </List.Item>
          <List.Item>
            <Link
              href="https://creativecommons.org/licenses/by-sa/4.0/"
              className="hover:[--dashboard-button-hover] text-[--dashboard-button] active:text-[--dashboard-button]"
              style={{ transition: 'color 0.2s' }}
            >
              CC BY-SA
            </Link>
          </List.Item>
          <List.Item>
            <Link
              href="https://creativecommons.org/public-domain/cc0/"
              className="hover:[--dashboard-button-hover] text-[--dashboard-button] active:text-[--dashboard-button]"
              style={{ transition: 'color 0.2s' }}
            >
              CC0
            </Link>
          </List.Item>
          <List.Item>
            <Link
              href="https://www.springeropen.com/get-published/copyright"
              className="hover:[--dashboard-button-hover] text-[--dashboard-button] active:text-[--dashboard-button]"
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

export const CropwizardLicenseDisclaimer = () => {
  return (
    <>
      <span>
        <p>
          CropWizard&apos;s document corpus is subject to{' '}
          <Link
            className="hover:[--dashboard-button-hover] text-[--dashboard-button] active:text-[--dashboard-button]"
            href="/cropwizard-licenses"
            style={{ transition: 'color 0.2s' }}
            target="_blank"
            rel="noopener noreferrer"
          >
            licenses
          </Link>
          . Usage is subject to{' '}
          <Link
            className="hover:[--dashboard-button-hover] text-[--dashboard-button] active:text-[--dashboard-button]"
            href="https://www.vpaa.uillinois.edu/resources/terms_of_use"
            style={{ transition: 'color 0.2s' }}
            target="_blank"
            rel="noopener noreferrer"
          >
            terms
          </Link>
          , a{' '}
          <Link
            className="hover:[--dashboard-button-hover] text-[--dashboard-button] active:text-[--dashboard-button]"
            href="https://www.vpaa.uillinois.edu/resources/web_privacy"
            style={{ transition: 'color 0.2s' }}
            target="_blank"
            rel="noopener noreferrer"
          >
            privacy policy
          </Link>
          , and{' '}
          <Link
            className="hover:[--dashboard-button-hover] text-[--dashboard-button] active:text-[--dashboard-button]"
            href="https://www.vpaa.uillinois.edu/digital_risk_management/generative_ai/"
            style={{ transition: 'color 0.2s' }}
            target="_blank"
            rel="noopener noreferrer"
          >
            generative AI policy
          </Link>
          . Sorry, the legal team made us say that.
        </p>
      </span>
      <br></br>
    </>
  )
}

export default CropwizardLicenses
