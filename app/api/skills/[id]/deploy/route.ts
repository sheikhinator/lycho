import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/api'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ctx.tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 403 })

  const { id } = await params

  const { data: skill } = await supabaseAdmin
    .from('skill_listings').select('*').eq('id', id).eq('status', 'approved').single()
  if (!skill) return NextResponse.json({ error: 'Skill not found' }, { status: 404 })

  const { data: agent, error } = await supabaseAdmin
    .from('agents')
    .insert({
      tenant_id:        ctx.tenantId,
      agent_type:       skill.agent_type,
      display_name:     skill.display_name,
      description:      skill.description,
      system_prompt:    skill.system_prompt,
      status:           'active',
      model_complexity: 'simple',
      source:           'marketplace_skill',
    })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabaseAdmin.from('skill_listings')
    .update({ downloads: ((skill.downloads as number) || 0) + 1 }).eq('id', id)

  return NextResponse.json({ agent, message: 'Skill deployed successfully' })
}
