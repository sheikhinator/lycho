import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/api'
import { recoverAgent } from '@/lib/heal/heal-engine'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { agentType } = await req.json()
    if (!agentType) {
      return NextResponse.json({ error: 'agentType is required' }, { status: 400 })
    }

    const result = await recoverAgent(agentType)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
