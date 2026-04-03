import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { registerAgent } from '@/lib/syndicate/syndicate'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const CROSS_SECTOR_ROUTES = [
  ['legal', 'compliance'],
  ['finance', 'tax_agent'],
  ['healthcare', 'compliance'],
  ['sales', 'marketing'],
  ['hr_agent', 'legal'],
  ['logistics', 'operations'],
]

export async function POST(req: NextRequest) {
  if (req.headers.get('x-master-secret') !== process.env.MASTER_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: agents, error } = await supabaseAdmin
    .from('marketplace_agents')
    .select('agent_type, display_name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let registered = 0
  const errors: string[] = []

  for (const agent of agents ?? []) {
    try {
      await registerAgent(agent.agent_type, agent.display_name)
      registered++
    } catch (e: unknown) {
      errors.push(`${agent.agent_type}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  // Cross-sector routes
  let routes_added = 0
  for (const [from_agent, to_agent] of CROSS_SECTOR_ROUTES) {
    const { error: re } = await supabaseAdmin
      .from('syndicate_routes')
      .upsert({ from_agent, to_agent, route_type: 'cross_sector', bidirectional: true, active: true }, { onConflict: 'from_agent,to_agent' })
    if (!re) routes_added++
  }

  return NextResponse.json({ registered, routes_added, total: agents?.length ?? 0, errors })
}
