import { Group, List, Title, Text, Flex, Modal, Button } from '@mantine/core'
import { IconExternalLink, IconInfoCircle } from '@tabler/icons-react'
import { NextPage } from 'next'
import Link from 'next/link'
import { useState } from 'react'
import { MainPageBackground } from '../components/UIUC-Components/MainPageBackground'
import GlobalFooter from '../components/UIUC-Components/GlobalFooter'
import { useMediaQuery } from '@mantine/hooks'

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

export const CropwizardLicensePopup = () => {
  const [opened, setOpened] = useState(false)
  const isMobile = useMediaQuery('(max-width: 500px)')

  return (
    <>
      <Button
        variant="subtle"
        compact
        leftIcon={<IconInfoCircle size={16} />}
        onClick={() => setOpened(true)}
        sx={(theme) => ({
          padding: '2px 6px',
          height: 'auto',
          fontSize: isMobile ? '11px' : '14px',
          color: theme.colors.grape[4],
          '&:hover': {
            backgroundColor: 'rgba(142, 36, 170, 0.1)',
          },
        })}
      >
        License Info
      </Button>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="CropWizard License Information"
        size="sm"
        overlayProps={{
          opacity: 0.55,
          blur: 3,
        }}
        centered
      >
        <Text size="sm">
          CropWizard&apos;s document corpus is subject to{' '}
          <Link
            className="text-purple-600 hover:text-purple-800 active:text-purple-500"
            href="/cropwizard-licenses"
            style={{ transition: 'color 0.2s' }}
            target="_blank"
            rel="noopener noreferrer"
          >
            licenses
          </Link>
          . Usage is subject to{' '}
          <Link
            className="text-purple-600 hover:text-purple-800 active:text-purple-500"
            href="https://www.vpaa.uillinois.edu/resources/terms_of_use"
            style={{ transition: 'color 0.2s' }}
            target="_blank"
            rel="noopener noreferrer"
          >
            terms
          </Link>
          , a{' '}
          <Link
            className="text-purple-600 hover:text-purple-800 active:text-purple-500"
            href="https://www.vpaa.uillinois.edu/resources/web_privacy"
            style={{ transition: 'color 0.2s' }}
            target="_blank"
            rel="noopener noreferrer"
          >
            privacy policy
          </Link>
          , and{' '}
          <Link
            className="text-purple-600 hover:text-purple-800 active:text-purple-500"
            href="https://www.vpaa.uillinois.edu/digital_risk_management/generative_ai/"
            style={{ transition: 'color 0.2s' }}
            target="_blank"
            rel="noopener noreferrer"
          >
            generative AI policy
          </Link>
          .
        </Text>
        <Text size="xs" mt={10} italic color="dimmed">
          Sorry, the legal team made us say that.
        </Text>
      </Modal>
    </>
  )
}

export const CropwizardLicenseDisclaimer = () => {
  const isMobile = useMediaQuery('(max-width: 500px)')

  if (isMobile) {
    return <CropwizardLicensePopup />
  }

  return (
    <>
      <span>
        <p>
          CropWizard&apos;s document corpus is subject to{' '}
          <Link
            className="text-purple-600 hover:text-purple-800 active:text-purple-500"
            href="/cropwizard-licenses"
            style={{ transition: 'color 0.2s' }}
            target="_blank"
            rel="noopener noreferrer"
          >
            licenses
          </Link>
          . Usage is subject to{' '}
          <Link
            className="text-purple-600 hover:text-purple-800 active:text-purple-500"
            href="https://www.vpaa.uillinois.edu/resources/terms_of_use"
            style={{ transition: 'color 0.2s' }}
            target="_blank"
            rel="noopener noreferrer"
          >
            terms
          </Link>
          , a{' '}
          <Link
            className="text-purple-600 hover:text-purple-800 active:text-purple-500"
            href="https://www.vpaa.uillinois.edu/resources/web_privacy"
            style={{ transition: 'color 0.2s' }}
            target="_blank"
            rel="noopener noreferrer"
          >
            privacy policy
          </Link>
          , and{' '}
          <Link
            className="text-purple-600 hover:text-purple-800 active:text-purple-500"
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
