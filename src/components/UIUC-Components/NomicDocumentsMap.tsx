import Head from 'next/head'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
// import { DropzoneS3Upload } from '~/components/UIUC-Components/Upload_S3'
import { fetchPresignedUrl } from '~/utils/apiUtils'
import {
  // Badge,
  // MantineProvider,
  Button,
  // Group,
  // Stack,
  // createStyles,
  // FileInput,
  // rem,
  Title,
  Text,
  Flex,
  createStyles,
  // Divider,
  MantineTheme,
  Divider,
  ActionIcon,
  // TextInput,
  // Tooltip,
} from '@mantine/core'
// const rubik_puddles = Rubik_Puddles({ weight: '400', subsets: ['latin'] })
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/router'
import { LoadingSpinner } from './LoadingSpinner'
import { downloadConversationHistory } from '../../pages/api/UIUC-api/downloadConvoHistory'
import { getConversationStats } from '../../pages/api/UIUC-api/getConversationStats'
import { getProjectStats } from '../../pages/api/UIUC-api/getProjectStats'
import ConversationsPerDayChart from './ConversationsPerDayChart'
import ConversationsPerHourChart from './ConversationsPerHourChart'
import ConversationsPerDayOfWeekChart from './ConversationsPerDayOfWeekChart'
import ConversationsHeatmapByHourChart from './ConversationsHeatmapByHourChart'
import {
  IconMessage2,
  IconUsers,
  IconMessageCircle2,
  IconInfoCircle,
} from '@tabler/icons-react'
import { AnimatePresence, motion } from 'framer-motion'

function NomicDocumentMap({ course_name }: { course_name: string }) {
  const [accordionOpened, setAccordionOpened] = useState(false)

  const [nomicMapData, setNomicMapData] = useState<NomicMapData | null>(null)
  const [nomicIsLoading, setNomicIsLoading] = useState(true)

  // fetch nomicMapData
  useEffect(() => {
    const fetchNomicMapData = async () => {
      try {
        // Fix URL parameter syntax - change ? to &
        const response = await fetch(
          `/api/getNomicMapForQueries?course_name=${course_name}&map_type=conversation`,
        )

        // Log response details for debugging
        console.log('Response status:', response.status)
        const responseText = await response.text()

        // Try parsing response text
        let data
        try {
          data = JSON.parse(responseText)
        } catch (parseError) {
          console.error('Error parsing response:', responseText)
          throw parseError
        }

        const parsedData: NomicMapData = {
          map_id: data.map_id,
          map_link: data.map_link,
        }
        console.log('Parsed nomic map data:', parsedData)
        setNomicMapData(parsedData)
        setNomicIsLoading(false)
      } catch (error) {
        console.error('Error fetching nomic map:', error)
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
            background: '#15162c',
            paddingTop: '1rem',
          }}
        >
          <div className="w-full px-4 py-3 sm:px-6 sm:py-4 md:px-8">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Title
                  order={3}
                  className={`pl-12 text-[hsl(280,100%,70%)] ${montserrat_heading.variable} font-montserratHeading text-lg sm:text-2xl`}
                >
                  Concept Map of User Queries
                </Title>

                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={() => setAccordionOpened(!accordionOpened)}
                  className="hover:bg-white/10"
                  title="More info on nomic map"
                >
                  <IconInfoCircle className="text-white/60" />
                </ActionIcon>
              </div>
            </div>
          </div>

          <div className="pt-2"></div>
          <Divider className="w-full" color="gray.4" size="sm" />

          {/* Accordion info button */}
          <AnimatePresence>
            {accordionOpened && (
              <>
                <div className="pt-4"></div>
                <div className="bg-[#1e1f3a]/80 px-4 py-4 sm:px-6 sm:py-6 md:px-8">
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className=" overflow-hidden"
                  >
                    <div className="flex bg-[#1e1f3a]/80 backdrop-blur-sm">
                      <div className="w-1 bg-violet-500/50" />
                      <div
                        className={`${montserrat_paragraph.variable}  flex-1 p-4 font-montserratParagraph`}
                      >
                        <Text
                          className={`${montserrat_paragraph.variable} mb-4 font-montserratParagraph text-white/80`}
                        >
                          The Concept Map visualizes all queries made in this
                          project:
                        </Text>
                        <ul className="list-inside list-disc space-y-2 text-white/80">
                          <li className="text-sm">
                            <span className="text-violet-300">
                              Similar topics
                            </span>{' '}
                            cluster together
                          </li>
                          <li className="text-sm">
                            <span className="text-violet-300">
                              Different topics
                            </span>{' '}
                            are positioned further apart
                          </li>
                          <li className="text-sm">
                            <span className="text-violet-300">
                              Common themes
                            </span>{' '}
                            and knowledge gaps become visible
                          </li>
                        </ul>
                        <Text className="mt-3 text-gray-400" size="sm">
                          Learn more about{' '}
                          <a
                            className="text-purple-400 underline hover:text-purple-300"
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
                  Note you are unable to login or edit this map. It's for your
                  visualization only. Please{' '}
                  <a
                    href="mailto:kvday2@illinois.edu"
                    className="text-purple-400 underline hover:text-purple-300"
                  >
                    contact us
                  </a>{' '}
                  with questions.
                </Text>
              </div>
            </>
          ) : (
            <>
              <div className="w-full">
                <Text
                  className={`${montserrat_heading.variable} font-montserratHeading text-gray-200`}
                  size="lg"
                >
                  Visualization Not Available Yet
                </Text>
                <Text className="mt-2 text-gray-300">
                  We need at least 20 questions to generate a meaningful
                  visualization of how topics relate to each other. Please ask
                  more questions and check back later!
                </Text>
                <Text className="mt-3 text-gray-400" size="sm">
                  Learn more about{' '}
                  <a
                    className="text-purple-400 underline hover:text-purple-300"
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
