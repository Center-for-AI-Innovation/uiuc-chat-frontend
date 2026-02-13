import { type ContextWithMetadata, type Message } from '~/types/chat'
import { fetchPresignedUrl } from '@/hooks/__internal__/downloadPresignedUrl'
import sanitizeHtml, { type IOptions } from 'sanitize-html'

// Strict sanitization options for text content
const SANITIZE_OPTIONS: IOptions = {
  allowedTags: [], // No HTML tags allowed
  allowedAttributes: {}, // No attributes allowed
  disallowedTagsMode: 'recursiveEscape' as const,
}

// URL validation regex for http/https only
const SAFE_URL_PATTERN = /^https?:\/\/[^\s/$.?#].[^\s]*$/i

/**
 * Validates and sanitizes a URL to prevent XSS via malicious URLs
 * @param {string} url - The URL to validate
 * @returns {string} The sanitized URL or empty string if invalid
 */
function safeUrl(url: string): string {
  try {
    if (!url) return ''
    const parsed = new URL(url)
    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return ''
    }
    // Validate against safe URL pattern
    if (!SAFE_URL_PATTERN.test(url)) {
      return ''
    }
    return url
  } catch {
    return ''
  }
}

/**
 * Sanitizes text content to prevent XSS
 * @param {string} text - The text to sanitize
 * @returns {string} The sanitized text
 */
function safeText(text: string | undefined | null): string {
  return sanitizeHtml(text || '', SANITIZE_OPTIONS)
}

/**
 * Enum representing the possible states of the state machine used in processing text chunks.
 */
export enum State {
  Normal,
  InCiteTag,
  InCiteContent,
  InFilename,
  InFilenameLink,
  PossibleFilename,
  AfterDigitPeriod,
  AfterDigitPeriodSpace,
}

/**
 * Replaces citation indices in the content with actual links.
 * @param {string} content - The content containing citation indices.
 * @param {Message} lastMessage - The last message in the conversation, used for context.
 * @param {Map<number, string>} citationLinkCache - Cache for storing and reusing citation links.
 * @returns {Promise<string>} The content with citation indices replaced by links.
 */
