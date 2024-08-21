import { ContextWithMetadata, Message } from '~/types/chat'
import { fetchPresignedUrl } from './apiUtils'

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
): Promise<string> {
  console.log('Chunk before replacement: ', content)
  if (lastMessage.contexts) {
    const citationPattern = /\[(\d+)(?:,\s*page:\s*(\d+))?\]/g
    let match
    while ((match = citationPattern.exec(content)) !== null) {
      const citationIndex = parseInt(match[1] as string, 10)
      const pageNumber = match[2] // This will be undefined if there is no page number.
      const context = lastMessage.contexts[citationIndex - 1]
      if (context) {
        const link = await getCitationLink(
          context,
          citationLinkCache,
          citationIndex,
        )
        const replacementText = pageNumber
          ? `[${citationIndex}](${link}#page=${pageNumber})`
          : `[${citationIndex}](${link})`
        content = content.replace(match[0], replacementText)
      }
    }

    // Extract filename indices
    const filenamePattern = /(\b\d+\.)\s*\[(.*?)\]\(#\)/g
    const filenameIndices = new Set<number>()
    while ((match = filenamePattern.exec(content)) !== null) {
      filenameIndices.add(parseInt(match[1] as string, 10))
    }

    // Replace filename indices with links
    for (const filenameIndex of filenameIndices) {
      const context = lastMessage.contexts[filenameIndex - 1]
      if (context) {
        const link = await getCitationLink(
          context,
          citationLinkCache,
          filenameIndex,
        )
        content = content.replace(
          new RegExp(`(\\b${filenameIndex}\\.)\\s*\\[(.*?)\\]\\(\\#\\)`, 'g'),
          (match, index, filename) => {
            const pageNumberMatch = filename.match(/page: (\d+)/)
            const pageNumber = pageNumberMatch
              ? `#page=${pageNumberMatch[1]}`
              : ''
            console.log('pageNumber: ', pageNumber)
            return `${index} [${index} ${filename}](${link}${pageNumber})`
          },
        )
      }
    }
  }
  return content
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
): Promise<string> => {
  console.log('getting link for citationIndex: ', citationIndex)
  const cachedLink = citationLinkCache.get(citationIndex)
  if (cachedLink) {
    return cachedLink
  } else {
    const link = (await generateCitationLink(context)) as string
    citationLinkCache.set(citationIndex, link)
    return link
  }
}

/**
 * Generates a citation link based on the context provided.
 * @param {ContextWithMetadata} context - The context containing citation information.
 * @returns {Promise<string>} A promise that resolves to the citation link.
 */
const generateCitationLink = async (
  context: ContextWithMetadata,
): Promise<string | null> => {
  if (context.url) {
    return context.url
  } else if (context.s3_path) {
    return fetchPresignedUrl(context.s3_path)
  }
  return ''
}
