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

  // Fast path - if no citations, skip the replacement
  if (!citationPattern.test(content)) {
    return safeText(content)
  }

  // Reset lastIndex after test()
  citationPattern.lastIndex = 0

  let result = content
  let offset = 0

  // Process citations
  let match
  while ((match = citationPattern.exec(result)) !== null) {
    const originalCitation = match[0]
    // Parse multiple citation indices
    const citationIndicesStr = match[1] as string
    const citationIndices = citationIndicesStr
      .split(',')
      .map((idx) => parseInt(idx.trim(), 10))
      .filter(
        (idx) => !isNaN(idx) && idx > 0 && idx <= lastMessage.contexts!.length,
      )

    // Skip if no valid citation indices
    if (citationIndices.length === 0) continue

    // Page number applies to all citations in this group
    const pageNumber = match[2] ? safeText(match[2]) : undefined

    // Process each citation index
    const citationLinks = await Promise.all(
      citationIndices.map(async (citationIndex) => {
        const context = lastMessage.contexts![citationIndex - 1]
        if (!context) return null

        // Get or create the citation link
        const link = await getCitationLink(
          context,
          citationLinkCache,
          citationIndex,
          courseName,
        )

        // Sanitize all text content and validate URL
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

    // Filter out null values
    const validCitations = citationLinks.filter(
      (citation) => citation !== null,
    ) as {
      index: number
      title: string
      pageNumber?: string
      link: string
    }[]

    if (validCitations.length === 0) continue

    let replacementText = ''

    if (validCitations.length === 1) {
      // Single citation case - no parentheses
      const citation = validCitations[0]!
      // Create inner text without parentheses
      const innerText = citation.pageNumber
        ? `${citation.title}, p.${citation.pageNumber}`
        : `${citation.title}`

      // Create tooltip with citation number
      const tooltipTitle = `Citation ${citation.index}`

      // Only create link if we have a valid safe URL
      const linkText = citation.link
        ? `[${innerText}](${citation.link}${citation.pageNumber ? `#page=${citation.pageNumber}` : ''} "${tooltipTitle}")`
        : innerText // Fallback to plain text if URL is invalid

      // No parentheses around the link
      replacementText = linkText
    } else {
      // Multiple citations case - no parentheses
      // Add each citation as a separate link, separated by semicolons with minimal space for better wrapping
      replacementText = validCitations
        .map((citation, idx) => {
          // For each citation, create the inner text without parentheses
          const innerText = citation.pageNumber
            ? `${citation.title}, p.${citation.pageNumber}`
            : `${citation.title}`

          // Create tooltip with citation number
          const tooltipTitle = `Citation ${citation.index}`

          // Only create link if we have a valid safe URL
          const linkText = citation.link
            ? `[${innerText}](${citation.link}${citation.pageNumber ? `#page=${citation.pageNumber}` : ''} "${tooltipTitle}")`
            : innerText // Fallback to plain text if URL is invalid

          // Add semicolon between citations except for the last one
          // Use minimal space after semicolon to allow natural line breaks without excess space
          return idx < validCitations.length - 1 ? `${linkText};` : linkText
        })
        .join(' ') // Join with a single space between citations
    }

    // Replace at exact position accounting for previous replacements
    result =
      result.slice(0, match.index + offset) +
      replacementText +
      result.slice(match.index + offset + originalCitation.length)

    // Adjust offset for future replacements
    offset += replacementText.length - originalCitation.length
  }

  // Fast path - if no filename patterns, return early
  const hasFilenamePattern = /\b\d+\s*\.\s*\[.*?\]\(#\)/.test(result)
  if (!hasFilenamePattern) {
    return safeText(result)
  }

  // Process filename patterns if present
  const filenamePattern = /(\b\d+\s*\.)\s*\[(.*?)\]\(#\)/g
  offset = 0

  while ((match = filenamePattern.exec(result)) !== null) {
    const originalText = match[0]
    const filenameIndex = parseInt(match[1] as string, 10)
    const context = lastMessage.contexts[filenameIndex - 1]

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
        pageNumber = pageNumberMatch ? safeText(pageNumberMatch[1]) : undefined
      }

      const displayTitle = safeText(
        context.readable_filename || `Document ${filenameIndex}`,
      )
      // Create inner text without parentheses for consistency
      const innerText = pageNumber
        ? `${displayTitle}, p.${pageNumber}`
        : `${displayTitle}`

      // Add citation number to tooltip
      const tooltipTitle = `Citation ${filenameIndex}`

      // Only create link if we have a valid safe URL
      const linkText = safeLink
        ? `[${innerText}](${safeLink}${pageNumber ? `#page=${pageNumber}` : ''} "${tooltipTitle}")`
        : innerText // Fallback to plain text if URL is invalid

      // Keep parentheses outside the link for consistency
      const replacementText = `${match[1]} (${linkText})`

      // Replace at exact position accounting for previous replacements
      result =
        result.slice(0, match.index + offset) +
        replacementText +
        result.slice(match.index + offset + originalText.length)

      // Adjust offset for future replacements
      offset += replacementText.length - originalText.length
    }
  }

  return safeText(result)
}

/**
 * Escapes special characters in a string to be used in a regular expression.
 * @param {string} string - The string to escape.
 * @returns {string} The escaped string.
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
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
