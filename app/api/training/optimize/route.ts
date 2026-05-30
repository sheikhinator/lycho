import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/api'
import { optimizeAgentPrompt, testPrompt } from '@/lib/training/training-engine'
import { admin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

const supabaseAdmin = admin()

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const { action } = body

    if (action === 'optimize') {
      const { agentType } = body
      if (!agentType) return NextResponse.json({ error: 'agentType is required' }, { status: 400 })

      const { data: agent } = await supabaseAdmin
        .from('marketplace_agents')
        .select('system_prompt')
        .eq('agent_type', agentType)
        .single()

      const existingPrompt = agent?.system_prompt || ''
      const result = await optimizeAgentPrompt(agentType, existingPrompt as string)
      return NextResponse.json(result)
    }

    if (action === 'test') {
      const { agentType, prompt, testMessages } = body
      if (!agentType || !prompt || !testMessages) {
        return NextResponse.json({ error: 'agentType, prompt, and testMessages are required' }, { status: 400 })
      }
      const results = await testPrompt(agentType, prompt, testMessages)
      return NextResponse.json({ results })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}
