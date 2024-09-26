import { ContextWithMetadata } from '~/types/chat'

export const config = {
  runtime: 'edge',
}

export const fetchContexts = async (
  course_name: string,
  search_query: string,
  token_limit = 4000,
  doc_groups: string[] = [],
): Promise<ContextWithMetadata[]> => {
  const requestBody = {
    course_name: course_name,
    search_query: search_query,
    token_limit: token_limit,
    doc_groups: doc_groups,
  }

  // UESFUL FOR TESTING -- SHORTEN CONTEXTS
  // const dummyContexts: ContextWithMetadata[] = [
  //   {
  //     id: 1,
  //     text: 'This is a dummy context',
  //     readable_filename: 'dummy_filename_1.pdf',
  //     course_name: 'dummy course 1',
  //     'course_name ': 'dummy course 1',
  //     s3_path: 'dummy_s3_path_1',
  //     pagenumber: '1',
  //     url: 'dummy_url_1',
  //     base_url: 'dummy_base_url_1',
  //   },
  //   {
  //     id: 2,
  //     text: 'This is another dummy context',
  //     readable_filename: 'dummy_filename_2.pdf',
  //     course_name: 'dummy course 2',
  //     'course_name ': 'dummy course 2',
  //     s3_path: 'dummy_s3_path_2',
  //     pagenumber: '2',
  //     url: 'dummy_url_2',
  //     base_url: 'dummy_base_url_2',
  //   },
  // ]
  // return dummyContexts

  const url = `https://flask-production-751b.up.railway.app/getTopContexts`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      console.error('Failed to fetch contexts. Err status:', response.status)
      throw new Error('Failed to fetch contexts. Err status:' + response.status)
    }
    const data: ContextWithMetadata[] = await response.json()
    return data
  } catch (error) {
    console.error(error)
    return []
  }
}

export default fetchContexts
