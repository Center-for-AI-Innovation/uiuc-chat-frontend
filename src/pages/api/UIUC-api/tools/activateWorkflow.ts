// ingest.ts
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { api_key, id, activate } = req.query as {
      api_key: string
      id: string
      activate: string
    }

    // console.log('api_key', api_key)
    console.log('id', id)
    const activateCapitalized =
      activate.charAt(0).toUpperCase() + activate.slice(1)
    console.log('activate', activateCapitalized)

    const response = await fetch(
      `${process.env.RAILWAY_URL}/switch_workflow?id=${id}&api_key=${api_key}&activate=${activateCapitalized}`,
    )
    if (!response.ok) {
      console.log('response not ok', response.text)
      return res.status(response.status).json({ error: response.statusText })
    }
    // This parses and simplifies the nested structure of the data...
    const data = await response.json()
    console.log('response for workflow switch', data)
    if (data.message) {
      return res.status(400).json({ error: data.message })
    }

    return res.status(200).json(data)
    // console.log('Getting to our /ingest endpoint', data);
    // return data;
  } catch (error) {
    return error
  }
}

export default handler
