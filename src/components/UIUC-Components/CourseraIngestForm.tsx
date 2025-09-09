import React, { useEffect, useState } from 'react'
import { Text, Card, Button, Input } from '@mantine/core'
import { IconArrowRight } from '@tabler/icons-react'
// import { APIKeyInput } from '../LLMsApiKeyInputForm'
// import { ModelToggles } from '../ModelToggles'
import { motion } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../Dialog'
// import { Checkbox } from '@radix-ui/react-checkbox'
import NextLink from 'next/link'
import Image from 'next/image'
export default function CourseraIngestForm(): JSX.Element {
  const [isUrlUpdated, setIsUrlUpdated] = useState(false)
  const [isUrlValid, setIsUrlValid] = useState(false)
  const [url, setUrl] = useState('')
  const [maxUrls, setMaxUrls] = useState('50')
  const [open, setOpen] = useState(false)
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    setUrl(input)
    setIsUrlValid(validateUrl(input))
  }
  const validateUrl = (input: string) => {
    const regex = /^https?:\/\/(www\.)?coursera\.org\/learn\/.+/
    return regex.test(input)
  }

  const [inputErrors, setInputErrors] = useState({
    maxUrls: { error: false, message: '' },
    maxDepth: { error: false, message: '' },
  })

  useEffect(() => {
    if (url && url.length > 0 && validateUrl(url)) {
      setIsUrlUpdated(true)
    } else {
      setIsUrlUpdated(false)
    }
  }, [url])

  const handleIngest = () => {
    setOpen(false)
    if (url.includes('coursera.org')) {
      // TODO: coursera ingest
      alert(
        'Coursera ingest is not yet automated (auth is hard). Please email rohan13@illinois.edu to do it for you',
      )
    }
  }
  // if (isLoading) {
  //   return <Skeleton height={200} width={330} radius={'lg'} />
  // }

  return (
    <motion.div layout>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen)
          if (!isOpen) {
            setUrl('')
            setIsUrlValid(false)
            setIsUrlUpdated(false)
            setMaxUrls('50')
          }
        }}
      >
        <DialogTrigger asChild>
          <Card
            className="group relative cursor-pointer overflow-hidden rounded-2xl bg-[--dashboard-background-faded] p-6 text-[--dashboard-foreground] transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
            style={{ height: '100%' }}
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[--dashboard-background-darker]">
                  <Image
                    src="/media/coursera_logo_cutout.png"
                    alt="Coursera Logo"
                    width={32}
                    height={32}
                    className="h-8 w-8 object-contain"
                  />
                </div>
                <Text className="text-xl font-semibold">Coursera</Text>
              </div>
            </div>
            <Text className="mb-4 text-sm leading-relaxed text-[--dashboard-foreground-faded]">
              Import content from Coursera courses, including lectures,
              assignments, and course materials.
            </Text>
            <div className="mt-auto flex items-center text-sm font-bold text-[--dashboard-button]">
              <span>Configure import</span>
              <IconArrowRight
                size={16}
                className="ml-2 transition-transform group-hover:translate-x-1"
              />
            </div>
          </Card>
        </DialogTrigger>

        <DialogContent className="mx-auto h-auto max-h-[85vh] w-[95%] max-w-2xl overflow-y-auto !rounded-2xl border-0 bg-[--modal] px-4 py-6 text-[--modal-text] sm:px-6">
          <DialogHeader>
            <DialogTitle className="mb-4 text-left text-xl font-bold">
              Ingest Coursera Course
            </DialogTitle>
          </DialogHeader>
          <div className="">
            <div className="">
              <div>
                <div className="break-words text-sm sm:text-base">
                  <strong>For Coursera</strong>, just enter a URL like{' '}
                  <code className="inline-flex items-center rounded-md bg-[--illinois-orange] px-2 py-1 font-mono text-xs text-[--illinois-white] sm:text-sm">
                    coursera.org/learn/COURSE_NAME
                  </code>
                  ,<br />
                  for example:{' '}
                  <span className="break-all text-[--dashboard-button]">
                    <NextLink
                      target="_blank"
                      rel="noreferrer"
                      href={'https://www.coursera.org/learn/machine-learning'}
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                      https://www.coursera.org/learn/machine-learning
                    </NextLink>
                  </span>
                  .
                </div>

                <Input
                  icon={
                    <Image
                      src="/media/coursera_logo_cutout.png"
                      alt="Coursera Logo"
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                  }
                  className="mt-4 w-full rounded-full"
                  styles={{
                    input: {
                      color: 'var(--foreground)',
                      backgroundColor: 'var(--background-faded)',
                      borderColor: 'var(--background-dark)',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      '&:focus': {
                        borderColor: 'var(--illinois-orange)',
                      },
                    },
                    wrapper: {
                      width: '100%',
                    },
                  }}
                  placeholder="Enter URL..."
                  radius="md"
                  type="url"
                  value={url}
                  size="lg"
                  onChange={(e) => {
                    handleUrlChange(e)
                  }}
                />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Button
              onClick={handleIngest}
              disabled={!isUrlValid}
              className="h-11 w-full rounded-xl bg-[--dashboard-button] text-[--dashboard-button-foreground] transition-colors hover:bg-[--dashboard-button-hover] disabled:bg-[--background-faded] disabled:text-[--background-dark]"
            >
              Ingest Course
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
