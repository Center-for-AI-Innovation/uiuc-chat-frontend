import Link from 'next/link'
import Image from 'next/image'
import { ThemeToggle } from './ThemeToggle'
import { useTranslation } from 'next-i18next'

export default function Footer({ isNavbar = false }: { isNavbar?: boolean }) {
  const { t } = useTranslation('common')
  
  return (
    <footer className="footer footer-center rounded p-10 text-base-content">
      {/*       <div className="grid grid-flow-col gap-4"> */}
      <div className="flex flex-col flex-wrap items-center justify-center gap-4 text-[--footer-foreground] sm:flex-row">
        <ThemeToggle />
        <Link
          href="/disclaimer"
          className="link-hover link text-[--footer-link] hover:text-[--footer-link-hover]"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('footer.disclaimer')}
        </Link>
        <Link
          href="https://www.vpaa.uillinois.edu/digital_risk_management/generative_ai/"
          className="link-hover link text-[--footer-link] hover:text-[--footer-link-hover]"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('footer.generative_ai_policy')}
        </Link>
        <Link
          href="https://www.vpaa.uillinois.edu/resources/terms_of_use"
          className="link-hover link text-[--footer-link] hover:text-[--footer-link-hover]"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('footer.terms')}
        </Link>
        <Link
          href="https://www.vpaa.uillinois.edu/resources/web_privacy"
          className="link-hover link text-[--footer-link] hover:text-[--footer-link-hover]"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('footer.privacy')}
        </Link>
        <span>
          {t('footer.mit_licensed')}{' '}
          <Link
            href="https://github.com/Center-for-AI-Innovation/uiuc-chat-frontend"
            className="link-hover link text-[--footer-link] hover:text-[--footer-link-hover]"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('footer.frontend')}
          </Link>{' '}
          {t('footer.and')}{' '}
          <Link
            href="https://github.com/Center-for-AI-Innovation/ai-ta-backendhttps://github.com/UIUC-Chatbot/ai-ta-backend"
            className="link-hover link text-[--footer-link] hover:text-[--footer-link-hover]"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('footer.backend')}
          </Link>{' '}
          {t('footer.code')}
        </span>
        <div>
          <Link
            href="https://status.uiuc.chat"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="https://status.uiuc.chat/api/badge/1/uptime/24?label=Uptime%2024%20hours"
              alt="Service Uptime Badge"
              width={110}
              height={50}
            />
          </Link>
        </div>
      </div>
    </footer>
  )
}
