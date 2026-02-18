import { type ContextWithMetadata, type Message } from '~/types/chat'
import { fetchPresignedUrl } from './apiUtils'
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
  /** Optional server-side presigned URL generator (bypasses API auth) */
  serverPresignedUrlFn?: (
    filePath: string,
    courseName: string,
  ) => Promise<string | null>,
): Promise<string> {
  const contexts = lastMessage.contexts
  if (!contexts) {
    console.log(
      '[Citations] No contexts on message, returning sanitized content:',
      content.substring(0, 100),
    )
    return safeText(content)
  }

  // Updated pattern to match multiple citation indices separated by commas
  // Using bounded whitespace AND newlines to handle multi-line citations
  const citationPattern =
    /(?:&lt;cite|<cite)[\s]{0,100}>([0-9,\s]+)(?:[\s]{0,100},[\s]{0,100}p\.[\s]{0,100}(\d+))?[\s]{0,100}(?:&lt;\/cite&gt;|<\/cite>)/g

  const filenamePattern = /(\b\d+\s*\.)\s*\[(.*?)\]\(#\)/g

  const hasCitePattern = citationPattern.test(content)
  citationPattern.lastIndex = 0
  const hasFilenamePattern = filenamePattern.test(content)
  filenamePattern.lastIndex = 0

  if (!hasCitePattern && !hasFilenamePattern) {
    console.log(
      '[Citations] Pattern did not match. Content:',
      content,
      'Contexts count:',
      contexts.length,
    )
    return safeText(content)
  }

  let result = content

  if (hasCitePattern) {
    const matches = Array.from(result.matchAll(citationPattern))
    citationPattern.lastIndex = 0

    let cursor = 0
    let next = ''

    for (const match of matches) {
      const matchIndex = match.index ?? 0
      next += result.slice(cursor, matchIndex)

      const citationIndicesStr = match[1] as string
      const citationIndices = citationIndicesStr
        .split(',')
        .map((idx) => parseInt(idx.trim(), 10))
        .filter(
          (idx) => Number.isFinite(idx) && idx > 0 && idx <= contexts.length,
        )

      if (citationIndices.length === 0) {
        next += match[0]
        cursor = matchIndex + match[0].length
        continue
      }

      const pageNumber = match[2] ? safeText(match[2]) : undefined

      const citationLinks = await Promise.all(
        citationIndices.map(async (citationIndex) => {
          const context = contexts[citationIndex - 1]
          if (!context) return null

          const link = await getCitationLink(
            context,
            citationLinkCache,
            citationIndex,
            courseName,
            serverPresignedUrlFn,
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

      if (validCitations.length === 0) {
        next += match[0]
        cursor = matchIndex + match[0].length
        continue
      }

      const replacementText =
        validCitations.length === 1
          ? (() => {
              const citation = validCitations[0]!
              const innerText = citation.pageNumber
                ? `${citation.title}, p.${citation.pageNumber}`
                : `${citation.title}`
              const tooltipTitle = `Citation ${citation.index}`
              return citation.link
                ? `[${innerText}](${citation.link}${citation.pageNumber ? `#page=${citation.pageNumber}` : ''} "${tooltipTitle}")`
                : innerText
            })()
          : validCitations
              .map((citation, idx) => {
                const innerText = citation.pageNumber
                  ? `${citation.title}, p.${citation.pageNumber}`
                  : `${citation.title}`
                const tooltipTitle = `Citation ${citation.index}`
                const linkText = citation.link
                  ? `[${innerText}](${citation.link}${citation.pageNumber ? `#page=${citation.pageNumber}` : ''} "${tooltipTitle}")`
                  : innerText
                return idx < validCitations.length - 1
                  ? `${linkText};`
                  : linkText
              })
              .join(' ')

      next += replacementText
      cursor = matchIndex + match[0].length
    }

    next += result.slice(cursor)
    result = next
  }

  // Filename-style citations (e.g. `1. [Doc](#)`) can appear with or without cite tags.
  if (hasFilenamePattern) {
    const matches = Array.from(result.matchAll(filenamePattern))
    filenamePattern.lastIndex = 0

    let cursor = 0
    let next = ''

    for (const match of matches) {
      const matchIndex = match.index ?? 0
      next += result.slice(cursor, matchIndex)

      const filenameIndex = parseInt((match[1] as string) || '', 10)
      const context = contexts[filenameIndex - 1]

      if (!context) {
        next += match[0]
        cursor = matchIndex + match[0].length
        continue
      }

      const link = await getCitationLink(
        context,
        citationLinkCache,
        filenameIndex,
        courseName,
        serverPresignedUrlFn,
      )

      const safeLink = safeUrl(link)
      const filename = safeText(match[2] || '')
      let pageNumber = context.pagenumber
        ? safeText(context.pagenumber.toString())
        : undefined

      if (!pageNumber) {
        const pageNumberMatch = filename.match(/page:\s*(\d+)/)
        pageNumber = pageNumberMatch ? safeText(pageNumberMatch[1]) : undefined
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
        : innerText

      next += `${match[1]} (${linkText})`
      cursor = matchIndex + match[0].length
    }

    next += result.slice(cursor)
    result = next
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
  serverPresignedUrlFn?: (
    filePath: string,
    courseName: string,
  ) => Promise<string | null>,
): Promise<string> => {
  const cachedLink = citationLinkCache.get(citationIndex)
  if (cachedLink) {
    return safeUrl(cachedLink) // Validate cached URLs too
  } else {
    const link = (await generateCitationLink(
      context,
      courseName,
      serverPresignedUrlFn,
    )) as string
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
 * @param {string} courseName - The course name.
 * @param {Function} serverPresignedUrlFn - Optional server-side presigned URL generator.
 * @returns {Promise<string>} A promise that resolves to the citation link.
 */
const generateCitationLink = async (
  context: ContextWithMetadata,
  courseName: string,
  serverPresignedUrlFn?: (
    filePath: string,
    courseName: string,
  ) => Promise<string | null>,
): Promise<string> => {
  if (context.url) {
    return safeUrl(context.url)
  } else if (context.s3_path) {
    // Use server-side function if provided (avoids API auth requirement)
    const presignedUrl = serverPresignedUrlFn
      ? await serverPresignedUrlFn(context.s3_path, courseName)
      : await fetchPresignedUrl(context.s3_path, courseName)
    return safeUrl(presignedUrl || '') // Handle null case by providing empty string fallback
  }
  return ''
}
