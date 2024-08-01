// ChatMessage.tsx
import {
  Text,
  Group,
  createStyles,
  Tooltip,
  Paper,
  Collapse,
  Accordion,
  Popover,
  Button,
  Badge,
} from '@mantine/core'
import {
  IconCheck,
  IconChevronDown,
  IconCopy,
  IconEdit,
  IconRobot,
  IconTrash,
  IconUser,
} from '@tabler/icons-react'
import {
  FC,
  Fragment,
  memo,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

import { useTranslation } from 'next-i18next'
import { updateConversation } from '@/utils/app/conversation'
import { Content, ContextWithMetadata, Message } from '@/types/chat'
import HomeContext from '~/pages/api/home/home.context'
import { CodeBlock } from '../Markdown/CodeBlock'
import { MemoizedReactMarkdown } from '../Markdown/MemoizedReactMarkdown'

import rehypeMathjax from 'rehype-mathjax'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

import { ContextCards } from '~/components/UIUC-Components/ContextCards'
import { ImagePreview } from './ImagePreview'
import { LoadingSpinner } from '../UIUC-Components/LoadingSpinner'
import { fetchPresignedUrl } from '~/utils/apiUtils'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { IntermediateStateAccordion } from '../UIUC-Components/IntermediateStateAccordion'

const useStyles = createStyles((theme) => ({
  imageContainerStyle: {
    maxWidth: '25%',
    flex: '1 0 21%',
    padding: '0.5rem',
    borderRadius: '0.5rem',
  },
  imageStyle: {
    width: '100%',
    height: '100px',
    objectFit: 'cover',
    borderRadius: '0.5rem',
    borderColor: theme.colors.gray[6],
    borderWidth: '1px',
    borderStyle: 'solid',
  },
}))

// Component that's the Timer for GPT's response duration.
const Timer: React.FC<{ timerVisible: boolean }> = ({ timerVisible }) => {
  const [timer, setTimer] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (timerVisible) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1)
      }, 1000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [timerVisible])

  return timer > 0 ? (
    <Text fz="sm" c="dimmed" mt="sm">
      {timer} s.
    </Text>
  ) : (
    <></>
  )
}

export interface Props {
  message: Message
  messageIndex: number
  onEdit?: (editedMessage: Message) => void
  context?: ContextWithMetadata[]
  contentRenderer?: (message: Message) => JSX.Element
  onImageUrlsUpdate?: (message: Message, messageIndex: number) => void
}

