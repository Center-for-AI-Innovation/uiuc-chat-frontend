import { Text, Paper, UnstyledButton, Image, Badge, Tooltip } from '@mantine/core'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { IconFileText, IconExternalLink, IconDownload, IconMarkdown, IconFileDescription } from '@tabler/icons-react'
import { fetchPresignedUrl } from '~/utils/apiUtils'
import { useState, useEffect } from 'react'

interface CitationCardProps {
  readable_filename: string
  course_name?: string
  s3_path?: string
  url?: string
  page_number?: string
  pagenumber?: string
  pagenumber_or_timestamp?: string
  index?: number
}

// Helper function to get the effective page number
const getEffectivePageNumber = (props: CitationCardProps): string => {
  // Priority order: page_number > pagenumber_or_timestamp > pagenumber
  if (props.page_number) return props.page_number;
  if (props.pagenumber_or_timestamp) return props.pagenumber_or_timestamp;
  if (props.pagenumber) return props.pagenumber;
  return '';
};

export const CitationCard = ({ readable_filename, course_name, s3_path, url, page_number, pagenumber, pagenumber_or_timestamp, index }: CitationCardProps) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [faviconError, setFaviconError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // Add helper function to determine file type
  const getFileType = () => {
    if (s3_path) {
      const lowerPath = s3_path.toLowerCase()
      if (lowerPath.endsWith('.pdf')) return 'pdf'
      if (lowerPath.endsWith('.md')) return 'md'
      if (lowerPath.endsWith('.rtf')) return 'rtf'
    }
    if (url) return 'web'
    return 'other'
  }

  useEffect(() => {
    let isMounted = true;
    const loadThumbnail = async () => {
      if (!isMounted) return;
      
      try {
        const fileType = getFileType()
        
        // For PDFs, get the thumbnail from S3
        if (fileType === 'pdf' && course_name) {
          const thumbnailPath = s3_path!.replace('.pdf', '-pg1-thumb.png')
          try {
            const presignedUrl = await fetchPresignedUrl(thumbnailPath, course_name)
            if (isMounted) {
              setThumbnailUrl(presignedUrl as string)
              setRetryCount(0)
            }
          } catch (e) {
            console.error('Failed to fetch presigned URL:', e)
            if (isMounted && retryCount < 3) {
              setTimeout(() => {
                setRetryCount(prev => prev + 1)
              }, 1000)
            }
          }
        }
        // For websites, try multiple favicon approaches
        else if (fileType === 'web') {
          try {
            const urlObj = new URL(url!)
            const faviconUrls = [
              `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`,
              `${urlObj.protocol}//${urlObj.hostname}/favicon.png`,
              `${urlObj.protocol}//${urlObj.hostname}/apple-touch-icon.png`,
              `${urlObj.protocol}//${urlObj.hostname}/apple-touch-icon-precomposed.png`
            ]
            
            for (const faviconUrl of faviconUrls) {
              if (!faviconError && isMounted) {
                setThumbnailUrl(faviconUrl)
                return
              }
            }
          } catch (e) {
            console.error('Failed to parse URL for favicon:', e)
            if (isMounted) {
              setThumbnailUrl(null)
            }
          }
        }
        // For .md and .rtf, we'll use null to trigger the icon display
        else if (fileType === 'md' || fileType === 'rtf') {
          setThumbnailUrl(null)
        }
      } catch (e) {
        console.error('Failed to load thumbnail:', e)
        if (isMounted) {
          setThumbnailUrl(null)
        }
      }
    }

    loadThumbnail()
    
    return () => {
      isMounted = false
    }
  }, [s3_path, url, course_name, faviconError, retryCount])

  const handleClick = async () => {
    // If it's a URL source, open in new tab
    if (url) {
      // If it's a PDF URL, handle page number
      if (url.toLowerCase().endsWith('.pdf')) {
        const effectivePageNumber = getEffectivePageNumber({ readable_filename, course_name, s3_path, url, page_number, pagenumber, pagenumber_or_timestamp });
        const pageParam = effectivePageNumber ? `#page=${effectivePageNumber}` : '';
        window.open(`${url}${pageParam}`, '_blank');
      } else {
        window.open(url, '_blank');
      }
      return;
    }
    
    // If it's an S3 document, handle based on file type
    if (s3_path && course_name) {
      const effectivePageNumber = getEffectivePageNumber({ readable_filename, course_name, s3_path, url, page_number, pagenumber, pagenumber_or_timestamp });
      const presignedUrl = await fetchPresignedUrl(s3_path, course_name);
      
      // For PDFs, open in new tab for inline viewing with page number if available
      if (s3_path.toLowerCase().endsWith('.pdf')) {
        // Ensure presignedUrl is a string and doesn't already have a hash
        const baseUrl = (presignedUrl as string).split('#')[0];
        // Add page parameter if available
        const pageParam = effectivePageNumber ? `#page=${effectivePageNumber}` : '';
        const finalUrl = `${baseUrl}${pageParam}`;
        window.open(finalUrl, '_blank');
      } else {
        // For other file types, trigger download
        const link = document.createElement('a');
        link.href = presignedUrl as string;
        
        // Get filename from s3_path if readable_filename doesn't include extension
        let downloadFilename = readable_filename;
        if (!readable_filename.includes('.')) {
          const s3Filename = s3_path.split('/').pop() || readable_filename;
          const extension = s3Filename.split('.').pop();
          if (extension) {
            downloadFilename = `${readable_filename}.${extension}`;
          }
        }
        
        link.download = downloadFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  }

  const isPDF = s3_path?.toLowerCase().endsWith('.pdf') || url?.toLowerCase().endsWith('.pdf')
  const isWebIcon = !!url && !url.toLowerCase().endsWith('.pdf')
  const effectivePageNumber = getEffectivePageNumber({ readable_filename, course_name, s3_path, url, page_number, pagenumber, pagenumber_or_timestamp });
  const hasPageNumber = effectivePageNumber && effectivePageNumber !== '' && effectivePageNumber !== '0'

  return (
    <UnstyledButton 
      onClick={handleClick}
      className="w-full transition-all duration-300 p-0.5 -m-0.5 rounded-md hover:opacity-100"
    >
      <Paper 
        className="flex flex-col bg-[#1E1F3A] text-white overflow-hidden shadow-md transition-all duration-300 ease-in-out
        border border-[#2e026d]
        hover:shadow-xl hover:shadow-purple-500/20 hover:translate-y-[-2px] hover:scale-[1.01]
        hover:border-[#9D4EDD]"
        radius="md"
        withBorder
      >
        <div className="flex flex-col h-full">
          {thumbnailUrl ? (
            <div className={`w-full flex ${isWebIcon ? 'justify-center bg-[#1a1b36] p-2' : 'h-24 overflow-hidden'}`}>
              <Image
                src={thumbnailUrl}
                alt={`Thumbnail for ${readable_filename}`}
                height={isWebIcon ? 48 : 'auto'}
                width={isWebIcon ? 48 : '100%'}
                className={`${isWebIcon ? 'object-contain' : 'w-full object-cover'}`}
                onError={(e) => {
                  console.log('Failed to load image from URL:', thumbnailUrl)
                  if (isWebIcon) {
                    setFaviconError(true)
                  }
                  setThumbnailUrl(null)
                }}
              />
            </div>
          ) : (
            <div className="w-full flex justify-center bg-[#1a1b36] p-2">
              <div className="text-[#9D4EDD] opacity-90 h-12 w-12 flex items-center justify-center">
                {getFileType() === 'md' ? (
                  <IconMarkdown size={32} />
                ) : getFileType() === 'rtf' ? (
                  <IconFileDescription size={32} />
                ) : (
                  <IconFileText size={32} />
                )}
              </div>
            </div>
          )}
          
          <div className="flex gap-3 p-3.5 flex-1">
            <div className="flex-1 min-w-0">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-start gap-2">
                  {index !== undefined && (
                    <Badge color="gray" variant="outline" radius="sm" size="xs" className="self-start">
                      {index + 1}
                    </Badge>
                  )}
                  <div className="flex-1">
                    <Text 
                      className={`text-sm font-semibold text-white ${montserrat_heading.variable} font-montserratHeading break-words leading-tight`} 
                      style={{ wordBreak: 'break-word' }}
                    >
                      {readable_filename}
                    </Text>
                  </div>
                  {isWebIcon || isPDF ? (
                    <IconExternalLink size={14} className="flex-shrink-0 text-[#9D4EDD]/70 mt-0.5" />
                  ) : (
                    <IconDownload size={14} className="flex-shrink-0 text-[#9D4EDD]/70 mt-0.5" />
                  )}
                </div>
                <div className="flex flex-col gap-0.5">
                  {isPDF && hasPageNumber && (
                    <Text 
                      className={`text-xs text-[#9D4EDD]/80 ${montserrat_paragraph.variable} font-montserratParagraph`}
                    >
                      Page {effectivePageNumber}
                    </Text>
                  )}
                  {course_name && (
                    <Text 
                      className={`text-xs text-gray-300/70 ${montserrat_paragraph.variable} font-montserratParagraph break-words`}
                      style={{ wordBreak: 'break-word' }}
                    >
                      {course_name}
                    </Text>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Paper>
    </UnstyledButton>
  )
} 


