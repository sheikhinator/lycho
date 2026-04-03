import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/api'
import { transmit, SyndicateMessage } from '@/lib/syndicate/syndicate'

export const dynamic = 'force-dynamic'

// Simple in-memory rate limiter (per tenant, 10/min)
const rlMap = new Map<string, { count: number; reset: number }>()

function checkRateLimit(tenantId: string): boolean {
  const now = Date.now()
  const entry = rlMap.get(tenantId)
  if (!entry || now > entry.reset) {
    rlMap.set(tenantId, { count: 1, reset: now + 60_000 })
    return true
  }
  if (entry.count >= 10) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ctx.tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 403 })

  if (!checkRateLimit(ctx.tenantId)) {
    return NextResponse.json({ error: 'Rate limit exceeded. Max 10 transmissions/minute.' }, { status: 429 })
  }

  let body: { from_agent: string; to_agent: string; message_type: string; payload: Record<string, unknown> }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!body.from_agent || !body.to_agent || !body.message_type) {
    return NextResponse.json({ error: 'from_agent, to_agent, message_type required' }, { status: 400 })
  }

  const result = await transmit({
    ...body,
    message_type: body.message_type as SyndicateMessage['message_type'],
    tenant_id: ctx.tenantId
  })

  return NextResponse.json(result)
}
