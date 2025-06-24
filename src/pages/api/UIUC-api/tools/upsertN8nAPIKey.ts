import { db } from '~/db/dbClient'
import type { NextApiRequest, NextApiResponse } from 'next';
import { projects } from '~/db/schema'


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { course_name, n8n_api_key } = req.body;
  if (!course_name) {
    return res.status(400).json({ success: false, error: 'course_name is required' });
  }

  try {
    const result = await db
      .insert(projects)
      .values({
        n8n_api_key: n8n_api_key,
        course_name: course_name,
      })
      .onConflictDoUpdate({
        target: [projects.id],
        set: {
          n8n_api_key: n8n_api_key,
        },
      })
    console.log('upsertN8nAPIKey result:', result);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error upserting N8n key to Supabase:', error);
    return res.status(500).json({ success: false, error: error });
  }
}
