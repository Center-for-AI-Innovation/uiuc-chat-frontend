import { IconCheck, IconClipboard, IconDownload } from '@tabler/icons-react'
import { type FC, memo, useEffect, useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { oneLight as oneLightBase } from 'react-syntax-highlighter/dist/cjs/styles/prism'

// WCAG AA contrast-enhanced overrides for oneLight theme (4.5:1 min against #fff)
const contrastOverrides: Record<string, React.CSSProperties> = {
  comment: { color: '#696c77' }, // gray ~5.1:1
  prolog: { color: '#696c77' },
  cdata: { color: '#696c77' },
  string: { color: '#2a7b2f' }, // green ~5.2:1
  'attr-value': { color: '#2a7b2f' },
  char: { color: '#2a7b2f' },
  inserted: { color: '#2a7b2f' },
  keyword: { color: '#7b1fa2' }, // purple ~6.5:1
  selector: { color: '#7b1fa2' },
  function: { color: '#2a5db0' }, // blue ~5.5:1
  'function-variable': { color: '#2a5db0' },
  builtin: { color: '#7a5700' }, // gold ~4.9:1
  number: { color: '#7a5700' },
  constant: { color: '#7a5700' },
  'class-name': { color: '#7a5700' },
  operator: { color: '#383a42' }, // dark ~9.4:1
  entity: { color: '#383a42' },
  punctuation: { color: '#383a42' },
}

const oneLight = Object.fromEntries(
  Object.entries(oneLightBase).map(([key, value]) => [
    key,
    key in contrastOverrides
      ? { ...(value as React.CSSProperties), ...contrastOverrides[key] }
      : value,
  ]),
)

import { useTranslation } from 'next-i18next'

import { programmingLanguages } from '@/utils/app/codeblock'
import { generateSecureRandomString } from '@/utils/cryptoRandom'

interface Props {
  language: string
  value: string
}

export const CodeBlock: FC<Props> = memo(({ language, value }) => {
  const { t } = useTranslation('markdown')
  const [isCopied, setIsCopied] = useState<boolean>(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const check = () =>
      setIsDark(document.documentElement.classList.contains('dark'))
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => observer.disconnect()
  }, [])

  const copyToClipboard = () => {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      return
    }

    navigator.clipboard.writeText(value).then(() => {
      setIsCopied(true)

      setTimeout(() => {
        setIsCopied(false)
      }, 2000)
    })
  }
  const downloadAsFile = () => {
    const fileExtension = programmingLanguages[language] || '.file'
    const suggestedFileName = `file-${generateSecureRandomString(
      3,
      undefined,
      true,
    )}${fileExtension}`
    const fileName = window.prompt(
      t('Enter file name') || '',
      suggestedFileName,
    )

    if (!fileName) {
      // user pressed cancel on prompt
      return
    }

    const blob = new Blob([value], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = fileName
    link.href = url
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
  return (
    // <div className="codeblock relative font-sans text-[16px]">

    // TODO: Fix this codeblock so that it doesn't overflow. Add horizontal scroll bar.
    <div
      className="codeblock relative font-sans text-[16px]"
      style={{
        maxWidth: '100%',
        overflowX: 'auto',
        backgroundColor: isDark ? '#282c34' : '#ffffff',
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-1.5"
        style={{ backgroundColor: isDark ? '#21252b' : '#f0f1f3' }}
      >
        <span
          className="text-xs lowercase"
          style={{ color: isDark ? '#fff' : '#24292e' }}
        >
          {language}
        </span>

        <div className="flex items-center">
          <button
            className="codeblock-button flex items-center gap-1.5 rounded bg-none p-1 text-xs"
            style={{ color: isDark ? '#fff' : '#24292e' }}
            onClick={copyToClipboard}
          >
            {isCopied ? (
              <IconCheck size={18} aria-hidden="true" />
            ) : (
              <IconClipboard size={18} aria-hidden="true" />
            )}
            {isCopied ? t('Copied!') : t('Copy code')}
          </button>
          <button
            className="codeblock-button flex items-center rounded bg-none p-1 text-xs"
            style={{ color: isDark ? '#fff' : '#24292e' }}
            onClick={downloadAsFile}
            aria-label="Download code"
          >
            <IconDownload size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      <SyntaxHighlighter
        language={language}
        style={(() => {
          const theme = isDark ? oneDark : oneLight
          return {
            ...theme,
            'pre[class*="language-"]': {
              ...theme['pre[class*="language-"]'],
              background: 'transparent',
            },
            'code[class*="language-"]': {
              ...theme['code[class*="language-"]'],
              background: 'transparent',
            },
          }
        })()}
        customStyle={{
          margin: 0,
          whiteSpace: 'pre-wrap',
          overflowWrap: 'break-word',
          background: 'transparent',
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  )
})
CodeBlock.displayName = 'CodeBlock'
