import type { NextApiRequest, NextApiResponse } from 'next'
import type { UIUCTool, Message } from '@/types/chat'

type Batch = {
  batchId: number
  inputs: UIUCTool[]
  outputs: UIUCTool[]
}

const store: Record<string, Batch[]> = {}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { convoId } = req.query as { convoId?: string }
  if (!convoId) return res.status(400).json({ error: 'Missing convoId' })

  if (req.method === 'GET') {
    return res.status(200).json(store[convoId] || [])
  }

  if (req.method === 'POST') {
    const { batchId, inputs, outputs } = req.body as {
      batchId: number
      inputs?: UIUCTool[]
      outputs?: UIUCTool[]
    }
    if (!batchId) return res.status(400).json({ error: 'Missing batchId' })
    if (!store[convoId]) store[convoId] = []
    let batch = store[convoId].find((b) => b.batchId === batchId)
    if (!batch) {
      batch = { batchId, inputs: [], outputs: [] }
      store[convoId].push(batch)
      store[convoId].sort((a, b) => a.batchId - b.batchId)
    }
    if (Array.isArray(inputs) && inputs.length > 0) {
      batch.inputs = [...batch.inputs, ...inputs]
    }
    if (Array.isArray(outputs) && outputs.length > 0) {
      batch.outputs = [...batch.outputs, ...outputs]
    }
    return res.status(200).json(batch)
  }

  if (req.method === 'DELETE') {
    delete store[convoId]
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

