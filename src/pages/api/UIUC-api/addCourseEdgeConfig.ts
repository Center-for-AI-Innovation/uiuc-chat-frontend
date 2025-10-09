// export const config = {
//   runtime: 'edge',
// };

// const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {

export async function addEdgeConfigItem(course_name: string): Promise<void> {
  // Docs: https://vercel.com/docs/storage/edge-config/vercel-api#update-your-edge-config-items
  try {
    const edgeConfigVar = process.env.EDGE_CONFIG
    const vercelTeamID = process.env.VERCEL_TEAM_ID
    console.log('edgeConfigVar', edgeConfigVar)
    console.log('vercelTeamID', vercelTeamID)

    const updateEdgeConfig = await fetch(`${edgeConfigVar}/items`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`, // token is built into EDGE_CONFIG
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            operation: 'upsert',
            key: course_name,
            value: true,
          },
        ],
      }),
    })
    const result = await updateEdgeConfig.json()
    console.log(result)
  } catch (error) {
    console.log(error)
  }
}

// import { type AuthenticatedRequest, type NextApiResponse } from 'next'
import { withAuth, AuthenticatedRequest } from '~/utils/authMiddleware'
import axios, { type AxiosResponse } from 'axios'

export const addConfigV2 = async (course_name: string) => {
  try {
    const response: AxiosResponse = await axios.patch(
      `${process.env.EDGE_CONFIG}/items`,
      {
        // params: {
        // course_name: course_name,
        // },
        headers: {
          // Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`, // token is built into EDGE_CONFIG
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              operation: 'upsert',
              key: course_name,
              value: true,
            },
          ],
        }),
      },
    )
    return response.data
    // console.log('fetchContexts things', response.data);
    // return res.status(200).json(response.data)
  } catch (error) {
    console.error(error)
    return []
  }
}
