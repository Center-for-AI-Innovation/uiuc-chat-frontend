import { Card, Title, Text, ActionIcon } from '@mantine/core'
import { DocGroupsTable } from './DocGroupsTable'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { IconInfoCircle } from '@tabler/icons-react'
import { useMediaQuery } from '@mantine/hooks'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function DocumentGroupsCard({ course_name }: { course_name: string }) {
  const isSmallScreen = useMediaQuery('(max-width: 960px)')
  const [accordionOpened, setAccordionOpened] = useState(false)

  return (
    <Card
      shadow="xs"
      padding="none"
      radius="xl"
      className="mt-[2%] w-[96%] md:w-[90%] 2xl:w-[90%]"
    >
      <div
        style={{
          color: 'white',
        }}
        className="min-h-full bg-gradient-to-r from-purple-900 via-indigo-800 to-blue-800"
      >
        <div className="w-full border-b border-white/10 bg-black/20 px-4 py-3 sm:px-6 sm:py-4 md:px-8">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <Title
                order={3}
                className={`${montserrat_heading.variable} font-montserratHeading text-lg text-white/90 sm:text-2xl`}
              >
                Document Groups
              </Title>
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={() => setAccordionOpened(!accordionOpened)}
                className="hover:bg-white/10"
                title="More info on document groups"
              >
                <IconInfoCircle className="text-white/60" />
              </ActionIcon>
            </div>
          </div>
        </div>

        <div className="bg-[#1e1f3a]/80 px-4 py-4 sm:px-6 sm:py-6 md:px-8">
          <AnimatePresence>
            {accordionOpened && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="mb-6 overflow-hidden"
              >
                <div className="flex bg-[#1e1f3a]/80 backdrop-blur-sm">
                  <div className="w-1 bg-violet-500/50" />
                  <div
                    className={`${montserrat_paragraph.variable} mb-4 flex-1 p-4 font-montserratParagraph`}
                  >
                    <Text
                      className={`${montserrat_paragraph.variable} mb-4 font-montserratParagraph text-white/80`}
                    >
                      Document Groups help you organize and control your
                      content:
                    </Text>
                    <ul className="list-inside list-disc space-y-2 text-white/80">
                      <li className="text-sm">
                        <span className="text-violet-300">Organize</span>{' '}
                        documents into clear categories
                      </li>
                      <li className="text-sm">
                        <span className="text-violet-300">Enable/disable</span>{' '}
                        groups to control visibility
                      </li>
                      <li className="text-sm">
                        <span className="text-violet-300">Filter chats</span> to
                        specific document groups
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <DocGroupsTable course_name={course_name} />
        </div>
      </div>
    </Card>
  )
}

export default DocumentGroupsCard
