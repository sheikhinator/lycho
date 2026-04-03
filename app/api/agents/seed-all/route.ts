import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ALL_AGENTS_PROMPTS, ALL_AGENTS_META } from '@/lib/agents/all-agents'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  if (req.headers.get('x-master-secret') !== process.env.MASTER_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const errors: string[] = []
  let seeded = 0

  const rows = Object.entries(ALL_AGENTS_PROMPTS).map(([agent_type, system_prompt]) => ({
    agent_type,
    display_name: ALL_AGENTS_META[agent_type]?.display_name ?? agent_type,
    description:  ALL_AGENTS_META[agent_type]?.description ?? '',
    system_prompt,
    model_complexity: 'simple' as const,
    status: 'approved' as const,
  }))

  // Batch upsert in chunks of 50
  for (let i = 0; i < rows.length; i += 50) {
    const { error } = await supabaseAdmin
      .from('marketplace_agents')
      .upsert(rows.slice(i, i + 50), { onConflict: 'agent_type' })
    if (error) errors.push(error.message)
    else seeded += rows.slice(i, i + 50).length
  }

  return NextResponse.json({ seeded, total: rows.length, errors })
}
