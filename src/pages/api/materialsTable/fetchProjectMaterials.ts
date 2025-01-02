import { supabase } from '@/utils/supabaseClient'
import { getAuth } from '@clerk/nextjs/server'
import posthog from 'posthog-js'
import { NextApiRequest, NextApiResponse } from 'next'
import { PostgrestError } from '@supabase/supabase-js'
import { CourseDocument } from '~/types/courseMaterials'

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
  res: NextApiResponse<FetchDocumentsResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { from: fromStr, to: toStr, course_name, filter_key: search_key, filter_value: search_value, sort_column: rawSortColumn, sort_direction } = req.query

  let sort_column = rawSortColumn as string
  let sort_dir = sort_direction === 'asc' // Convert 'asc' to true, 'desc' to false

  if (typeof fromStr !== 'string' || typeof toStr !== 'string') {
    return res.status(400).json({ error: 'Missing required query parameters: from and to' })
  }

  if (sort_column == null || sort_dir == null) {
    sort_column = 'created_at'
    sort_dir = false // 'desc' equivalent
  }

  const from = parseInt(fromStr)
  const to = parseInt(toStr)

  try {
    let documents
    let finalError
    if (search_key && search_value) {
      const { data: someDocs, error } = await supabase
        .from('documents')
        .select(
          `
        id,
        course_name,
        readable_filename,
        s3_path,
        url,
        base_url,
        created_at,
        doc_groups (
          name
          )
          `,
        )
        .match({ course_name: course_name })
        .ilike(search_key as string, '%' + search_value + '%') // e.g. readable_filename: 'some string'
        .order(sort_column, { ascending: sort_dir })
        .range(from, to)
      documents = someDocs
      finalError = error
    } else {
      const { data: someDocs, error } = await supabase
        .from('documents')
        .select(
          `
      id,
      course_name,
      readable_filename,
      s3_path,
      url,
      base_url,
      created_at,
      doc_groups (
        name
        )
        `,
        )
        .match({ course_name: course_name })
        // NO FILTER
        .order(sort_column, { ascending: sort_dir })
        .range(from, to)
      documents = someDocs
      finalError = error
    }

    if (finalError) {
      throw finalError
    }

    if (!documents) {
      throw new Error('Failed to fetch documents')
    }

    let count
    let countError
    if (search_key && search_value) {
      // Fetch the total count of documents for the selected course
      const { count: tmpCount, error: tmpCountError } = await supabase
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .match({ course_name: course_name })
        .ilike(search_key as string, '%' + search_value + '%') // e.g. readable_filename: 'some string'
      count = tmpCount
      countError = tmpCountError
    } else {
      // Fetch the total count of documents for the selected course
      const { count: tmpCount, error: tmpCountError } = await supabase
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .match({ course_name: course_name })
      // NO FILTER
      count = tmpCount
      countError = tmpCountError
    }

    if (countError) {
      throw countError
    }

    const final_docs = documents.map((doc) => ({
      ...doc,
      doc_groups: doc.doc_groups.map((group) => group.name),
    })) as CourseDocument[]

    return res.status(200).json({ final_docs, total_count: count ?? undefined })
  } catch (error) {
    console.error('Failed to fetch documents:', error)
    posthog.capture('fetch_materials_failed', {
      error: (error as PostgrestError).message,
      course_name: course_name,
    })
    return res.status(500).json({ error: (error as PostgrestError).message })
  }
}
