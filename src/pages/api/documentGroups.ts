// src/pages/api/documentGroups.ts
import { type NextApiRequest, type NextApiResponse } from 'next'
import posthog from 'posthog-js'
import { type CourseDocument } from 'src/types/courseMaterials'
import {
  addDocumentsToDocGroup,
  removeDocGroup,
  updateDocGroupStatus,
  fetchDocumentGroups,
  fetchEnabledDocGroups,
} from '~/utils/dbUtils'
import { addDocumentsToDocGroupQdrant } from '~/utils/qdrantUtils'

interface RequestBody {
  action:
    | 'addDocumentsToDocGroup'
    | 'appendDocGroup'
    | 'removeDocGroup'
    | 'getDocumentGroups'
    | 'updateDocGroupStatus'
    | 'fetchEnabledDocGroups'
  courseName: string
  doc?: CourseDocument
  docGroup?: string
  enabled?: boolean
  userId?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === 'POST') {
    const { action, userId, courseName, doc, docGroup, enabled } =
      req.body as RequestBody

    try {
      if (action === 'addDocumentsToDocGroup' && doc) {
        console.log('Adding documents to doc group:', doc)

        posthog.capture('add_doc_group', {
          distinct_id:
            req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          curr_user_id: userId,
          course_name: courseName,
          doc_readable_filename: doc.readable_filename,
          doc_unique_identifier:
            doc.url && doc.url !== ''
              ? doc.url
              : doc.s3_path && doc.s3_path !== ''
                ? doc.s3_path
                : null,
          doc_groups: doc.doc_groups,
        })

        const sqlResponse = await addDocumentsToDocGroup(courseName, doc)
        if (sqlResponse) {
          const qdrantResponse = await addDocumentsToDocGroupQdrant(
            courseName,
            doc,
          )
          if (qdrantResponse && qdrantResponse.status === 'completed') {
            res.status(200).json({ success: true })
          } else {
            // rollback the SQL operation
            await removeDocGroup(courseName, doc, docGroup as string)
            res.status(500).json({
              success: false,
              error: 'An error occurred during Qdrant update',
            })
          }
        } else {
          res.status(500).json({
            success: false,
            error: 'An error occurred during database update',
          })
        }
      } else if (action === 'appendDocGroup' && doc && docGroup) {
        console.log('Appending doc group:', docGroup, 'to doc:', doc)

        posthog.capture('append_doc_group', {
          distinct_id:
            req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          curr_user_id: userId,
          course_name: courseName,
          doc_readable_filename: doc.readable_filename,
          doc_unique_identifier:
            doc.url && doc.url !== ''
              ? doc.url
              : doc.s3_path && doc.s3_path !== ''
                ? doc.s3_path
                : null,
          doc_groups: doc.doc_groups,
          doc_group: docGroup,
        })

        if (!doc.doc_groups) {
          doc.doc_groups = []
        }
        if (!doc.doc_groups.includes(docGroup)) {
          doc.doc_groups.push(docGroup)
        }

        const sqlResponse = await addDocumentsToDocGroup(courseName, doc)
        if (sqlResponse) {
          const qdrantResponse = await addDocumentsToDocGroupQdrant(
            courseName,
            doc,
          )
          if (qdrantResponse && qdrantResponse.status === 'completed') {
            res.status(200).json({ success: true })
          } else {
            // rollback the SQL operation
            await removeDocGroup(courseName, doc, docGroup as string)
            res.status(500).json({
              success: false,
              error:
                'An error occurred during Qdrant update, rolled back SQL changes',
            })
          }
        } else {
          res.status(500).json({
            success: false,
            error: 'An error occurred during SQL database update',
          })
        }
      } else if (action === 'removeDocGroup' && doc && docGroup) {
        console.log('Removing doc group: ', docGroup, 'from doc: ', doc)

        posthog.capture('remove_doc_group', {
          distinct_id:
            req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          curr_user_id: userId,
          course_name: courseName,
          doc_readable_filename: doc.readable_filename,
          doc_unique_identifier:
            doc.url && doc.url !== ''
              ? doc.url
              : doc.s3_path && doc.s3_path !== ''
                ? doc.s3_path
                : null,
          doc_groups: doc.doc_groups,
          doc_group: docGroup,
        })

        await removeDocGroup(courseName, doc, docGroup)
        const qdrantResponse = await addDocumentsToDocGroupQdrant(courseName, doc)
        if (qdrantResponse && qdrantResponse.status === 'completed') {
          res.status(200).json({ success: true })
        } else {
          res.status(500).json({
            success: false,
            error: 'An error occurred during Qdrant update',
          })
        }
      } else if (action === 'getDocumentGroups') {
        const documentGroups = await fetchDocumentGroups(courseName)
        res.status(200).json({ documentGroups })
      } else if (action === 'updateDocGroupStatus' && docGroup && enabled !== undefined) {
        await updateDocGroupStatus(courseName, docGroup, enabled)
        res.status(200).json({ success: true })
      } else if (action === 'fetchEnabledDocGroups') {
        const enabledDocGroups = await fetchEnabledDocGroups(courseName)
        res.status(200).json({ enabledDocGroups })
      } else {
        res.status(400).json({ error: 'Invalid action or missing parameters' })
      }
    } catch (error) {
      console.error('Error in documentGroups handler:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
