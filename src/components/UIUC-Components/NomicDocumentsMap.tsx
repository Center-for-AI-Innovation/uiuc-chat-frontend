import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { Title, Text, Flex, Divider, ActionIcon } from '@mantine/core'
import { useTranslation } from 'next-i18next'
import React, { useEffect, useState } from 'react'
import { IconInfoCircle } from '@tabler/icons-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'next-i18next'

function NomicDocumentMap({ course_name }: { course_name: string }) {
  const { t } = useTranslation('common')
  const [accordionOpened, setAccordionOpened] = useState(false)

  const [nomicMapData, setNomicMapData] = useState<NomicMapData | null>(null)
  const [nomicIsLoading, setNomicIsLoading] = useState(true)

  // fetch nomicMapData
  useEffect(() => {
    const fetchNomicMapData = async () => {
      try {
        const response = await fetch(
          `/api/getNomicMapForQueries?course_name=${course_name}&map_type=conversation`,
        )

        const responseText = await response.text()
        const data = JSON.parse(responseText)

        const parsedData: NomicMapData = {
          map_id: data.map_id,
          map_link: data.map_link,
        }
        console.log('Parsed nomic map data:', parsedData)
        setNomicMapData(parsedData)
        setNomicIsLoading(false)
      } catch (error) {
        console.error('NomicDocumentsMap - Error fetching nomic map:', error)
        setNomicIsLoading(false)
      }
    }

    fetchNomicMapData()
  }, [course_name])

  return (
    <>
      {/* NOMIC MAP VISUALIZATION  */}
      <Flex direction="column" align="center" w="100%">
        <div className="pt-5"></div>
        <div
          className="w-[98%] rounded-3xl"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            color: 'var(--foreground)',
            backgroundColor: 'var(--background)',
            paddingTop: '1rem',
          }}
        >
          <div className="w-full px-4 py-3 sm:px-6 sm:py-4 md:px-8">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Title
                  order={3}
                  className={`pl-4 ${montserrat_heading.variable} font-montserratHeading text-lg sm:text-2xl`}
                >
                  {t('analysis.conceptMapOfUserQueries')}
                </Title>

                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={() => setAccordionOpened(!accordionOpened)}
                  className="hover:bg-gray/10"
                  title={t('analysis.moreInfoConceptMap') as unknown as string}
                >
                  <IconInfoCircle className="text-gray/60" />
                </ActionIcon>
              </div>
            </div>
          </div>

          <Divider className="w-full" color="gray.4" size="sm" />

          {/* Accordion info button */}
          <AnimatePresence>
            {accordionOpened && (
              <>
                <div className="pt-4"></div>
                <div className="bg-[--dashboard-background-dark] px-4 py-4 sm:px-6 sm:py-6 md:px-8">
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className=" overflow-hidden"
                  >
                    <div className="flex bg-[--background] backdrop-blur-sm">
                      <div className="w-1 bg-[--illinois-orange]" />
                      <div
                        className={`${montserrat_paragraph.variable}  flex-1 p-4 font-montserratParagraph`}
                      >
                        <Text
                          className={`${montserrat_paragraph.variable} mb-4 font-montserratParagraph text-[--foreground]`}
                        >
                          {t('analysis.conceptMapDescription', 'The Concept Map visualizes all queries made in this project:')}
                        </Text>
                        <ul className="list-inside list-disc space-y-2 text-[--foreground]">
                          <li className="text-sm">
                            <span className="font-bold text-[--accent]">
                              {t('analysis.similarTopics')}
                            </span>{' '}
                            {t('analysis.clusterTogether', 'cluster together')}
                          </li>
                          <li className="text-sm">
                            <span className="font-bold text-[--accent]">
                              {t('analysis.differentTopics')}
                            </span>{' '}
                            {t('analysis.positionedFurtherApart', 'are positioned further apart')}
                          </li>
                          <li className="text-sm">
                            <span className="font-bold text-[--accent]">
                              {t('analysis.commonThemes')}
                            </span>{' '}
                            {t('analysis.knowledgeGapsVisible', 'and knowledge gaps become visible')}
                          </li>
                        </ul>
                        <Text className="mt-3" size="sm">
                          {t('analysis.learnMoreSemantic')}{' '}
                          <a
                            className="text-[--dashboard-button] underline hover:text-[--dashboard-button-hover]"
                            href="https://atlas.nomic.ai/"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t('analysis.semanticSimilarityVisualizations', 'semantic similarity visualizations')}
                          </a>
                        </Text>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </>
            )}
          </AnimatePresence>

          <div className="pt-6"></div>
          {nomicIsLoading ? (
            <>
              <span className="nomic-iframe skeleton-box w-full"></span>
            </>
          ) : nomicMapData && nomicMapData.map_id ? (
            <>
              <iframe
                className="nomic-iframe w-full"
                id={nomicMapData.map_id}
                allow="clipboard-read; clipboard-write"
                src={nomicMapData.map_link}
                style={{ height: '80vh' }}
              />
              <div className="mt-4">
                <Text className="pb-4 text-gray-400" size="sm">
                  {t('analysis.visualizationNote')}{' '}
                  <a
                    href="mailto:rohan13@illinois.edu"
                    className="text-[--dashboard-button] underline hover:text-[--dashboard-button-hover]"
                  >
                    {t('analysis.contactUs')}
                  </a>{' '}
                  {t('analysis.withQuestions')}
                </Text>
              </div>
            </>
          ) : (
            <>
              <div className="w-full px-12 pb-8">
                <Text
                  className={`${montserrat_heading.variable} font-montserratHeading`}
                  size="lg"
                >
                  {t('analysis.notEnoughDataTitle')}
                </Text>
                <Text className="mt-2">
                  {t('analysis.notEnoughDataBody')}
                </Text>
                <Text className="mt-3" size="sm">
                  {t('analysis.learnMoreSemantic')}{' '}
                  <a
                    className="text-[--dashboard-button] underline hover:text-[--dashboard-button-hover]"
                    href="https://atlas.nomic.ai/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('analysis.semanticSimilarityVisualizations')}
                  </a>
                </Text>
              </div>
            </>
          )}
        </div>
      </Flex>
    </>
  )
}

export default NomicDocumentMap
