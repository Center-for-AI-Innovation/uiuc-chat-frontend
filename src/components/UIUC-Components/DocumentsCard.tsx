import { Button, Card, Modal, Text, Title, createStyles } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { IconFileExport } from '@tabler/icons-react'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { useRouter } from 'next/router'
import { useState } from 'react'
import handleExport from '~/pages/util/handleExport'
import { type CourseMetadata } from '~/types/courseMetadata'
import { useResponsiveCardWidth } from '~/utils/responsiveGrid'
import { showToastOnUpdate } from './MakeQueryAnalysisPage'
import { ProjectFilesTable } from './ProjectFilesTable'

const useStyles = createStyles(() => ({
  tabsList: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '0.5rem 2rem',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    gap: '1rem',
  },
  tab: {
    color: 'rgba(255, 255, 255, 0.9)',
    '&[data-active]': {
      backgroundColor: 'rgba(139, 92, 246, 0.3)',
    },
    '&:hover': {
      backgroundColor: 'rgba(139, 92, 246, 0.2)',
    },
    borderRadius: '0.5rem',
    padding: '0.5rem 1rem',
  },
  tableContainer: {
    // backgroundColor: '#1e1f3a',
    borderRadius: '0 0 0.75rem 0.75rem',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    '&::-webkit-scrollbar': {
      width: '8px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'rgba(139, 92, 246, 0.5)',
      borderRadius: '4px',
    },
  },
}))

function DocumentsCard({
  course_name,
  metadata,
  sidebarCollapsed = false,
}: {
  course_name: string
  metadata: CourseMetadata
  sidebarCollapsed?: boolean
}) {
  const [tabValue, setTabValue] = useState<string | null>('success')
  const [failedCount, setFailedCount] = useState<number>(0)
  const isSmallScreen = useMediaQuery('(max-width: 960px)')
  const [exportModalOpened, setExportModalOpened] = useState(false)
  const router = useRouter()
  const { classes, theme } = useStyles()

  // Get responsive card width classes based on sidebar state
  const cardWidthClasses = useResponsiveCardWidth(sidebarCollapsed || false)

  const getCurrentPageName = () => {
    return router.asPath.slice(1).split('/')[0] as string
  }

  return (
    <Card
      withBorder
      padding="none"
      radius="xl"
      className={`mt-[2%] ${cardWidthClasses}`}
      style={{
        backgroundColor: 'var(--background)',
        borderColor: 'var(--dashboard-border)',
      }}
    >
      <div className="min-h-full bg-[--background]">
        <Modal
          opened={exportModalOpened}
          onClose={() => setExportModalOpened(false)}
          title="Please confirm your action"
          centered
        >
          <Text size="sm" style={{ color: 'white' }}>
            {`Are you sure you want to export all the documents and embeddings?`}
          </Text>
          <div className="mt-5 flex justify-end gap-2">
            <Button
              className="rounded-md bg-transparent text-white hover:bg-[--dashboard-button-hover]"
              onClick={() => setExportModalOpened(false)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-md bg-[--dashboard-button] text-[--dashboard-button-foreground] hover:bg-[--dashboard-button-hover]"
              onClick={async () => {
                setExportModalOpened(false)
                const result = await handleExport(getCurrentPageName())
                if (result && result.message) {
                  showToastOnUpdate(theme, false, false, result.message)
                }
              }}
            >
              Export
            </Button>
          </div>
        </Modal>

        <div className="w-full border-b border-[--dashboard-border] px-4 py-3 sm:px-6 sm:py-4 md:px-8">
          <div className="flex items-center justify-between gap-2">
            <Title
              order={3}
              className={`${montserrat_heading.variable} font-montserratHeading text-lg text-[--foreground] sm:text-2xl`}
            >
              Project Files
            </Title>

            <Button
              variant="subtle"
              leftIcon={<IconFileExport size={20} />}
              onClick={() => setExportModalOpened(true)}
              className={`
                ${montserrat_paragraph.variable} 
                rounded-md bg-[--dashboard-button] px-4
                font-montserratParagraph text-sm
                text-[--dashboard-button-foreground] hover:bg-[--dashboard-button-hover] sm:text-base
              `}
            >
              <span className="hidden sm:inline">
                Export All Documents & Embeddings
              </span>
              <span className="inline sm:hidden">Export All</span>
            </Button>
          </div>
        </div>

        <div className="bg-[--background] text-[--foreground]">
          {metadata && (
            <div className={classes.tableContainer}>
              <ProjectFilesTable
                course_name={course_name}
                setFailedCount={setFailedCount}
                tabValue={tabValue as string}
                onTabChange={(value) => setTabValue(value)}
                failedCount={failedCount}
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

export default DocumentsCard
