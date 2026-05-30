import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/api'
import { checkAgentHealth, scanAllAgents } from '@/lib/heal/heal-engine'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const agentType = searchParams.get('agent_type')

    if (agentType) {
      const health = await checkAgentHealth(agentType)
      return NextResponse.json(health)
    }

    const scan = await scanAllAgents()
    return NextResponse.json(scan)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
