import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/api'
import { conveneCouncil } from '@/lib/swarm/swarm-engine'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { query, agentTypes } = await req.json()
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const result = await conveneCouncil(query, ctx.tenantId, agentTypes)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
