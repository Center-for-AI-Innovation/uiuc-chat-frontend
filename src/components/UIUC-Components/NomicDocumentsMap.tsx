import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { Title, Text, Flex, Divider, ActionIcon } from '@mantine/core'
import React, { useEffect, useState } from 'react'
import { IconInfoCircle } from '@tabler/icons-react'
import { AnimatePresence, motion } from 'framer-motion'

function NomicDocumentMap({ course_name }: { course_name: string }) {
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
                  Concept Map of User Queries
                </Title>

                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={() => setAccordionOpened(!accordionOpened)}
                  className="hover:bg-gray/10"
                  title="More info on nomic map"
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
                          The Concept Map visualizes all queries made in this
                          project:
                        </Text>
                        <ul className="list-inside list-disc space-y-2 text-[--foreground]">
                          <li className="text-sm">
                            <span className="font-bold text-[--accent]">
                              Similar topics
                            </span>{' '}
                            cluster together
                          </li>
                          <li className="text-sm">
                            <span className="font-bold text-[--accent]">
                              Different topics
                            </span>{' '}
                            are positioned further apart
                          </li>
                          <li className="text-sm">
                            <span className="font-bold text-[--accent]">
                              Common themes
                            </span>{' '}
                            and knowledge gaps become visible
                          </li>
                        </ul>
                        <Text className="mt-3" size="sm">
                          Learn more about{' '}
                          <a
                            className="text-[--dashboard-button] underline hover:text-[--dashboard-button-hover]"
                            href="https://atlas.nomic.ai/"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            semantic similarity visualizations
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
                  Note you are unable to login or edit this map. It&apos;s for
                  your visualization only. Please{' '}
                  <a
                    href="mailto:rohan13@illinois.edu"
                    className="text-[--dashboard-button] underline hover:text-[--dashboard-button-hover]"
                  >
                    contact us
                  </a>{' '}
                  with questions.
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
                  Visualization Not Available Yet
                </Text>
                <Text className="mt-2">
                  We need at least 20 questions to generate a meaningful
                  visualization of how topics relate to each other. Please ask
                  more questions and check back later!
                </Text>
                <Text className="mt-3" size="sm">
                  Learn more about{' '}
                  <a
                    className="text-[--dashboard-button] underline hover:text-[--dashboard-button-hover]"
                    href="https://atlas.nomic.ai/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    semantic similarity visualizations
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