export const ChatMessage: FC<Props> = memo(
  ({ message, messageIndex, onEdit, onImageUrlsUpdate }) => {
    const { t } = useTranslation('chat')

    const {
      state: {
        selectedConversation,
        conversations,
        messageIsStreaming,
        isImg2TextLoading,
        isRouting,
        isRunningTool,
        isRetrievalLoading,
        loading,
      },
      dispatch: homeDispatch,
    } = useContext(HomeContext)

    const [isEditing, setIsEditing] = useState<boolean>(false)
    const [isTyping, setIsTyping] = useState<boolean>(false)
    const [messageContent, setMessageContent] = useState<string>('')

    const [imageUrls, setImageUrls] = useState<Set<string>>(new Set())

    const [messagedCopied, setMessageCopied] = useState(false)

    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // SET TIMER for message writing (from gpt-4)
    const [timerVisible, setTimerVisible] = useState(false)
    const { classes } = useStyles() // for Accordion

    useEffect(() => {
      if (message.role === 'assistant') {
        if (
          messageIsStreaming &&
          messageIndex == (selectedConversation?.messages.length ?? 0) - 1
        ) {
          setTimerVisible(true)
        } else {
          setTimerVisible(false)

          // save time to Message
          // const updatedMessages: Message[] =
          //   selectedConversation?.messages.map((message, index) => {
          //     if (index === messageIndex) {
          //       return {
          //         ...message,
          //         responseTimeSec: Timer.timer as number, // todo: get the timer value out of that component.
          //       }
          //     }
          //     return message
          //   })
          // const updatedConversation = {
          //   ...updatedConversation,
          //   messages: updatedMessages,
          // }
          // homeDispatch({
          //   field: 'selectedConversation',
          //   value: updatedConversation,
          // })
        }
      }
    }, [message.role, messageIsStreaming, messageIndex, selectedConversation])

    function deepEqual(a: any, b: any) {
      if (a === b) {
        return true
      }

      if (
        typeof a !== 'object' ||
        a === null ||
        typeof b !== 'object' ||
        b === null
      ) {
        return false
      }

      const keysA = Object.keys(a),
        keysB = Object.keys(b)

      if (keysA.length !== keysB.length) {
        return false
      }

      for (const key of keysA) {
        if (!keysB.includes(key) || !deepEqual(a[key], b[key])) {
          return false
        }
      }

      return true
    }

    useEffect(() => {
      const fetchUrl = async () => {
        let isValid = false
        if (Array.isArray(message.content)) {
          const updatedContent = await Promise.all(
            message.content.map(async (content) => {
              if (content.type === 'image_url' && content.image_url) {
                // console.log(
                // 'Checking if image url is valid: ',
                // content.image_url.url,
                // )
                isValid = await checkIfUrlIsValid(content.image_url.url)
                if (isValid) {
                  // console.log('Image url is valid: ', content.image_url.url)
                  setImageUrls(
                    (prevUrls) =>
                      new Set([...prevUrls, content.image_url?.url as string]),
                  )
                  // setImageUrls((prevUrls) => [
                  //   ...new Set([...prevUrls],
                  //   content.image_url?.url as string,
                  // ])
                  // console.log('Set the image urls: ', imageUrls)
                  return content
                } else {
                  const path = extractPathFromUrl(content.image_url.url)
                  console.log(
                    'Image url was invalid, fetching presigned url for: ',
                    path,
                  )
                  const presignedUrl = await getPresignedUrl(path)
                  setImageUrls(
                    (prevUrls) => new Set([...prevUrls, presignedUrl]),
                  )
                  // console.log('Set the image urls: ', imageUrls)
                  return { ...content, image_url: { url: presignedUrl } }
                }
              }
              return content
            }),
          )
          if (
            !isValid &&
            onImageUrlsUpdate &&
            !deepEqual(updatedContent, message.content)
          ) {
            console.log(
              'Updated content: ',
              updatedContent,
              'Previous content: ',
              message.content,
            )
            onImageUrlsUpdate(
              { ...message, content: updatedContent },
              messageIndex,
            )
          }
        }
      }
      if (message.role === 'user') {
        fetchUrl()
      }
    }, [message.content, messageIndex, isRunningTool])

    const toggleEditing = () => {
      setIsEditing(!isEditing)
    }

    const handleInputChange = (
      event: React.ChangeEvent<HTMLTextAreaElement>,
    ) => {
      setMessageContent(event.target.value)
      if (textareaRef.current) {
        textareaRef.current.style.height = 'inherit'
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
      }
    }

    const handleEditMessage = () => {
      if (message.content != messageContent) {
        if (selectedConversation && onEdit) {
          onEdit({ ...message, content: messageContent })
        }
      }
      setIsEditing(false)
    }

    const handleDeleteMessage = () => {
      if (!selectedConversation) return

      const { messages } = selectedConversation
      const findIndex = messages.findIndex((elm) => elm === message)

      if (findIndex < 0) return

      if (
        findIndex < messages.length - 1 &&
        messages[findIndex + 1]?.role === 'assistant'
      ) {
        messages.splice(findIndex, 2)
      } else {
        messages.splice(findIndex, 1)
      }
      const updatedConversation = {
        ...selectedConversation,
        messages,
      }

      const { single, all } = updateConversation(
        updatedConversation,
        conversations,
      )
      homeDispatch({ field: 'selectedConversation', value: single })
      homeDispatch({ field: 'conversations', value: all })
    }

    const handlePressEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !isTyping && !e.shiftKey) {
        e.preventDefault()
        handleEditMessage()
      }
    }

    const copyOnClick = () => {
      if (!navigator.clipboard) return

      navigator.clipboard.writeText(message.content as string).then(() => {
        setMessageCopied(true)
        setTimeout(() => {
          setMessageCopied(false)
        }, 2000)
      })
    }

    useEffect(() => {
      // setMessageContent(message.content)
      if (Array.isArray(message.content)) {
        const textContent = message.content
          .filter((content) => content.type === 'text')
          .map((content) => content.text)
          .join(' ')
        setMessageContent(textContent)
      }
      // RIGHT HERE, run context search.
      // WARNING! Kastan trying to set message context.
      // console.log('IN handleSend: ', message)
      // if (message.role === 'user') {
      //   buildContexts(message.content)
      // }
    }, [message.content])

    useEffect(() => {
      // console.log('Resetting image urls because message: ', message, 'selectedConversation: ', selectedConversation)
      setImageUrls(new Set())
      // console.log('Set the image urls: ', imageUrls)
    }, [message])

    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'inherit'
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
      }
    }, [isEditing])

    async function getPresignedUrl(uploadedImageUrl: string): Promise<string> {
      try {
        const presignedUrl = await fetchPresignedUrl(uploadedImageUrl)
        return presignedUrl as string
      } catch (error) {
        console.error(
          'Failed to fetch presigned URL for',
          uploadedImageUrl,
          error,
        )
        return ''
      }
    }

    async function checkIfUrlIsValid(url: string): Promise<boolean> {
      try {
        const urlObject = new URL(url)

        // Check if the URL is an S3 presigned URL by looking for specific query parameters
        const isS3Presigned = urlObject.searchParams.has('X-Amz-Signature')

        if (isS3Presigned) {
          dayjs.extend(utc)
          let creationDateString = urlObject.searchParams.get(
            'X-Amz-Date',
          ) as string

          // Manually reformat the creationDateString to standard ISO 8601 format
          creationDateString = creationDateString.replace(
            /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,
            '$1-$2-$3T$4:$5:$6Z',
          )

          // Adjust the format in the dayjs.utc function if necessary
          const creationDate = dayjs.utc(
            creationDateString,
            'YYYYMMDDTHHmmss[Z]',
          )

          const expiresInSecs = Number(
            urlObject.searchParams.get('X-Amz-Expires') as string,
          )
          const expiryDate = creationDate.add(expiresInSecs, 'second')
          const isExpired = expiryDate.toDate() < new Date()

          if (isExpired) {
            console.log('URL is expired') // Keep this log if necessary for debugging
            return false
          } else {
            return true
          }
        } else {
          // For non-S3 URLs, perform a simple fetch to check availability
          const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' })
          return response.type === 'opaque' // true if the fetch was successful, even though the response is opaque
        }
      } catch (error) {
        console.error('Failed to validate URL', url, error)
        return false
      }
    }

    function extractPathFromUrl(url: string): string {
      const urlObject = new URL(url)
      let path = urlObject.pathname
      if (path.startsWith('/')) {
        path = path.substring(1)
      }
      return path
    }

    useEffect(() => {
      const processTools = async () => {
        if (message.tools && message.tools.length > 0) {
          for (const tool of message.tools) {
            if (tool.output && tool.output.s3Paths) {
              const imageUrls = await Promise.all(
                tool.output.s3Paths.map(async (s3Path) => {
                  return getPresignedUrl(s3Path)
                }),
              )
              tool.output.imageUrls = tool.output.imageUrls
                ? [...tool.output.imageUrls, ...imageUrls]
                : imageUrls
            }
            if (
              tool.aiGeneratedArgumentValues &&
              tool.aiGeneratedArgumentValues?.image_urls
            ) {
              const validUrls = await Promise.all(
                JSON.parse(tool.aiGeneratedArgumentValues.image_urls).map(
                  async (imageUrl: string) => {
                    const isValid = await checkIfUrlIsValid(imageUrl)
                    if (!isValid) {
                      // This will only work for internal S3 URLs
                      console.log('Image URL is expired')
                      const s3_path = extractPathFromUrl(imageUrl)
                      return getPresignedUrl(s3_path)
                    }
                    return imageUrl
                  },
                ),
              )
              tool.aiGeneratedArgumentValues.image_urls =
                JSON.stringify(validUrls)
            }
            if (tool.output && tool.output.imageUrls) {
              const validUrls = await Promise.all(
                tool.output.imageUrls.map(async (imageUrl) => {
                  const isValid = await checkIfUrlIsValid(imageUrl)
                  if (!isValid) {
                    console.log('Image URL is expired')
                    const s3_path = extractPathFromUrl(imageUrl)
                    return getPresignedUrl(s3_path)
                  }
                  return imageUrl
                }),
              )
              tool.output.imageUrls = validUrls
            }
          }
        }
      }

      processTools()
    }, [message.tools])

    return (
      <div
        className={`group md:px-6 ${message.role === 'assistant'
            ? 'border-b border-black/10 bg-gray-50/50 text-gray-800 dark:border-[rgba(42,42,120,0.50)] dark:bg-[#202134] dark:text-gray-100'
            : 'border-b border-black/10 bg-white/50 text-gray-800 dark:border-[rgba(42,42,120,0.50)] dark:bg-[#15162B] dark:text-gray-100'
          } max-w-[100%]`}
        style={{ overflowWrap: 'anywhere' }}
      >
        <div className="relative flex w-full px-2 py-4 text-base md:mx-[10%] md:max-w-[80%] md:gap-6 md:p-6 lg:mx-[15%] lg:max-w-[70%] lg:px-0">
          <div className="min-w-[40px] text-left">
            {message.role === 'assistant' ? (
              <>
                <IconRobot size={30} />
                <Timer timerVisible={timerVisible} />
              </>
            ) : (
              <IconUser size={30} />
            )}
          </div>

          <div className="dark:prose-invert prose mt-[-2px] flex w-full max-w-full">
            {message.role === 'user' ? (
              <div className="flex w-full flex-row">
                {isEditing ? (
                  <div className="flex w-full flex-col">
                    <textarea
                      ref={textareaRef}
                      className="w-full resize-none whitespace-pre-wrap border-none dark:bg-[#343541]"
                      value={messageContent}
                      onChange={handleInputChange}
                      onKeyDown={handlePressEnter}
                      onCompositionStart={() => setIsTyping(true)}
                      onCompositionEnd={() => setIsTyping(false)}
                      style={{
                        fontFamily: 'inherit',
                        fontSize: 'inherit',
                        lineHeight: 'inherit',
                        padding: '0',
                        margin: '0',
                        overflow: 'hidden',
                      }}
                    />

                    <div className="mt-10 flex justify-center space-x-4">
                      <button
                        className="h-[40px] rounded-md bg-blue-500 px-4 py-1 text-sm font-medium text-white enabled:hover:bg-blue-600 disabled:opacity-50"
                        onClick={handleEditMessage}
                        disabled={messageContent.trim().length <= 0}
                      >
                        {t('Save & Submit')}
                      </button>
                      <button
                        className="h-[40px] rounded-md border border-neutral-300 px-4 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        onClick={() => {
                          setMessageContent(messageContent)
                          setIsEditing(false)
                        }}
                      >
                        {t('Cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="dark:prose-invert prose w-4/5 flex-1 whitespace-pre-wrap">
                    {Array.isArray(message.content) ? (
                      <>
                        <div className="flex w-full flex-col items-start space-y-2">
                          {/* User message text for all messages */}
                          {message.content.map((content, index) => {
                            if (content.type === 'text') {
                              if (
                                !(content.text as string)
                                  .trim()
                                  .startsWith('Image description:')
                              ) {
                                return (
                                  <p
                                    key={index}
                                    className={`self-start text-base font-normal ${montserrat_paragraph.variable} font-montserratParagraph`}
                                  >
                                    {content.text}
                                  </p>
                                )
                              }
                            }
                          })}
                          {/* Image previews for all messages */}
                          <div className="-m-1 flex w-full flex-wrap justify-start">
                            {message.content
                              .filter((item) => item.type === 'image_url')
                              .map((content, index) => (
                                <div
                                  key={index}
                                  className={classes.imageContainerStyle}
                                >
                                  <div className="overflow-hidden rounded-lg shadow-lg">
                                    <ImagePreview
                                      src={
                                        Array.from(imageUrls)[index] as string
                                      }
                                      alt="Chat message"
                                      className={classes.imageStyle}
                                    />
                                  </div>
                                </div>
                              ))}
                          </div>

                          {/* Image description loading state for last message */}
                          {isImg2TextLoading &&
                            (messageIndex ===
                              (selectedConversation?.messages.length ?? 0) -
                              1 ||
                              messageIndex ===
                              (selectedConversation?.messages.length ?? 0) -
                              2) && (
                              <IntermediateStateAccordion
                                accordionKey="imageDescription"
                                title="Image Description"
                                isLoading={isImg2TextLoading}
                                error={false}
                                content={
                                  message.content.find(
                                    (content) =>
                                      content.type === 'text' &&
                                      content.text
                                        ?.trim()
                                        .startsWith('Image description:'),
                                  )?.text ?? 'No image description found'
                                }
                              />
                            )}

                          {/* Image description for all messages */}
                          {message.content.some(
                            (content) =>
                              content.type === 'text' &&
                              content.text
                                ?.trim()
                                .startsWith('Image description:'),
                          ) && (
                              <IntermediateStateAccordion
                                accordionKey="imageDescription"
                                title="Image Description"
                                isLoading={false}
                                error={false}
                                content={
                                  message.content.find(
                                    (content) =>
                                      content.type === 'text' &&
                                      content.text
                                        ?.trim()
                                        .startsWith('Image description:'),
                                  )?.text ?? 'No image description found'
                                }
                              />
                            )}

                          {/* Retrieval results for all messages */}
                          {message.contexts && message.contexts.length > 0 && (
                            <IntermediateStateAccordion
                              accordionKey="retrieval loading"
                              title="Retrieved documents"
                              isLoading={false}
                              error={false}
                              content={`Found ${message.contexts?.length} document chunks.`}
                            />
                          )}

                          {/* Retrieval loading state for last message */}
                          {isRetrievalLoading &&
                            (messageIndex ===
                              (selectedConversation?.messages.length ?? 0) -
                              1 ||
                              messageIndex ===
                              (selectedConversation?.messages.length ?? 0) -
                              2) && (
                              <IntermediateStateAccordion
                                accordionKey="retrieval loading"
                                title="Retrieving documents"
                                isLoading={isRetrievalLoading}
                                error={false}
                                content={`Found ${message.contexts?.length} document chunks.`}
                              />
                            )}

                          {/* Tool Routing loading state for last message */}
                          {isRouting &&
                            (messageIndex ===
                              (selectedConversation?.messages.length ?? 0) -
                              1 ||
                              messageIndex ===
                              (selectedConversation?.messages.length ?? 0) -
                              2) && (
                              <IntermediateStateAccordion
                                accordionKey={`routing tools`}
                                title={'Routing the request to relevant tools'}
                                isLoading={isRouting}
                                error={false}
                                content={<></>}
                              />
                            )}

                          {/* Tool input arguments state for last message */}
                          {isRouting === false &&
                            message.tools &&
                            (messageIndex ===
                              (selectedConversation?.messages.length ?? 0) -
                              1 ||
                              messageIndex ===
                              (selectedConversation?.messages.length ?? 0) -
                              2) && (
                              <>
                                {message.tools.map((response, index) => (
                                  <IntermediateStateAccordion
                                    key={`routing-${index}`}
                                    accordionKey={`routing-${index}`}
                                    title={
                                      <>
                                        Routing the request to{' '}
                                        <Badge
                                          color="grape"
                                          radius="md"
                                          size="sm"
                                        >
                                          {response.readableName}
                                        </Badge>
                                      </>
                                    }
                                    isLoading={isRouting}
                                    error={false}
                                    content={
                                      <>
                                        Arguments :{' '}
                                        {response.aiGeneratedArgumentValues
                                          ?.image_urls ? (
                                          <div>
                                            <div className="flex overflow-x-auto">
                                              {JSON.parse(
                                                response
                                                  .aiGeneratedArgumentValues
                                                  .image_urls,
                                              ).length > 0 ? (
                                                JSON.parse(
                                                  response
                                                    .aiGeneratedArgumentValues
                                                    .image_urls,
                                                ).map(
                                                  (
                                                    imageUrl: string,
                                                    index: number,
                                                  ) => (
                                                    <div
                                                      key={index}
                                                      className={
                                                        classes.imageContainerStyle
                                                      }
                                                    >
                                                      <div className="overflow-hidden rounded-lg shadow-lg">
                                                        <ImagePreview
                                                          src={imageUrl}
                                                          alt={`Tool image argument ${index}`}
                                                          className={
                                                            classes.imageStyle
                                                          }
                                                        />
                                                      </div>
                                                    </div>
                                                  ),
                                                )
                                              ) : (
                                                <p>No arguments provided</p>
                                              )}
                                            </div>
                                          </div>
                                        ) : (
                                          <pre>
                                            {JSON.stringify(
                                              response.aiGeneratedArgumentValues,
                                              null,
                                              2,
                                            )}
                                          </pre>
                                        )}
                                      </>
                                    }
                                  />
                                ))}
                              </>
                            )}

                          {/* Tool output states for last message */}
                          {(messageIndex ===
                            (selectedConversation?.messages.length ?? 0) - 1 ||
                            messageIndex ===
                            (selectedConversation?.messages.length ?? 0) -
                            2) && (
                              <>
                                {message.tools?.map((response, index) => (
                                  <IntermediateStateAccordion
                                    key={`tool-${index}`}
                                    accordionKey={`tool-${index}`}
                                    title={
                                      <>
                                        Tool output from{' '}
                                        <Badge
                                          color={response.error ? 'red' : 'grape'}
                                          radius="md"
                                          size="sm"
                                        >
                                          {response.readableName}
                                        </Badge>
                                      </>
                                    }
                                    isLoading={
                                      response.output === undefined &&
                                      response.error === undefined
                                    }
                                    error={response.error ? true : false}
                                    content={
                                      <>
                                        {response.error ? (
                                          <span>{response.error}</span>
                                        ) : (
                                          <>
                                            <div
                                              style={{
                                                display: 'flex',
                                                overflowX: 'auto',
                                                gap: '10px',
                                              }}
                                            >
                                              {response.output?.imageUrls &&
                                                response.output?.imageUrls.map(
                                                  (imageUrl, index) => (
                                                    <div
                                                      key={index}
                                                      className={
                                                        classes.imageContainerStyle
                                                      }
                                                    >
                                                      <div className="overflow-hidden rounded-lg shadow-lg">
                                                        <ImagePreview
                                                          src={imageUrl}
                                                          alt={`Tool output image ${index}`}
                                                          className={
                                                            classes.imageStyle
                                                          }
                                                        />
                                                      </div>
                                                    </div>
                                                  ),
                                                )}
                                            </div>
                                            <div>
                                              {response.output?.text
                                                ? response.output.text
                                                : JSON.stringify(
                                                  response.output?.data,
                                                  null,
                                                  2,
                                                )}
                                            </div>
                                          </>
                                        )}
                                      </>
                                    }
                                  />
                                ))}
                              </>
                            )}
                          {(() => {
                            if (
                              messageIsStreaming === undefined ||
                              !messageIsStreaming
                            ) {
                              console.log(
                                'isRouting: ',
                                isRouting,
                                'isRetrievalLoading: ',
                                isRetrievalLoading,
                                'isImg2TextLoading: ',
                                isImg2TextLoading,
                                'messageIsStreaming: ',
                                messageIsStreaming,
                                'loading: ',
                                loading,
                              )
                            }
                            return null
                          })()}
                          {!isRouting &&
                            !isRetrievalLoading &&
                            !isImg2TextLoading &&
                            loading &&
                            (messageIndex ===
                              (selectedConversation?.messages.length ?? 0) -
                              1 ||
                              messageIndex ===
                              (selectedConversation?.messages.length ?? 0) -
                              2) &&
                            message.tools?.every(
                              (tool) =>
                                tool.output !== undefined ||
                                tool.error !== undefined,
                            ) && (
                              <>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginLeft: '10px',
                                    marginTop: '10px',
                                  }}
                                >
                                  <p
                                    style={{
                                      marginRight: '10px',
                                      fontWeight: 'bold',
                                      textShadow: '0 0 10px',
                                    }}
                                    className={`pulsate text-base ${montserrat_paragraph.variable} font-montserratParagraph`}
                                  >
                                    Generating final response:
                                  </p>
                                  <LoadingSpinner size="xs" />
                                </div>
                              </>
                            )}
                        </div>
                      </>
                    ) : (
                      <>
                        {message.content}
                        {isRetrievalLoading &&
                          (messageIndex ===
                            (selectedConversation?.messages.length ?? 0) - 1 ||
                            messageIndex ===
                            (selectedConversation?.messages.length ?? 0) -
                            2) && (
                            <div
                              style={{ display: 'flex', alignItems: 'center' }}
                            >
                              <p
                                style={{
                                  marginRight: '10px',
                                  fontWeight: 'bold',
                                  textShadow: '0 0 10px',
                                }}
                                className={`pulsate ${montserrat_paragraph.variable} font-montserratParagraph`}
                              >
                                Retrieving relevant documents:
                              </p>
                              <LoadingSpinner size="xs" />
                            </div>
                          )}
                      </>
                    )}
                  </div>
                )}

                {!isEditing && (
                  <div className="mb-10 ml-1 flex w-1/5 flex-col items-end justify-start gap-4 md:-mr-8 md:ml-0 md:flex-row md:items-start md:justify-end md:gap-1">
                    <button
                      className={`invisible text-gray-500 hover:text-gray-700 focus:visible group-hover:visible dark:text-gray-400 dark:hover:text-gray-300 
                        ${Array.isArray(message.content) && message.content.some((content) => content.type === 'image_url') ? 'hidden' : ''}`}
                      onClick={toggleEditing}
                    >
                      <IconEdit size={20} />
                    </button>
                    <button
                      className="invisible text-gray-500 hover:text-gray-700 focus:visible group-hover:visible dark:text-gray-400 dark:hover:text-gray-300"
                      onClick={handleDeleteMessage}
                    >
                      <IconTrash size={20} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex max-w-[90%] flex-row overflow-hidden">
                <div className="w-full max-w-full flex-1 overflow-hidden">
                  <MemoizedReactMarkdown
                    className={`dark:prose-invert linkMarkDown supMarkdown codeBlock prose flex-1`}
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeMathjax]}
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        if (children.length) {
                          if (children[0] == '▍') {
                            return (
                              <span className="mt-1 animate-pulse cursor-default">
                                ▍
                              </span>
                            )
                          }

                          children[0] = (children[0] as string).replace(
                            '`▍`',
                            '▍',
                          )
                        }

                        const match = /language-(\w+)/.exec(className || '')

                        return !inline ? (
                          <CodeBlock
                            key={Math.random()}
                            language={(match && match[1]) || ''}
                            value={String(children).replace(/\n$/, '')}
                            style={{
                              maxWidth: '100%',
                              overflowX: 'auto',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-all',
                              overflowWrap: 'anywhere',
                            }}
                            {...props}
                          />
                        ) : (
                          <code
                            className={'codeBlock'}
                            {...props}
                            style={{
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-all',
                              overflowWrap: 'anywhere',
                            }}
                          >
                            {children}
                          </code>
                        )
                      },
                      p({ node, children }) {
                        return (
                          <p
                            className={`text-base font-normal ${montserrat_paragraph.variable} pb-2 font-montserratParagraph`}
                          >
                            {children}
                          </p>
                        )
                      },
                      ul({ children }) {
                        return (
                          <ul
                            className={`text-base font-normal ${montserrat_paragraph.variable} font-montserratParagraph`}
                          >
                            {children}
                          </ul>
                        )
                      },
                      ol({ children }) {
                        return (
                          <ol
                            className={`text-base font-normal ${montserrat_paragraph.variable} ml-4 font-montserratParagraph lg:ml-6`}
                          >
                            {children}
                          </ol>
                        )
                      },
                      li({ children }) {
                        return (
                          <li
                            className={`text-base font-normal ${montserrat_paragraph.variable} break-words font-montserratParagraph`}
                          >
                            {children}
                          </li>
                        )
                      },
                      table({ children }) {
                        return (
                          <table className="border-collapse border border-black px-3 py-1 dark:border-white">
                            {children}
                          </table>
                        )
                      },
                      th({ children }) {
                        return (
                          <th className="break-words border border-black bg-gray-500 px-3 py-1 text-white dark:border-white">
                            {children}
                          </th>
                        )
                      },
                      td({ children }) {
                        return (
                          <td className="break-words border border-black px-3 py-1 dark:border-white">
                            {children}
                          </td>
                        )
                      },
                      h1({ node, children }) {
                        return (
                          <h1
                            className={`text-4xl font-bold ${montserrat_heading.variable} font-montserratHeading`}
                          >
                            {children}
                          </h1>
                        )
                      },
                      h2({ node, children }) {
                        return (
                          <h2
                            className={`text-3xl font-bold ${montserrat_heading.variable} font-montserratHeading`}
                          >
                            {children}
                          </h2>
                        )
                      },
                      h3({ node, children }) {
                        return (
                          <h3
                            className={`text-2xl font-bold ${montserrat_heading.variable} font-montserratHeading`}
                          >
                            {children}
                          </h3>
                        )
                      },
                      h4({ node, children }) {
                        return (
                          <h4
                            className={`text-lg font-bold ${montserrat_heading.variable} font-montserratHeading`}
                          >
                            {children}
                          </h4>
                        )
                      },
                      h5({ node, children }) {
                        return (
                          <h5
                            className={`text-base font-bold ${montserrat_heading.variable} font-montserratHeading`}
                          >
                            {children}
                          </h5>
                        )
                      },
                      h6({ node, children }) {
                        return (
                          <h6
                            className={`text-base font-bold ${montserrat_heading.variable} font-montserratHeading`}
                          >
                            {children}
                          </h6>
                        )
                      },
                      a({ node, className, children, ...props }) {
                        const { href, title } = props
                        // console.log("href:", href);
                        // console.log("title:", title);
                        // console.log("children:", children);
                        const isCitationLink = /^\d+$/.test(
                          children[0] as string,
                        )
                        if (isCitationLink) {
                          return (
                            <a
                              id="styledLink"
                              href={href}
                              target="_blank"
                              title={title}
                              rel="noopener noreferrer"
                              className={'supMarkdown'}
                            >
                              {children}
                            </a>
                          )
                        } else {
                          return (
                            <button
                              id="styledLink"
                              onClick={() => window.open(href, '_blank')}
                              title={title}
                              className={'linkMarkDown'}
                            >
                              {children}
                            </button>
                          )
                        }
                      },
                    }}
                  >
                    {`${message.content}${messageIsStreaming &&
                        messageIndex ==
                        (selectedConversation?.messages.length ?? 0) - 1
                        ? '`▍`'
                        : ''
                      }`}
                  </MemoizedReactMarkdown>
                  {/* {message.contexts && message.contexts.length > 0 && (
                    <Group variant="row" spacing="xs">
                      <ContextCards contexts={message.contexts} />
                    </Group>
                  )} */}
                </div>

                <div className="ml-1 flex flex-col items-center justify-end gap-4 md:-mr-8 md:ml-0 md:flex-row md:items-start md:justify-start md:gap-1">
                  {messagedCopied ? (
                    <IconCheck
                      size={20}
                      className="text-green-500 dark:text-green-400"
                    />
                  ) : (
                    <button
                      className="invisible text-gray-500 hover:text-gray-700 focus:visible group-hover:visible dark:text-gray-400 dark:hover:text-gray-300"
                      onClick={copyOnClick}
                    >
                      <IconCopy size={20} />
                    </button>
                  )}
                </div>
              </div>
            )}
            {/* {message.role === 'assistant' && <Timer timerVisible={timerVisible} />} */}
          </div>
        </div>
      </div>
    )
  },
)
ChatMessage.displayName = 'ChatMessage'
