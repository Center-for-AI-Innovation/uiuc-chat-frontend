import { Group } from '@mantine/core'
import { IconExternalLink } from '@tabler/icons-react'
import { type NextPage } from 'next'
import Link from 'next/link'
import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'
import GlobalFooter from '~/components/UIUC-Components/GlobalFooter'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const DisclaimerPage: NextPage = () => {
  const { t } = useTranslation('common')
  return (
    <MainPageBackground>
      <p style={{ whiteSpace: 'pre-line' }}>{t('disclaimer_full')}</p>
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

// const depricated_disclaimer_string = `Disclaimer: uiuc.chat's Chatbot is Imperfect
// Please read this disclaimer carefully before using this website or Chatbot ("Chatbot") provided by https://uiuc.chat ("we," "us," or "our"). By accessing and using the Chatbot on our website, you acknowledge and agree to the terms of this disclaimer.
// 1.	General Information Purposes Only: The Chatbot is designed to provide general information only with respect to this course's materials. The information provided by the Chatbot should not be considered a replacement for student work or analysis.
// 2.	No Guarantee of Accuracy: While we strive to provide accurate information through the Chatbot, we cannot guarantee the accuracy, completeness, or up-to-date nature of the information provided. The information provided may not reflect the most recent changes.
// 3.	Information Gathering and Potential Inaccuracy: The Chatbot gathers information from the course materials only to provide general guidance on course-related matters. While we make every effort to ensure that the information provided is accurate, we cannot guarantee the accuracy, completeness, or up-to-date nature of the information obtained from these material sources. The Chatbot may, at times, provide information that is inaccurate or outdated due to changes in laws, regulations, or website content. We encourage you to verify any information provided by the Chatbot with a the course material sources before taking any action or making any decisions based on the information received.
// 4.	Reporting Inaccuracies: If you discover any inaccuracies in the information provided by the Chatbot, we kindly ask you to notify us so that we may address the issue.
// By using the Chatbot, you acknowledge and agree to this disclaimer and its terms. If you do not agree with any part of this disclaimer, please refrain from using the Chatbot. We reserve the right to modify or update this disclaimer at any time without prior notice. Your continued use of the Chatbot after any changes signifies your acceptance of the revised disclaimer.
// `

export default DisclaimerPage
