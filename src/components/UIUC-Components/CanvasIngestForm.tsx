import React, { useEffect, useRef, useState } from 'react'
import { Text, Switch, Card, Skeleton, Tooltip, useMantineTheme, Checkbox, Button, Input, ScrollArea } from '@mantine/core'
import { IconCheck, IconExternalLink, IconX } from '@tabler/icons-react'
// import { APIKeyInput } from '../LLMsApiKeyInputForm'
// import { ModelToggles } from '../ModelToggles'
import {
  AnthropicProvider,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../Dialog"
// import { Checkbox } from '@radix-ui/react-checkbox'
import { Label } from '@radix-ui/react-label'
import { ExternalLink } from 'tabler-icons-react'


export default function CanvasIngestForm() {
  const [isUrlUpdated, setIsUrlUpdated] = useState(false)
  const [isUrlValid, setIsUrlValid] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<string[]>([
    'files',
    'pages',
    'modules',
    'syllabus',
    'assignments',
    'discussions',
  ])
  const [url, setUrl] = useState('')
  const logoRef = useRef(null) // Create a ref for the logo
  const [showContentOptions, setShowContentOptions] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    setUrl(input)
    setIsUrlValid(validateUrl(input))
  }
  const validateUrl = (input: string) => {
    const regex = /^https?:\/\/canvas\.illinois\.edu\/courses\/\d+/
    return regex.test(input)
  }

  // const validateUrl = (url: string) => {
  //   const courseraRegex = /^https?:\/\/(www\.)?coursera\.org\/learn\/.+/
  //   const mitRegex = /^https?:\/\/ocw\.mit\.edu\/.+/
  //   const githubRegex = /^https?:\/\/(www\.)?github\.com\/.+/
  //   const canvasRegex = /^https?:\/\/canvas\.illinois\.edu\/courses\/\d+/
  //   const webScrapingRegex = /^(https?:\/\/)?.+/

  //   return (
  //     courseraRegex.test(url) ||
  //     mitRegex.test(url) ||
  //     githubRegex.test(url) ||
  //     canvasRegex.test(url) ||
  //     webScrapingRegex.test(url)
  //   )
  // }
  useEffect(() => {
    if (url && url.length > 0 && validateUrl(url)) {
      setIsUrlUpdated(true)
    } else {
      setIsUrlUpdated(false)
    }
  }, [url])
  const handleOptionChange = (option: string) => {
    setSelectedOptions(prev =>
      prev.includes(option)
        ? prev.filter(item => item !== option)
        : [...prev, option]
    )
  }

  const handleIngest = () => {
    console.log('Ingesting:', url, 'with options:', selectedOptions)
    // Implement actual ingest logic here
  }
  // if (isLoading) {
  //   return <Skeleton height={200} width={330} radius={'lg'} />
  // }
  return (
    <motion.div layout>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Card className="max-w-[330px] bg-[#15162c] md:w-[330px] p-6 rounded-lg shadow-sm hover:bg-[#1c1c2e] cursor-pointer transition-colors duration-300">
            <div className="flex items-center justify-between mb-4">
              {/* <div>
            <a
              className="mb-3 flex items-center"
              href="https://canvas.illinois.edu"
              target="_blank"
              rel="noopener noreferrer"
            > */}

              <span className="text-lg font-medium mr-2 text-yellow flex items-center">
                <img
                  ref={logoRef} // Attach the ref to the logo
                  src="/media/canvas_logo.png"
                  alt="Canvas logo"
                  style={{ width: '2rem', height: '2rem', marginRight: '0.5rem' }}
                />
                Canvas
              </span>
              {/* <ExternalLink size={16} className="text-white" /> */}
              {/* </a> */}
              {/* </div> */}
              {/* <div className="relative inline-block w-10 mr-2 align-middle select-none">
            <input
              type="checkbox"
              name="toggle"
              id="toggle"
              className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
              checked={isEnabled}
              onChange={() => setIsEnabled(!isEnabled)}
            />
            <label
              htmlFor="toggle"
              className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
            ></label>
          </div> */}
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Ingest content from Canvas courses for AI-powered learning assistance.
            </p>
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >

                <DialogContent className="sm:max-w-[425px] bg-[#15162c] text-white border-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Ingest Canvas Course</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="mt-4 h-[60vh] pr-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="canvas-url" className="text-white">Canvas Course URL</Label>
                        <Input
                          id="canvas-url"
                          placeholder="https://canvas.illinois.edu/courses/12345"
                          value={url}
                          onChange={handleUrlChange}
                          className="bg-[#1c1c2e] border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Select Content to Ingest</Label>
                        {['Files', 'Pages', 'Modules', 'Syllabus', 'Assignments', 'Discussions'].map((option) => (
                          <div key={option} className="flex items-center space-x-2 mt-2">
                            <Checkbox
                              id={option.toLowerCase()}
                              color='violet'
                              // styles={(theme) => ({
                              //   inner: {
                              //     // backgroundColor: 'purple !important',
                              //     borderColor: 'hsl(280,100%,80%) !important',
                              //   },
                              //   input: {
                              //     backgroundColor: 'transparent !important',
                              //     borderColor: 'hsl(280,100%,80%) !important',
                              //   },
                              //   icon: {
                              //     backgroundColor: 'purple !important',
                              //     borderColor: 'hsl(280,100%,80%) !important',
                              //   }
                              // })}
                              checked={selectedOptions.includes(option.toLowerCase())}
                              onChange={() => handleOptionChange(option.toLowerCase())}
                              // onCheckedChange={() => handleOptionChange(option.toLowerCase())}
                              className="border-gray-400 text-purple-600 focus:ring-purple-500"
                            />
                            <Label htmlFor={option.toLowerCase()} className="text-white">{option}</Label>
                          </div>
                        ))}
                      </div>
                      <div className="text-sm text-red-400">
                        Please ensure that you have added the UIUC Chatbot as a student to your course on Canvas before you begin ingesting the course content. The bot email address is uiuc.chat@ad.uillinois.edu and the bot name is UIUC Course AI.
                      </div>
                      <Button
                        onClick={handleIngest}
                        disabled={!isUrlValid}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        Ingest Canvas Course
                      </Button>
                    </div>
                  </ScrollArea>
                </DialogContent>

              </motion.div>
            </AnimatePresence>
          </Card>
        </DialogTrigger>
      </Dialog>


    </motion.div >
  )
}
