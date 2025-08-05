import { supabase } from '@/utils/supabaseClient'
import { type NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export default async function fetchFailedDocuments(
  req: NextRequest,
  res: NextResponse,
) {
  if (req.method !== 'GET') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  }

  const url = new URL(req.url)
  const fromStr = url.searchParams.get('from')
  const toStr = url.searchParams.get('to')
  const course_name = url.searchParams.get('course_name')
  const search_key = url.searchParams.get('filter_key') as string
  const search_value = url.searchParams.get('filter_value') as string
  let sort_column = url.searchParams.get('sort_column') as string
  let sort_direction = url.searchParams.get('sort_direction') === 'asc'

  if (fromStr === null || toStr === null) {
    throw new Error('Missing required query parameters: from and to')
  }

  if (sort_column == null || sort_direction == null) {
    sort_column = 'created_at'
    sort_direction = false // 'desc' equivalent
  }

  const from = parseInt(fromStr as string)
  const to = parseInt(toStr as string)

  try {
    let failedDocs
    let finalError

    let count
    let countError
    if (search_key && search_value) {
      const { data: someDocs, error } = await supabase
        .from('documents_failed')
        .select(
          'id,course_name,readable_filename,s3_path,url,base_url,created_at,error',
        )
        .match({ course_name: course_name })
        .ilike(search_key, '%' + search_value + '%')
        .order(sort_column, { ascending: sort_direction })
        .range(from, to)

      failedDocs = someDocs
      finalError = error
    } else {
      const { data: someDocs, error } = await supabase
        .from('documents_failed')
        .select(
          'id,course_name,readable_filename,s3_path,url,base_url,created_at,error',
        )
        .match({ course_name: course_name })
        .order(sort_column, { ascending: sort_direction })
        .range(from, to)

      failedDocs = someDocs
      finalError = error
    }

    if (finalError) {
      throw finalError
    }

    if (!failedDocs) {
      throw new Error('Failed to fetch failed documents')
    }

    if (search_key && search_value) {
      const { data: someDocs, error } = await supabase
        .from('documents_failed')
        .select('id', { count: 'exact', head: true })
        .match({ course_name: course_name })
        .ilike(search_key, '%' + search_value + '%')
      count = someDocs
      countError = error
    } else {
      // Fetch the total count of documents for the selected course
      const { count: tmpCount, error: tmpCountError } = await supabase
        .from('documents_failed')
        .select('id', { count: 'exact', head: true })
        .match({ course_name: course_name })
      // NO FILTER
      count = tmpCount
      countError = tmpCountError
    }

    if (countError) {
      throw countError
    }

    // Fetch the count of failed documents from the last 24 hours
    const oneDayAgo = new Date(new Date().getTime() - 24 * 60 * 60 * 1000)
    const { count: recentFailCount, error: recentFailError } = await supabase
      .from('documents_failed')
      .select('id', { count: 'exact', head: true })
      .match({ course_name: course_name })
      .gte('created_at', oneDayAgo.toISOString())

    if (recentFailError) throw recentFailError

    return NextResponse.json(
      {
        final_docs: failedDocs,
        total_count: count,
        recent_fail_count: recentFailCount,
      },
      { status: 200 },
    )
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 })
  }
}
