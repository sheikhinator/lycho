import { NextResponse } from 'next/server'
import { injectIntelligence } from '@/lib/orion/orion-engine'

const CORE_AGENTS = ['intake', 'research', 'operations', 'client', 'analyst', 'compliance', 'content']

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const secret = request.headers.get('x-master-secret')
  if (!secret || secret !== process.env.MASTER_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = []
  for (const agentType of CORE_AGENTS) {
    try {
      const prompt = await injectIntelligence(agentType, 'PK')
      results.push({ agent: agentType, status: 'initialized', prompt_length: prompt.length })
    } catch(e: unknown) {
      const err = e as Error
      results.push({ agent: agentType, status: 'failed', error: err.message })
    }
  }

  return NextResponse.json({
    success: true,
    initialized: results.filter(r => r.status === 'initialized').length,
    results
  })
}
