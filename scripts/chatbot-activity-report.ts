import 'dotenv/config'
import { writeFileSync } from 'fs'
import { join } from 'path'
import { sql } from 'drizzle-orm'
import { db } from '../src/db/dbClient'
import { ensureRedisConnected } from '../src/utils/redisClient'
import type { CourseMetadata } from '../src/types/courseMetadata'

interface ChatbotActivity {
  chatbot_name: string | null
  created_at: string | Date | null
  last_modified_at: string | Date | null
  last_used_at: string | Date | null
}

interface ChatbotReportRow extends ChatbotActivity {
  owner_email: string | null
  admin_emails: string[] | null
}

/**
 * Generates a chatbot activity report with owner emails from Redis
 */
async function generateChatbotActivityReport() {
  try {
    console.log('Starting chatbot activity report generation...\n')

    // Query Postgres for chatbot activity
    console.log('Querying Postgres for chatbot activity...')
    const activityQuery = sql`
      WITH convo_activity AS (
        SELECT
          c.project_name,
          MAX(COALESCE(m.created_at, c.updated_at, c.created_at)) AS last_used_at,
          MAX(COALESCE(c.updated_at, c.created_at)) AS last_modified_from_convo
        FROM public.conversations c
        LEFT JOIN public.messages m ON m.conversation_id = c.id
        GROUP BY c.project_name
      )
      SELECT
        p.course_name AS chatbot_name,
        p.created_at AS created_at,
        ca.last_modified_from_convo AS last_modified_at,
        ca.last_used_at AS last_used_at
      FROM public.projects p
      LEFT JOIN convo_activity ca ON ca.project_name = p.course_name
      ORDER BY ca.last_used_at DESC NULLS LAST, chatbot_name;
    `

    const activityResults = await db.execute(activityQuery)
    const chatbotActivities: ChatbotActivity[] = Array.isArray(activityResults)
      ? (activityResults as unknown as ChatbotActivity[])
      : []

    console.log(`Found ${chatbotActivities.length} chatbots in database\n`)

    // Get course metadata from Redis
    console.log('Fetching course metadata from Redis...')
    const redisClient = await ensureRedisConnected()
    const courseMetadatasRaw = await redisClient.hGetAll('course_metadatas')

    // Parse course metadata
    const courseMetadatas: Map<string, CourseMetadata> = new Map()
    for (const [courseName, metadataJson] of Object.entries(
      courseMetadatasRaw,
    )) {
      try {
        const metadata = JSON.parse(metadataJson) as CourseMetadata
        courseMetadatas.set(courseName, metadata)
      } catch (error) {
        console.warn(`Failed to parse metadata for ${courseName}:`, error)
      }
    }

    console.log(
      `Found ${courseMetadatas.size} course metadata entries in Redis\n`,
    )

    // Combine activity data with owner emails
    const reportRows: ChatbotReportRow[] = chatbotActivities.map((activity) => {
      const metadata = activity.chatbot_name
        ? courseMetadatas.get(activity.chatbot_name)
        : null

      return {
        ...activity,
        owner_email: metadata?.course_owner || null,
        admin_emails: metadata?.course_admins || null,
      }
    })

    // Generate summary
    console.log(`\nTotal chatbots: ${reportRows.length}`)
    console.log(
      `Chatbots with owner emails: ${reportRows.filter((r) => r.owner_email).length}`,
    )

    // Generate CSV output
    const csvLines: string[] = []
    csvLines.push(
      'Chatbot Name,Created At,Last Modified,Last Used,Owner Email,Admin Emails',
    )

    for (const row of reportRows) {
      const chatbotName = (row.chatbot_name || 'N/A').replace(/,/g, ';')
      const createdAt: string = row.created_at
        ? new Date(row.created_at).toISOString()
        : 'N/A'
      const lastModified: string = row.last_modified_at
        ? new Date(row.last_modified_at).toISOString()
        : 'N/A'
      const lastUsed: string = row.last_used_at
        ? new Date(row.last_used_at).toISOString()
        : 'N/A'
      const ownerEmail = row.owner_email || 'N/A'
      const adminEmails = row.admin_emails?.join(';') || 'N/A'

      csvLines.push(
        `${chatbotName},${createdAt},${lastModified},${lastUsed},${ownerEmail},${adminEmails}`,
      )
    }

    // Write CSV to file
    const csvContent = csvLines.join('\n')
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .split('T')[0]
    const csvFileName = `chatbot-activity-report-${timestamp}.csv`
    const csvFilePath = join(process.cwd(), csvFileName)

    writeFileSync(csvFilePath, csvContent, 'utf-8')
    console.log(`\n\nCSV file saved to: ${csvFilePath}`)

    // Disconnect Redis
    await redisClient.disconnect()
    console.log('\n\nReport generation completed successfully!')
  } catch (error) {
    console.error('Error generating chatbot activity report:', error)
    process.exit(1)
  }
}

// Run the script
generateChatbotActivityReport()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
