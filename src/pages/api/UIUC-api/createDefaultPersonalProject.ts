import type { NextApiRequest, NextApiResponse } from 'next'
import { redisClient } from '~/utils/redisClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { username, email } = req.body

  if (!username) {
    return res.status(400).json({ error: 'Username is required' })
  }

  const projectName = `${username}-project`
  try {
    try {
      // 1. Get existing course/project names
      const all_course_names = await redisClient.hKeys('course_metadatas')

      // 2. Check if project already exists
      if (all_course_names.includes(projectName)) {
        return res.status(200).json({
          status: 'exists',
          project: projectName,
        })
      }
    } catch (error) {
      console.error(error)
    }

    // 3. If not exist, create it
    const createRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/UIUC-api/createProject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        project_name: projectName,
        project_description: `Default personal project for ${username}`,
        project_owner_email: email,
      }),
    })

    if (!createRes.ok) throw new Error('Failed to create project')

    const createdProject = await createRes.json()

    return res.status(200).json({
      status: 'created',
      project: createdProject.project_name,
    })
  } catch
    (error: any) {
    console.error(error)
    return res.status(500).json({ error: error.message })
  }
}
