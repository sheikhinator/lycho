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

  const errors: { agent_type: string; error: string }[] = []
  let seeded = 0
  let failed = 0

  for (const [agent_type, system_prompt] of Object.entries(ALL_AGENTS_PROMPTS)) {
    try {
      const { error } = await supabaseAdmin
        .from('marketplace_agents')
        .upsert({
          agent_type,
          display_name: ALL_AGENTS_META[agent_type]?.display_name ?? agent_type,
          description:  ALL_AGENTS_META[agent_type]?.description ?? '',
          system_prompt,
          model_complexity: 'simple',
          status: 'approved',
        }, { onConflict: 'agent_type' })

      if (error) {
        console.error(`[seed-all] FAILED ${agent_type}:`, error.message, error.details, error.hint)
        errors.push({ agent_type, error: `${error.message} | ${error.details ?? ''} | ${error.hint ?? ''}` })
        failed++
      } else {
        seeded++
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error(`[seed-all] EXCEPTION ${agent_type}:`, msg)
      errors.push({ agent_type, error: msg })
      failed++
    }
  }

  return NextResponse.json({ seeded, failed, total: seeded + failed, errors })
}
