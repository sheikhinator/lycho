import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/api'
import { broadcast, SyndicateMessage } from '@/lib/syndicate/syndicate'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ctx.tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 403 })

  let body: { from_agent: string; to_agents: string[]; message_type: string; payload: Record<string, unknown> }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!body.from_agent || !body.to_agents?.length || !body.message_type) {
    return NextResponse.json({ error: 'from_agent, to_agents[], message_type required' }, { status: 400 })
  }

  const results = await broadcast(
    body.from_agent,
    body.to_agents,
    body.message_type as SyndicateMessage['message_type'],
    body.payload || {},
    ctx.tenantId
  )

  return NextResponse.json({ results, total: results.length })
}
