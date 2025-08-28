// Compatibility shim: forward old Agent endpoint to the unified routing handler
import { type NextRequest, type NextResponse } from 'next/server'
import { POST as allNewRoutingPOST } from '../../allNewRoutingChat/route'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export async function POST(req: NextRequest, res: NextResponse) {
  return allNewRoutingPOST(req, res)
}

export function GET() {
  return new Response('Method Not Allowed', { status: 405 })
}

export function PUT() {
  return new Response('Method Not Allowed', { status: 405 })
}

export function DELETE() {
  return new Response('Method Not Allowed', { status: 405 })
}