export async function replaceCitationLinks(
  content: string,
  lastMessage: Message,
  citationLinkCache: Map<number, string>,
  courseName: string,
): Promise<string> {
  if (!lastMessage.contexts) {
    return safeText(content)
  }

  // Process citations first - this is the most common case
  // Updated pattern to match multiple citation indices separated by commas
  // Using bounded whitespace to prevent catastrophic backtracking
  // Removed extra whitespace from the pattern to prevent capturing it
  const citationPattern =
    /(?:&lt;cite|<cite)[ \t]{0,100}>([0-9,\s]+)(?:[ \t]{0,100},[ \t]{0,100}p\.[ \t]{0,100}(\d+))?[ \t]{0,100}(?:&lt;\/cite&gt;|<\/cite>)/g

  const hasCitations = citationPattern.test(content)
  // Reset lastIndex after test()
  citationPattern.lastIndex = 0

  // Filename-style citations are another common pattern to support.
  const hasFilenamePattern = /\b\d+\s*\.\s*\[.*?\]\(#\)/.test(content)

  // Fast path - if no citations and no filename patterns, return early
  if (!hasCitations && !hasFilenamePattern) {
    return safeText(content)
  }

  let result = content
  if (hasCitations) {
    const source = result
    const parts: string[] = []
    let cursor = 0
    let match: RegExpExecArray | null

    citationPattern.lastIndex = 0
    while ((match = citationPattern.exec(source)) !== null) {
      const originalCitation = match[0]
      const matchIndex = match.index
      parts.push(source.slice(cursor, matchIndex))

      // Parse multiple citation indices
      const citationIndicesStr = match[1] as string
      const citationIndices = citationIndicesStr
        .split(',')
        .map((idx) => parseInt(idx.trim(), 10))
        .filter(
          (idx) =>
            !isNaN(idx) && idx > 0 && idx <= lastMessage.contexts!.length,
        )

      // Default to leaving the original markup if we can't resolve it.
      let replacementText = originalCitation

      if (citationIndices.length > 0) {
        // Page number applies to all citations in this group
        const pageNumber = match[2] ? safeText(match[2]) : undefined

        // Process each citation index
        const citationLinks = await Promise.all(
          citationIndices.map(async (citationIndex) => {
            const context = lastMessage.contexts![citationIndex - 1]
            if (!context) return null

            const link = await getCitationLink(
              context,
              citationLinkCache,
              citationIndex,
              courseName,
            )

            const safeLink = safeUrl(link)
            const displayTitle = safeText(
              context.readable_filename || `Document ${citationIndex}`,
            )
            const contextPageNumber = context.pagenumber
              ? safeText(context.pagenumber.toString())
              : pageNumber

            return {
              index: citationIndex,
              title: displayTitle,
              pageNumber: contextPageNumber,
              link: safeLink,
            }
          }),
        )

        const validCitations = citationLinks.filter(
          (citation) => citation !== null,
        ) as {
          index: number
          title: string
          pageNumber?: string
          link: string
        }[]

        if (validCitations.length === 1) {
          const citation = validCitations[0]!
          const innerText = citation.pageNumber
            ? `${citation.title}, p.${citation.pageNumber}`
            : `${citation.title}`
          const tooltipTitle = `Citation ${citation.index}`

          replacementText = citation.link
            ? `[${innerText}](${citation.link}${citation.pageNumber ? `#page=${citation.pageNumber}` : ''} "${tooltipTitle}")`
            : innerText
        } else if (validCitations.length > 1) {
          replacementText = validCitations
            .map((citation, idx) => {
              const innerText = citation.pageNumber
                ? `${citation.title}, p.${citation.pageNumber}`
                : `${citation.title}`
              const tooltipTitle = `Citation ${citation.index}`
              const linkText = citation.link
                ? `[${innerText}](${citation.link}${citation.pageNumber ? `#page=${citation.pageNumber}` : ''} "${tooltipTitle}")`
                : innerText
              return idx < validCitations.length - 1 ? `${linkText};` : linkText
            })
            .join(' ')
        }
      }

      parts.push(replacementText)
      cursor = matchIndex + originalCitation.length
    }

    parts.push(source.slice(cursor))
    result = parts.join('')
  }

  // Fast path - if no filename patterns, return early
  if (!hasFilenamePattern) {
    return safeText(result)
  }

  // Process filename patterns if present
  const filenamePattern = /(\b\d+\s*\.)\s*\[(.*?)\]\(#\)/g
  {
    const source = result
    const parts: string[] = []
    let cursor = 0
    let match: RegExpExecArray | null

    filenamePattern.lastIndex = 0
    while ((match = filenamePattern.exec(source)) !== null) {
      const originalText = match[0]
      const matchIndex = match.index
      parts.push(source.slice(cursor, matchIndex))

      const filenameIndex = parseInt(match[1] as string, 10)
      const context = lastMessage.contexts[filenameIndex - 1]

      let replacementText = originalText
      if (context) {
        const link = await getCitationLink(
          context,
          citationLinkCache,
          filenameIndex,
          courseName,
        )

        // Sanitize all text content and validate URL
        const safeLink = safeUrl(link)
        const filename = safeText(match[2] || '')
        let pageNumber = context.pagenumber
          ? safeText(context.pagenumber.toString())
          : undefined

        if (!pageNumber) {
          const pageNumberMatch = filename.match(/page:\s*(\d+)/)
          pageNumber = pageNumberMatch
            ? safeText(pageNumberMatch[1])
            : undefined
        }

        const displayTitle = safeText(
          context.readable_filename || `Document ${filenameIndex}`,
        )
        const innerText = pageNumber
          ? `${displayTitle}, p.${pageNumber}`
          : `${displayTitle}`

        const tooltipTitle = `Citation ${filenameIndex}`

        const linkText = safeLink
          ? `[${innerText}](${safeLink}${pageNumber ? `#page=${pageNumber}` : ''} "${tooltipTitle}")`
          : innerText // Fallback to plain text if URL is invalid

        // Keep parentheses outside the link for consistency
        replacementText = `${match[1]} (${linkText})`
      }

      parts.push(replacementText)
      cursor = matchIndex + originalText.length
    }

    parts.push(source.slice(cursor))
    result = parts.join('')
  }

  return safeText(result)
}

/**
 * Retrieves or generates a citation link, using a cache to store and reuse links.
 * @param {ContextWithMetadata} context - The context containing citation information.
 * @param {Map<number, string>} citationLinkCache - The cache for storing citation links.
 * @param {number} citationIndex - The index of the citation.
 * @returns {Promise<string>} A promise that resolves to the citation link.
 */
const getCitationLink = async (
  context: ContextWithMetadata,
  citationLinkCache: Map<number, string>,
  citationIndex: number,
  courseName: string,
): Promise<string> => {
  const cachedLink = citationLinkCache.get(citationIndex)
  if (cachedLink) {
    return safeUrl(cachedLink) // Validate cached URLs too
  } else {
    const link = (await generateCitationLink(context, courseName)) as string
    const safeLink = safeUrl(link)
    if (safeLink) {
      citationLinkCache.set(citationIndex, safeLink)
    }
    return safeLink
  }
}

/**
 * Generates a citation link based on the context provided.
 * @param {ContextWithMetadata} context - The context containing citation information.
 * @returns {Promise<string>} A promise that resolves to the citation link.
 */
const generateCitationLink = async (
  context: ContextWithMetadata,
  courseName: string,
): Promise<string> => {
  if (context.url) {
    return safeUrl(context.url)
  } else if (context.s3_path) {
    const presignedUrl = await fetchPresignedUrl(context.s3_path, courseName)
    return safeUrl(presignedUrl || '') // Handle null case by providing empty string fallback
  }
  return ''
}
