import { NextResponse } from 'next/server'
import { injectIntelligence } from '@/lib/orion/orion-engine'

const CORE_AGENTS = ['intake', 'research', 'operations', 'client', 'analyst', 'compliance', 'content']

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const secret = request.headers.get('x-master-secret')
  if (!secret || secret !== process.env.MASTER_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = await Promise.allSettled(
    CORE_AGENTS.map(async (agentType) => {
      const prompt = await injectIntelligence(agentType, 'PK')
      return { agent: agentType, status: 'initialized', prompt_length: prompt.length }
    })
  )

  const mapped = results.map((r, i) =>
    r.status === 'fulfilled'
      ? r.value
      : { agent: CORE_AGENTS[i], status: 'failed', error: (r.reason as Error).message }
  )

  return NextResponse.json({
    success: true,
    initialized: mapped.filter(r => r.status === 'initialized').length,
    results: mapped
  })
}
