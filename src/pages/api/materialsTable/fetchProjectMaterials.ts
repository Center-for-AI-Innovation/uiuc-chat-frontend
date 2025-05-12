import { db } from '~/db/dbClient'
import posthog from 'posthog-js'
import { NextApiRequest, NextApiResponse } from 'next'
import { CourseDocument } from '~/types/courseMaterials'
import { and, eq, like, asc, desc, sql } from 'drizzle-orm'
import { documents, documentsDocGroups, docGroups } from '~/db/schema'
import { PgColumn } from 'drizzle-orm/pg-core'

type FetchDocumentsResponse = {
  final_docs?: CourseDocument[]
  total_count?: number
  error?: string
}

/**
 * API handler to delete an API key for a user.
 *
 * @param {NextApiRequest} req - The incoming HTTP request.
 * @param {NextApiResponse} res - The outgoing HTTP response.
 * @returns A JSON response indicating the result of the delete operation.
 */
export default async function fetchDocuments(
  req: NextApiRequest,
  res: NextApiResponse<FetchDocumentsResponse>,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const {
    from: fromStr,
    to: toStr,
    course_name,
    filter_key: search_key,
    filter_value: search_value,
    sort_column: rawSortColumn,
    sort_direction,
  } = req.query

  let sort_column = rawSortColumn as string
  let sort_dir = sort_direction === 'asc' // Convert 'asc' to true, 'desc' to false

  if (typeof fromStr !== 'string' || typeof toStr !== 'string') {
    return res
      .status(400)
      .json({ error: 'Missing required query parameters: from and to' })
  }

  if (sort_column == null || sort_dir == null) {
    sort_column = 'created_at'
    sort_dir = false // 'desc' equivalent
  }

  const from = parseInt(fromStr)
  const to = parseInt(toStr)

  try {
    let foundDocs: any[] = [];
    let finalError = null;

    // Helper function to get the sort column
    const getSortColumn = () => {
      if (typeof sort_column === 'string' && sort_column in documents) {
        return documents[sort_column as keyof typeof documents] as PgColumn<any>;
      }
      return documents.id;
    };

    const baseQuery = {
      id: documents.id,
      course_name: documents.course_name,
      readable_filename: documents.readable_filename,
      s3_path: documents.s3_path,
      url: documents.url,
      created_at: documents.created_at,
      doc_groups: sql<string[]>`array_remove(array_agg(${docGroups.name}), null)`
    };

    if (search_key && search_value && typeof search_key === 'string' && search_key in documents) {
      const searchColumn = documents[search_key as keyof typeof documents] as PgColumn<any>;

      try{
        foundDocs = await db.select(baseQuery)
        .from(documents)
        .leftJoin(documentsDocGroups, eq(documents.id, documentsDocGroups.document_id))
        .leftJoin(docGroups, eq(documentsDocGroups.doc_group_id, docGroups.id))
        .where(and(
          eq(documents.course_name, course_name as string),
          sql`${searchColumn} ILIKE ${`%${search_value}%`}`
        ))
        .groupBy(documents.id)
        .orderBy(sort_dir === true ? asc(getSortColumn()) : desc(getSortColumn()))
        .limit(to - from + 1)
        .offset(from);
      } catch (error) {
        finalError = error;
      }
      
    } else {
      try{
        foundDocs = await db.select(baseQuery)
        .from(documents)
        .leftJoin(documentsDocGroups, eq(documents.id, documentsDocGroups.document_id))
        .leftJoin(docGroups, eq(documentsDocGroups.doc_group_id, docGroups.id))
        .where(eq(documents.course_name, course_name as string)) // No filter
        .groupBy(documents.id)
        .orderBy(sort_dir === true ? asc(getSortColumn()) : desc(getSortColumn()))
        .limit(to - from + 1)
        .offset(from);
      } catch (error) {
        finalError = error;
      }
    }

    if (finalError) {
      throw finalError;
    }
    if (!foundDocs) {
      throw new Error('Failed to fetch documents')
    }

    let count;
    let countError;

    if (search_key && search_value && typeof search_key === 'string' && search_key in documents){
      // Fetch the total count of documents for the selected course
      try{
        const countQuery = await db
        .select({count: sql<number>`count(distinct ${documents.id})`})
        .from(documents)
        .where(
          and(
            eq(documents.course_name, course_name as string),
            sql`${documents[search_key as keyof typeof documents] as PgColumn<any>} ILIKE ${`%${search_value}%`}`
          )
        );
  
        count = countQuery[0]?.count ?? 0;
        countError = null;
      } catch (error) {
        count = 0;
        countError = error;
      }
    } else {
      // Fetch the total count of documents for the selected course
      try{
        const countQuery = await db
        .select({count: sql<number>`count(distinct ${documents.id})`})
        .from(documents)
        .where(eq(documents.course_name, course_name as string)); // No filter

        count = countQuery[0]?.count ?? 0;
        countError = null;
      } catch (error) {
        count = 0;
        countError = error;
      }
    }

    if (countError) {
      throw countError;
    }

    const final_docs = foundDocs.map((doc) => ({
      ...doc,
      doc_groups: doc.doc_groups || []
    })) as CourseDocument[];

    return res.status(200).json({ final_docs, total_count: count ?? undefined })
  } catch (error) {
    console.error('Failed to fetch documents:', error)
    posthog.capture('fetch_materials_failed', {
      error: (error as any).message,
      course_name: course_name,
    })
    return res.status(500).json({ error: (error as any).message })
  }
}
