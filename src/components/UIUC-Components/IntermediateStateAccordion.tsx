import React from 'react'
import { Accordion, Badge } from '@mantine/core'
import { montserrat_paragraph } from 'fonts'
import { LoadingSpinner } from './LoadingSpinner'
import { IconChevronDown } from '@tabler/icons-react'

export const IntermediateStateAccordion = ({
  accordionKey,
  title,
  chevron,
  isLoading,
  error,
  content,
  disableChevronRotation,
  defaultValue,
}: {
  accordionKey: string
  title: React.ReactNode
  chevron?: React.ReactNode
  isLoading: boolean
  error: boolean
  content: React.ReactNode
  disableChevronRotation?: boolean
  defaultValue?: string
}) => {
  // console.log('IntermediateStateAccordion, key:', accordionKey, 'isLoading:', isLoading, 'error:', error, 'default value:', defaultValue)
  return (
    <div className="xl:w-8/10 mx-auto w-full lg:mx-0 lg:w-3/4">
      <Accordion
        variant="separated"
        radius={'lg'}
        order={2}
        w={'100%'}
        m={'auto'}
        chevron={
          chevron ? (
            chevron
          ) : isLoading ? (
            <LoadingSpinner size="xs" />
          ) : (
            <IconChevronDown />
          )
        }
        disableChevronRotation={disableChevronRotation}
        value={defaultValue !== undefined ? defaultValue : undefined}
      >
        <Accordion.Item
          key={accordionKey}
          value={accordionKey}
          // value={title}
          style={{
            border: 0,
            backgroundColor: '#101122',
            borderRadius: '0.5rem',
          }}
        >
          <Accordion.Control
            className={`rounded-lg hover:bg-transparent ${montserrat_paragraph.variable} font-montserratParagraph text-sm font-bold`}
            style={{
              // marginRight: '10px',
              textShadow: '0 0 10px',
              color: '#9d4edd',
              display: 'flex',
              alignItems: 'left',
            }}
            disabled={isLoading}
          >
            {title}
          </Accordion.Control>
          <Accordion.Panel
            className={`${montserrat_paragraph.variable} rounded-lg bg-[#101122] pt-2 font-montserratParagraph text-sm text-white ${error ? 'border-2 border-red-500' : ''}`}
          >
            <div style={{ position: 'relative' }}>
              <pre
                className="rounded-lg p-2 pr-4"
                style={{
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  maxHeight: '20em',
                  maxWidth: '100%',
                  overflowY: 'auto',
                  backgroundColor: '#1d1f32',
                }}
              >
                {content}
              </pre>
            </div>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </div>
  )
}
