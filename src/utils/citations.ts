import { ContextWithMetadata, Message } from '~/types/chat'
import { fetchPresignedUrl } from './apiUtils'
import sanitizeHtml, { IOptions } from 'sanitize-html'

// Strict sanitization options for text content
const SANITIZE_OPTIONS: IOptions = {
  allowedTags: [], // No HTML tags allowed
  allowedAttributes: {}, // No attributes allowed
  disallowedTagsMode: 'recursiveEscape' as const
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
    return safeText(content);
  }

  // Process citations first - this is the most common case
  const citationPattern = /[ \t]*(?:&lt;cite|<cite)[ \t]*>[ \t]*(\d+)(?:[ \t]*,[ \t]*p\.[ \t]*(\d+))?[ \t]*(?:&lt;\/cite|<\/cite)[ \t]*>/g;
  
  // Fast path - if no citations, skip the replacement
  if (!citationPattern.test(content)) {
    return safeText(content);
  }
  
  // Reset lastIndex after test()
  citationPattern.lastIndex = 0;
  
  let result = content;
  let offset = 0;

  // Process citations
  let match;
  while ((match = citationPattern.exec(result)) !== null) {
    const originalCitation = match[0];
    const citationIndex = parseInt(match[1] as string, 10);
    const context = lastMessage.contexts[citationIndex - 1];
    
    if (context) {
      // Get or create the citation link
      const link = await getCitationLink(
        context,
        citationLinkCache,
        citationIndex,
        courseName,
      );
      
      // Sanitize all text content and validate URL
      const safeLink = safeUrl(link);
      const displayTitle = safeText(context.readable_filename || `Document ${citationIndex}`);
      const pageNumber = context.pagenumber ? safeText(context.pagenumber.toString()) : safeText(match[2] || '');
      
      const sourceRef = pageNumber
        ? `${citationIndex}, p.${pageNumber}`
        : `${citationIndex}`;
      
      // Only create link if we have a valid safe URL
      const replacementText = safeLink 
        ? `[${displayTitle} (${sourceRef})](${safeLink}${pageNumber ? `#page=${pageNumber}` : ''})`
        : `${displayTitle} (${sourceRef})`; // Fallback to plain text if URL is invalid
      
      // Replace at exact position accounting for previous replacements
      result = 
        result.slice(0, match.index + offset) + 
        replacementText + 
        result.slice(match.index + offset + originalCitation.length);
      
      // Adjust offset for future replacements
      offset += replacementText.length - originalCitation.length;
    }
  }

  // Fast path - if no filename patterns, return early
  const hasFilenamePattern = /\b\d+\s*\.\s*\[.*?\]\(#\)/.test(result);
  if (!hasFilenamePattern) {
    return safeText(result);
  }

  // Process filename patterns if present
  const filenamePattern = /(\b\d+\s*\.)\s*\[(.*?)\]\(#\)/g;
  offset = 0;

  while ((match = filenamePattern.exec(result)) !== null) {
    const originalText = match[0];
    const filenameIndex = parseInt(match[1] as string, 10);
    const context = lastMessage.contexts[filenameIndex - 1];
    
    if (context) {
      const link = await getCitationLink(
        context,
        citationLinkCache,
        filenameIndex,
        courseName,
      );
      
      // Sanitize all text content and validate URL
      const safeLink = safeUrl(link);
      const filename = safeText(match[2] || '');
      let pageNumber = context.pagenumber ? safeText(context.pagenumber.toString()) : undefined;
      
      if (!pageNumber) {
        const pageNumberMatch = filename.match(/page:\s*(\d+)/);
        pageNumber = pageNumberMatch ? safeText(pageNumberMatch[1]) : undefined;
      }
      
      const displayTitle = safeText(context.readable_filename || `Document ${filenameIndex}`);
      const sourceRef = pageNumber
        ? `${filenameIndex}, p.${pageNumber}`
        : `${filenameIndex}`;
      
      // Only create link if we have a valid safe URL
      const replacementText = safeLink
        ? `${match[1]} [${displayTitle} (${sourceRef})](${safeLink}${pageNumber ? `#page=${pageNumber}` : ''})`
        : `${match[1]} ${displayTitle} (${sourceRef})`; // Fallback to plain text if URL is invalid
      
      // Replace at exact position accounting for previous replacements
      result = 
        result.slice(0, match.index + offset) + 
        replacementText + 
        result.slice(match.index + offset + originalText.length);
      
      // Adjust offset for future replacements
      offset += replacementText.length - originalText.length;
    }
  }

  return safeText(result);
}

/**
 * Processes a text chunk using a state machine to identify and replace citations or filenames with links.
 * Uses a more robust approach to handle partial tags and page numbers.
 */
export async function processChunkWithStateMachine(
  chunk: string,
  lastMessage: Message,
  stateMachineContext: { state: State; buffer: string },
  citationLinkCache: Map<number, string>,
  courseName: string
): Promise<string> {
  // Append this chunk to our leftover buffer
  stateMachineContext.buffer += chunk;
  let output = '';

  // Find complete <cite>...</cite> patterns, including multiple angle brackets and whitespace
  const fullCitationRegex = /[ \t]*(?:&lt;cite|<cite)[ \t]*>[ \t]*\d+(?:[ \t]*,[ \t]*p\.[ \t]*\d+)?[ \t]*(?:&lt;\/cite|<\/cite)[ \t]*>/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = fullCitationRegex.exec(stateMachineContext.buffer)) !== null) {
    // Add any text before this citation
    output += stateMachineContext.buffer.slice(lastIndex, match.index);
    
    // Process the complete citation tag
    const citationTag = match[0];
    const replaced = await replaceCitationLinks(
      citationTag,
      lastMessage,
      citationLinkCache,
      courseName
    );
    output += replaced;
    lastIndex = fullCitationRegex.lastIndex;
  }

  // Check the remaining text for potential partial tags
  const leftover = stateMachineContext.buffer.slice(lastIndex);
  
  // Look for the last potential start of a citation
  const lastCiteStart = Math.max(
    leftover.lastIndexOf('<cite'),
    leftover.lastIndexOf('&lt;cite'),
    leftover.lastIndexOf('<<cite'),
    leftover.lastIndexOf('&lt;&lt;cite')
  );
  
  if (lastCiteStart !== -1) {
    // If there's a potential partial citation at the end
    const potentialPartial = leftover.slice(lastCiteStart);
    // Check if it's a complete citation
    if (!potentialPartial.includes('</cite>') && !potentialPartial.includes('&lt;/cite&gt;')) {
      // Keep the potential partial citation in buffer
      output += leftover.slice(0, lastCiteStart);
      stateMachineContext.buffer = potentialPartial;
    } else {
      // Complete citation or not a citation, output everything
      output += leftover;
      stateMachineContext.buffer = '';
    }
  } else {
    // No potential partial citations, output everything
    output += leftover;
    stateMachineContext.buffer = '';
  }

  return output;
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
  courseName: string
): Promise<string> => {
  if (context.url) {
    return safeUrl(context.url)
  } else if (context.s3_path) {
    const presignedUrl = await fetchPresignedUrl(context.s3_path, courseName)
    return safeUrl(presignedUrl || '') // Handle null case by providing empty string fallback
  }
  return ''
}
